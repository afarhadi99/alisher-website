import { projects } from './projects';
import type { Project } from '@/types';

const TSI = 'Tech in Schools Initiative';

// ---------------------------------------------------------------------------
// Pixio beyond the browser. Store links were checked on 2026-11-24.
// ---------------------------------------------------------------------------
export const pixioApps: Project[] = [
  {
    id: 'pixio-ios',
    name: 'Pixio AI for iPhone',
    shortDescription:
      'The Pixio creative studio on iPhone: images, video, music, voice and 3D from 600+ AI models.',
    longDescription:
      'Pixio AI puts the full Pixio studio on a phone. Describe an idea and Pix, the built-in creative director, picks the model, shapes the prompt and generates it. A touch canvas lays out posters and multi-page designs, a timeline editor exports finished video at up to 4K, and Video Agent breaks a story idea into episodes, scenes and shots. Everything syncs with the library on the web. Pixio AI is free on the App Store.',
    image: '/work/pixio-ai-pix.webp',
    gallery: [
      { src: '/work/pixio-ai-pix.webp', alt: 'Pix, the creative director, on the Pixio AI home screen', shape: 'portrait' },
      { src: '/work/pixio-ai-canvas.webp', alt: 'Laying out a design on the Pixio AI touch canvas', shape: 'portrait' },
      { src: '/work/pixio-ai-editor.webp', alt: 'The Pixio AI timeline video editor', shape: 'portrait' },
      { src: '/work/pixio-ai-models.webp', alt: 'Choosing an AI model in Pixio AI', shape: 'portrait' },
    ],
    highlights: [
      '600+ AI models for image, video, music, voice and 3D',
      'Pix chooses the model and writes the prompt for you',
      'Touch canvas and a timeline video editor with export up to 4K',
      'Library synced with the web studio',
    ],
    appStoreLink: 'https://apps.apple.com/us/app/pixio-ai/id6760953214',
    platform: 'mobile',
    family: 'pixio',
    publisher: TSI,
    technologies: ['React Native', 'Expo', 'TypeScript'],
    status: 'completed',
    categories: ['ai', 'fullstack'],
    featured: true,
  },
  {
    id: 'pixio-canvas',
    name: 'Pixio Canvas for iPad',
    shortDescription:
      'An Apple Pencil drawing studio for iPad with an AI companion that draws alongside you.',
    longDescription:
      'Pixio Canvas is an iPad drawing studio built for Apple Pencil. Start from a blank page or an image in your Pixio library, then sketch, refine, trace and animate on one canvas. The AI companion has three modes: Quiet stays out of the way, Whisper responds only when you tap, and Duet answers after your pencil rests. Its results land on separate layers, so your own ink is never touched. Drawing and stencils work offline, and Canvas asks before every AI request. Pixio Canvas is free on the App Store.',
    image: '/work/pixio-canvas-stencils.webp',
    gallery: [
      { src: '/work/pixio-canvas-stencils.webp', alt: 'The stencil library in Pixio Canvas', shape: 'tablet' },
      { src: '/work/pixio-canvas-draw.webp', alt: 'Drawing with Apple Pencil in Pixio Canvas', shape: 'tablet' },
      { src: '/work/pixio-canvas-custom.webp', alt: 'Tracing a custom stencil in Pixio Canvas', shape: 'tablet' },
    ],
    highlights: [
      'Pen, pencil, marker and eraser tuned for Apple Pencil',
      'Three companion modes: Quiet, Whisper and Duet',
      '28 tracing stencils, or make one from a photo or a description',
      'Turn a finished drawing into a video',
    ],
    appStoreLink: 'https://apps.apple.com/us/app/pixio-canvas/id6789967054',
    platform: 'tablet',
    family: 'pixio',
    publisher: TSI,
    technologies: ['iPadOS', 'Apple Pencil', 'Pixio API'],
    status: 'completed',
    categories: ['ai'],
    featured: true,
  },
  {
    id: 'pixio-android',
    name: 'Pixio for Android',
    shortDescription:
      'The Pixio AI studio for Android phones, available on Google Play.',
    longDescription:
      'Pixio for Android brings the studio to Google Play. Generate images, video, music and voice from one app, choose from the full model catalog, and keep everything in the same library you use on the web.',
    image: '/work/pixio-android-1.webp',
    gallery: [
      { src: '/work/pixio-android-1.webp', alt: 'Pixio for Android sign-in screen', shape: 'portrait' },
      { src: '/work/pixio-android-2.webp', alt: 'The model catalog in Pixio for Android', shape: 'portrait' },
      { src: '/work/pixio-android-3.webp', alt: 'A generated video in Pixio for Android', shape: 'portrait' },
    ],
    highlights: [
      'Image, video, music and voice generation in one app',
      'The same account, credits and library as the web studio',
      'Published on Google Play',
    ],
    googlePlayLink:
      'https://play.google.com/store/apps/details?id=com.mytsi.pixio',
    platform: 'mobile',
    family: 'pixio',
    publisher: TSI,
    technologies: ['React Native', 'Expo', 'TypeScript'],
    status: 'completed',
    categories: ['ai', 'fullstack'],
    featured: true,
  },
  {
    id: 'pixio-desktop',
    name: 'Pixio Desktop',
    shortDescription:
      'A native Pixio studio for macOS and Windows, in its own window.',
    longDescription:
      'Pixio Desktop is a hand-built native app for macOS and Windows: a Tauri shell with a custom React interface rather than an embedded website. It connects to the Pixio public API, shows the live model catalog with an input form for each model, keeps a library of past generations, saves outputs through native dialogs and sends a notification when a generation finishes.',
    image: '/work/pixio-desktop.webp',
    highlights: [
      'Native app for macOS and Windows built on Tauri and Rust',
      'Live model catalog with a form generated for each model',
      'Native save dialogs, notifications and pixio:// deep links',
    ],
    link: 'https://beta.pixio.myapps.ai/desktop',
    linkLabel: 'Download for macOS or Windows',
    platform: 'desktop',
    family: 'pixio',
    publisher: TSI,
    technologies: ['Tauri 2', 'Rust', 'React 19', 'TypeScript', 'Tailwind CSS 4'],
    status: 'completed',
    categories: ['ai', 'fullstack'],
    featured: true,
  },
];

