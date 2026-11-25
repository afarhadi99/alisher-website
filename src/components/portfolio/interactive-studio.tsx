'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowDown, ArrowUpRight, RotateCcw } from 'lucide-react';
import { LessonLab } from './lesson-lab';
import { AvatarPortrait } from './avatar-portrait';
import { OpeningSequence } from './opening-sequence';
import { publishedPosts, formatPostDate } from '@/data/posts';

const modes = [
  { id: 'build', label: 'Build' },
  { id: 'teach', label: 'Teach' },
  { id: 'write', label: 'Write' },
] as const;
type Mode = (typeof modes)[number]['id'];

function BuildScene() {
  return (
    <div className="build-scene avatar-build-scene">
      <AvatarPortrait cinematic />
    </div>
  );
}

function WritingScene() {
  return (
    <div className="writing-desk">
      <div className="studio-panel-heading">
        <h2>Notes from building.</h2>
      </div>
      <p className="studio-panel-intro">
        Writing about the tools I build and what I learn along the way.
      </p>
      <div className="writing-desk-articles">
        {publishedPosts.slice(0, 3).map((post) => (
          <article key={post.slug}>
            <h3>
              <a
                href={post.href ?? `/blog/${post.slug}`}
                target={post.href ? '_blank' : undefined}
                rel={post.href ? 'noopener noreferrer' : undefined}
              >
                {post.title}
              </a>
            </h3>
            <time dateTime={post.date}>{formatPostDate(post.date)}</time>
          </article>
        ))}
      </div>
      <Link className="text-link" href="/blog">
        Read the blog
      </Link>
    </div>
  );
}

export function InteractiveStudio() {
  const [mode, setMode] = useState<Mode>('build');
  function replay() {
    setMode('build');
    window.scrollTo({ top: 0, behavior: 'instant' });
    window.dispatchEvent(new Event('portfolio:replay'));
  }
  return (
    <>
      <OpeningSequence />
      <section className="cinema-hero container" aria-labelledby="hero-title">
        <h1 id="hero-title" className="cinema-name">
          Alisher <span>Farhadi</span>
        </h1>
        <div className="cinema-copy">
          <h2>
            Ideas made <br />
            real.
          </h2>
          <p>
            I build software, teach technology, and turn curiosity into
            something useful.
          </p>
          <a className="cinema-cta" href="#work">
            <span>Explore my work</span>
            <ArrowUpRight size={24} aria-hidden="true" />
          </a>
          <div
            className="studio-modes"
            role="group"
            aria-label="Explore Alisher’s studio"
          >
            {modes.map(({ id, label }, index) => (
              <button
                type="button"
                key={id}
                aria-pressed={mode === id}
                onClick={() => setMode(id)}
              >
                <span className="mode-number" aria-hidden="true">
                  0{index + 1}
                </span>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="cinema-stage" data-mode={mode}>
          <div className="cinema-orbit" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="cinema-scene" key={mode}>
            {mode === 'build' ? (
              <BuildScene />
            ) : mode === 'teach' ? (
              <LessonLab />
            ) : (
              <WritingScene />
            )}
          </div>
        </div>
        <div className="cinema-bottom">
          <a href="#work" className="cinema-scroll">
            <ArrowDown size={18} aria-hidden="true" />
            Scroll to discover
          </a>
          <span className="cinema-disciplines">
            Developer. Educator. Entrepreneur.
          </span>
          <button type="button" className="cinema-replay" onClick={replay}>
            <RotateCcw size={15} aria-hidden="true" />
            Replay intro
          </button>
        </div>
      </section>
    </>
  );
}
