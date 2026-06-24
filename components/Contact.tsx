"use client";

import { FormEvent, useState } from "react";
import { contactOptions } from "@/lib/content";
import { hasLink, link, LINKS } from "@/lib/links";
import { Reveal, SectionHead } from "@/components/ui";

type Errors = Partial<Record<"name" | "contact" | "type" | "message", string>>;

const channelLabels: Array<[keyof typeof LINKS, string]> = [
  ["email", "Email"],
  ["instagram", "Instagram"],
  ["tiktok", "TikTok"],
  ["linkedin", "LinkedIn"],
  ["github", "GitHub"],
];

export default function Contact() {
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextErrors: Errors = {};
    const name = String(form.get("name") || "").trim();
    const contact = String(form.get("contact") || "").trim();
    const type = String(form.get("type") || "").trim();
    const message = String(form.get("message") || "").trim();
    if (!name) nextErrors.name = "Add your name.";
    if (!contact) nextErrors.contact = "Add an email or handle.";
    if (!type) nextErrors.type = "Pick a build type.";
    if (message.length < 12) nextErrors.message = "Give me at least one useful sentence.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const subject = encodeURIComponent(`Koinophobia Labs inquiry: ${type}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail or handle: ${contact}\nProject type: ${type}\n\nMessage:\n${message}`,
    );
    window.location.href = `mailto:koinophobia999@gmail.com?subject=${subject}&body=${body}`;
    setSent(true);
  }

  return (
    <section id="contact" className="section contact-section" aria-labelledby="contact-title">
      <Reveal>
        <SectionHead
          kicker="Open channel"
          index="// CONTACT"
          title={
            <>
              Let&apos;s build something <span className="mark">useful</span>.
            </>
          }
        >
          Client work, collaboration, or You Know Ball access — drop a line.
          Real messages get real answers.
        </SectionHead>
      </Reveal>
      <div className="contact-grid">
        <Reveal direction="left">
          <form className="contact-form panel" onSubmit={onSubmit} noValidate>
            {sent ? (
              <div className="success-state" role="status">
                Message received. KOI logged it…
              </div>
            ) : null}
            <label>
              <span>Name</span>
              <input name="name" aria-describedby="name-error" />
              {errors.name ? <em id="name-error">{errors.name}</em> : null}
            </label>
            <label>
              <span>Email or handle</span>
              <input name="contact" aria-describedby="contact-error" />
              {errors.contact ? <em id="contact-error">{errors.contact}</em> : null}
            </label>
            <label>
              <span>What are you building?</span>
              <select name="type" defaultValue="" aria-describedby="type-error">
                <option value="" disabled>
                  Select a build type
                </option>
                {contactOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
              {errors.type ? <em id="type-error">{errors.type}</em> : null}
            </label>
            <label>
              <span>Message</span>
              <textarea name="message" rows={6} aria-describedby="message-error" />
              {errors.message ? <em id="message-error">{errors.message}</em> : null}
            </label>
            <button className="btn btn-gold" type="submit">
              Send message
            </button>
            <p className="contact-fallback">
              If the form does not open your email app, email me directly at{" "}
              <a href="mailto:koinophobia999@gmail.com">koinophobia999@gmail.com</a>.
            </p>
          </form>
        </Reveal>
        <Reveal direction="right">
          <aside className="channels panel">
            <h3>Direct channels</h3>
            <ul>
              {channelLabels.map(([key, label]) => {
                const href = link(key);
                const external = href.startsWith("http");
                return (
                  <li key={key}>
                    <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener" : undefined}>
                      <span>{label}</span>
                      {!hasLink(key) ? <em>· soon</em> : null}
                    </a>
                  </li>
                );
              })}
            </ul>
            <p>
              <strong>DM KOI</strong>
              The fastest way in is a straight message on any channel above.
            </p>
          </aside>
        </Reveal>
      </div>
    </section>
  );
}
