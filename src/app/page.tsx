import Header from "@/components/Header";
import StepsSection from "@/components/StepsSection";
import FaqSection from "@/components/FaqSection";
import TestimonialsSection from "@/components/TestimonialsSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FAF6F0] text-[#1C1B1A]">
      <Header />
      <StepsSection />
      <TestimonialsSection />
      <FaqSection />
      <Footer />
    </main>
  );
}
