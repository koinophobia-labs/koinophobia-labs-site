import { type AppSlug } from "./app-prices";
import { forgetRelease, oldDogRelease, preachingRelease, trendiRelease, wayInRelease } from "./releases";

// Blake controls publication. Never enable prerelease content via deployment environment variables.
// Blake 2026-10-15 (D-0189 addendum): "Publish Coming-soon pages now" for Teacher's Pet and Dreamcatcher.
export const APP_PAGES_PRERELEASE = true;
export function showPrereleaseAppPages() {
  return APP_PAGES_PRERELEASE || (process.env.NODE_ENV === "development" && !process.env.VERCEL && process.env.APP_PAGES_LOCAL_PREVIEW === "1");
}
export type AppHome = {
  slug: AppSlug; name: string; category: string; promise: string; intro: string;
  platforms: string; store?: string; coming?: string; prerelease?: boolean;
  font: "gelasio" | "source" | "newsreader"; landscape?: boolean;
  colors: { paper: string; ink: string; accent: string; surface: string; muted: string };
  features: { title: string; body: string }[]; screens: string[]; free: string; founder: string;
  support: string; privacy: string;
};
export const appHomes: Record<AppSlug, AppHome> = {
  trendi: {
    slug: "trendi", name: "Trendi", category: "A content coach for iPhone", promise: "Say it messy. Make it yours.",
    intro: "A thought, an angle, three hooks. Shape what you want to say into words you can say on camera.",
    platforms: "iPhone", store: trendiRelease.url, font: "gelasio",
    colors: { paper: "#151017", ink: "#F7F2EC", accent: "#D95BA2", surface: "#251E29", muted: "#D6C5D9" },
    features: [
      { title: "Find your opening", body: "Shape This Into a Video gives you one angle and three hooks to choose from." },
      { title: "Keep your voice", body: "Edit the script, caption and shot plan. The words are yours to change." },
      { title: "Press record", body: "Use the teleprompter section by section, or read the full script." },
      { title: "Come back to it", body: "Keep drafts in the on-device Vault and add your own performance notes." },
    ], screens: ["Say it messy", "Shape it into a video", "Pick your hook", "Own the script", "Press record"],
    free: "3 Coach Packs per weekly allowance.",
    founder: "Every product here started as something I needed the week I needed it. Trendi is one of those tools that made it off the list.",
    support: "/trendi/support", privacy: "/trendi/privacy",
  },
  "way-in": {
    slug: "way-in", name: "Way In", category: "Your next application starts here", promise: "Your experience counts.",
    intro: "Turn the work you have actually done into a clear next move. A résumé and application workspace for iPhone and iPad.",
    platforms: "iPhone · iPad", store: wayInRelease.url, font: "source",
    colors: { paper: "#FAF5E6", ink: "#053338", accent: "#0D4A45", surface: "#F7F5ED", muted: "#385254" },
    features: [
      { title: "Start with what is true", body: "Write from your experience or import a résumé. Nothing is invented." },
      { title: "See what fits", body: "Compare your experience with a saved posting: supported items, related experience and gaps." },
      { title: "Keep it together", body: "Saved jobs, résumé versions, application progress, notes and follow-ups in one workspace." },
      { title: "You make the move", body: "No account is required. Way In does not apply on your behalf." },
    ], screens: ["Your profile", "Getting started", "Welcome to Way In", "Today", "Applications"],
    free: "Start your workspace. Resume Toolkit and the 30-Day Career Pass are separate paid purchases.",
    founder: "I started with a list of tools I’d wished existed for years and a Mac. Way In is one of the things that didn’t stay an idea.",
    support: "/way-in/support", privacy: "/way-in/privacy",
  },
  "forget-about-it": {
    slug: "forget-about-it", name: "Forget About It", category: "A place for the thought", promise: "Catch it. Keep your words.",
    intro: "Type it or say it. Keep your exact words in a journal on iPhone and Apple Watch, then carry on with your day.",
    platforms: "iPhone · Apple Watch", store: forgetRelease.url, font: "newsreader",
    colors: { paper: "#F9F3E8", ink: "#281C16", accent: "#A42C1B", surface: "#F0E6D6", muted: "#6E5F52" },
    features: [
      { title: "Catch the thought", body: "Type or dictate on iPhone. Speak, scribble or type on Apple Watch." },
      { title: "Find your words", body: "Return through Today and History, or use text search in Memory." },
      { title: "Read the day back", body: "On-device, rule-based reflections sit visibly apart from your own words." },
      { title: "Take a copy", body: "Plain-text export is included with the free download." },
    ], screens: ["Today in light", "Today in dark", "History", "Memory"],
    free: "Unlimited capture, all history, text search, basic stats, today’s reflection and plain-text export.",
    founder: "I build the tools I needed myself. Forget About It came from that same list, and I still do the design, writing, building and testing.",
    support: "/forget-about-it/support", privacy: "/forget-about-it/privacy",
  },
  "preaching-to-the-choir": {
    slug: "preaching-to-the-choir", name: "Preaching to the Choir", category: "A journal for your prayers", promise: "Pray the way you already do.",
    intro: "Keep a record of what you are praying through, in your own words.",
    platforms: "iPhone · iPad", store: preachingRelease.url, font: "newsreader",
    colors: { paper: "#F4F0E7", ink: "#171B25", accent: "#6B131B", surface: "#FBF9F2", muted: "#5B595B" },
    features: [
      { title: "Your words, as you left them", body: "Write or record a prayer. On-device transcription is optional." },
      { title: "A record to return to", body: "A dated journal with search, reflection notes, names, labels and threads." },
      { title: "Keep a copy", body: "Export with an optional passphrase. Recently Deleted keeps entries for 30 days." },
      { title: "Room for quiet", body: "No account, analytics, ads or tracking. Add an optional device lock." },
    ], screens: ["Today", "Write a prayer", "Your journal", "A prayer in your own words", "Privacy"],
    free: "Every prayer stays yours to keep, read, search and export without Keeper.",
    founder: "Every product here started as something I needed the week I needed it. I’m the one who designs, writes, builds, tests and ships it.",
    support: "/preaching-to-the-choir/support", privacy: "/preaching-to-the-choir/privacy",
  },
  "old-dog": {
    slug: "old-dog", name: "Old Dog", category: "There’s more worth learning next", promise: "Old Dog. New Tricks.",
    intro: "You are never too old to learn something new. Pick a subject and work through it on your Mac.",
    platforms: "Mac", store: oldDogRelease.url, font: "source", landscape: true,
    colors: { paper: "#F5F4F1", ink: "#18243A", accent: "#87421F", surface: "#EEE9E2", muted: "#596476" },
    features: [
      { title: "Start with a subject", body: "Ten courses, from cooking and home maintenance to computer literacy and critical thinking." },
      { title: "Learn. Practise. Demonstrate.", body: "Work through two units and four objectives in each course. Mastery is recorded per objective." },
      { title: "Find a starting point", body: "An optional placement check helps you begin. It never awards lesson mastery." },
      { title: "Keep learning", body: "The first course in each subject is free. A one-time purchase opens all courses, including future subjects." },
    ], screens: ["Home and resume", "Choose a course", "Read a lesson", "Practise", "Your knowledge map"],
    free: "The first course in each subject. People who used Old Dog before 1.2 keep all ten courses.",
    founder: "I had a list of tools I’d wished existed for years. Old Dog is one of them; taste and judgment are still the job.",
    support: "/old-dog/support", privacy: "/old-dog/privacy",
  },
  "teachers-pet": {
    slug: "teachers-pet", name: "Teacher’s Pet", category: "Learning at home, on your Mac", promise: "Learn with help. Check without it.",
    intro: "Lessons, practice and learner profiles for your family, on one Mac.",
    platforms: "Mac", coming: "Coming to the Mac App Store", prerelease: true, font: "gelasio", landscape: true,
    colors: { paper: "#FAF9F4", ink: "#16332F", accent: "#173F39", surface: "#EAF0E8", muted: "#52615C" },
    features: [
      { title: "A place for each learner", body: "Learner profiles keep each person’s work together." },
      { title: "An adult’s role", body: "Adult passphrase protection supports supervised learning." },
      { title: "Lessons on the Mac", body: "Lessons are bundled and saved on the Mac." },
      { title: "Family Sharing", body: "Family Sharing is supported. No account, ads or tracking." },
    ], screens: ["Subjects", "A course", "Learn", "Get help", "A note for the adult"],
    free: "Free to download when released. Family subscriptions are planned; availability depends on App Store approval.",
    founder: "Every product here started as something I needed the week I needed it. Teacher’s Pet is still being built by the same one person.",
    support: "https://teachers-pet-school-sync.teachers-pet-school-sync.workers.dev/support", privacy: "https://teachers-pet-school-sync.teachers-pet-school-sync.workers.dev/privacy",
  },
  dreamcatcher: {
    slug: "dreamcatcher", name: "Dreamcatcher", category: "A night journal", promise: "Catch the dreams you remember.",
    intro: "Your exact words. A place to return to them in the morning.",
    platforms: "iPhone · Apple Watch", coming: "Coming to the App Store", prerelease: true, font: "newsreader",
    colors: { paper: "#12162C", ink: "#F1E6D7", accent: "#E7B76A", surface: "#262F57", muted: "#D8CDBF" },
    features: [
      { title: "A dream journal", body: "Keep the dreams you remember in your own words." },
      { title: "Dream signs", body: "A place for the signs you notice in your dreams." },
      { title: "Reality checks", body: "Return to the Checks view alongside your journal and signs." },
    ], screens: ["Your dream journal", "Dream signs", "Reality checks"],
    free: "Free to download when released. The Lucid Toolkit is a separate one-time purchase, pending review.",
    founder: "I started with a list of tools I wished existed. Dreamcatcher is another one I’m turning into something you can use.",
    support: "/dreamcatcher/support", privacy: "/dreamcatcher/privacy",
  },
};
export function publicAppHomes() { return Object.values(appHomes).filter(app => !app.prerelease || APP_PAGES_PRERELEASE); }
