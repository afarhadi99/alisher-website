export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: 'Guides' | 'Product' | 'Community';
  href?: string;
  body?: { heading: string; paragraphs: string[] }[];
  published: boolean;
}

// External posts link to the original. To write here, omit href and add body sections.
// Drafts (published: false) never appear in the index, sitemap, or generated routes.
export const posts: BlogPost[] = [
  {
    slug: 'gemini-omni-flash-prompt-guide',
    title: 'Gemini Omni Flash: a prompting guide',
    excerpt:
      'Working with references, audio, timing, and video editing in Pixio.',
    date: '2026-07-01',
    category: 'Guides',
    href: 'https://beta.pixio.myapps.ai/blog/gemini-omni-flash-prompt-guide',
    published: true,
  },
  {
    slug: 'introducing-pix-agent',
    title: 'Introducing Pix Agent',
    excerpt:
      'An AI creative director inside Pixio, from an idea to a creative workflow.',
    date: '2026-06-15',
    category: 'Product',
    href: 'https://beta.pixio.myapps.ai/blog/introducing-pix-agent',
    published: true,
  },
  {
    slug: 'pixio-ai-film-festival-2026',
    title: 'Inside the Pixio AI Film Festival',
    excerpt:
      'Recordings, workshops, and the work shared by a community of AI filmmakers.',
    date: '2026-04-11',
    category: 'Community',
    href: 'https://beta.pixio.myapps.ai/blog/pixio-ai-film-festival-2026',
    published: true,
  },
];

export const publishedPosts = posts
  .filter((post) => post.published)
  .sort((a, b) => b.date.localeCompare(a.date));
export function formatPostDate(date: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`));
}
