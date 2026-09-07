---
name: liquid-split-layout
description: |
  SvelteKitプロジェクトのリキッド&スプリットレイアウト規約。Svelteコンポーネントのスタイル記述・新規コンポーネント作成・レイアウトやスタイリングに関する質問時に使用する。CSSやSCSSを書くとき、サイズ指定・レスポンシブ対応・フォント設定・レイアウト構造に関わる作業すべてでこのスキルを参照すること。コンポーネントのテンプレートやマークアップを書く場合も、レスポンシブな改行タグなどスタイルに関わる部分があればこのスキルに従う。
---

# リキッド & スプリットレイアウト規約

このプロジェクトでは、デザインカンプの数値をそのままコードに反映しつつ、あらゆる画面サイズでリキッド（流動的）に拡縮するレイアウトシステムを採用している。固定単位（px, rem）は使わない。

## SCSS インポート規約

Svelteコンポーネントでスタイルを書くときは、必ず `<style lang="scss">` を使い、以下の3つをインポートする:

```scss
<style lang="scss">
  @use "@/styles/var" as v;
  @use "@/styles/mixin" as m;
  @use "@/styles/function" as f;
</style>
```

`v` = 変数、`m` = Mixin、`f` = 関数。このエイリアスは全コンポーネントで統一する。

---

## サイズ指定: `f.vw()` によるリキッドレイアウト

### 基本ルール

**すべてのサイズ指定には `f.vw()` か相対単位（%, em, auto, etc.）を使う。px や rem は使わない。**

これはフォントサイズ、マージン、パディング、幅、高さ、gap など、あらゆる数値に適用される。

### `f.vw()` の仕組み

```scss
// デザインカンプ上の数値をそのまま渡す
width: f.vw(300);     // SPデザイン幅375pxベースで300px相当
padding: f.vw(20);    // 20px相当のパディング
font-size: f.vw(16);  // 16px相当のフォントサイズ
gap: f.vw(10);        // 10px相当のギャップ
```

内部的には `calc($num * var(--vw-scale, 1) * ((var(--vw, 1vw) * 100) / $base))` に変換される。
`--vw-scale` は Tab 帯（768〜1023px）だけ 1.4 になる倍率で、レイアウト幅（`--base-w` /
`--content-w`）には掛からない。デフォルトのベース幅はSPデザイン幅の375px（`v.$desWSp`）。

### PC用: `f.vwPc()`

PCのデザインカンプに基づくサイズ指定には `f.vwPc()` を使う。ベース幅は1280px（`v.$desWPc`）。
| `v.$c-bg` | #FFFFFF | 背景色 |
| `v.$c-text` | #333333 | テキスト色 |
| `v.$c-line` | #DDDDDD | 罫線 |

```scss
.element {
  width: f.vw(200);  // モバイルベース

  @include m.mq("pc") {
    width: f.vwTab(300);  // PCベース
  }
}
```

---

## メディアクエリ: `m.mq()`

レスポンシブ対応には `m.mq()` Mixinを使う。生の `@media` は書かない。

| Mixin | 対象 | 条件 |
|-------|------|------|
| `m.mq("sp")` | SP のみ | max-width: 767.98px |
| `m.mq("tab")` | Tab 以上（= `"pc"` と同条件） | min-width: 768px |
| `m.mq("tabOnly")` | Tab のみ | 768px 〜 1023.98px |
| `m.mq("pc")` | PC のみ（タブレット含む） | min-width: 768px |
| `m.mq("hover")` | ホバー可能デバイス | any-hover: hover |
| `m.mq("noMove")` | アニメーション抑制 | prefers-reduced-motion: reduce |

ブレークポイント: **SP < 768 <= Tab < 1024 <= PC**

Tab と PC は同じ PC レイアウト・同じ PC カンプ（1280）基準。違いは Tab 帯だけ
`--vw-scale` でサイズを 1.4 倍する点だけ。Tab 帯だけを狙うときは `"tabOnly"` を使う
（`"tab"` は `"pc"` と同条件なので、後続の `"pc"` に必ず上書きされる）。

```scss
.element {
  // SPベースのスタイル（デフォルト）
  padding: f.vw(16);

  @include m.mq("tab") {
    padding: f.vwTab(24);
  }

  @include m.mq("pc") {
    padding: f.vw(32);  // PCのデザインベースに合わせる
  }
}
```

---

## スプリットレイアウト構造

ページ全体は3カラムのグリッドで構成されている:

```
| .side (left) | .center (メインコンテンツ) | .side (right) |
```

- **モバイル**: サイドパネルは非表示。`.center` が全画面を占有
- **PC**: 両サイドにパネルが表示され、中央は `--vw` CSS変数に基づくリキッド幅

コンテンツはすべて `.center` の中に配置される。縦スクロールは body（ページ本来のスクロール）が担当する。

`.center` はベース幅で頭打ちになるが、画面幅いっぱいに広げたい要素（メインビジュアルや全幅の画像など）は `m.fullBleed()` で外へはみ出せる。

