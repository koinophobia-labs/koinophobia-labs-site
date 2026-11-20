import { SERVICES, money } from "./config";
const fix = money(SERVICES.find((s) => s.id === "fix")!.price!);
export const SCRIPTS = [
  {
    id: "Call",
    title: "A useful 30 seconds.",
    note: "Ask for the owner or whoever runs the website. Use only a finding you verified.",
    body: `Hi — is the owner or whoever runs the website around?\n\nHi, my name is [your name]. I’m a partner with Koinophobia Labs — we work remotely with businesses across the US. I’ll be quick, 20 seconds, promise.\n\nI was on your website and noticed [SPECIFIC VERIFIED PROBLEM]. [Describe exactly what happened when you tested it.]\n\nBlake at Koinophobia Labs fixes exactly this kind of thing. The Fix starts at a flat ${fix}, with a 48–72 hour turnaround once Blake confirms the scope.\n\nEasiest thing: can I send you a quick 2-minute screen recording showing exactly what’s happening? What’s the best email — or would you prefer a text?`,
  },
  {
    id: "Email",
    title: "Specific beats salesy.",
    note: "Draft only. Fill the mailing address and review before use.",
    body: `Reply-To: blake@koinophobialabs.com\nSubject: quick thing I noticed on your [site / booking form / mobile site]\n\nHi [name or team at Business],\n\nI was looking at [Business] and noticed [SPECIFIC REAL PROBLEM — verified]. [One factual sentence describing what you measured.]\n\nI’m a partner with Koinophobia Labs — we work remotely with businesses across the US. Blake helps businesses find and fix exactly these kinds of issues. The Fix is a flat ${fix} for one agreed problem, usually within 48–72 hours after Blake confirms scope.\n\nOpen to a quick 15-minute call so I can show you what I found? Happy to send a short screen recording if that’s easier.\n\n[your name]\nPartner with Koinophobia Labs\nReply to blake@koinophobialabs.com\n[MAILING ADDRESS — Blake fills in]\nIf you prefer no further outreach, reply "no thanks" and we will stop.`,
  },
  {
    id: "DM",
    title: "Keep it human.",
    note: "Adapted from the commercial outreach template. Do not infer lost customers.",
    body: `Hi [name] — I’m [your name], a partner with Koinophobia Labs — we work remotely with businesses across the US. I noticed [SPECIFIC VERIFIED PROBLEM] on [Business]’s website. Blake fixes this kind of issue; The Fix is ${fix} for one agreed problem. Want a quick recording showing what I found?`,
  },
  {
    id: "Follow-up",
    title: "One short bump.",
    note: "Day 3: one reminder. Day 7: one last note. Day 14: stop and mark Lost, no reply. Stop immediately after a no.",
    body: `Hi [name] — we work remotely with businesses across the US. I’m still happy to send that short recording of [verified issue] on [Business]’s site. If it’s useful, we can talk through the fix.\n\n[your name], partner with Koinophobia Labs\nReply to blake@koinophobialabs.com\n[MAILING ADDRESS — Blake fills in]\nIf you prefer no further outreach, reply "no thanks" and we will stop.`,
  },
  {
    id: "Objections",
    title: "Straight answers.",
    note: "Respect a no. No invented proof, guarantees or commitments.",
    body: `“Not interested.”\nTotally fair — thanks for your time.\n\n“How do I know you’re legit?”\nFair question. I’m a partner with Koinophobia Labs — we work remotely with businesses across the US. I can show you the actual issue I measured so you can decide whether it’s useful.\n\n“Just send me info.”\nPerfect — which email should I use for the recording and a one-line summary?\n\n“How much, and why?”\nThe Fix is ${fix} for one agreed problem. Blake confirms the scope and 48–72 hour turnaround before work starts.\n\n“They’re busy.”\nNo problem. When is a good time to speak with whoever manages the website?`,
  },
  {
    id: "Client Studio",
    title: "You have the spec.",
    note: "PRD → Release. No dates or prices promised before Blake’s review.",
    body: `Hi [name] — I’m [your name], a partner with Koinophobia Labs — we work remotely with businesses across the US. If you already have a PRD, spec or Figma, Blake can review what it would take to turn it into a working product and get it to release.\n\nWe start with a Straight Answer: what is buildable now, what is missing, the major risks, and what it would take to ship. Builds are quoted per project in fixed-price milestones Blake approves.\n\nWould it help to talk through the spec?`,
  },
  {
    id: "Voicemail",
    title: "Leave one useful detail.",
    note: "Use only a problem you measured.",
    body: `Hi, this is [your name] with Koinophobia Labs. I noticed [specific verified problem] on your website. We can fix it fast for a flat $299 once Blake confirms scope. I can share a two-minute recording showing what I mean. Reach me at [your business number]. Thanks!`,
  },
] as const;
