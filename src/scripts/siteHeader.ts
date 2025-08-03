/**
 * SiteHeader: All header interactions (TypeScript)
 * - Mobile drawer toggle open/close
 * - Click-away via backdrop or outside click
 * - Close on Esc and desktop resize
 * - Lock body scroll when open
 * - Desktop "Call Us" pop-up with copy functionality
 */

(function () {
  const header = document.querySelector<HTMLElement>("header.site-header");
  if (!header) return;

  // --- Hamburger Menu Elements ---
  const toggle = header.querySelector<HTMLButtonElement>(".menu-toggle");
  const nav = header.querySelector<HTMLElement>("#primary-navigation");
  const backdrop = header.querySelector<HTMLDivElement>(".nav-backdrop");

  // --- "Call Us" Pop-up Elements ---
  const desktopCallBtn = document.getElementById(
    "desktop-call-cta"
  ) as HTMLAnchorElement;
  const phonePopup = document.getElementById("phone-popup") as HTMLDivElement;
  const copyPhoneBtn = document.getElementById(
    "copy-phone-btn"
  ) as HTMLButtonElement;
  const copyFeedback = document.getElementById(
    "copy-feedback"
  ) as HTMLDivElement;
  const phoneNumber = "800-387-1705";
  let popupTimeout: number;

  /**
   * Mobile Drawer Logic
   */
  if (toggle && nav) {
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

    const isOpen = (): boolean =>
      toggle.getAttribute("aria-expanded") === "true";

    toggle.addEventListener("click", () => {
      isOpen() ? closeNav() : openNav();
    });

    if (backdrop) {
      backdrop.addEventListener("click", closeNav);
    }

    nav.addEventListener("click", (e: MouseEvent) => {
      if ((e.target as Element)?.closest("a")) {
        closeNav();
      }
    });

    document.addEventListener("click", (e: MouseEvent) => {
      if (!isOpen()) return;
      const target = e.target as Node;
      if (!nav.contains(target) && !toggle.contains(target)) {
        closeNav();
      }
    });

    document.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen()) closeNav();
    });

    const mq: MediaQueryList = window.matchMedia("(min-width: 769px)");
    const handleMQ = (): void => {
      if (mq.matches && isOpen()) closeNav();
    };
    mq.addEventListener("change", handleMQ);
  }

  /**
   * Desktop "Call Us" Pop-up Logic
   */
  const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);

  if (desktopCallBtn && phonePopup && !isMobile) {
    desktopCallBtn.addEventListener("click", (event: MouseEvent) => {
      phonePopup.classList.add("is-visible");
      phonePopup.hidden = false;

      clearTimeout(popupTimeout);

      popupTimeout = window.setTimeout(() => {
        phonePopup.classList.remove("is-visible");
        phonePopup.hidden = true;
      }, 5000);
    });

    if (copyPhoneBtn) {
      copyPhoneBtn.addEventListener("click", () => {
        navigator.clipboard
          .writeText(phoneNumber)
          .then(() => {
            if (copyFeedback) copyFeedback.textContent = "Copied!";
            clearTimeout(popupTimeout);
            setTimeout(() => {
              if (copyFeedback) copyFeedback.textContent = "";
              phonePopup.classList.remove("is-visible");
              phonePopup.hidden = true;
            }, 2000);
          })
          .catch((err) => {
            console.error("Failed to copy text: ", err);
            if (copyFeedback) copyFeedback.textContent = "Failed!";
          });
      });
    }
  }
})();