// ---------------------------------------------------------------------------
// TSI Hub and the classroom apps students open from it.
// Live links only. These apps do not link to source repositories.
// ---------------------------------------------------------------------------
export const hubProjects: Project[] = [
  {
    id: 'tsi-hub',
    name: 'TSI Hub',
    shortDescription:
      'One sign-in for a school’s apps, files and classes.',
    longDescription:
      'TSI Hub is the classroom portal for Tech in Schools Initiative, rebuilt from an older WordPress site. Students get a searchable directory of more than 80 classroom apps and single sign-on into the ones TSI builds. Teachers create classes with join codes, post announcements, share books, videos and files, and see who is actually using the material. Administrators get role-based access, usage statistics and an audit log of every privileged action.',
    image: '/work/tsi-hub-apps.webp',
    gallery: [
      { src: '/work/tsi-hub-landing.webp', alt: 'TSI Hub landing page' },
      { src: '/work/tsi-hub-class.webp', alt: 'A teacher’s class page in TSI Hub with a join code' },
      { src: '/work/tsi-hub-admin.webp', alt: 'The TSI Hub administrator dashboard' },
    ],
    highlights: [
      'App directory with single sign-on into TSI-built tools',
      'Classes with join codes, announcements and shared resources',
      'File library with a full-screen book viewer and video playback',
      'Admin, teacher and student roles with an audit log',
    ],
    link: 'https://hub.mytsi.org',
    linkLabel: 'Open TSI Hub',
    platform: 'web',
    family: 'tsi-hub',
    publisher: TSI,
    technologies: ['Next.js 16', 'React 19', 'TypeScript', 'MongoDB', 'Better Auth'],
    status: 'completed',
    categories: ['fullstack'],
    featured: true,
  },
  {
    id: 'tsi-code',
    name: 'TSI Code',
    shortDescription:
      'A real code editor and cloud workspace in the browser, so any school laptop is enough.',
    longDescription:
      'TSI Code gives every student a development environment that runs in the browser, so a Chromebook is enough. Projects open in a full editor with a terminal and a cloud workspace. A starter library offers more than 100 working templates across HTML, Node.js, TypeScript, Python, Java, C++ and SQLite. Teachers set assignments and follow class work in one place, and students who sign in through TSI Hub bring their classes with them.',
    image: '/work/tsi-code-projects.webp',
    gallery: [
      { src: '/work/tsi-code-ide.webp', alt: 'A Python project open in the TSI Code editor' },
      { src: '/work/tsi-code-templates.webp', alt: 'The student template library in TSI Code' },
    ],
    highlights: [
      'Browser editor with a terminal and cloud workspace',
      '100+ starter templates in seven languages',
      'Classes, rosters and assignments for teachers',
      'Single sign-on from TSI Hub',
    ],
    link: 'https://code.mytsi.org',
    linkLabel: 'Open TSI Code',
    platform: 'web',
    family: 'tsi-hub',
    publisher: TSI,
    technologies: ['Next.js', 'React', 'TypeScript', 'MongoDB'],
    status: 'completed',
    categories: ['fullstack'],
    featured: true,
  },
  {
    id: 'tsi-ar-studio',
    name: 'TSI AR Studio',
    shortDescription:
      'Build augmented-reality scenes in the browser and share them with a link or QR code.',
    longDescription:
      'TSI AR Studio is a browser-only workspace for authoring, publishing and sharing augmented-reality scenes. Authors arrange 3D shapes, text, images, video, audio and 3D models in an editor, then anchor the scene to a surface or to a printed image. Viewers open a link or scan a QR code on their phone. No app install or headset is needed.',
    image: '/work/tsi-ar-editor.webp',
    gallery: [
      { src: '/work/tsi-ar-viewer.webp', alt: 'A published scene in the TSI AR viewer' },
    ],
    highlights: [
      'Scene editor for shapes, text, images, video, audio and 3D models',
      'Surface placement or printed image targets',
      'Publish to a link and QR code, with no app to install',
    ],
    link: 'https://ar.mytsi.org',
    linkLabel: 'Open AR Studio',
    platform: 'web',
    family: 'tsi-hub',
    publisher: TSI,
    technologies: ['Next.js', 'React', 'TypeScript', 'WebAR'],
    status: 'completed',
    categories: ['fullstack'],
    featured: true,
  },
  {
    id: 'tsi-exchange',
    name: 'TSI Exchange',
    shortDescription:
      'A stock-market simulator for classrooms: virtual cash, real market quotes and class competitions.',
    longDescription:
      'TSI Exchange is an educational stock-trading simulator for personal practice and classroom competitions. Students trade virtual cash against market quotes, research companies with price charts, financials and news, manage conditional orders and compare portfolio risk. Teachers run class competitions and review the reasoning behind each student’s investment decisions.',
    image: '/work/tsi-exchange-research.webp',
    gallery: [
      { src: '/work/tsi-exchange-portfolio.webp', alt: 'A student portfolio in TSI Exchange' },
    ],
    highlights: [
      'Research pages with charts, financials and company news',
      'Market, limit and conditional orders with virtual cash',
      'Class competitions and a teacher view of each decision',
    ],
    link: 'https://stocks.mytsi.org',
    linkLabel: 'Open TSI Exchange',
    platform: 'web',
    family: 'tsi-hub',
    publisher: TSI,
    technologies: ['Next.js 16', 'React 19', 'TypeScript', 'MongoDB', 'Tailwind CSS'],
    status: 'completed',
    categories: ['fullstack'],
    featured: true,
  },
  {
    id: 'tsi-storefront',
    name: 'TSI Storefront',
    shortDescription:
      'A store builder for student entrepreneurs and small merchants, with real checkout and shipping.',
    longDescription:
      'Storefront by TSI is a multi-tenant store platform for independent merchants and their teams. Merchants choose from 24 store designs, manage products, variants and inventory, and take payments into their own Stripe account. Shipping runs through the merchant’s own Shippo or EasyPost account with labels and tracking, and teams work together with owner, admin, editor and support roles.',
    image: '/work/tsi-storefront-store.webp',
    gallery: [
      { src: '/work/tsi-storefront-dashboard.webp', alt: 'The merchant dashboard in TSI Storefront' },
    ],
    highlights: [
      '24 store designs with branding and section controls',
      'Products, variants, inventory and CSV import',
      'Stripe Connect checkout into the merchant’s own account',
      'Shipping labels and tracking through Shippo or EasyPost',
    ],
    link: 'https://myshop.mytsi.org',
    linkLabel: 'Open TSI Storefront',
    platform: 'web',
    family: 'tsi-hub',
    publisher: TSI,
    technologies: ['Next.js', 'TypeScript', 'Stripe Connect', 'Shippo', 'EasyPost'],
    status: 'completed',
    categories: ['fullstack'],
    featured: true,
  },
  {
    id: 'tsi-qr-maker',
    name: 'TSI QR Maker',
    shortDescription:
      'Create styled QR codes and publish online menus from one workspace.',
    longDescription:
      'TSI QR Maker creates personalized QR codes for lessons, links, contacts and Wi-Fi, and keeps them organized in folders. A store manager publishes online menus that customers open by scanning a code at the table. Students sign in with their TSI Hub account.',
    image: '/work/tsi-qr-workspace.webp',
    gallery: [
      { src: '/work/tsi-qr-menu.webp', alt: 'A public menu published from TSI QR Maker' },
    ],
    highlights: [
      'QR codes for links, contacts, Wi-Fi and more, with custom styling',
      'Folders, favorites and dynamic codes',
      'Online menus that open from a scan',
    ],
    link: 'https://qr.mytsi.org',
    linkLabel: 'Open QR Maker',
    platform: 'web',
    family: 'tsi-hub',
    publisher: TSI,
    technologies: ['Next.js 16', 'React 19', 'TypeScript', 'MongoDB'],
    status: 'completed',
    categories: ['fullstack'],
    featured: true,
  },
  {
    id: 'tsi-resume-builder',
    name: 'TSI Resume Builder',
    shortDescription:
      'Build a resume, tailor it to a job with AI and publish it, starting from 100+ templates.',
    longDescription:
      'TSI Resume Builder helps students write a first resume and tailor it to a specific job. It offers more than 100 templates, reads an existing resume from an uploaded document, uses AI to adjust the wording for a job posting and shows a live preview as you type. Finished resumes print to PDF or publish to a shareable page.',
    image: '/work/tsi-resume-editor.webp',
    gallery: [
      { src: '/work/tsi-resume-templates.webp', alt: 'The template gallery in TSI Resume Builder' },
    ],
    highlights: [
      '100+ templates with live preview',
      'Upload an existing resume to start from',
      'AI tailoring for a specific job posting',
    ],
    link: 'https://resume.mytsi.org',
    linkLabel: 'Open Resume Builder',
    platform: 'web',
    family: 'tsi-hub',
    publisher: TSI,
    technologies: ['Next.js 16', 'React 19', 'TypeScript', 'MongoDB'],
    status: 'completed',
    categories: ['fullstack', 'ai'],
    featured: true,
  },
];

