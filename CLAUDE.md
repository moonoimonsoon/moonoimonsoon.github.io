# CLAUDE.md — Moonoi Monsoon PJ

AI（Claude Code / ChatGPT など）がこのリポジトリで作業するときの前提・規約・手順。
**人間の役割は「何を作るか決める・設計する・指示を出す・確認する」。コードを書くのはAI。** この分担を崩さない。

---

## 1. プロジェクト概要

Moonoi Monsoon は、タイ語の「読み」に特化した小さなWebアプリ群と、その配布ハブ。

| リポジトリ | 役割 |
|---|---|
| `moonoimonsoon.github.io`（本リポジトリ） | ハブサイト。全アプリの入口 |
| `thaitonemaster_en` | 声調の即時判別トレーニング |
| `looplessthaifontmaster_en` | ループなしフォントの読み取り |
| `thaiconsonantquiz_en` / `_jp` | 子音字44字のクラス分類クイズ |
| `wallpapers` | 壁紙配布 |

公開先はすべて GitHub Pages（`https://moonoimonsoon.github.io/<repo>/`）。

## 2. 本リポジトリの制約（勝手に破らない）

- **単一ファイル構成**。`index.html` に HTML / CSS / JS をすべて内包する。ビルド工程なし、npm なし、フレームワークなし。
- **外部依存は Google Fonts のみ**（Silkscreen / Prompt）。CDN スクリプト・解析タグ・広告タグを足さない。
- **画像ファイルを使わない**。アイコンはすべてインライン SVG（`viewBox="0 0 100 100"`、角丸は `rx="22"`）。
- `log/index.html` は開発ノート。同じ制約が適用される。

これらを変更したくなったら、まず `docs/specs/` に理由を書いてから。

## 3. デザイン規約

- 色は `:root` の CSS 変数のみを使う（`--lime` `--lime-hi` `--lime-lo` `--olive` `--olive-2` `--olive-card` `--cream` `--cream-dim` `--ring`）。生の16進を新規に散らかさない。例外は Downloads（青系）・Lessons（橙系）のセクション固有色で、これはインラインで既に指定済み。
- 見出し・ラベル・バッジは `Silkscreen`、本文は `Prompt`。
- セクションラベルは `<p class="sec-label">` で英語・大文字・字間広め。
- アプリカードは `.app > .app-icon + .app-body(.app-title/.app-sub/.app-tags) + .app-go` の形を守る。
- **アクセシビリティは必須要件**：`:focus-visible` のアウトライン、`aria-pressed`、装飾要素の `aria-hidden="true"`、`@media (prefers-reduced-motion:reduce)` でのアニメーション停止。既存はすべて対応済みなので、新規追加時も同じ水準にする。

### アプリカードを1枚足す手順

1. `#webApps` 内に `<a class="app" data-lang="en|ja|th" href="...">` を追加。
2. `data-lang` は言語フィルタが参照する。付け忘れると「All」でしか表示されない。
3. タグは `<span class="tag">` ＋ 言語タグ `<span class="tag lang">`。
4. 新着は `<span class="badge-new">New</span>` を `.app-title` の中に。**次のリリース時に外す。**

## 4. 仕様書ファースト（この PJ の中心的な作法）

コードを触る前に、`docs/specs/` に `.md` の仕様書を書く。手順は `docs/specs/README.md` を参照。

- **細切れ時間 = 考える・言語化する（スマホ、GitHub の Web エディタ）**
- **まとまった時間 = AI に実装させて確認する（PC）**

AI への最初の指示は「◯◯を作って」ではなく「`docs/specs/00X-*.md` を読んで、この通りに実装して」。
仕様が曖昧なまま書かせない。曖昧さに気づいたら、コードではなく**仕様書を直す**。

## 5. 完成前の確認工程（省略しない）

1. **セルフレビュー** — 仕様書の受け入れ基準を1行ずつ突き合わせる。
2. **セキュリティレビュー** — 作った後に改めて AI にかける。観点：外部送信の有無、`innerHTML` 等での XSS、リンクの `rel="noopener noreferrer"`、外部リソースの追加有無。
3. **クロスレビュー** — 同じ成果物を別の AI にもレビューさせる。指摘がずれた箇所こそ読む価値がある。
4. **実機確認** — スマホ幅、リデュースモーション有効時、キーボード操作（Tab で全要素に到達できるか）。

## 6. 絶対にやらないこと

- APIキー・トークン・個人情報をリポジトリにも AI のチャットにも置かない。このリポジトリは**公開**であり、秘密を持つ設計にしない。
- 従量課金のサービスを、予算アラートを設定せずに繋がない。
- 実在しない実績・日付を `log/` に書かない。開発ノートは記録であって宣伝ではない。

## 7. デプロイ

`main` に push すると GitHub Pages が自動で公開する。ビルドもワークフローもない。
作業は必ずブランチを切って行い、確認後に `main` へ。
