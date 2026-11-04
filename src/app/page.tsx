import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import SliderSection from '@/components/SliderSection';
import ResultSection from '@/components/ResultSection';
import FaqSection from '@/components/FaqSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FAF6F0] text-[#1C1B1A]">
      <Header />
      <HeroSection />
      <SliderSection />
      <ResultSection />
      <TestimonialsSection />
      <FaqSection />
      <Footer />
    </main>
  );
}