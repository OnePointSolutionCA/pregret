"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const TILES = 12;
const SWAP_MS = 12000; // 12s per swap

/**
 * Renders 12 tiles that crossfade between two stacked <img> elements per tile.
 * We toggle which img is "active" (opacity 1) each swap and update the
 * inactive img's src to the next image. Because img elements are reused,
 * the browser caches after the first pass and subsequent cycles are instant.
 * Rotation pauses when the tab is hidden so we don't burn network in the
 * background.
 */
export default function HeroMosaicClient({ images }: { images: string[] }) {
  const tileLists = useMemo(() => {
    const lists: string[][] = Array.from({ length: TILES }, () => []);
    if (images.length === 0) return lists;
    for (let i = 0; i < images.length; i++) lists[i % TILES].push(images[i]);
    for (let t = 0; t < TILES; t++) {
      if (lists[t].length === 0) lists[t].push(images[t % Math.max(1, images.length)]);
    }
    return lists;
  }, [images]);

  const [step, setStep] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (images.length <= TILES) return;
    let id: ReturnType<typeof setInterval> | null = null;
    const start = () => { if (!id) id = setInterval(() => setStep((s) => s + 1), SWAP_MS); };
    const stop = () => { if (id) { clearInterval(id); id = null; } };
    if (typeof document !== "undefined" && !document.hidden) { start(); startedRef.current = true; }
    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);
    return () => { stop(); document.removeEventListener("visibilitychange", onVis); };
  }, [images.length]);

  return (
    <div className="rd-mosaic" aria-hidden>
      <div className="rd-mosaic__aurora"><span /><span /><span /></div>
      <div className="rd-mosaic__grid rd-mosaic__grid--12">
        {tileLists.map((list, i) => {
          const priority = i < 4;
          // A shows on even steps, B shows on odd steps. Each holds the src it should currently display.
          const aSrc = list[(step % 2 === 0 ? step : step - 1) % list.length];
          const bSrc = list[(step % 2 === 1 ? step : step + 1) % list.length];
          const aActive = step % 2 === 0;
          return (
            <div key={i} className={`rd-mosaic__tile rd-mosaic__tile--${i % 8}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={aSrc}
                alt=""
                loading={priority ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={priority ? "high" : "low"}
                className={`rd-mosaic__img ${aActive ? "is-on" : "is-off"}`}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bSrc}
                alt=""
                loading={priority ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={priority ? "high" : "low"}
                className={`rd-mosaic__img ${aActive ? "is-off" : "is-on"}`}
              />
            </div>
          );
        })}
      </div>
      <div className="rd-mosaic__scrim" />
    </div>
  );
}
