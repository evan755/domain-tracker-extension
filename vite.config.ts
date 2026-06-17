import { defineConfig, createLogger } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import manifest from './manifest.json'

// 抑制 rollupOptions/rolldownOptions 的冗余警告
const logger = createLogger()
const originalWarn = logger.warn
logger.warn = (msg, options) => {
  if (msg.includes('rollupOptions') && msg.includes('rolldownOptions')) return
  originalWarn(msg, options)
}

export default defineConfig({
  customLogger: logger,
  plugins: [
    react(),
    tailwindcss(),
    crx({ manifest }),
  ],
  build: {
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        // CSS 合并为单文件，其他资源放入 media 目录
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'assets/css/app.css';
          }
          return 'assets/media/[name]-[hash].[ext]';
        }
      }
    }
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: { port: 5173 },
  },
})