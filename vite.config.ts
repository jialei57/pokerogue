import { defineConfig, loadEnv, Rollup, UserConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { minifyJsonPlugin } from "./src/plugins/vite/vite-minify-json-plugin";

export const defaultConfig: UserConfig = {
	plugins: [
		tsconfigPaths(),
		minifyJsonPlugin(["images", "battle-anims"], true),
		{
			name: 'rewrite-middleware',
			configureServer(server) {
				server.middlewares.use((req, res, next) => {
					if (req?.url?.startsWith('/game/')) {
						req.url = '/game.html';  // Rewrite request to serve game.html
					}
					else if (req.url === '/policy') {
						req.url = '/policy.html';
					}
					else if (req.url === '/terms') {
						req.url = '/terms.html';
					}
					next();
				});
			}
		}
	],
	clearScreen: false,
	appType: "mpa",
	build: {
		chunkSizeWarningLimit: 10000,
		minify: 'esbuild',
		sourcemap: false,
		rollupOptions: {
			onwarn(warning: Rollup.RollupLog, defaultHandler: (warning: string | Rollup.RollupLog) => void) {
				// Suppress "Module level directives cause errors when bundled" warnings
				if (warning.code === "MODULE_LEVEL_DIRECTIVE") {
					return;
				}
				defaultHandler(warning);
			},
		},
	},
};

export default defineConfig(({ mode }) => {
	const envPort = Number(loadEnv(mode, process.cwd()).VITE_PORT);

	return {
		...defaultConfig,
		base: '',
		esbuild: {
			pure: mode === 'production' ? ['console.log'] : [],
			keepNames: true,
		},
		server: {
			port: !isNaN(envPort) ? envPort : 8000,
		},
	};
});

