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
2. **Add the product**: Products → Add product. Title *The Blamp™*, price **29.99**, compare-at price **49.99**,
   upload the photos from `assets/` (pdp-01-front.jpg first). The home page picks up your first product
   automatically; you can also choose it explicitly in the theme editor under *Product buy box → Product*.
3. **Set up buy 2, get 1 free**: Discounts → Create discount → *Buy X get Y* → method *Automatic discount*.
   Customer buys quantity **2** of The Blamp, gets quantity **1** of The Blamp at **100% off**, and leave
   "Set a maximum number of uses per order" unticked so 6 Blamps means 2 free. Shopify applies it in the bag and
   at checkout; the theme's wording for the offer lives in *Theme settings → Offer*.
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
   price £29.99 (was £49.99), heart pack picker (1–5), *Add To Bag* and *Add 3 & Get 1 Free* buttons, details accordion.
3. **How to use** — three containers in a 1 / 2 / 2 layout: charge and clip on, tap once to light, see everything inside and out.
4. **FAQs** — accordion.
5. **Footer** — customer care and shop links, region selector, newsletter sign-up, and the brand story
   ("Founded in 2026, the Blamp was designed to keep to safe, inside and out."), legal links and wordmark.

## Store logic (`assets/store.js`)

- Cart drawer driven by Shopify's Cart API (`/cart/add.js`, `/cart/change.js`, `/cart.js`), so the bag,
  discounts and totals are always Shopify's own numbers.
- The buy-2-get-1-free hint ("add 1 more for a free one") is computed from *Theme settings → Offer*; the
  discount itself is Shopify's automatic discount.
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

The quantity control on the buy box is five heart-shaped buttons drawn in the shape of the product.
Hearts one to *n* light up when a pack of *n* is chosen; the others stay faded. The chosen number feeds the
hidden `#product-qty` input, the price on the *Add To Bag* button, and the buy-2-get-1-free hint.

## Developing locally

```sh
npm i -g @shopify/cli
shopify theme dev --store your-store.myshopify.com   # live preview against your store
shopify theme check                                   # lint the theme
```

The static preview in `static-site/` can still be opened directly in a browser, but it is no longer the
deployed store.
