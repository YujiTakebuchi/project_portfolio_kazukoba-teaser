<script lang="ts">
	import { MQ_PC, toBaseWidth } from '@/lib/config/layout';

	/**
	 * サイズ計測用レイヤー
	 *
	 * メインコンテンツとは別レイヤーに置いた計測用要素を ResizeObserver で
	 * 監視し、次の 2 つを px で書き込む。
	 *
	 *   --screen-w : 画面幅（縦スクロールバーを除いた実表示幅）
	 *   --vw       : ベース幅の 1%
	 *
	 * 計測要素は position: fixed + left/right: 0 にしてある。こうすると幅が
	 * ビューポートからスクロールバーを除いた値になり、100vw のように
	 * スクロールバー分だけ横あふれする問題が起きない。
	 *
	 * vw 単位を大量に使うと再計算が重くなるため、CSS 側では vw を使わず
	 * この px 値だけを参照する（--base-w も --vw から導出される）。
	 */

	let eleContentWrapper: HTMLDivElement | null = $state(null);

	$effect(() => {
		const el = eleContentWrapper;
		if (!el) return;

		const root = document.documentElement;
		const mql = window.matchMedia(MQ_PC);

		const update = () => {
			const screenW = el.clientWidth;
			const baseW = toBaseWidth(screenW, mql.matches);

			root.style.setProperty('--screen-w', `${screenW}px`);
			root.style.setProperty('--vw', `${Math.round((baseW / 100) * 1000) / 1000}px`);
		};

		// ResizeObserver は observe した時点でも一度発火するので初期化も兼ねる
		const observer = new ResizeObserver(update);
		observer.observe(el);

		// ブレークポイントをまたいだときは幅が変わらないこともあるので個別に購読する
		mql.addEventListener('change', update);

		return () => {
			observer.disconnect();
			mql.removeEventListener('change', update);

			// SCSS 側のフォールバック（vw ベース）に戻す
			root.style.removeProperty('--vw');
			root.style.removeProperty('--screen-w');
		};
	});
</script>

<div class="measure" bind:this={eleContentWrapper} aria-hidden="true"></div>

<style lang="scss">
	.measure {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: 100svh;
		pointer-events: none;
		visibility: hidden;
		z-index: -1;
	}
</style>
