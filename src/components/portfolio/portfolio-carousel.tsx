"use client";

import {
  Children,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

/** Native touch scrolling, with the same snap positions for buttons and keyboard. */
export function PortfolioCarousel({
  children,
  label,
  className = "",
}: {
  children: ReactNode;
  label: string;
  className?: string;
}) {
  const id = useId();
  const track = useRef<HTMLDivElement>(null);
  const positions = useRef<number[]>([0]);
  const drag = useRef({ x: 0, left: 0, active: false, moved: false });
  const [view, setView] = useState({ index: 0, count: 1 });

  useEffect(() => {
    const element = track.current;
    if (!element) return;
    let frame = 0;
    function measure() {
      if (!element) return;
      const maximum = Math.max(0, element.scrollWidth - element.clientWidth);
      const first = (element.firstElementChild as HTMLElement)?.offsetLeft ?? 0;
      positions.current = Array.from(
        new Set(
          Array.from(element.children, (child) =>
            Math.round(
              Math.min(maximum, (child as HTMLElement).offsetLeft - first),
            ),
          ),
        ),
      );
      if (!positions.current.length) positions.current = [0];
      update();
    }
    function update() {
      if (!element) return;
      const index = positions.current.reduce(
        (nearest, value, i, stops) =>
          Math.abs(value - element.scrollLeft) <
          Math.abs(stops[nearest] - element.scrollLeft)
            ? i
            : nearest,
        0,
      );
      setView((previous) =>
        previous.index === index && previous.count === positions.current.length
          ? previous
          : { index, count: positions.current.length },
      );
    }
    function onScroll() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    Array.from(element.children).forEach((child) => observer.observe(child));
    element.addEventListener("scroll", onScroll, { passive: true });
    measure();
    return () => {
      observer.disconnect();
      element.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  function go(index: number) {
    const target = Math.max(0, Math.min(index, positions.current.length - 1));
    track.current?.scrollTo({
      left: positions.current[target],
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }

  return (
    <div
      className={`portfolio-carousel ${className}`}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
    >
      <div
        className="carousel-track"
        id={id}
        ref={track}
        tabIndex={0}
        aria-label={`${label}. Use left and right arrow keys to browse.`}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            go(view.index + (event.key === "ArrowRight" ? 1 : -1));
          } else if (event.key === "Home" || event.key === "End") {
            event.preventDefault();
            go(event.key === "Home" ? 0 : positions.current.length - 1);
          }
        }}
        onPointerDown={(event) => {
          if (event.pointerType !== "mouse" || event.button !== 0) return;
          drag.current = {
            x: event.clientX,
            left: event.currentTarget.scrollLeft,
            active: true,
            moved: false,
          };
        }}
        onPointerMove={(event) => {
          const state = drag.current;
          if (!state.active) return;
          const distance = event.clientX - state.x;
          if (!state.moved && Math.abs(distance) < 6) return;
          state.moved = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          event.currentTarget.dataset.dragging = "true";
          event.currentTarget.scrollLeft = state.left - distance;
        }}
        onPointerUp={(event) => {
          drag.current.active = false;
          delete event.currentTarget.dataset.dragging;
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={(event) => {
          drag.current.active = false;
          delete event.currentTarget.dataset.dragging;
        }}
        onPointerLeave={() => {
          if (!drag.current.moved) drag.current.active = false;
        }}
        onDragStart={(event) => event.preventDefault()}
        onClickCapture={(event) => {
          if (drag.current.moved) {
            event.preventDefault();
            event.stopPropagation();
            drag.current.moved = false;
          }
        }}
      >
        {Children.map(children, (child, index) => (
          <div
            className="carousel-slide"
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${Children.count(children)}`}
          >
            {child}
          </div>
        ))}
      </div>
      <div className="carousel-navigation" hidden={view.count <= 1}>
        <div
          className="carousel-position"
          aria-live="polite"
          aria-atomic="true"
        >
          <span>{String(view.index + 1).padStart(2, "0")}</span>
          <span aria-hidden="true"> / </span>
          <span className="sr-only">of </span>
          {String(view.count).padStart(2, "0")}
        </div>
        <div className="carousel-progress" aria-hidden="true">
          {Array.from({ length: view.count }, (_, index) => (
            <span key={index} data-active={index === view.index} />
          ))}
        </div>
        <div className="carousel-arrows">
          <button
            type="button"
            aria-label={`Previous ${label}`}
            aria-controls={id}
            disabled={view.index === 0}
            onClick={() => go(view.index - 1)}
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={`Next ${label}`}
            aria-controls={id}
            disabled={view.index === view.count - 1}
            onClick={() => go(view.index + 1)}
          >
            <ArrowRight size={20} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
