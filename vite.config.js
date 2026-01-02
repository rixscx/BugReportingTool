import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import viteCompression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxImportSource: 'react'
    }),
    tailwindcss(),
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 1024,
      algorithm: 'gzip',
      ext: '.gz',
      deleteOriginFile: false,
    })
  ],
  base: process.env.VITE_BASE_PATH || '/',
  
  // Build optimization
  build: {
    target: 'es2018',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    cssMinify: true,
    sourcemap: false,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 600,
    
    // Advanced chunking strategy
    rollupOptions: {
      output: {
        // Manual chunks for better caching
        manualChunks: (id) => {
          // Vendor chunk
          if (id.includes('node_modules')) {
            if (id.includes('supabase')) return 'vendor-supabase'
            if (id.includes('react')) return 'vendor-react'
            return 'vendor'
          }
          
          // Page chunks
          if (id.includes('pages')) {
            const match = id.match(/pages\/([^/]+)/)
            if (match) return `page-${match[1]}`
          }
          
          // Hook chunks
          if (id.includes('hooks')) {
            return 'hooks'
          }
          
          // Utils chunk
          if (id.includes('lib') || id.includes('utils')) {
            return 'utils'
          }
        },
        
        // Optimize asset naming for cache busting
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/png|jpe?g|gif|svg/.test(ext)) {
            return `assets/images/[name].[hash][extname]`
          }
          if (ext === 'css') {
            return `assets/css/[name].[hash].css`
          }
          return `assets/[ext]/[name].[hash][extname]`
        },
        
        chunkFileNames: 'assets/js/[name].[hash].js',
        entryFileNames: 'assets/js/[name].[hash].js',
      },
    },
  },
  
  // Optimization options
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js'],
    exclude: ['node_modules/.vite'],
  },
})
