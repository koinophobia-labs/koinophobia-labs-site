import type { Metadata } from "next";
import LabPage from "@/components/site/LabPage";
import { getSiteProduct } from "@/lib/products";
import { STUDIO_URL, socialCard } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Teacher's Pet",
  description:
    "A homeschool for one computer. A mapped K–12 curriculum of 1,273 objectives, with the first course, Algebra Foundations, running as a Mac app today.",
  alternates: { canonical: `${STUDIO_URL}/lab/teachers-pet` },
  openGraph: { url: `${STUDIO_URL}/lab/teachers-pet`, images: [socialCard("A homeschool for one computer.", "The lab")] },
};

export default function TeachersPetPage() {
  const product = getSiteProduct("teachers-pet")!;
  return (
    <LabPage
      product={product}
      kicker="Teacher's Pet · Education · macOS"
      h1="A homeschool for one computer."
      lede="The ambition is a full K–12 education that runs on a Mac and never asks a parent to be the teacher. The map exists. The school is being built one course at a time."
      stats={[
        { value: "13", label: "grades" },
        { value: "4", label: "subjects" },
        { value: "52", label: "courses" },
        { value: "318", label: "units" },
        { value: "1,273", label: "objectives" },
      ]}
      sections={[
        {
          kicker: "Built so far",
          title: "One course, end to end.",
          body: (
            <>
              <p className="lede">
                <strong>Algebra Foundations</strong> is the first complete course: four lessons,
                guided practice, independent checks, cumulative review, explicit unlocks, and save
                and resume on device.
              </p>
              <p>
                100 objectives are complete; 864 have had substantive review across 36 courses. The
                registry calls itself a structurally validated draft map and claims no alignment
                with any jurisdiction, no credit, and no learning outcome. So does this page.
              </p>
            </>
          ),
        },
        {
          kicker: "The two numbers",
          title: "1,273 is the size of the promise. 100 is the size of the product.",
          body: (
            <p className="lede">
              Both numbers stay on this page until they match. The map is sealed and versioned so
              every objective has one identity, and the inventory counts against it instead of
              against a mood.
            </p>
          ),
        },
      ]}
      next="Grade 7 synchronisation evidence was recorded on 13 September 2026. The next milestone is a second complete course and a TestFlight upload."
    />
  );
}
