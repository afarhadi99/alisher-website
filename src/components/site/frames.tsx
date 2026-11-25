import Image from 'next/image';
import type { Project, ProjectImage } from '@/types';

const external = (src: string) => src.startsWith('http');

export function BrowserFrame({
  src,
  alt,
  label,
  priority = false,
  sizes = '(max-width: 760px) 100vw, 60vw',
  fit = 'cover',
}: {
  src: string;
  alt: string;
  label?: string;
  priority?: boolean;
  sizes?: string;
  fit?: 'cover' | 'natural';
}) {
  return (
    <figure className={`frame frame-browser${fit === 'natural' ? ' is-natural' : ''}`}>
      <div className="frame-bar" aria-hidden="true">
        <span />
        <span />
        <span />
        {label ? <em>{label}</em> : null}
      </div>
      <div className="frame-screen">
        <Image
          src={src}
          alt={alt}
          width={1440}
          height={900}
          sizes={sizes}
          priority={priority}
          unoptimized={external(src)}
        />
      </div>
    </figure>
  );
}

export function PhoneFrame({
  src,
  alt,
  priority = false,
  sizes = '(max-width: 760px) 40vw, 220px',
}: {
  src: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <figure className="frame frame-phone">
      <Image
        src={src}
        alt={alt}
        width={720}
        height={1564}
        sizes={sizes}
        priority={priority}
      />
    </figure>
  );
}

export function TabletFrame({
  src,
  alt,
  sizes = '(max-width: 760px) 90vw, 520px',
}: {
  src: string;
  alt: string;
  sizes?: string;
}) {
  return (
    <figure className="frame frame-tablet">
      <Image src={src} alt={alt} width={1560} height={1170} sizes={sizes} />
    </figure>
  );
}

/** A plain image for store art that already includes its own device frame. */
export function StoreShot({ src, alt }: { src: string; alt: string }) {
  return (
    <figure className="frame frame-store">
      <Image src={src} alt={alt} width={501} height={888} sizes="(max-width: 760px) 40vw, 200px" />
    </figure>
  );
}

const usesStoreArt = (project: Project) => project.id === 'pixio-android';

function Shot({ image, project }: { image: ProjectImage; project: Project }) {
  if (image.shape === 'tablet') return <TabletFrame src={image.src} alt={image.alt} />;
  if (image.shape === 'portrait')
    return usesStoreArt(project) ? (
      <StoreShot src={image.src} alt={image.alt} />
    ) : (
      <PhoneFrame src={image.src} alt={image.alt} />
    );
  return <BrowserFrame src={image.src} alt={image.alt} fit="natural" />;
}

/** The picture a project card leads with, framed for its platform. */
export function ProjectVisual({
  project,
  count = 2,
  sizes,
}: {
  project: Project;
  count?: number;
  sizes?: string;
}) {
  const shots = project.gallery ?? [];
  if (project.platform === 'mobile' && shots.length) {
    return (
      <div className="visual visual-phones">
        {shots.slice(0, count).map((image) => (
          <Shot key={image.src} image={image} project={project} />
        ))}
      </div>
    );
  }
  if (project.platform === 'tablet' && shots.length) {
    return (
      <div className="visual visual-tablet">
        <TabletFrame src={shots[0].src} alt={shots[0].alt} />
      </div>
    );
  }
  if (!project.image) {
    return (
      <div className="visual visual-empty" aria-hidden="true">
        <span>{project.name}</span>
      </div>
    );
  }
  return (
    <div className="visual visual-browser">
      <BrowserFrame
        src={project.image}
        alt={`${project.name} screenshot`}
        sizes={sizes}
      />
    </div>
  );
}

export function ProjectGallery({ project }: { project: Project }) {
  const shots = project.gallery ?? [];
  if (!shots.length) return null;
  const shape = shots[0].shape ?? 'landscape';
  return (
    <div className={`gallery gallery-${shape}`}>
      {shots.map((image) => (
        <Shot key={image.src} image={image} project={project} />
      ))}
    </div>
  );
}
