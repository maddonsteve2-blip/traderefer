'use client';
import { useNextStep } from 'nextstepjs';
import { HelpCircle } from 'lucide-react';

type HelpButtonProps = {
  tourName: 'referrer-main' | 'business-main';
};

export const HelpButton = ({ tourName }: HelpButtonProps) => {
  const { startNextStep } = useNextStep();

  return (
    <button
      onClick={() => startNextStep(tourName)}
      aria-label="Start guided tour"
      title="Take a guided tour"
      className="hidden lg:flex fixed top-4 right-5 z-[60] items-center gap-2 h-10 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-lg shadow-orange-200 transition-all active:scale-95 cursor-pointer"
    >
      <HelpCircle className="w-4 h-4" />
      Take a Tour
    </button>
  );
};
