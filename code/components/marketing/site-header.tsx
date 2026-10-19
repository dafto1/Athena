import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { MotionLink } from "./motion-effects";
import styles from "./landing.module.css";

export function SiteHeader() {
  return <header className={styles.header}>
    <Link href="#top" className={styles.wordmark} aria-label="Athena home"><span className={styles.brandIcon}>a</span><span>athena</span></Link>
    <nav className={styles.nav} aria-label="Main navigation"><a href="#features">What’s inside</a><a href="#workspace">Preview</a></nav>
    <div className={styles.headerActions}><Link href="/login" className={styles.login}>Log in</Link><MotionLink href="/register" className={styles.headerCta}>Get started <ArrowUpRight size={14} /></MotionLink></div>
  </header>;
}
