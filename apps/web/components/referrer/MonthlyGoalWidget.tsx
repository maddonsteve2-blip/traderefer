"use client";

import { useState, useEffect } from "react";
import { Target, Flame } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

    return (
        <div className="bg-white rounded-2xl border border-zinc-200 p-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center shrink-0">
                        <Target className="w-4 h-4 text-orange-500" />
                    </div>
                    <span className="text-sm font-black text-zinc-900">Monthly Goal</span>
                </div>
                <button
                    onClick={() => setEditingGoal(!editingGoal)}
                    className="text-sm font-bold text-orange-500 hover:text-orange-600 underline underline-offset-2"
                >
                    {editingGoal ? "Cancel" : stats.monthly_goal_cents ? "Edit" : "Set Goal"}
                </button>
            </div>

            {editingGoal ? (
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-sm">$</span>
                        <input
                            type="number"
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-7 pr-3 py-2.5 text-zinc-900 font-bold text-sm focus:ring-2 focus:ring-orange-500/20 focus:outline-none"
                            placeholder="500"
                            value={goalInput}
                            onChange={e => setGoalInput(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={saveGoal}
                        className="bg-orange-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors"
                    >
                        Save
                    </button>
                </div>
            ) : stats.monthly_goal_cents ? (
                <div>
                    <div className="flex items-end justify-between mb-2">
                        <span className="text-2xl font-black text-zinc-900">{pct}%</span>
                        <span className="text-sm text-zinc-500 font-medium">
                            {cents(stats.earnings.this_month)} / {cents(stats.monthly_goal_cents)}
                        </span>
                    </div>
                    <div className="w-full bg-zinc-100 rounded-full h-3.5 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${pct >= 100 ? "bg-green-500" : pct >= 50 ? "bg-orange-500" : "bg-orange-300"}`}
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                    {pct >= 100 && (
                        <p className="text-sm font-bold text-green-600 mt-1.5 flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5" /> Goal reached!
                        </p>
                    )}
                </div>
            ) : (
                <div>
                    <p className="text-sm text-zinc-500 font-medium mb-1">Set a target to track your progress.</p>
                    <p className="text-xs text-zinc-400">Top referrers aim for $500–$2,000/month.</p>
                </div>
            )}
        </div>
    );
}
