# DECA Store Register

A passcode-protected register for the DECA store. Each product has its own button with its price. Every sale is saved to a Google Sheet.

- **Passcode:** `3322`
- Tap a product to add it to the order. Tap it again, or use **+ / −**, to change how many.
- The calculator at the bottom shows the running total. You can also type in the cash you received to see the change due.
- **Review & Submit** opens a confirmation screen with the calculated total. You can edit the **final price charged** there (for a discount, say) before submitting.

## What gets recorded

Two tabs are created in your Google Sheet automatically:

| Tab | One row per… | Columns |
|-----|--------------|---------|
| **Sales** | product in an order | Timestamp, Order ID, Item, Category, Unit Price, Qty, Line Total |
| **Orders** | order | Timestamp, Order ID, Total Items, Items, Calculated Total, Final Price Charged, Adjustment |

Each product goes on its own row in **Sales**, so you can count what sold. For example, add a pivot table on Item and sum Qty.

## Setup (about 5 minutes)

1. Create a new Google Sheet, for example "DECA Store Sales".
2. In the sheet, go to **Extensions → Apps Script**.
3. Replace everything in `Code.gs` with the contents of [`apps-script/Code.gs`](apps-script/Code.gs).
4. Click **+ → HTML** and name the file **`Index`** (capital I, no `.html`). Replace its contents with [`index.html`](index.html).
5. Click **Deploy → New deployment**, pick type **Web app**, and set:
   - **Execute as:** Me
   - **Who has access:** Anyone (or "Anyone in your school" if you use a school account)
6. Click **Deploy** and approve the permissions prompt.
7. Open the **Web app URL** (it ends in `/exec`). That's the register. Bookmark it, or add it to the home screen of the store iPad or Chromebook.

You can now test it: place an order and check that rows appear in the **Sales** and **Orders** tabs.

### Optional: host on GitHub Pages instead

If you'd rather use a github.io link:

1. Do steps 1–6 above to get the `/exec` URL.
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
