# The Blamp™ — storefront

A single-page e-commerce store for **The Blamp™**, the bag lamp designed to keep you safe, inside and out.
The design mirrors the layout, typography and colour system of mulberry.com (fixed white header with centred
wordmark, serif headings, 14px sans body, black uppercase buttons, light-grey footer).

## Page order

1. **Cover** — full-bleed hero with headline, price and "Shop The Blamp" call to action.
2. **Product buy box** — breadcrumb, category-style header and toolbar, gallery with wishlist tile,
   price £29.99 (was £49.99), heart pack picker (1–5), *Add To Bag* and *Add 3 & Get 1 Free* buttons, details accordion.
3. **How to use** — three containers in a 1 / 2 / 2 layout: charge and clip on, tap once to light, see everything inside and out.
4. **FAQs** — accordion.
5. **Footer** — customer care and shop links, region selector, newsletter sign-up, and the brand story
   ("Founded in 2026, the Blamp was designed to keep to safe, inside and out."), legal links and wordmark.

## Store logic (`assets/js/store.js`)

- Cart drawer with quantity controls, persisted in `localStorage`.
- **Buy 2, get 1 free** is applied automatically: for every three units, one is free.
- Checkout overlay with address, delivery method (free standard / £4.95 next day), card validation
  (Luhn check, expiry, CVC) and an order confirmation with a reference number. No payment provider is
  wired up yet — orders are stored locally in the browser.
- Wishlist toggle, site search, mobile navigation, compact header on scroll.

## Images

Product photography lives in `assets/img/pdp/`. The originals you uploaded are kept in
`assets/img/pdp/source/`; the site serves 1200px JPEGs (`pdp-*.jpg`) and 240px thumbnails
(`pdp-*-thumb.jpg`) generated from them. To add or replace an image, drop the new file in `source/`,
regenerate the JPEGs (any image tool works, or Pillow: resize to 1200 and 240 square, quality 84/80) and
update the gallery list in `index.html`.

| File | Used for |
| --- | --- |
| `hero-glow.jpg` | Cover image |
| `pdp-01-front.jpg` | Main product image, cart thumbnail |
| `pdp-02-size.jpg` … `pdp-10-gift.jpg` | Product gallery |
| `pdp-07-usb-c.jpg`, `pdp-06-touch.jpg`, `pdp-04-in-bag.jpg` | How To Use steps 1–3 |

## Heart pack picker

The quantity control on the buy box is five heart-shaped buttons drawn in the shape of the product.
Hearts one to *n* light up when a pack of *n* is chosen; the others stay faded. The chosen number feeds the
hidden `#product-qty` input, the price on the *Add To Bag* button, and the buy-2-get-1-free hint.

## Running locally

It is a static site — open `index.html` directly, or serve it:

```sh
npx http-server -p 8080 .
```

## Going live

Point any static host (GitHub Pages, Netlify, Vercel, Cloudflare Pages) at the repository root. To take real
payments, connect the checkout form to Stripe Checkout, Shopify Buy Button or a similar provider in
`store.js` where the order is placed.
