<script lang="ts">
	import type { Snippet } from 'svelte';

	type Props = {
		/** 出力するタグ。section / main / article などに変えられる */
		tag?: string;
		children: Snippet;
	};

	let { tag = 'div', children }: Props = $props();
</script>

<!--
	コンテンツ幅（ベース幅に対する割合）のコンテナ。
	W <  1024px : ベース幅の 89%
	W >= 1024px : ベース幅の 92%
-->
<svelte:element this={tag} class="container">
	{@render children()}
</svelte:element>

<style lang="scss">
	@use "@/styles/var" as v;
	@use "@/styles/mixin" as m;
	@use "@/styles/function" as f;

	.container {
		width: var(--content-w);
		margin-inline: auto;
	}
</style>