```scss
.fullWidthBlock {
  @include m.fullBleed;   // 親の幅と --screen-w の差を負マージンで打ち消す
}
```

`position` は使わず通常フローのままなので、`margin-top` による縦積みと併用できる。親を辿って `overflow` が `hidden` / `clip` になっていると効かないので注意（`.split` の `overflow-x: clip` は横スクロール抑止用で、フルブリードは画面幅ちょうどなので影響しない）。

### 幅を表す CSS 変数

| 変数 | 内容 |
|------|------|
| `--screen-w` | 画面幅（縦スクロールバーを除いた実表示幅） |
| `--base-w` | ベース幅（`min(画面幅, 最大ベース幅)`） |
| `--content-w` | コンテンツ幅（`Container` が使う） |
| `--vw` | ベース幅の 1%。`f.vw()` の基準 |

`--screen-w` と `--vw` は `ViewportMeasure.svelte` が px で書き込む。

新しいページコンポーネントを作るとき、このスプリットレイアウトの外側に要素を置かないこと。ルートの `+layout.svelte` がこの構造を提供している。

---

## フォント: `m.font()` Mixin

タイポグラフィは必ず `m.font()` で設定する。font-size, font-weight, line-height, letter-spacing, font-family を個別に手書きしない。

```scss
@include m.font($size, $height, $letspa, $weight, $fam);
```

| 引数 | デフォルト | 説明 |
|------|-----------|------|
| `$size` | (必須) | フォントサイズ（`f.vw()` で指定） |
| `$height` | 1.8 | line-height |
| `$letspa` | 0.05 | letter-spacing（em単位の係数） |
| `$weight` | 400 | font-weight |
| `$fam` | "" | `"en"` = 英語本文 / `"mont"` = 英字見出し |

- `$fam` が `""` → 日本語フォント（`$f-ja`）
- `$fam` が `"en"` → 英語本文・日付・フッター用（`$f-en`）
- `$fam` が `"mont"` → ロゴ・ナビ・ボタンなどの英字見出し用（`$f-mont`）

具体的なフォントファミリーは `_mixin.scss` の `font()` に定義されている。

```scss
// 日本語 16px相当
@include m.font(f.vw(16));

// 英語 太字
@include m.font(f.vw(14), 1.6, 0.02, 700, "en");

// 英字見出し（Montserrat）
@include m.font(f.vw(16), 1.2, 0.1, 400, "mont");
```

### 初回確認（このスキルを初めて読み込んだとき）

フォント設定はプロジェクトごとに異なる。このスキルの初回読み込み時に `_mixin.scss` の `font()` Mixin を読み取り、現在設定されているフォントをユーザーに提示すること:

1. `src/styles/_mixin.scss` の `@mixin font` 内のフォントファミリーを確認する
2. ユーザーに「現在のフォント設定は 日本語: "○○○", 英語: "○○○" です。このまま進めて良いですか？」と確認する
3. ユーザーがOKなら作業を続行する
4. 変更が必要な場合は `_mixin.scss` のフォント設定を修正してから続行する

---

## ホバー

リンク / ボタンのホバーは透過で統一する。生の `:hover` を直接書かず `m.linkHover()` を使う。
ホバーできないデバイス（`any-hover: hover` 非対応）では何も起きない。

```scss
.link {
  @include m.linkHover;      // 既定の不透明度 0.6
  @include m.linkHover(0.4); // 個別に指定する場合
}
```

---

## レスポンシブ改行

テンプレート内でデバイスごとに改行を制御するには、専用のクラスを使う:

```html
<!-- SP でのみ改行 -->
<br class="spbr" />

<!-- タブレットでのみ改行 -->
<br class="tabbr" />
```

これらのグローバルスタイルは `+layout.svelte` で定義済み。

---

## デザイン変数（参考）

| 変数 | 値 | 用途 |
|------|----|------|
| `v.$desWSp` | 375 | SPデザイン基準幅 |
| `v.$bpTabMin` | 768 | タブレット最小幅 |
| `v.$bpTabMax` | 1023.98 | タブレット最大幅 |
| `v.$tabScale` | 1.4 | Tab 帯のサイズ倍率 |
| `v.$bpPcMin` | 768 | PC最小幅（タブレット含む） |
| `v.$c-bg` | #FFFFFF | 背景色 |
| `v.$c-text` | #333333 | テキスト色 |
| `v.$c-line` | #DDDDDD | 罫線 |

---

## コンポーネント作成テンプレート

新しいSvelteコンポーネントを作成するとき、スタイルブロックはこの形で始める:

```svelte
<style lang="scss">
  @use "@/styles/var" as v;
  @use "@/styles/mixin" as m;
  @use "@/styles/function" as f;

  .wrapper {
    // f.vw() でサイズ指定
    // m.mq() でレスポンシブ対応
  }
</style>
```
