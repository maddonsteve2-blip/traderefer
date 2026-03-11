"use client";

import { useState, useEffect } from "react";
import { Flame } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";

const API = "/api/backend";

function cents(c: number) {
    return `$${(c / 100).toFixed(0)}`;
}

interface Stats {
    monthly_goal_cents: number | null;
    goal_progress: number | null;
    earnings: { this_month: number };
}

export function MonthlyGoalWidget() {
    const { getToken } = useAuth();
    const [stats, setStats] = useState<Stats | null>(null);
    const [editingGoal, setEditingGoal] = useState(false);
    const [goalInput, setGoalInput] = useState("");

    useEffect(() => {
        getToken().then(token => {
            fetch(`${API}/referrer/stats`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(r => r.ok ? r.json() : null)
                .then(d => {
                    if (d) {
                        setStats(d);
                        if (d.monthly_goal_cents) setGoalInput(String(d.monthly_goal_cents / 100));
                    }
                })
                .catch(() => { });
        });
    }, []);

    async function saveGoal() {
        const val = parseFloat(goalInput);
        if (isNaN(val) || val <= 0) { toast.error("Enter a valid amount"); return; }
        try {
            const token = await getToken();
            await fetch(`${API}/referrer/goal`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ monthly_goal_cents: Math.round(val * 100) }),
            });
            toast.success("Goal updated!");
            setEditingGoal(false);
            const res = await fetch(`${API}/referrer/stats`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) setStats(await res.json());
        } catch {
            toast.error("Failed to save goal");
        }
    }

    if (!stats) return null;

    const pct = Math.min(stats.goal_progress || 0, 100);
    const radius = 15.9;
    const circumference = 2 * Math.PI * radius;
    const dash = (pct / 100) * circumference;
    const ringColor = pct >= 100 ? "#22c55e" : pct >= 50 ? "#f97316" : "#fdba74";

    return (
        <div className="bg-white rounded-2xl border border-zinc-200 p-4">
            {editingGoal ? (
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">$</span>
                        <input
                            type="number"
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-7 pr-3 py-2.5 text-zinc-900 font-bold text-lg focus:ring-2 focus:ring-orange-500/20 focus:outline-none"
                            placeholder="500"
                            value={goalInput}
                            onChange={e => setGoalInput(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <button onClick={saveGoal} className="bg-orange-500 text-white px-4 py-2.5 rounded-xl font-bold text-lg hover:bg-orange-600 transition-colors">
                        Save
                    </button>
                    <button onClick={() => setEditingGoal(false)} className="text-zinc-400 hover:text-zinc-600 text-lg font-bold px-2">×</button>
                </div>
            ) : stats.monthly_goal_cents ? (
                <div className="flex items-center gap-4">
                    {/* Ring — click to edit */}
                    <button onClick={() => setEditingGoal(true)} className="relative shrink-0 w-[72px] h-[72px] group">
                        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                            <circle cx="18" cy="18" r={radius} fill="none" stroke="#e4e4e7" strokeWidth="3" />
                            <circle
                                cx="18" cy="18" r={radius} fill="none"
                                stroke={ringColor} strokeWidth="3"
                                strokeDasharray={`${dash} ${circumference}`}
                                strokeLinecap="round"
                                style={{ transition: "stroke-dasharray 0.5s ease" }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-base font-black text-zinc-900 leading-none">{pct}%</span>
                            <span className="text-[11px] text-zinc-400 leading-none mt-0.5 group-hover:text-orange-500">edit</span>
                        </div>
                    </button>
                    <div className="flex-1 min-w-0">
                        <div className="text-2xl font-black text-zinc-900 leading-none">{cents(stats.earnings.this_month)}</div>
                        <div className="text-base font-semibold text-zinc-400 mt-1">of {cents(stats.monthly_goal_cents)} goal</div>
                        {pct >= 100 && (
                            <div className="text-base font-bold text-green-600 flex items-center gap-1 mt-1">
                                <Flame className="w-4 h-4" /> Goal reached!
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <button
                    onClick={() => setEditingGoal(true)}
                    className="w-full flex items-center justify-between group"
                >
                    <span className="text-base font-semibold text-zinc-500 group-hover:text-zinc-700">Set a monthly earnings goal</span>
                    <span className="text-lg font-black text-orange-500 group-hover:text-orange-600 underline underline-offset-2">Set Goal →</span>
                </button>
            )}
        </div>
    );
}
