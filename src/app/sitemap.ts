import type { MetadataRoute } from 'next';
import { portfolioProjects } from '@/data/portfolio';
import { publishedPosts } from '@/data/posts';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://www.alisher.space';
  return [
    ...['', '/work', '/blog', '/playground'].map((path) => ({
      url: `${base}${path}`,
    })),
    ...portfolioProjects.map((project) => ({
      url: `${base}/work/${project.id}`,
    })),
    ...publishedPosts
      .filter((post) => !post.href)
      .map((post) => ({
        url: `${base}/blog/${post.slug}`,
        lastModified: post.date,
      })),
  ];
}
