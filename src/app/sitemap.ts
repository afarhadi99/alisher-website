import type { MetadataRoute } from 'next';
import { portfolioProjects } from '@/data/portfolio';
import { publishedPosts } from '@/data/posts';
import { siteUrl } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl;
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
