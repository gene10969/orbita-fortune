# 会話生成機能の有効化

フロント画面は `agentChatMode: false` のままでも、固定された会話案内で動作します。
会話ごとの返答を自動生成する場合のみ、Cloudflare Workerを設定します。

## 必要な設定

WorkerのSecret:

- `OPENAI_API_KEY`
- `OPENAI_MODEL`

通常の環境変数:

- `ALLOWED_ORIGINS=https://gene10969.github.io`
- `SITE_URL=https://gene10969.github.io/orbita-fortune`

## フロント側

`config.js` を次のように変更します。

- `apiBaseUrl`: 公開したWorkerのURL
- `agentChatMode`: `true`

APIキーを `config.js` やブラウザ側のJavaScriptへ記載しないでください。
