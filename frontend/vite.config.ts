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
	server: {
		port: 5173,
		strictPort: false,
		proxy: {
			'/api/images': {
				target: 'https://phimimg.com',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/api\/images/, ''),
				timeout: 10000, // 10 seconds timeout
				configure: (proxy, _options) => {
					proxy.on('error', (err, req, res) => {
						console.log('proxy error', err);
						// Return a fallback response instead of crashing
						if (res && !res.headersSent) {
							res.statusCode = 404;
							res.end('Image not found');
						}
					});
					proxy.on('proxyReq', (proxyReq, req, _res) => {
						console.log('Sending Request to the Target:', req.method, req.url);
						// Add timeout to prevent hanging requests
						proxyReq.setTimeout(10000, () => {
							proxyReq.destroy();
						});
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
		minify: 'terser',
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
