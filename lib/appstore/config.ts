import configuredApps from './apps.json';
export type AppConfig = { key: string; bundleId: string; appAppleId: number; offerIdentifiers: string[] };
export function apps(): AppConfig[] {
  const value = JSON.parse(process.env.APPSTORE_APPS_JSON || JSON.stringify(configuredApps)) as AppConfig[];
  if (!Array.isArray(value) || !value.length || value.length > 30) throw Error('APPSTORE_CONFIG_REQUIRED');
  for (const a of value) {
    if (!/^[a-z0-9-]{1,60}$/.test(a.key) || typeof a.bundleId !== 'string' || !a.bundleId || !Number.isSafeInteger(a.appAppleId) || a.appAppleId <= 0 || !Array.isArray(a.offerIdentifiers) || !a.offerIdentifiers.length || a.offerIdentifiers.some(x => typeof x !== 'string' || !x)) throw Error('APPSTORE_CONFIG_INVALID');
  }
  if (new Set(value.map(a => a.bundleId)).size !== value.length || new Set(value.map(a => a.key)).size !== value.length) throw Error('APPSTORE_CONFIG_DUPLICATE');
  return value;
}
export function required(name: string) {
  const value = process.env[name];
  if (!value) throw Error('APPSTORE_CONFIG_REQUIRED');
  return value;
}
