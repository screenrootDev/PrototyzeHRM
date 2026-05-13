import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

function stripUseClientDirective(): import('vite').Plugin {
  return {
    name: 'strip-use-client-directive',
    enforce: 'pre' as const,
    transform(code, id) {
      if (
        id.endsWith('.js') ||
        id.endsWith('.ts') ||
        id.endsWith('.tsx') ||
        id.endsWith('.mjs')
      ) {
        if (code.includes('"use client"') || code.includes("'use client'")) {
          return code.replace(/['"]use client['"];?\s*/g, '');
        }
      }
    },
  };
}

export default defineConfig({
    base: './',
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/css/dark-mode.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react(),
        stripUseClientDirective(),
        tailwindcss(),
    ],
    server: {
        host: '127.0.0.1',
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'Access-Control-Allow-Headers': '*',
        },
        watch: {
            ignored: ['**/vendor/**', '**/node_modules/**']
        }
    },

    esbuild: {
        jsx: 'automatic',
        jsxImportSource: 'react',
    },
    resolve: {
        alias: {
            'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
        },
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'react-vendor': ['react', 'react-dom', '@inertiajs/react'],
                    'ui-radix': [
                        '@radix-ui/react-dialog',
                        '@radix-ui/react-dropdown-menu',
                        '@radix-ui/react-popover',
                        '@radix-ui/react-select',
                        '@radix-ui/react-tooltip',
                        '@radix-ui/react-scroll-area',
                        '@radix-ui/react-tabs'
                    ],
                    'lucide': ['lucide-react'],
                    'charts': ['recharts'],
                    'calendar': ['@fullcalendar/react', '@fullcalendar/daygrid', '@fullcalendar/timegrid', '@fullcalendar/interaction'],
                    'utils': ['date-fns', 'clsx', 'tailwind-merge']
                }
            },
        },
        assetsDir: 'assets',
    }
});