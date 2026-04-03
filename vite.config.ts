import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

// Get directory name for compatibility with older Node versions
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(async () => {
  const plugins = [
    react(),
    runtimeErrorOverlay(),
  ];

  // Conditionally add Replit plugins if in development and REPL_ID is set
  if (process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined) {
    const cartographer = await import("@replit/vite-plugin-cartographer");
    const devBanner = await import("@replit/vite-plugin-dev-banner");
    plugins.push(cartographer.cartographer(), devBanner.devBanner());
  }

  return {
    plugins,
    /** Vitest (run `npm test`) — AI Matchmaker Flow B step counts, etc. */
    test: {
      environment: "node",
      include: ["src/**/*.test.ts"],
    },
    base: "/",
    optimizeDeps: {
      force: true, // Force re-optimization of dependencies
      include: ['@radix-ui/react-tabs', 'wouter', 'react', 'react-dom'],
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        "@shared": path.resolve(__dirname, "src", "shared"),
        "@assets": path.resolve(__dirname, "src", "assets"),
      },
      dedupe: ['react', 'react-dom'], // Ensure single React instance
    },
    build: {
      outDir: "dist",
      emptyOutDir: true,
      assetsDir: "assets",
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Split vendor chunks for better code splitting
            if (id.includes('node_modules')) {
              // React and React-DOM go into main vendor chunk
              // This ensures React loads first and is available to all chunks
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor';
              }
              // Large libraries get their own chunks
              if (id.includes('framer-motion')) {
                return 'vendor-framer-motion';
              }
              if (id.includes('@stripe')) {
                return 'vendor-stripe';
              }
              if (id.includes('recharts')) {
                return 'vendor-recharts';
              }
              if (id.includes('@radix-ui')) {
                return 'vendor-radix';
              }
              if (id.includes('@tanstack/react-query')) {
                return 'vendor-react-query';
              }
              // Other node_modules
              return 'vendor';
            }
          },
          entryFileNames: "assets/[name].[hash].js",
          chunkFileNames: "assets/[name].[hash].js",
          assetFileNames: (assetInfo) => {
            if (assetInfo.name && assetInfo.name.endsWith('.ico')) {
              return '[name][extname]';
            }
            return "assets/[name].[hash][extname]";
          },
        },
      },
    },
    server: {
      port: 5174,
      host: true, // Listen on all addresses
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
      proxy: {
        '/api': {
          target: process.env.VITE_API_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          ws: true,
          configure: (proxy) => {
            let connectionRefusedLogged = false;
            proxy.on('error', (err: NodeJS.ErrnoException) => {
              if (err.code === 'ECONNREFUSED' && !connectionRefusedLogged) {
                connectionRefusedLogged = true;
                console.warn(
                  '[vite] API not reachable. From repo root: npm run dev --prefix backend-muzz (or npm run dev:backend from frontend-muzz). Or set VITE_API_URL in .env.development.'
                );
              }
            });
            proxy.on('proxyReq', (proxyReq, req) => {
              if (req.url?.includes('/notifications/stream')) {
                proxyReq.setHeader('Accept', 'text/event-stream');
                proxyReq.setHeader('Cache-Control', 'no-cache');
              }
            });
          },
        },
        '/uploads': {
          target: process.env.VITE_API_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        },
      },
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});

