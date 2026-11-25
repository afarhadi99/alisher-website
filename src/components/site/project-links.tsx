import { ArrowUpRight } from 'lucide-react';
import { FaApple, FaGithub, FaGooglePlay } from 'react-icons/fa6';
import type { Project } from '@/types';

/** Every outbound link a project has, primary action first. */
export function ProjectLinks({
  project,
  size = 'md',
}: {
  project: Project;
  size?: 'sm' | 'md';
}) {
  const cls = size === 'sm' ? 'btn btn-sm' : 'btn';
  const out = { target: '_blank', rel: 'noopener noreferrer' } as const;
  let primaryUsed = false;
  const tone = () => {
    if (primaryUsed) return `${cls} btn-secondary`;
    primaryUsed = true;
    return `${cls} btn-primary`;
  };
  return (
    <div className="link-row">
      {project.link ? (
        <a className={tone()} href={project.link} {...out}>
          {project.linkLabel ?? 'Visit the project'}
          <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      ) : null}
      {project.appStoreLink ? (
        <a className={tone()} href={project.appStoreLink} {...out}>
          <FaApple size={16} aria-hidden="true" />
          App Store
        </a>
      ) : null}
      {project.googlePlayLink ? (
        <a className={tone()} href={project.googlePlayLink} {...out}>
          <FaGooglePlay size={14} aria-hidden="true" />
          Google Play
        </a>
      ) : null}
      {project.githubLink ? (
        <a className={tone()} href={project.githubLink} {...out}>
          <FaGithub size={16} aria-hidden="true" />
          Source on GitHub
        </a>
      ) : null}
    </div>
  );
}

export function platformLabel(project: Project) {
  if (project.archived) return 'Archive';
  switch (project.platform) {
    case 'mobile':
      return project.googlePlayLink && !project.appStoreLink
        ? 'Android'
        : project.appStoreLink && !project.googlePlayLink
          ? 'iPhone'
          : 'Mobile';
    case 'tablet':
      return 'iPad';
    case 'desktop':
      return 'macOS · Windows';
    case 'spatial':
      return 'visionOS';
    default:
      return 'Web';
  }
}
