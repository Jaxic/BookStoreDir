import React from 'react';

interface Props {
  children: React.ReactNode;
  className?: string;
}

const MarqueeText: React.FC<Props> = ({ children, className = '' }) => {
  return (
    <div className={`overflow-hidden whitespace-nowrap ${className}`}>
      <div className="inline-block animate-marquee">
        <span className="px-8">{children}</span>
        <span className="px-8">{children}</span>
        <span className="px-8">{children}</span>
        <span className="px-8">{children}</span>
      </div>
    </div>
  );
};

export default MarqueeText; 