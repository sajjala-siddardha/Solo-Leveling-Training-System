// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  // Vercel compatibility
  build: {
    outDir: "dist",
    target: "esnext",
    sourcemap: false,
  },
});
