import React, { useEffect, useRef } from 'react';

const CursorFollower: React.FC = () => {
  const followerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const moveFollower = (e: MouseEvent) => {
      if (followerRef.current) {
        followerRef.current.style.left = `${e.clientX - 10}px`;
        followerRef.current.style.top = `${e.clientY - 10}px`;
      }
    };
    window.addEventListener('mousemove', moveFollower);
    return () => {
      window.removeEventListener('mousemove', moveFollower);
    };
  }, []);

  return <div ref={followerRef} className="cursor-follower" />;
};

export default CursorFollower; 