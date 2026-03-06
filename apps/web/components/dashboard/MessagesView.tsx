'use client';

import { useState, useEffect, useRef, useCallback, ReactElement } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { MessageSquare, Send, ArrowLeft, Building2, ImageIcon, Search, X, Loader2, Check, CheckCheck, Smile } from 'lucide-react';

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

function Avatar({ name, logo, size = 9 }: { name: string; logo: string | null; size?: number }) {
    const initials = name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
    const sizeClass = `w-${size} h-${size}`;
    return (
        <div className={`${sizeClass} rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center flex-shrink-0 overflow-hidden ring-2 ring-white`}>
            {logo ? (
                <img src={logo} alt={name} className={`${sizeClass} object-cover`} />
            ) : (
                <span className="text-[11px] font-black text-orange-600">{initials}</span>
            )}
        </div>
    );
}

function DateSeparator({ date }: { date: string }) {
    const label = (() => {
        try {
            const d = new Date(date);
            const now = new Date();
            const isToday = d.toDateString() === now.toDateString();
            const yesterday = new Date(now);
            yesterday.setDate(yesterday.getDate() - 1);
            const isYesterday = d.toDateString() === yesterday.toDateString();
            if (isToday) return 'Today';
            if (isYesterday) return 'Yesterday';
            return d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' });
        } catch { return date; }
    })();
    return (
        <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-zinc-100" />
            <span className="text-[11px] font-semibold text-zinc-400 px-2">{label}</span>
            <div className="flex-1 h-px bg-zinc-100" />
        </div>
    );
}

function isSameDay(a: string, b: string) {
    try {
        return new Date(a).toDateString() === new Date(b).toDateString();
    } catch { return false; }
}

