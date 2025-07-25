const STORAGE_KEY = "theme-preference";

function getPreferredTheme() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

function toggleTheme() {
  const current = document.documentElement.dataset.theme;
  const next = current === "dark" ? "light" : "dark";
  applyTheme(next);
  localStorage.setItem(STORAGE_KEY, next);
}

applyTheme(getPreferredTheme());

// Optional: attach to a button with id="theme-toggle"
document.getElementById("theme-toggle")?.addEventListener("click", toggleTheme);
