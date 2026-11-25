# IndyDECA Store Register

A passcode-protected register for the IndyDECA store. Each product has its own button with its price. Every sale is saved to the **Cart Inventory** tab of the **Cart Inventory Tracker** Google Sheet.

- **Passcode:** `3322`
- Tap a product to add it to the order. Tap it again, or use **+ / −**, to change how many.
- The bottom of the order shows the item count and total, with **Clear** and **Review & Submit** buttons.
- **Review & Submit** opens a confirmation screen with the calculated total. You can edit the **final price charged** there (for a discount, say) before submitting.
- Works on phones, tablets (portrait and landscape) and laptops. On phones and portrait tablets, tap **View order** at the bottom to open the order.

## What gets recorded

Orders are written **only** to the **Cart Inventory** tab. If that tab doesn't exist yet, it's created on the first sale. No other tab is touched.

The first order adds this header row if the tab is empty. After that, each order adds one row per product:

| Timestamp | Order ID | Product | Category | Unit Price | Qty | Line Total | Order Total | Final Price Charged |
|-----------|----------|---------|----------|------------|-----|------------|-------------|---------------------|

**Order Total** and **Final Price Charged** are filled in on the first row of each order only. That way, summing those columns gives the real day's total without double counting. To count what sold, add a pivot table on **Product** and sum **Qty**.

## Setup

### 1. Convert the spreadsheet to a Google Sheet (required)

The DECA spreadsheet is currently an Excel file (`.xlsx`) stored in Drive. Apps Script **cannot write to `.xlsx` files**, so it must be converted first:

1. Open the spreadsheet in Google Drive.
2. Click **File → Save as Google Sheets**. This makes a new Google Sheets copy with a new link.
3. Use that new Google Sheet from now on. Make sure the person deploying the script (step 2) has **edit** access to it.

### 2. Attach the script

1. In the converted Google Sheet, go to **Extensions → Apps Script**.
2. Replace everything in `Code.gs` with the contents of [`apps-script/Code.gs`](apps-script/Code.gs).
3. Click **+ → HTML** and name the file **`Index`** (capital I, no `.html`). Replace its contents with [`index.html`](index.html).
4. Click **Deploy → New deployment**, pick type **Web app**, and set:
   - **Execute as:** Me
   - **Who has access:** Anyone (or "Anyone in your school" if you use a school account)
5. Click **Deploy** and approve the permissions prompt.
6. Open the **Web app URL** (it ends in `/exec`). That's the register. Bookmark it, or add it to the home screen of the store iPad or phone.

Test it: place an order and check that rows appear in the **Cart Inventory** tab.

> `SPREADSHEET_ID` at the top of `Code.gs` is already set to the Cart Inventory Tracker sheet. To log to a different Google Sheet, replace it with the ID from that sheet's URL (`.../spreadsheets/d/<ID>/edit`).

### Optional: host on GitHub Pages instead

1. Do the steps above to get the `/exec` URL.
2. In `index.html`, set `const SCRIPT_URL = "https://script.google.com/macros/s/…/exec";`
3. Enable GitHub Pages for this repo (Settings → Pages → deploy from branch).

## Editing products or prices

Products are listed in the `PRODUCTS` array near the bottom of `index.html`. Each one looks like this:

```js
{ cat: "Drinks", name: "Dr. Pepper Zero", price: 2.50 },
```

After editing, paste the updated file into the Apps Script `Index` file again. Then go to **Deploy → Manage deployments → Edit → Version: New version → Deploy**. The URL stays the same.

To change the passcode, update `PASSCODE` in **both** `index.html` and `Code.gs`.

> Note: the passcode keeps casual users out. It is not bank-grade security, because it's stored in the page code. The sheet also rejects any submission that doesn't carry the passcode.
