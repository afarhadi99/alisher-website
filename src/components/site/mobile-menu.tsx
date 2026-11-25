'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

/** The small-screen menu. Closes after a choice, on Escape and on an outside tap. */
export function MobileMenu({
  links,
}: {
  links: { href: string; label: string }[];
}) {
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = () => menu.current?.removeAttribute('open');
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    const onPointer = (event: PointerEvent) => {
      if (!menu.current?.contains(event.target as Node)) close();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  }, []);
  return (
    <details className="mobile-menu" ref={menu}>
      <summary aria-label="Menu">
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </summary>
      <nav
        aria-label="Mobile navigation"
        onClick={() => menu.current?.removeAttribute('open')}
      >
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
        <a href="#contact">Get in touch</a>
      </nav>
    </details>
  );
}
