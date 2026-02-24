"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
    LifeBuoy,
    MessageSquare,
    Mail,
    Send,
    ChevronLeft,
    CheckCircle2,
    Loader2
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function SupportPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.message) {
            toast.error("Please fill in all required fields.");
            return;
        }

        setIsSubmitting(true);
        // Simulate API call for support request
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            setIsSuccess(true);
            toast.success("Support request sent successfully!");
            setFormData({ name: "", email: "", subject: "", message: "" });
        } catch {
            toast.error("Failed to send message. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#fafafa] flex flex-col">
            <header className="p-6 border-b border-zinc-100 bg-white sticky top-0 z-50">
                <div className="container mx-auto max-w-[1024px] flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-zinc-900 hover:text-orange-600 transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                        <span className="font-bold">Back to Home</span>
                    </Link>
                </div>
            </header>

            <main className="flex-1 container mx-auto max-w-[1024px] px-6 py-12 lg:py-20">
                <div className="text-center mb-16">
                    <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <LifeBuoy className="w-10 h-10 text-orange-600" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-zinc-900 mb-6 font-display tracking-tight">
                        How can we help?
                    </h1>
                    <p className="text-xl text-zinc-500 max-w-2xl mx-auto font-medium leading-relaxed">
                        Whether you&apos;re a business looking to connect with leads, or a referrer with questions about payouts, our team is here to assist you.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Contact Info Sidebar */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="p-8 rounded-[32px] border-zinc-100 shadow-sm bg-white">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mb-6">
                                <Mail className="w-6 h-6 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-zinc-900 mb-2">Email Support</h3>
                            <p className="text-zinc-500 mb-4 font-medium">We aim to respond to all inquiries within 24 hours.</p>
                            <a href="mailto:support@traderefer.au" className="text-lg font-bold text-orange-600 hover:text-orange-700 transition-colors">
                                support@traderefer.au
                            </a>
                        </Card>

                        <Card className="p-8 rounded-[32px] border-zinc-100 shadow-sm bg-zinc-900 text-white relative overflow-hidden group">
                            <div className="absolute -right-10 -top-10 size-40 bg-orange-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700"></div>
                            <div className="relative z-10">
                                <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                                    <MessageSquare className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-xl font-bold mb-2 font-display">FAQ & Guides</h3>
                                <p className="text-zinc-400 mb-6 leading-relaxed">Check out our help center for quick answers to common questions about payouts, lead verification, and more.</p>
                                <Button variant="outline" disabled className="w-full rounded-full bg-transparent border-zinc-700 text-zinc-500 cursor-not-allowed">
                                    Help Center — Coming Soon
                                </Button>
                            </div>
                        </Card>
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-2">
                        <Card className="p-8 md:p-12 rounded-[40px] border-zinc-200 shadow-xl shadow-zinc-200/50 bg-white">
                            {isSuccess ? (
                                <div className="text-center py-12 animate-in fade-in zoom-in duration-500">
                                    <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckCircle2 className="w-12 h-12 text-green-500" />
                                    </div>
                                    <h2 className="text-3xl font-black text-zinc-900 mb-4 font-display">Message Sent!</h2>
                                    <p className="text-lg text-zinc-500 font-medium mb-8 max-w-md mx-auto">
                                        Thanks for reaching out. A member of our support team will get back to you shortly.
                                    </p>
                                    <Button 
                                        onClick={() => setIsSuccess(false)}
                                        className="rounded-full px-8 bg-zinc-900 hover:bg-black text-white font-bold"
                                    >
                                        Send Another Message
                                    </Button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <h2 className="text-2xl font-bold text-zinc-900 mb-8 font-display">Send us a message</h2>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="text-sm font-bold uppercase tracking-wider text-zinc-500 ml-1">Your Name</label>
                                            <Input 
                                                value={formData.name}
                                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                                placeholder="John Doe" 
                                                className="bg-zinc-50 border-none rounded-xl px-4 py-6 text-base font-medium focus-visible:ring-2 focus-visible:ring-orange-500/20"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-sm font-bold uppercase tracking-wider text-zinc-500 ml-1">Email Address</label>
                                            <Input 
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                                placeholder="john@example.com" 
                                                className="bg-zinc-50 border-none rounded-xl px-4 py-6 text-base font-medium focus-visible:ring-2 focus-visible:ring-orange-500/20"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-sm font-bold uppercase tracking-wider text-zinc-500 ml-1">Subject (Optional)</label>
                                        <Input 
                                            value={formData.subject}
                                            onChange={(e) => setFormData({...formData, subject: e.target.value})}
                                            placeholder="What is this regarding?" 
                                            className="bg-zinc-50 border-none rounded-xl px-4 py-6 text-base font-medium focus-visible:ring-2 focus-visible:ring-orange-500/20"
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-sm font-bold uppercase tracking-wider text-zinc-500 ml-1">Message</label>
                                        <Textarea 
                                            value={formData.message}
                                            onChange={(e) => setFormData({...formData, message: e.target.value})}
                                            placeholder="How can we help you today?" 
                                            className="bg-zinc-50 border-none rounded-2xl p-6 text-base font-medium focus-visible:ring-2 focus-visible:ring-orange-500/20 min-h-[200px] resize-none"
                                            required
                                        />
                                    </div>

                                    <Button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-full py-7 h-auto text-lg font-bold shadow-xl shadow-orange-600/20 transition-all active:scale-95 mt-4"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Sending...
                                            </>
                                        ) : (
                                            <>
                                                Send Message <Send className="w-5 h-5 ml-2" />
                                            </>
                                        )}
                                    </Button>
                                </form>
                            )}
                        </Card>
                    </div>
                </div>
            </main>

        </div>
    );
}
