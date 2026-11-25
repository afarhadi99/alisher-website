'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { ProjectPreview } from './project-preview';
import type { Project } from '@/types';

const filters = [
  'All',
  'Pixio',
  'Classroom apps',
  'Mobile and desktop',
  'Developer tools',
] as const;
type Filter = (typeof filters)[number];

function matches(project: Project, filter: Filter) {
  switch (filter) {
    case 'Pixio':
      return project.family === 'pixio';
    case 'Classroom apps':
      return project.family === 'tsi-hub';
    case 'Mobile and desktop':
      return project.platform !== 'web';
    case 'Developer tools':
      return project.categories.includes('devrel');
    default:
      return true;
  }
}

export function ProjectCatalog({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState<Filter>('All');
  const [query, setQuery] = useState('');
  const term = query.toLowerCase().trim();
  const visible = projects.filter((project) => {
    const text =
      `${project.name} ${project.shortDescription} ${project.technologies.join(' ')}`.toLowerCase();
    return matches(project, filter) && text.includes(term);
  });
  return (
    <>
      <div className="catalog-controls">
        <div
          className="filters"
          role="group"
          aria-label="Filter projects"
        >
          {filters.map((item) => (
            <button
              type="button"
              key={item}
              aria-pressed={item === filter}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
        <label className="search-field">
          <Search size={16} aria-hidden="true" />
          <span className="visually-hidden">Search projects</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or technology"
          />
        </label>
      </div>
      <p className="result-count" role="status">
        {visible.length} {visible.length === 1 ? 'project' : 'projects'}
      </p>
      {visible.length ? (
        <div className="tile-grid">
          {visible.map((project) => (
            <ProjectPreview key={project.id} project={project} headingLevel={2} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No projects found.</h2>
          <p>Try another name or technology.</p>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setQuery('');
              setFilter('All');
            }}
          >
            Clear filters
          </button>
        </div>
      )}
    </>
  );
}
