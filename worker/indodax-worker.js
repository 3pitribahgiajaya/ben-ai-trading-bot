/**
 * BEN AI Indodax Worker — SAFE TEST BUILD
 * Public market data + authenticated account read only.
 * Deliberately contains NO order, cancel, or withdrawal implementation.
 *
 * Cloudflare encrypted secrets:
 * INDODAX_API_KEY
 * INDODAX_API_SECRET
 * BEN_DASH_TOKEN
 */
const ALLOWED_ORIGIN = "https://3pitribahgiajaya.github.io";
const BASE = "https://api.indodax.com";
const PUBLIC_BASE = "https://indodax.com";

function reply(data, status = 200, origin = ALLOWED_ORIGIN) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "Authorization, Content-Type",
      "vary": "Origin",
      "x-content-type-options": "nosniff"
    }
  });
}
function hex(buffer) {
  return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, "0")).join("");
}
async function hmacSha256(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  return hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message)));
}
async function readAccount(env) {
  const params = new URLSearchParams();
  params.set("omitZeroBalances", "true");
  params.set("timestamp", String(Date.now()));
  params.set("recvWindow", "5000");
  const query = params.toString();
  const signature = await hmacSha256(env.INDODAX_API_SECRET, query);
  const response = await fetch(`${BASE}/api/v2/account?${query}`, {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "X-APIKEY": env.INDODAX_API_KEY,
      "Sign": signature
    }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.code !== undefined) {
    return { ok: false, status: response.status, code: body.code ?? null };
  }
  // Fail closed unless all permissions are explicitly present and safe.
  if (body.canTrade !== true ||
      body.canWithdraw !== false ||
      body.canWithdrawFiat !== false ||
      !Array.isArray(body.balances)) {
    return { ok: false, unsafePermissions: true };
  }
  return {
    ok: true,
    permissions: {
      canTrade: body.canTrade,
      canWithdraw: body.canWithdraw,
      canWithdrawFiat: body.canWithdrawFiat
    },
    accountType: body.accountType ?? null,
    balances: body.balances.map(item => ({
      asset: String(item.asset ?? ""),
      free: String(item.free ?? "0"),
      locked: String(item.locked ?? "0")
    })),
    checkedAt: new Date().toISOString()
  };
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    if (origin && origin !== ALLOWED_ORIGIN) {
      return reply({ ok: false, error: "Origin tidak diizinkan" }, 403);
    }
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: {
        "access-control-allow-origin": ALLOWED_ORIGIN,
        "access-control-allow-methods": "GET, POST, OPTIONS",
        "access-control-allow-headers": "Authorization, Content-Type",
        "access-control-max-age": "86400",
        "vary": "Origin"
      }});
    }
    if (url.pathname === "/health" && request.method === "GET") {
      return reply({
        ok: true, service: "BEN AI Indodax connector",
        mode: "PAPER_AND_READ_ONLY", liveOrders: false,
        pairs: ["BTCIDR", "ETHIDR"],
        risk: { capitalIdr: 50000, takeProfitPct: 2, stopLossPct: 1,
          dailyLossLimitIdr: 1250, maxOpenPositions: 1, maxEntriesPerDay: 1 }
      });
    }
    if (url.pathname === "/api/market" && request.method === "GET") {
      try {
        const [btcRes, ethRes] = await Promise.all([
          fetch(`${PUBLIC_BASE}/api/ticker/btcidr`, { headers: { "Accept": "application/json" } }),
          fetch(`${PUBLIC_BASE}/api/ticker/ethidr`, { headers: { "Accept": "application/json" } })
        ]);
        if (!btcRes.ok || !ethRes.ok) return reply({ ok: false, error: "Harga pasar Indodax tidak tersedia" }, 502);
        const [btc, eth] = await Promise.all([btcRes.json(), ethRes.json()]);
        return reply({
          ok: true, source: "INDODAX_PUBLIC_API",
          prices: {
            BTCIDR: Number(btc.ticker?.last),
            ETHIDR: Number(eth.ticker?.last)
          },
          checkedAt: new Date().toISOString()
        });
      } catch (_) {
        return reply({ ok: false, error: "Gagal mengambil harga publik Indodax" }, 502);
      }
    }
    if (url.pathname === "/api/account" && request.method === "POST") {
      if (!env.BEN_DASH_TOKEN || !env.INDODAX_API_KEY || !env.INDODAX_API_SECRET) {
        return reply({ ok: false, error: "Backend belum dikonfigurasi lengkap" }, 503);
      }
      if (request.headers.get("Authorization") !== `Bearer ${env.BEN_DASH_TOKEN}`) {
        return reply({ ok: false, error: "Tidak diotorisasi" }, 401);
      }
      try {
        const result = await readAccount(env);
        if (result.unsafePermissions) {
          return reply({ ok: false, error: "Proteksi aktif: izin trading atau status withdrawal tidak sesuai. Tidak ada transaksi yang dijalankan." }, 423);
        }
        if (!result.ok) return reply({ ok: false, error: "Indodax menolak autentikasi akun", upstreamStatus: result.status, code: result.code }, 502);
        return reply({ ...result, mode: "READ_ONLY", liveOrders: false });
      } catch (_) {
        return reply({ ok: false, error: "Koneksi Indodax gagal. Detail rahasia disembunyikan." }, 502);
      }
    }
    return reply({ ok: false, error: "Endpoint tidak tersedia" }, 404);
  }
};
