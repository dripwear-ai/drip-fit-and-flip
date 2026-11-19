import { createFileRoute } from "@tanstack/react-router";
import { FeatureIntro } from "@/components/drip/ComingSoon";

export const Route = createFileRoute("/ootd/try-on")({
  head: () => ({
    meta: [
      { title: "3D Virtual Try-On — Drip" },
      { name: "description", content: "Enter your measurements to build a 3D twin and see exactly how each piece fits." },
      { property: "og:title", content: "3D Virtual Try-On — Drip" },
      { property: "og:description", content: "Your exact body, in 3D, wearing every piece." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <FeatureIntro kicker="3D Try-On" title={<>Meet your <em className="text-primary">3D twin.</em></>}>
      <p>Enter your height, chest, waist, hips and inseam. Drip builds a digital print of your body and shows every piece on it in 3D.</p>
    </FeatureIntro>
  ),
});
