import { type BrowserOptions } from './browser.js';
import { type Audit, type Observation, type Finding } from './model.js';
export * from './model.js';
export { safeUrl, publicAddress, tlsCheck } from './network.js';
export { openBrowser } from './browser.js';
export type { BrowserOptions } from './browser.js';
export interface AuditOptions extends BrowserOptions {
    previous?: Observation[];
    actionUrls?: string[];
    includeHomeAsAction?: boolean;
    maxLinks?: number;
}
export declare function auditSite(raw: string, options?: AuditOptions): Promise<Audit>;
export declare function confirmedFindings(result: Audit): Finding[];
