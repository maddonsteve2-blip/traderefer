"use client";

import { Building2, ArrowRight } from "lucide-react";
import { RegisterBusinessDialog } from "./RegisterBusinessDialog";

export function RegisterBusinessCard() {
    return (
        <RegisterBusinessDialog>
            <div className="group flex items-center justify-between p-6 bg-zinc-50 border border-zinc-200 rounded-2xl hover:border-zinc-400 hover:shadow-md hover:shadow-zinc-100 transition-all cursor-pointer">
                <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-zinc-200 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <Building2 className="w-6 h-6 text-zinc-600" />
                    </div>
                    <div>
                        <p className="font-black text-zinc-900" style={{ fontSize: '22px' }}>Register Your Business</p>
                        <p className="text-zinc-500 font-medium" style={{ fontSize: '19px' }}>
                            Receive pre-vetted leads from your own referrer network.
                        </p>
                    </div>
                </div>
                <ArrowRight className="w-5 h-5 text-zinc-400 shrink-0 group-hover:translate-x-1 transition-transform" />
            </div>
        </RegisterBusinessDialog>
    );
}
