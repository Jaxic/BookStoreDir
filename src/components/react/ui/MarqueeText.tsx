import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface Props {
  text?: string;
  className?: string;
}

const MarqueeText: React.FC<Props> = ({ text = 'DISCOVER • EXPLORE • READ • REPEAT •', className = '' }) => {
  const marqueeRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ctx: gsap.Context | undefined;
    if (marqueeRef.current && contentRef.current) {
      const contentWidth = contentRef.current.offsetWidth;
      ctx = gsap.context(() => {
        gsap.to(contentRef.current, {
          x: -contentWidth / 2,
          duration: 20,
          ease: 'linear',
          repeat: -1,
        });
      }, marqueeRef);
    }
    return () => ctx && ctx.revert();
  }, []);

  // Pause on hover/focus
  const handleMouseEnter = () => gsap.globalTimeline.pause();
  const handleMouseLeave = () => gsap.globalTimeline.resume();

  return (
    <section
      className={`marquee-section py-20 border-t border-white/10 overflow-hidden bg-black ${className}`}
      aria-label="Scrolling announcement"
    >
      <div
        ref={marqueeRef}
        className="marquee w-full whitespace-nowrap opacity-20 select-none cursor-default"
        aria-hidden="true"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        tabIndex={-1}
      >
        <div
          ref={contentRef}
          className="marquee-content inline-block text-[clamp(3rem,8vw,8rem)] font-black tracking-tight gradient-text"
          style={{ minWidth: '200%' }}
        >
          {text} {text}
        </div>
      </div>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .gradient-text {
              background: linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899);
              -webkit-background-clip: text;
              background-clip: text;
              -webkit-text-fill-color: transparent;
            }
          `
        }}
      />
    </section>
  );
};

export default MarqueeText; 