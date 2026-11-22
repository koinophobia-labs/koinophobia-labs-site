export declare const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36";
export declare const publicAddress: (s: string) => boolean;
export declare function safeUrl(raw: string): URL;
export declare function resolvePublic(host: string): Promise<import("dns").LookupAddress>;
export declare function proxy(): Promise<{
    url: string;
    errors: Map<string, string>;
    close: () => Promise<void>;
}>;
export declare function tlsCheck(raw: string): Promise<string | null>;
export declare const CERT_ERRORS: Set<string>;
export declare function certificateExpiry(raw: string): Promise<{
    expires_at: string;
    fingerprint: string;
} | null>;
export declare function pinnedGet(raw: string, redirects?: number): Promise<{
    status: number;
    text: string;
}>;
export declare function robotsPolicy(): (raw: string) => Promise<void>;
