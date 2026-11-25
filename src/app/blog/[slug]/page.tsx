import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { SiteHeader, SiteFooter } from '@/components/portfolio/site-shell';
import { publishedPosts, formatPostDate } from '@/data/posts';

export const dynamicParams = false;
export function generateStaticParams() {
  return publishedPosts.map((post) => ({ slug: post.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = publishedPosts.find((post) => post.slug === slug);
  return {
    title: post?.title ?? 'Article',
    description: post?.excerpt,
    alternates: { canonical: post?.href ?? `/blog/${slug}` },
    openGraph: {
      type: 'article',
      publishedTime: post?.date,
      authors: ['Alisher Farhadi'],
    },
  };
}
export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = publishedPosts.find((post) => post.slug === slug);
  if (!post) notFound();
  if (post.href) redirect(post.href);
  return (
    <>
      <SiteHeader />
      <main id="main" className="container page article-page">
        <Link className="text-link" href="/blog">
          Back to the blog
        </Link>
        <article>
          <div className="page-heading">
            <h1>{post.title}</h1>
            <p className="post-meta">
              <time dateTime={post.date}>{formatPostDate(post.date)}</time>
              <span>Alisher Farhadi</span>
            </p>
            <p className="lead">{post.excerpt}</p>
          </div>
          <div className="prose">
            {post.body?.map((section) => (
              <section key={section.heading}>
                <h2>{section.heading}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </section>
            ))}
          </div>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
