import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const cards = [
  {
    icon: '🏘️',
    title: 'Support Local Community',
    desc: 'Every purchase helps support local jobs, community events, and the unique character of your neighborhood.'
  },
  {
    icon: '✨',
    title: 'Curated Selections',
    desc: 'Discover hand-picked books, hidden gems, and personalized recommendations from passionate booksellers.'
  },
  {
    icon: '🎭',
    title: 'Community Events',
    desc: 'Enjoy author readings, book clubs, literary discussions, and other events that bring book lovers together.'
  }
];

const WhyChoose: React.FC = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    gsap.fromTo(cardsRef.current, {
      y: 100,
      opacity: 0
    }, {
      y: 0,
      opacity: 1,
      duration: 1,
      stagger: 0.2,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 70%',
        end: 'bottom 30%'
      }
    });
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <section ref={sectionRef} className="why-choose py-32 px-4 bg-[#111]">
      <h2 className="section-title text-center font-black text-[clamp(2.5rem,6vw,4rem)] mb-12">
        Why Choose <span className="gradient-text">Used Bookstores?</span>
      </h2>
      <p className="text-center max-w-2xl mx-auto mb-16 text-lg text-white/80">
        Used bookstores offer unique experiences that support local communities and foster literary culture.
      </p>
      <div className="why-choose-grid grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto">
        {cards.map((card, i) => (
          <div
            key={card.title}
            ref={el => { if (el) cardsRef.current[i] = el; }}
            className="why-card bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl p-10 text-center shadow-xl transform transition-all duration-700"
            tabIndex={0}
            aria-label={card.title}
          >
            <div className="why-icon w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-3xl">
              {card.icon}
            </div>
            <h3 className="text-2xl font-bold mb-3 text-white">{card.title}</h3>
            <p className="text-white/80 text-base leading-relaxed">{card.desc}</p>
          </div>
        ))}
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

export default WhyChoose; 