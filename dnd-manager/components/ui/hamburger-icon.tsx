"use client";

interface HamburgerIconProps {
  isOpen?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function HamburgerIcon({ 
  size = 'md',
  className = '' 
}: HamburgerIconProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  };

  return (
    <div 
      className={`${sizeClasses[size]} bg-[var(--cyber-cyan)] ${className}`}
      style={{
        maskImage: `url(/icons/menu-24.png)`,
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskImage: `url(/icons/menu-24.png)`,
        WebkitMaskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center'
      }}
    />
  );
}