// ---------------------------------------------------------------------------
// The original archive (src/data/projects.ts) with corrections layered on top.
// ---------------------------------------------------------------------------
const platforms: Record<string, Project['platform']> = {
  '8': 'mobile',
  '12': 'mobile',
  '16': 'spatial',
  '17': 'spatial',
  '20': 'mobile',
  '21': 'mobile',
};
const screenshots: Record<string, string> = {
  '1': '/screenshots/pixio-home-desktop.webp',
  '2': '/screenshots/ai-tutor-home-desktop.webp',
  '3': '/screenshots/machine-home-desktop.webp',
  '10': '/screenshots/ideas-to-impact-home-desktop.webp',
  '4': '/screenshots/documentation-home-desktop.webp',
  '5': '/screenshots/pixio-starter-home-desktop.webp',
};
// Links checked on 2026-11-24. Entries here replace or retire what no longer loads.
const corrections: Record<string, Partial<Project>> = {
  '1': {
    family: 'pixio',
    highlights: [
      '600+ AI models for images, video, audio and 3D in one studio',
      'Pix agent, canvas, video editor and reusable workflows',
      'Native apps for iPhone, iPad, Android, macOS and Windows',
    ],
  },
  // aibuilders.dev now redirects to a domain-sale page.
  '9': { archived: true, link: undefined },
  // ideastoimpact.online is suspended; the recorded sessions are on YouTube.
  '10': {
    link: 'https://www.youtube.com/@aitutorxpixio/playlists',
    linkLabel: 'Watch the sessions',
  },
  // spaces-archive.com did not load. The source remains available.
  '11': { archived: true, link: undefined },
  // The hosted demo is suspended.
  '12': { archived: true, link: undefined },
  // The Smithery listing was removed; the server lives on GitHub.
  '13': {
    link: 'https://github.com/afarhadi99/WordPress-mcp-full',
    linkLabel: 'View on GitHub',
    githubLink: undefined,
  },
  // No longer listed on the App Store or Google Play.
  '20': { archived: true, appStoreLink: undefined, googlePlayLink: undefined },
};
// Projects whose only link is their repository.
const sourceOnly = new Set(['8', '14', '15', '16', '17']);

