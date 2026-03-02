"use client";

import { useState, useEffect, useRef } from "react";
import { Zap } from "lucide-react";

const REFERRALS = [
    { trade: "Plumbing", suburb: "Bondi" },
    { trade: "Electrical", suburb: "Richmond" },
    { trade: "Carpentry", suburb: "Newtown" },
    { trade: "Painting", suburb: "Parramatta" },
    { trade: "Roofing", suburb: "Doncaster" },
    { trade: "Landscaping", suburb: "Chadstone" },
    { trade: "Air Conditioning", suburb: "Chermside" },
    { trade: "Fencing", suburb: "Frankston" },
    { trade: "Tiling", suburb: "Manly" },
    { trade: "Plastering", suburb: "Toowong" },
    { trade: "Concreting", suburb: "Rockingham" },
    { trade: "Solar Installation", suburb: "Campbelltown" },
    { trade: "Flooring", suburb: "Moorabbin" },
    { trade: "Cabinet Making", suburb: "Chatswood" },
    { trade: "Cleaning", suburb: "St Kilda" },
    { trade: "Pest Control", suburb: "Blacktown" },
    { trade: "Plumbing", suburb: "South Yarra" },
    { trade: "Electrical", suburb: "Surry Hills" },
    { trade: "Carpentry", suburb: "Ascot Vale" },
    { trade: "Painting", suburb: "Fortitude Valley" },
    { trade: "Roofing", suburb: "Ringwood" },
    { trade: "Landscaping", suburb: "Cronulla" },
    { trade: "Air Conditioning", suburb: "Robina" },
    { trade: "Fencing", suburb: "Altona" },
    { trade: "Tiling", suburb: "Bankstown" },
    { trade: "Plastering", suburb: "Carindale" },
    { trade: "Concreting", suburb: "Balcatta" },
    { trade: "Solar Installation", suburb: "Berwick" },
    { trade: "Flooring", suburb: "Marrickville" },
    { trade: "Plumbing", suburb: "Coogee" },
    { trade: "Electrical", suburb: "Fitzroy" },
    { trade: "Carpentry", suburb: "Pyrmont" },
    { trade: "Painting", suburb: "Bundoora" },
    { trade: "Roofing", suburb: "Penrith" },
    { trade: "Landscaping", suburb: "Oakleigh" },
    { trade: "Plumbing", suburb: "Baulkham Hills" },
    { trade: "Electrical", suburb: "Moonee Ponds" },
    { trade: "Concreting", suburb: "Werribee" },
    { trade: "Tiling", suburb: "Hornsby" },
    { trade: "Painting", suburb: "Aspley" },
    { trade: "Fencing", suburb: "Melton" },
    { trade: "Solar Installation", suburb: "Golden Grove" },
    { trade: "Carpentry", suburb: "Caulfield" },
    { trade: "Plumbing", suburb: "Springvale" },
    { trade: "Electrical", suburb: "Randwick" },
];

const TIMES = [
    "2 min ago", "3 min ago", "4 min ago", "5 min ago", "6 min ago",
    "8 min ago", "9 min ago", "11 min ago", "13 min ago", "15 min ago",
    "17 min ago", "19 min ago", "22 min ago", "24 min ago", "27 min ago",
    "31 min ago", "34 min ago", "38 min ago", "41 min ago",
];

function pick<T>(arr: T[], exclude?: number): { value: T; index: number } {
    let idx: number;
    do { idx = Math.floor(Math.random() * arr.length); } while (arr.length > 1 && idx === exclude);
    return { value: arr[idx], index: idx };
}

export function UrgencyTicker() {
    const [refIdx, setRefIdx] = useState(0);
    const [timeStr, setTimeStr] = useState("12 min ago");
    const [visible, setVisible] = useState(true);
    const refIdxRef = useRef(0);

    useEffect(() => {
        const initial = pick(REFERRALS);
        setRefIdx(initial.index);
        refIdxRef.current = initial.index;
        setTimeStr(pick(TIMES).value);

        function schedule() {
            const delay = 4500 + Math.random() * 3500;
            return setTimeout(() => {
                setVisible(false);
                setTimeout(() => {
                    const next = pick(REFERRALS, refIdxRef.current);
                    refIdxRef.current = next.index;
                    setRefIdx(next.index);
                    setTimeStr(pick(TIMES).value);
                    setVisible(true);
                }, 400);
                timer = schedule();
            }, delay);
        }

        let timer = schedule();
        return () => clearTimeout(timer);
    }, []);

    const { trade, suburb } = REFERRALS[refIdx];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#1A1A1A] border-t-2 border-[#FF6600] shadow-2xl" style={{ height: '56px' }}>
            <div className="container mx-auto h-full flex items-center justify-center gap-3 px-4">
                <Zap className="w-5 h-5 text-[#FF6600] shrink-0 animate-pulse" />
                <span
                    className="text-white font-bold transition-opacity duration-300"
                    style={{ fontSize: '18px', opacity: visible ? 1 : 0 }}
                >
                    Last referral matched:{" "}
                    <span className="text-[#FF6600]">{trade}</span>
                    {" "}in{" "}
                    <span className="text-[#FF6600]">{suburb}</span>
                    {" "}
                    <span className="text-zinc-400 font-normal">— {timeStr}</span>
                </span>
            </div>
        </div>
    );
}
