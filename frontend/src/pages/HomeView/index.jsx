import Header         from "@/widgets/Header";
import Footer         from "@/widgets/Footer";
import HeroSection    from "@/widgets/HeroSection";
import StatsSection   from "@/widgets/StatsSection";
import CategoriesSection  from "@/widgets/CategoriesSection";
import CoursesSection     from "@/widgets/CoursesSection";
import TestimonialsSection from "@/widgets/TestimonialsSection";
import CtaSection     from "@/widgets/CTASection";

import s from "./HomeView.module.css";

const HomePage = () => (
  <div className={s.root}>
    <Header />

    <main className={s.main}>
      <HeroSection />
      <StatsSection />
      <CategoriesSection />
      <CoursesSection />
      <TestimonialsSection />
      <CtaSection />
    </main>

    <Footer />
  </div>
);

export default HomePage;