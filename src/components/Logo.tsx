import Image from "next/image";

interface LogoProps {
  variant?: "full" | "icon";
  className?: string;
}

export default function Logo({ variant = "full", className = "" }: LogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/logo1.png"
        alt="Apolena Logo"
        width={variant === "full" ? 180 : 56}
        height={variant === "full" ? 60 : 56}
        className="object-contain animate-fade-in"
        priority
      />
    </div>
  );
}
