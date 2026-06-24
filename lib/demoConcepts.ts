import type { LucideIcon } from "lucide-react";
import { Coffee, Dumbbell, Scissors } from "lucide-react";

type ShowcaseItem = {
  title: string;
  eyebrow: string;
  body: string;
};

type Testimonial = {
  quote: string;
  name: string;
};

export type DemoConcept = {
  slug: string;
  label: string;
  name: string;
  category: string;
  conceptNote: string;
  audience: string;
  cardSummary: string;
  hireReason: string;
  headline: string;
  subhead: string;
  primaryCta: string;
  secondaryCta: string;
  problem: string;
  result: string;
  accent: "red" | "green" | "amber";
  icon: LucideIcon;
  stats: string[];
  services: { title: string; body: string }[];
  gallery: string[];
  proof: string[];
  heroVisual: {
    eyebrow: string;
    title: string;
    body: string;
    details: string[];
  };
  spotlight: {
    kicker: string;
    title: string;
    body: string;
    items: ShowcaseItem[];
  };
  process: {
    kicker: string;
    title: string;
    body: string;
    steps: ShowcaseItem[];
  };
  policy: {
    kicker: string;
    title: string;
    body: string;
    items: string[];
  };
  testimonials: Testimonial[];
  bookingTitle: string;
  bookingCopy: string;
  outreach: {
    blurb: string;
    targetBusiness: string;
    bestLink: string;
  };
};

