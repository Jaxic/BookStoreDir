# Dynamic Scrolling Experience Implementation Guide
## Born Again Books Website Enhancement

### Overview
This guide will help you implement a sophisticated, cinematic scrolling experience for the Born Again Books website, similar to high-end sites like repeat.studiofreight.com and cal.com.

---

## 🚀 Quick Start

### Prerequisites
- Existing Astro project (bornagainbooks.ca)
- Node.js 18+
- Basic knowledge of React components

### Dependencies to Install

```bash
# Core animation libraries
npm install gsap
npm install framer-motion

# React integration (if not already installed)
npm astro add react
npm astro add tailwind

# Additional utilities
npm install @tailwindcss/line-clamp
npm install clsx
```

---

## 📁 Project Structure

Create the following file structure in your Astro project:

```
src/
├── components/
│   ├── react/
│   │   ├── animations/
│   │   │   ├── DynamicHero.tsx
│   │   │   ├── ParallaxSection.tsx
│   │   │   ├── ScrollTriggeredStats.tsx
│   │   │   ├── InteractiveSearch.tsx
│   │   │   └── BookstoreGrid.tsx
│   │   └── ui/
│   │       ├── CursorFollower.tsx
│   │       └── MarqueeText.tsx
│   └── astro/
│       ├── Layout.astro
│       └── BaseHead.astro
├── pages/
│   └── index.astro
├── styles/
│   └── animations.css
└── utils/
    └── gsap-config.js
```

---

## 🎬 Implementation Steps

### Step 1: Configure GSAP

Create `src/utils/gsap-config.js`:

```javascript
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextPlugin } from 'gsap/TextPlugin';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger, TextPlugin);

// Default GSAP settings
gsap.defaults({
  duration: 1,
  ease: "power2.out"
});

// Refresh ScrollTrigger on route changes (for Astro)
export const refreshScrollTrigger = () => {
  ScrollTrigger.refresh();
};

export { gsap, ScrollTrigger };
```

### Step 2: Create Base Animation Styles

Create `src/styles/animations.css`:

```css
/* Smooth scrolling and base styles */
html {
  scroll-behavior: smooth;
}

body {
  overflow-x: hidden;
  background: #000;
  color: #fff;
}

/* Animation utilities */
.animate-fade-in {
  animation: fadeIn 0.6s ease-out forwards;
}

.animate-slide-up {
  animation: slideUp 0.8s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(50px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes marquee {
  0% { transform: translateX(0%); }
  100% { transform: translateX(-50%); }
}

/* Cursor follower */
.cursor-follower {
  position: fixed;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(59, 130, 246, 0.6);
  pointer-events: none;
  z-index: 9999;
  backdrop-filter: blur(5px);
  transition: all 0.1s ease;
}

/* Glassmorphism effects */
.glass {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Gradient text */
.gradient-text {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

### Step 3: Create the Dynamic Hero Component

Create `src/components/react/animations/DynamicHero.tsx`:

```tsx
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
```

### Step 4: Create Scroll-Triggered Stats Component

Create `src/components/react/animations/ScrollTriggeredStats.tsx`:

```tsx
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
              <div className={`
                absolute inset-0 bg-gradient-to-br ${province.color}
                rounded-2xl opacity-20 group-hover:opacity-40
                transition-all duration-700 scale-95 group-hover:scale-100
                blur-xl group-hover:blur-lg
              `} />
              
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
```

### Step 5: Create Interactive Search Component

Create `src/components/react/animations/InteractiveSearch.tsx`:

```tsx
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
```

### Step 6: Create Marquee Text Component

Create `src/components/react/ui/MarqueeText.tsx`:

```tsx
import React from 'react';

interface Props {
  children: React.ReactNode;
  className?: string;
}

const MarqueeText: React.FC<Props> = ({ children, className = '' }) => {
  return (
    <div className={`overflow-hidden whitespace-nowrap ${className}`}>
      <div className="inline-block animate-marquee">
        <span className="px-8">{children}</span>
        <span className="px-8">{children}</span>
        <span className="px-8">{children}</span>
        <span className="px-8">{children}</span>
      </div>
    </div>
  );
};

