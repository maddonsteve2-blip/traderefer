'use client';

import { useState, useEffect, useRef, useCallback, ReactElement } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import Link from 'next/link';
import { MessageSquare, Send, ArrowLeft, Building2, Search, X, Loader2, Check, CheckCheck, ShieldCheck, Paperclip, ExternalLink, Users, ChevronRight } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

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
        <div className={`${sizeClass} rounded-full bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center flex-shrink-0 overflow-hidden ring-2 ring-white shadow-sm`}>
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

export function MessagesView({ role }: { role?: 'business' | 'referrer' }) {
    const { getToken } = useAuth();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [activeContactId, setActiveContactId] = useState<string | null>(null);
    const [activeConvId, setActiveConvId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [myType, setMyType] = useState<string>(role || 'business');
    const [partnerName, setPartnerName] = useState('');
    const [partnerLogo, setPartnerLogo] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [uploading, setUploading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [viewportHeight, setViewportHeight] = useState('100dvh');
    const wsRef = useRef<WebSocket | null>(null);
    const pingRef = useRef<NodeJS.Timeout | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const searchParams = useSearchParams();
    const convParam = searchParams.get('conv');
    const lastMsgIdRef = useRef<string | null>(null);
    const [partnerTyping, setPartnerTyping] = useState(false);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastTypingSentRef = useRef<boolean>(false);
    const myTypeRef = useRef(myType);

    useEffect(() => { myTypeRef.current = myType; }, [myType]);

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

    // Watch for layout changes (like images loading) to keep scroll at bottom
    useEffect(() => {
        if (!scrollContainerRef.current) return;
        const resizeObserver = new ResizeObserver(() => {
            // Only force scroll if we're active and likely want to be at bottom
            if (activeConvId) {
                // Check if user is already near bottom (optional, but for now let's just force it)
                scrollToBottom(false);
            }
        });
        resizeObserver.observe(scrollContainerRef.current);
        return () => resizeObserver.disconnect();
    }, [activeConvId, scrollToBottom]);

    // Derived viewport height for mobile keyboard handling
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const handler = () => {
            if (window.visualViewport) {
                setViewportHeight(`${window.visualViewport.height}px`);
                // Scroll to bottom when keyboard pops up or viewport changes
                if (activeConvId) {
                    setTimeout(() => scrollToBottom(false), 100);
                }
            }
        };
        const vv = window.visualViewport;
        vv?.addEventListener('resize', handler);
        vv?.addEventListener('scroll', handler);
        handler();
        return () => {
            vv?.removeEventListener('resize', handler);
            vv?.removeEventListener('scroll', handler);
        };
    }, [activeConvId, scrollToBottom]);

    // Derive WebSocket base URL from the API route
    const getWsUrl = useCallback((convId: string, token: string) => {
        // Clean the base URL (trim spaces/newlines and remove trailing slashes)
        const apiBase = (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/$/, '');
        
        // If it's a relative URL (like /api/backend), we need to derive the absolute one for WS
        if (apiBase === '' || apiBase.startsWith('/')) {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            return `${protocol}//${window.location.host}/messages/ws/${convId}?token=${encodeURIComponent(token)}`;
        }

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
                    // Trust the backend's tailored is_mine, fallback to type check if missing
                    const finalIsMine = typeof msg.is_mine === 'boolean' ? msg.is_mine : (msg.sender_type === myTypeRef.current);
                    const finalMsg = { ...msg, is_mine: finalIsMine };
                    
                    setMessages(prev => {
                        // Avoid duplicates if WebSocket arrives after HTTP response replacement
                        const exists = prev.some(m => m.id === msg.id);
                        if (exists) return prev;
                        return [...prev, finalMsg];
                    });
                    
                    // Play notification sound for incoming partner messages if allowed
                    if (!finalIsMine) {
                        try {
                            const audio = new Audio('/sounds/message.mp3');
                            audio.play().catch(() => {}); // Browsers might block if no interaction
                        } catch {}
                    }

                    // Update contact list preview
                    setContacts(prev => prev.map(c =>
                        c.conversation_id === convId
                            ? { ...c, last_message: msg.body || '📷 Image', last_message_at: msg.created_at, unread_count: finalIsMine ? c.unread_count : c.unread_count + 1 }
                            : c
                    ));
                } else if (payload.type === 'typing') {
                    setPartnerTyping(payload.is_typing);
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


// Ref moved up to line 136

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

    // Handle typing indicator broadcast
    useEffect(() => {
        if (!activeConvId || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        
        const isCurrentlyTyping = newMessage.length > 0;
        
        // Only send if status changed
        if (isCurrentlyTyping !== lastTypingSentRef.current) {
            wsRef.current.send(JSON.stringify({ type: 'typing', is_typing: isCurrentlyTyping }));
            lastTypingSentRef.current = isCurrentlyTyping;
        }

        // Auto-clear typing after inactivity
        if (isCurrentlyTyping) {
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(() => {
                if (wsRef.current?.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({ type: 'typing', is_typing: false }));
                    lastTypingSentRef.current = false;
                }
            }, 3000);
        }
        
        return () => { if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current); };
    }, [newMessage, activeConvId]);

// Merged into effect at line 139

    const fetchContacts = useCallback(async () => {
        try {
            const token = await getToken();
            const url = role 
                ? `${API}/messages/contacts?role=${role}`
                : `${API}/messages/contacts`;
                
            const res = await fetch(url, {
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
        // FIX: Don't wipe messages if we are re-clicking the SAME active contact
        if (contact.contact_id === activeContactId && messages.length > 0) {
            setTimeout(() => inputRef.current?.focus(), 100);
            return;
        }

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

        // Request notification permission on first interaction
        if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
            Notification.requestPermission();
        }

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
                setMessages(prev => {
                    // Check if WebSocket broadcast already added this real message (race condition)
                    const alreadyPresent = prev.some(m => m.id === msg.id);
                    if (alreadyPresent) {
                        return prev.filter(m => m.id !== optimisticId);
                    }
                    return prev.map(m => m.id === optimisticId ? { ...msg, is_mine: true } : m);
                });
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

    const filteredContacts = Array.isArray(contacts) 
        ? contacts.filter(c => c.contact_name.toLowerCase().includes(searchQuery.toLowerCase()))
        : [];

    const activeContact = Array.isArray(contacts) ? contacts.find(c => c.contact_id === activeContactId) : undefined;
    const totalUnread = Array.isArray(contacts) ? contacts.reduce((acc, c) => acc + (c.unread_count || 0), 0) : 0;

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
        <div className="flex w-full h-full bg-white overflow-hidden text-zinc-900 border-none shadow-none">
            {/* ── LEFT PANEL (Sidebar) ── */}
            <div className={`${activeContactId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-[320px] lg:w-[380px] border-r border-zinc-100 bg-white flex-shrink-0`}>
                <div className="px-4 py-3 border-b border-zinc-100">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 h-[36px] bg-zinc-100 border-none rounded-full focus:ring-1 focus:ring-orange-500/30 focus:bg-white outline-none placeholder:text-zinc-400 text-zinc-800 font-medium text-[15px] transition-all"
                        />
                    </div>
                </div>

                {/* Contact list */}
                <div className="flex-1 overflow-y-auto">
                    {filteredContacts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8 gap-4">
                            <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center">
                                <Users className="w-8 h-8 text-zinc-300" />
                            </div>
                            <div>
                                <p className="font-bold text-zinc-700 text-lg">No conversations</p>
                                <p className="text-zinc-400 font-medium mt-1 text-sm leading-snug">
                                    {myType === 'business' ? 'Referrers will appear here once linked.' : 'Find businesses to start messaging.'}
                                </p>
                                {myType !== 'business' && (
                                    <Link href="/dashboard/referrer/businesses" className="mt-4 inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2.5 rounded-full transition-all text-sm">
                                        <Building2 className="w-4 h-4" /> Browse Businesses
                                    </Link>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div>
                            {filteredContacts.map(contact => {
                                const isActive = activeContactId === contact.contact_id;
                                const hasUnread = contact.unread_count > 0;
                                return (
                                    <button
                                        key={contact.contact_id}
                                        onClick={() => openContact(contact)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-b border-zinc-50 ${
                                            isActive ? 'bg-orange-50/60' : 'hover:bg-zinc-50 active:bg-zinc-100'
                                        }`}
                                    >
                                        <div className="flex-shrink-0">
                                            <Avatar name={contact.contact_name} logo={contact.contact_logo} size={12} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <span className={`truncate font-semibold text-[16px] ${hasUnread ? 'text-zinc-900 font-bold' : 'text-zinc-800'}`}>
                                                    {contact.contact_name}
                                                </span>
                                                <span className={`flex-shrink-0 text-[12px] ${hasUnread ? 'text-orange-500 font-semibold' : 'text-zinc-400'}`}>
                                                    {contact.last_message_at ? formatListTime(contact.last_message_at) : ''}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between gap-2 mt-0.5">
                                                <p className={`truncate text-[14px] ${hasUnread ? 'text-zinc-700 font-medium' : 'text-zinc-400'}`}>
                                                    {contact.last_message || 'Start the conversation'}
                                                </p>
                                                {hasUnread && (
                                                    <span className="flex-shrink-0 min-w-[20px] h-[20px] bg-orange-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center px-1.5">
                                                        {contact.unread_count}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ── RIGHT PANEL (Chat View) ── */}
            <div 
                className={`${activeContactId ? 'flex fixed inset-0 z-[70] md:relative md:inset-auto md:z-0' : contacts.length === 0 ? 'hidden' : 'hidden md:flex'} flex-col flex-1 bg-white min-h-0`}
                style={{ height: typeof window !== 'undefined' && window.innerWidth < 768 ? viewportHeight : undefined }}
            >
                {/* Mobile/Desktop Header */}
                {activeContactId && activeContact ? (
                    <div className="flex items-center gap-3 px-3 py-2.5 bg-white border-b border-zinc-100 flex-shrink-0 sticky top-0 z-20">
                        <button
                            onClick={() => { setActiveContactId(null); setActiveConvId(null); setMessages([]); }}
                            className="md:hidden p-1.5 -ml-1 hover:bg-zinc-100 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-zinc-600" />
                        </button>
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <Avatar name={partnerName} logo={partnerLogo || activeContact.contact_logo} size={9} />
                            <div className="truncate">
                                <p className="font-bold text-zinc-900 truncate text-[16px] leading-tight">{partnerName}</p>
                                <p className="text-green-600 font-medium text-[12px] flex items-center gap-1 mt-0.5">
                                    <ShieldCheck className="w-3 h-3" /> Verified
                                </p>
                            </div>
                        </div>
                        {myType !== 'business' && (
                            <Link
                                href={`/b/${activeContact.contact_id}`}
                                className="p-2 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-orange-500 transition-colors"
                            >
                                <ExternalLink className="w-5 h-5" />
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="hidden md:flex flex-1 bg-zinc-50/30">
                        <EmptyState
                            icon={MessageSquare}
                            iconColor="text-zinc-400"
                            iconBg="bg-zinc-100"
                            title="Select a conversation"
                            description="Chat directly with your referrers to keep them engaged, share campaign updates, or answer their questions."
                            tip="Use 'Broadcast to all referrers' (top right) to message your whole network at once."
                            className="flex-1 items-center justify-center"
                        />
                    </div>
                )}

                {/* ── Scrollable content area ── */}
                <div 
                    ref={scrollContainerRef}
                    className="flex-1 overflow-y-auto min-h-0 bg-white scroll-smooth touch-pan-y"
                    style={{ overflowAnchor: 'none', WebkitOverflowScrolling: 'touch' }}
                >
                    {activeContactId && (
                        <div className="px-3 py-4 md:px-5 md:py-6 max-w-4xl mx-auto w-full">
                            {messages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center text-center py-20 opacity-40">
                                    <MessageSquare className="w-12 h-12 text-zinc-200 mb-3" />
                                    <p className="font-medium text-zinc-400 text-base">No messages yet</p>
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
                                            className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} ${isGroupStart ? 'mt-4' : 'mt-0.5'}`}
                                        >
                                            <div className={`max-w-[85%] sm:max-w-[70%]`}>
                                                <div className={`relative px-3.5 py-2 text-[15px] leading-relaxed ${
                                                    isMine
                                                        ? `bg-orange-500 text-white ${isGroupStart && isGroupEnd ? 'rounded-2xl rounded-br-md' : isGroupStart ? 'rounded-2xl rounded-br-md' : isGroupEnd ? 'rounded-2xl rounded-tr-md' : 'rounded-2xl rounded-r-md'}`
                                                        : `bg-zinc-100 text-zinc-900 ${isGroupStart && isGroupEnd ? 'rounded-2xl rounded-bl-md' : isGroupStart ? 'rounded-2xl rounded-bl-md' : isGroupEnd ? 'rounded-2xl rounded-tl-md' : 'rounded-2xl rounded-l-md'}`
                                                } ${isOptimistic ? 'opacity-50' : ''}`}>
                                                    {msg.image_url && (
                                                        <div className="mb-1.5 -mx-1.5 -mt-0.5 overflow-hidden rounded-lg">
                                                            <a href={msg.image_url} target="_blank" rel="noopener noreferrer">
                                                                <img 
                                                                    src={msg.image_url} 
                                                                    alt="Attachment" 
                                                                    onLoad={() => scrollToBottom(false)}
                                                                    className="max-w-full max-h-[260px] object-cover hover:brightness-95 transition-all" 
                                                                />
                                                            </a>
                                                        </div>
                                                    )}
                                                    {msg.body && <span className="whitespace-pre-wrap">{msg.body}</span>}
                                                    <span className={`inline-flex items-center gap-1 ml-2 align-bottom text-[10px] translate-y-[2px] ${isMine ? 'text-white/60' : 'text-zinc-400'}`}>
                                                        {formatMsgTime(msg.created_at)}
                                                        {isMine && (
                                                            msg.is_read 
                                                                ? <CheckCheck className="w-3.5 h-3.5 text-white/70" />
                                                                : <Check className="w-3 h-3" />
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                });
                                return grouped;
                            })()}
                             {partnerTyping && (
                                <div className="flex flex-col items-start mt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="bg-zinc-100 px-3.5 py-2.5 rounded-2xl rounded-bl-md flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" />
                                    </div>
                                </div>
                            )}
                            <div className="h-4" />
                        </div>
                    )}
                </div>

                {/* ── Input bar (Telegram-style) ── */}
                {activeContactId && (
                    <div className="flex flex-col bg-white border-t border-zinc-100 safe-bottom">
                        {imagePreview && (
                            <div className="px-4 py-3 border-b border-zinc-50 overflow-x-auto">
                                <div className="relative inline-block group">
                                    <img src={imagePreview} alt="Preview" className="h-20 w-20 rounded-xl object-cover border border-zinc-200" />
                                    {uploading ? (
                                        <div className="absolute inset-0 bg-white/60 rounded-xl flex items-center justify-center">
                                            <Loader2 className="w-5 h-5 text-orange-500 animate-spin" />
                                        </div>
                                    ) : (
                                        <button onClick={clearImage} className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-zinc-800 text-white rounded-full flex items-center justify-center hover:bg-red-500 transition-all active:scale-95">
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                        <div className="flex items-end gap-1.5 px-2 py-2 md:px-4 md:py-3">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className="p-2 text-zinc-400 hover:text-orange-500 rounded-full transition-colors flex-shrink-0"
                            >
                                <Paperclip className="w-5 h-5" />
                                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                            </button>
                            <div className="flex-1 flex items-end bg-zinc-100 rounded-[20px] px-3 py-1.5 min-h-[40px] focus-within:bg-zinc-50 focus-within:ring-1 focus-within:ring-orange-500/20 transition-all">
                                <textarea
                                    ref={inputRef}
                                    value={newMessage}
                                    onChange={e => {
                                        setNewMessage(e.target.value);
                                        e.target.style.height = 'auto';
                                        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                                    }}
                                    onKeyDown={handleKeyDown}
                                    onFocus={() => {
                                        setTimeout(() => scrollToBottom(false), 200);
                                    }}
                                    placeholder="Message"
                                    rows={1}
                                    className="flex-1 bg-transparent text-zinc-900 placeholder:text-zinc-400 focus:outline-none resize-none leading-relaxed py-1 max-h-[120px] text-[15px] font-medium border-none ring-0 focus:ring-0"
                                />
                            </div>
                            <button
                                onClick={handleSend}
                                disabled={(!newMessage.trim() && !imageUrl) || sending || uploading}
                                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                                    (!newMessage.trim() && !imageUrl) || sending || uploading
                                        ? 'text-zinc-300'
                                        : 'bg-orange-500 text-white shadow-sm'
                                }`}
                            >
                                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style jsx global>{`
                .shadow-premium {
                    box-shadow: 0 4px 20px -5px rgba(0, 0, 0, 0.05), 0 2px 10px -5px rgba(0, 0, 0, 0.05);
                }
                .safe-bottom {
                    padding-bottom: env(safe-area-inset-bottom);
                }
            `}</style>
        </div>
    );
}
