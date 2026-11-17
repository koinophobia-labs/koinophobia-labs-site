export declare const VERSION = "2.1.4-fulfillment.2";
export declare const LINK_DELAY_MS = 600000;
export type Check = 'Dead contact / booking / order link' | 'Closed Google Form' | 'HTTPS failure' | 'Mobile layout' | 'Slow page' | 'Unfinished content' | 'Wrong key link' | 'Broken image' | 'Booking widget failure' | 'Expiring certificate' | 'Insecure form' | 'Mobile contact route' | 'Lighthouse mobile performance';
export interface Proof {
    url: string;
    captured_at: string;
    viewport: {
        width: number;
        height: number;
    };
    sha256: string;
    image: string;
    path?: string;
}
export interface Observation {
    label?: string;
    page_name?: string;
    run_id: string;
    check: Check;
    key: string;
    url: string;
    measured_at: string;
    measurement: string;
    proof?: Proof;
    impact?: string;
    verify_url?: string;
    leverage?: number;
}
export interface Finding extends Observation {
    confidence: 'confirmed' | "couldn't verify";
    observations: Observation[];
    reason?: string;
}
export interface Note {
    name: string;
    detail: string;
}
export interface Rendered {
    url: string;
    status: number;
    title: string;
    heading: string;
    text: string;
    html: string;
    viewportMeta: string;
    width: number;
    screen: number;
    scale: number;
    overflow: number;
    overlaps: number;
    lcp: number | null;
    load: number | null;
    links: string[];
    notes: Note[];
    mixedBroken: number;
    error?: string;
    incomplete?: boolean;
    proof?: Proof;
    actionLabels?: Record<string, string>;
    signals?: Signal[];
    resolution?: ResolutionEvidence;
}
export interface Signal {
    check: Check;
    key: string;
    measurement: string;
    impact: string;
    verify_url?: string;
    proof?: Proof;
    elementIndex?: number;
    asset?: string;
}
export interface Audit {
    version: string;
    run_id: string;
    url: string;
    final_url: string;
    measured_at: string;
    findings: Finding[];
    notes: Note[];
    observations: Observation[];
    samples: {
        lcp: number | null;
        load: number | null;
    }[];
    home?: Rendered;
    retry_after?: string;
    certificate?: {
        expires_at: string;
        fingerprint: string;
    };
}
export declare const median: (values: number[]) => number;
export declare function blocked(p: Pick<Rendered, 'status' | 'title' | 'heading' | 'text'>): boolean;
export declare function linkProblem(p: Rendered): {
    check: Check;
    key: string;
    measurement: string;
} | null;
export declare function layoutProblems(p: Rendered): {
    key: string;
    measurement: string;
}[];
export declare function slowProblem(samples: Rendered[]): {
    key: string;
    measurement: string;
} | null;
export declare function confirm(current: Observation[], previous?: Observation[]): Finding[];
export declare function validProof(p: Proof | undefined): boolean;
export declare function isConfirmed(f: {
    confidence?: string;
    observations?: Observation[];
    proof?: Proof;
    check?: string;
    key?: string;
    url?: string;
}): boolean;
export declare function leverageScore(f: Pick<Observation, 'check' | 'verify_url'>): number;
export declare function rankFindings<T extends Observation>(findings: T[]): T[];
export declare function impactLine(f: Pick<Observation, 'check' | 'impact'>): string;
export declare function verifyLink(f: Pick<Observation, 'url' | 'verify_url' | 'check'>): string;
export interface ResolutionEvidence {
    finishedContent: boolean;
    loadedImages: string[];
    socialLinks: {
        label: string;
        href: string;
    }[];
    contactAboveFold: boolean;
    primaryTargetsComfortable: boolean;
    primaryTextReadable: boolean;
}
