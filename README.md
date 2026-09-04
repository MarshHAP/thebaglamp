# The Blamp™ — Shopify theme

A Shopify theme for **The Blamp™**, the heart-shaped bag light designed to keep you safe, inside and out.
The design mirrors the layout, typography and colour system of mulberry.com (fixed white header with centred
wordmark, serif headings, 14px sans body, black uppercase buttons, light-grey footer).

This repository is laid out as a Shopify theme (`layout/`, `templates/`, `sections/`, `snippets/`, `config/`,
`locales/`, `assets/`), so it connects directly through **Online Store → Themes → Add theme → Connect from GitHub**.
The original static HTML version of the store is kept in `static-site/` for reference and is ignored by Shopify.

## Connecting to Shopify

1. In Shopify Admin go to **Online Store → Themes → Add theme → Connect from GitHub**, pick this repository and
   the `claude/great-clarke-ld3wmx` branch (or `main` once merged). Shopify pulls the theme and keeps it in sync
   with every push.
2. **The product and its packs**: the product *The Blamp™* has a *Pack* option with three variants and their own
   prices: **1 Blamp £19.99**, **2 Blamps £29.99** (tagged *Most popular*) and **3 Blamps £34.99** (tagged
   *Best value*). For the September Sale each variant's compare-at price is 20% higher (£23.99, £35.99, £41.99),
   which the theme shows struck through. Edit prices under Products in Admin; the hearts on the buy box pick a
   pack and show its price.
   The tags on the hearts live in *Theme settings → Offer → Pack tags* (one line per heart).
3. **Quantity mode**: if a product has no packs (a single variant), the hearts choose a quantity instead. Tick
   *Describe a buy X get Y offer* in *Theme settings → Offer* only if you have created a matching automatic
   discount under Discounts.
4. **Menus** (optional): the header uses the *Main menu* and the footer columns use the *Footer* menu. With no
   menu set, the header falls back to Shop / How To Use / FAQs / Our Story anchors on the home page.
5. **Policies**: Settings → Policies. Cookie, terms and privacy links in the footer appear automatically once
   policies are published.
6. Customise copy, images and the number of hearts from **Customize** (the theme editor). Every section on the
   home page has settings, and the how-to and lifestyle rows accept your own images.

Payments, delivery rates, taxes and checkout are all handled by Shopify.

## Page order

1. **Cover** — full-bleed hero with headline, price and "Shop The Blamp" call to action.
2. **Product buy box** — breadcrumb, category-style header and toolbar, gallery with wishlist tile,
   pack prices (1 for £19.99, 2 for £29.99, 3 for £34.99, with September Sale was-prices 20% higher struck
   through), heart pack picker with *Most popular* and *Best value* tags, pack table, *Add To Bag*, details accordion.
3. **How to use** — three containers in a 1 / 2 / 2 layout: charge and clip on, tap once to light, see everything inside and out.
4. **FAQs** — accordion.
5. **Footer** — customer care and shop links, region selector, newsletter sign-up, and the brand story
   ("Founded in 2026, the Blamp was designed to keep to safe, inside and out."), legal links and wordmark.

## Store logic (`assets/store.js`)

- Cart drawer driven by Shopify's Cart API (`/cart/add.js`, `/cart/change.js`, `/cart.js`), so the bag,
  discounts and totals are always Shopify's own numbers.
- In pack mode each heart is a product variant: tapping it swaps the variant, the price and the
  *Add To Bag* total. In quantity mode (single-variant products) the hearts set the quantity.
- Heart pack picker, wishlist toggle (browser-local), site search, mobile navigation, compact header on scroll.
- Checkout is Shopify checkout.

## Images

Theme images live flat in `assets/` (Shopify does not allow sub-folders there). The product gallery itself
comes from the product's images in Shopify Admin; the files in `assets/` are used for the cover, the how-to
steps and the lifestyle row until you pick your own in the theme editor. The original uploads are kept in
`static-site/assets/img/pdp/source/`.

| File | Used for |
| --- | --- |
| `hero-glow.jpg` | Cover image |
| `pdp-01-front.jpg` | Main product image, cart thumbnail |
| `pdp-02-size.jpg` … `pdp-10-gift.jpg` | Product gallery |
| `pdp-07-usb-c.jpg`, `pdp-06-touch.jpg`, `lifestyle-02.jpg` | How To Use steps 1–3 |
| `lifestyle-01.jpg` … `lifestyle-03.jpg` | Gallery and the "Inside every bag" row under the buy box |

## Heart pack picker

The pack control on the buy box is three heart-shaped buttons drawn in the shape of the product, one per pack
variant, each showing its price and optional tag. Hearts one to *n* light up when pack *n* is chosen; the others
stay faded. The chosen heart sets the variant sent to the cart and updates the price line and the *Add To Bag* total.

## Developing locally

```sh
npm i -g @shopify/cli
shopify theme dev --store your-store.myshopify.com   # live preview against your store
shopify theme check                                   # lint the theme
```

The static preview in `static-site/` can still be opened directly in a browser, but it is no longer the
deployed store.
