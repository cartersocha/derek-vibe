"use client";

interface PlusIconProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function PlusIcon({ 
  size = 'md',
  className = '' 
}: PlusIconProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  };

  return (
    <div 
      className={`${sizeClasses[size]} bg-black ${className}`}
      style={{
        maskImage: `url(/icons/plus-24.png)`,
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskImage: `url(/icons/plus-24.png)`,
        WebkitMaskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center'
      }}
    />
  );
}
