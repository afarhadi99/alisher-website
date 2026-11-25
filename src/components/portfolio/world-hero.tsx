"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { ArrowDown, ArrowUpRight, RotateCcw } from "lucide-react";
import { AvatarPortrait } from "./avatar-portrait";
import { OpeningSequence } from "./opening-sequence";

export function WorldHero() {
  const stage = useRef<HTMLElement>(null);
  return (
    <>
      <OpeningSequence />
      <section
        className="world-hero"
        ref={stage}
        aria-labelledby="world-name"
        onPointerMove={(event) => {
          if (
            event.pointerType !== "mouse" ||
            matchMedia("(prefers-reduced-motion: reduce)").matches
          )
            return;
          const box = event.currentTarget.getBoundingClientRect();
          stage.current?.style.setProperty(
            "--drift",
            `${((event.clientX - box.left) / box.width - 0.5) * 18}px`,
          );
        }}
        onPointerLeave={() =>
          stage.current?.style.setProperty("--drift", "0px")
        }
      >
        <div className="world-name" aria-hidden="true">
          <span>Alisher</span>
          <span>Farhadi</span>
        </div>
        <div className="world-introduction">
          <h1 id="world-name">
            <span>Alisher</span> <span>Farhadi</span>
          </h1>
          <p>
            Software builder.
            <br />
            Technology educator.
            <br />
            Always making something.
          </p>
          <a href="#work">
            Explore my work <ArrowDown size={18} aria-hidden="true" />
          </a>
        </div>
        <div className="world-avatar">
          <AvatarPortrait cinematic />
        </div>
        <Link className="world-preview world-preview-one" href="/work/1">
          <Image
            src="/screenshots/pixio-home-desktop.webp"
            alt="Pixio AI creation studio"
            width={600}
            height={375}
            sizes="(max-width: 640px) 130px, 24vw"
            priority
          />
          <span>
            Pixio <ArrowUpRight size={18} aria-hidden="true" />
          </span>
        </Link>
        <Link className="world-preview world-preview-two" href="/work/2">
          <Image
            src="/screenshots/ai-tutor-home-desktop.webp"
            alt="AI Tutor"
            width={600}
            height={375}
            sizes="(max-width: 640px) 120px, 20vw"
            priority
          />
          <span>
            AI Tutor <ArrowUpRight size={18} aria-hidden="true" />
          </span>
        </Link>
        <div className="world-aside">
          <span>
            From the first idea
            <br />
            to the thing you can use.
          </span>
          <button
            onClick={() => window.dispatchEvent(new Event("portfolio:replay"))}
            type="button"
          >
            <RotateCcw size={14} aria-hidden="true" /> Replay entrance
          </button>
        </div>
      </section>
    </>
  );
}
