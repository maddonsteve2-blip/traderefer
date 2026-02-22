"use client";

import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

export function BookNowButton() {
    const scrollToEnquiry = () => {
        document.getElementById('enquiry-form')?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <Button 
            size="lg" 
            onClick={scrollToEnquiry}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-full px-12 py-7 h-auto text-xl font-bold shadow-xl shadow-orange-600/20 group cursor-pointer"
        >
            Book Now <ChevronRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
        </Button>
    );
}
