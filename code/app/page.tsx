import { StitchHeader } from "@/components/marketing/stitch-header";
import { StitchHero } from "@/components/marketing/stitch-hero";
import { StitchDeepStudyScroll } from "@/components/marketing/stitch-deep-study-scroll";
import { StitchRoutine } from "@/components/marketing/stitch-routine";
import { StitchNemoHighlight } from "@/components/marketing/stitch-nemo-highlight";
import { StitchStudyGroups } from "@/components/marketing/stitch-study-groups";
import { StitchClosingCta } from "@/components/marketing/stitch-closing-cta";
import { StitchFooter } from "@/components/marketing/stitch-footer";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#FAF9F6] text-[#292825] flex flex-col selection:bg-[#EEE0BA] selection:text-[#292825]">
      {/* 1. Sticky Navigation Header */}
      <StitchHeader />

      {/* 2. Tactile Hero Section with Interactive Workspace Tabs */}
      <StitchHero />

      {/* 3. Pinned GSAP ScrollTrigger + Three.js Deep Study Full-Screen Experience */}
      <StitchDeepStudyScroll />

      {/* 4. Connected 3-Stage Daily Study Routine */}
      <StitchRoutine />

      {/* 5. Nemo Grounded AI Interactive Citation Demo */}
      <StitchNemoHighlight />

      {/* 6. Distraction-Free Collaborative Study Groups */}
      <StitchStudyGroups />

      {/* 7. Scholar Seal Closing Call-To-Action */}
      <StitchClosingCta />

      {/* 8. Modern Academic Footer */}
      <StitchFooter />
    </main>
  );
}
