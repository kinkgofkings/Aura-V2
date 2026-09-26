import React from 'react';

interface SparkGridIconProps {
  className?: string;
  size?: number;
}

/**
 * SparkGridIcon: Matches the "Spark-Grid" icon from the system design guide
 * (A 3x3 rounded square grid with a brilliant 4-pointed sparkle star at the top-right).
 */
export const SparkGridIcon: React.FC<SparkGridIconProps> = ({
  className = "w-5 h-5",
  size = 20,
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* 3x3 Rounded Grid Blocks */}
      {/* Row 1 */}
      <rect x="3" y="3.5" width="4.2" height="4.2" rx="1.3" fill="currentColor" />
      <rect x="9.9" y="3.5" width="4.2" height="4.2" rx="1.3" fill="currentColor" />
      <rect x="16.8" y="5" width="4.2" height="4.2" rx="1.3" fill="currentColor" opacity="0.85" />

      {/* Row 2 */}
      <rect x="3" y="10" width="4.2" height="4.2" rx="1.3" fill="currentColor" />
      <rect x="9.9" y="10" width="4.2" height="4.2" rx="1.3" fill="currentColor" />
      <rect x="16.8" y="10" width="4.2" height="4.2" rx="1.3" fill="currentColor" />

      {/* Row 3 */}
      <rect x="3" y="16.5" width="4.2" height="4.2" rx="1.3" fill="currentColor" />
      <rect x="9.9" y="16.5" width="4.2" height="4.2" rx="1.3" fill="currentColor" />
      <rect x="16.8" y="16.5" width="4.2" height="4.2" rx="1.3" fill="currentColor" />

      {/* Brilliant 4-Pointed Sparkle Star at Top Right */}
      <path
        d="M20.5 1C20.5 2.4 21.6 3.5 23 3.5C21.6 3.5 20.5 4.6 20.5 6C20.5 4.6 19.4 3.5 18 3.5C19.4 3.5 20.5 2.4 20.5 1Z"
        fill="currentColor"
      />
    </svg>
  );
};
