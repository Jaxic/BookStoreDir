import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

const InteractiveSearch: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Title reveal
    gsap.fromTo(titleRef.current, {
      y: 50,
      opacity: 0
    }, {
      y: 0,
      opacity: 1,
      duration: 1,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 70%'
      }
    });

    // Search container reveal
    gsap.fromTo(containerRef.current, {
      y: 50,
      opacity: 0,
      scale: 0.9
    }, {
      y: 0,
      opacity: 1,
      scale: 1,
      duration: 1,
      ease: 'back.out(1.7)',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 60%'
      }
    });
  }, []);

  const handleFocus = () => {
    gsap.to(containerRef.current, {
      scale: 1.05,
      duration: 0.3,
      ease: 'power2.out'
    });
  };

  const handleBlur = () => {
    gsap.to(containerRef.current, {
      scale: 1,
      duration: 0.3,
      ease: 'power2.out'
    });
  };

  return (
    <section ref={sectionRef} className="py-20 px-4 text-center">
      <h2 
        ref={titleRef}
        className="text-4xl md:text-6xl font-black mb-12"
      >
        Find Your <span className="gradient-text">Perfect</span> Bookstore
      </h2>
      
      <div ref={containerRef} className="max-w-4xl mx-auto">
        <input
          type="text"
          placeholder="Search by city, province, or specialty..."
          className="w-full glass rounded-2xl px-8 py-6 text-xl text-white placeholder-white/50 outline-none focus:border-blue-500 transition-all duration-300"
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>
    </section>
  );
};

export default InteractiveSearch; 