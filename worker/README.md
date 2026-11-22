# BEN AI Indodax Worker — Safe Test Build

This Cloudflare Worker exposes:
- `GET /health`: service status and fixed paper-trading risk configuration.
- `GET /api/market`: public BTCIDR and ETHIDR prices from Indodax.
- `POST /api/account`: authenticated, signed account read only.

**There are intentionally no order-create, order-cancel, or withdrawal routes. Live trading is disabled.**

## Cloudflare encrypted secrets

Add these in Worker > Settings > Variables and Secrets as encrypted Secrets:
- `INDODAX_API_KEY`
- `INDODAX_API_SECRET`
- `BEN_DASH_TOKEN`

Never put these values in GitHub, source code, Pages, browser storage, screenshots, or chat. Do not enable IDR or crypto withdrawal permission on the Indodax key.

## Deployment

Worker name: `ben-ai-indodax`

Deploy the contents of `indodax-worker.js` from Cloudflare's editor, then test:
- `GET https://YOUR-WORKER.workers.dev/health`
- `GET https://YOUR-WORKER.workers.dev/api/market`

For account read-only test, send a POST to `/api/account` with:
`Authorization: Bearer YOUR_BEN_DASH_TOKEN`

Do not paste the token into a public website or shared terminal. The response intentionally omits account UID and only returns asset balances and permissions.

## Fixed test risk parameters

- Paper capital ceiling: IDR 50,000
- Symbols: BTCIDR and ETHIDR
- Take profit: +2% from simulated entry
- Stop loss: -1% from simulated entry
- Daily simulated loss stop: IDR 1,250 (2.5%)
- Maximum simultaneous positions: 1
- Maximum new entries: 1 per calendar day
- Withdrawal permission: OFF
- Live orders: DISABLED

## Important minimum-order constraint

The user interface previously displayed a BTCIDR minimum transaction value of IDR 50,000. With a capital ceiling of IDR 50,000, the bot must not split funds into two IDR 25,000 orders or assume either market meets minimum size. Before any future live-order implementation, verify current minimum notional, fees, available balance, and quantity/price increments for each pair. If the amount is insufficient after fees, block the order.

## Safety design

- Account authentication uses the official Indodax Trade API V2 signed endpoint with HMAC-SHA256.
- The Worker fails closed unless `canTrade === true`, `canWithdraw === false`, and `canWithdrawFiat === false` are explicitly returned.
- CORS permits only the configured GitHub Pages origin.
- The dashboard bearer token is required for account access.
- The Worker has no withdrawal or live-order code.
- No profit is guaranteed. TP/SL do not eliminate gaps, slippage, execution delays, or fees.

## Official documentation

- [Indodax Trade API V2 private endpoints](https://github.com/btcid/indodax-official-api-docs/blob/master/INDODAX-TradeAPI-2-Private.md)
- [Indodax API key permissions](https://help.indodax.com/hc/id/articles/5315217255833-Bagaimana-Cara-Mengintegrasikan-API-INDODAX)
