export const LINKS = {
  email: "mailto:koinophobia999@gmail.com",
  site: "https://koinophobia-labs.vercel.app",
  labs: "https://koinophobialabs.com",
  instagram: "https://instagram.com/b.la.ke7",
  tiktok: "https://www.tiktok.com/@.koinophobia",
  linkedin: "https://linkedin.com/in/bt77",
  github: "https://github.com/koinophobia-labs",
  careerForge: "https://career-forge-lite.vercel.app",
  ykbTestflight: "",
  ykbDemo: "https://you-know-ball-orpin.vercel.app",
  ykbPrivacy: "/you-know-ball/privacy",
  ykbSupport: "/you-know-ball/support",
  ykbSafety: "/you-know-ball/safety",
} as const;

export const hasLink = (k: keyof typeof LINKS) => Boolean(LINKS[k]);
export const link = (k: keyof typeof LINKS) => LINKS[k] || "#contact";
