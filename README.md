# BEN AI Trading Robot

Dashboard crypto mobile-friendly untuk BTC/IDR dan ETH/IDR.

## Modul
- `index.html`: dashboard harga dan indikator (monitoring saja).
- `paper-trading.html`: simulasi paper trading BTC/IDR + ETH/IDR dengan modal virtual Rp50.000.
- Data harga memakai API publik CoinGecko; refresh tiap 60 detik.

## Aturan paper trading awal
- Modal virtual: Rp50.000.
- Maksimal nilai satu posisi: Rp25.000.
- Maksimal satu posisi terbuka dan satu entry per hari.
- Entry virtual: EMA 9 > EMA 21 dan RSI 14 antara 52–68.
- Take profit virtual: +2% dari harga entry.
- Stop loss virtual: −1% dari harga entry.
- Batas rugi harian: Rp1.250 (2,5% dari modal awal).
- Tidak ada order sungguhan, koneksi private API, API key, atau secret yang diminta/disimpan.
- Catatan: simulasi sederhana, tidak memasukkan biaya, spread, slippage, partial fills, dan latensi; bukan bukti strategi akan untung.

## Cara membuka
1. Aktifkan GitHub Pages pada Settings > Pages.
2. Pilih Deploy from a branch, branch `main`, folder `/ (root)`.
3. Dashboard: https://3pitribahgiajaya.github.io/ben-ai-trading-bot/
4. Paper trading: https://3pitribahgiajaya.github.io/ben-ai-trading-bot/paper-trading.html

## Penting sebelum live trading
Indodax Trade API V2 memisahkan permission View/Reading, Spot Trading, dan IDR & Crypto Withdrawal. Jika suatu saat integrasi live dibangun, gunakan hanya View + Spot Trading dan jangan aktifkan Withdrawal. Simpan API credentials hanya di backend/server secret manager, tidak di browser, GitHub Pages, source code, atau chat.

Minimum order BTC/IDR yang ditampilkan di data pasangan publik Indodax adalah Rp50.000. Modal Rp50.000 tidak menyisakan buffer yang memadai untuk biaya dan risiko, sehingga BEN AI sengaja tetap dalam paper mode dan tidak mengirim order live. Verifikasi aturan pasangan dan biaya terbaru di Indodax sebelum melakukan transaksi.

## Risiko
Sinyal teknikal tidak menjamin keuntungan. Harga crypto volatil; simulasi bukan nasihat investasi dan bukan pengganti pengujian forward dengan biaya transaksi realistis.
