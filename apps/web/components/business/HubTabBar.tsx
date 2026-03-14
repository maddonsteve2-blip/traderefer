"use client";

interface Tab {
    key: string;
    label: string;
    badge?: number;
}

interface HubTabBarProps {
    tabs: Tab[];
    active: string;
    onChange: (key: string) => void;
}

export function HubTabBar({ tabs, active, onChange }: HubTabBarProps) {
    return (
        <div className="sticky top-[72px] md:static z-20 shrink-0 border-b border-zinc-200 bg-white">
            <div className="flex overflow-x-auto px-3 md:px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => onChange(tab.key)}
                        className={`relative shrink-0 py-3.5 px-4 md:px-6 font-black transition-colors flex items-center gap-2 text-[13px] uppercase tracking-[0.16em] md:text-2xl md:tracking-normal md:normal-case ${
                            active === tab.key
                                ? "text-orange-600 border-b-[4px] border-orange-500"
                                : "text-zinc-500 hover:text-zinc-900 border-b-[4px] border-transparent"
                        }`}
                    >
                        {tab.label}
                        {tab.badge != null && tab.badge > 0 && (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white font-black text-sm">
                                {tab.badge > 9 ? "9+" : tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
