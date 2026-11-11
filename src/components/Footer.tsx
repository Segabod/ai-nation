import Link from "next/link";
import { Logo } from "./Logo";

export default function Footer() {
  return (
    <footer className="foot">
      <div className="wrap foot-in">
        <div className="row">
          <span className="brand" style={{ fontSize: 16 }}><Logo /> ai nation</span>
          <span className="dim">People. Skills. Opportunity.</span>
        </div>
        <nav aria-label="Footer">
          <Link href="/briefs">Briefs</Link>
          <Link href="/open-house">Open House</Link>
          <Link href="/builders">For builders</Link>
          <Link href="/employers">For employers</Link>
          <Link href="/partners">For partners</Link>
          <Link href="/?choose=1">Change who I am</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <span className="dim">© {new Date().getFullYear()} AI Nation. Concept edition.</span>
      </div>
    </footer>
  );
}
