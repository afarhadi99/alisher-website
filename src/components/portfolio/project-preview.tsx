import Link from 'next/link';
import { ProjectVisual } from '@/components/site/frames';
import { platformLabel } from '@/components/site/project-links';
import type { Project } from '@/types';

export function ProjectPreview({
  project,
  headingLevel = 3,
}: {
  project: Project;
  compact?: boolean;
  wide?: boolean;
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <article className="card catalog-card">
      <Link
        className={`card-visual tone-${project.platform ?? 'web'}`}
        href={`/work/${project.id}`}
        aria-label={`Read about ${project.name}`}
        tabIndex={-1}
      >
        <ProjectVisual
          project={project}
          sizes="(max-width: 640px) 92vw, (max-width: 980px) 46vw, 370px"
        />
      </Link>
      <div className="card-body">
        <span className="tag">{platformLabel(project)}</span>
        <Heading className="tile-title">
          <Link href={`/work/${project.id}`}>{project.name}</Link>
        </Heading>
        <p>{project.shortDescription}</p>
      </div>
    </article>
  );
}
