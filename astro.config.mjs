import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import keystatic from "@keystatic/astro";

export default defineConfig({
  output: "static",
  integrations: [
    react(),
    ...(process.env.KEYSTATIC_LOCAL === "1" ? [keystatic()] : []),
  ],
  devToolbar: { enabled: false },
});
