/**
 * AGRACANTIKA — PROXY ONGKIR (Google Apps Script)
 * ---------------------------------------------------------------
 * Tugasnya cuma satu: menyembunyikan API key Komerce/RajaOngkir dari
 * browser. Backend utama (auth, produk, order) sekarang di Firebase —
 * GAS di sini TIDAK menyimpan data apa pun, murni proxy tanpa status.
 *
 * Kenapa tidak pakai Firebase Cloud Functions saja untuk ini?
 * Cloud Functions versi 2 butuh paket Blaze (billing aktif) begitu ia
 * melakukan panggilan keluar (outbound fetch) ke API pihak ketiga,
 * meski penggunaannya tetap di kuota gratis. GAS Web App gratis penuh
 * dan pas untuk proxy tanpa status seperti ini.
 *
 * Deploy:
 *  1. script.google.com/home > New project > tempel kode ini
 *  2. Project Settings > Script Properties > tambah KOMERCE_KEY = (API key kamu)
 *  3. Deploy > New deployment > Web app (Execute as: Me, Access: Anyone)
 *  4. Salin URL .../exec, panggil dari index.html via fetch(), contoh:
 *     fetch(PROXY_URL + '?origin=501&destination=114&weight=1000&courier=jne')
 * ---------------------------------------------------------------
 */
function doGet(e) {
  try {
    const key = PropertiesService.getScriptProperties().getProperty('KOMERCE_KEY');
    if (!key) throw new Error('KOMERCE_KEY belum diisi di Script Properties');

    const url = 'https://rajaongkir.komerce.id/api/v1/calculate/domestic-cost';
    const payload = {
      origin: e.parameter.origin,
      destination: e.parameter.destination,
      weight: e.parameter.weight,
      courier: e.parameter.courier || 'jne'
    };

    const res = UrlFetchApp.fetch(url, {
      method: 'post',
      headers: { key: key },
      contentType: 'application/x-www-form-urlencoded',
      payload: payload,
      muteHttpExceptions: true
    });

    return ContentService.createTextOutput(res.getContentText())
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
