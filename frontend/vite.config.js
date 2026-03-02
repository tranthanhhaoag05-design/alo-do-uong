import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  // Đã xóa dòng root: "./src" đi để nó tự tìm index.html bên ngoài
  base: "",
  plugins: [react()],
  build: {
    assetsInlineLimit: 0,
  },
});