export const demoConcepts: DemoConcept[] = [
  {
    slug: "tattoo-studio",
    label: "Tattoo Studio",
    name: "Blackline Ritual",
    category: "Private tattoo studio concept",
    conceptNote: "Demo concept by Koinophobia Labs. Not real client work.",
    audience: "Independent tattoo artists and private studios",
    cardSummary:
      "A premium booking site for artists who need better consult requests, stronger portfolio proof, and fewer low-intent DMs.",
    hireReason:
      "Koinophobia Labs turns the artist's process into a sales filter: visual trust, booking rules, flash drops, and a clean consult path.",
    headline: "A tattoo site that makes the artist feel booked, selective, and worth the deposit.",
    subhead:
      "Built for private studios that need trust, style, booking rules, and healed-work proof before the first DM.",
    primaryCta: "Request a consult",
    secondaryCta: "View flash drops",
    problem:
      "Tattoo inquiries usually arrive messy: no placement, no budget, no reference, no respect for the artist's process.",
    result:
      "This concept filters the wrong leads, frames the artist as premium, and turns booking into a clear next step.",
    accent: "red",
    icon: Scissors,
    stats: ["Deposit-first booking", "Healed-work proof", "Flash + custom"],
    heroVisual: {
      eyebrow: "Private studio · Appointment only",
      title: "Blackwork, fine line, and quiet-room custom pieces.",
      body: "A calm, selective studio experience with consultation-first booking and a focus on healed work.",
      details: ["Downtown private room", "Custom books open monthly", "Flash drops every Friday"],
    },
    services: [
      {
        title: "Custom blackwork",
        body: "Large-scale pieces, fine-line detail, and placement-first concepts built around the client's body.",
      },
      {
        title: "Flash drops",
        body: "Limited designs presented like product releases, with clear availability and booking urgency.",
      },
      {
        title: "Aftercare clarity",
        body: "Simple prep and healing instructions reduce back-and-forth and make the studio feel organized.",
      },
    ],
    gallery: ["Sleeve study", "Fine-line symbols", "Healed shoulder", "Flash sheet"],
    proof: [
      "Sets expectations before inquiry",
      "Makes the studio feel selective",
      "Gives visitors proof without scrolling social feeds",
    ],
    spotlight: {
      kicker: "Artists and healed work",
      title: "A studio page built around trust before the inquiry.",
      body:
        "Tattoo clients need to see style, taste, healed results, and the booking rules in one focused place.",
      items: [
        {
          eyebrow: "Resident artist",
          title: "Mara Vale",
          body: "Blackwork sleeves, botanical linework, and high-contrast placement studies.",
        },
        {
          eyebrow: "Healed showcase",
          title: "Twelve-week healed shoulder",
          body: "Close-up proof area for healed texture, line weight, and how the piece settles.",
        },
        {
          eyebrow: "Flash release",
          title: "Friday drop: ritual objects",
          body: "Limited designs presented like a real drop with claim urgency and clear boundaries.",
        },
      ],
    },
    process: {
      kicker: "Booking process",
      title: "Clean steps for serious clients.",
      body: "The page tells clients what to send, what happens next, and why deposits protect the artist's time.",
      steps: [
        {
          eyebrow: "01",
          title: "Submit the idea",
          body: "Placement, size, references, budget range, and availability are collected up front.",
        },
        {
          eyebrow: "02",
          title: "Consult and estimate",
          body: "The studio responds with fit, rough timing, and whether the concept belongs on custom or flash.",
        },
        {
          eyebrow: "03",
          title: "Deposit locks the date",
          body: "No vague holds. The date is confirmed only once the deposit and prep notes are complete.",
        },
      ],
    },
    policy: {
      kicker: "Deposit policy",
      title: "Serious booking rules without sounding cold.",
      body:
        "This section makes boundaries feel professional: deposits, reschedules, design changes, and aftercare expectations.",
      items: ["$100 non-refundable deposit", "One reschedule with 72-hour notice", "Final design shown at appointment", "Aftercare sent after session"],
    },
    testimonials: [
      {
        quote: "The consult form filtered everything. I only got serious requests with enough detail to reply fast.",
        name: "Private studio owner",
      },
      {
        quote: "This feels like a studio people would wait for, not a generic portfolio page.",
        name: "Blackwork artist",
      },
    ],
    bookingTitle: "Ready to book the right clients, not every client?",
    bookingCopy:
      "A studio site like this gives artists a premium front door and cleaner consultation requests.",
    outreach: {
      blurb:
        "I mocked up a tattoo studio concept that shows how your booking page could pre-qualify consults, show healed work, and make deposits feel normal before anyone DMs you.",
      targetBusiness: "Private tattoo studios, independent artists, flash/drop-based shops",
      bestLink: "https://koinophobia-labs.vercel.app/demos/tattoo-studio",
    },
  },
  {
    slug: "fitness-coach",
    label: "Local Gym / Fitness Coach",
    name: "Iron Method Coaching",
    category: "Fitness coach website concept",
    conceptNote: "Demo concept by Koinophobia Labs. Not real client work.",
    audience: "Local gyms, personal trainers, and small-group coaches",
    cardSummary:
      "A trial-week funnel for coaches who need prospects to understand the offer before they ask about price.",
    hireReason:
      "Koinophobia Labs packages the coaching method, proof points, and first-step CTA into a site built to turn local interest into booked sessions.",
    headline: "A fitness coach site that sells the first session before the price question.",
    subhead:
      "Built for local coaches who sell structure, accountability, and visible progress instead of generic gym access.",
    primaryCta: "Book a trial week",
    secondaryCta: "See programs",
    problem:
      "Most local fitness pages look interchangeable and force prospects to message before they understand the offer.",
    result:
      "This concept positions the coach as the guide, explains the programs fast, and pushes visitors into a trial week.",
    accent: "green",
    icon: Dumbbell,
    stats: ["Trial-week CTA", "Program tiers", "Local trust signals"],
    heroVisual: {
      eyebrow: "Strength coaching · Small groups",
      title: "Coached lifts, weekly structure, and accountability that sticks.",
      body: "Built around a real local offer: trial week, training blocks, progress checks, and coach-led sessions.",
      details: ["6-person groups", "4-week starter block", "Morning and evening sessions"],
    },
    services: [
      {
        title: "Small-group strength",
        body: "Four to eight athletes per session, coached lifts, simple progress tracking, and consistent times.",
      },
      {
        title: "1:1 coaching",
        body: "Individual programming for fat loss, strength blocks, return-to-training, and accountability.",
      },
      {
        title: "Nutrition basics",
        body: "Plain-language habits and check-ins that support training without turning life into homework.",
      },
    ],
    gallery: ["Coached rack", "Progress wall", "Conditioning lane", "Coach check-in"],
    proof: [
      "Turns vague fitness interest into a trial",
      "Explains who the program is for",
      "Builds trust before the first visit",
    ],
    spotlight: {
      kicker: "Coach and results",
      title: "Lead with the coach, then prove the method.",
      body:
        "A coach site needs to make the person credible, show the structure, and make the first trial feel low-risk.",
      items: [
        {
          eyebrow: "Head coach",
          title: "Drew Mason",
          body: "Strength-first coaching for adults who want clear programming without big-box gym confusion.",
        },
        {
          eyebrow: "Transformation",
          title: "12 weeks: stronger, leaner, consistent",
          body: "Before/after proof area for client stories, training photos, and measurable progress.",
        },
        {
          eyebrow: "Trust signal",
          title: "Progress tracked every Friday",
          body: "Simple weekly check-ins turn the offer from workouts into accountability.",
        },
      ],
    },
    process: {
      kicker: "Weekly structure",
      title: "A clear week beats a vague promise.",
      body: "The page makes the program feel organized before someone books.",
      steps: [
        {
          eyebrow: "Monday",
          title: "Strength base",
          body: "Squat, press, pull, and coached accessory work with simple progression.",
        },
        {
          eyebrow: "Wednesday",
          title: "Conditioning and core",
          body: "Short circuits, carries, sleds, and mobility to keep progress athletic.",
        },
        {
          eyebrow: "Friday",
          title: "Check-in and progress",
          body: "Coach review, weight targets, nutrition basics, and next-week adjustments.",
        },
      ],
    },
    policy: {
      kicker: "Program options",
      title: "Simple tiers that make the next step obvious.",
      body:
        "The page separates trial, small-group, and 1:1 coaching so visitors can self-select quickly.",
      items: ["Trial week: $49", "Small group: 3 sessions/week", "1:1 coaching: limited spots", "Nutrition habit check-ins included"],
    },
    testimonials: [
      {
        quote: "I knew exactly what the trial week included before I filled out the form.",
        name: "New member",
      },
      {
        quote: "This presents coaching like a real program, not random workouts.",
        name: "Local strength coach",
      },
    ],
    bookingTitle: "Make the first session feel like the obvious move.",
    bookingCopy:
      "A coach site should sell clarity and confidence before it sells memberships.",
    outreach: {
      blurb:
        "I built a fitness coach concept that shows how your site could explain the program, build trust fast, and push new leads toward a trial week instead of another vague DM.",
      targetBusiness: "Personal trainers, small gyms, strength coaches, online/local hybrid coaches",
      bestLink: "https://koinophobia-labs.vercel.app/demos/fitness-coach",
    },
  },
  {
    slug: "coffee-shop",
    label: "Restaurant / Coffee Shop",
    name: "Forge & Foam",
    category: "Coffee shop and all-day cafe concept",
    conceptNote: "Demo concept by Koinophobia Labs. Not real client work.",
    audience: "Coffee shops, cafes, and neighborhood restaurants",
    cardSummary:
      "A local food site that makes hours, menu highlights, ordering, and event inquiries obvious from a phone.",
    hireReason:
      "Koinophobia Labs gives the business one polished front door for ordering, visiting, catering, and private-event leads.",
    headline: "A cafe site that turns local attention into orders, visits, and event inquiries.",
    subhead:
      "Built for neighborhood food businesses that need menu confidence, atmosphere, private events, and online ordering in one place.",
    primaryCta: "Order ahead",
    secondaryCta: "View menu",
    problem:
      "Restaurants and cafes lose buyers when menus, hours, atmosphere, and event options are scattered across apps.",
    result:
      "This concept puts the offer in one polished place: order, visit, reserve, or inquire for catering.",
    accent: "amber",
    icon: Coffee,
    stats: ["Order CTA", "Menu highlights", "Events + catering"],
    heroVisual: {
      eyebrow: "All-day cafe · Open 7-4",
      title: "Espresso, warm pastry, and a corner table that feels like yours.",
      body: "A neighborhood brand page built around visit intent: hours, menu, atmosphere, and events.",
      details: ["Maple oat latte", "House biscuit sandwich", "Friday vinyl nights"],
    },
    services: [
      {
        title: "Morning service",
        body: "Espresso, batch brew, breakfast sandwiches, and grab-and-go items presented for quick decisions.",
      },
      {
        title: "All-day menu",
        body: "Signature plates and seasonal items shown with enough detail to create appetite without clutter.",
      },
      {
        title: "Private events",
        body: "A clear path for birthdays, pop-ups, catering, and small brand events after hours.",
      },
    ],
    gallery: ["Espresso bar", "Pastry case", "Corner booth", "Evening pop-up"],
    proof: [
      "Makes hours and ordering obvious",
      "Shows vibe without relying on social media",
      "Creates a direct catering lead path",
    ],
    spotlight: {
      kicker: "Menu highlights",
      title: "Make the food and drinks feel worth leaving the house for.",
      body:
        "Local restaurant sites need appetite, clarity, and a reason to visit today.",
      items: [
        {
          eyebrow: "Featured drink",
          title: "Maple oat cold brew",
          body: "A seasonal hero item with a simple order-ahead path.",
        },
        {
          eyebrow: "Breakfast",
          title: "Smoked cheddar biscuit",
          body: "Menu cards make signature items easy to scan on a phone.",
        },
        {
          eyebrow: "Community",
          title: "Friday vinyl nights",
          body: "Events give regulars a reason to come back and bring friends.",
        },
      ],
    },
    process: {
      kicker: "Visit today",
      title: "Hours, location, and plan-your-visit content.",
      body: "The page answers the questions that usually send customers to three different apps.",
      steps: [
        {
          eyebrow: "Open daily",
          title: "7 AM - 4 PM",
          body: "Clear hours above the fold and repeated near the visit CTA.",
        },
        {
          eyebrow: "Location",
          title: "Corner of Ash and Mercer",
          body: "A dedicated location block for parking, walk-ins, and nearby landmarks.",
        },
        {
          eyebrow: "Events",
          title: "Private tables and pop-ups",
          body: "Community nights, catering, and after-hours inquiries get a clear lead path.",
        },
      ],
    },
    policy: {
      kicker: "Shop story",
      title: "A neighborhood place, not just a menu.",
      body:
        "The about section gives the cafe a point of view: local ingredients, warm service, and repeat visits.",
      items: ["Roasted with regional partners", "Small pastry case, baked daily", "Walk-ins welcome", "Catering and events by inquiry"],
    },
    testimonials: [
      {
        quote: "The site makes me want to visit before I even open the menu.",
        name: "Neighborhood regular",
      },
      {
        quote: "This feels like a real cafe brand, not a restaurant template.",
        name: "Local operator",
      },
    ],
    bookingTitle: "Give locals one place to choose you.",
    bookingCopy:
      "A restaurant site should make ordering, visiting, and booking feel immediate.",
    outreach: {
      blurb:
        "I mocked up a coffee shop concept that shows how your site could make ordering, hours, menu highlights, and catering requests easier to act on from a phone.",
      targetBusiness: "Coffee shops, cafes, bakeries, quick-service restaurants, local hospitality brands",
      bestLink: "https://koinophobia-labs.vercel.app/demos/coffee-shop",
    },
  },
];

export function getDemoConcept(slug: string) {
  return demoConcepts.find((demo) => demo.slug === slug);
}