const archive: Project[] = projects.map((project): Project => {
  const merged: Project = {
    ...project,
    platform: platforms[project.id] ?? 'web',
    image:
      screenshots[project.id] ??
      (project.image.includes('placeholder') ? '' : project.image),
    ...corrections[project.id],
  };
  if (sourceOnly.has(project.id)) {
    merged.link = undefined;
  }
  return merged;
});

const byId = (id: string) => archive.find((project) => project.id === id)!;
const lead = ['1', '2', '3'];

/** Everything, in the order the archive shows it. */
export const portfolioProjects: Project[] = [
  byId('1'),
  ...pixioApps,
  ...hubProjects,
  byId('2'),
  byId('3'),
  ...archive.filter((project) => !lead.includes(project.id)),
];

export const getProject = (id: string) =>
  portfolioProjects.find((project) => project.id === id);

export const pixio = byId('1');
export const tsiHub = hubProjects[0];
export const hubApps = hubProjects.slice(1);
export const moreWork = ['2', '3', '13'].map(byId);
export const selectedProjects = lead.map(byId);

export const teaching = {
  award: {
    organization: 'United Federation of Teachers',
    title: 'Innovative Curriculum in CTE',
    period: '2017–2026',
    consecutiveYears: '9',
    // Wording, period and consecutive-year count supplied by Alisher.
    description:
      'Nine consecutive years of UFT recognition for innovative curriculum in career and technical education.',
  },
  experiences: [
    {
      title: 'Technology in schools',
      description:
        'Teaching students to turn ideas into working technology through the Tech in Schools Initiative.',
      href: 'https://getmytsi.org/',
    },
    {
      title: 'Idea to Impact',
      description:
        'Live classes on building AI products, from the first line of code to launch. Nine seasons so far.',
      href: 'https://www.youtube.com/@aitutorxpixio/playlists',
    },
    {
      title: 'Building in public',
      description:
        'Workshops, live builds and shared experiments in AI and software development.',
      href: 'https://www.youtube.com/channel/UCftW5EHVIF-_xStoVZL-fYg',
    },
  ],
};
