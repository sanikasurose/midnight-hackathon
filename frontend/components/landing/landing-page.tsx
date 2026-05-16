import { LandingAnimations } from "@/components/animation/landing-animations";
import { DemoFlow } from "./demo-flow";
import { Hero } from "./hero";
import { Navbar } from "./navbar";
import { PrivacySection } from "./privacy-section";
import { RolesSection } from "./roles-section";
import { TrustReportSection } from "./trust-report-section";

export function LandingPage() {
  return (
    <LandingAnimations>
      <Navbar />
      <main>
        <Hero />
        <DemoFlow />
        <PrivacySection />
        <TrustReportSection />
        <RolesSection />
      </main>
    </LandingAnimations>
  );
}
