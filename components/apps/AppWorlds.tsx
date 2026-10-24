import { appHomes } from "@/lib/app-homes";
import type { AppSlug } from "@/lib/app-prices";
import AppPricing from "./AppPricing";
import { Art, DreamHoop, Icon, ListingLabel, Shot, StoreAction } from "./WorldParts";
import { Entrance } from "./WorldBehavior";

function Prices({slug}: {slug:AppSlug}) { const a=appHomes[slug]; return <AppPricing slug={slug} free={a.free} prerelease={a.prerelease} />; }
function Trendi() {
  const beats = [
    ["Opening", "One angle. Three hooks.", "Shape This Into a Video gives you one angle and three hooks to choose from."],
    ["Main idea", "Keep your voice.", "Edit the script, caption and shot plan. The words are yours to change."],
    ["Example", "Type it. Say it.", "Capture a thought with text or speech."],
    ["Takeaway", "Press record.", "Use the teleprompter section by section, or read the full script."],
    ["Ending", "Come back to it.", "Keep drafts in the on-device Vault and add your own performance notes."],
  ];
  return <>
    <section className="greenroom world-hero" aria-labelledby="app-title">
      <Art slug="trendi" file="trendi-greenroom.png" />
      <div className="greenroom-identity"><Icon slug="trendi" /><p className="eyebrow">Trendi · A content coach for iPhone</p></div>
      <div className="greenroom-stage"><h1 id="app-title">SAY IT<br/>MESSY.</h1><div className="viewfinder"><Shot slug="trendi" n={1} hero /></div><div className="greenroom-aside"><p className="your-words">Make it<br/>yours.</p><p className="world-oneliner">{appHomes["trendi"].tagline}</p><StoreAction slug="trendi" /></div></div>
      <p className="stage-note">You stay in control of the words.</p>
    </section>
    <section className="world-section shot-list"><p className="eyebrow">01 / The shot list</p><h2>A thought. An angle.<br/>Your words on camera.</h2><ListingLabel slug="trendi" /><div className="storyboard swipe" tabIndex={0} role="region" aria-label="Trendi shot list">{[1,2,3,4,5].map(n=><Shot key={n} slug="trendi" n={n} label={`SHOT 0${n} · ${appHomes.trendi.screens[n-1]}`} />)}</div></section>
    <section className="world-section teleprompter"><p className="eyebrow">02 / Your script</p>{beats.map(([label,title,body])=><article className="script-beat" key={label}><p className="eyebrow">{label}</p><h2>{title}</h2><p>{body}</p></article>)}</section>
    <Prices slug="trendi" />
  </>;
}
function WayIn() {
  return <>
    <section className="path-hero world-hero" aria-labelledby="app-title"><div className="path-title"><p className="eyebrow">Way In · iPhone and iPad</p><h1 id="app-title">Your experience.<br/>A clearer next move<span className="path-star" aria-hidden="true">✦</span></h1><p className="world-oneliner">{appHomes["way-in"].tagline}</p><StoreAction slug="way-in" /></div>
      <svg className="way-path" viewBox="0 0 1200 650" fill="none" aria-hidden="true"><path d="M-40 620 C300 630 110 380 490 450 S760 260 820 290 S1030 300 1120 60" stroke="#FAF5E6" strokeWidth="3"/><path d="m1120 35 7 18 18 7-18 7-7 18-7-18-18-7 18-7z" fill="#FFC240"/></svg>
      <div className="path-waypoints">{[3,4,1].map(n=><Shot key={n} slug="way-in" n={n} hero />)}</div><div className="path-icon"><Icon slug="way-in" /></div>
    </section>
    <section className="world-section mile-markers"><p className="eyebrow proof-mark">✓✓✓ Three steps up</p><ListingLabel slug="way-in" />{[
      ["Bring what you have", "Start from true sentences or import a résumé. Review every suggestion before using it.", [2,3]],
      ["Keep the next move in view", "Compare your experience with a saved posting: supported items, related experience and gaps.", [4]],
      ["Keep every application together", "Saved jobs, résumé versions, application progress, notes and follow-ups in one workspace.", [5]],
    ].map(([title,body,shots],i)=><article className="mile-marker" key={String(title)}><div className="mile-copy"><span className="me-marker">ME / 0{i+1}</span><h2>{String(title)}</h2><p>{String(body)}</p></div><div className="mile-shots">{(shots as number[]).map(n=><Shot key={n} slug="way-in" n={n} />)}</div></article>)}<p className="plain-truth">Way In does not apply on your behalf. No account is required.</p></section>
    <Prices slug="way-in" /><p className="world-closing">Add one thing you&apos;re proud of.</p>
  </>;
}
function ForgetAboutIt() {
  return <div className="diary">
    <section className="diary-entry diary-hero world-hero" data-time="Today" aria-labelledby="app-title"><div className="diary-copy"><div className="diary-knot"><Icon slug="forget-about-it" size={96}/><Entrance /></div><p className="eyebrow">Forget About It · iPhone and Apple Watch</p><h1 id="app-title">Catch it<br/>before it goes.</h1><p className="world-oneliner">{appHomes["forget-about-it"].tagline}</p><StoreAction slug="forget-about-it" /></div><div className="day-night"><Shot slug="forget-about-it" n={2} hero /><Shot slug="forget-about-it" n={1} hero /></div></section>
    <section className="diary-entry thought" data-time="A thought" data-enter><p className="eyebrow">Example entry</p><p className="sample-thought">Halcyon pricing still feels off to me</p><p className="sauce-aside">Open. Capture. Carry on.</p></section>
    <section className="diary-entry" data-time="Earlier" data-enter><h2>Today, History, Memory.</h2><ListingLabel slug="forget-about-it" /><div className="diary-screens swipe" tabIndex={0} role="region" aria-label="Today, History and Memory screenshots">{[1,3,4].map(n=><Shot key={n} slug="forget-about-it" n={n} />)}</div></section>
    <section className="diary-entry still-open" data-time="Still open" data-enter><h2>A place for the thought.</h2><ul>{appHomes["forget-about-it"].features.map(f=><li key={f.title}><h3>{f.title}</h3><p>{f.body}</p></li>)}</ul></section>
    <div className="diary-entry" data-time="The price"><Prices slug="forget-about-it" /></div>
  </div>;
}
function Choir() {
  return <>
    <section className="loft world-hero" aria-labelledby="app-title"><Art slug="preaching-to-the-choir" file="ptc-loft.png" /><Icon slug="preaching-to-the-choir" size={160}/><p className="eyebrow">Preaching to the Choir</p><h1 id="app-title">What is on your heart?</h1><p>Keep a record of what you are praying through, in your own words.</p><p className="world-oneliner">{appHomes["preaching-to-the-choir"].tagline}</p><StoreAction slug="preaching-to-the-choir" /><div className="choir-arc" data-enter>{[2,1,3].map(n=><Shot key={n} slug="preaching-to-the-choir" n={n} hero />)}</div></section>
    <section className="world-section order"><p className="eyebrow">I / Prayer record</p><h2>Order of the day</h2><ListingLabel slug="preaching-to-the-choir"/><div className="hymnal-shots swipe" tabIndex={0} role="region" aria-label="Order of the day screenshots">{[4,5].map((n,i)=><Shot key={n} slug="preaching-to-the-choir" n={n} label={`${["I","II"][i]} · ${appHomes["preaching-to-the-choir"].screens[n-1]}`} />)}</div></section>
    <section className="world-section hymnal"><p className="eyebrow">II / Original prayer</p><h2>Your words stay exactly<br/>as you leave them.</h2><ol>{appHomes["preaching-to-the-choir"].features.map(f=><li key={f.title}><h3>{f.title}</h3><p>{f.body}</p></li>)}</ol></section>
    <Prices slug="preaching-to-the-choir" />
    <section className="world-section privacy-plain"><p className="eyebrow">IV / Privacy, plainly</p><h2>Room for quiet.</h2><p>No account, analytics, ads or tracking. iCloud sync is not available.</p></section>
  </>;
}
const subjects = ["Personal finance", "Credit and debt", "Economics", "AI", "Computer literacy", "Cybersecurity", "Professional communication", "Cooking", "Home maintenance", "Critical thinking"];
function OldDog() {
  return <>
    <section className="reading-room world-hero" aria-labelledby="app-title"><aside className="reading-sidebar"><Icon slug="old-dog" size={160}/><p className="old-dog-wordmark">Old Dog<span>.</span></p><p className="eyebrow">LEARN SOMETHING NEW</p><p className="stay-curious">Stay curious.</p></aside><div className="reading-desk"><p className="eyebrow">The reading room</p><h1 id="app-title">Old Dog.<br/>New Tricks.</h1><p>On the Mac App Store · iPhone coming to the App Store.</p><p className="world-oneliner">{appHomes["old-dog"].tagline}</p><StoreAction slug="old-dog" /><Shot slug="old-dog" n={1} hero /></div></section>
    <section className="world-section lesson-demo"><p className="eyebrow">Learn · Practice · Prove</p><h2>One lesson, start to finish.</h2><ListingLabel slug="old-dog" /><div className="lesson-progress" aria-hidden="true"><i/><i/><i/></div><div className="lesson-pages">{[2,3,4,5].map((n,i)=><article key={n} data-enter><p className="eyebrow">{["01 / Choose a course", "02 / Learn", "03 / Practise", "04 / Your knowledge map"][i]}</p><Shot slug="old-dog" n={n} /></article>)}</div></section>
    <section className="world-section catalog"><p className="eyebrow">The card catalog</p><h2>There&apos;s more worth learning next.</h2><div className="catalog-cards">{subjects.map((s,i)=><article key={s}><span className="catalog-id">{String(i+1).padStart(2,"0")}</span><h3>{s}</h3><p>2 units · 4 objectives</p></article>)}</div><p className="catalog-note">Placement suggests a starting point. It never awards lesson mastery.</p></section>
    <Prices slug="old-dog" />
  </>;
}
function TeachersPet() {
  return <>
    <section className="schoolhouse world-hero" aria-labelledby="app-title"><div className="school-board"><p className="eyebrow">Teacher&apos;s Pet · Mac</p><h1 id="app-title">Your personal<br/><mark>school</mark> at home.</h1><p className="world-oneliner">{appHomes["teachers-pet"].tagline}</p><StoreAction slug="teachers-pet" /></div><div className="school-subjects"><Shot slug="teachers-pet" n={1} hero /><Icon slug="teachers-pet" size={128}/></div><p className="school-limit">No diploma or accreditation. Lessons, practice and learner profiles for your family, on one Mac.</p></section>
    <nav className="school-stepper" aria-label="Lesson steps">{["Learn","Get help","Practice","Check","Result"].map((s,i)=><a key={s} href={`#${i===4?"pricing":s.toLowerCase().replace(" ","-")}`} aria-current={i===0?"step":undefined}>{s}<span aria-hidden="true">→</span></a>)}</nav>
    <section className="world-section school-learn" id="learn" data-school-step><p className="eyebrow">Learn</p><h2>A place for each learner.</h2><p>K–12 in math, ELA, science and social studies.</p><p>Lessons are bundled and saved on the Mac.</p><ListingLabel slug="teachers-pet" /><div className="school-pages"><Shot slug="teachers-pet" n={2}/><Shot slug="teachers-pet" n={3}/></div></section>
    <section className="world-section school-help" id="get-help" data-school-step><p className="eyebrow">Get help</p><h2>Choose your explanation.</h2><Shot slug="teachers-pet" n={4}/></section>
    <section className="world-section school-practice" id="practice" data-school-step><p className="eyebrow">Practice</p><h2>Learn with help.<br/>Check without it.</h2><div id="check" data-school-step><p className="eyebrow">Check</p><p className="supervised-note">This is one supervised check—not a mastery grade or proof of learning.</p></div></section>
    <section className="world-section for-adult"><p className="eyebrow">For your adult</p><h2>An adult&apos;s role.</h2><p>Adult passphrase protection supports supervised learning. No account, ads or tracking.</p><Shot slug="teachers-pet" n={5}/></section>
    <Prices slug="teachers-pet" />
  </>;
}
function Dreamcatcher() {
  return <>
    <section className="three-am world-hero" aria-labelledby="app-title"><Art slug="dreamcatcher" file="dreamcatcher-3am.png"/><DreamHoop/><div className="dream-identity"><Icon slug="dreamcatcher" size={72}/><p className="eyebrow">Dreamcatcher: Lucid Dreams · {appHomes["dreamcatcher"].category}</p></div><div className="dream-title"><p className="eyebrow">3 a.m. / Catch it</p><h1 id="app-title">Catch the dreams<br/>you remember.</h1><p>Say it before it fades.<br/>See the night it came from.</p><p className="world-oneliner">{appHomes["dreamcatcher"].tagline}</p><StoreAction slug="dreamcatcher"/><p className="dream-platforms">iPhone and Apple Watch</p></div><div className="nightstand-phone"><Shot slug="dreamcatcher" n={1} hero/></div></section>
    <section className="dream-phase last-night" data-enter><div><p className="eyebrow">Last night / Apple Health</p><h2>Your night,<br/>with your dreams.</h2><p>Connect Apple Health to see last night&apos;s sleep stages (awake, REM, light and deep), with every dream pinned where you caught it: “After REM”, “After deep sleep”.</p><ListingLabel slug="dreamcatcher"/><p className="dream-honest">Apple Health is optional. Dreamcatcher only reads your sleep, on your iPhone, and that data never leaves it. Capture always works without it.</p></div><Shot slug="dreamcatcher" n={2}/></section>
    <section className="dream-phase anywhere"><p className="eyebrow">3 a.m. / Catch from anywhere</p><h2>One press.<br/>Already listening.</h2><p>Use Siri, the Action button or a Lock Screen control. A dark, dimmed screen opens, already listening. Say what you remember, or type it instead.</p><p>Locked capture is write-only: nothing can be read before you unlock.</p></section>
    <section className="dream-phase morning" data-enter><p className="eyebrow">7 a.m. / Morning review</p><h2>Your exact words.<br/>In the morning light.</h2><p>Mark dreams lucid, vivid, nightmare or recurring. Search your journal and export it.</p><Shot slug="dreamcatcher" n={3}/></section>
    <section className="dream-phase daytime"><div><p className="eyebrow">Daytime / Reality check</p><h2>Are you dreaming?</h2><p>Read some text. Look away. Read it again. Did it change?</p></div><Shot slug="dreamcatcher" n={5}/></section>
    <section className="dream-phase tonight"><div><p className="eyebrow">Tonight / Dream signs</p><h2>Notice the next.</h2><p>Tag what keeps coming back. Notice one of these, and you might be dreaming.</p></div><Shot slug="dreamcatcher" n={6}/></section>
    <section className="world-section toolkit"><p className="eyebrow">The nightstand / Lucid Toolkit</p><h2>Notice the next dream.</h2><p>One purchase adds the sleep-powered, lucid-training tools.</p><ul>{["Reality-check program","Wake-back-to-bed at your predicted REM windows","Dream-sign insights","Progress trends","Recall vs sleep insights"].map(t=><li key={t}>{t}</li>)}</ul><Shot slug="dreamcatcher" n={4}/><p>Free: night capture, the journal, morning review, dream signs, search, export and the Apple Health sleep timeline.</p><p className="dream-honest">REM windows are predictions from your recent nights, not live detection or medical advice.</p></section>
    <Prices slug="dreamcatcher"/>
  </>;
}
export const appWorlds: Record<AppSlug, React.ComponentType> = { trendi:Trendi, "way-in":WayIn, "forget-about-it":ForgetAboutIt, "preaching-to-the-choir":Choir, "old-dog":OldDog, "teachers-pet":TeachersPet, dreamcatcher:Dreamcatcher };
