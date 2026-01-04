import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // Use root path - Vercel handles routing via vercel.json rewrites
  base: '/',
  
  // Build optimization
  build: {
    target: 'es2018',
    minify: 'esbuild',
    cssMinify: true,
    sourcemap: false,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 600,
    
    rollupOptions: {
      output: {
        // Simple chunking - don't split React packages
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
        
        // Asset naming for cache busting
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
  },
})
