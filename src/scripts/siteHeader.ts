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
   * Desktop "Call Us" Pop-up Logic (for multiple buttons)
   */
  const phoneNumber = "800-387-1705";
  const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);

  if (!isMobile) {
    // A function to set up a pop-up for a given button
    const setupCallPopup = (
      btnId: string,
      popupId: string,
      copyBtnId: string,
      feedbackId: string
    ) => {
      const callBtn = document.getElementById(btnId) as HTMLAnchorElement;
      const popup = document.getElementById(popupId) as HTMLDivElement;
      const copyBtn = document.getElementById(copyBtnId) as HTMLButtonElement;
      const feedback = document.getElementById(feedbackId) as HTMLDivElement;
      let popupTimeout: number;

      if (!callBtn || !popup || !copyBtn || !feedback) return;

      callBtn.addEventListener("click", (event: MouseEvent) => {
        popup.classList.add("is-visible");
        popup.hidden = false;
        clearTimeout(popupTimeout);
        popupTimeout = window.setTimeout(() => {
          popup.classList.remove("is-visible");
          popup.hidden = true;
        }, 5000);
      });

      copyBtn.addEventListener("click", () => {
        navigator.clipboard
          .writeText(phoneNumber)
          .then(() => {
            feedback.textContent = "Copied!";
            clearTimeout(popupTimeout);
            setTimeout(() => {
              feedback.textContent = "";
              popup.classList.remove("is-visible");
              popup.hidden = true;
            }, 2000);
          })
          .catch((err) => {
            console.error("Failed to copy text: ", err);
            feedback.textContent = "Failed!";
          });
      });
    };

    // Set up the pop-up for the header button
    setupCallPopup(
      "desktop-call-cta",
      "phone-popup",
      "copy-phone-btn",
      "copy-feedback"
    );

    // Set up the pop-up for the "About Us" section button
    setupCallPopup(
      "about-us-call-cta",
      "about-phone-popup",
      "about-copy-phone-btn",
      "about-copy-feedback"
    );
  }
})();
