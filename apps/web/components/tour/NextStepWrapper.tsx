'use client';

import { NextStepProvider, NextStep } from 'nextstepjs';
import { referrerTours } from '@/tours/referrer-tours';
import { businessTours } from '@/tours/business-tours';
import { TourCard } from '@/components/tour/TourCard';

const allTours = [...referrerTours, ...businessTours];

export function NextStepWrapper({ children }: { children: React.ReactNode }) {
  return (
    <NextStepProvider>
      <NextStep
        steps={allTours}
        cardComponent={TourCard}
      >
        {children}
      </NextStep>
    </NextStepProvider>
  );
}
