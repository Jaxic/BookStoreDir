import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextPlugin } from 'gsap/TextPlugin';
gsap.registerPlugin(ScrollTrigger, TextPlugin);

interface Province {
  name: string;
  count: number;
  color: string;
}

interface Props {
  provinces: Province[];
}

const ScrollTriggeredStats: React.FC<Props> = ({ provinces }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    // Cards animation
    gsap.fromTo(cardsRef.current, {
      y: 100,
      opacity: 0,
      rotationX: 15,
      scale: 0.8
    }, {
      y: 0,
      opacity: 1,
      rotationX: 0,
      scale: 1,
      duration: 1.2,
      stagger: 0.08, // faster
      ease: 'back.out(1.7)',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 90%', // appear sooner
        end: 'bottom 25%',
        toggleActions: 'play none none reverse'
      }
    });

    // Number counting animation
    cardsRef.current.forEach((card, index) => {
      const numberEl = card.querySelector('.stat-number');
      if (numberEl) {
        const finalNumber = provinces[index].count;
        gsap.fromTo(numberEl, {
          textContent: 0
        }, {
          textContent: finalNumber,
          duration: 2.5,
          ease: 'power2.out',
          snap: { textContent: 1 },
          delay: index * 0.1,
          scrollTrigger: {
            trigger: card,
            start: 'top 85%',
            toggleActions: 'play none none reverse'
          }
        });
      }
    });

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [provinces]);

  return (
    <section ref={sectionRef} className="stats-section py-32 px-4 bg-black">
      <div className="max-w-7xl mx-auto">
        <h2 className="stats-title text-center mb-16 font-black text-[clamp(3rem,8vw,6rem)] leading-tight">
          Bookstores <span className="gradient-text">Across</span> Canada
        </h2>
        <div className="stats-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mt-12">
          {provinces.map((province, index) => {
            const provinceSlug = province.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            return (
              <div
                key={province.name}
                ref={el => { if (el) cardsRef.current[index] = el; }}
                className="stat-card group relative bg-white/5 backdrop-blur-lg border border-white/10 rounded-3xl p-10 text-center overflow-hidden shadow-2xl transform transition-all duration-700 hover:scale-105 hover:border-blue-400/40 focus-within:scale-105 focus-within:border-blue-400/40"
                tabIndex={-1}
                aria-label={`${province.count} used bookstores in ${province.name}`}
              >
                <a
                  href={`/${provinceSlug}`}
                  className="absolute inset-0 z-20 cursor-pointer outline-none focus:ring-2 focus:ring-blue-400 rounded-3xl"
                  tabIndex={0}
                  aria-label={`View bookstores in ${province.name}`}
                  style={{ display: 'block' }}
                />
                {/* Gradient background */}
                <div className={`absolute inset-0 rounded-3xl z-0 pointer-events-none bg-gradient-to-br ${province.color} opacity-20 group-hover:opacity-40 transition-all duration-700 scale-95 group-hover:scale-100 blur-xl group-hover:blur-lg`} />
                {/* Card content */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="stat-number text-5xl md:text-6xl font-black mb-4 gradient-text select-none">
                    0
                  </div>
                  <div className="stat-label text-xl font-light text-gray-200 mb-2">
                    Used Bookstores
                  </div>
                  <div className="stat-location text-2xl font-bold text-white">
                    {province.name}
                  </div>
                </div>
              </div>
            );
          })}
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

export default ScrollTriggeredStats; 