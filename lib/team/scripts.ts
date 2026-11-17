import {plainFinding, checkItYourself, type DisplayFinding} from "./plain-findings";
import {findingTier,FRESH_MS} from "./hook-tier";
import { SERVICES, money } from "./config";
const fix = money(SERVICES.find((s) => s.id === "fix")!.price!);
export const OPENER = "Hi, is this the owner, or whoever looks after the website?\n\n[once you have them]\n\nThanks. I'm Jayvon, a partner with Koinophobia Labs, a small remote web studio. Honest heads-up: this is a cold call, but it's about one specific thing that's broken on your website, and you can check it yourself in ten seconds. Can I tell you what it is?";
export const REFUND = "And if it isn't fixed, Blake keeps working on it or refunds you.";
export const CLOSE = "So that's the one thing. Blake, who runs Koinophobia Labs, fixes exactly that. It's a flat $299 for that one problem, done within 48 to 72 hours once he confirms the scope with you. No subscription, nothing else attached.";
export const TEXT_ASK = "Can I text you the page right now, from this number? It has the screenshot of what you just saw, exactly what 'fixed' means, and a pay button that takes Apple Pay or card. It'll come in the next ten seconds.";
export const BUSY = "No problem. Can I text you a screenshot of exactly what I saw, from this number, right now?";
export function checkedDay(f?: DisplayFinding) {
  const at=Date.parse(f?.measured_at??'');
  return Number.isFinite(at)?new Date(at).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',timeZone:'UTC'}):'[day]';
}
export function findingHook(f: DisplayFinding): string {
  const day=checkedDay(f);
  switch(f.check??f.name){
    case 'Dead contact / booking / order link': {
      const label=f.label?.trim();
      const route=/order/i.test(f.url??'')?'order':/contact/i.test(f.url??'')?'contact':'booking';
      const target=label&&!/\b(speed|slow|SEO|Google|ranking|audit|report)\b/i.test(label)?`'${label}'`:`the ${route} link on your ${f.page_name||'checked'} page`;
      const error=/404|410/.test(f.key??'')?"a 'page not found'":"an error page";
      return `When someone taps ${target} on your site, it goes to ${error} instead of your ${route} page. We checked it twice, most recently ${day}. Put me on speaker and open your site right there on this phone, then tap ${target}. I'll hang on. … Did it do that for you?`;
    }
    case 'Closed Google Form': return "The request form on your site says it's no longer accepting responses. So anyone trying to use it right now can't. Open it and you'll see it. I'll wait. … Did it do that for you?";
    case 'Booking widget failure': return "The booking calendar shows an error instead of loading. So anyone trying to use it right now can't. Open it and you'll see it. I'll wait. … Did it do that for you?";
    case 'HTTPS failure':
      if(f.key==='mixed-content')break;
      return `${f.key==='https-refused'?"The https version of your address doesn't open at all.":"When people open your site, their browser shows a security warning page before they get in."} We saw it twice, last on ${day}. Type your address into your phone's browser and you'll see it. … Did it do that for you?`;
    case 'Mobile layout':
      if(f.key==='horizontal-overflow')return "On a phone, your page is wider than the screen. Open your site on this phone and swipe left, and the whole page slides sideways. … See it?";
  }
  return `${plainFinding(f)} We checked it most recently ${day}. ${checkItYourself(f)}`;
}
export function objections(f?:DisplayFinding) { return `“Is this a scam?” / “Are you Google?”
Fair question. Lots of junk calls about websites. We're not Google and not affiliated with them. You don't have to take my word for anything: just tap the button yourself. Nothing gets paid unless you decide to.

“It works for me.”
Good. Then it may have been fixed since we checked on ${checkedDay(f)}. Tap it once more while I'm on? If it works, I'll mark it fixed and we won't call again.
Log Fixed on recheck. Don't argue.

“How many customers am I losing?”
Honestly, I can't tell you. Nobody can from outside your business. What I can tell you is that button doesn't get anyone where it should right now.

“My web guy / nephew handles it.”
Perfect, then it's a quick one for them. Want me to text you the page so you can show them? Blake's offer is on it if they'd rather he do it.
Only after a clear no on Blake doing the fix. Log Referred to current dev and follow up once.

“$299 is too much” / “Can you do it cheaper?”
It's a flat $299 for that one problem, and Blake confirms the exact scope with you before anything starts. Price is his call, not mine.

If they say stop or don't call again:
Understood, I'll take you off our list right now.
Mark opted out. Never text them again.`; }
export function voicemail(f?:DisplayFinding,business='[business]',number='[number]',partner='Jayvon') {
  const detail=!f||f.check==='Dead contact / booking / order link'?`The '${f?.label||'[Book Now]'}' button on ${business}'s website goes to a page that doesn't work.`:`On ${business}'s website: ${plainFinding(f)}`;
  return `Hi, this is ${partner} with Koinophobia Labs, a remote web studio. ${detail} We checked it twice. Tap it yourself and you'll see. If you'd like it fixed, call me back at ${number}. Thanks.`;
}
export function breakFirstScript(f?:DisplayFinding,partner='Jayvon') {
  if(!f||findingTier(f)==='hold'||!Number.isFinite(Date.parse(f.measured_at??''))||Date.now()-Date.parse(f.measured_at!)>FRESH_MS||Date.parse(f.measured_at!)>Date.now())return "Recheck and confirm a visible break before calling. Speed only, not a call.";
  return [OPENER.replace("I'm Jayvon",`I'm ${partner}`),findingHook(f),`If they are busy: ${BUSY}`,CLOSE,REFUND,TEXT_ASK,
    'Only after a clear verbal yes: turn on consent to text, tap Text link, and stay on the line.',
    "Did it come through? At the top is the same [button] you just tapped. If it looks right, you can approve it right there while I'm on. Blake reaches out within one business day to confirm scope and start.",
    'If they want to think: Totally fine. The page stays up until [expiry]. Can I check back [tomorrow at a time]? Log Interested, with the follow-up.'
  ].join('\n\n');
}
export function renderScript(body:string,finding?:DisplayFinding,partner='Jayvon',business='[business]',number='[number]') {
  if(body===CALL_TEMPLATE)return breakFirstScript(finding,partner);
  if(body===OBJECTIONS_TEMPLATE)return objections(finding);
  if(body===VOICEMAIL_TEMPLATE)return finding&&findingTier(finding)!=='hold'?voicemail(finding,business,number,partner):'Confirm a visible break before leaving a voicemail. Do not text after voicemail.';
  return body;
}
const CALL_TEMPLATE = [OPENER,'[Select a fresh, confirmed visible break]',CLOSE,REFUND,TEXT_ASK].join('\n\n');
const OBJECTIONS_TEMPLATE = objections();
const VOICEMAIL_TEMPLATE = voicemail();
export const SCRIPTS = [
  {id:'Call',title:'One visible break.',note:'Fresh Tier A or B only. Ask the owner to check it on their phone.',body:CALL_TEMPLATE},
  {
    id: "Email",
    title: "Specific beats salesy.",
    note: "Draft only. Fill the mailing address and review before use.",
    body: `Reply-To: blake@koinophobialabs.com\nSubject: quick thing I noticed on your [site / booking form / mobile site]\n\nHi [name or team at Business],\n\nI was looking at [Business] and noticed [SPECIFIC REAL PROBLEM — verified]. [One factual sentence describing what you measured.]\n\nI’m a partner with Koinophobia Labs — we work remotely with businesses across the US. Blake helps businesses find and fix exactly these kinds of issues. The Fix is a flat ${fix} for one agreed problem, usually within 48–72 hours after Blake confirms scope.\n\nOpen to a quick 15-minute call so I can show you what I found? Happy to send a screenshot if that’s easier.\n\n[your name]\nPartner with Koinophobia Labs\nReply to blake@koinophobialabs.com\n[MAILING ADDRESS — Blake fills in]\nIf you prefer no further outreach, reply "no thanks" and we will stop.`,
  },
  {
    id: "DM",
    title: "Keep it human.",
    note: "Adapted from the commercial outreach template. Do not infer lost customers.",
    body: `Hi [name] — I’m [your name], a partner with Koinophobia Labs — we work remotely with businesses across the US. I noticed [SPECIFIC VERIFIED PROBLEM] on [Business]’s website. Blake fixes this kind of issue; The Fix is ${fix} for one agreed problem. Want a screenshot showing what I found?`,
  },
  {
    id: "Follow-up",
    title: "One short bump.",
    note: "Day 3: one reminder. Day 7: one last note. Day 14: stop and mark Lost, no reply. Stop immediately after a no.",
    body: `Hi [name] — we work remotely with businesses across the US. I’m still happy to send that screenshot of [verified issue] on [Business]’s site. If it’s useful, we can talk through the fix.\n\n[your name], partner with Koinophobia Labs\nReply to blake@koinophobialabs.com\n[MAILING ADDRESS — Blake fills in]\nIf you prefer no further outreach, reply "no thanks" and we will stop.`,
  },
  {id:'Objections',title:'Straight answers.',note:'Respect a no. Never invent lost customers, revenue or competitors.',body:OBJECTIONS_TEMPLATE},
  {
    id: "Client Studio",
    title: "You have the spec.",
    note: "PRD → Release. No dates or prices promised before Blake’s review.",
    body: `Hi [name] — I’m [your name], a partner with Koinophobia Labs — we work remotely with businesses across the US. If you already have a PRD, spec or Figma, Blake can review what it would take to turn it into a working product and get it to release.\n\nWe start with a Straight Answer: what is buildable now, what is missing, the major risks, and what it would take to ship. Builds are quoted per project in fixed-price milestones Blake approves.\n\nWould it help to talk through the spec?`,
  },
  {id:'Voicemail',title:'Leave one useful detail.',note:'No text after voicemail. Use the confirmed finding only.',body:VOICEMAIL_TEMPLATE},
] as const;
