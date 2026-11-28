import type { Metadata } from "next";
import Link from "next/link";
import { STUDIO_URL, socialCard } from "@/lib/seo";

const title = "How to Write a Résumé When Your Experience Is Service, Retail, or Gig Work";
const description = "No office job history? Your service, retail, and gig experience is more valuable than you think. Here's how to turn it into a résumé that lands interviews.";
const url = `${STUDIO_URL}/blog/resume-for-service-retail-gig-work`;
const image = socialCard("A résumé for the work you’ve done", "Way In");

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: {
    type: "article",
    siteName: "Koinophobia Labs",
    locale: "en_US",
    url,
    title,
    description,
    images: [image],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [image],
  },
};

export default function ServiceResumePage() {
  return (
    <article>
      <header className="page-head">
        <p className="k"><Link href="/blog">Blog</Link> · Way In</p>
        <h1>How to Write a Résumé When Your Experience Is Service, Retail, or Gig Work</h1>
      </header>
      <p>If your work history is serving tables, running a register, driving for an app, warehouse shifts, or caregiving, you&#x27;ve probably been told your résumé looks &quot;thin.&quot; It isn&#x27;t. You&#x27;ve been doing high-pressure, people-facing, logistics-heavy work that office roles pay good money for — you just haven&#x27;t learned to <em>translate</em> it. Here&#x27;s how to write a résumé that makes a hiring manager see what you can actually do.</p>
      <h2>1. Lead with what you <em>did</em>, not the job title</h2>
      <p>&quot;Server at a restaurant&quot; tells them nothing. &quot;Handled 40+ tables a shift, resolved customer complaints on the spot, and trained three new hires&quot; tells them you can manage pressure, de-escalate, and lead. Write each role as a short list of <strong>actions and outcomes</strong>, not duties.</p>
      <h2>2. Translate hands-on work into transferable skills</h2>
      <p>Every job you&#x27;ve had maps to skills employers list in job posts. A few common translations:</p>
      <ul>
        <li><strong>Retail / service</strong> → customer service, conflict resolution, cash handling, upselling, working under pressure.</li>
        <li><strong>Gig / delivery</strong> → time management, route optimization, self-direction, reliability, customer ratings.</li>
        <li><strong>Warehouse / kitchen</strong> → process efficiency, safety compliance, teamwork, consistency at volume.</li>
        <li><strong>Caregiving</strong> → responsibility, scheduling, communication, calm under stress.</li>
      </ul>
      <p>Use the <em>same words</em> the job posting uses. If it asks for &quot;customer-facing communication,&quot; put that phrase on your résumé (truthfully).</p>
      <h2>3. Quantify everything you can</h2>
      <p>Numbers make experience feel real. How many customers a day? How large was the cash drawer you reconciled? What was your delivery rating? How many people did you train or shifts did you cover? &quot;Maintained a 4.9 driver rating across 2,000+ deliveries&quot; is a stronger line than most office résumés have.</p>
      <h2>4. Use a skills-first layout</h2>
      <p>When your titles don&#x27;t match the job you want, put a <strong>Skills</strong> or <strong>Summary</strong> section at the top so the relevant abilities are the first thing a recruiter sees — before they get to the job titles. This is the standard fix for a career change.</p>
      <h2>5. Count <em>all</em> your experience</h2>
      <p>Work isn&#x27;t only W-2 jobs. School projects, volunteering, caregiving, side hustles, and things you taught yourself all count and can go on a résumé when they show a relevant skill. Most people leave half their real experience off the page.</p>
      <h2>6. Tailor it to the specific job</h2>
      <p>A generic résumé gets generic results. Before you apply, read the posting, note the skills and phrases it emphasizes, and make sure your résumé reflects the true parts of your experience that match. Ten minutes of tailoring beats sending the same résumé to fifty jobs.</p>
      <h2>A tool built for exactly this</h2>
      <p>Doing all of the above from a blank page is the hard part — especially translating hands-on work into the right language. That&#x27;s what <a href="https://apps.apple.com/app/id6807942376"><strong>Way In</strong></a> is for. It helps you start from a few true sentences about what you&#x27;ve done (work, school, caregiving, projects — it all counts), translate that experience into résumé-ready language, and check it against a real job posting so you&#x27;re emphasizing what that role actually wants. Every suggestion is yours to review before you use it, and it&#x27;s private — it works on your iPhone, no account required.</p>
      <p>Your experience is real and it&#x27;s valuable. The only thing standing between it and an interview is putting it on the page in the language employers are looking for.</p>
      <p><em><a href="https://apps.apple.com/app/id6807942376">Get Way In on the App Store →</a></em></p>
    </article>
  );
}
