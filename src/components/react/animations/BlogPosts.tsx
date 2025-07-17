import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface BlogPost {
  image: string;
  date: string;
  title: string;
  excerpt: string;
  author: string;
  url: string;
}

interface Props {
  posts: BlogPost[];
}

const BlogPosts: React.FC<Props> = ({ posts }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    gsap.fromTo(cardsRef.current, {
      y: 100,
      opacity: 0,
      rotationX: 15
    }, {
      y: 0,
      opacity: 1,
      rotationX: 0,
      duration: 1,
      stagger: 0.15,
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
  }, [posts]);

  return (
    <section ref={sectionRef} className="blog-section py-32 px-4 bg-[#111]">
      <div className="blog-container max-w-7xl mx-auto">
        <h2 className="blog-title text-center font-black text-[clamp(3rem,8vw,6rem)] mb-16">
          Latest <span className="gradient-text">Blog</span> Posts
        </h2>
        <div className="blog-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {posts.map((post, i) => (
            <div
              key={post.url}
              ref={el => { if (el) cardsRef.current[i] = el; }}
              className="blog-card-anim-wrapper"
            >
              <article
                className="blog-card bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl overflow-hidden shadow-xl transform transition-all duration-300 hover:scale-105 hover:border-blue-400/40 focus-within:scale-105 focus-within:border-blue-400/40 cursor-pointer"
                tabIndex={0}
                aria-label={post.title}
                onClick={() => window.location.href = post.url}
                onKeyDown={e => { if (e.key === 'Enter') window.location.href = post.url; }}
                role="link"
              >
                <div
                  className="blog-image h-56 bg-cover bg-center relative"
                  style={{ backgroundImage: `url('${post.image}')` }}
                >
                  <div className="blog-date absolute top-4 right-4 bg-black/70 px-4 py-2 rounded-full text-xs font-bold text-white">
                    {post.date}
                  </div>
                </div>
                <div className="blog-content p-6 flex flex-col h-full">
                  <h3 className="blog-card-title text-2xl font-bold mb-3 leading-tight line-clamp-2 text-white">
                    {post.title}
                  </h3>
                  <p className="blog-excerpt text-white/70 mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="blog-author flex items-center justify-between text-white/60 text-sm mt-auto">
                    <span>By {post.author}</span>
                    <a href={post.url} className="read-more text-blue-400 font-semibold hover:underline" tabIndex={-1}>
                      Read More →
                    </a>
                  </div>
                </div>
              </article>
            </div>
          ))}
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

export default BlogPosts; 