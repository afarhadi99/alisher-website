# Alisher Farhadi’s portfolio

A fast, content-first portfolio built with Next.js 15, React 19, TypeScript and Tailwind CSS 4. Every page is statically generated: a homepage, a searchable project archive, a page for each project, writing, and a 3D avatar playground.

Production URL: `https://www.alisher.space`.

## Run locally

```sh
npm ci
npm run dev
```

Open http://localhost:3000. For a production check, stop the development server first, then:

```sh
npm run lint
npm run build
npm start
```

## Where things live

| What | File |
| --- | --- |
| Pixio apps, TSI Hub and its apps, teaching details, link corrections | `src/data/portfolio.ts` |
| The original project archive | `src/data/projects.ts` |
| Blog entries | `src/data/posts.ts` |
| Talks and events | `src/data/media.ts` |
| Homepage | `src/app/page.tsx` |
| Header, footer and social links | `src/components/portfolio/site-shell.tsx` |
| Browser, phone and tablet frames | `src/components/site/frames.tsx` |
| The whole visual system | `src/app/site.css` |

## Add or edit a project

Add an entry to `pixioApps` or `hubProjects` in `src/data/portfolio.ts`, or to `projects` in `src/data/projects.ts`. The fields that matter:

- `image`: the lead screenshot. Put files in `public/work/` as WebP, 1440 px wide or larger for web apps.
- `gallery`: extra screenshots for the project page. Set `shape: 'portrait'` for phone screenshots and `shape: 'tablet'` for iPad screenshots so they get a device frame.
- `platform`: `web`, `mobile`, `tablet`, `desktop` or `spatial`. This picks the frame and the label.
- `family`: `pixio` or `tsi-hub` groups a project with its siblings on the homepage, in the archive filters and under "More from…".
- `link`, `linkLabel`, `appStoreLink`, `googlePlayLink`, `githubLink`: every link that is set becomes a button. Apps in the Pixio and TSI Hub families link to the live product only, not to source repositories.
- `highlights`: three or four short, factual points.

The homepage sections read from `pixio`, `pixioApps`, `tsiHub`, `hubApps` and `moreWork`, all exported from `src/data/portfolio.ts`.

### Links that stopped working

The `corrections` map in `src/data/portfolio.ts` layers fixes over the original archive without rewriting it. As of 2026-11-24:

- AI Builders, Spaces Archive, Mindful Flutter App and TSI Quiz are marked archived because their sites or store listings no longer load.
- AI Mastery and the Idea to Impact teaching link point to the recorded sessions on YouTube, because `ideastoimpact.online` is suspended.
- WordPress + WooCommerce MCP points to GitHub, because its Smithery listing was removed.

Remove an entry from `corrections` to restore the original link.

## Open Graph images

Every page has a 1200×630 share card in `public/og/`: `home.jpg` for the site and `<project id>.jpg` for each project. They are generated from the running site, so a new project gets a card without design work:

```sh
npm i -D playwright       # once
npm run build && npm start
node scripts/make-og-images.mjs              # in a second terminal
node scripts/make-og-images.mjs http://localhost:3001   # if the site is on another port
```

`public/og-image.png` is a copy of `home.jpg`, kept for older links.

## Publish a blog post

The blog currently links to articles published on Pixio. To publish an article here, add a `BlogPost` to `src/data/posts.ts`, omit `href`, and provide `body`:

```ts
{
  slug: 'your-post-slug',
  title: 'Your title',
  excerpt: 'A short introduction.',
  date: 'YYYY-MM-DD',
  category: 'Guides', // Guides, Product, or Community
  published: true,
  body: [
    { heading: 'A section title', paragraphs: ['Your first paragraph.'] },
  ],
}
```

Use `published: false` for drafts. Drafts are excluded from routes, the blog index, RSS and the sitemap. RSS is served at `/feed.xml`.

## Teaching and recognition

The UFT section uses the owner-supplied wording: innovative curriculum in CTE, nine consecutive years, 2017–2026. Edit `teaching` in `src/data/portfolio.ts` to change it. No unverified school names, employment dates or metrics have been added. The four figures under the hero come from the owner or from each product’s own public listing; their sources are noted beside `facts` in `src/app/page.tsx`.

## Screenshots

- `public/work/`: Pixio app and TSI Hub screenshots. Web app captures come from each project’s own screenshot folder, phone screenshots from the Pixio AI App Store set, and iPad and Android images from the public store listings.
- `public/screenshots/`: landing-page captures of the older web projects. `sources.json` records where each came from.

## 3D avatar

The interactive avatar lives at `/playground` and is linked from the footer. It is not loaded on any other page. `avatar-portrait.tsx` owns loading, fallback and controls; the dynamically imported `avatar-scene.js` owns Three.js. Run `npm run optimize:avatar` to rebuild `public/avatar/alisher.glb` from the original model and animations; `public/avatar/optimization.json` records the result.

## Not in use

The opening animation and the earlier homepage designs are no longer mounted or imported. Their files are still in the repository and can be deleted: `opening-sequence.tsx`, `workstation-*.js`, `terminal-timeline.js`, `screen-portal.js`, `world-hero.tsx`, `interactive-studio.tsx`, `lesson-lab.tsx`, `project-explorer.tsx`, `quick-jump.tsx` and `portfolio-carousel.tsx` in `src/components/portfolio/`; the `projects`, `media`, `effects` and `ui` component folders; `cinematic.css`, `interactive.css`, `world.css`, `odyssey.css`, `base.css` and `terminal-intro.css` in `src/app/`; and `public/room/`.
