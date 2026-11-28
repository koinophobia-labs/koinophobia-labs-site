import type { ReactNode } from "react";
import Masthead from "@/components/site/Masthead";
import SiteFooter from "@/components/site/SiteFooter";
import styles from "./blog.module.css";

export default function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <div className="site" data-motion-shell>
      <Masthead />
      <main className="shell page">
        <div className={styles.prose}>{children}</div>
        <SiteFooter />
      </main>
    </div>
  );
}
