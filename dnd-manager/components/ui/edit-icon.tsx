"use client";

interface EditIconProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function EditIcon({ 
  size = 'md',
  className = '' 
}: EditIconProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  };

  return (
    <div 
      className={`${sizeClasses[size]} bg-black ${className}`}
      style={{
        maskImage: `url(/icons/edit-24.png)`,
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
        WebkitMaskImage: `url(/icons/edit-24.png)`,
        WebkitMaskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center'
      }}
    />
  );
}