function formatMsgTime(dateStr: string) {
    try {
        return new Date(dateStr).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch { return ''; }
}

function formatListTime(dateStr: string) {
    try {
        const d = new Date(dateStr);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'now';
        if (diffMins < 60) return `${diffMins}m`;
        const diffHrs = Math.floor(diffMins / 60);
        if (diffHrs < 24) return `${diffHrs}h`;
        const diffDays = Math.floor(diffHrs / 24);
        if (diffDays < 7) return `${diffDays}d`;
        return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
    } catch { return ''; }
}

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
    const [partnerLogo, setPartnerLogo] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [uploading, setUploading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const pollRef = useRef<NodeJS.Timeout | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const searchParams = useSearchParams();
    const convParam = searchParams.get('conv');

    const scrollToBottom = (smooth = true) => {
        messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' });
    };

    useEffect(() => { scrollToBottom(); }, [messages]);

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
        } catch {} finally { setLoading(false); }
        return [];
    }, [getToken]);

    useEffect(() => {
        fetchContacts().then((contactsList) => {
            if (convParam && contactsList.length > 0) {
                const match = contactsList.find((c: Contact) => c.conversation_id === convParam);
                if (match) openContact(match, contactsList);
            }
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [convParam]);

    const ensureConversation = async (contactId: string): Promise<string | null> => {
        try {
            const token = await getToken();
            const endpoint = myType === 'business'
                ? `${API}/messages/conversations/start/${contactId}`
                : `${API}/messages/conversations/start-with-business/${contactId}`;
            const res = await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) return (await res.json()).conversation_id;
        } catch {}
        return null;
    };

    const openContact = async (contact: Contact, list?: Contact[]) => {
        setActiveContactId(contact.contact_id);
        setPartnerName(contact.contact_name);
        setPartnerLogo(contact.contact_logo);
        setMessages([]);
        setImagePreview(null);
        setImageUrl(null);
        const convId = contact.conversation_id ?? await ensureConversation(contact.contact_id);
        setActiveConvId(convId);
        const base = list ?? contacts;
        setContacts(base.map(c => c.contact_id === contact.contact_id ? { ...c, conversation_id: convId, unread_count: 0 } : c));
        setTimeout(() => inputRef.current?.focus(), 100);
    };

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
                setPartnerName(data.my_type === 'business' ? data.referrer_name : data.business_name);
            }
        } catch {}
    }, [getToken]);

    useEffect(() => {
        if (!activeConvId) return;
        fetchMessages(activeConvId);
        pollRef.current = setInterval(() => fetchMessages(activeConvId), 4000);
        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [activeConvId, fetchMessages]);

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setImagePreview(ev.target?.result as string);
        reader.readAsDataURL(file);
        setUploading(true);
        try {
            const token = await getToken();
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'messages');
            const res = await fetch(`${API}/media/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
            if (res.ok) setImageUrl((await res.json()).url);
            else { setImagePreview(null); }
        } catch { setImagePreview(null); }
        finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
    };

    const clearImage = () => { setImagePreview(null); setImageUrl(null); };

    const handleSend = async () => {
        if ((!newMessage.trim() && !imageUrl) || !activeConvId || sending) return;
        setSending(true);
        const optimisticId = `opt-${Date.now()}`;
        const optimistic: Message = {
            id: optimisticId, sender_type: myType, sender_id: '', body: newMessage.trim(),
            image_url: imageUrl, is_read: false, created_at: new Date().toISOString(), is_mine: true,
        };
        setMessages(prev => [...prev, optimistic]);
        const msgText = newMessage.trim();
        const msgImage = imageUrl;
        setNewMessage('');
        clearImage();
        try {
            const token = await getToken();
            const res = await fetch(`${API}/messages/conversations/${activeConvId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ body: msgText, image_url: msgImage || null }),
            });
            if (res.ok) {
                const msg = await res.json();
                setMessages(prev => prev.map(m => m.id === optimisticId ? { ...msg, is_mine: true } : m));
                fetchContacts();
            } else {
                setMessages(prev => prev.filter(m => m.id !== optimisticId));
            }
        } catch {
            setMessages(prev => prev.filter(m => m.id !== optimisticId));
        } finally { setSending(false); }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    const filteredContacts = contacts.filter(c =>
        c.contact_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const activeContact = contacts.find(c => c.contact_id === activeContactId);
    const totalUnread = contacts.reduce((acc, c) => acc + (c.unread_count || 0), 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-white">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-[3px] border-orange-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-zinc-400 font-medium">Loading messages…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full bg-white overflow-hidden">
            {/* ── LEFT SIDEBAR ── */}
            <div className={`${activeContactId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[300px] lg:w-[340px] border-r border-zinc-100 bg-white`}>

                {/* Sidebar header */}
                <div className="px-5 pt-5 pb-3 border-b border-zinc-100">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-black text-zinc-900">Messages</h2>
                        {totalUnread > 0 && (
                            <span className="bg-orange-500 text-white text-xs font-black rounded-full min-w-[22px] h-[22px] flex items-center justify-center px-1.5">
                                {totalUnread}
                            </span>
                        )}
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300" />
                        <input
                            type="text"
                            placeholder="Search…"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 border border-zinc-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 placeholder:text-zinc-300 transition-all"
                        />
                    </div>
                </div>

                {/* Contact list */}
                <div className="flex-1 overflow-y-auto">
                    {filteredContacts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8 gap-2">
                            <div className="w-14 h-14 bg-zinc-50 rounded-2xl flex items-center justify-center mb-1">
                                <MessageSquare className="w-7 h-7 text-zinc-300" />
                            </div>
                            <p className="text-sm font-bold text-zinc-500">No conversations yet</p>
                            <p className="text-xs text-zinc-300 leading-relaxed">
                                {myType === 'business' ? 'Referrers will appear here once linked' : 'Businesses will appear once you create links'}
                            </p>
                        </div>
                    ) : (
                        <div className="py-2">
                            {filteredContacts.map(contact => {
                                const isActive = activeContactId === contact.contact_id;
                                const hasUnread = contact.unread_count > 0;
                                return (
                                    <button
                                        key={contact.contact_id}
                                        onClick={() => openContact(contact)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150 mx-1 rounded-2xl mb-0.5 ${
                                            isActive ? 'bg-orange-50' : 'hover:bg-zinc-50'
                                        }`}
                                        style={{ width: 'calc(100% - 8px)' }}
                                    >
                                        <div className="relative flex-shrink-0">
                                            <Avatar name={contact.contact_name} logo={contact.contact_logo} size={11} />
                                            {hasUnread && (
                                                <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-orange-500 rounded-full border-2 border-white" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-1">
                                                <span className={`text-[13px] truncate ${hasUnread ? 'font-bold text-zinc-900' : 'font-semibold text-zinc-700'}`}>
                                                    {contact.contact_name}
                                                </span>
                                                <span className="text-[11px] text-zinc-400 flex-shrink-0 whitespace-nowrap">
                                                    {contact.last_message_at ? formatListTime(contact.last_message_at) : ''}
                                                </span>
                                            </div>
                                            <p className={`text-[12px] truncate mt-0.5 ${hasUnread ? 'font-semibold text-zinc-600' : 'text-zinc-400'}`}>
                                                {contact.last_message || 'Say hello 👋'}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ── RIGHT PANEL ── */}
            <div className={`${activeContactId ? 'flex' : 'hidden md:flex'} flex-col flex-1 bg-zinc-50`}>
                {activeContactId && activeContact ? (
                    <>
                        {/* Thread header */}
                        <div className="flex items-center gap-3 px-5 py-3.5 bg-white border-b border-zinc-100 shadow-sm">
                            <button
                                onClick={() => { setActiveContactId(null); setActiveConvId(null); setMessages([]); }}
                                className="md:hidden p-2 hover:bg-zinc-100 rounded-xl transition-colors mr-1"
                            >
                                <ArrowLeft className="w-4 h-4 text-zinc-600" />
                            </button>
                            <Avatar name={partnerName} logo={partnerLogo || activeContact.contact_logo} size={10} />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-black text-zinc-900 truncate">{partnerName}</p>
                                <p className="text-[11px] font-medium text-zinc-400">
                                    {myType === 'business' ? '👤 Referrer' : '🏢 Business'}
                                </p>
                            </div>
                        </div>

                        {/* Messages area */}
                        <div className="flex-1 overflow-y-auto px-4 py-4">
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center">
                                        <MessageSquare className="w-8 h-8 text-zinc-200" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-zinc-500">No messages yet</p>
                                        <p className="text-xs text-zinc-300 mt-1">
                                            Start the conversation with {partnerName.split(' ')[0]}
                                        </p>
                                    </div>
                                </div>
                            ) : (() => {
                                const grouped: ReactElement[] = [];
                                messages.forEach((msg, i) => {
                                    const prev = messages[i - 1];
                                    const next = messages[i + 1];
                                    const showDateSep = !prev || !isSameDay(prev.created_at, msg.created_at);
                                    const isGroupStart = !prev || prev.is_mine !== msg.is_mine || !isSameDay(prev.created_at, msg.created_at);
                                    const isGroupEnd = !next || next.is_mine !== msg.is_mine || !isSameDay(next.created_at, msg.created_at);
                                    const isMine = msg.is_mine;
                                    const isOptimistic = msg.id.startsWith('opt-');

                                    if (showDateSep) {
                                        grouped.push(<DateSeparator key={`sep-${msg.id}`} date={msg.created_at} />);
                                    }

                                    grouped.push(
                                        <div
                                            key={msg.id}
                                            className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'} ${isGroupStart ? 'mt-3' : 'mt-0.5'}`}
                                        >
                                            {/* Their avatar — only on group end */}
                                            {!isMine && (
                                                <div className="w-8 flex-shrink-0 flex items-end">
                                                    {isGroupEnd ? (
                                                        <Avatar name={partnerName} logo={partnerLogo || activeContact.contact_logo} size={8} />
                                                    ) : <div className="w-8" />}
                                                </div>
                                            )}

                                            <div className={`max-w-[72%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                                                {/* Bubble */}
                                                <div className={`relative overflow-hidden transition-opacity duration-200 ${isOptimistic ? 'opacity-70' : 'opacity-100'} ${
                                                    isMine
                                                        ? `bg-orange-500 text-white ${isGroupStart ? 'rounded-t-2xl' : 'rounded-t-lg'} ${isGroupEnd ? 'rounded-bl-2xl rounded-br-md' : 'rounded-b-lg'}`
                                                        : `bg-white text-zinc-800 shadow-sm ${isGroupStart ? 'rounded-t-2xl' : 'rounded-t-lg'} ${isGroupEnd ? 'rounded-br-2xl rounded-bl-md' : 'rounded-b-lg'}`
                                                } rounded-2xl`}>
                                                    {msg.image_url && (
                                                        <a href={msg.image_url} target="_blank" rel="noopener noreferrer" className="block">
                                                            <img src={msg.image_url} alt="Shared image" className="max-w-full max-h-64 object-cover" />
                                                        </a>
                                                    )}
                                                    {msg.body && (
                                                        <p className="px-4 py-2.5 text-[13.5px] leading-relaxed whitespace-pre-wrap">{msg.body}</p>
                                                    )}
                                                </div>

                                                {/* Time + read receipt — only on group end */}
                                                {isGroupEnd && (
                                                    <div className={`flex items-center gap-1 mt-1 px-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                        <span className="text-[10px] text-zinc-400">{formatMsgTime(msg.created_at)}</span>
                                                        {isMine && (
                                                            msg.is_read
                                                                ? <CheckCheck className="w-3 h-3 text-orange-500" />
                                                                : <Check className="w-3 h-3 text-zinc-300" />
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* My avatar — only on group end */}
                                            {isMine && (
                                                <div className="w-8 flex-shrink-0 flex items-end">
                                                    {isGroupEnd ? (
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center ring-2 ring-white">
                                                            <span className="text-white text-[10px] font-black">ME</span>
                                                        </div>
                                                    ) : <div className="w-8" />}
                                                </div>
                                            )}
                                        </div>
                                    );
                                });
                                return grouped;
                            })()}
                            <div ref={messagesEndRef} className="h-2" />
                        </div>

                        {/* Image preview */}
                        {imagePreview && (
                            <div className="px-4 pt-3 bg-white border-t border-zinc-100">
                                <div className="relative inline-block">
                                    <img src={imagePreview} alt="Preview" className="h-20 rounded-xl object-cover border border-zinc-200" />
                                    {uploading && (
                                        <div className="absolute inset-0 bg-white/80 rounded-xl flex items-center justify-center">
                                            <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                                        </div>
                                    )}
                                    <button onClick={clearImage} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-zinc-800 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-colors shadow">
                                        <X className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Input bar */}
                        <div className="px-4 py-3 bg-white border-t border-zinc-100">
                            <div className="flex items-end gap-2 bg-zinc-50 border border-zinc-200 rounded-2xl px-3 py-2 focus-within:border-orange-300 focus-within:ring-2 focus-within:ring-orange-500/10 transition-all">
                                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleImageSelect} />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="p-1.5 text-zinc-400 hover:text-orange-500 rounded-xl transition-colors flex-shrink-0 self-end mb-0.5"
                                    title="Attach image"
                                >
                                    <ImageIcon className="w-[18px] h-[18px]" />
                                </button>
                                <textarea
                                    ref={inputRef}
                                    value={newMessage}
                                    onChange={e => {
                                        setNewMessage(e.target.value);
                                        e.target.style.height = 'auto';
                                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                                    }}
                                    onKeyDown={handleKeyDown}
                                    placeholder={`Message ${partnerName.split(' ')[0]}…`}
                                    rows={1}
                                    className="flex-1 bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none resize-none leading-relaxed py-1 max-h-[120px]"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={(!newMessage.trim() && !imageUrl) || sending || uploading}
                                    className="flex-shrink-0 self-end mb-0.5 w-8 h-8 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-200 text-white disabled:text-zinc-400 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-95"
                                >
                                    {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                            <p className="text-[10px] text-zinc-300 mt-1.5 text-center">Press Enter to send · Shift+Enter for new line</p>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 gap-4">
                        <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center">
                            <MessageSquare className="w-10 h-10 text-zinc-200" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-zinc-400">Your messages</h3>
                            <p className="text-sm text-zinc-300 mt-1 max-w-[200px] leading-relaxed">
                                Select a conversation from the left to start chatting
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
