import Header from "@/components/Header";
import BannerCarousel from "@/components/BannerCarousel";
import StyleSelectionSection from "@/components/StyleSelectionSection";
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
      {/* 1. Carrusel de Banners / Hero con Franja de Propuesta de Valor */}
      <BannerCarousel />
      {/* 2. Nueva Sección Oficial: Encuentra su estilo */}
      <StyleSelectionSection />
      {/* 3. Cómo Funciona (Pasos) */}
      <StepsSection />
      {/* 4. Quiénes Somos (Fondo Primary #174B3D con Logo Blanco) */}
      <AboutSection />
      {/* 5. Testimonios & Reseñas de Clientes */}
      <TestimonialsSection />
      {/* 6. Contacto & Atención al Cliente */}
      <ContactSection />
      {/* 7. Preguntas Frecuentes */}
      <FaqSection />
      {/* 8. Footer (Fondo Primary #174B3D con Logo Blanco) */}
      <Footer />
    </main>
  );
}
