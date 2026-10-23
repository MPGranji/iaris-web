import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5175,
    strictPort: true,
    // Local dev: forward /api to the Express server (npm run dev:api)
    proxy: { "/api": "http://127.0.0.1:4001" },
  },
});
