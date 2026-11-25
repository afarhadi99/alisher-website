# Portfolio design system

## Current design: professional portfolio (November 2026)

The owner asked for a more professional site to use as the website on a partner application, with Pixio’s native apps, TSI Hub and several TSI Hub apps added as projects. He then asked for the opening animation to be removed. This section describes what is live. Everything under "Earlier directions" is history.

### Direction

Light, content-first and quick to read. Warm white page, near-black type, one vermilion accent kept from the earlier design and used sparingly. Manrope for headings and body. Real product screenshots carry the visual weight, shown in plain browser, phone and tablet frames. No opening sequence, no autoplaying motion, no 3D on the homepage.

### Page order

1. Hero: photo, name and roles, one sentence on what he does, two actions, and a collage of Pixio on the web, Pixio AI on iPhone and TSI Hub.
2. Four figures, each sourced from the owner or a product’s public listing.
3. Pixio: the web studio as a feature row, then cards for iPhone, iPad, Android and desktop with store links.
4. TSI Hub: a feature row, then six apps inside the hub with live links.
5. More work: three projects and a link to the full archive.
6. Working together: three plain descriptions of how he helps.
7. Teaching: the UFT recognition and three teaching activities on a dark band.
8. Writing and talks, side by side.
9. Contact.

### Rules

- Do not add invented metrics, endorsements, employers or dates.
- Apps in the Pixio and TSI Hub families link to live products, not to source repositories.
- No placeholders. A project without a working link is marked archived; a project without an image shows its name.
- Controls are at least 44px tall. Focus is always visible. Reduced-motion preferences turn transitions off.
- Tokens are at the top of `src/app/site.css`. `tokens.css` only keeps the names `avatar.css` still uses.

### Verification

Production build passes with 37+ static routes. Checked in Chromium at 320, 390, 768, 1024, 1280, 1440 and 1920px with no horizontal overflow. Menu, archive filters and search, project pages and the 3D avatar on `/playground` were exercised with no console errors. Every outbound link on the new entries was loaded on 2026-11-24.

---

## Earlier directions (history)


The owner rejected the previous Sticker design as a boilerplate template and requested a complete visual redesign with a dramatic opening. This custom cinematic direction replaces the previous light/pink/lime system.

## Visual direction

Near-black canvas, warm ivory type, vermilion actions and opening, and a light editorial teaching section. Syne supplies the oversized name and headings; Manrope supplies body text and controls. Both use Next.js font optimization. Colours, fonts, and spacing share existing tokens. Square images, fine rules, and open layouts replace sticker cards and offset shadows.

The owner's name spans the opening stage; the original Three.js portrait occupies the foreground. Keep the name on one line, sized against actual font metrics at mobile, desktop, and capped widescreen widths. The original avatar, real product screenshots, teaching recognition, and published writing provide the material. Do not add invented metrics, endorsements, or employers.

## Opening and interaction

The first visit in a browser session has a finite, skippable kinetic sequence: Ideas / Into / Reality. The vermilion shutter clears into the existing avatar assembling from approximately 3,000 points, with a camera sweep into its final view. The particles derive from the original skinned mesh and require no additional media asset or animation dependency. Dispose the temporary geometry and material after the entrance.

The sequence is cosmetic: content and navigation remain available beneath it. Skip and Escape finish it; Replay intro restarts it and returns to the top, including after scrolling or changing modes. System reduced motion bypasses the opening and particle entrance entirely. Main content remains visible with JavaScript disabled. Data-saver connections retain an explicit 3D load action.

Build, Teach, and Write remain visitor-selected modes. Build exposes rotation, zoom, framing, pause/resume, reset, and the original wave. Teach provides AI/Web/XR mini lessons; Write links to published articles. The project explorer changes the selected actual project. Ctrl/Command K opens keyboard navigation. Preserve visible keyboard focus and 44px controls. No games or gamification: the owner explicitly rejected them.

## Page rhythm

The opening uses the capped canvas with the name behind the portrait. Selected work pairs a typographic index with a large real capture. Native apps retain the owner-requested screenshot and link placeholders. Teaching inverts to a light surface with the supplied UFT recognition beside real teaching activities. Writing uses an editorial article list. Media uses actual appearances. The vermilion contact mast closes the page.

