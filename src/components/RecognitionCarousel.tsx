"use client";

import { Children, useState, type ReactNode } from "react";

export function RecognitionCarousel({ children }: { children: ReactNode }) {
  const cards = Children.toArray(children);
  const [active, setActive] = useState(0);
  const move = (step: number) => setActive(index => (index + step + cards.length) % cards.length);
  if (!cards.length) return null;
  return <div className="recognition-carousel" role="region" aria-roledescription="carousel" aria-label="Community recognition"
    onKeyDown={event => {
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault(); move(event.key === "ArrowRight" ? 1 : -1);
      }
    }}>
    <div className="recognition-slides" aria-live="polite" aria-atomic="true">
      {cards.map((card, index) => <div key={index} hidden={active !== index} role="group" aria-roledescription="slide" aria-label={`${index + 1} of ${cards.length}`}>{card}</div>)}
    </div>
    {cards.length > 1 ? <div className="recognition-controls">
      <button type="button" className="button secondary" onClick={() => move(-1)} aria-label="Previous recognition">←</button>
      <span className="recognition-counter">{active + 1} / {cards.length}</span>
      <button type="button" className="button secondary" onClick={() => move(1)} aria-label="Next recognition">→</button>
    </div> : null}
  </div>;
}
