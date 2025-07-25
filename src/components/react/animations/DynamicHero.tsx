import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

interface DynamicHeroProps {
  storeCount: number;
}

const DynamicHero: React.FC<DynamicHeroProps> = ({ storeCount }) => {
  const heroRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline();
    // Animate title words
    tl.from('.hero-word', {
      duration: 0.8, // faster
      y: '100%',
      stagger: 0.12, // faster stagger
      ease: 'power4.out'
    })
      .to(subtitleRef.current, {
        duration: 0.6, // faster
        opacity: 1,
        y: 0,
        ease: 'power2.out'
      }, '-=0.3') // overlap more
      .to(ctaRef.current, {
        duration: 0.5, // faster
        opacity: 1,
        y: 0,
        ease: 'power2.out'
      }, '-=0.2'); // overlap more

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

    // Attach geolocation handler for 'Find Near Me'
    const btn = document.getElementById('find-near-me');
    if (btn) {
      btn.addEventListener('click', async function handler(e) {
        e.preventDefault();
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
          alert('Geolocation only works on HTTPS or localhost. Please use a secure connection.');
          return;
        }
        if (!navigator.geolocation) {
          alert('Geolocation is not supported by your browser.');
          return;
        }
        (btn as HTMLButtonElement).disabled = true;
        btn.textContent = 'Locating...';
        navigator.geolocation.getCurrentPosition(
          async function(position) {
            const { latitude, longitude } = position.coords;
            try {
              const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
              const res = await fetch(url);
              const data = await res.json();
              const city = data.address.city || data.address.town || data.address.village || data.address.hamlet;
              const province = data.address.state || data.address.region;
              function slugify(str: string) {
                return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
              }
              if (province) {
                const provinceSlug = slugify(province);
                if (city) {
                  const citySlug = slugify(city);
                  window.location.href = `/${provinceSlug}/${citySlug}`;
                } else {
                  window.location.href = `/${provinceSlug}`;
                }
              } else {
                alert('Could not determine your province.');
              }
            } catch (e) {
              alert('Could not determine your location.');
              console.error(e);
            }
            (btn as HTMLButtonElement).disabled = false;
            btn.textContent = 'Find Near Me';
          },
          function(error) {
            if (error.code === error.PERMISSION_DENIED) {
              alert('Location permission denied. Please allow access to use this feature.');
            } else {
              alert('Unable to retrieve your location.');
            }
            (btn as HTMLButtonElement).disabled = false;
            btn.textContent = 'Find Near Me';
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      });
    }

    return () => {
      tl.kill();
      if (btn) btn.replaceWith(btn.cloneNode(true)); // Remove event listener
    };
  }, []);

  return (
    <section
      ref={heroRef}
      className="hero relative h-screen flex items-center justify-center overflow-hidden bg-black"
      aria-label="Hero section"
    >
      {/* Background with parallax and gradient overlay */}
      <div className="hero-bg absolute inset-0 z-0 bg-[url('/images/bookstore-hero.jpg')] bg-cover bg-center">
        <div className="absolute inset-0 bg-gradient-radial from-blue-900/30 via-purple-900/20 to-black" />
      </div>

      {/* Content */}
      <div className="hero-content text-center z-10 relative max-w-4xl w-full px-4">
        <h1
          ref={titleRef}
          className="text-[clamp(3rem,10vw,8rem)] font-black leading-[0.9] mb-8 select-none"
        >
          <div className="overflow-hidden">
            <span className="hero-word block transform translate-y-full">BORN</span>
          </div>
          <div className="overflow-hidden">
            <span className="hero-word block gradient-text transform translate-y-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-400 bg-clip-text text-transparent">AGAIN</span>
          </div>
          <div className="overflow-hidden">
            <span className="hero-word block transform translate-y-full">BOOKS</span>
          </div>
        </h1>

        <p
          ref={subtitleRef}
          className="hero-subtitle text-[clamp(1.2rem,3vw,2rem)] font-light opacity-0 translate-y-12 max-w-2xl mx-auto mb-8"
        >
          Discover {storeCount}+ independent bookstores across Canada
        </p>

        <div
          ref={ctaRef}
          className="hero-cta flex flex-col sm:flex-row gap-4 justify-center items-center opacity-0 translate-y-8"
        >
          <a
            href="/stores"
            className="cta-button bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            tabIndex={0}
            aria-label="Explore Bookstores"
          >
            Explore Bookstores
          </a>
          <button
            id="find-near-me"
            type="button"
            className="cta-button bg-gradient-to-r from-blue-500 to-purple-500 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            tabIndex={0}
            aria-label="Find Near Me"
          >
            Find Near Me
          </button>
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

export default DynamicHero; 