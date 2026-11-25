import type { Metadata } from 'next';
import { SiteHeader, SiteFooter } from '@/components/portfolio/site-shell';
import { AvatarPlayground } from '@/components/portfolio/avatar-playground';

export const metadata: Metadata = {
  title: '3D and augmented reality',
  description:
    'An interactive 3D and augmented reality experiment by Alisher Farhadi.',
  alternates: { canonical: '/playground' },
};
export default function PlaygroundPage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="container page">
        <div className="page-heading">
          <p className="eyebrow">Playground</p>
          <h1>My 3D avatar.</h1>
          <p className="lead">
            An experiment in real-time 3D and augmented reality, built with
            Three.js. Drag to rotate, or open it in AR on a phone.
          </p>
        </div>
        <AvatarPlayground />
      </main>
      <SiteFooter />
    </>
  );
}
