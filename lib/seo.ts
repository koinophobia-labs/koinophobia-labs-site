import { LINKS } from "@/lib/links";

export const STUDIO_URL = "https://koinophobialabs.com";

export const STUDIO_TITLE = "Koinophobia Labs";

export const STUDIO_DESCRIPTION =
  "A one-person software studio in Chicago. Three apps on the App Store, a curriculum engine, a language model trained from scratch, and a builder you can hire.";

export const STUDIO_SOCIAL_IMAGE = {
  url: "/brand/social-card",
  width: 1200,
  height: 630,
  alt: "Koinophobia Labs: two koi circling in black water with a violet pulse",
};

// Update this only when the studio homepage materially changes. A stable,
// truthful date is a better recrawl signal than a build-time timestamp that
// changes on every deployment.
export const STUDIO_HOME_LAST_MODIFIED = "2026-09-13";

export const PERSON_ID = `${STUDIO_URL}/blake#person`;

/** The social card for a page: the koi plate with this title set in Sora. */
export function socialCard(title: string, kicker?: string) {
  const params = new URLSearchParams({ title });
  if (kicker) params.set("kicker", kicker);
  return {
    url: `/brand/social-card?${params.toString()}`,
    width: 1200,
    height: 630,
    alt: `${title} · Koinophobia Labs`,
  };
}

/**
 * One entity graph: the studio (an Organization, not a ProfessionalService —
 * it ships products), the founder, and the website. Each shipped app adds
 * its own SoftwareApplication node on its page and points back here.
 */
export const STUDIO_SCHEMA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${STUDIO_URL}/#organization`,
      name: "Koinophobia Labs",
      url: `${STUDIO_URL}/`,
      logo: `${STUDIO_URL}/koi-mark.png`,
      image: `${STUDIO_URL}/koi-mark.png`,
      email: "koinophobia999@gmail.com",
      founder: { "@id": PERSON_ID },
      numberOfEmployees: { "@type": "QuantitativeValue", value: 1 },
      sameAs: [LINKS.github, "https://www.instagram.com/koinophobia_labs/"],
      address: { "@type": "PostalAddress", addressLocality: "Chicago", addressRegion: "IL", addressCountry: "US" },
      description: STUDIO_DESCRIPTION,
    },
    {
      "@type": "Person",
      "@id": PERSON_ID,
      name: "Blake Taylor",
      url: `${STUDIO_URL}/blake`,
      jobTitle: "Founder",
      sameAs: [LINKS.linkedin, LINKS.github],
      worksFor: { "@id": `${STUDIO_URL}/#organization` },
    },
    {
      "@type": "WebSite",
      "@id": `${STUDIO_URL}/#website`,
      url: `${STUDIO_URL}/`,
      name: "Koinophobia Labs",
      publisher: { "@id": `${STUDIO_URL}/#organization` },
      inLanguage: "en-US",
    },
  ],
};
