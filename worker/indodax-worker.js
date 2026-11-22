/**
 * BEN AI Indodax connector — READ-ONLY bootstrap.
 * No order, cancel, or withdrawal routes exist in this worker.
 * Required Cloudflare Worker secrets:
 *   INDODAX_API_KEY, INDODAX_API_SECRET, BEN_DASH_TOKEN
 */
const ORIGIN = "https://3pitribahgiajaya.github.io";

function json(data, status = 200, origin = ORIGIN) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "Authorization, Content-Type",
      "vary": "Origin"
    }
  });
}
function hex(buffer) {
  return [...new Uint8Array(buffer)].map(b => b.toString(16).padStart(2, "0")).join("");
}
async function sign(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  return hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message)));
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    if (origin && origin !== ORIGIN) return json({ ok: false, error: "Origin tidak diizinkan" }, 403, ORIGIN);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: {
      "access-control-allow-origin": ORIGIN,
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "Authorization, Content-Type",
      "access-control-max-age": "86400",
      "vary": "Origin"
    }});
    if (url.pathname === "/health" && request.method === "GET") {
      return json({ ok: true, service: "BEN AI Indodax connector", mode: "READ_ONLY", liveOrders: false });
    }
    if (url.pathname !== "/api/account" || request.method !== "POST") {
      return json({ ok: false, error: "Endpoint tidak tersedia" }, 404);
    }
    if (!env.BEN_DASH_TOKEN || !env.INDODAX_API_KEY || !env.INDODAX_API_SECRET) {
      return json({ ok: false, error: "Backend belum dikonfigurasi lengkap" }, 503);
    }
    const auth = request.headers.get("Authorization") || "";
    if (auth !== `Bearer ${env.BEN_DASH_TOKEN}`) return json({ ok: false, error: "Tidak diotorisasi" }, 401);
    try {
      const params = new URLSearchParams();
      params.set("omitZeroBalances", "true");
      params.set("timestamp", String(Date.now()));
      params.set("recvWindow", "5000");
      const query = params.toString();
      const signature = await sign(env.INDODAX_API_SECRET, query);
      const upstream = await fetch(`https://api.indodax.com/api/v2/account?${query}`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "X-APIKEY": env.INDODAX_API_KEY,
          "Sign": signature
        }
      });
      const body = await upstream.json().catch(() => ({}));
      if (!upstream.ok || body.code) {
        return json({ ok: false, error: "Indodax menolak permintaan akun", upstreamStatus: upstream.status, code: body.code ?? null, message: body.msg ?? null }, 502);
      }
      // Withdrawal permissions must remain disabled.
      if (body.canWithdraw === true || body.canWithdrawFiat === true) {
        return json({ ok: false, error: "Proteksi menghentikan koneksi: permission withdrawal terdeteksi aktif. Revoke API dan buat ulang tanpa withdrawal." }, 423);
      }
      return json({
        ok: true,
        mode: "READ_ONLY",
        liveOrders: false,
        permissions: {
          canTrade: body.canTrade === true,
          canWithdraw: body.canWithdraw === true,
          canWithdrawFiat: body.canWithdrawFiat === true
        },
        balances: Array.isArray(body.balances) ? body.balances : [],
        checkedAt: new Date().toISOString()
      });
    } catch (_) {
      return json({ ok: false, error: "Koneksi ke Indodax gagal. Detail rahasia disembunyikan." }, 502);
    }
  }
};
