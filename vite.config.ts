import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // Proxy API requests to avoid CORS issues during development
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Handle API requests directly in Vite middleware
            if (req.url?.startsWith('/api/assets')) {
              // This will be handled by the middleware below
            }
          });
        }
      }
    }
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // Custom plugin to handle API requests
    {
      name: 'api-middleware',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          // Handle /api/providers endpoint
          if (req.url?.startsWith('/api/providers')) {
            try {
              // Set CORS headers
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
              res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

              if (req.method === 'OPTIONS') {
                res.statusCode = 200;
                res.end();
                return;
              }

              // Import the service dynamically
              const { fetchProviders } = await import('./src/services/providerService');
              
              // Fetch providers
              const providers = await fetchProviders();

              // Send response
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({
                count: providers.length,
                data: providers
              }));
            } catch (error: any) {
              console.error('API error:', error);
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ error: error.message }));
            }
          }
          // Handle /api/assets endpoint
          else if (req.url?.startsWith('/api/assets')) {
            try {
              // Parse query parameters
              const url = new URL(req.url, `http://${req.headers.host}`);
              const provider = url.searchParams.get('provider') || undefined;
              const status = url.searchParams.get('status') || undefined;

              // Set CORS headers
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
              res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

              if (req.method === 'OPTIONS') {
                res.statusCode = 200;
                res.end();
                return;
              }

              // Import the service dynamically
              const { fetchAssetsForPlugin } = await import('./src/services/pluginApiService');
              
              // Fetch data
              const assets = await fetchAssetsForPlugin(provider, status);

              // Send response
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              res.end(JSON.stringify({
                count: assets.length,
                data: assets
              }));
            } catch (error: any) {
              console.error('API error:', error);
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 500;
              res.end(JSON.stringify({ error: error.message }));
            }
          } else {
            next();
          }
        });
      }
    }
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
