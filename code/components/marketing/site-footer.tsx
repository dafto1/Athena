import Link from "next/link";
import styles from "./landing.module.css";

export function SiteFooter() {
  return <footer className={styles.footer}>
    <Link href="#top" className={styles.wordmark}><span className={styles.brandIcon}>a</span><span>athena</span></Link>
    <span>Tasks. Focus. Resources. Together.</span>
    <div><Link href="/login">Log in</Link><small>© 2026 Athena</small></div>
  </footer>;
}
