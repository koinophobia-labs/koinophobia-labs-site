import { preachingRelease } from "./releases";
import { STUDIO_URL } from "./seo";

/**
 * Preaching to the Choir prayer-group invite links.
 *
 * An invite looks like https://koinophobialabs.com/ptc/join#<secret>. The
 * secret lives only in the URL fragment, which browsers never send to the
 * server. The page reads it on the client to hand it to the app and does
 * nothing else with it: no logging, no analytics, no storage.
 */
export const PTC_INVITE_PATH = "/ptc/join";
export const PTC_INVITE_URL = `${STUDIO_URL}${PTC_INVITE_PATH}`;
export const PTC_INVITE_OG_IMAGE = `${STUDIO_URL}/ptc/invite-og.jpg`;

export const PTC_APP_STORE_ID = "6808442357";
export const PTC_APP_STORE_URL = preachingRelease.url;
export const PTC_ANDROID_PACKAGE = "com.koinophobialabs.preachingtothechoir";
export const PTC_PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${PTC_ANDROID_PACKAGE}`;
export const PTC_APPLE_APP_ID = "3TY4W55YC5.com.koinophobialabs.preachingtothechoir";
export const PTC_CUSTOM_SCHEME_JOIN = "ptc://join";

/** The fragment without its leading "#", or "" when there is none. */
export function inviteSecretFromHash(hash: string): string {
  return hash.startsWith("#") ? hash.slice(1) : hash;
}

/** Deep links that carry the same fragment, never a query string. */
export function inviteAppLinks(secret: string) {
  return {
    universal: `${PTC_INVITE_URL}#${secret}`,
    scheme: `${PTC_CUSTOM_SCHEME_JOIN}#${secret}`,
  };
}
