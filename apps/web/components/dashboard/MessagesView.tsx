'use client';

import { useState, useEffect, useRef, useCallback, ReactElement } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { MessageSquare, Send, ArrowLeft, Building2, Search, X, Loader2, Check, CheckCheck, ShieldCheck, Paperclip, ExternalLink, Users, ChevronRight } from 'lucide-react';

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

const API = '/api/backend';

function Avatar({ name, logo, size = 9 }: { name: string; logo: string | null; size?: number }) {
    const initials = name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';
    
    // Explicit mappings for tailwind classes to ensure they are bundled
    const sizeClasses: Record<number, string> = {
        8: 'w-8 h-8',
        9: 'w-9 h-9',
        10: 'w-10 h-10',
        11: 'w-11 h-11',
        12: 'w-12 h-12',
        14: 'w-14 h-14',
        16: 'w-16 h-16'
    };
    
    const sizeClass = sizeClasses[size] || 'w-9 h-9';
    
    return (
        <div className={`${sizeClass} rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center flex-shrink-0 overflow-hidden ring-2 ring-white shadow-sm`}>
            {logo ? (
                <img src={logo} alt={name} className={`${sizeClass} object-cover`} />
            ) : (
                <span className="text-[11px] font-black text-orange-600 tracking-tighter">{initials}</span>
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
            <span className="text-xs font-bold text-zinc-400 px-2">{label}</span>
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
    const wsRef = useRef<WebSocket | null>(null);
    const pingRef = useRef<NodeJS.Timeout | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const searchParams = useSearchParams();
    const convParam = searchParams.get('conv');

    // Derive WebSocket base URL from the API route
    const getWsUrl = useCallback((convId: string, token: string) => {
        // The Next.js API proxy is at /api/backend → strip that prefix for WS
        const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
        const wsBase = apiBase.replace(/^http/, 'ws');
        return `${wsBase}/messages/ws/${convId}?token=${encodeURIComponent(token)}`;
    }, []);

    // Connect (or reconnect) to the WebSocket for a conversation
    const connectWs = useCallback(async (convId: string) => {
        // Tear down any existing connection
        if (wsRef.current) {
            wsRef.current.onclose = null;
            wsRef.current.close();
            wsRef.current = null;
        }
        if (pingRef.current) clearInterval(pingRef.current);

        const token = await getToken();
        if (!token) return;

        const url = getWsUrl(convId, token);
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
            // Start heartbeat to keep the connection alive
            pingRef.current = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({ type: 'ping' }));
                }
            }, 30_000);
        };

        ws.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                if (payload.type === 'message') {
                    const msg: Message = payload.data;
                    setMessages(prev => {
                        // Avoid duplicates (optimistic messages get replaced by actual)
                        const exists = prev.some(m => m.id === msg.id);
                        if (exists) return prev;
                        return [...prev, msg];
                    });
                    // Update contact list preview
                    setContacts(prev => prev.map(c =>
                        c.conversation_id === convId
                            ? { ...c, last_message: msg.body || '📷 Image', last_message_at: msg.created_at, unread_count: c.unread_count + 1 }
                            : c
                    ));
                }
            } catch {}
        };

        ws.onerror = () => {
            // Silently fail — messages still work via POST
        };

        ws.onclose = (e) => {
            if (pingRef.current) clearInterval(pingRef.current);
            // Auto-reconnect after 3s if the close wasn't intentional (code 1000 = normal)
            if (e.code !== 1000 && wsRef.current === ws) {
                setTimeout(() => connectWs(convId), 3000);
            }
        };
    }, [getToken, getWsUrl]);

    // Disconnect WebSocket on unmount
    useEffect(() => {
        return () => {
            if (wsRef.current) {
                wsRef.current.onclose = null;
                wsRef.current.close(1000, 'unmount');
            }
            if (pingRef.current) clearInterval(pingRef.current);
        };
    }, []);


    // Better scroll to bottom with intersection detection
    const scrollToBottom = useCallback((smooth = true) => {
        if (scrollContainerRef.current) {
            const { scrollHeight, clientHeight } = scrollContainerRef.current;
            scrollContainerRef.current.scrollTo({
                top: scrollHeight - clientHeight,
                behavior: smooth ? 'smooth' : 'instant'
            });
        }
    }, []);

    const lastMsgIdRef = useRef<string | null>(null);

    // Prevent body scroll on mobile when chat is open
    useEffect(() => {
        if (activeConvId && window.innerWidth < 1024) {
            document.body.style.overflow = 'hidden';
            document.body.style.overscrollBehavior = 'none';
        } else {
            document.body.style.overflow = '';
            document.body.style.overscrollBehavior = '';
        }
        return () => {
            document.body.style.overflow = '';
            document.body.style.overscrollBehavior = '';
        };
    }, [activeConvId]);

    // Scroll when messages change - only if last message is new
    useEffect(() => { 
        if (messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg.id !== lastMsgIdRef.current) {
                lastMsgIdRef.current = lastMsg.id;
                const timer = setTimeout(() => scrollToBottom(messages.length > 1), 50);
                return () => clearTimeout(timer);
            }
        }
    }, [messages, scrollToBottom]);

    // Handle mobile keyboard viewport issues & scroll anchoring
    useEffect(() => {
        if (!activeConvId) return;
        const handleResize = () => scrollToBottom(false);
        visualViewport?.addEventListener('resize', handleResize);
        visualViewport?.addEventListener('scroll', handleResize);
        return () => {
            visualViewport?.removeEventListener('resize', handleResize);
            visualViewport?.removeEventListener('scroll', handleResize);
        };
    }, [activeConvId, scrollToBottom]);

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
        // 1. Fetch all existing messages (initial load)
        fetchMessages(activeConvId);
        // 2. Open WebSocket for real-time updates
        connectWs(activeConvId);
        return () => {
            // Disconnect when conversation changes
            if (wsRef.current) {
                wsRef.current.onclose = null;
                wsRef.current.close(1000, 'conversation_changed');
                wsRef.current = null;
            }
            if (pingRef.current) clearInterval(pingRef.current);
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeConvId]);


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
            <div className="flex items-center justify-center h-full w-full bg-white">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-[3px] border-orange-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-zinc-400 font-bold text-xl">Loading messages…</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`fixed inset-0 lg:relative flex h-[100dvh] lg:h-full bg-white overflow-hidden overscroll-none ${activeContactId ? 'z-[60]' : 'z-0'} lg:z-auto`}>
            {/* ── LEFT SIDEBAR ── */}
            <div className={`${activeContactId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[300px] lg:w-[340px] bg-gray-100`}>

                {/* Sidebar header */}
                <div className="px-5 pt-4 pb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-3xl md:text-[28px] font-black text-zinc-900 leading-tight">Messages</h2>
                        {totalUnread > 0 && (
                            <span className="bg-orange-500 text-white font-black rounded-full min-w-[24px] h-[24px] flex items-center justify-center px-1.5 text-[10px] md:text-xs">
                                {totalUnread}
                            </span>
                        )}
                    </div>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Find partner..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 h-[52px] bg-white border border-zinc-200 rounded-2xl focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none placeholder:text-zinc-400 text-zinc-900 font-bold text-[15px] shadow-sm transition-all"
                        />
                    </div>
                </div>

                {/* Contact list */}
                <div className="flex-1 overflow-y-auto">
                    {filteredContacts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-4">
                            <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center">
                                <Users className="w-8 h-8 text-orange-400" />
                            </div>
                            <div>
                                <p className="font-black text-zinc-700 text-xl">No conversations yet</p>
                                <p className="text-zinc-400 font-medium mt-1 leading-snug text-xl">
                                    {myType === 'business' ? 'Referrers will appear here once linked.' : 'Find businesses to start messaging.'}
                                </p>
                            </div>
                            {myType !== 'business' && (
                                <Link
                                    href="/dashboard/referrer/businesses"
                                    className="flex items-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold transition-colors text-lg"
                                >
                                    <Building2 className="w-4 h-4" /> Browse Businesses
                                </Link>
                            )}
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
                                        className={`w-full flex items-center gap-3 px-4 py-4 text-left transition-all duration-150 mx-1 mb-2 ${
                                            isActive 
                                                ? 'bg-orange-50 border border-orange-200 rounded-[20px]' 
                                                : 'bg-white border border-zinc-200 rounded-[20px]'
                                        }`}
                                        style={{ width: 'calc(100% - 8px)' }}
                                    >
                                        <div className="relative flex-shrink-0">
                                            <Avatar name={contact.contact_name} logo={contact.contact_logo} size={12} />
                                            {hasUnread && (
                                                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-orange-500 rounded-full border-2 border-white" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-1 mb-0.5">
                                                <span className={`truncate font-black ${isActive ? 'text-orange-600' : hasUnread ? 'text-zinc-900' : 'text-zinc-800'} text-lg md:text-xl`}>
                                                    {contact.contact_name}
                                                </span>
                                                <span className="text-zinc-400 flex-shrink-0 whitespace-nowrap font-medium text-[10px] md:text-sm uppercase tracking-wider">
                                                    {contact.last_message_at ? formatListTime(contact.last_message_at) : ''}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <ShieldCheck className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                                                <p className={`truncate font-medium ${hasUnread ? 'text-zinc-700 font-semibold' : 'text-zinc-400'} text-base md:text-lg`}>
                                                    {contact.last_message || 'Verified Trade Partner'}
                                                </p>
                                            </div>
                                        </div>
                                        {hasUnread && (
                                            <span className="bg-orange-500 text-white font-black rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1 flex-shrink-0 text-xs">
                                                {contact.unread_count}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ── RIGHT PANEL ── */}
            <div className={`${activeContactId ? 'flex' : 'hidden md:flex'} flex-col flex-1 bg-white min-h-0`}>

                {/* ── Thread header (conditional) ── */}
                {activeContactId && activeContact ? (
                    <div className="flex items-center gap-3 px-5 py-3 bg-white border-b border-zinc-100 shadow-sm flex-shrink-0">
                        <button
                            onClick={() => { setActiveContactId(null); setActiveConvId(null); setMessages([]); }}
                            className="md:hidden p-2 hover:bg-zinc-100 rounded-xl transition-colors mr-1"
                        >
                            <ArrowLeft className="w-5 h-5 text-zinc-600" />
                        </button>
                        <Avatar name={partnerName} logo={partnerLogo || activeContact.contact_logo} size={11} />
                        <div className="flex-1 min-w-0">
                            <p className="font-black text-zinc-900 truncate text-[22px]">{partnerName}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="flex items-center gap-1 text-green-600 font-bold text-sm">
                                    <ShieldCheck className="w-3.5 h-3.5" /> Verified Partner
                                </span>
                                {activeContact.linked_since && (
                                    <>
                                        <span className="text-zinc-200">·</span>
                                        <span className="text-zinc-400 font-medium text-sm">
                                            Linked {new Date(activeContact.linked_since).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                        {myType !== 'business' && (
                            <Link
                                href="/dashboard/referrer/businesses"
                                className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-zinc-50 hover:bg-orange-50 border border-zinc-200 hover:border-orange-300 rounded-xl font-bold text-zinc-600 hover:text-orange-600 transition-all text-base"
                            >
                                <ExternalLink className="w-3.5 h-3.5" /> View Profile
                            </Link>
                        )}
                    </div>
                ) : null}

                {/* ── Scrollable content area ── */}
                <div 
                    ref={scrollContainerRef}
                    className="flex-1 overflow-y-auto min-h-0 bg-zinc-50/50 scroll-smooth touch-pan-y overscroll-contain"
                    style={{ overflowAnchor: 'none' }}
                >
                    {activeContactId && activeContact ? (
                        <div className="px-4 py-4">
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-16">
                                    <div className="w-20 h-20 bg-orange-50 rounded-3xl flex items-center justify-center">
                                        <MessageSquare className="w-10 h-10 text-orange-300" />
                                    </div>
                                    <div>
                                        <p className="font-black text-zinc-700 text-[22px]">Start the conversation</p>
                                        <p className="text-zinc-400 font-medium mt-1 text-[19px]">
                                            Send a message to {partnerName.split(' ')[0]} — quote requests, job updates, anything.
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
                                                        <p className="px-4 py-3 leading-relaxed whitespace-pre-wrap text-xl">{msg.body}</p>
                                                    )}
                                                </div>

                                                {/* Time + read receipt — only on group end */}
                                                {isGroupEnd && (
                                                    <div className={`flex items-center gap-1 mt-1 px-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                        <span className="text-xs text-zinc-400 font-medium">{formatMsgTime(msg.created_at)}</span>
                                                        {isMine && (
                                                            msg.is_read
                                                                ? <CheckCheck className="w-3.5 h-3.5 text-orange-500" />
                                                                : <Check className="w-3.5 h-3.5 text-zinc-300" />
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
                            <div className="h-4" />
                        </div>
                    ) : (
                        /* Empty state — no conversation selected */
                        <div className="flex flex-col items-center justify-center h-full text-center p-8 gap-5">
                            <div className="w-24 h-24 bg-orange-50 rounded-3xl flex items-center justify-center shadow-sm">
                                <MessageSquare className="w-12 h-12 text-orange-300" />
                            </div>
                            <div className="max-w-sm">
                                <h3 className="font-black text-zinc-800 text-[26px]">Business Communications Hub</h3>
                                <p className="text-zinc-400 font-medium mt-2 leading-snug text-xl">
                                    {contacts.length > 0
                                        ? 'Select a conversation from your Trades Team to get started.'
                                        : 'Start messaging your trade partners — quote requests, job updates, and more.'}
                                </p>
                            </div>
                            {contacts.length > 0 ? (
                                <div className="flex items-center gap-2 text-zinc-400 font-bold text-lg">
                                    <ArrowLeft className="w-4 h-4" /> Pick a conversation from the sidebar
                                </div>
                            ) : (
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <Link
                                        href="/dashboard/referrer/businesses"
                                        className="flex items-center gap-2 px-6 py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold transition-colors text-xl"
                                    >
                                        <Building2 className="w-5 h-5" /> Explore Businesses
                                    </Link>
                                    <Link
                                        href="/dashboard/referrer"
                                        className="flex items-center gap-2 px-6 py-3.5 bg-white border-2 border-zinc-200 hover:border-orange-300 text-zinc-700 hover:text-orange-600 rounded-2xl font-bold transition-colors text-xl"
                                    >
                                        <ChevronRight className="w-5 h-5" /> Back to Dashboard
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── Image preview (active conversation only) ── */}
                {activeContactId && imagePreview && (
                    <div className="px-4 pt-3 bg-white border-t border-gray-200 flex-shrink-0">
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

                {/* ── Input bar ── */}
                <div className="px-4 py-4 lg:py-6 bg-white border-t border-zinc-100 flex-shrink-0 z-10 pb-safe">
                    {activeContactId ? (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-end gap-2 bg-zinc-100 rounded-[24px] px-3 py-2.5 focus-within:bg-white focus-within:ring-4 focus-within:ring-orange-500/10 focus-within:border-orange-500 border border-transparent transition-all">
                                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleImageSelect} />
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="flex items-center justify-center w-11 h-11 text-zinc-500 hover:text-orange-500 hover:bg-white rounded-xl transition-all flex-shrink-0 mb-0.5"
                                    title="Attach photo"
                                >
                                    <Paperclip className="w-6 h-6" />
                                </button>
                                <textarea
                                    ref={inputRef}
                                    value={newMessage}
                                    onChange={e => {
                                        setNewMessage(e.target.value);
                                        e.target.style.height = 'auto';
                                        e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
                                    }}
                                    onKeyDown={handleKeyDown}
                                    onFocus={() => setTimeout(() => scrollToBottom(false), 300)}
                                    placeholder={`Message ${partnerName.split(' ')[0] || 'Partner'}…`}
                                    rows={1}
                                    className="flex-1 bg-transparent text-zinc-900 placeholder:text-zinc-400 focus:outline-none resize-none leading-relaxed py-2.5 max-h-[150px] text-lg lg:text-xl font-medium"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={(!newMessage.trim() && !imageUrl) || sending || uploading}
                                    className="flex-shrink-0 w-11 h-11 bg-orange-500 hover:bg-orange-600 disabled:bg-zinc-200 disabled:text-zinc-400 text-white rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-orange-500/20 mb-0.5"
                                >
                                    {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 fill-current" />}
                                </button>
                            </div>
                            <div className="flex items-center justify-between px-2">
                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Supports images & rich text</p>
                                <p className="text-[10px] text-zinc-400 font-bold hidden lg:block uppercase tracking-widest">Enter to send · Shift+Enter for new line</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-200 rounded-[24px] px-4 py-4 opacity-50 cursor-not-allowed">
                            <div className="flex-1 text-zinc-400 font-bold uppercase tracking-widest text-xs">
                                Select a conversation to start messaging…
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
