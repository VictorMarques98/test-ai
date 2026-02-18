import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import electron from "vite-plugin-electron/simple";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
	server: {
		host: "::",
		port: 8080,
		hmr: {
			overlay: false,
		},
		proxy: {
			'/api': {
				target: 'https://kds-service.duckdns.org',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/api/, ''),
				secure: true,
			},
		},
	},
	plugins: [
		react(),
		mode === "development" && componentTagger(),
		electron({
			main: {
				entry: "electron/main.ts",
				vite: {
					build: {
						outDir: "dist-electron",
					},
				},
			},
			preload: {
				input: "electron/preload.ts",
				vite: {
					build: {
						outDir: "dist-electron",
						rollupOptions: {
							output: {
								format: "cjs",
								entryFileNames: "[name].cjs",
							},
						},
					},
				},
			},
		}),
	].filter(Boolean),
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
	base: "./", // Important for Electron to load assets correctly
	build: {
		outDir: "dist",
		emptyOutDir: true,
	},
}));
