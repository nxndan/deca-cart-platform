/**
 * IndyDECA Store Register -> Google Sheets
 *
 * Paste this into Extensions > Apps Script of the Google Sheet
 * (see README.md for the full setup steps).
 *
 * Every order is written ONLY to the "Cart Inventory" tab:
 * one row per product, with its price, quantity and line total.
 * The first row of each order also holds the order's calculated
 * total and the final price charged.
 */

var PASSCODE = '3322';

// The ONLY tab the register writes to. It is created automatically on the
// first sale if it doesn't exist yet. No other tab is ever written to.
var INVENTORY_SHEET = 'Cart Inventory';

// The "Cart Inventory Tracker" Google Sheet (the ID from its URL:
// .../spreadsheets/d/<ID>/edit). To use a different sheet, paste its ID here.
// It must be a real Google Sheet, not an .xlsx file.
var SPREADSHEET_ID = '1RY50cO_A2IU7aPgKpQrXFTEhLBsFzCKalPRr_kHwwxk';

var HEADERS = ['Timestamp', 'Order ID', 'Product', 'Category', 'Unit Price', 'Qty',
               'Line Total', 'Order Total', 'Final Price Charged'];

/** Serves the register page when the Web App URL is opened. */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('IndyDECA Store Register')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover')
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
    var ss = SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
    var sheet = findSheet_(ss, INVENTORY_SHEET) || ss.insertSheet(INVENTORY_SHEET);
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS])
        .setFontWeight('bold').setBackground('#0b4ea2').setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }

    var now = new Date();
    var orderId = String(payload.orderId || Utilities.getUuid().slice(0, 8));
    var orderTotal = toMoney_(payload.subtotal);
    var finalPrice = toMoney_(payload.finalPrice);

    // One row per product. Order Total / Final Price Charged go on the
    // first row only, so summing those columns doesn't double count.
    var rows = items.map(function (it, i) {
      var price = toMoney_(it.price);
      var qty = Math.max(1, parseInt(it.qty, 10) || 1);
      return [now, orderId, String(it.name), String(it.category || ''), price, qty,
              toMoney_(price * qty), i === 0 ? orderTotal : '', i === 0 ? finalPrice : ''];
    });

    var start = sheet.getLastRow() + 1;
    sheet.getRange(start, 1, rows.length, HEADERS.length).setValues(rows);
    sheet.getRange(start, 1, rows.length, 1).setNumberFormat('m/d/yyyy h:mm am/pm');
    sheet.getRange(start, 5, rows.length, 1).setNumberFormat('$0.00');
    sheet.getRange(start, 7, rows.length, 3).setNumberFormat('$0.00');

    return { ok: true, orderId: orderId };
  } finally {
    lock.releaseLock();
  }
}

/** Finds a tab by name, ignoring capitalization and extra spaces. */
function findSheet_(ss, name) {
  var want = name.replace(/\s+/g, ' ').trim().toLowerCase();
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    if (sheets[i].getName().replace(/\s+/g, ' ').trim().toLowerCase() === want) return sheets[i];
  }
  return null;
}

function toMoney_(n) {
  var v = Number(n);
  return isNaN(v) ? 0 : Math.round(v * 100) / 100;
}