All routes inherit the palette, typography, and image treatment. Content ownership stays in src/data/portfolio.ts, projects.ts, posts.ts, and media.ts. Keep original project routes, published writing, social destinations, and owner-provided award wording.

## Recorded decisions

- The opening and contact section deliberately use large vermilion surfaces in response to the requested visual impact.
- Project selection rows exceed button dimensions because each row is an interactive content choice; compact controls retain 44px hit targets.
- Complete source article, project, and event names may wrap on narrow screens.
- At 1280x800 the name, introduction, and primary work action remain visible. Portrait controls may continue below the fold on short or mobile viewports.
- Preserve space around the portrait and teaching recognition; do not add copy merely to fill a measured text gap.
- The optimized 1.8 MB asset, offscreen suspension, reduced-motion behavior, and GPU cleanup remain part of the system.

## Implementation

src/app/cinematic.css holds the current visual overrides, tokens.css the theme values, and globals.css the shared foundations. opening-sequence.tsx owns the finite type opening; interactive-studio.tsx the homepage composition. avatar-portrait.tsx owns loading and controls; dynamically imported avatar-scene.js owns Three.js, the particle entrance, and resource lifecycle. Keep Three.js outside the initial static page bundle.

## Current homepage: spatial portfolio revision

The owner rejected the previous cinematic split layout. The homepage now uses world-hero.tsx and world.css: a centered 3D portrait with floating real project previews, three full-width individually composed project showcases, compact native app rows, a dark teaching mural, notebook-style articles, and a horizontal media shelf. The Build/Teach/Write workspace and project selector no longer appear on the homepage. Existing archive, blog, detail and AR routes remain available.

The oversized background name is decorative; a separate readable heading carries the full name. The original optimized avatar and finite entrance remain. Real screenshots are links, with pointer parallax that respects reduced motion. Native screenshots and app links remain placeholders as requested.

Review decisions: differing section measures and gaps support the distinct compositions. The three journal pages occupy one grid row; the middle page is deliberately offset, which the automated row detector interprets as wrapping. Legacy teaching-prose width warning applies to an unused homepage component. Final rendered check: zero Floor failures. Review found and resolved desktop preview/introduction contact and mobile hint/action overlap.


## Responsive gallery revision — November 2026

Phones use a normal-flow name, introduction, work action and portrait. Tablets use two columns; the spatial desktop composition remains. Project images fit the available width without perspective cropping below 960px. App screenshot and destination placeholders remain unchanged.

Blog and media use portfolio-carousel.tsx: native horizontal scroll with snap, touch swipes, mouse drag, previous/next buttons, view count, and progress. ResizeObserver recalculates actual scroll stops; there is no auto advance or added carousel dependency. Arrows, Home and End work when the track is focused. Reduced motion uses immediate movement. Content remains available without JavaScript.

Portrait controls are 48px high, with secondary rotation/reset actions in an Escape-dismissable More disclosure. The canvas permits native vertical page scrolling. Original optimized model, lazy loading, offscreen suspension and finite opening are retained.

Verification: Chrome layout checks from 320 through 1440px found no horizontal page overflow. Touch gestures moved both galleries forward/back and scrolled the page over the portrait. Button, keyboard, drag, portrait framing and disclosure checks passed. Fresh-context Hallmark finish review: ship, no material findings. The 28ch introduction measure is deliberately short role copy, not body prose. Equal carousel slide widths support predictable swiping; existing varied section measures/gaps remain intentional.


## Cosmic entrance

At the owner's request, the opening now evokes a celestial revelation: darkness and sparse stars, a sun rising over a planetary limb, the owner's name, then a slow bloom/crossfade into the restored orange portfolio. Duration is eight seconds, once per browser session, with Replay entrance. Only the entrance changes the visual direction.

opening-sequence.tsx owns the finite lifecycle and a native modal; odyssey.css is imported by layout.tsx. The scene uses bounded SVG geometry and transform/opacity animations, with no video or extra rendering dependency. The optional original harmonic swell uses Web Audio only after an explicit Sound button click. Audio closes on exit and unmount. Skip, Escape, normal completion and a reduced-motion preference change return to the portfolio and restore scroll/focus. Reduced motion bypasses the sequence entirely. Content is available without JavaScript.

