# ORBITA API Worker

共有予約枠、鑑定者の「占い中」表示、Stripe決済、OpenAI深層鑑定を担当するCloudflare Workerです。

## 予約機能

1. `npm install`
2. `npx wrangler d1 create orbita-bookings`
3. 表示されたD1の `database_id` を `wrangler.toml` に設定
4. `npx wrangler d1 execute orbita-bookings --file=schema.sql --remote`
5. `npx wrangler deploy`
6. ルートの `config.js` にWorker URLを設定し、`bookingMode: true` に変更

予約サーバーへ保存するのは、鑑定者ID・予約時刻・匿名予約ID・匿名端末トークンのハッシュだけです。相談内容、生年月日、鑑定結果は予約DBへ保存しません。

## 有料深層鑑定を使う場合

1. `npx wrangler secret put STRIPE_SECRET_KEY`
2. `npx wrangler secret put STRIPE_PRICE_ID`
3. `npx wrangler secret put OPENAI_API_KEY`
4. `wrangler.toml` の `OPENAI_MODEL`、`SITE_URL`、`ALLOWED_ORIGINS` を設定
5. 法定表示を完成させた後、ルートの `config.js` で `paidMode` と `operatorReady` を `true` に変更

秘密鍵はHTML、`config.js`、GitHubリポジトリへ記載しないでください。
