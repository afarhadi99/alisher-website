"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { createScreenPortal } from "./screen-portal";
import { INTRO_DURATION, REVEAL_AT, terminalFrame } from "./terminal-timeline";

const SESSION_KEY = "alisher-workstation-intro-v3";
const mobileQuery = "(pointer: coarse), (max-width: 40rem)";

export function OpeningSequence() {
  const [take, setTake] = useState(0);
  const [sound, setSound] = useState(false);
  const [sceneState, setSceneState] = useState("loading");
  const [exiting, setExiting] = useState(false);
  const [frame, setFrame] = useState(() => terminalFrame(0));
  const dialog = useRef<HTMLDialogElement>(null);
  const mount = useRef<HTMLDivElement>(null);
  const audio = useRef<AudioContext | null>(null);
  const clock = useRef(0);

  function stopAudio() {
    const context = audio.current;
    audio.current = null;
    if (context && context.state !== "closed")
      void context.close().catch(() => {});
  }
  function finish() {
    stopAudio();
    setSound(false);
    dialog.current?.close();
    setTake(0);
    window.dispatchEvent(new Event("portfolio:skip"));
  }

  useEffect(() => {
    function start(event?: Event) {
      if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      if (event) window.scrollTo({ top: 0, behavior: "instant" });
      setExiting(false);
      setSceneState("loading");
      setFrame(terminalFrame(0));
      setTake((value) => value + 1);
    }
    try {
      if (!sessionStorage.getItem(SESSION_KEY)) {
        start();
        sessionStorage.setItem(SESSION_KEY, "seen");
      }
    } catch {
      start();
    }
    window.addEventListener("portfolio:replay", start);
    return () => window.removeEventListener("portfolio:replay", start);
  }, []);

  useEffect(() => {
    if (!take || !mount.current) return;
    const element = dialog.current;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflowY;
    const oldRootOverflow = document.documentElement.style.overflowY;
    const oldGutter = document.documentElement.style.scrollbarGutter;
    document.documentElement.style.scrollbarGutter = "stable";
    document.documentElement.style.overflowY = "hidden";
    document.body.style.overflowY = "hidden";
    window.dispatchEvent(new Event("portfolio:opening"));
    element?.showModal();
    element?.focus({ preventScroll: true });
    let cancelled = false;
    let scene: { dispose(): void; render(time: number): void } | undefined;
    let began = false;
    let timer = 0;
    let lastCharacters = 0;
    let hiddenAt = 0;
    let pausedFor = 0;
    let lastFrame = "";
    let revealed = false;
    let lastTick = 0;
    let timelineElapsed = 0;
    let lastPaint = 0;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const container = mount.current;
    const page = container.closest<HTMLElement>(".portfolio-world");
    const portal =
      element && page ? createScreenPortal(element, container, page) : null;

    function end() {
      if (cancelled) return;
      stopAudio();
      setSound(false);
      element?.close();
      setTake(0);
      window.dispatchEvent(new Event("portfolio:skip"));
    }
    function onMotion() {
      if (reduced.matches) end();
    }
    function onVisibility() {
      if (document.hidden) {
        hiddenAt = performance.now();
        window.cancelAnimationFrame(timer);
      }
      else if (hiddenAt) {
        pausedFor += performance.now() - hiddenAt;
        hiddenAt = 0;
        lastPaint = 0;
        if (began && !cancelled) timer = requestAnimationFrame(animate);
      }
    }
    function animate(now: number) {
        if (cancelled || document.hidden) return;
        // Follow the display clock, capped at 60 fps on high-refresh screens.
        if (lastPaint && now - lastPaint < 1000 / 60 - 1) {
          timer = requestAnimationFrame(animate);
          return;
        }
        lastPaint = now;
        const tick = now - clock.current - pausedFor;
        const delta = Math.max(0, tick - lastTick);
        lastTick = tick;
        // A slow GPU frame must not teleport the camera through the monitor.
        // Hidden-tab time is already excluded; cap individual visible steps.
        timelineElapsed += scene ? Math.min(delta, 80) : delta;
        const elapsed = timelineElapsed;
        try {
          scene?.render(elapsed);
        } catch {
          scene?.dispose();
          portal?.dispose();
          scene = undefined;
          setSceneState("fallback");
        }
        const next = terminalFrame(elapsed);
        const signature = JSON.stringify(next);
        if (!scene && signature !== lastFrame) {
          setFrame(next);
          lastFrame = signature;
        }
        const characters = next.login.length + next.password.length;
        if (
          characters !== lastCharacters &&
          audio.current?.state === "running"
        ) {
          const context = audio.current;
          const click = context.createOscillator();
          const gain = context.createGain();
          click.type = "triangle";
          click.frequency.setValueAtTime(
            130 + (characters % 4) * 35,
            context.currentTime,
          );
          gain.gain.setValueAtTime(0.035, context.currentTime);
          gain.gain.exponentialRampToValueAtTime(
            0.001,
            context.currentTime + 0.035,
          );
          click.connect(gain).connect(context.destination);
          click.start();
          click.stop(context.currentTime + 0.04);
        }
        lastCharacters = characters;
        if (elapsed >= REVEAL_AT && !revealed) {
          revealed = true;
          if (!scene) setExiting(true);
          window.dispatchEvent(new Event("portfolio:skip"));
        }
        if (elapsed >= INTRO_DURATION) {
          end();
          return;
        }
        timer = requestAnimationFrame(animate);
    }
    function begin() {
      if (cancelled || began) return;
      began = true;
      clock.current = performance.now();
      timer = requestAnimationFrame(animate);
    }
    // Slow hardware still gets a finite terminal opening, never an endless loader.
    const watchdog = window.setTimeout(() => {
      if (!began) {
        setSceneState("fallback");
        begin();
      }
    }, 4500);
    import("./workstation-scene")
      .then(async ({ createWorkstationScene }) => {
        if (cancelled || began) return;
        const next = await createWorkstationScene(container, {
          onPortal: (frame: {
            left: number;
            top: number;
            width: number;
            height: number;
            progress: number;
            reveal: number;
          }) => {
            if (!cancelled) portal?.update(frame);
          },
        });
        if (cancelled || began) {
          next.dispose();
          return;
        }
        scene = next;
        scene.render(0);
        setSceneState("ready");
        begin();
      })
      .catch(() => {
        if (!cancelled && !began) {
          setSceneState("fallback");
          begin();
        }
      });
    reduced.addEventListener("change", onMotion);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(timer);
      window.clearTimeout(watchdog);
      scene?.dispose();
      portal?.dispose();
      reduced.removeEventListener("change", onMotion);
      document.removeEventListener("visibilitychange", onVisibility);
      stopAudio();
      element?.close();
      document.body.style.overflowY = oldOverflow;
      document.documentElement.style.overflowY = oldRootOverflow;
      document.documentElement.style.scrollbarGutter = oldGutter;
      if (previouslyFocused?.isConnected && previouslyFocused !== document.body)
        previouslyFocused.focus({ preventScroll: true });
    };
  }, [take]);

  async function toggleSound() {
    if (audio.current) {
      stopAudio();
      setSound(false);
      return;
    }
    try {
      const context = new AudioContext();
      audio.current = context;
      await context.resume();
      if (audio.current !== context) return;
      const hum = context.createOscillator();
      const gain = context.createGain();
      hum.frequency.value = 60;
      gain.gain.value = 0.025;
      hum.connect(gain).connect(context.destination);
      hum.start();
      setSound(true);
    } catch {
      stopAudio();
      setSound(false);
    }
  }
  if (!take) return null;
  return (
    <dialog
      ref={dialog}
      key={take}
      tabIndex={-1}
      className="opening-sequence terminal-intro"
      data-scene={sceneState}
      data-exiting={exiting}
      aria-label="Alisher asleep at his desk. The camera enters his computer as it logs into the portfolio."
      onCancel={(event) => {
        event.preventDefault();
        if (!matchMedia(mobileQuery).matches) finish();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        if (event.currentTarget.dataset.portal === "true") {
          event.preventDefault();
          event.currentTarget.focus({ preventScroll: true });
          return;
        }
        const buttons = [
          ...event.currentTarget.querySelectorAll<HTMLButtonElement>("button"),
        ].filter((button) => button.getClientRects().length);
        const first = buttons[0],
          last = buttons[buttons.length - 1];
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        } else if (
          event.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === event.currentTarget)
        ) {
          event.preventDefault();
          last?.focus();
        }
      }}
    >
      <div className="terminal-fallback" aria-hidden="true">
        <p className="terminal-address">alisher.space</p>
        <p>
          login: {frame.login}
          {!frame.passwordVisible && frame.cursor && (
            <span className="terminal-cursor" />
          )}
        </p>
        {frame.passwordVisible && (
          <p>
            password: {frame.password}
            {!frame.accepted && frame.cursor && (
              <span className="terminal-cursor" />
            )}
          </p>
        )}
        {frame.accepted && <p>Access granted.</p>}
        {frame.opening && <p>Opening portfolio…</p>}
      </div>
      <div className="terminal-room" ref={mount} aria-hidden="true" />
      <div className="terminal-vignette" aria-hidden="true" />
      <div className="terminal-controls">
        <button type="button" onClick={toggleSound} aria-pressed={sound}>
          {sound ? (
            <Volume2 size={16} aria-hidden="true" />
          ) : (
            <VolumeX size={16} aria-hidden="true" />
          )}{" "}
          Sound {sound ? "on" : "off"}
        </button>
        <button className="terminal-skip" type="button" onClick={finish}>
          Skip intro
        </button>
      </div>
    </dialog>
  );
}
