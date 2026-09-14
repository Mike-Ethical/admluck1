import React from 'react';

interface AdmLuckLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AdmLuckLogo: React.FC<AdmLuckLogoProps> = ({
  className = '',
  size = 'md',
}) => {
  const dimensions = {
    sm: 'h-7',
    md: 'h-8 sm:h-9',
    lg: 'h-11',
  }[size];

  return (
    <div className={`relative inline-flex items-center select-none ${className}`}>
      <img
        src="/admluck-logo.png"
        alt="AdmLuck"
        className={`${dimensions} w-auto max-w-[44vw] object-contain drop-shadow-[0_0_12px_rgba(43,107,245,0.3)]`}
      />
    </div>
  );
};
