# teaser

SvelteKit + SCSS のベースプロジェクト。リキッド & スプリットレイアウト規約に沿って構成している。
中身は空（白いページ）で、レイアウト・スタイル・デプロイの仕組みだけが入っている。

```bash
npm run dev      # 開発サーバー
npm run build    # 静的書き出し（adapter-static）
npm run preview  # ビルド結果の確認
npm run check    # 型チェック
npm run cf:dev   # ビルド + Workers ランタイムで確認（BASIC 認証込み）
npm run deploy   # ビルド + Cloudflare Workers へデプロイ
```

---

## デプロイ（Cloudflare Workers + BASIC 認証）

`build/` を Workers の静的アセットとして配信し、その手前で [worker/index.ts](worker/index.ts) が
BASIC 認証をかける。設定は [wrangler.jsonc](wrangler.jsonc)。

アセットは既定だと Worker より先に返ってしまい認証を素通りするため、
`assets.run_worker_first: true` で全リクエストを Worker に通してから `env.ASSETS.fetch()` している。

### 認証情報

`BASIC_AUTH_USER` / `BASIC_AUTH_PASS` から読む。**どちらか欠けると全リクエストが 401 になる**（フェイルクローズ）。
リポジトリに残さないよう `wrangler.jsonc` の `vars` には書かず、secret で渡す。

```bash
npx wrangler secret put BASIC_AUTH_USER
npx wrangler secret put BASIC_AUTH_PASS
```

> **注意1**: ダッシュボードから登録する場合は Worker の **Settings → Variables and Secrets**（ランタイム）に入れる。
> Workers Builds の「Build variables and secrets」はビルドコンテナ内でしか使えず、`env` には届かない。
> 正しく入っているかは `npx wrangler secret list` で確認できる。

> **注意2**: ダッシュボードでシークレットを追加しても、**新しいバージョンがアップロードされるだけでデプロイはされない**。
> 稼働中のバージョンには反映されないため、正しい ID / パスワードでも 401 になる（フェイルクローズ）。
> 追加したら Worker → **デプロイ** から該当バージョンを Deploy するか、`npx wrangler versions deploy <version-id>` を実行する。
> どのバージョンが稼働中かは `npx wrangler deployments list` で確認できる。

ローカル（`npm run cf:dev`）は git 管理外の `.dev.vars` を読む。
雛形は [.dev.vars.example](.dev.vars.example)。

### 初回デプロイ

`wrangler.jsonc` の `name`（Worker 名）を案件に合わせて変えてから実行する。

```bash
npx wrangler login
npx wrangler secret put BASIC_AUTH_USER
npx wrangler secret put BASIC_AUTH_PASS
npm run deploy
```

---

## レイアウト

3つの幅の概念で構成する。

| 概念         | 実体          | 内容                               |
| ------------ | ------------- | ---------------------------------- |
| 画面幅       | `--screen-w`  | 縦スクロールバーを除いた実表示幅   |
| ベース幅     | `--base-w`    | サイト全体の幅 = min(画面幅, 上限) |
| コンテンツ幅 | `--content-w` | ベース幅 × 割合                    |

ベース幅は基本的に画面幅と同じで、最大ベース幅に達するとそれ以上広がらない。
超過分は左右の `.side` に振り分けられ、結果としてコンテンツが中央に寄る（スプリットレイアウト）。

### `--vw` の供給

`--vw` は「ベース幅の 1%」。**vw 単位は多用すると再計算が重くなるため、CSS では使わず px 値を JS が書き込む。**

[ViewportMeasure.svelte](src/lib/components/ViewportMeasure.svelte) がメインコンテンツとは別レイヤーに
`position: fixed` の計測用要素を置き、その `clientWidth` を `ResizeObserver` で監視して
`document.documentElement` の `--vw` / `--screen-w` を更新する（`window.innerWidth` は使わない）。

```
baseW = min(clientWidth, clientWidth >= 1024 ? 1280 : 835)
--vw  = baseW / 100  →  "8.35px" のような px 値
```

`--base-w` / `--content-w` はすべて `--vw` から導出されるため、以降 vw 単位は一切現れない。
`:root` に書かれている `--vw` はスクリプト実行前（SSR / ハイドレーション前）のフォールバック。

閾値の定数は [src/lib/config/layout.ts](src/lib/config/layout.ts)（SCSS 側は `_var.scss`。両方揃えること）。

### ブレークポイント

