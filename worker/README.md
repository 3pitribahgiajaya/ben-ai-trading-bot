# BEN AI Indodax Worker (READ-ONLY)

This Worker is a secure bootstrap for testing Indodax Trade API V2 account access.
It intentionally has **no create-order, cancel-order, or withdrawal endpoint**. It cannot place live trades.

## Deploy to Cloudflare Workers

1. Create a Cloudflare account and open Workers & Pages.
2. Create a Worker named `ben-ai-indodax`.
3. Replace its starter code with `worker/indodax-worker.js` from this repository, or deploy with Wrangler from this folder.
4. In Worker > Settings > Variables and Secrets, add these as **encrypted secrets**, not plain text variables:
   - `INDODAX_API_KEY` — the newly created Indodax V2 API key
   - `INDODAX_API_SECRET` — its secret key
   - `BEN_DASH_TOKEN` — a long random token generated privately by you
5. Never put these values in GitHub, GitHub Pages, source code, screenshots, or chat.
6. Deploy. Test `GET https://YOUR-WORKER.workers.dev/health`. It should report `mode: READ_ONLY` and `liveOrders: false`.

## Account connection test

The account endpoint is `POST https://YOUR-WORKER.workers.dev/api/account` with header:

```
Authorization: Bearer YOUR_BEN_DASH_TOKEN
```

No request body is needed. The response returns account permissions and balances. The Worker refuses the connection if coin or IDR withdrawal permission is enabled.

You can test from a private terminal with:

```bash
curl -X POST "https://YOUR-WORKER.workers.dev/api/account" \
  -H "Authorization: Bearer YOUR_BEN_DASH_TOKEN"
```

Do not run this command in a shared terminal or publish its output if it contains balances.

## Security and limitations

- Indodax API credentials stay in Cloudflare Worker encrypted secrets.
- Only the GitHub Pages origin for this project is allowed by CORS.
- A separate dashboard bearer token is required for the account endpoint.
- The worker returns only account permission flags and balances.
- It does not implement order placement. This is deliberate until read-only authentication is proven, the account permissions are checked, and trading controls are separately reviewed.
- Do not enable withdrawal permission. Indodax describes View Only as account data access, Spot Trading as create/cancel orders, and Withdrawal as IDR/crypto withdrawals.
- This worker has not been deployed to Cloudflare from this repository. Creating the file in GitHub does not deploy it.

## Official references

- INDODAX API integration and key permissions: https://help.indodax.com/hc/id/articles/5315217255833-Bagaimana-Cara-Mengintegrasikan-API-INDODAX
- INDODAX Trade API V2 technical documentation: https://github.com/btcid/indodax-official-api-docs