Cosmic entrance verification: production build passed. Browser playback completed in approximately 8.05 seconds; session-once behavior, replay, explicit sound toggle, skip, Escape, keyboard focus containment and live reduced-motion changes passed with no browser errors. Desktop/mobile frames reviewed; finish review: ship. Hallmark: zero failures, existing underlying-layout warnings retained.

## Continuous cosmic handoff

The current entrance lasts nine seconds. At 6.1 seconds the celestial title travels into the existing hero name while the sun expands into the page's orange. The portrait, previews, and navigation arrive in stages. Added a textured planetary limb and solar ray within the bounded SVG. Measure destination text before starting the hero arrival animation to avoid a 16px mobile landing offset.

Verification: desktop 1280px and mobile 390px playback, exact title landing, cleanup, scrolling, and overflow checks passed. Original Three.js portrait renders at both sizes; framing, wave, reduced motion, and retry after a deliberately failed asset request passed without page errors. Targeted ESLint passed; Hallmark rendered checks report zero failures and six existing layout warnings. Fresh-context finish review: ship, no actionable findings. The local preview server was restarted after it had stopped.


## Current opening: after-hours workstation

The owner rejected the cosmic opening and explicitly requested a Matrix-inspired scene: himself asleep at a computer, a camera move into its monitor, his name as the login, asterisks as the password, and the portfolio opening. This replaces the cosmic entrance direction. The homepage beneath it keeps its established orange spatial design.

The opening is a procedural Three.js room using the existing optimized avatar with a seated sleeping pose, closed eyelids, and subtle breathing. A CRT, physical keyboard, window blinds, lamp, books, notebook, and mug establish the setting. Green monitor light and warm lamplight provide the palette. A canvas texture types alisher farhadi and twelve asterisks, then opens the portfolio through the screen. Duration: 12 seconds after loading, once per browser session, with Replay entrance.

The full scene also runs on mobile. By explicit owner instruction, mobile has no skip control or Escape dismissal. Desktop retains Skip intro and Escape. Reduced-motion preferences still bypass camera motion. Sound is optional and starts only after a button click. The native modal contains keyboard focus and restores focus and scroll on completion. A bounded terminal fallback still completes if WebGL or the asset is unavailable.

opening-sequence.tsx owns the lifecycle, terminal-timeline.js the shared typing schedule, workstation-scene.js the room, and terminal-intro.css the overlay. avatar-asset.js shares cached source bytes between separate disposable scene instances. The hidden homepage renderer pauses during the opening and resumes at the reveal. No new model, video, or rendering dependency was added. The old odyssey stylesheet is no longer imported.

Verification: desktop 1280x800 and phone 390x844 playback, login/password sequence, no mobile skip, optional sound, keyboard containment, session-once behavior, reduced-motion changes, failed-asset fallback, scroll/focus restoration, and resumed homepage 3D passed without page errors. GPU resources and room canvas are released on completion. Fresh-context finish review found three issues: sleeper visibility, phone typing legibility, and initial phone framing; all resolved and recaptured. The face is turned into view, chair back lowered, portrait shot tightened, and camera approaches early enough for typing to remain legible.

Final validation: production build passed all 37 routes with existing legacy warnings only. Targeted ESLint passed. Hallmark rendered and source checks have zero failures; six pre-existing layout warnings remain. Production preview runs on port 3001.

## Workstation rendering upgrade

The opening now uses physical materials with procedural microstructure, roughness and clearcoat, curved CRT glass, rounded keycaps, a hollow ceramic mug and upholstered chair surfaces. Soft directional and spot shadows ground the desk and sleeper. A room probe supplies prefiltered image-based lighting; a blurred planar reflection supplies the floor reflection. The atmospheric pass reconstructs visible depth and integrates light through moving volumetric density, shaped by the window blinds and desk lamp. Bloom, ACES tone mapping and FXAA finish the frame. Screen glare from its own simulated bounce light is excluded, and fog/bloom ease down during the readable login close-up.

Desktop fog uses 36 samples with render scale capped at 1.25; coarse-pointer/low-core devices use 18 samples, smaller probes/reflection targets, 512px shadows and DPR 1. Slow submissions or sustained slow frame cadence reduce scale and samples further. Shadows update at 5Hz while the room is visible. The environment probe, reflection target, depth buffers, composer passes, shadows and scene resources are disposed at exit. No new rendering dependency or model download was added.

