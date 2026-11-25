/**
 * DECA Store Register -> Google Sheets
 *
 * Paste this into Extensions > Apps Script of your Google Sheet
 * (see README.md for the full setup steps).
 *
 * It writes two tabs:
 *   "Sales"  - one row per product in every order (easy to count what sold)
 *   "Orders" - one row per order with the calculated and final price
 */

var PASSCODE = '3322';
var SALES_SHEET = 'Sales';
var ORDERS_SHEET = 'Orders';

var SALES_HEADERS = ['Timestamp', 'Order ID', 'Item', 'Category', 'Unit Price', 'Qty', 'Line Total'];
var ORDERS_HEADERS = ['Timestamp', 'Order ID', 'Total Items', 'Items', 'Calculated Total', 'Final Price Charged', 'Adjustment'];

/** Serves the register page when the Web App URL is opened. */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('DECA Store Register')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** Used when the page is hosted elsewhere (e.g. GitHub Pages) and POSTs here. */
function doPost(e) {
  var result;
  try {
    var payload = JSON.parse(e.postData.contents);
    result = recordOrder(payload);
  } catch (err) {
    result = { ok: false, error: String(err && err.message ? err.message : err) };
  }
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Called by the page (google.script.run) or by doPost. */
function recordOrder(payload) {
  if (!payload || String(payload.password) !== PASSCODE) {
    return { ok: false, error: 'Wrong passcode' };
  }
  var items = payload.items || [];
  if (!items.length) return { ok: false, error: 'Order has no items' };

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sales = getSheet_(ss, SALES_SHEET, SALES_HEADERS);
    var orders = getSheet_(ss, ORDERS_SHEET, ORDERS_HEADERS);

    var now = new Date();
    var orderId = String(payload.orderId || Utilities.getUuid().slice(0, 8));
    var subtotal = toMoney_(payload.subtotal);
    var finalPrice = toMoney_(payload.finalPrice);

    // One row per product
    var rows = items.map(function (it) {
      var price = toMoney_(it.price);
      var qty = Math.max(1, parseInt(it.qty, 10) || 1);
      return [now, orderId, String(it.name), String(it.category || ''), price, qty, toMoney_(price * qty)];
    });
    var start = sales.getLastRow() + 1;
    sales.getRange(start, 1, rows.length, SALES_HEADERS.length).setValues(rows);
    sales.getRange(start, 5, rows.length, 1).setNumberFormat('$0.00');
    sales.getRange(start, 7, rows.length, 1).setNumberFormat('$0.00');

    // One summary row per order
    var totalQty = rows.reduce(function (s, r) { return s + r[5]; }, 0);
    var summary = items.map(function (it) { return it.qty + 'x ' + it.name; }).join(', ');
    orders.appendRow([now, orderId, totalQty, summary, subtotal, finalPrice, toMoney_(finalPrice - subtotal)]);
    var r = orders.getLastRow();
    orders.getRange(r, 5, 1, 3).setNumberFormat('$0.00');

    return { ok: true, orderId: orderId };
  } finally {
    lock.releaseLock();
  }
}

function getSheet_(ss, name, headers) {
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0) {
    sh.getRange(1, 1, 1, headers.length).setValues([headers])
      .setFontWeight('bold').setBackground('#0b4ea2').setFontColor('#ffffff');
    sh.setFrozenRows(1);
  }
  return sh;
}

function toMoney_(n) {
  var v = Number(n);
  return isNaN(v) ? 0 : Math.round(v * 100) / 100;
}
