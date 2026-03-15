'use client';
import { useNextStep } from 'nextstepjs';

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
      className="hidden lg:flex fixed bottom-6 right-6 z-[9999] w-12 h-12 rounded-full bg-orange-600 text-white border-none cursor-pointer text-[22px] font-bold shadow-[0_4px_16px_rgba(232,98,10,0.5)] items-center justify-center transition-all hover:scale-110 hover:shadow-[0_6px_24px_rgba(232,98,10,0.7)] active:scale-95"
    >
      ?
    </button>
  );
};
