/**
 * Testimonials carousel behavior
 * - Equalizes slide heights via CSS var --slideH
 * - Builds pagination dots from slide count & --perPage
 * - Syncs active dot on scroll
 * - Dots click -> scroll to page, keyboard friendly
 */

type Els = {
  root: HTMLElement;
  track: HTMLUListElement;
  slides: HTMLElement[];
  dotsWrap: HTMLDivElement;
};

function perPage(root: HTMLElement): number {
  const raw = getComputedStyle(root).getPropertyValue("--perPage").trim();
  const n = parseInt(raw || "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function pages(count: number, per: number) {
  return Math.ceil(count / per);
}

function equalizeHeights(els: Els) {
  // reset
  els.root.style.removeProperty("--slideH");
  els.slides.forEach((s) => (s.style.height = "auto"));

  // measure tallest card
  let max = 0;
  els.slides.forEach((s) => {
    const card = s.querySelector<HTMLElement>(".tcard");
    if (!card) return;
    card.style.removeProperty("height");
    const h = Math.ceil(card.getBoundingClientRect().height);
    if (h > max) max = h;
  });
  if (max > 0) {
    els.root.style.setProperty("--slideH", `${max}px`);
    els.slides.forEach((s) => (s.style.height = `var(--slideH)`));
  }
}

function buildDots(els: Els, per: number) {
  const total = pages(els.slides.length, per);
  els.dotsWrap.innerHTML = "";
  els.dotsWrap.setAttribute("role", "tablist");
  for (let i = 0; i < total; i++) {
    const dot = document.createElement("button");
    dot.className = "dot";
    dot.type = "button";
    dot.setAttribute("role", "tab");
    dot.setAttribute("aria-label", `Go to page ${i + 1}`);
    dot.setAttribute("aria-selected", i === 0 ? "true" : "false");
    dot.setAttribute("tabindex", i === 0 ? "0" : "-1");
    dot.addEventListener("click", () => scrollToPage(els, i, per));
    els.dotsWrap.appendChild(dot);
  }
}

function anchorIndexForPage(page: number, per: number) {
  return Math.min(page * per, Number.MAX_SAFE_INTEGER);
}

function scrollToPage(els: Els, page: number, per: number) {
  const idx = Math.min(anchorIndexForPage(page, per), els.slides.length - 1);
  const target = els.slides[idx];
  els.track.scrollTo({ left: target.offsetLeft, behavior: "smooth" });
}

function setActiveDot(els: Els, page: number) {
  const dots = Array.from(
    els.dotsWrap.querySelectorAll<HTMLButtonElement>(".dot")
  );
  dots.forEach((d, i) => {
    const active = i === page;
    d.setAttribute("aria-selected", active ? "true" : "false");
    d.setAttribute("tabindex", active ? "0" : "-1");
  });
}

function currentPage(els: Els, per: number) {
  // pick the anchor slide whose left edge is closest to scrollLeft
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < els.slides.length; i += per) {
    const x = els.slides[i].offsetLeft;
    const d = Math.abs(els.track.scrollLeft - x);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }
  return Math.round(bestIdx / per);
}

(() => {
  const root = document.querySelector<HTMLElement>(".testimonials .carousel");
  const track = root?.querySelector<HTMLUListElement>(".track");
  const dotsWrap = root?.querySelector<HTMLDivElement>(".dots");
  if (!root || !track || !dotsWrap) return;

  const slides = Array.from(track.querySelectorAll<HTMLElement>(".slide"));
  const els: Els = { root, track, slides, dotsWrap };

  let per = perPage(root);
  buildDots(els, per);
  equalizeHeights(els);
  setActiveDot(els, 0);

  // Scroll sync
  let raf = 0;
  const onScroll = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      setActiveDot(els, currentPage(els, per));
    });
  };
  track.addEventListener("scroll", onScroll, { passive: true });

  // Resize / font load changes sizes
  const updateAll = () => {
    const nextPer = perPage(root);
    if (nextPer !== per) {
      per = nextPer;
      buildDots(els, per);
    }
    equalizeHeights(els);
    setActiveDot(els, currentPage(els, per));
  };

  const ro = new ResizeObserver(updateAll);
  ro.observe(root);
  ro.observe(track);

  // Re-run after fonts/images settle
  window.addEventListener("load", updateAll);
  document.fonts?.ready?.then(updateAll).catch(() => {});

  // Keyboard on track: left/right to paginate
  track.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const page = currentPage(els, per);
    const next = e.key === "ArrowRight" ? page + 1 : page - 1;
    const total = pages(slides.length, per);
    if (next >= 0 && next < total) scrollToPage(els, next, per);
  });

  // Keyboard on dots: arrow nav
  dotsWrap.addEventListener("keydown", (e: KeyboardEvent) => {
    const dots = Array.from(
      dotsWrap.querySelectorAll<HTMLButtonElement>(".dot")
    );
    const idx = dots.findIndex(
      (d) => d.getAttribute("aria-selected") === "true"
    );
    if (e.key === "ArrowRight" && idx < dots.length - 1) {
      e.preventDefault();
      dots[idx + 1].focus();
      dots[idx + 1].click();
    }
    if (e.key === "ArrowLeft" && idx > 0) {
      e.preventDefault();
      dots[idx - 1].focus();
      dots[idx - 1].click();
    }
  });

  // Respect reduced motion
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    (track.style as any).scrollBehavior = "auto";
  }
})();
