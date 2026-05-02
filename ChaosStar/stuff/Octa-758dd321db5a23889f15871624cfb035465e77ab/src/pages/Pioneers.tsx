import PioneersHeroSection from '@/components/PioneersHeroSection';
import PioneersHowItWorksSection from '@/components/PioneersHowItWorksSection';
import PrizesSection from '@/components/PrizesSection';
import SocialTasksSection from '@/components/SocialTasksSection';
import CTASection from '@/components/CTASection';

const Pioneers = () => {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background">
      {/* Page content */}
      <div className="relative z-10">
        <PioneersHeroSection />
        <PioneersHowItWorksSection />
        <PrizesSection />
        <SocialTasksSection />
        <CTASection />
      </div>
    </div>
  );
};

export default Pioneers;
