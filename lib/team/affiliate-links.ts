// Exact public redemption links from SalesPrivate/affiliates/messiah/AFFILIATE-KIT.md.
// Other affiliates never inherit Messiah's attribution code.
export const affiliateApps = [
  { key: 'trendi', app: 'Trendi: Content Coach', id: '6776299336', product: 'Pro monthly' },
  { key: 'preaching-to-the-choir', app: 'Preaching to the Choir', id: '6808442357', product: 'Keeper monthly' },
  { key: 'forget-about-it', app: 'ForgetAboutIt', id: '6804360983', product: 'Plus monthly' },
  { key: 'teachers-pet', app: "Teacher's Pet Personal School", id: '6808981717', product: 'Family monthly' },
  { key: 'way-in', app: 'Way In: Resume & Job Search', id: '6807942376', product: 'Resume Toolkit' },
  { key: 'old-dog', app: 'Old Dog', id: '6813966822', product: 'All courses' },
  { key: 'dreamcatcher', app: 'Dreamcatcher: Lucid Dreams', id: '6821750717', product: 'Lucid Toolkit' },
] as const;
// App Store Connect provider token: a public number that every App Store
// campaign link carries (App Analytics > Campaigns > Generate a Campaign Link).
export const PROVIDER_TOKEN: string | null = '128904934'; // read from App Store Connect's campaign link generator, 2026-11-24

// Plain App Store links tagged with Messiah's campaign. Purchases through these
// are link-attributed (settled monthly from Apple's campaign reports), unlike
// code purchases. Empty until the provider token is known.
export function campaignLinks(id: string, pt: string | null = PROVIDER_TOKEN) {
  if (id !== 'messiah' || !pt || !/^[0-9]{4,12}$/.test(pt)) return [];
  return affiliateApps.map(a => ({ app: a.app, url: `https://apps.apple.com/app/apple-store/id${a.id}?pt=${pt}&ct=saiikhotic&mt=8` }));
}

export function affiliateLinks(id: string) {
  return id === 'messiah' ? affiliateApps.map(a => ({
    app: a.app, url: `https://apps.apple.com/redeem?ctx=offercodes&id=${a.id}&code=SAIIKHOTIC`,
  })) : [];
}
