import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			'@shared': path.resolve(__dirname, 'src/shared'),
			'@features': path.resolve(__dirname, 'src/features'),
			'@app': path.resolve(__dirname, 'src/app')
		}
	},
	// Load env from repo root so we use a single .env
	envDir: path.resolve(__dirname, '..'),
	server: {
		port: 5173,
		strictPort: false,
		proxy: {
			'/api/images': {
				target: 'https://phimimg.com',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/api\/images/, ''),
				configure: (proxy, _options) => {
					proxy.on('error', (err, _req, _res) => {
						console.log('proxy error', err);
					});
					proxy.on('proxyReq', (proxyReq, req, _res) => {
						console.log('Sending Request to the Target:', req.method, req.url);
					});
					proxy.on('proxyRes', (proxyRes, req, _res) => {
						console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
					});
				},
			}
		}
	},
	build: {
		sourcemap: false,
		// Use default esbuild minifier to avoid optional terser dependency
		minify: 'esbuild',
		rollupOptions: {
			output: {
				manualChunks: {
					vendor: ['react', 'react-dom'],
					router: ['react-router-dom'],
					ui: ['zustand']
				}
			}
		}
	},
	define: {
		'import.meta.env': 'import.meta.env'
	}
})
