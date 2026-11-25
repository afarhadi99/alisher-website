import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { SiteHeader, SiteFooter } from '@/components/portfolio/site-shell';
import {
  BrowserFrame,
  ProjectGallery,
} from '@/components/site/frames';
import { ProjectLinks, platformLabel } from '@/components/site/project-links';
import { getProject, portfolioProjects } from '@/data/portfolio';

export const dynamicParams = false;
export function generateStaticParams() {
  return portfolioProjects.map((project) => ({ id: project.id }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const project = getProject(id);
  if (!project) return { title: 'Project' };
  const images = [
    {
      url: `/og/${project.id}.jpg`,
      width: 1200,
      height: 630,
      alt: `${project.name}: ${project.shortDescription}`,
    },
  ];
  return {
    title: project.name,
    description: project.shortDescription,
    alternates: { canonical: `/work/${id}` },
    openGraph: {
      type: 'website',
      siteName: 'Alisher Farhadi',
      title: `${project.name} | Alisher Farhadi`,
      description: project.shortDescription,
      url: `/work/${id}`,
      images,
    },
    twitter: {
      card: 'summary_large_image',
      creator: '@AlisherFarhadi',
      title: `${project.name} | Alisher Farhadi`,
      description: project.shortDescription,
      images: images.map((image) => image.url),
    },
  };
}

const familyName = { pixio: 'Pixio', 'tsi-hub': 'TSI Hub' } as const;

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = getProject(id);
  if (!project) notFound();

  const framed = project.platform === 'mobile' || project.platform === 'tablet';
  const related = project.family
    ? portfolioProjects.filter(
        (other) => other.family === project.family && other.id !== project.id,
      )
    : [];
  const hasLinks =
    project.link ||
    project.appStoreLink ||
    project.googlePlayLink ||
    project.githubLink;

  return (
    <>
      <SiteHeader />
      <main id="main" className="container page project-page">
        <Link className="text-link back-link" href="/work">
          <ArrowLeft size={16} aria-hidden="true" />
          All projects
        </Link>
        <div className="page-heading">
          <p className="eyebrow">
            {project.family ? `${familyName[project.family]} · ` : ''}
            {platformLabel(project)}
          </p>
          <h1>{project.name}</h1>
          <p className="lead">{project.shortDescription}</p>
          {hasLinks ? <ProjectLinks project={project} /> : null}
          {project.archived ? (
            <p className="note">
              This project is archived. Its original site is no longer online.
            </p>
          ) : null}
        </div>

        {framed ? (
          <div className={`project-stage tone-${project.platform}`}>
            <ProjectGallery project={project} />
          </div>
        ) : project.image ? (
          <BrowserFrame
            src={project.image}
            alt={`${project.name} screenshot`}
            sizes="(max-width: 1240px) 96vw, 1180px"
            fit="natural"
            priority
          />
        ) : null}

        <div className="project-body">
          <div>
            <h2>About the project</h2>
            <p>{project.longDescription}</p>
            {project.highlights?.length ? (
              <ul className="check-list">
                {project.highlights.map((item) => (
                  <li key={item}>
                    <Check size={16} aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <aside aria-label="Project details">
            <dl>
              <div>
                <dt>Platform</dt>
                <dd>{platformLabel(project)}</dd>
              </div>
              {project.publisher ? (
                <div>
                  <dt>Published by</dt>
                  <dd>{project.publisher}</dd>
                </div>
              ) : null}
              {project.technologies.length ? (
                <div>
                  <dt>Built with</dt>
                  <dd>
                    <ul className="chip-list">
                      {project.technologies.map((technology) => (
                        <li key={technology}>{technology}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
              ) : null}
            </dl>
          </aside>
        </div>

        {!framed && project.gallery?.length ? (
          <section aria-labelledby="gallery-title" className="project-section">
            <h2 id="gallery-title">More screens</h2>
            <ProjectGallery project={project} />
          </section>
        ) : null}

        {related.length ? (
          <section aria-labelledby="related-title" className="project-section">
            <h2 id="related-title">
              More from {familyName[project.family!]}
            </h2>
            <ul className="related-list">
              {related.map((other) => (
                <li key={other.id}>
                  <Link href={`/work/${other.id}`}>
                    <span>
                      <strong>{other.name}</strong>
                      <span>{other.shortDescription}</span>
                    </span>
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </>
  );
}
