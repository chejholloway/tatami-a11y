<table>
  <tr>
    <td width="120">
      <img src="./assets/logo.png" alt="tatami-a11y logo — a smiling tatami mat tile" width="100" />
    </td>
    <td>
      <h1>tatami-a11y</h1>
    </td>
  </tr>
</table>

[![CI](https://img.shields.io/github/actions/workflow/status/chejholloway/tatami-a11y/ci.yml)](https://github.com/chejholloway/tatami-a11y/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/tatami-a11y)](https://www.npmjs.com/package/tatami-a11y)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Tests: 746 passing](https://img.shields.io/badge/tests-746%20passing-brightgreen)](https://github.com/chejholloway/tatami-a11y/actions/workflows/ci.yml)
[![Toolchain: Rust (oxlint/oxfmt)](https://img.shields.io/badge/toolchain-Rust%20\(oxlint%2Foxfmt\)-orange)](https://oxc.rs)

バニラJavaScript向けの、フレームワーク非依存でアクセシビリティを第一に考えたUIプリミティブとコンポーネント。

**16個のコンポーネント、6個の共通プリミティブ、746個の単体テスト、a11yチェック付きの16個のブラウザレベルStorybook統合テスト、ゼロランタイム依存性**。これらすべてがWAI-ARIAオーサリングプラクティスを実装し、WCAG 2.2 AA準拠が検証済みです。

## 問題点

すべてのアクセシブルなインタラクティブコンポーネントは、同じく困難で間違いやすいインフラストラクチャを必要とします。

-   **ライブリージョン:** フォーカスを奪うことなくスクリーンリーダーに通知する
-   **フォーカス復元:** トリガー要素がなくなっても、一時的なUIが閉じられたときにフォーカスを返す
-   **フォーカストラップ:** モーダルやダイアログ内でキーボードナビゲーションを維持する
-   **モーション削減:** あらゆる場所で手動チェックなしにシステム設定を尊重する
-   **ロービングタブインデックス:** リスト、グリッド、ツリー、タブリストの矢印キーナビゲーション
-   **HMR対応シングルトン:** DOMノードの重複やリスナーのリークなしにホットモジュールリロードを乗り切る

ほとんどのプロジェクトでは、これらの要素を各コンポーネントでゼロから再構築しています。「閉じる際にフォーカスを復元する」という機能の10回目の再実装では、誰かが古い参照ケースを忘れ、キーボードフォーカスを`<body>`に密かに閉じ込めてしまうドロップダウンを出荷してしまうことがよくあります。

tatami-a11yは、これらの共通プリミティブを単一のテスト済み基盤に抽出し、その上に完全にアクセシブルなコンポーネントを構築します。ライブラリ内のすべてのコンポーネントは、同じ実証済みのプリミティブに依存しているため、1つで修正されたバグはすべてで修正されます。

![Diagram comparing reimplementing accessibility per component vs. building on shared tested primitives](./assets/shared_a11y_primitives_problem.png)

## なぜ「tatami」なのか？

畳は日本の伝統的な床材であり、部屋全体の基礎となる標準化された交換可能なモジュールです。畳自体は目立ちませんが、安定したものはすべてその上に建てられています。ここでも同じ考えです。これらのプリミティブは基礎であり、コンポーネントは実際に住む部屋なのです。

## フレームワーク非依存である理由

Radix UIとReact Ariaは、Reactにおいてはこれをうまく解決しています。Headless UIはVueとReactをカバーしています。しかし、これらのエコシステムに属していない場合、またはバニラJSのコードベースを保守している場合、真剣に活発にメンテナンスされている同等のものはありません。tatami-a11yはそれとなるべく構築されています。仮想DOMもフレームワークのランタイムもなしに、手作りのコンポーネント、Vueのコンポーザブル、Svelteの`use:action`、または単純な`<script>`タグから呼び出しても同じように動作します。

### 検証済みのフレームワーク相互運用性

フレームワーク非依存の主張は、3つの異なるViteプロジェクトで自動Playwrightテストによって検証されています。それぞれのプロジェクトは、実際の利用者が行うのとまったく同じ方法で、公開されているnpmパッケージから`tatami-a11y`をインストールしています。各フレームワークで2つのコンポーネントがテストされました — Toast (`document.body`に追加され、フレームワークが管理するツリーの外にあります) とDropdown (フレームワークがレンダリングしたDOMノードに動作をアタッチします)。素朴な使用パターンと、フレームワークに慣用的な手作りのラッパーパターンが両方テストされ、それぞれが、ライブラリのDOM追加が存在する間にホストフレームワークに周辺領域の再レンダリングを強制することでストレステストされました。

| フレームワーク | Toast (素朴) | Toast (ラッパー) | Dropdown (素朴) | Dropdown (手作りのラッパー) |
| --------- | ------------- | --------------- | ---------------- | ------------------------------ |
| **React** | ✅ パス        | ✅ パス          | ✅ パス           | ✅ パス                         |
| **Vue**   | ✅ パス        | ✅ パス          | ✅ パス           | ✅ パス                         |
| **Svelte**| ✅ パス        | ✅ パス           | ✅ パス           | ✅ パス                         |

Toastについては、12のテストすべてが接着コードなしでパスしました。Dropdownは3つのフレームワークすべてで素朴に動作し、手作りのフレームワーク慣用ラッパー（Reactでは`useRef`+`useEffect`、Vueでは`ref`+`onMounted`/`onUnmounted`、Svelteでは`use:action`）でもパスしました。完全な調査結果と生のテスト出力は[`framework-interop-check/`](./framework-interop-check/)にあります。

**これらを自分で実行する:** `framework-interop-check/react-app`、`framework-interop-check/vue-app`、`framework-interop-check/svelte-app`のそれぞれは、独立したインストール可能なViteアプリです。それらのいずれかに`cd`し、`pnpm install`、`pnpm dev`を実行し、表示されたローカルURLを開いて、上記の表を鵜呑みにするのではなく、素朴なテストとラッパーパターンのテストを直接クリックして確認してください。

> **`tatami()`に関する注意:** 上記の表は、手作りのラッパーを使用した最初の3フレームワーク調査を反映しています。`tatami()`アダプターはその後開発され、16のコンポーネントすべてをカバーする専用の単体テスト（`__tests__/tatami.test.ts`を参照）が含まれており、メソッド転送、破棄の冪等性、開発モードの警告に関するテストも含まれています。`tatami()`アダプターは、これらの単体テストを通じて、16のコンポーネントすべてで正しく動作することが検証されています。Playwrightによるクロスフレームワークハーネスの完全なパスは保留中ですが、アダプターの正確性は単体テストスイートによって確立されています。

### Astro Islands デモ — 4つのフレームワーク、1つのページ

`framework-interop-check/`は、`tatami-a11y`が各フレームワーク内で単独で正しく動作するかどうかを答えます。`astro-demo/`はさらに一歩進んで、Astroのアイランドアーキテクチャを使用して、Reactアイランド、Vueアイランド、Svelteアイランド、そしてプレーンなJSセクションを**同じページ**にマウントし、共有プリミティブ、特にライブリージョンアナウンサーが、ライブラリの独立してバンドルされたコピー間で、アイランドごとに分離されたインスタンスに密かに重複するのではなく、実際に連携するかどうかをチェックします。

**ライブで見る:** [tatami-a11y-astro.surge.sh](https://tatami-a11y-astro.surge.sh)

**ローカルで実行する:** `cd astro-demo`、`pnpm install`、`pnpm dev`。

### `tatami()` — ライフサイクルユーティリティ

ラッパーテストでは、繰り返しのパターンが明らかになりました。すべてのフレームワークは、任意の命令型DOMライブラリから同じ3つのことを必要とします。DOMの準備ができたら一度初期化し、フレームワークが管理する要素への参照を渡し、それらの要素がなくなったらクリーンアップする。そのためのボイラープレートは、構文は異なりますが、フレームワーク間で同一です。

`tatami()`は、16のコンポーネントすべてでそのハンドシェイクを処理する、単一のフレームワーク非依存ユーティリティです。これはライブラリのReactバージョンでもVueバージョンでもありません — 1つの関数で、フレームワークのインポートなしに、どこでも動作します。

```js
import { tatami } from 'tatami-a11y/adapters/tatami.js';
import { Dropdown, Modal, Accordion } from 'tatami-a11y';

// React — useEffect内
const ctrl = tatami(Dropdown, { trigger: triggerRef.current, menu: menuRef.current });
return () => ctrl.destroy();

// Vue — onMounted / onUnmounted内
onMounted(() => { ctrl = tatami(Accordion, { container: containerRef.value }); });
onUnmounted(() => ctrl?.destroy());

// Svelte — use: action
export function dropdown(node, { menu }) {
  const ctrl = tatami(Dropdown, { trigger: node, menu });
  return { destroy: () => ctrl.destroy() };
}

// Plain JS, フレームワークなし
const ctrl = tatami(Modal, { trigger: btn, modal: dialog });
openBtn.addEventListener('click', () => ctrl.open());

// Next.js App Router — クライアントコンポーネントが必要（ファイルの先頭に'use client'を記述）、
// その後、プレーンなReactと同じuseEffectパターン
'use client';
useEffect(() => {
  const ctrl = tatami(Dropdown, { trigger: triggerRef.current, menu: menuRef.current });
  return () => ctrl.destroy();
}, []);

// Nuxt — Vueと同じonMounted/onUnmountedパターンを、ユニバーサルレンダリング設定での
// さらなる安全のためにimport.meta.clientで保護
let ctrl;
onMounted(() => {
  if (import.meta.client) {
    ctrl = tatami(Accordion, { container: containerRef.value });
  }
});
onUnmounted(() => ctrl?.destroy());
```

`tatami()`は`destroy()`を持つコントローラーを返し、インスタンス化されたコンポーネントが実際に持つすべての公開メソッドを転送します（実行時にリフレクションを介して導出されます — ハードコードされたメソッドリストはありません）。開発モードでは、`destroy()`後に転送されたメソッドを呼び出すか、コンポーネントに存在しないメソッドを呼び出すと、コンポーネント名とメソッド名を含む`console.warn`が生成されます。フレームワークが知る必要があるのは2つだけです。DOMの準備ができたら`tatami()`を呼び出し、クリーンアップ時に`ctrl.destroy()`を呼び出す。それ以外はすべてコンポーネント自体によって処理されます。

`Toast`は特殊なケースとして扱われます。インスタンスではなく静的APIのみ（`Toast.show()`、`Toast.configure()`など）を使用し、`tatami()`はこれを自動的に検出し、静的メソッドを直接転送します。

> **上記のNext.jsとNuxtの例について:** これらは各フレームワークの標準的で現在の、文書化されたライフサイクルパターンですが、上記の検証済みテーブルにあるReact、Vue、Svelteとは異なり、同じ自動クロスフレームワークハーネス（実際のスキャフォールドされたアプリ、強制的な再レンダリング、Playwright）で実行されていません。これらは正しいガイダンスとして扱ってください。上記の3つのフレームワークのように、このライブラリに対して独立して検証されたものではありません。

### 開発モードの警告

開発モードでは、`tatami()`は、転送されたメソッドが`destroy()`後に呼び出された場合や、メソッド名がコンポーネントに存在しない場合に`console.warn`メッセージを出力します。これらの警告は、呼び出し時にこの優先順位で解決される開発モードフラグによって制御されます。

1.  **手動オーバーライド** — `setTatamiDebug(true)`が常に優先されます。これは、自動検出が不可能なバンドラーなしの`<script>`タグ使用にとって正しい答えです。
2.  **`import.meta.env?.DEV`** — Viteベースのコンシューマーで動作します。
3.  **`process.env.NODE_ENV !== "production"`** — webpack/Nodeを認識するバンドラーのフォールバック。
4.  **デフォルト`false`** — 認識されない環境ではデフォルトでサイレンス。

```js
import { tatami, setTatamiDebug } from 'tatami-a11y/adapters/tatami.js';

// 開発中に警告を有効にする（<script>タグでの使用には必須）
setTatamiDebug(true);
```

## クイックスタート

```bash
pnpm install tatami-a11y
```

```js
import { announce, pushFocusStack, popFocusStack } from "tatami-a11y";

// スクリーンリーダーアナウンス：デフォルトでは丁寧、緊急時は断定的
announce("変更が保存されました");
announce("エラー: 問題が発生しました", { urgent: true });

// 一時的なUI（モーダル、ドロップダウン、ダイアログ）のフォーカス復元
pushFocusStack(triggerElement);
// ... モーダル/ドロップダウンを開く ...
popFocusStack(); // フォーカスはトリガー要素、または最も近い有効なフォールバックに戻る
```

## デプロイされたサイト

-   **Storybook:** [tatami-a11y-storybook.surge.sh](https://tatami-a11y-storybook.surge.sh)、a11yアドオン付きのインタラクティブなコンポーネント例
-   **ドキュメント:** [tatami-a11y-docs.surge.sh](https://tatami-a11y-docs.surge.sh)、TypeDocによって生成された完全なAPIドキュメント
-   **デモ:** [tatami-a11y-demo.surge.sh](https://tatami-a11y-demo.surge.sh)、すべてのコンポーネントのライブデモ
-   **Astro Islands デモ:** [tatami-a11y-astro.surge.sh](https://tatami-a11y-astro.surge.sh)、1つのページに4つのフレームワークアイランド（React、Vue、Svelte、プレーンJS）が`tatami()`を通じて連携し、ライブラリの独立してバンドルされたコピー間での共有プリミティブの調整を実演

## 含まれるもの

### フレームワークアダプター

| アダプター | 説明 |
| ------- | ----------- |
| `tatami()` | コンポーネントをインスタンス化し、公開メソッドを転送し、クリーンアップを処理するフレームワーク非依存のライフサイクルユーティリティ。Reactの`useEffect`、Vue/Nuxtの`onMounted`/`onUnmounted`、Svelteの`use:action`、またはプレーンな`<script>`タグから動作します。 |

### 共有プリミティブ

| プリミティブ | 説明 |
| --------- | ----------- |
| `announce()` | ARIAライブリージョンを介したスクリーンリーダーアナウンス。丁寧/断定的なルーティング、重複排除、適切な`aria-atomic`セマンティクスをサポートします。 |
| `checkReducedMotion()` / `onReducedMotionChange()` | 変更リスナー付きのシステムレベルのモーション削減検出。すべてのコンポーネントがこれを自動的に尊重します。 |
| `pushFocusStack()` / `popFocusStack()` | 古い参照フォールバックチェーンによるフォーカス復元。トリガー要素がなくなった場合、最も近いフォーカス可能な祖先に上がっていきます。 |
| `activateFocusTrap()` / `deactivateFocusTrap()` | 最初/最後の要素の境界検出と適切なTab/Shift+Tabサイクリングによるモーダルフォーカストラップ。 |
| `createRovingTabindex()` | リスト、グリッド、ツリー、タブリストの矢印キーナビゲーション。方向、列数、折り返し、カスタムキーハンドラをサポートします。 |
| `createSingleton()` / `registerCleanup()` | HMR対応のシングルトンファクトリ。コンポーネントはリスナーのリークやDOMノードの重複なしにホットリロードを乗り切ります。 |

### コンポーネント

| コンポーネント          | ARIAパターン                                | 主な機能                                                          |
| ------------------ | ------------------------------------------- | --------------------------------------------------------------------- |
| アコーディオン          | `aria-expanded` / `aria-controls`           | 矢印キーナビゲーション、Home/End、ライブリージョンアナウンスメント             |
| カルーセル           | `region` / `group` / `aria-roledescription` | 自動再生、モーション削減の尊重、スライドアナウンスメント                |
| コンボボックス           | combobox + listbox                          | タイプ・トゥ・フィルター、矢印キーナビゲーション、アクティブな子要素の管理    |
| コマンドパレット     | combobox + dialog-modal                     | Ctrl+Kグローバルホットキー、グループ化、フォーカストラップ、ライブリージョンカウント         |
| デートピッカー         | dialog + grid                               | 完全なキーボードナビゲーション、フォーカストラップ、月間ナビゲーション                |
| ダイアログ             | 非モーダルダイアログ                            | トラッピングなしのフォーカス管理、ユーザーはタブ移動可能                  |
| ディスクロージャー         | `aria-expanded` / `aria-controls`           | 適切なセマンティクスによるシンプルな表示/非表示                                |
| ドロップダウン           | menu + menuitem                             | フォーカストラップ、矢印キーナビゲーション、Escapeキーで閉じる                     |
| メニューボタン         | `aria-haspopup="menu"`                      | メニューボタンパターン、フォーカス管理                                 |
| モーダル              | dialog-modal                                | フォーカストラップ、背景オーバーレイ、Escapeキーで閉じる、フォーカス復元              |
| マルチセレクトリストボックス | listbox (複数選択)                      | Shift+クリック範囲選択、Ctrl+クリックトグル、タイプアヘッド                       |
| 並べ替え可能なリスト    | list + `aria-grabbed`                       | Ctrl+矢印で並べ替え、ドラッグ＆ドロップ、ライブアナウンスメント                 |
| タブ               | tablist + tab + tabpanel                    | 矢印キーナビゲーション、Home/End、自動タブパネル表示         |
| トースト              | ライブリージョン + `role="alert"`                | 自動消去、Alt+Tジャンプショートカット、スタック管理                   |
| ツールチップ            | `aria-describedby`                          | ホバー/フォーカストリガー、Escapeで閉じる、モーション削減の尊重           |
| ツリービュー           | tree + treeitem                             | 展開/折りたたみ、矢印キーナビゲーション、タイプアヘッド、単一/複数選択 |

## コンプライアンス

-   24のテストファイルにわたる**742の単体テスト**（vitest経由のjsdom）、すべてパス
-   **16のStorybook統合テスト**、各コンポーネントが実際のPlaywrightブラウザでレンダリングされ、インタラクティブな動作が検証済み
-   **組み込みのa11yチェック:** すべてのStorybookストーリーは、`@storybook/addon-a11y`を介してaxe-coreで自動的に監査され、テストUIにインラインで表示され、CIでブロックされます
-   **WCAG 2.2 AA:** すべてのStorybookストーリーで自動化されたaxe-coreスキャンにより、違反ゼロ、不完全ゼロが検出されました（自動スキャンはWCAG基準の有意なサブセットをカバーしており、完全な仕様ではありません。手動のスクリーンリーダーテストがこの上に続く自然な次の層です）
-   **WAI-ARIA:** すべてのコンポーネントは関連するAPGオーサリングプラクティスに従っています
-   **キーボードナビゲーション:** すべてのインタラクティブ要素はキーボードで完全に操作可能です
-   **スクリーンリーダー:** すべての状態変更はライブリージョンを介してアナウンスされます

## 開発

```bash
pnpm install
pnpm run build              # dist/ にビルド (ESM + CJS + 型定義)
pnpm run dev                # ウォッチモード
pnpm run test               # 742の単体テストを実行 (vitest, jsdom)
pnpm run test-storybook:run # 16のブラウザレベル統合テストを実行 (vitest + Playwright)
pnpm run storybook          # ポート6006でインタラクティブなコンポーネントエクスプローラー
pnpm run lint               # Rustベースのリンター (oxlint, ESLintより50～100倍高速)
pnpm run format             # Rustベースのフォーマッター (oxfmt, Prettierより35倍高速)
pnpm run doc                # APIドキュメントをビルド
```

### 開発ツールチェイン

| ツール | スタック | 速度向上 |
| --- | --- | --- |
| **Oxlint** | Rustベースのリンター (ESLint互換) | 50～100倍高速 |
| **Oxfmt** | Rustベースのフォーマッター | 35倍高速 |
| **Vitest 4.1.10** | 単体 + Storybook テストランナー | ネイティブブラウザモード |
| **Storybook 10.5.5** | コンポーネントテスト + a11yアドオン | Vitestと統合 |
| **Playwright** | 統合テストのためのブラウザ自動化 | 製品レベル |
| **Rolldown** _(オプション)_ | 将来対応のバンドラー (Viteコア) | ネイティブRustパフォーマンス |

合計：**758の自動テスト**（単体742 + Storybook 16）、CIは標準的なハードウェアで30秒未満で実行されます。

---

## デプロイ

```bash
pnpm run deploy:storybook   # StorybookをビルドしてSurgeにデプロイ
pnpm run deploy:docs        # APIドキュメントをビルドしてSurgeにデプロイ
pnpm run deploy:astro       # astro-demo/のマルチフレームワークデモをビルドしてSurgeにデプロイ
```

上記のいずれかのサイトをデプロイするには、ご自身の[Surge](https://surge.sh)アカウントと`.env`ファイル（`.env.example`をコピーしてご自身のサブドメインを記入）が必要です。デプロイスクリプトは、実際のサブドメインにサイレントにフォールバックするのではなく、明確なエラーを意図的にスローするため、このリポジトリをクローンしてデプロイスクリプトを実行しても、誤って他人のサイトにデプロイするリスクはなく、常に自分のサイトにデプロイすることになります。

## ブラウザ対応

モダンブラウザ（ES2020）をターゲットとしています：Chrome 80以降、Firefox 80以降、Safari 14.1以降、Edge 80以降。DOM APIが必要です。

**サーバーサイドレンダリングコンテキストでのインポートは安全です。** `src/components/`と`src/shared/`内のすべてのDOMアクセスは、関数またはメソッドの本体内にあります — `document`、`window`、`navigator`、またはその他のブラウザ専用のグローバルをモジュールスコープで読み取るものはなく、宣言以外のものがインポート時に実行されることはありません。パッケージをビルドし、いかなる種類のDOMシムもなしに生のNodeプロセスで各エントリーポイントをインポートすることで検証済みです。CJS（`.js`ファイル — このパッケージには`"type": "module"`フィールドがないため、`.js`は`require`ビルド、`.mjs`は`import`ビルドです（`exports`マップによる））：

```bash
node -e "require('./dist/index.js')"
node -e "require('./dist/adapters/tatami.js')"
```

両方ともエラーなく成功します。ESMビルドも同様に：

```bash
node --input-type=module -e "import('./dist/index.mjs')"
node --input-type=module -e "import('./dist/adapters/tatami.mjs')"
```

両方ともエラーなく成功します。READMEのコード例では`import`構文を使用していますが、これはコンシューマーがパッケージを使用することを想定しているためです — `exports`マップはこれらの`import`を`.mjs`ビルドに、`require()`を`.js`ビルドにルーティングします。

インポートは安全ですが、コンポーネントの**使用**には実際のDOMが必要です。検証済みのクライアント専用React、Vue、Svelte統合の場合とまったく同じように、標準的なライフサイクル・フックパターンが適用されます：React/Next.jsでは`useEffect`、Vue/Nuxtでは`onMounted`。

## ライセンス

MIT、LICENSEを参照。
