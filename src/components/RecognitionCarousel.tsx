"use client";

import { Children, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";

const motionQuery = "(prefers-reduced-motion: reduce)";
const subscribeMotion = (callback: () => void) => {
  const query = window.matchMedia(motionQuery);
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
};

export function RecognitionCarousel({ children }: { children: ReactNode }) {
  const cards = Children.toArray(children);
  const [active, setActive] = useState(0);
  const [playback, setPlayback] = useState<"playing" | "paused" | null>(null);
  const reducedMotion = useSyncExternalStore(subscribeMotion, () => window.matchMedia(motionQuery).matches, () => true);
  const rotating = playback === "playing" || (playback === null && !reducedMotion);
  useEffect(() => {
    if (!rotating || cards.length < 2) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setActive(index => (index + 1) % cards.length);
    }, 7000);
    return () => window.clearInterval(timer);
  }, [rotating, cards.length]);
  const move = (step: number) => setActive(index => (index + step + cards.length) % cards.length);
  if (!cards.length) return null;
  return <div className="recognition-carousel" role="region" aria-roledescription="carousel" aria-label="Community recognition"
    onFocus={event => {
      // Pause for keyboard users, without trapping the Resume button in a paused state.
      if (!event.currentTarget.contains(event.relatedTarget) && event.target.matches(":focus-visible")) setPlayback("paused");
    }}
    onKeyDown={event => {
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault(); move(event.key === "ArrowRight" ? 1 : -1);
      }
    }}>
    <div className="recognition-slides" aria-live={rotating ? "off" : "polite"} aria-atomic="true">
      {cards.map((card, index) => <div key={index} hidden={active !== index} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${cards.length}`}>{card}</div>)}
    </div>
    {cards.length > 1 ? <div className="recognition-controls">
      <button type="button" className="button secondary" onClick={() => setPlayback(rotating ? "paused" : "playing")} aria-label={rotating ? "Pause automatic recognition slideshow" : "Resume automatic recognition slideshow"}>{rotating ? "Pause" : "Resume"}</button>
      <button type="button" className="button secondary" onClick={() => move(-1)} aria-label="Previous recognition">←</button>
      <span className="recognition-counter">{active + 1} / {cards.length}</span>
      <button type="button" className="button secondary" onClick={() => move(1)} aria-label="Next recognition">→</button>
    </div> : null}
  </div>;
}
