import Image from 'next/image';

interface LogoProps {
  variant?: 'full' | 'icon';
  className?: string;
}

export default function Logo({ variant = 'full', className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/logo.png"
        alt="Apolena Logo"
        width={variant === 'full' ? 140 : 40}
        height={variant === 'full' ? 140 : 40}
        className="object-contain animate-fade-in"
        priority
      />
    </div>
  );
}
