# ORBITA｜選択の星図

顔出し・声出し・会員登録なしで利用できる、二択型の自動鑑定PWAです。無料鑑定はブラウザ内だけで完結し、API費用なしで動作します。

## 完成済みの機能

- スマートフォン／PC対応の黒×ゴールドUI
- 呼び名、生年月日、相談、二択、期間、迷いの強さから自動鑑定
- 数の基調、独自24枚の象徴札、二択共鳴度、可逆性指数、輪郭指数
- 7日間の小さな行動実験
- 同じ入力・同じ鑑定日で同じ結果を再現する鑑定ID
- 危険相談の停止、医療・法律・金融相談への注意表示
- 任意の端末内履歴、削除、共有、JSON保存、印刷／PDF保存
- PWAインストールとオフラインキャッシュ
- プライバシーポリシー、利用規約、無料提供時の特商法ページ
- Stripe決済後だけOpenAI APIを呼ぶ深層鑑定Worker
- GitHub Pages自動公開ワークフロー
- 自動テストと静的検証

## すぐ公開する方法

1. このフォルダの中身を新しいGitHubリポジトリ直下へアップロードします。
2. GitHubの `Settings` → `Pages` → `Build and deployment` を `GitHub Actions` にします。
3. `main` ブランチへ反映すると、テスト合格後に公開されます。

無料鑑定だけなら、設定変更は不要です。

## 有料の深層鑑定を有効にする前に

次の条件がすべて揃うまで `config.js` の `paidMode` と `operatorReady` は `false` のままにしてください。

- Stripeアカウントと商品価格ID
- OpenAI APIキーと利用モデル名
- Cloudflare Workerの公開
- 正式な運営者情報、連絡先、返金・再提供条件
- privacy.html、terms.html、commerce.htmlの実運営内容への更新
- テスト決済と本番決済の確認

Workerの設定方法は `worker/README.md` にあります。

## セキュリティ

- APIキーやStripe秘密鍵はHTML、JavaScript、GitHubへ置かず、Cloudflare WorkerのSecretとして保存します。
- 無料鑑定は外部送信しません。
- 有料鑑定はStripeの支払い済みセッションと鑑定内容のハッシュが一致した場合だけAI処理します。
- WebAuthn／生体認証は、この公開サイトの無料利用者には不要です。運営管理画面を追加する場合は、端末だけで擬似認証せず、サーバー側のチャレンジ検証と資格情報保存を備えたWebAuthnを別途実装してください。

## 検証

```bash
npm test
npm run validate
npm run check
```

## 主な編集箇所

- サイト名・価格表示・API URL: `config.js`
- 鑑定ロジック・象徴札: `engine.js`
- 画面と文章: `index.html`
- デザイン: `styles.css`
- 有料API: `worker/src/index.js`
