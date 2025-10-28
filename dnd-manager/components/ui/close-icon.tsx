"use client";

interface CloseIconProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function CloseIcon({ 
  size = 'md',
  className = '' 
}: CloseIconProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  };

  return (
    <div 
      className={`${sizeClasses[size]} bg-[var(--cyber-cyan)] opacity-60 ${className}`}
      style={{
        maskImage: `url(/icons/close-24.png)`,
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskImage: `url(/icons/close-24.png)`,
        WebkitMaskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center'
      }}
    />
  );
}
