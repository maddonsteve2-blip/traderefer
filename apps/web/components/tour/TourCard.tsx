'use client';
import type { CardComponentProps } from 'nextstepjs';

export const TourCard = ({
  step,
  currentStep,
  totalSteps,
  nextStep,
  prevStep,
  skipTour,
  arrow,
}: CardComponentProps) => {
  const progress = Math.round(((currentStep + 1) / totalSteps) * 100);

  return (
    <div
      style={{
        background: '#1A1A1A',
        border: '2px solid #E8620A',
        borderRadius: '12px',
        padding: '20px',
        maxWidth: '340px',
        minWidth: '280px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        fontFamily: 'inherit',
        color: '#FFFFFF',
      }}
    >
      {arrow}

      {/* Header: icon + step counter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {step.icon && (
            <span style={{ fontSize: '20px' }}>{step.icon}</span>
          )}
          <span style={{ fontSize: '12px', color: '#E8620A', fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
            Step {currentStep + 1} of {totalSteps}
          </span>
        </div>
        <button
          onClick={skipTour}
          style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: '0 2px' }}
          aria-label="Close tour"
        >
          ×
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ background: '#333', borderRadius: '4px', height: '4px', marginBottom: '16px' }}>
        <div
          style={{
            background: '#E8620A',
            borderRadius: '4px',
            height: '100%',
            width: `${progress}%`,
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* Title */}
      <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700, color: '#FFFFFF' }}>
        {step.title}
      </h3>

      {/* Content */}
      <p style={{ margin: '0 0 20px', fontSize: '14px', lineHeight: '1.5', color: '#CCCCCC' }}>
        {step.content}
      </p>

      {/* Controls */}
      {step.showControls && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={prevStep}
            disabled={currentStep === 0}
            style={{
              background: 'transparent',
              border: '1px solid #444',
              borderRadius: '6px',
              color: currentStep === 0 ? '#555' : '#CCC',
              cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 500,
            }}
          >
            ← Back
          </button>
          {step.showSkip && (
            <button
              onClick={skipTour}
              style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '12px' }}
            >
              Skip tour
            </button>
          )}
          <button
            onClick={nextStep}
            style={{
              background: '#E8620A',
              border: 'none',
              borderRadius: '6px',
              color: '#FFFFFF',
              cursor: 'pointer',
              padding: '8px 20px',
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            {currentStep === totalSteps - 1 ? 'Finish ✓' : 'Next →'}
          </button>
        </div>
      )}
    </div>
  );
};
