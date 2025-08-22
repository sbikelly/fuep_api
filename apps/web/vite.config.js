import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url)),
        },
    },
    server: {
        port: 5173,
        host: true,
        proxy: {
            // Proxy /api requests to the backend during local development
            '/api': {
                target: 'http://localhost:4000',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api/, ''),
                configure: (proxy, _options) => {
                    proxy.on('error', (err, _req, _res) => {
                        console.log('proxy error', err);
                    });
                    proxy.on('proxyReq', (proxyReq, _req, _res) => {
                        console.log('Sending Request to the Target:', _req.method, _req.url);
                    });
                    proxy.on('proxyRes', (proxyRes, _req, _res) => {
                        console.log('Received Response from the Target:', proxyRes.statusCode, _req.url);
                    });
                },
            },
        },
    },
    preview: {
        port: 3000,
        strictPort: true,
    },
    test: {
        environment: 'jsdom',
    },
    build: {
        outDir: 'dist',
        sourcemap: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                    router: ['react-router-dom'],
                },
            },
        },
    },
    define: {
        __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },
});
