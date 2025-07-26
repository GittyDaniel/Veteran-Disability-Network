/**
 * autoVideo.ts — with atomic icon toggle + tooltips + ARIA
 */
function formatTime(sec: number): string {
  if (!isFinite(sec)) return "0:00";
  const s = Math.floor(sec % 60)
    .toString()
    .padStart(2, "0");
  const m = Math.floor(sec / 60);
  return `${m}:${s}`;
}

(() => {
  const section = document.querySelector<HTMLElement>(".video-section");
  const frame = section?.querySelector<HTMLDivElement>(".video-frame");
  const video = section?.querySelector<HTMLVideoElement>("video.video");
  const btnPlay = section?.querySelector<HTMLButtonElement>(".btn-play");
  const btnMute = section?.querySelector<HTMLButtonElement>(".btn-mute");
  const btnFs = section?.querySelector<HTMLButtonElement>(".btn-fs");
  const seek = section?.querySelector<HTMLInputElement>("input.seek");
  const tCurrent = section?.querySelector<HTMLSpanElement>(".time .current");
  const tDuration = section?.querySelector<HTMLSpanElement>(".time .duration");
  if (
    !section ||
    !frame ||
    !video ||
    !btnPlay ||
    !btnMute ||
    !btnFs ||
    !seek ||
    !tCurrent ||
    !tDuration
  )
    return;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  let userPaused = false; // don't auto-resume if user explicitly paused

  // ---- Helpers -------------------------------------------------------------
  const setTip = (el: HTMLElement, tip: string) => {
    el.setAttribute("data-tip", tip);
    el.setAttribute("title", tip); // native fallback
  };

  const setToggleButton = (
    btn: HTMLButtonElement,
    showAlt: boolean, // true => show .icon.alt, false => show main .icon
    label: string,
    pressed?: boolean
  ) => {
    const main = btn.querySelector<SVGSVGElement>("svg.icon:not(.alt)");
    const alt = btn.querySelector<SVGSVGElement>("svg.icon.alt");

    if (main) main.toggleAttribute("hidden", showAlt); // hide main when showing alt
    if (alt) alt.toggleAttribute("hidden", !showAlt); // hide alt when showing main

    btn.setAttribute("aria-label", label);
    btn.setAttribute("data-tip", label); // tooltip text (if you kept tooltips)
    if (typeof pressed === "boolean") {
      btn.setAttribute("aria-pressed", String(pressed));
    }
  };

  const setPlayState = (playing: boolean) => {
    // When playing, show the PAUSE (alt) icon
    setToggleButton(btnPlay, playing, playing ? "Pause" : "Play", playing);
    if (playing) autoHideControls();
    else showControls();
  };

  // ---- Init ---------------------------------------------------------------
  video.muted = true; // reliable autoplay
  setToggleButton(btnPlay, false, "Play", false);
  setToggleButton(
    btnMute,
    video.muted,
    video.muted ? "Unmute" : "Mute",
    video.muted
  );
  setToggleButton(
    btnFs,
    !!document.fullscreenElement,
    document.fullscreenElement ? "Exit fullscreen" : "Enter fullscreen",
    !!document.fullscreenElement
  );

  tDuration.textContent = formatTime(video.duration || 0);
  tCurrent.textContent = formatTime(0);
  video.addEventListener("loadedmetadata", () => {
    tDuration.textContent = formatTime(video.duration || 0);
  });

  const play = async () => {
    try {
      await video.play();
      setPlayState(true);
    } catch {
      /* ignore */
    }
  };
  const pause = () => {
    video.pause();
    setPlayState(false);
  };

  // ---- Intersection: play in view, pause out of view -----------------------
  const io = new IntersectionObserver(
    ([entry]) => {
      if (reduceMotion) return;
      if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
        if (!userPaused) play();
      } else {
        if (!video.paused) pause();
      }
    },
    { threshold: [0, 0.6], rootMargin: "0px 0px -10% 0px" }
  );
  io.observe(frame);

  // ---- Controls ------------------------------------------------------------
  btnPlay.addEventListener("click", () => {
    if (video.paused) {
      userPaused = false;
      play();
    } else {
      userPaused = true;
      pause();
    }
  });

  btnMute.addEventListener("click", () => {
    video.muted = !video.muted;
    setToggleButton(
      btnMute,
      video.muted,
      video.muted ? "Unmute" : "Mute",
      video.muted
    );
  });

  // keep mute icon accurate if volume/muted changed elsewhere
  video.addEventListener("volumechange", () => {
    setToggleButton(
      btnMute,
      video.muted,
      video.muted ? "Unmute" : "Mute",
      video.muted
    );
  });

  const updateFsUi = () => {
    const inFs = !!document.fullscreenElement;
    setToggleButton(
      btnFs,
      inFs,
      inFs ? "Exit fullscreen" : "Enter fullscreen",
      inFs
    );
  };

  btnFs.addEventListener("click", async () => {
    const el: any = frame;
    if (!document.fullscreenElement) {
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    } else {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if ((document as any).webkitExitFullscreen)
        (document as any).webkitExitFullscreen();
    }
    // fullscreenchange will sync icons/labels
  });

  document.addEventListener("fullscreenchange", updateFsUi);

  // Seek
  const updateSeek = () => {
    const pct = (video.currentTime / (video.duration || 1)) * 100;
    seek.value = pct.toString();
    tCurrent.textContent = formatTime(video.currentTime);
    // Optional: more verbose SR updates
    seek.setAttribute("aria-valuemin", "0");
    seek.setAttribute("aria-valuemax", (video.duration || 0).toFixed(0));
    seek.setAttribute("aria-valuenow", video.currentTime.toFixed(0));
    seek.setAttribute(
      "aria-valuetext",
      `${formatTime(video.currentTime)} of ${formatTime(video.duration || 0)}`
    );
  };
  video.addEventListener("timeupdate", updateSeek);
  video.addEventListener("seeked", updateSeek);
  seek.addEventListener("input", () => {
    const pct = parseFloat(seek.value);
    video.currentTime = (pct / 100) * (video.duration || 0);
    tCurrent.textContent = formatTime(video.currentTime);
  });

  // Keyboard shortcuts on the frame
  frame.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      btnPlay.click();
    }
    if (e.key === "m" || e.key === "M") {
      btnMute.click();
    }
    if (e.key === "f" || e.key === "F") {
      btnFs.click();
    }
    if (e.key === "ArrowRight") {
      video.currentTime = Math.min(
        video.currentTime + 5,
        video.duration || Infinity
      );
    }
    if (e.key === "ArrowLeft") {
      video.currentTime = Math.max(video.currentTime - 5, 0);
    }
  });

  // Auto-hide controls when playing & idle
  let idleTimer: number | undefined;
  const showControls = () => frame.classList.remove("idle");
  const hideControls = () => frame.classList.add("idle");
  const autoHideControls = () => {
    if (reduceMotion) return;
    showControls();
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(() => {
      if (!video.paused) hideControls();
    }, 1800);
  };
  ["mousemove", "pointermove", "touchstart"].forEach((ev) => {
    frame.addEventListener(ev, autoHideControls, { passive: true });
  });

  // Reflect state on events
  video.addEventListener("play", () => setPlayState(true));
  video.addEventListener("pause", () => setPlayState(false));

  // Reduced motion: no autoplay, no hide
  if (reduceMotion) {
    showControls();
    io.disconnect();
  }
})();
