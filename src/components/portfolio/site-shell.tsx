import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { FaGithub, FaLinkedin, FaXTwitter, FaYoutube } from 'react-icons/fa6';
import { MobileMenu } from '@/components/site/mobile-menu';

export const social = {
  linkedin: 'https://www.linkedin.com/in/alisher-farhadi-540945184/',
  github: 'https://github.com/afarhadi99',
  x: 'https://x.com/AlisherFarhadi',
  youtube: 'https://www.youtube.com/channel/UCftW5EHVIF-_xStoVZL-fYg',
};

const links = [
  { href: '/#work', label: 'Work' },
  { href: '/#hub', label: 'Classroom apps' },
  { href: '/#teaching', label: 'Teaching' },
  { href: '/#writing', label: 'Writing' },
];

export function SiteHeader() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <div className="container site-header-inner">
          <Link href="/" className="wordmark" aria-label="Alisher Farhadi, home">
            <span className="wordmark-mark" aria-hidden="true">
              AF
            </span>
            Alisher Farhadi
          </Link>
          <nav aria-label="Main navigation" className="desktop-nav">
            {links.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
            <Link href="/work">All projects</Link>
          </nav>
          <a href="#contact" className="btn btn-primary btn-sm header-cta">
            Get in touch
          </a>
          <MobileMenu
            links={[...links, { href: '/work', label: 'All projects' }]}
          />
        </div>
      </header>
    </>
  );
}

export function SiteFooter() {
  return (
    <footer id="contact" className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div>
            <p className="eyebrow">Contact</p>
            <h2>
              Have a classroom, a team or a small business that could use AI?
            </h2>
            <p className="footer-lead">
              I build the tool, then teach the people who will use it. Send me a
              note and tell me what you are working on.
            </p>
          </div>
          <div className="footer-actions">
            <a
              className="btn btn-accent"
              href={social.linkedin}
              target="_blank"
              rel="noopener noreferrer"
            >
              Message me on LinkedIn
              <ArrowUpRight size={16} aria-hidden="true" />
            </a>
            <a
              className="btn btn-outline-light"
              href={social.x}
              target="_blank"
              rel="noopener noreferrer"
            >
              Find me on X
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Alisher Farhadi</p>
          <nav aria-label="Social links">
            <a href={social.github} target="_blank" rel="noopener noreferrer">
              <FaGithub aria-hidden="true" /> GitHub
            </a>
            <a href={social.linkedin} target="_blank" rel="noopener noreferrer">
              <FaLinkedin aria-hidden="true" /> LinkedIn
            </a>
            <a href={social.x} target="_blank" rel="noopener noreferrer">
              <FaXTwitter aria-hidden="true" /> X
            </a>
            <a href={social.youtube} target="_blank" rel="noopener noreferrer">
              <FaYoutube aria-hidden="true" /> YouTube
            </a>
            <Link href="/playground">3D avatar</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