| 条件          | レイアウト | 最大ベース幅 | コンテンツ幅 |
| ------------- | ---------- | ------------ | ------------ |
| `W < 1024px`  | モバイル   | 835px        | 89%          |
| `W >= 1024px` | PC         | 1280px       | 92%          |

定義は [src/styles/global.scss](src/styles/global.scss) の `:root`、
数値は [src/styles/\_var.scss](src/styles/_var.scss)。

### 構造

```
+layout.svelte
└─ .split                       grid: 1fr var(--base-w) 1fr
   ├─ .side                     余白（PC のみ中身を表示）
   ├─ .center                   ベース幅
   │  └─ <Container>            コンテンツ幅・中央寄せ
   └─ .side
```

ページのコンテンツは必ず `.center` の中（= `+layout.svelte` の `{@render children()}` 以下）に置く。
縦スクロールは `body`（ページ本来のスクロール）が担当する。
`.center` の中でも `m.fullBleed()` を使えば画面幅まで広げられる。

### 配色

`--c-page-bg` / `--c-page-text` / `--c-page-line` の3つを `.split` に流し込んでいる
（[src/styles/global.scss](src/styles/global.scss) の `:root`）。
ヘッダー・フッターなど全ページ共通のコンポーネントはこの3つだけを見るようにしておくと、
ページ単位で配色を反転させたくなったとき `.split` に付けるクラスで上書きするだけで済む。

---

## スタイルの書き方

Svelte コンポーネントのスタイルブロックは必ずこの形で始める。

```svelte
<style lang="scss">
	@use "@/styles/var" as v;
	@use "@/styles/mixin" as m;
	@use "@/styles/function" as f;
</style>
```

### サイズ: `f.vw()`

px / rem は使わない。デザインカンプの数値をそのまま渡す。

```scss
width: f.vw(300); // SP カンプ（375px）基準
width: f.vwTab(300); // Tab カンプ（768px）基準
width: f.vwPc(300); // PC カンプ（1280px）基準
```

内部的には `calc($num * ((var(--vw) * 100) / $base))`。`--vw` はベース幅の 1%。

### メディアクエリ: `m.mq()`

生の `@media` は書かない。

```scss
@include m.mq("sp") {
} // max-width: 767.98px
@include m.mq("tab") {
} // min-width: 768px
@include m.mq("pc") {
} // min-width: 1024px
@include m.mq("hover") {
} // any-hover: hover
```

### フォント: `m.font()`

font-size / line-height / letter-spacing / font-weight / font-family を個別に書かない。

```scss
@include m.font($size, $height: 1.8, $letspa: 0.05, $weight: 400, $fam: "");

@include m.font(f.vw(16)); // 日本語
@include m.font(f.vw(14), 1.6, 0.02, 700, "en"); // 英語 太字
```

フォントファミリーの定義は [src/styles/\_var.scss](src/styles/_var.scss) の `$f-ja` / `$f-en` / `$f-mont`。
読み込みは [src/app.html](src/app.html)（Google Fonts）。案件に合わせて両方を差し替える。

### ホバー

```scss
.link {
	@include m.linkHover; // 既定の不透明度 0.6
}
```

### レスポンシブ改行

```html
<br class="spbr" />
<!-- SP のみ改行 -->
<br class="tabbr" />
<!-- Tab のみ改行 -->
```

---

## ディレクトリ

```
src/
├─ app.html                     フォント読み込み / meta
├─ lib/
│  ├─ components/
│  │  ├─ Container.svelte       コンテンツ幅のコンテナ
│  │  └─ ViewportMeasure.svelte 計測レイヤー / --vw を px で供給
│  ├─ config/
│  │  ├─ layout.ts              ブレークポイント・最大ベース幅（_var.scss のミラー）
│  │  └─ site.ts                サイトタイトルなどの共通文言
│  └─ utils/
│     └─ scrollLock.ts          背面スクロールのロック（モーダル / ドロワー用）
├─ routes/
│  ├─ +layout.svelte            スプリットレイアウト / グローバル改行クラス
│  ├─ +layout.ts                prerender = true
│  └─ +page.svelte              トップページ（空）
└─ styles/
   ├─ _var.scss                 デザイン変数・ブレークポイント・色・フォント
   ├─ _function.scss            f.vw() / f.vwTab() / f.vwPc()
   ├─ _mixin.scss               m.mq() / m.font() / m.linkHover() / m.fullBleed()
   ├─ _reset.scss               リセット
   └─ global.scss               :root の幅変数・ベーススタイル
worker/
└─ index.ts                     BASIC 認証 + 静的アセット配信
```
