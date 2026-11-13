import configuredApps from './apps.json';
export type AdditionalOfferConfig = {identifier:string; offerId?:string; settingKey?:string};
export type ProductConfig = {id:string; resourceId:string; kind:'subscription'|'one_time'|'consumable'; offerId?:string; additionalOffers?:AdditionalOfferConfig[]};
export type AppConfig = { key: string; bundleId: string; appAppleId: number; offerIdentifiers: string[]; products?:ProductConfig[]; oneTimeProductIds?:string[]; revenueShare?:boolean };
export function apps(): AppConfig[] {
  const value = JSON.parse(process.env.APPSTORE_APPS_JSON || JSON.stringify(configuredApps)) as AppConfig[];
  if (!Array.isArray(value) || !value.length || value.length > 30) throw Error('APPSTORE_CONFIG_REQUIRED');
  for (const a of value) {
    if (!/^[a-z0-9-]{1,60}$/.test(a.key) || typeof a.bundleId !== 'string' || !a.bundleId || !Number.isSafeInteger(a.appAppleId) || a.appAppleId <= 0 || !Array.isArray(a.offerIdentifiers) || (!a.offerIdentifiers.length && !a.revenueShare) || a.offerIdentifiers.some(x => typeof x !== 'string' || !x)) throw Error('APPSTORE_CONFIG_INVALID');
    for (const p of a.products || []) {
      if (p.additionalOffers === undefined) continue;
      if (!Array.isArray(p.additionalOffers) || p.additionalOffers.length > 10) throw Error('APPSTORE_CONFIG_INVALID');
      const identifiers = new Set<string>();
      for (const offer of p.additionalOffers) {
        if (!offer || !a.offerIdentifiers.includes(offer.identifier) || identifiers.has(offer.identifier) ||
            (!!offer.offerId === !!offer.settingKey) ||
            (offer.offerId !== undefined && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(offer.offerId)) ||
            (offer.settingKey !== undefined && !/^appstore-offer:[a-z0-9-]+:[a-z0-9-]+$/.test(offer.settingKey))) throw Error('APPSTORE_CONFIG_INVALID');
        identifiers.add(offer.identifier);
      }
    }
  }
  if (new Set(value.map(a => a.bundleId)).size !== value.length || new Set(value.map(a => a.key)).size !== value.length) throw Error('APPSTORE_CONFIG_DUPLICATE');
  return value;
}
export function required(name: string) {
  const value = process.env[name];
  if (!value) throw Error('APPSTORE_CONFIG_REQUIRED');
  return value;
}
