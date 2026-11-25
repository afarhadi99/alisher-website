// Display the existing live page through the monitor aperture. No screenshot,
// duplicate React tree, or embedded browser is involved in the handoff.
export function createScreenPortal(dialog, room, page) {
  const properties = [
    "transform",
    "transformOrigin",
    "width",
    "height",
    "overflow",
    "willChange",
  ];
  const previous = Object.fromEntries(
    properties.map((key) => [key, page.style[key]]),
  );
  const vignette = dialog.querySelector(".terminal-vignette");
  const controls = dialog.querySelector(".terminal-controls");
  const controlsWereInert = controls?.inert ?? false;
  let active = false,
    initialScale = 1,
    initialX = 0,
    initialY = 0;
  function update({ left, top, width, height, progress, reveal }) {
    if (!active) {
      active = true;
      const vw = page.offsetWidth,
        vh = window.innerHeight;
      initialScale = Math.max(width / vw, height / vh);
      initialX = (left + (width - vw * initialScale) / 2) / vw;
      initialY = top / vh;
      dialog.dataset.portal = "true";
      if (controls) controls.inert = true;
      dialog.focus({ preventScroll: true });
      page.style.transformOrigin = "0 0";
      page.style.overflow = "clip";
      page.style.willChange = "transform";
      window.dispatchEvent(new Event("portfolio:skip"));
    }
    const vw = page.offsetWidth,
      vh = window.innerHeight;
    page.style.height = vh + "px";

    // Settle the real page at its normal layout while the monitor grows beyond
    // the viewport. This also handles a portrait page inside a landscape CRT.
    const scale = initialScale + (1 - initialScale) * progress;
    const x = initialX * vw * (1 - progress);
    const y = initialY * vh * (1 - progress);
    page.style.transform = `translate3d(${x}px,${y}px,0) scale(${scale})`;
    const l = Math.max(0, left),
      t = Math.max(0, top);
    const r = Math.min(window.innerWidth, left + width),
      b = Math.min(vh, top + height * reveal);
    const clip = `polygon(evenodd, 0px 0px, ${window.innerWidth}px 0px, ${window.innerWidth}px ${vh}px, 0px ${vh}px, 0px 0px, ${l}px ${t}px, ${l}px ${b}px, ${r}px ${b}px, ${r}px ${t}px, ${l}px ${t}px)`;
    room.style.clipPath = clip;
    if (vignette) vignette.style.clipPath = clip;
    dialog.dataset.portalProgress = progress.toFixed(3);
    dialog.dataset.portalBounds = JSON.stringify({ left, top, width, height });
  }
  function dispose() {
    for (const property of properties)
      page.style[property] = previous[property];
    if (controls) controls.inert = controlsWereInert;
    room.style.clipPath = "";
    if (vignette) vignette.style.clipPath = "";
    delete dialog.dataset.portal;
    delete dialog.dataset.portalProgress;
    delete dialog.dataset.portalBounds;
  }
  return { update, dispose };
}
