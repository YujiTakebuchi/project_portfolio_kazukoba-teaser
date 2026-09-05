/**
 * 背面スクロールのロック
 *
 * 実体は html の data-scroll-lock 属性（実際に overflow を止めているのは
 * src/styles/global.scss）。ドロワー・モーダルはこれを直接付け外しせず、
 * 必ずこの関数を通す。
 *
 * WORKS の拡大表示から利用規約モーダルを開くように、ロックしたい要素が
 * 重なって開くことがある。それぞれが属性を付け外しすると、内側を閉じた
 * 時点で外側のロックまで外れてしまうため、開いている数を数えて
 * 0 になったときだけ解除する。
 *
 * 戻り値は解除用の関数。Svelte の $effect からはそのまま返せばよい。
 *
 *   $effect(() => {
 *     if (!isOpen) return;
 *     return lockScroll();
 *   });
 */

let count = 0;

export function lockScroll(): () => void {
	count += 1;
	document.documentElement.setAttribute('data-scroll-lock', '');

	// 二重に呼ばれてもカウントがずれないようにする
	let released = false;

	return () => {
		if (released) return;
		released = true;

		count -= 1;
		if (count === 0) document.documentElement.removeAttribute('data-scroll-lock');
	};
}