Fresh-context finish review: fix, two findings resolved. Phone volumetric banding was fixed by averaging each blind's contribution across a ray segment; a restrained warm bounce restores the sleeper's expression. Desktop and emulated touch-phone playback, login readability, cleanup and resumed homepage rendering passed with zero console errors. The full mobile sequence still has no skip control.

A Google-font/Turbopack resolution error prevented the preview from loading. The same cached Syne and Manrope Latin fonts now load locally through next/font/local, with their OFL licenses in public/fonts. Rendered Hallmark checks pass with zero failures and six pre-existing layout warnings.

Rendering upgrade production validation: all 37 routes built successfully, with only existing legacy lint warnings. The first-load homepage bundle remains 136 kB; the rendering pipeline stays dynamically loaded with the opening. Local font compilation passed.

## Cinematic room and live-page handoff

The room now uses neutral painted surfaces, matte CRT plastics, a smaller monitor, printed keyboard legends, filtered material maps and reduced green spill. Warm lamplight and cool window light establish the scene; restrained depth-of-field and softer reflections avoid a toy-like gloss. The original stylized avatar remains unchanged as an asset. A wider, lower portrait establishing shot includes the lamp, sleeping face and complete monitor, then moves into the existing readable terminal close-up.

The twelve-second sequence reveals the existing live DOM homepage through the projected monitor aperture. No screenshot, duplicate React tree or iframe is used. The page transform reaches identity before the modal disappears. Stable scrollbar space prevents a width jump; the homepage renderer starts before the aperture opens. Invisible intro controls become inert, and all transforms, clipping, scrolling and focus are restored on completion or interruption.

Verification: desktop and touch-phone handoff alignment measured under 0.03px of layout movement; no console errors. Desktop skip/Escape, full unskippable mobile playback, opt-in audio, focus containment, session-once behavior, reduced-motion changes, failed-asset fallback, orientation change during the handoff and mid-handoff cleanup passed. Targeted ESLint passed. Hallmark rendered checks: zero failures, six existing layout warnings. Fresh-context finish review: one phone-framing finding, resolved and recaptured; warm face readability also restored.

Production validation: all 37 routes built successfully with existing legacy warnings only; homepage first-load JavaScript remains 136 kB. The production opening, live-page handoff, restored scrolling and resumed homepage canvas passed without console errors. Preview refreshed on port 3001.

## Human-scale workstation rebuild

The previous room's 4.3-unit desk and 1.65x character scale produced an oversized workstation. The replacement uses metres with the character at its original scale: 1.8 m desk, 17-inch CRT, 44 cm keyboard with 19 mm key pitch, 9 cm mug and a 46 cm chair seat. The sleeping pose is adjusted to meet the desk. The CRT has a tapered housing, inset curved glass, vents and separate controls; the chair has a gas lift and casters; the room has an actual window aperture, sill, trim and shelf brackets. Tower feet now contact the floor.

Photographed CC0 Poly Haven wood/plaster maps replace generated grain on large surfaces. Local color/normal/roughness maps use metric UVs, anisotropic filtering and approximately 1.64 MB total transfer. Area lights approximate screen emission and indirect wall/desk bounce. GTAO grounds surfaces; MSAA, larger reflection targets and a higher DPR retain detail. Quality reduction requires sustained slow frames, has a DPR floor of 1 and reduces gradually. The camera timeline caps visible-frame advancement at 80 ms to prevent jumping after a stall.

Fresh-context finish review: three findings addressed—portrait framing moved higher, terminal luminance/size increased with reduced vignette attenuation, and physical feet added under the tower. The room and object proportions are more believable. Full photorealism remains limited by the reused stylized avatar; no realistic human likeness or sculpt was supplied, and no claim of a photorealistic character is made. Original homepage and mobile no-skip behavior remain in place. Hallmark checks: zero failures and six existing warnings. Targeted source lint passes.

Production validation: 37 routes built, homepage first-load JavaScript remains 136 kB. Desktop (1280×800) and emulated touch phone (390×844) completed the opening with no console errors, zero measured final handoff shift, restored scroll and disposed room canvases. Both recovered smoothly from a simulated 300 ms main-thread stall. At 320px, deliberately failed material requests still produced the 3D scene; changing reduced-motion preference during the portal restored styles and scrolling. Final stills were captured with the browser clock paused to avoid screenshot timing artifacts. Existing legacy build warnings remain. Local production preview refreshed on port 3001.

