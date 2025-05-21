import React from 'react';

interface GeometricPatternProps {
  className?: string;
}

const GeometricPattern: React.FC<GeometricPatternProps> = ({ className = '' }) => {
  return (
    <div className={className}>
      <svg width="100%" height="100%" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="islamic-pattern" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M0,40 L40,0 L80,40 L40,80 Z" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="40" cy="40" r="30" fill="none" stroke="currentColor" strokeWidth="1" />
            <circle cx="40" cy="40" r="15" fill="none" stroke="currentColor" strokeWidth="1" />
            <path d="M20,40 L60,40 M40,20 L40,60" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#islamic-pattern)" />
      </svg>
    </div>
  );
};

export default GeometricPattern;