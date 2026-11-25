'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Shuffle } from 'lucide-react';

export interface ExplorerProject {
  id: string;
  name: string;
  image: string;
  shortDescription: string;
  technologies: string[];
}

export function ProjectExplorer({ projects }: { projects: ExplorerProject[] }) {
  const [active, setActive] = useState(0);
  const detail = useRef<HTMLDivElement>(null);
  const revealAfterSelection = useRef(false);
  const project = projects[active];
  function reveal() {
    detail.current?.scrollIntoView({
      block: 'start',
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    });
    detail.current?.focus({ preventScroll: true });
  }
  function choose(index: number) {
    if (matchMedia('(max-width: 640px)').matches) {
      if (index === active) reveal();
      else revealAfterSelection.current = true;
    }
    setActive(index);
  }
  useEffect(() => {
    if (!revealAfterSelection.current) return;
    revealAfterSelection.current = false;
    reveal();
  }, [active]);
  function next(direction: number) {
    setActive(
      (index) => (index + direction + projects.length) % projects.length,
    );
  }
  function surprise() {
    setActive(
      (index) =>
        (index + 1 + Math.floor(Math.random() * (projects.length - 1))) %
        projects.length,
    );
  }
  return (
    <div className="project-explorer">
      <div className="explorer-sidebar">
        <div
          className="explorer-choices"
          role="group"
          aria-label="Choose a project"
        >
          {projects.map((item, index) => (
            <button
              type="button"
              key={item.id}
              aria-pressed={active === index}
              aria-controls="selected-project"
              onClick={() => choose(index)}
            >
              <span className="explorer-number">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span>{item.name}</span>
              <span className="explorer-selection" aria-hidden="true">
                {active === index ? 'Viewing' : 'View'}
              </span>
            </button>
          ))}
        </div>
        <button type="button" className="surprise-button" onClick={surprise}>
          <Shuffle size={18} aria-hidden="true" />
          Surprise me
        </button>
      </div>
      <div
        className="explorer-detail"
        id="selected-project"
        role="region"
        aria-label={`Selected project: ${project.name}`}
        tabIndex={-1}
        ref={detail}
        key={project.id}
      >
        <Link
          href={`/work/${project.id}`}
          className="explorer-image"
          aria-label={`Explore ${project.name}`}
        >
          <Image
            src={project.image}
            alt={`${project.name} website screenshot`}
            width={1440}
            height={900}
            sizes="(max-width: 960px) 100vw, 800px"
          />
        </Link>
        <div className="explorer-detail-bottom">
          <div>
            <h3>
              <Link href={`/work/${project.id}`}>{project.name}</Link>
            </h3>
            <p>{project.shortDescription}</p>
            <ul className="explorer-stack" aria-label="Technologies">
              {project.technologies.slice(0, 3).map((technology) => (
                <li key={technology}>{technology}</li>
              ))}
            </ul>
            <Link className="text-link" href={`/work/${project.id}`}>
              Get into the details
            </Link>
          </div>
          <div className="explorer-step-controls">
            <button
              type="button"
              onClick={() => next(-1)}
              aria-label="Previous project"
            >
              <ArrowUp size={20} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => next(1)}
              aria-label="Next project"
            >
              <ArrowDown size={20} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
