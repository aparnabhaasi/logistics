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
})
