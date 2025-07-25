/**
 * SiteHeader: mobile drawer interactions (TypeScript)
 * - Toggle open/close
 * - Click-away via backdrop or outside click
 * - Close on Esc
 * - Close when resizing to desktop
 * - Lock body scroll when open
 */

(function () {
  const header = document.querySelector<HTMLElement>("header.site-header");
  if (!header) return;

  const toggle = header.querySelector<HTMLButtonElement>(".menu-toggle");
  const nav = header.querySelector<HTMLElement>("#primary-navigation");
  const backdrop = header.querySelector<HTMLDivElement>(".nav-backdrop");

  if (!toggle || !nav) return;

  const openNav = (): void => {
    toggle.setAttribute("aria-expanded", "true");
    nav.classList.add("open");
    header.classList.add("is-nav-open");
    if (backdrop) backdrop.hidden = false;
    document.body.classList.add("navlock");
  };

  const closeNav = (): void => {
    toggle.setAttribute("aria-expanded", "false");
    nav.classList.remove("open");
    header.classList.remove("is-nav-open");
    if (backdrop) backdrop.hidden = true;
    document.body.classList.remove("navlock");
  };

  const isOpen = (): boolean => toggle.getAttribute("aria-expanded") === "true";

  // Toggle button
  toggle.addEventListener("click", () => {
    isOpen() ? closeNav() : openNav();
  });

  // Backdrop click-away
  if (backdrop) {
    backdrop.addEventListener("click", closeNav);
  }

  // Close when a nav link is clicked
  nav.addEventListener("click", (e: MouseEvent) => {
    const target = e.target as Element | null;
    if (target && target.closest("a")) {
      closeNav();
    }
  });

  // Click-away if no backdrop (or as a safety net)
  document.addEventListener("click", (e: MouseEvent) => {
    if (!isOpen()) return;
    const target = e.target as Node;
    if (
      !nav.contains(target) &&
      !toggle.contains(target) &&
      (!backdrop || !backdrop.contains(target))
    ) {
      closeNav();
    }
  });

  // Esc to close
  document.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Escape" && isOpen()) closeNav();
  });

  // Close when resizing back to desktop
  const mq: MediaQueryList = window.matchMedia("(min-width: 769px)");
  const handleMQ = (ev: MediaQueryListEvent | MediaQueryList): void => {
    const matches =
      "matches" in ev ? ev.matches : (ev as MediaQueryList).matches;
    if (matches && isOpen()) closeNav();
  };
  // Safari fallback
  if ("addEventListener" in mq) {
    mq.addEventListener("change", handleMQ as (e: MediaQueryListEvent) => void);
  } else {
    // @ts-expect-error: older Safari uses addListener
    mq.addListener(handleMQ);
  }
})();
