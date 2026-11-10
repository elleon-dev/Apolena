import Image from "next/image";

interface LogoProps {
  variant?: "full" | "icon";
  tone?: "normal" | "gold" | "light";
  className?: string;
}

export default function Logo({
  variant = "full",
  tone = "normal",
  className = "",
}: LogoProps) {
  const src =
    tone === "gold"
      ? "/logo-gold.png"
      : tone === "light"
      ? "/logo-light.png"
      : "/logo.png";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src={src}
        alt="Apolena Logo"
        width={variant === "full" ? 110 : 56}
        height={variant === "full" ? 88 : 45}
        className="object-contain animate-fade-in"
        priority
      />
    </div>
  );
}
