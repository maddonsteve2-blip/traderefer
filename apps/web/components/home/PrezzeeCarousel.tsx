"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const PREZZEE_CARDS = [
  { name: "Prezzee Smart Card", url: "/images/prezzee/prezzee-smart-card.webp", desc: "One card. Swap into 400+ brands. The ultimate gift." },
  { name: "Groceries", url: "/images/prezzee/groceries.webp", desc: "Woolworths, Coles and more — stock up on the weekly shop." },
  { name: "Foodie", url: "/images/prezzee/foodie.webp", desc: "DoorDash, Menulog and restaurant gift cards for nights off." },
  { name: "Entertainment", url: "/images/prezzee/entertainment.webp", desc: "Netflix, Spotify, Xbox, Hoyts and more — pick your favourite." },
  { name: "Fuel", url: "/images/prezzee/fuel.webp", desc: "Ampol, Shell and fuel cards — save at the bowser." },
  { name: "Travel", url: "/images/prezzee/travel.webp", desc: "Flights, hotels and experiences — your next getaway covered." },
  { name: "Luxury", url: "/images/prezzee/luxury.webp", desc: "Myer, David Jones and premium brands for a treat." },
  { name: "Bunnings", url: "/images/prezzee/bunnings.webp", desc: "Tools, hardware and garden — everything for the home." },
  { name: "Chemist Warehouse", url: "/images/prezzee/chemist-warehouse.webp", desc: "Health, beauty and vitamins — stocked up for less." },
  { name: "Coles", url: "/images/prezzee/coles.webp", desc: "Weekly groceries covered at Coles supermarkets." },
  { name: "Aesop", url: "/images/prezzee/aesop.webp", desc: "Premium skincare and fragrance — a luxurious treat." },
  { name: "ASOS", url: "/images/prezzee/asos.webp", desc: "Fashion, beauty and accessories — thousands of styles." },
];

export function PrezzeeCarousel() {
  const [carouselPaused, setCarouselPaused] = useState(false);

  // Duplicate for seamless loop
  const allCards = [...PREZZEE_CARDS, ...PREZZEE_CARDS];

  return (
    <>
      <style>{`
        @keyframes prezzee-marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
      <div
        className="overflow-hidden relative"
        onMouseEnter={() => setCarouselPaused(true)}
        onMouseLeave={() => setCarouselPaused(false)}
      >
        {/* Left/right fade masks so edge cards look clean */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 z-10 bg-gradient-to-r from-white to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 z-10 bg-gradient-to-l from-white to-transparent" />
        <div
          className="flex gap-5 pb-4"
          style={{
            width: "max-content",
            animation: "prezzee-marquee 32s linear infinite",
            animationPlayState: carouselPaused ? "paused" : "running",
          }}
        >
          {allCards.map((card, i) => (
            <Link
              key={i}
              href="/rewards"
              className="w-[280px] md:w-[320px] flex-shrink-0 bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100 group cursor-pointer hover:shadow-xl transition-shadow"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={card.url}
                alt={card.name}
                width="452"
                height="280"
                className="w-full aspect-[452/280] object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
              <div className="p-5">
                <h4 className="font-bold text-lg mb-1.5 font-display">{card.name}</h4>
                <p className="text-gray-500 mb-3 text-sm leading-relaxed">{card.desc}</p>
                <span className="text-[#FF6600] font-bold flex items-center gap-1 group-hover:gap-2 transition-all text-sm">
                  Start earning <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
