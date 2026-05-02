import StarField from '@/components/StarField';
import HeroSection from '@/components/HeroSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import PrizesSection from '@/components/PrizesSection';
import StatsSection from '@/components/StatsSection';
import SocialTasksSection from '@/components/SocialTasksSection';
import CTASection from '@/components/CTASection';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Animated star background */}
      <StarField />
      
      {/* Page content */}
      <div className="relative z-10">
        <HeroSection />
        <HowItWorksSection />
        <PrizesSection />
        <StatsSection />
        <SocialTasksSection />
        <CTASection />
        <Footer />
      </div>
    </div>
  );
};

export default Index;
