export interface ProjectImage {
  src: string;
  alt: string;
  /** Portrait images are shown in a phone frame. */
  shape?: 'landscape' | 'portrait' | 'tablet';
}

export interface Project {
  id: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  image: string;
  link?: string;
  /** Button text for `link`. Defaults to "Visit the project". */
  linkLabel?: string;
  githubLink?: string;
  appStoreLink?: string;
  googlePlayLink?: string;
  technologies: string[];
  status: 'completed' | 'in-progress' | 'planned';
  categories: ('devrel' | 'frontend' | 'fullstack' | 'ai')[];
  date?: Date;
  featured: boolean;
  platform?: 'web' | 'desktop' | 'mobile' | 'tablet' | 'spatial';
  /** Product family, used for grouping on the homepage and the archive. */
  family?: 'pixio' | 'tsi-hub';
  /** Extra screenshots shown on the project page. */
  gallery?: ProjectImage[];
  /** Three or four short, factual points shown on the project page. */
  highlights?: string[];
  /** Shown as "Published by …" on the project page. */
  publisher?: string;
  screenshotPlaceholder?: boolean;
  linkPlaceholder?: boolean;
  archived?: boolean;
}

export interface MediaItem {
  id: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  image: string;
  link: string;
  type: 'article' | 'video' | 'podcast' | 'interview' | 'talk' | 'event' | 'livestream';
  platform: string;
  publishedDate: Date;
  featured: boolean;
}

export type ProjectCategory = 'all' | 'devrel' | 'frontend' | 'fullstack' | 'ai';
