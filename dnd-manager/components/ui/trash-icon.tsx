"use client";

interface TrashIconProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function TrashIcon({ 
  size = 'md',
  className = '' 
}: TrashIconProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  };

  return (
    <div 
      className={`${sizeClasses[size]} ${className}`}
      style={{
        maskImage: `url(/icons/trash-24.png)`,
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskImage: `url(/icons/trash-24.png)`,
        WebkitMaskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center'
      }}
    />
  );
}
