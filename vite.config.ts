import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

/**
 * まだ実装していない下層ページ
 *
 * 先にリンクだけ張ってあるページを prerender のクローラが 404 として
 * 拾い、ビルドを止めてしまうのを防ぐ。実装したらこの配列から外すこと。
 */
const PLANNED_ROUTES: string[] = [];

export default defineConfig({
	plugins: [
		sveltekit({
			// <style lang="scss"> を有効にする
			preprocess: vitePreprocess(),

			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[\/]/).includes('node_modules') ? undefined : true
			},

			// `@/styles/var` のように src 以下を参照するためのエイリアス。
			// Vite / TypeScript / SCSS の import すべてに適用される。
			alias: {
				'@': 'src'
			},

			prerender: {
				handleHttpError: ({ path, referrer, message }) => {
					const isPlanned = PLANNED_ROUTES.some(
						(route) => path === route || path.startsWith(`${route}/`)
					);

					if (isPlanned) {
						console.warn(`[prerender] 未実装ページへのリンクをスキップ: ${path} (${referrer})`);
						return;
					}

					throw new Error(message);
				}
			},

			// 全ページ prerender する前提で静的書き出し。
			// SSR が必要になったら adapter を差し替える。
			adapter: adapter()
		})
	]
});
