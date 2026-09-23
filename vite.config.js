import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Config mínima: Vercel detecta el preset de Vite solo y corre
// `npm run build` -> sirve la carpeta `dist/`. No hace falta tocar nada más.
export default defineConfig({
  plugins: [react()],
});
