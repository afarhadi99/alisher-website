import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  GraduationCap,
  Hammer,
  Rocket,
} from 'lucide-react';
import { SiteHeader, SiteFooter } from '@/components/portfolio/site-shell';
import {
  BrowserFrame,
  PhoneFrame,
  ProjectVisual,
} from '@/components/site/frames';
import { ProjectLinks, platformLabel } from '@/components/site/project-links';
import {
  hubApps,
  moreWork,
  pixio,
  pixioApps,
  portfolioProjects,
  teaching,
  tsiHub,
} from '@/data/portfolio';
import { publishedPosts, formatPostDate } from '@/data/posts';
import { mediaItems } from '@/data/media';

export const metadata = { alternates: { canonical: '/' } };

// Each figure comes from the owner or from the product's own public listing.
const facts = [
  {
    figure: '9 years',
    label: 'of consecutive UFT recognition for innovative curriculum in CTE',
  },
  {
    figure: '600+',
    label: 'AI models in Pixio for images, video, audio and 3D',
  },
  {
    figure: '5 platforms',
    label: 'shipped: web, iPhone, iPad, Android and desktop',
  },
  {
    figure: '80+',
    label: 'classroom apps organized behind one sign-in in TSI Hub',
  },
];

const services = [
  {
    icon: Hammer,
    title: 'Build the tool',
    body: 'Custom AI assistants, automations and internal tools that fit the way a team already works, from a first prototype to something people use every day.',
  },
  {
    icon: GraduationCap,
    title: 'Teach the people',
    body: 'Hands-on workshops and classes for teachers, students and non-technical teams. People learn by building something of their own, with a guide they can follow later.',
  },
  {
    icon: Rocket,
    title: 'Ship it properly',
    body: 'Sign-in, payments, documentation and app-store releases. I take a product the whole way to launch, not just to a demo.',
  },
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="hero" aria-labelledby="hero-title">
          <div className="container hero-grid">
            <div className="hero-copy">
              <div className="identity">
                <Image
                  src="/headshot.png"
                  alt="Alisher Farhadi wearing a mixed-reality headset"
                  width={112}
                  height={112}
                  sizes="56px"
                  priority
                />
                <p>
                  <strong>Alisher Farhadi</strong>
                  Software builder · Technology educator
                </p>
              </div>
              <h1 id="hero-title">
                I build AI tools people actually use, and teach them how.
              </h1>
              <p className="lead">
                I ship AI products for the web, iPhone, iPad, Android and
                desktop, and I build classroom software with Tech in Schools
                Initiative. The United Federation of Teachers has recognized my
                curriculum nine years running.
              </p>
              <div className="link-row">
                <a className="btn btn-primary" href="#work">
                  See the work
                  <ArrowRight size={16} aria-hidden="true" />
                </a>
                <a className="btn btn-secondary" href="#contact">
                  Get in touch
                </a>
              </div>
            </div>
            <div className="hero-visual">
              <BrowserFrame
                src={pixio.image}
                alt="The Pixio AI studio home page"
                label="pixio.myapps.ai"
                priority
                sizes="(max-width: 900px) 92vw, 620px"
              />
              <div className="hero-phone">
                <PhoneFrame
                  src="/work/pixio-ai-pix.webp"
                  alt="Pixio AI on iPhone"
                  priority
                  sizes="(max-width: 900px) 30vw, 190px"
                />
              </div>
              <Link className="hero-chip" href="/work/tsi-hub">
                <Image
                  src="/work/tsi-hub-apps.webp"
                  alt=""
                  width={320}
                  height={225}
                  sizes="160px"
                />
                <span>
                  <strong>TSI Hub</strong>
                  Classroom apps, one sign-in
                </span>
              </Link>
            </div>
          </div>
        </section>

        <section className="facts" aria-label="At a glance">
          <dl className="container facts-grid">
            {facts.map((fact) => (
              <div key={fact.figure}>
                <dt>{fact.figure}</dt>
                <dd>{fact.label}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="work" className="section" aria-labelledby="pixio-title">
          <div className="container">
            <div className="section-head">
              <div>
                <p className="eyebrow">Featured product · Pixio</p>
                <h2 id="pixio-title">An AI creative studio on every screen.</h2>
              </div>
              <p>
                Pixio brings more than 600 AI models for images, video, audio
                and 3D into one studio. It began in the browser and now ships
                as native apps for iPhone, iPad, Android, macOS and Windows.
              </p>
            </div>

            <article className="feature">
              <Link
                className="feature-visual"
                href="/work/1"
                aria-label="Read about Pixio"
              >
                <BrowserFrame
                  src={pixio.image}
                  alt="Pixio web studio"
                  label="pixio.myapps.ai"
                  sizes="(max-width: 900px) 92vw, 680px"
                />
              </Link>
              <div className="feature-copy">
                <span className="tag">Web</span>
                <h3>
                  <Link href="/work/1">Pixio on the web</Link>
                </h3>
                <p>{pixio.shortDescription}</p>
                <ul className="check-list">
                  {pixio.highlights?.map((item) => (
                    <li key={item}>
                      <Check size={16} aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="link-row">
                  <a
                    className="btn btn-primary"
                    href={pixio.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open Pixio
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </a>
                  <Link className="btn btn-secondary" href="/work/1">
                    Project details
                  </Link>
                </div>
              </div>
            </article>

            <div className="app-grid">
              {pixioApps.map((app) => (
                <article className="card app-card" key={app.id}>
                  <Link
                    className={`card-visual tone-${app.platform}`}
                    href={`/work/${app.id}`}
                    aria-label={`Read about ${app.name}`}
                  >
                    <ProjectVisual
                      project={app}
                      sizes="(max-width: 760px) 92vw, 560px"
                    />
                  </Link>
                  <div className="card-body">
                    <span className="tag">{platformLabel(app)}</span>
                    <h3>
                      <Link href={`/work/${app.id}`}>{app.name}</Link>
                    </h3>
                    <p>{app.shortDescription}</p>
                    <ProjectLinks project={app} size="sm" />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="hub"
          className="section section-tint"
          aria-labelledby="hub-title"
        >
          <div className="container">
            <div className="section-head">
              <div>
                <p className="eyebrow">Classroom software · TSI Hub</p>
                <h2 id="hub-title">
                  One hub for a school’s apps, files and classes.
                </h2>
              </div>
              <p>
                TSI Hub is where students and teachers in Tech in Schools
                Initiative programs start their day. One account opens a
                directory of classroom apps, and the tools TSI builds launch
                with single sign-on.
              </p>
            </div>

            <article className="feature feature-flip">
              <Link
                className="feature-visual"
                href="/work/tsi-hub"
                aria-label="Read about TSI Hub"
              >
                <BrowserFrame
                  src={tsiHub.image}
                  alt="The TSI Hub app directory"
                  label="hub.mytsi.org"
                  sizes="(max-width: 900px) 92vw, 680px"
                />
              </Link>
              <div className="feature-copy">
                <span className="tag">Web</span>
                <h3>
                  <Link href="/work/tsi-hub">TSI Hub</Link>
                </h3>
                <p>{tsiHub.shortDescription}</p>
                <ul className="check-list">
                  {tsiHub.highlights?.map((item) => (
                    <li key={item}>
                      <Check size={16} aria-hidden="true" />
                      {item}
                    </li>
                  ))}
                </ul>
                <div className="link-row">
                  <a
                    className="btn btn-primary"
                    href={tsiHub.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open TSI Hub
                    <ArrowUpRight size={16} aria-hidden="true" />
                  </a>
                  <Link className="btn btn-secondary" href="/work/tsi-hub">
                    Project details
                  </Link>
                </div>
              </div>
            </article>

            <h3 className="sub-head">Apps inside the hub</h3>
            <div className="tile-grid">
              {hubApps.map((app) => (
                <article className="card tile" key={app.id}>
                  <Link
                    className="tile-visual"
                    href={`/work/${app.id}`}
                    aria-label={`Read about ${app.name}`}
                  >
                    <Image
                      src={app.image}
                      alt={`${app.name} screenshot`}
                      width={720}
                      height={450}
                      sizes="(max-width: 640px) 92vw, (max-width: 980px) 46vw, 370px"
                    />
                  </Link>
                  <div className="card-body">
                    <h4>
                      <Link href={`/work/${app.id}`}>{app.name}</Link>
                    </h4>
                    <p>{app.shortDescription}</p>
                    <a
                      className="text-link"
                      href={app.link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {app.linkLabel}
                      <ArrowUpRight size={15} aria-hidden="true" />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section" aria-labelledby="more-title">
          <div className="container">
            <div className="section-head">
              <div>
                <p className="eyebrow">More work</p>
                <h2 id="more-title">Platforms, agents and open source.</h2>
              </div>
              <Link className="text-link head-link" href="/work">
                Browse all {portfolioProjects.length} projects
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
            <div className="tile-grid">
              {moreWork.map((project) => (
                <article className="card tile" key={project.id}>
                  <Link
                    className="tile-visual"
                    href={`/work/${project.id}`}
                    aria-label={`Read about ${project.name}`}
                  >
                    <Image
                      src={project.image}
                      alt={`${project.name} screenshot`}
                      width={720}
                      height={450}
                      sizes="(max-width: 640px) 92vw, (max-width: 980px) 46vw, 370px"
                    />
                  </Link>
                  <div className="card-body">
                    <h3 className="tile-title">
                      <Link href={`/work/${project.id}`}>{project.name}</Link>
                    </h3>
                    <p>{project.shortDescription}</p>
                    <Link className="text-link" href={`/work/${project.id}`}>
                      Project details
                      <ArrowRight size={15} aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section-rule" aria-labelledby="help-title">
          <div className="container">
            <div className="section-head">
              <div>
                <p className="eyebrow">Working together</p>
                <h2 id="help-title">Practical help, start to finish.</h2>
              </div>
              <p>
                I listen first. Most good projects start with one task that
                eats someone’s week, and a working fix for it built alongside
                the people who will use it.
              </p>
            </div>
            <div className="service-grid">
              {services.map((service) => (
                <article key={service.title}>
                  <service.icon size={22} aria-hidden="true" />
                  <h3>{service.title}</h3>
                  <p>{service.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="teaching"
          className="section section-dark"
          aria-labelledby="teaching-title"
        >
          <div className="container teaching-grid">
            <div>
              <p className="eyebrow">In the classroom</p>
              <h2 id="teaching-title">
                The best thing you can build is someone’s confidence.
              </h2>
              <div className="award">
                <span className="award-figure">
                  {teaching.award.consecutiveYears}
                </span>
                <div>
                  <strong>Consecutive years of UFT recognition</strong>
                  <span>
                    {teaching.award.title} · {teaching.award.period}
                  </span>
                  <span>{teaching.award.organization}</span>
                </div>
              </div>
            </div>
            <ol className="lesson-list">
              {teaching.experiences.map((experience, index) => (
                <li key={experience.title}>
                  <span aria-hidden="true">0{index + 1}</span>
                  <div>
                    <h3>
                      <a
                        href={experience.href}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {experience.title}
                        <ArrowUpRight size={16} aria-hidden="true" />
                      </a>
                    </h3>
                    <p>{experience.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="writing" className="section" aria-labelledby="writing-title">
          <div className="container split">
            <div>
              <div className="section-head stacked">
                <div>
                  <p className="eyebrow">Writing</p>
                  <h2 id="writing-title">Notes from the build.</h2>
                </div>
                <Link className="text-link" href="/blog">
                  All posts
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
              <ul className="note-list">
                {publishedPosts.slice(0, 3).map((post) => (
                  <li key={post.slug}>
                    <a
                      href={post.href ?? `/blog/${post.slug}`}
                      target={post.href ? '_blank' : undefined}
                      rel={post.href ? 'noopener noreferrer' : undefined}
                    >
                      <span className="post-meta">
                        {post.category} ·{' '}
                        <time dateTime={post.date}>
                          {formatPostDate(post.date)}
                        </time>
                      </span>
                      <strong>{post.title}</strong>
                      <span>{post.excerpt}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div id="media">
              <div className="section-head stacked">
                <div>
                  <p className="eyebrow">Talks and events</p>
                  <h2>Learning in public.</h2>
                </div>
              </div>
              <ul className="media-list">
                {mediaItems.map((item) => (
                  <li key={item.id}>
                    <a href={item.link} target="_blank" rel="noopener noreferrer">
                      <Image
                        src={item.image}
                        alt=""
                        width={300}
                        height={200}
                        sizes="120px"
                      />
                      <span>
                        <strong>{item.title}</strong>
                        <span>{item.platform}</span>
                      </span>
                      <ArrowUpRight size={16} aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
