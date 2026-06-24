import Image from "next/image";
import { footerTags, navItems } from "@/lib/content";
import { hasLink, link, LINKS } from "@/lib/links";
import { Chip } from "@/components/ui";

const connect: Array<[keyof typeof LINKS, string]> = [
  ["email", "Email"],
  ["instagram", "Instagram"],
  ["tiktok", "TikTok"],
  ["linkedin", "LinkedIn"],
  ["github", "GitHub"],
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <a className="brand" href="#top" aria-label="Koinophobia Labs home">
          <span className="brand-mark">
            <Image src="/koi-mark.png" alt="" width={34} height={34} />
          </span>
          <span>
            <strong>KOINOPHOBIA</strong>
            <em>LABS</em>
          </span>
        </a>
        <p>
          A software and automation lab building <strong>useful systems for messy work.</strong>
        </p>
      </div>
      <div>
        <h3>NAVIGATE</h3>
        {navItems.map((item) => (
          <a key={item.id} href={`#${item.id}`}>
            {item.label}
          </a>
        ))}
      </div>
      <div>
        <h3>CONNECT</h3>
        {connect.map(([key, label]) => {
          const href = link(key);
          const external = href.startsWith("http");
          return (
            <a key={key} href={href} target={external ? "_blank" : undefined} rel={external ? "noopener" : undefined}>
              {label}
              {!hasLink(key) ? " · soon" : ""}
            </a>
          );
        })}
        <a href={link("ykbPrivacy")}>You Know Ball Privacy</a>
        <a href={link("ykbSupport")}>You Know Ball Support</a>
        <a href={link("ykbSafety")}>You Know Ball Safety</a>
      </div>
      <div className="footer-bottom">
        <span>© 2026 KOINOPHOBIA LABS</span>
        <div>
          {footerTags.map((tag) => (
            <Chip key={tag.label} tone={tag.tone as "cyan"}>
              {tag.label}
            </Chip>
          ))}
        </div>
      </div>
    </footer>
  );
}
