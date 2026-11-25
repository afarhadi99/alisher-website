import type { Metadata } from 'next';
import { SiteHeader, SiteFooter } from '@/components/portfolio/site-shell';
import { ProjectCatalog } from '@/components/portfolio/project-catalog';
import { portfolioProjects } from '@/data/portfolio';

export const metadata: Metadata = {
  title: 'Projects',
  description:
    'AI products, classroom apps, mobile and desktop apps, and open-source tools by Alisher Farhadi.',
  alternates: { canonical: '/work' },
};

export default function WorkPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="container page">
        <div className="page-heading">
          <p className="eyebrow">Projects</p>
          <h1>Everything I’ve built and shipped.</h1>
          <p className="lead">
            AI products, classroom apps, native apps and open-source tools.
            Each one links to the live product where there is one.
          </p>
        </div>
        <ProjectCatalog projects={portfolioProjects} />
      </main>
      <SiteFooter />
    </>
  );
}
