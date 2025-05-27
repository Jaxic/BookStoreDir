/** @jsxImportSource react */

interface ImageSkeletonProps {
  className?: string;
}

export default function ImageSkeleton({ className = '' }: ImageSkeletonProps) {
  return (
    <div 
      className={`bg-gray-200 animate-pulse relative overflow-hidden ${className}`}
      aria-label="Loading image"
    >
      {/* Shimmer effect - using CSS transform animation */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent transform -translate-x-full"
        style={{
          animation: 'shimmer 2s infinite linear'
        }}
      />
      
      {/* Optional icon overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg 
          className="w-8 h-8 text-gray-400" 
          fill="currentColor" 
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path 
            fillRule="evenodd" 
            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" 
            clipRule="evenodd" 
          />
        </svg>
      </div>

      {/* Custom CSS for shimmer animation */}
      <style>
        {`
          @keyframes shimmer {
            100% {
              transform: translateX(100%);
            }
          }
        `}
      </style>
    </div>
  );
} 