import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface CTAButton {
  label: string;
  href: string;
}

interface Props {
  title: string;
  description: string;
  buttons: CTAButton[];
}

const CTASection: React.FC<Props> = ({ title, description, buttons }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.fromTo(contentRef.current, {
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
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <section ref={sectionRef} className="cta-section py-32 px-4 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 text-center">
      <div ref={contentRef} className="cta-content max-w-2xl mx-auto">
        <h2 className="cta-title text-[clamp(2.5rem,6vw,4rem)] font-black mb-6 text-white leading-tight">
          {title}
        </h2>
        <p className="cta-description text-lg mb-10 text-white/90">
          {description}
        </p>
        <div className="cta-buttons flex flex-col sm:flex-row gap-4 justify-center items-center">
          {buttons.map((btn, i) => (
            <a
              key={btn.label}
              href={btn.href}
              className="cta-btn bg-white/20 backdrop-blur-lg text-white px-8 py-4 rounded-full font-semibold text-lg border-2 border-white/30 transition-all duration-300 hover:bg-white/30 hover:border-white/60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2"
              tabIndex={0}
              aria-label={btn.label}
            >
              {btn.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CTASection; 