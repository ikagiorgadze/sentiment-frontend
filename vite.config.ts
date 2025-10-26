import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const devServerPort = Number(env.VITE_DEV_SERVER_PORT || process.env.VITE_DEV_SERVER_PORT) || 5173;
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || process.env.VITE_API_PROXY_TARGET || "http://localhost:3000";

  return {
    server: {
      host: "0.0.0.0",
      port: devServerPort,
      allowedHosts: [
        "6d7e4bcdc9fe.ngrok-free.app",
      ],
      proxy: {
        "/api": {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
            query: ['@tanstack/react-query'],
            charts: ['recharts'],
            ui: ['lucide-react'],
          },
        },
      },
    },
  };
});
