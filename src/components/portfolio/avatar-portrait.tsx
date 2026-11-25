"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";

interface AvatarController {
  dispose(): void;
  setMotion(enabled: boolean): void;
  frame(mode: "portrait" | "full"): void;
  reset(): void;
  rotate(direction: number): void;
  wave(): void;
}

export function AvatarPortrait({
  autoLoad = true,
  cinematic = false,
}: {
  autoLoad?: boolean;
  cinematic?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const controller = useRef<AvatarController | null>(null);
  const [requested, setRequested] = useState(false);
  const [status, setStatus] = useState<"photo" | "loading" | "ready" | "error">(
    "photo",
  );
  const [error, setError] = useState("");
  const [motion, setMotion] = useState(false);
  const [full, setFull] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!autoLoad || !root.current) return;
    const connection = (
      navigator as Navigator & { connection?: { saveData?: boolean } }
    ).connection;
    if (connection?.saveData) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRequested(true);
          observer.disconnect();
        }
      },
      { rootMargin: "80px", threshold: 0.05 },
    );
    observer.observe(root.current);
    return () => observer.disconnect();
  }, [autoLoad]);

  useEffect(() => {
    if (!requested || !stage.current) return;
    let cancelled = false;
    const mount = stage.current;
    setStatus("loading");
    setFull(false);
    import("./avatar-scene")
      .then(({ createAvatarScene }) => {
        if (cancelled) return;
        controller.current = createAvatarScene(mount, {
          cinematic,
          onReady() {
            if (!cancelled) setStatus("ready");
          },
          onMotionChange(enabled: boolean) {
            if (!cancelled) setMotion(enabled);
          },
          onError(message: string) {
            if (cancelled) return;
            controller.current = null;
            setError(message);
            setStatus("error");
          },
        });
      })
      .catch(() => {
        if (!cancelled) {
          setError(
            "3D is unavailable in this browser. Your photo is still here.",
          );
          setStatus("error");
        }
      });
    return () => {
      cancelled = true;
      controller.current?.dispose();
      controller.current = null;
    };
  }, [requested, attempt, cinematic]);

  function load() {
    setRequested(true);
    if (status === "error") setAttempt((value) => value + 1);
  }
  const ready = status === "ready";
  return (
    <div className="avatar-experience" ref={root}>
      <div className="avatar-stage-shell">
        <div className="avatar-stage" ref={stage} />
        {!ready ? (
          <div className="avatar-poster">
            <Image
              src="/headshot.png"
              alt="Alisher Farhadi wearing a mixed reality headset"
              fill
              sizes="(max-width: 640px) 90vw, 580px"
              priority={autoLoad}
            />
          </div>
        ) : null}
        {!ready ? (
          <div className="avatar-load-state">
            <p role="status">
              {status === "loading"
                ? "Loading the 3D portrait…"
                : status === "error"
                  ? error
                  : "Meet Alisher in 3D."}
            </p>
            {status !== "loading" ? (
              <button type="button" className="avatar-control" onClick={load}>
                {status === "error" ? "Retry 3D" : "Open 3D portrait"}
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      <div
        className="avatar-toolbar"
        role="group"
        aria-label="3D portrait controls"
      >
        <button
          type="button"
          className="avatar-control"
          disabled={!ready}
          aria-pressed={full}
          onClick={() => {
            controller.current?.frame(full ? "portrait" : "full");
            setFull((value) => !value);
          }}
        >
          {full ? "Portrait" : "Full view"}
        </button>
        <button
          type="button"
          className="avatar-control"
          disabled={!ready}
          aria-pressed={motion}
          aria-label={motion ? "Pause motion" : "Resume motion"}
          onClick={() => controller.current?.setMotion(!motion)}
        >
          {motion ? "Pause" : "Animate"}
        </button>
        <button
          type="button"
          className="avatar-control"
          disabled={!ready}
          onClick={() => controller.current?.wave()}
        >
          Wave
        </button>
        <details
          className="avatar-more"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.currentTarget.open = false;
              event.currentTarget.querySelector("summary")?.focus();
            }
          }}
        >
          <summary className="avatar-control">More</summary>
          <div
            className="avatar-more-panel"
            role="group"
            aria-label="Adjust portrait"
          >
            <button
              type="button"
              className="avatar-control icon-control"
              disabled={!ready}
              aria-label="Rotate avatar left"
              onClick={() => controller.current?.rotate(-1)}
            >
              <ArrowLeft size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="avatar-control icon-control"
              disabled={!ready}
              aria-label="Rotate avatar right"
              onClick={() => controller.current?.rotate(1)}
            >
              <ArrowRight size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="avatar-control icon-control"
              disabled={!ready}
              aria-label="Reset avatar view"
              onClick={() => controller.current?.reset()}
            >
              <RotateCcw size={18} aria-hidden="true" />
            </button>
          </div>
        </details>
      </div>
      <p className="avatar-hint">Drag sideways to rotate. Pinch to zoom.</p>
    </div>
  );
}