export default MarqueeText;
```

### Step 7: Update Your Main Page

Update `src/pages/index.astro`:

```astro
---
import Layout from '../components/Layout.astro';
import DynamicHero from '../components/react/animations/DynamicHero.tsx';
import ScrollTriggeredStats from '../components/react/animations/ScrollTriggeredStats.tsx';
import InteractiveSearch from '../components/react/animations/InteractiveSearch.tsx';
import MarqueeText from '../components/react/ui/MarqueeText.tsx';

// Your existing data
const provinces = [
  { name: 'Ontario', count: 89, color: 'from-blue-500 to-purple-600' },
  { name: 'British Columbia', count: 67, color: 'from-green-500 to-teal-600' },
  { name: 'Quebec', count: 54, color: 'from-red-500 to-pink-600' },
  { name: 'Alberta', count: 32, color: 'from-orange-500 to-red-600' },
  { name: 'Nova Scotia', count: 18, color: 'from-indigo-500 to-blue-600' },
  { name: 'Manitoba', count: 10, color: 'from-purple-500 to-indigo-600' }
];
---

<Layout title="Born Again Books - Used Bookstore Directory">
  <main>
    <!-- Dynamic Hero Section -->
    <DynamicHero client:load />
    
    <!-- Marquee Section -->
    <section class="py-20 border-t border-white/10">
      <MarqueeText 
        client:load 
        className="text-6xl md:text-8xl font-black opacity-20"
      >
        DISCOVER • EXPLORE • READ • REPEAT •
      </MarqueeText>
    </section>
    
    <!-- Stats Section -->
    <ScrollTriggeredStats client:load provinces={provinces} />
    
    <!-- Search Section -->
    <InteractiveSearch client:load />
    
    <!-- Your existing bookstore grid can go here -->
    <!-- with additional animations applied -->
  </main>
</Layout>

<style>
  @import '../styles/animations.css';
  
  .animate-marquee {
    animation: marquee 20s linear infinite;
  }
</style>
```

### Step 8: Update Tailwind Config

Update `tailwind.config.mjs`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'marquee': 'marquee 20s linear infinite',
      }
    },
  },
  plugins: [
    require('@tailwindcss/line-clamp'),
  ],
}
```

---

## 🎨 Customization Options

### Adjusting Animation Timing
- Modify `duration` values in GSAP animations
- Change `stagger` timing for sequential animations
- Adjust `ease` functions for different feels

### Color Schemes
- Update gradient colors in CSS variables
- Modify province color schemes
- Customize glass effect opacity

### Performance Optimization
- Use `will-change: transform` for animated elements
- Implement intersection observers for heavy animations
- Consider reducing motion for users with motion preferences

---

## 🚀 Deployment Notes

### Build Considerations
- GSAP works in both SSR and client-side environments
- Ensure proper client directives on React components
- Test animations on various devices and browsers

### Performance Tips
- Lazy load animation components below the fold
- Use `prefers-reduced-motion` media query for accessibility
- Monitor performance with heavy scroll animations

---

## 🔧 Troubleshooting

### Common Issues
1. **Animations not triggering**: Ensure ScrollTrigger is properly registered
2. **Hydration mismatches**: Use proper client directives in Astro
3. **Performance issues**: Reduce animation complexity on mobile devices

### Debug Tools
- GSAP's built-in debug tools: `ScrollTrigger.create({ markers: true })`
- Browser DevTools Performance tab
- React DevTools for component rendering

---

## 📚 Additional Resources

- [GSAP Documentation](https://greensock.com/docs/)
- [Astro React Integration](https://docs.astro.build/en/guides/integrations-guide/react/)
- [ScrollTrigger Examples](https://greensock.com/scrolltrigger/)
- [Framer Motion Docs](https://www.framer.com/motion/)

---

**Next Steps:**
1. Install dependencies
2. Create file structure
3. Implement components step by step
4. Test on different devices
5. Optimize performance
6. Deploy and monitor

This implementation will give your Born Again Books site the same caliber of dynamic scrolling experience as the reference sites you admired.