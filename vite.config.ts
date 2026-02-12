import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                quotation: resolve(__dirname, 'quotation.html'),
                tracking: resolve(__dirname, 'tracking.html'),
            },
        },
    },

    preview: {
        host: true, // allows 0.0.0.0 binding
        port: Number(process.env.PORT) || 4173,
        allowedHosts: ['.onrender.com'] // ✅ fixes blocked host error
    }
})
