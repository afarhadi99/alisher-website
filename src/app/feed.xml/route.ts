import { publishedPosts } from '@/data/posts';
import { siteUrl } from '@/lib/site';

export const dynamic = 'force-static';
function escapeXml(value: string) {
  return value.replace(
    /[<>&"']/g,
    (character) =>
      ({
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&apos;',
      })[character]!,
  );
}
export function GET() {
  const base = siteUrl;
  const items = publishedPosts
    .map((post) => {
      const url = escapeXml(post.href ?? `${base}/blog/${post.slug}`);
      return `<item><title>${escapeXml(post.title)}</title><link>${url}</link><guid isPermaLink="true">${url}</guid><description>${escapeXml(post.excerpt)}</description><pubDate>${new Date(`${post.date}T12:00:00Z`).toUTCString()}</pubDate><category>${escapeXml(post.category)}</category></item>`;
    })
    .join('');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Alisher Farhadi</title><link>${base}/blog</link><description>Notes from the making.</description><language>en-us</language>${items}</channel></rss>`,
    {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    },
  );
}
