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

export const STUDIO_SCHEMA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ProfessionalService",
      "@id": `${STUDIO_URL}/#organization`,
      name: "Koinophobia Labs",
      url: `${STUDIO_URL}/`,
      logo: `${STUDIO_URL}/koi-mark.png`,
      image: `${STUDIO_URL}/koi-mark.png`,
      email: "koinophobia999@gmail.com",
      founder: { "@id": "https://koinophobia.dev/#person" },
      sameAs: [LINKS.github],
      areaServed: [
        { "@type": "City", name: "Chicago" },
        { "@type": "Country", name: "United States" },
      ],
      description: STUDIO_DESCRIPTION,
    },
    {
      "@type": "Person",
      "@id": "https://koinophobia.dev/#person",
      name: "Blake Taylor",
      url: "https://koinophobia.dev/",
      sameAs: [LINKS.linkedin],
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
