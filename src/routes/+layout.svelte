<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import ViewportMeasure from '@/lib/components/ViewportMeasure.svelte';
	import '@/styles/global.scss';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<!--
	スプリットレイアウト

	| .side (left) | .center (ベース幅) | .side (right) |

	.center の幅は常に --base-w（= min(画面幅, 最大ベース幅)）。
	画面幅がベース幅を超えた分だけ .side に余白が生まれ、
	結果としてコンテンツが中央に寄る。

	ページのコンテンツは必ず .center の中に置くこと。
	縦スクロールは body（ページ本来のスクロール）が担当する。

	.center の中でも m.fullBleed() を使えば画面幅まで広げられる。
	そのため .center / .split には overflow: hidden を掛けない。
-->
<!-- メインコンテンツとは別レイヤーのサイズ計測用要素。--vw を px で供給する -->
<ViewportMeasure />

<div class="split">
	<div class="side" aria-hidden="true"></div>

	<div class="center">
		{@render children()}
	</div>

	<div class="side" aria-hidden="true"></div>
</div>

<style lang="scss">
	@use "@/styles/var" as v;
	@use "@/styles/mixin" as m;
	@use "@/styles/function" as f;

	.split {
		display: grid;
		grid-template-columns: 100%;
		width: 100%;
		// 中身が短いページでも背景がビューポートを埋めるようにする
		min-height: 100svh;

		// ページの地の色。.side も含めて画面幅いっぱいを塗る。
		// --c-page-* は global.scss の :root で定義している。
		background-color: var(--c-page-bg);
		color: var(--c-page-text);

		// フルブリード要素がスクロールバー分だけあふれても横スクロールさせない。
		// clip は hidden と違いスクロールコンテナを作らないので、
		// body のスクロールや position: sticky の妨げにならない。
		overflow-x: clip;

		@include m.mq("pc") {
			grid-template-columns: 1fr var(--base-w) 1fr;
		}
	}

	.center {
		// 縦は「ヘッダー → 本文 → フッター」の一列。
		// フッターだけ margin-top: auto で下端に落とす（下記）。
		display: flex;
		flex-direction: column;
		width: 100%;
		// グリッドアイテムの既定 min-width: auto で押し広げられないようにする
		min-width: 0;

		// コンテンツが画面より短いときだけフッターを画面下端に貼り付ける。
		// 余った高さを margin が吸うだけなので、コンテンツが画面より長ければ
		// そのまま本文の後ろに流れる（position: fixed と違って重ならない）。
		//
		// フッターは各ページが <Footer /> として並べる想定なので、
		// レイアウト側からは :global で拾う。
		> :global(footer) {
			margin-top: auto;
		}
	}

	.side {
		// モバイルレイアウトではサイドパネルの中身は表示しない。
		// （トラック自体は残るので .center は常に中央寄せになる）
		display: none;

		@include m.mq("pc") {
			display: block;
		}
	}

	// -----------------------------------------------------------
	// レスポンシブ改行（グローバル）
	// -----------------------------------------------------------
	:global(.spbr) {
		display: none;

		@include m.mq("sp") {
			display: inline;
		}
	}

	:global(.tabbr) {
		display: none;

		@include m.mq("tab") {
			display: inline;
		}

		@include m.mq("pc") {
			display: none;
		}
	}
</style>
