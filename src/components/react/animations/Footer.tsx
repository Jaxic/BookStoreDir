import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface FooterLink {
  label: string;
  href: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

interface Props {
  brand: string;
  description: string;
  sections: FooterSection[];
  copyright: string;
  tagline: string;
}

const Footer: React.FC<Props> = ({ brand, description, sections, copyright, tagline }) => {
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
        start: 'top 80%'
      }
    });
    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  return (
    <footer ref={sectionRef} className="footer bg-gradient-to-r from-blue-700 via-purple-700 to-pink-700 text-white pt-20 pb-10 px-4">
      <div ref={contentRef} className="footer-content max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
        <div className="footer-section">
          <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="footer-logo text-3xl">📚</span> {brand}
          </h3>
          <p className="footer-description text-white/80 leading-relaxed">
            {description}
          </p>
        </div>
        {sections.map(section => (
          <div key={section.title} className="footer-section">
            <h3 className="text-xl font-semibold mb-4">{section.title}</h3>
            <ul className="footer-links space-y-2">
              {section.links.map(link => (
                <li key={link.href}>
                  <a href={link.href} className="text-white/80 hover:text-white transition-colors" tabIndex={0}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="footer-bottom border-t border-white/20 pt-8 text-center">
        <p className="mb-2">{copyright}</p>
        <p className="text-white/70 text-sm">{tagline}</p>
      </div>
    </footer>
  );
};

export default Footer; 