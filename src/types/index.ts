export interface Project {
  id: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  image: string;
  link?: string;
  githubLink?: string;
  appStoreLink?: string;
  googlePlayLink?: string;
  technologies: string[];
  status: 'completed' | 'in-progress' | 'planned';
  categories: ('devrel' | 'frontend' | 'fullstack' | 'ai')[];
  date: Date;
  featured: boolean;
}

export interface MediaItem {
  id: string;
  title: string;
  shortDescription: string;
  longDescription: string;
  image: string;
  link: string;
  type: 'article' | 'video' | 'podcast' | 'interview' | 'talk';
  platform: string;
  publishedDate: Date;
  featured: boolean;
}

export type ProjectCategory = 'all' | 'devrel' | 'frontend' | 'fullstack' | 'ai';