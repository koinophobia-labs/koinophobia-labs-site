import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarCheck, CheckCircle2, LinkIcon, Mail, MapPin, Target } from "lucide-react";
import Footer from "@/components/Footer";
import Nav from "@/components/Nav";
import { Button, Kicker, SectionHead } from "@/components/ui";
import { demoConcepts, getDemoConcept } from "@/lib/demoConcepts";

export function generateStaticParams() {
  return demoConcepts.map((demo) => ({ slug: demo.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const demo = getDemoConcept(slug);

  if (!demo) return {};

  return {
    title: `${demo.name} - Website Concept by Koinophobia Labs`,
    description: demo.subhead,
  };
}

export default async function DemoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const demo = getDemoConcept(slug);

  if (!demo) notFound();

  const Icon = demo.icon;

  return (
    <>
      <div className="page-field" aria-hidden="true" />
      <Nav />
      <main className={`demo-page demo-${demo.accent}`}>
        <section className="demo-hero section">
          <div className="demo-hero-copy">
            <Link className="back-link" href="/#concepts">
              <ArrowLeft size={16} /> Back to concepts
            </Link>
            <Kicker tone="gold">{demo.category}</Kicker>
            <h1>{demo.headline}</h1>
            <p className="hero-sub">{demo.subhead}</p>
            <div className="concept-note">{demo.conceptNote}</div>
            <div className="cta-row">
              <Button href="#booking" tone="gold">
                {demo.primaryCta}
              </Button>
              <Button href="#services" tone="cyan">
                {demo.secondaryCta}
              </Button>
            </div>
            <div className="brand-tags">
              {demo.stats.map((stat) => (
                <span key={stat}>{stat}</span>
              ))}
            </div>
          </div>
          <aside className="client-site-frame panel">
            <div className="mock-browser">
              <span />
              <span />
              <span />
              <strong>{demo.name.toLowerCase().replaceAll(" ", "-")}.com</strong>
            </div>
            <div className="client-visual">
              <div className="client-visual-copy">
                <span>{demo.heroVisual.eyebrow}</span>
                <Icon size={48} />
                <strong>{demo.name}</strong>
                <p>{demo.heroVisual.title}</p>
              </div>
              <div className="visual-detail-card">
                <p>{demo.heroVisual.body}</p>
                <ul>
                  {demo.heroVisual.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mini-proof">
              {demo.proof.map((item) => (
                <span key={item}>
                  <CheckCircle2 size={14} /> {item}
                </span>
              ))}
            </div>
          </aside>
        </section>

        <section className="section demo-problem">
          <div className="problem-card">
            <span>Problem</span>
            <p>{demo.problem}</p>
          </div>
          <div className="problem-card">
            <span>Site strategy</span>
            <p>{demo.result}</p>
          </div>
        </section>

        <section className="section business-spotlight" aria-labelledby="spotlight-title">
          <SectionHead
            kicker={demo.spotlight.kicker}
            index="// REAL_BUSINESS_PROOF"
            title={demo.spotlight.title}
          >
            {demo.spotlight.body}
          </SectionHead>
          <div className="spotlight-grid">
            {demo.spotlight.items.map((item) => (
              <article className="spotlight-card" key={item.title}>
                <span>{item.eyebrow}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="services" className="section demo-services" aria-labelledby="demo-services-title">
          <SectionHead
            kicker="Offer architecture"
            index="// SERVICE_STACK"
            title="What the page sells first."
          >
            Short sections that make this specific business easier to understand, trust, and contact
            from a phone.
          </SectionHead>
          <div className="services-grid">
            {demo.services.map((service) => (
              <article className="service-card" key={service.title}>
                <Icon size={24} />
                <h3>{service.title}</h3>
                <p>{service.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section process-section" aria-labelledby="process-title">
          <SectionHead
            kicker={demo.process.kicker}
            index="// CUSTOMER_PATH"
            title={demo.process.title}
          >
            {demo.process.body}
          </SectionHead>
          <div className="process-grid">
            {demo.process.steps.map((step) => (
              <article className="process-card" key={step.title}>
                <span>{step.eyebrow}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section gallery-section" aria-label={`${demo.name} gallery concept`}>
          <SectionHead
            kicker="Visual trust"
            index="// IMAGE_SYSTEM"
            title="Gallery-style proof."
          >
            Safe placeholder visuals show where real client photography would create proof, texture,
            and buying confidence.
          </SectionHead>
          <div className="demo-gallery">
            {demo.gallery.map((item, index) => (
              <figure key={item} className={`gallery-tile tile-${index + 1}`}>
                <Icon size={28} />
                <figcaption>{item}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="section policy-section" aria-labelledby="policy-title">
          <div className="policy-panel panel">
            <div>
              <Kicker tone="gold">{demo.policy.kicker}</Kicker>
              <h2 id="policy-title">{demo.policy.title}</h2>
              <p>{demo.policy.body}</p>
            </div>
            <ul>
              {demo.policy.items.map((item) => (
                <li key={item}>
                  <CheckCircle2 size={16} /> {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="section testimonial-section" aria-label={`${demo.name} testimonials`}>
          <div className="testimonial-grid">
            {demo.testimonials.map((testimonial) => (
              <blockquote key={testimonial.name}>
                <p>&ldquo;{testimonial.quote}&rdquo;</p>
                <cite>{testimonial.name}</cite>
              </blockquote>
            ))}
          </div>
        </section>

        <section id="booking" className="section booking-section">
          <div className="booking-panel panel">
            <div>
              <Kicker tone="gold">Conversion target</Kicker>
              <h2>{demo.bookingTitle}</h2>
              <p>{demo.bookingCopy}</p>
            </div>
            <div className="booking-actions">
              <Button href="mailto:koinophobia999@gmail.com?subject=Website%20concept%20build" tone="gold">
                <CalendarCheck size={18} />
                Request a build estimate
              </Button>
              <a href="mailto:koinophobia999@gmail.com?subject=Website%20review%20request">
                Send your current site or Instagram
              </a>
              <a href="mailto:koinophobia999@gmail.com?subject=What%20would%20you%20improve%20first%3F">
                Ask what I&apos;d improve first
              </a>
              <span>
                <MapPin size={15} /> Demo concept, not a real business.
              </span>
            </div>
          </div>
        </section>

        <section className="section outreach-section">
          <div className="outreach-card panel">
            <Kicker tone="gold">Use this in outreach</Kicker>
            <div>
              <span>
                <Mail size={14} /> Email blurb
              </span>
              <p>{demo.outreach.blurb}</p>
            </div>
            <div>
              <span>
                <Target size={14} /> Target business
              </span>
              <p>{demo.outreach.targetBusiness}</p>
            </div>
            <div>
              <span>
                <LinkIcon size={14} /> Best link to send
              </span>
              <a href={demo.outreach.bestLink}>{demo.outreach.bestLink}</a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
