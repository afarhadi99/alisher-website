import Link from 'next/link';
import { formatPostDate, type BlogPost } from '@/data/posts';

export function PostList({
  posts,
  headingLevel = 3,
}: {
  posts: BlogPost[];
  headingLevel?: 2 | 3;
}) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3';
  return (
    <div className="post-list">
      {posts.map((post) => (
        <article className="post-row" key={post.slug}>
          <div className="post-meta">
            <time dateTime={post.date}>{formatPostDate(post.date)}</time>
            <span>{post.category}</span>
          </div>
          <div>
            <Heading>
              {post.href ? (
                <a href={post.href} target="_blank" rel="noopener noreferrer">
                  {post.title}
                </a>
              ) : (
                <Link href={`/blog/${post.slug}`}>{post.title}</Link>
              )}
            </Heading>
            <p>{post.excerpt}</p>
          </div>
          <span className="post-source">
            {post.href ? 'On Pixio' : 'On the blog'}
          </span>
        </article>
      ))}
    </div>
  );
}
