<script lang="ts">
	import instagramGlyph from '@/lib/assets/instagram-glyph-white.png';
	import {
		INSTAGRAM_HANDLE,
		INSTAGRAM_URL,
		SITE_DESCRIPTION,
		SITE_NAME,
		SITE_ROLE,
		SITE_TITLE
	} from '@/lib/config/site';
</script>

<svelte:head>
	<title>{SITE_TITLE}</title>
	<meta name="description" content={SITE_DESCRIPTION} />
</svelte:head>

<!--
	COMING SOON（1画面完結のティザー）

	カンプ: PC 1280x660 / SP 375x750

	リード（Website Renewal Open + 名前）は画面の中央からの相対位置、
	Instagram ブロックは画面下端からの相対位置でカンプの座標を再現している。
	どちらも通常フローに乗せると縦の基準が変わってしまうため absolute で置く。
-->
<main class="top">
	<h1 class="visuallyHidden">{SITE_NAME}</h1>

	<div class="top__lead">
		<p class="top__open">
			Website Renewal Open<br />September 28, 2026
		</p>

		<div class="top__name">
			<p class="top__role">{SITE_ROLE}</p>
			<p class="top__artist">{SITE_NAME}</p>
		</div>
	</div>

	<div class="top__sns">
		<a
			class="top__snsLink"
			href={INSTAGRAM_URL}
			target="_blank"
			rel="noopener noreferrer"
			aria-label="Instagram（{INSTAGRAM_HANDLE}）"
		>
			<span class="top__snsIcon">
				<img src={instagramGlyph} alt="" width="256" height="256" />
			</span>
			<span class="top__snsHandle">{INSTAGRAM_HANDLE}</span>
		</a>

		<p class="top__snsNote">最新の作品・活動はInstagramで<br />ご覧いただけます。</p>
	</div>
</main>

<style lang="scss">
	@use "@/styles/var" as v;
	@use "@/styles/mixin" as m;
	@use "@/styles/function" as f;

	.top {
		position: relative;
		min-height: 100svh;
	}

	// -----------------------------------------------------------
	// 表示アニメーション
	// -----------------------------------------------------------
	//
	// メインタイトル → 名前 → Instagram の順。前の要素がほぼ出そろった
	// ところで次が動き出す。
	//
	//   タイトル  : 0.3s ──────── 1.5s
	//   名前      :         1.2s ──────── 2.2s
	//   Instagram :                  2.1s ──────── 3.0s
	//
	// タイトルと名前はブラーが明けながら、Instagram はフェードのみ。
	// ブラー量は文字サイズに合わせて変えたいので、要素側から
	// --blurFrom で渡す。

	$durOpen: 1.4s;
	$durName: 1s;
	$durSns: 0.9s;

	$delayOpen: 0.2s;
	$delayName: 0.8s;
	$delaySns: 2.2s;

	@keyframes revealBlur {
		from {
			opacity: 0;
			filter: blur(var(--blurFrom));
		}

		to {
			opacity: 1;
			filter: blur(0);
		}
	}

	@keyframes revealFade {
		from {
			opacity: 0;
		}

		to {
			opacity: 1;
		}
	}

	// -----------------------------------------------------------
	// リード
	// -----------------------------------------------------------
	// カンプ上の top は SP 260 / PC 239。画面の高さが変わっても
	// 中央からの距離を保つよう calc(50% - n) で置く。
	//   SP: 375 - 260 = 115
	//   PC: 330 - 239 =  91

	.top__lead {
		position: absolute;
		top: calc(50% - #{f.vw(115)});
		left: 0;
		width: 100%;
		text-align: center;

		@include m.mq("pc") {
			top: calc(50% - #{f.vwPc(91)});
		}
	}

	.top__open {
		--blurFrom: #{f.vw(10)};
		@include m.font(f.vw(24), 1.7, 0.07, 400, "mont");
		color: v.$c-kb;
		white-space: nowrap;
		animation: revealBlur $durOpen v.$easeOut $delayOpen both;

		@include m.mq("pc") {
			--blurFrom: #{f.vwPc(14)};
			@include m.font(f.vwPc(36), 1.7, 0.07, 400, "mont");
		}
	}

	.top__name {
		--blurFrom: #{f.vw(6)};
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: f.vw(8);
		width: f.vw(176);
		margin: f.vw(38.4) auto 0;
		color: v.$c-sub;
		animation: revealBlur $durName v.$easeOut $delayName both;

		@include m.mq("pc") {
			--blurFrom: #{f.vwPc(8)};
			gap: f.vwPc(5);
			width: f.vwPc(176);
			margin-top: f.vwPc(39.6);
		}
	}

	.top__role {
		@include m.font(f.vw(14), 1, 0.07, 400, "mont");
		white-space: nowrap;

		@include m.mq("pc") {
			@include m.font(f.vwPc(14), 1, 0.07, 400, "mont");
		}
	}

	.top__artist {
		@include m.font(f.vw(20), 1, 0.07, 400, "mont");
		white-space: nowrap;

		@include m.mq("pc") {
			@include m.font(f.vwPc(20), 1, 0.07, 400, "mont");
		}
	}

	// -----------------------------------------------------------
	// Instagram
	// -----------------------------------------------------------
	// カンプでは画面下端寄り。PC は右下（ベース幅の右端から 110）、
	// SP は下中央。bottom はキャプション最終行の下端までの距離。

	.top__sns {
		position: absolute;
		bottom: f.vw(27.5);
		left: 50%;
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		// left 基準の absolute なので、指定しないと利用可能幅（画面右端まで）で
		// 折り返してしまう。カンプ通り改行は <br> だけに任せる。
		white-space: nowrap;
		transform: translateX(-50%);
		// ここだけブラーなしのフェード
		animation: revealFade $durSns v.$easeOut $delaySns both;

		@include m.mq("pc") {
			bottom: f.vwPc(20.5);
			left: calc(100% - #{f.vwPc(110)});
		}
	}

	.top__snsLink {
		display: flex;
		flex-direction: column;
		align-items: center;
		@include m.linkHover(0.5);
	}

	.top__snsIcon {
		display: grid;
		place-items: center;
		width: f.vw(85);
		height: f.vw(85);
		border-radius: 50%;
		background-color: v.$c-kb;

		@include m.mq("pc") {
			width: f.vwPc(94);
			height: f.vwPc(94);
		}

		img {
			display: block;
			width: f.vw(33.35);
			height: f.vw(33.33);

			@include m.mq("pc") {
				width: f.vwPc(41.69);
				height: f.vwPc(41.67);
			}
		}
	}

	.top__snsHandle {
		margin-top: f.vw(6);
		@include m.font(f.vw(9), 1, 0.07, 400, "mont");
		color: v.$c-kg;

		@include m.mq("pc") {
			margin-top: f.vwPc(5);
			@include m.font(f.vwPc(10), 1, 0.07, 400, "mont");
		}
	}

	.top__snsNote {
		margin-top: f.vw(18.5);
		@include m.font(f.vw(10), 1.7, 0.07, 400);
		color: v.$c-kg;

		@include m.mq("pc") {
			margin-top: f.vwPc(12.5);
			@include m.font(f.vwPc(10), 1.7, 0.07, 400);
		}
	}

	// アニメーションを控えたい設定のときは、最初から出そろった状態で見せる。
	@include m.mq("noMove") {
		.top__open,
		.top__name,
		.top__sns {
			animation: none;
		}
	}
</style>
