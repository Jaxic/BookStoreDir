import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

const DynamicHero: React.FC = () => {
  const heroRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const tl = gsap.timeline();
    
    // Animate title words
    tl.from('.hero-word', {
      duration: 1.2,
      y: '100%',
      stagger: 0.2,
      ease: 'power4.out'
    })
    .to(subtitleRef.current, {
      duration: 1,
      opacity: 1,
      y: 0,
      ease: 'power2.out'
    }, '-=0.5');

    // Parallax effect on scroll
    gsap.to('.hero-bg', {
      yPercent: 50,
      scrollTrigger: {
        trigger: heroRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: 1
      }
    });

    gsap.to('.hero-content', {
      yPercent: -30,
      scrollTrigger: {
        trigger: heroRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: 1
      }
    });

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <section 
      ref={heroRef}
      className="hero relative h-screen flex items-center justify-center overflow-hidden"
    >
      {/* Background with parallax */}
      <div className="hero-bg absolute inset-0 bg-gradient-radial from-blue-900/30 via-purple-900/20 to-black" />
      
      {/* Content */}
      <div className="hero-content text-center z-10 relative">
        <h1 
          ref={titleRef}
          className="text-6xl md:text-9xl font-black leading-none mb-8"
        >
          <div className="overflow-hidden">
            <span className="hero-word block transform translate-y-full">BORN</span>
          </div>
          <div className="overflow-hidden">
            <span className="hero-word block gradient-text transform translate-y-full">AGAIN</span>
          </div>
          <div className="overflow-hidden">
            <span className="hero-word block transform translate-y-full">BOOKS</span>
          </div>
        </h1>
        
        <p 
          ref={subtitleRef}
          className="text-xl md:text-2xl font-light opacity-0 transform translate-y-12 max-w-3xl mx-auto px-4"
        >
          Discover 270+ independent bookstores across Canada
        </p>
      </div>
    </section>
  );
};

export default DynamicHero; 