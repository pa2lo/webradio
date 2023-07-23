import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// import mkcert from'vite-plugin-mkcert'

// https://vitejs.dev/config/
export default defineConfig({
	server: {
		host: true,
		// https: true
	},
	// server: { https: true },
	// plugins: [vue(), mkcert()],
	plugins: [
		vue(),
		// mkcert()
	],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url))
		}
	}
})
