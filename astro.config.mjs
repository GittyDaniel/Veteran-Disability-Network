import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel"; // Use /edge for edge runtime

import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://veteransdisabilitynetwork.org",
  output: "server",
  adapter: vercel(),
  integrations: [sitemap()],
});