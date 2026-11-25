import Link from 'next/link';
import { SiteHeader, SiteFooter } from '@/components/portfolio/site-shell';
export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="container page">
        <div className="page-heading">
          <h1>A wrong turn.</h1>
          <p className="lead">
            That page isn’t here. There’s plenty more to explore.
          </p>
        </div>
        <Link className="btn btn-primary" href="/">
          Back home
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}
