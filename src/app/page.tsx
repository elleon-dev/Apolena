import Header from "@/components/Header";
import BannerCarousel from "@/components/BannerCarousel";
import StepsSection from "@/components/StepsSection";
import AboutSection from "@/components/AboutSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import ContactSection from "@/components/ContactSection";
import FaqSection from "@/components/FaqSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FFFBF2] text-[#141414]">
      <Header />
      {/* 1. Carrusel de Banners Principal después del Header */}
      <BannerCarousel />
      {/* 2. Cómo Funciona (Pasos) */}
      <StepsSection />
      {/* 3. Quiénes Somos (Fondo Primary #174B3D con Logo Blanco) */}
      <AboutSection />
      {/* 4. Testimonios & Reseñas de Clientes */}
      <TestimonialsSection />
      {/* 5. Contacto & Atención al Cliente */}
      <ContactSection />
      {/* 6. Preguntas Frecuentes */}
      <FaqSection />
      {/* 7. Footer (Fondo Primary #174B3D con Logo Blanco) */}
      <Footer />
    </main>
  );
}
