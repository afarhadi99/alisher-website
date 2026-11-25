import type { Metadata } from 'next';
import { SiteHeader, SiteFooter } from '@/components/portfolio/site-shell';
import { PostList } from '@/components/portfolio/post-list';
import { publishedPosts } from '@/data/posts';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Notes on AI, building products, and sharing what I learn. Writing by Alisher Farhadi.',
  alternates: { canonical: '/blog' },
};

export default function BlogPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="container page">
        <div className="page-heading">
          <p className="eyebrow">Writing</p>
          <h1>Notes from the build.</h1>
          <p className="lead">
            What I’m building, what I’m learning, and what’s worth sharing.
          </p>
        </div>
        <PostList posts={publishedPosts} headingLevel={2} />
        <p className="blog-footnote">
          These pieces were originally published on Pixio. Each opens the full
          article.
        </p>
        <a className="text-link" href="/feed.xml">
          Subscribe via RSS
        </a>
      </main>
      <SiteFooter />
    </>
  );
}
