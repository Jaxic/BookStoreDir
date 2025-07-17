import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

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
      rotationX: 15
    }, {
      y: 0,
      opacity: 1,
      rotationX: 0,
      duration: 1,
      stagger: 0.2,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 70%',
        end: 'bottom 30%',
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
          duration: 2,
          ease: 'power2.out',
          snap: { textContent: 1 },
          scrollTrigger: {
            trigger: card,
            start: 'top 80%',
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
    <section ref={sectionRef} className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-6xl font-black text-center mb-16">
          Bookstores <span className="gradient-text">Across</span> Canada
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {provinces.map((province, index) => (
            <div
              key={province.name}
              ref={el => { if (el) cardsRef.current[index] = el; }}
              className="group relative"
            >
              {/* Gradient background */}
              <div className={
                `absolute inset-0 bg-gradient-to-br ${province.color}
                rounded-2xl opacity-20 group-hover:opacity-40
                transition-all duration-700 scale-95 group-hover:scale-100
                blur-xl group-hover:blur-lg`
              } />
              
              {/* Card content */}
              <div className="relative glass rounded-2xl p-8 hover:border-white/20 transition-all duration-700">
                <div className="stat-number text-4xl md:text-5xl font-black mb-4 gradient-text">
                  0
                </div>
                <div className="text-xl font-light text-gray-300 mb-2">
                  Bookstores
                </div>
                <div className="text-2xl font-bold">
                  {province.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ScrollTriggeredStats; 