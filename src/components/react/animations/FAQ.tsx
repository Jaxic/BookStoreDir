import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface FAQItem {
  question: string;
  answer: string;
}

interface Props {
  faqs: FAQItem[];
}

const FAQ: React.FC<Props> = ({ faqs }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const itemsRef = useRef<HTMLDivElement[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    gsap.fromTo(itemsRef.current, {
      y: 50,
      opacity: 0
    }, {
      y: 0,
      opacity: 1,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: sectionRef.current,
        start: 'top 70%'
      }
    });
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [faqs]);

  return (
    <section ref={sectionRef} className="faq-section py-32 px-4 max-w-4xl mx-auto">
      <h2 className="faq-title text-center font-black text-[clamp(2.5rem,6vw,4rem)] mb-16" style={{textShadow: '0 2px 8px rgba(0,0,0,0.18)'}}>
        <span className="text-white">Frequently Asked </span>
        <span className="gradient-text">Questions</span>
      </h2>
      <div className="faq-grid space-y-6">
        {faqs.map((faq, i) => (
          <div
            key={faq.question}
            ref={el => { if (el) itemsRef.current[i] = el; }}
            className={`faq-item bg-gray-900/80 border border-white/15 rounded-xl p-8 transition-all duration-300 text-white shadow-lg ${openIndex === i ? 'border-blue-400/60 ring-2 ring-blue-400/30' : ''}`}
          >
            <button
              className="faq-question w-full text-left text-xl font-semibold text-white flex justify-between items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
              aria-expanded={openIndex === i}
              aria-controls={`faq-panel-${i}`}
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
            >
              <span>{faq.question}</span>
              <span className={`ml-4 transition-transform ${openIndex === i ? 'rotate-180' : ''}`}>▼</span>
            </button>
            <div
              id={`faq-panel-${i}`}
              className={`faq-answer text-gray-200 mt-4 transition-all duration-300 ${openIndex === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}
              aria-hidden={openIndex !== i}
            >
              {faq.answer}
            </div>
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

export default FAQ; 