/**
 * レイアウト定数
 *
 * src/styles/_var.scss と同じ値を JS 側から参照するためのミラー。
 * どちらかを変更したら必ず両方揃えること。
 */

/** PC レイアウトの下限（px） */
export const BP_PC_MIN = 1024;

/**
 * CSS の m.mq("pc") と同じ条件。
 *
 * メディアクエリの幅はスクロールバーを含むのに対し、JS で測る実表示幅は
 * 含まない。数値比較で判定すると境界付近で CSS と食い違うため、
 * JS 側は必ず matchMedia(MQ_PC) を使って CSS と判定を揃える。
 */
export const MQ_PC = `(min-width: ${BP_PC_MIN}px)`;

/** 最大ベース幅（px）: W < 1024px  モバイルレイアウト */
export const MAX_BASE_W_SP = 835;

/** 最大ベース幅（px）: W >= 1024px  PC レイアウト */
export const MAX_BASE_W_PC = 1280;

/**
 * 実表示幅からベース幅を求める。
 *
 * ベース幅は基本的に画面幅と同じで、最大ベース幅に達したらそれ以上広がらない。
 *
 * @param screenWidth スクロールバーを除いた実表示幅
 * @param isPc        PC レイアウトかどうか（matchMedia(MQ_PC).matches を渡す）
 */
export function toBaseWidth(
	screenWidth: number,
	isPc: boolean = screenWidth >= BP_PC_MIN
): number {
	return Math.min(screenWidth, isPc ? MAX_BASE_W_PC : MAX_BASE_W_SP);
}
