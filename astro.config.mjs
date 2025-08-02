import { defineConfig } from "astro/config";
import vercel from "@astrojs/vercel/serverless"; // Use /edge for edge runtime

export default defineConfig({
  output: "server",
  adapter: vercel(),
});
