# The Blamp™ — storefront

A single-page e-commerce store for **The Blamp™**, the bag lamp designed to keep you safe, inside and out.
The design mirrors the layout, typography and colour system of mulberry.com (fixed white header with centred
wordmark, serif headings, 14px sans body, black uppercase buttons, light-grey footer).

## Page order

1. **Cover** — full-bleed hero with headline, price and "Shop The Blamp" call to action.
2. **Product buy box** — breadcrumb, category-style header and toolbar, gallery with wishlist tile,
   price £29.99 (was £49.99), quantity stepper, *Add To Bag* and *Add 3 & Get 1 Free* buttons, details accordion.
3. **How to use** — three containers in a 1 / 2 / 2 layout with image slots ready for photography.
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

## Adding the "How to use" images

Drop your images into `assets/img/` and replace the placeholder inside each `.how-to__media` figure in
`index.html`, for example:

```html
<figure class="how-to__media">
  <img src="assets/img/how-to-1.jpg" alt="Clipping The Blamp into a bag">
</figure>
```

The same applies to the product gallery (`product-front.svg`, `product-inside.svg`, `product-detail.svg`)
and the cover image (`hero.svg`) — swap the SVG placeholders for photography and keep the file names, or
update the `src` attributes.

## Running locally

It is a static site — open `index.html` directly, or serve it:

```sh
npx http-server -p 8080 .
```

## Going live

Point any static host (GitHub Pages, Netlify, Vercel, Cloudflare Pages) at the repository root. To take real
payments, connect the checkout form to Stripe Checkout, Shopify Buy Button or a similar provider in
`store.js` where the order is placed.
