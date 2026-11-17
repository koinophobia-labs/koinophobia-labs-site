import type { Rendered } from './model.js';
export interface BrowserOptions {
    executablePath?: string;
    args?: string[];
    navigationPolicy?: (url: string) => Promise<unknown>;
    respectRobots?: boolean;
}
export declare function openBrowser(options?: BrowserOptions): Promise<{
    render(raw: string, mobile: boolean): Promise<Rendered>;
    close: () => Promise<void>;
}>;
export declare function snapshotDOM(): {
    url: string;
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
    actionLabels: Record<string, string>;
    links: string[];
    notes: {
        name: string;
        detail: string;
    }[];
    mixedBroken: number;
    brokenImages: string[];
};
export declare function snapshotResolution(): {
    finishedContent: boolean;
    loadedImages: string[];
    socialLinks: {
        label: string;
        href: string;
    }[];
    contactAboveFold: boolean;
    primaryTargetsComfortable: boolean;
    primaryTextReadable: boolean;
};
