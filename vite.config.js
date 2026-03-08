import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: { '@': path.resolve(__dirname, './src') },
    },
    server: {
        port: 5173,
        proxy: {
            // Point proxies to the dev API port we're using locally.
            '/api': { target: 'http://127.0.0.1:5200', changeOrigin: true },
            '/socket.io': { target: 'http://127.0.0.1:5200', ws: true },
            '/uploads': { target: 'http://127.0.0.1:5200', changeOrigin: true },
        },
    },
    build: {
        outDir: 'dist',
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                    redux: ['@reduxjs/toolkit', 'react-redux'],
                    ui: ['framer-motion', 'swiper'],
                },
            },
        },
    },
});
