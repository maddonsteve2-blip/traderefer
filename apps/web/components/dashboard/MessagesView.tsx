'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { MessageSquare, Send, ArrowLeft, User, Building2, ImageIcon, Search, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Contact {
    contact_id: string;
    contact_name: string;
    contact_logo: string | null;
    conversation_id: string | null;
    last_message: string | null;
    last_sender_type: string | null;
    last_message_at: string | null;
    linked_since: string | null;
    unread_count: number;
}

interface Message {
    id: string;
    sender_type: string;
    sender_id: string;
    body: string;
    image_url: string | null;
    is_read: boolean;
    created_at: string;
    is_mine: boolean;
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function MessagesView() {
    const { getToken } = useAuth();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [activeContactId, setActiveContactId] = useState<string | null>(null);
    const [activeConvId, setActiveConvId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [myType, setMyType] = useState<string>('business');
    const [partnerName, setPartnerName] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [uploading, setUploading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const pollRef = useRef<NodeJS.Timeout | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const searchParams = useSearchParams();
    const convParam = searchParams.get('conv');

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Fetch contacts
    const fetchContacts = useCallback(async () => {
        try {
            const token = await getToken();
            const res = await fetch(`${API}/messages/contacts`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setContacts(data.contacts);
                setMyType(data.my_type);
                return data.contacts as Contact[];
            }
        } catch {} finally {
            setLoading(false);
        }
        return [];
    }, [getToken]);

    useEffect(() => {
        fetchContacts().then((contactsList) => {
            if (convParam && contactsList.length > 0) {
                const match = contactsList.find((c: Contact) => c.conversation_id === convParam);
                if (match) {
                    setActiveContactId(match.contact_id);
                    setActiveConvId(match.conversation_id);
                    setPartnerName(match.contact_name);
                }
            }
        });
    }, [convParam, fetchContacts]);

    // Ensure/create conversation for a contact
    const ensureConversation = async (contactId: string): Promise<string | null> => {
        try {
            const token = await getToken();
            const endpoint = myType === 'business'
                ? `${API}/messages/conversations/start/${contactId}`
                : `${API}/messages/conversations/start-with-business/${contactId}`;
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                return data.conversation_id;
            }
        } catch {}
        return null;
    };

    const selectContact = async (contact: Contact) => {
        setActiveContactId(contact.contact_id);
        setPartnerName(contact.contact_name);
        setMessages([]);
        setImagePreview(null);
        setImageUrl(null);

        if (contact.conversation_id) {
            setActiveConvId(contact.conversation_id);
        } else {
            // Create conversation on first click
            const convId = await ensureConversation(contact.contact_id);
            setActiveConvId(convId);
            // Update the contact in local state
            setContacts(prev => prev.map(c =>
                c.contact_id === contact.contact_id ? { ...c, conversation_id: convId } : c
            ));
        }
    };

    // Fetch messages for active conversation + poll
    const fetchMessages = useCallback(async (convId: string) => {
        try {
            const token = await getToken();
            const res = await fetch(`${API}/messages/conversations/${convId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages);
                setMyType(data.my_type);
                setPartnerName(
                    data.my_type === 'business' ? data.referrer_name : data.business_name
                );
            }
        } catch {}
    }, [getToken]);

    useEffect(() => {
        if (activeConvId) {
            fetchMessages(activeConvId);
            pollRef.current = setInterval(() => fetchMessages(activeConvId), 5000);
        }
        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [activeConvId, fetchMessages]);

    // Image upload
    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Preview
        const reader = new FileReader();
        reader.onload = (ev) => setImagePreview(ev.target?.result as string);
        reader.readAsDataURL(file);

        // Upload
        setUploading(true);
        try {
            const token = await getToken();
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'messages');
            const res = await fetch(`${API}/media/upload`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            if (res.ok) {
                const data = await res.json();
                setImageUrl(data.url);
            } else {
                setImagePreview(null);
                alert('Failed to upload image');
            }
        } catch {
            setImagePreview(null);
            alert('Failed to upload image');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const clearImage = () => {
        setImagePreview(null);
        setImageUrl(null);
    };

    const handleSend = async () => {
        if ((!newMessage.trim() && !imageUrl) || !activeConvId) return;
        setSending(true);
        try {
            const token = await getToken();
            const res = await fetch(`${API}/messages/conversations/${activeConvId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    body: newMessage.trim(),
                    image_url: imageUrl || null,
                }),
            });
            if (res.ok) {
                const msg = await res.json();
                setMessages(prev => [...prev, msg]);
                setNewMessage('');
                clearImage();
                fetchContacts();
            }
        } catch {} finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const formatTime = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            const now = new Date();
            const diffMs = now.getTime() - d.getTime();
            const diffMins = Math.floor(diffMs / 60000);
            if (diffMins < 1) return 'Just now';
            if (diffMins < 60) return `${diffMins}m ago`;
            const diffHrs = Math.floor(diffMins / 60);
            if (diffHrs < 24) return `${diffHrs}h ago`;
            const diffDays = Math.floor(diffHrs / 24);
            if (diffDays < 7) return `${diffDays}d ago`;
            return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
        } catch {
            return '';
        }
    };

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleDateString('en-AU', {
                day: 'numeric', month: 'short', year: 'numeric',
            });
        } catch { return ''; }
    };

    const filteredContacts = contacts.filter(c =>
        c.contact_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-white">
                <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full" />
            </div>
        );
    }

    const activeContact = contacts.find(c => c.contact_id === activeContactId);

    return (
        <div className="flex h-full bg-white overflow-hidden border-t border-zinc-200">
            {/* Contact List — Left Sidebar */}
            <div className={`${activeContactId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[320px] lg:w-[360px] border-r border-zinc-200 bg-white`}>
                {/* Search */}
                <div className="px-4 py-3 border-b border-zinc-200">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                        <input
                            type="text"
                            placeholder="Search messages"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 placeholder:text-zinc-400"
                        />
                    </div>
                </div>
                {/* Contact list */}
                <div className="flex-1 overflow-y-auto">
                    {filteredContacts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8">
                            <MessageSquare className="w-10 h-10 text-zinc-200 mb-3" />
                            <p className="text-zinc-400 text-sm font-medium">No contacts yet</p>
                            <p className="text-zinc-300 text-xs mt-1">
                                {myType === 'business'
                                    ? 'Referrers will appear here once linked'
                                    : 'Businesses will appear once you create links'}
                            </p>
                        </div>
                    ) : (
                        filteredContacts.map(contact => {
                            const isActive = activeContactId === contact.contact_id;
                            const initials = contact.contact_name
                                ?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
                            return (
                                <button
                                    key={contact.contact_id}
                                    onClick={() => selectContact(contact)}
                                    className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors border-b border-zinc-100 ${
                                        isActive
                                            ? 'bg-orange-50 border-l-[3px] border-l-orange-500'
                                            : 'hover:bg-zinc-50 border-l-[3px] border-l-transparent'
                                    }`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                        {contact.contact_logo ? (
                                            <img src={contact.contact_logo} alt="" className="w-10 h-10 rounded-full object-cover" />
                                        ) : myType === 'referrer' ? (
                                            <Building2 className="w-4 h-4 text-zinc-400" />
                                        ) : (
                                            <span className="text-[11px] font-bold text-zinc-400">{initials}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className={`text-[13px] truncate ${contact.unread_count > 0 ? 'font-bold text-zinc-900' : 'font-medium text-zinc-700'}`}>
                                                {contact.contact_name}
                                            </span>
                                            <span className="text-[11px] text-zinc-400 flex-shrink-0 whitespace-nowrap">
                                                {contact.last_message_at
                                                    ? formatTime(contact.last_message_at)
                                                    : contact.linked_since
                                                        ? formatDate(contact.linked_since)
                                                        : ''}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between mt-0.5 gap-2">
                                            <p className={`text-[12px] truncate ${contact.unread_count > 0 ? 'font-medium text-zinc-600' : 'text-zinc-400'}`}>
                                                {contact.last_message || 'No messages yet — say hello!'}
                                            </p>
                                            {contact.unread_count > 0 && (
                                                <span className="bg-orange-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center flex-shrink-0 px-1">
                                                    {contact.unread_count}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Message Thread — Right Panel */}
            <div className={`${activeContactId ? 'flex' : 'hidden md:flex'} flex-col flex-1 bg-white`}>
                {activeContactId && activeContact ? (
                    <>
                        {/* Header */}
                        <div className="flex items-center gap-3 px-5 py-3 border-b border-zinc-200">
                            <button
                                onClick={() => { setActiveContactId(null); setActiveConvId(null); }}
                                className="md:hidden p-1 hover:bg-zinc-100 rounded-lg mr-1"
                            >
                                <ArrowLeft className="w-5 h-5 text-zinc-500" />
                            </button>
                            <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                                {activeContact.contact_logo ? (
                                    <img src={activeContact.contact_logo} alt="" className="w-9 h-9 rounded-full object-cover" />
                                ) : myType === 'business' ? (
                                    <User className="w-4 h-4 text-zinc-400" />
                                ) : (
                                    <Building2 className="w-4 h-4 text-zinc-400" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-zinc-900 truncate">{partnerName}</p>
                                <p className="text-[11px] text-zinc-400">
                                    {myType === 'business' ? 'Referrer' : 'Business'}
                                </p>
                            </div>
                        </div>

                        {/* Messages area */}
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <MessageSquare className="w-10 h-10 text-zinc-200 mb-3" />
                                    <p className="text-zinc-400 text-sm font-medium">No messages yet</p>
                                    <p className="text-zinc-300 text-xs mt-1">Send a message to start the conversation</p>
                                </div>
                            ) : (
                                messages.map(msg => {
                                    const isMine = msg.is_mine;
                                    return (
                                        <div key={msg.id} className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                            {!isMine && (
                                                <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0 overflow-hidden mb-5">
                                                    {activeContact.contact_logo ? (
                                                        <img src={activeContact.contact_logo} alt="" className="w-8 h-8 rounded-full object-cover" />
                                                    ) : (
                                                        <User className="w-3.5 h-3.5 text-zinc-400" />
                                                    )}
                                                </div>
                                            )}
                                            <div className={`max-w-[65%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                                                {!isMine && (
                                                    <div className="flex items-center gap-2 mb-1 px-1">
                                                        <span className="text-xs font-semibold text-zinc-500">{partnerName}</span>
                                                        <span className="text-[10px] text-zinc-400">{formatTime(msg.created_at)}</span>
                                                    </div>
                                                )}
                                                <div className={`rounded-2xl overflow-hidden ${
                                                    isMine
                                                        ? 'bg-orange-500 text-white rounded-br-sm'
                                                        : 'bg-zinc-100 text-zinc-800 rounded-bl-sm'
                                                }`}>
                                                    {msg.image_url && (
                                                        <a href={msg.image_url} target="_blank" rel="noopener noreferrer" className="block">
                                                            <img
                                                                src={msg.image_url}
                                                                alt="Shared image"
                                                                className="max-w-full max-h-60 object-cover cursor-pointer"
                                                            />
                                                        </a>
                                                    )}
                                                    {msg.body && (
                                                        <p className="px-3.5 py-2 text-[13px] leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                                                    )}
                                                </div>
                                                {isMine && (
                                                    <span className="text-[10px] text-zinc-400 mt-1 px-1">{formatTime(msg.created_at)}</span>
                                                )}
                                            </div>
                                            {isMine && (
                                                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 overflow-hidden mb-5">
                                                    <User className="w-3.5 h-3.5 text-orange-500" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Image Preview */}
                        {imagePreview && (
                            <div className="px-5 pt-3 bg-white border-t border-zinc-100">
                                <div className="relative inline-block">
                                    <img src={imagePreview} alt="Preview" className="h-20 rounded-lg object-cover border border-zinc-200" />
                                    {uploading && (
                                        <div className="absolute inset-0 bg-white/70 rounded-lg flex items-center justify-center">
                                            <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                                        </div>
                                    )}
                                    <button
                                        onClick={clearImage}
                                        className="absolute -top-2 -right-2 w-5 h-5 bg-zinc-700 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Input bar */}
                        <div className="px-5 py-3 border-t border-zinc-200 bg-white">
                            <div className="flex items-center gap-2">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    className="hidden"
                                    onChange={handleImageSelect}
                                />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="p-2 text-zinc-400 hover:text-orange-500 rounded-lg transition-colors flex-shrink-0"
                                    title="Attach image"
                                >
                                    <ImageIcon className="w-5 h-5" />
                                </button>
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={e => setNewMessage(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={`Send ${partnerName.split(' ')[0]} a private message`}
                                    className="flex-1 px-4 py-2.5 bg-white border border-zinc-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 placeholder:text-zinc-400"
                                />
                                <span className="text-xs text-zinc-400 flex-shrink-0">{1500 - newMessage.length}</span>
                                <Button
                                    onClick={handleSend}
                                    disabled={(!newMessage.trim() && !imageUrl) || sending || uploading}
                                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-full w-10 h-10 p-0 flex-shrink-0 disabled:opacity-30"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <MessageSquare className="w-14 h-14 text-zinc-200 mb-4" />
                        <h3 className="text-lg font-bold text-zinc-300">Select a conversation</h3>
                        <p className="text-zinc-300 text-sm mt-1">Choose someone from the left to start messaging</p>
                    </div>
                )}
            </div>
        </div>
    );
}
