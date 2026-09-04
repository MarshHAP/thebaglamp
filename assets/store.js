/* The Blamp™ Shopify theme — storefront JS
   Header behaviour, heart pack picker, Ajax cart drawer (Shopify Cart API), wishlist, accordions. */
(function () {
  'use strict';

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function on(el, ev, fn, opts) { if (el) el.addEventListener(ev, fn, opts); }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  var body = document.body;
  var ROOT = body.getAttribute('data-root-url') || '/';
  if (ROOT.length > 1 && ROOT.slice(-1) === '/') ROOT = ROOT.slice(0, -1);
  var MONEY_FORMAT = body.getAttribute('data-money-format') || '£{{amount}}';

  function money(cents) {
    var n = (Math.round(cents) / 100);
    var fixed = n.toFixed(2);
    var out = MONEY_FORMAT
      .replace(/\{\{\s*amount_no_decimals_with_comma_separator\s*\}\}/, Math.round(n).toLocaleString('en-GB'))
      .replace(/\{\{\s*amount_with_comma_separator\s*\}\}/, fixed.replace('.', ','))
      .replace(/\{\{\s*amount_no_decimals\s*\}\}/, String(Math.round(n)))
      .replace(/\{\{\s*amount\s*\}\}/, Number(fixed).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    return out.replace(/<[^>]+>/g, '');
  }

  var toastTimer;
  function toast(msg) {
    var t = $('[data-toast]');
    if (!t) return;
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 2600);
  }

  /* ---------- header ---------- */
  var site = $('#site');
  var lastCompact = null;
  function onScroll() {
    var compact = window.scrollY > 40;
    if (compact !== lastCompact) { site.classList.toggle('float-header', compact); lastCompact = compact; }
  }
  on(window, 'scroll', onScroll, { passive: true });
  onScroll();

  var toggler = $('#mobile-header');
  function closeNav() {
    site.classList.remove('is-nav-open');
    toggler && toggler.setAttribute('aria-expanded', 'false');
    body.classList.remove('is-locked');
  }
  on(toggler, 'click', function () {
    var open = site.classList.toggle('is-nav-open');
    toggler.setAttribute('aria-expanded', String(open));
    body.classList.toggle('is-locked', open);
  });
  $$('.main-nav__link').forEach(function (a) { on(a, 'click', closeNav); });

  var sectionLinks = $$('.main-nav__link[href*="#"]');
  var sections = sectionLinks.map(function (a) { var h = a.getAttribute('href').split('#')[1]; return h ? document.getElementById(h) : null; }).filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        sectionLinks.forEach(function (a) {
          a.parentElement.classList.toggle('main-nav__item--selected', a.getAttribute('href').split('#')[1] === en.target.id);
        });
      });
    }, { rootMargin: '-40% 0px -50% 0px' });
    sections.forEach(function (s) { io.observe(s); });
  }

  /* ---------- search ---------- */
  var searchBar = $('#search-bar');
  var searchInput = $('#search-input');
  function openSearch() { if (!searchBar) return; searchBar.hidden = false; setTimeout(function () { searchInput && searchInput.focus(); }, 30); }
  function closeSearch() { if (!searchBar) return; searchBar.hidden = true; }
  $$('[data-open-search]').forEach(function (b) { on(b, 'click', openSearch); });
  on($('[data-close-search]'), 'click', closeSearch);

  /* ---------- gallery ---------- */
  var mainImg = $('#product-main-image');
  $$('.product__thumb').forEach(function (btn) {
    on(btn, 'click', function () {
      $$('.product__thumb').forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      if (mainImg) { mainImg.removeAttribute('srcset'); mainImg.src = btn.getAttribute('data-image'); mainImg.alt = btn.getAttribute('data-alt') || ''; }
    });
  });

  /* ---------- accordions ---------- */
  $$('[data-accordion] .accordion__trigger').forEach(function (btn) {
    on(btn, 'click', function () {
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      btn.setAttribute('aria-expanded', String(!expanded));
      if (panel) panel.hidden = expanded;
    });
  });

  /* ---------- wishlist (browser-local) ---------- */
  var WISH_KEY = 'blamp-wishlist';
  function wishOn() { try { return localStorage.getItem(WISH_KEY) === '1'; } catch (e) { return false; } }
  function renderWishlist() {
    var w = wishOn();
    $$('[data-wishlist-toggle]').forEach(function (b) { b.setAttribute('aria-pressed', String(w)); });
    $$('[data-wishlist-count]').forEach(function (c) { c.textContent = w ? '1' : '0'; c.setAttribute('data-zero', String(!w)); });
  }
  $$('[data-wishlist-toggle]').forEach(function (b) {
    on(b, 'click', function () {
      var w = !wishOn();
      try { localStorage.setItem(WISH_KEY, w ? '1' : '0'); } catch (e) { /* ignore */ }
      renderWishlist();
      toast(w ? 'Added to your wishlist' : 'Removed from your wishlist');
    });
  });
  renderWishlist();

  /* ---------- product form: variants + heart pack picker ---------- */
  var form = $('[data-add-form]');
  var qtyInput = $('#product-qty');
  var picker = $('[data-heart-picker]');
  var hearts = $$('[data-heart]');
  var OFFER = { buy: 2, free: 1 };
  if (picker) {
    OFFER.buy = parseInt(picker.getAttribute('data-offer-buy'), 10) || 2;
    OFFER.free = parseInt(picker.getAttribute('data-offer-free'), 10) || 1;
  }
  var GROUP = OFFER.buy + OFFER.free;
  var PRODUCT_ID = form ? parseInt(form.getAttribute('data-product-id'), 10) : null;
  var variants = [];
  try { var vjson = $('[data-variants]'); if (vjson) variants = JSON.parse(vjson.textContent); } catch (e) { variants = []; }
  var priceEl = $('[data-unit-price]');
  var unitPrice = priceEl ? parseInt(priceEl.getAttribute('data-unit-price'), 10) : 0;

  function currentVariant() {
    var idInput = $('[data-variant-id]');
    var id = idInput ? parseInt(idInput.value, 10) : null;
    for (var i = 0; i < variants.length; i++) if (variants[i].id === id) return variants[i];
    return variants[0] || null;
  }
  $$('.product-option').forEach(function (sel) {
    on(sel, 'change', function () {
      var chosen = $$('.product-option').map(function (s) { return s.value; });
      var match = variants.filter(function (v) { return chosen.every(function (val, i) { return v.options[i] === val; }); })[0];
      var idInput = $('[data-variant-id]');
      var addBtn = $('[data-add-to-bag]');
      if (match && idInput) {
        idInput.value = match.id;
        unitPrice = match.price;
        if (priceEl) { priceEl.textContent = money(match.price); priceEl.setAttribute('data-unit-price', match.price); }
        if (addBtn) { addBtn.disabled = !match.available; }
        renderQtyHint();
      }
    });
  });

  function offerFor(qty) {
    var freeUnits = Math.floor(qty / GROUP) * OFFER.free;
    return { qty: qty, freeUnits: freeUnits, paid: qty - freeUnits, untilNextFree: qty === 0 ? GROUP : (GROUP - (qty % GROUP)) % GROUP };
  }
  function clampQty(v) { v = parseInt(v, 10); if (isNaN(v) || v < 1) v = 1; if (v > 99) v = 99; return v; }
  function renderQtyHint() {
    if (!qtyInput) return;
    var q = clampQty(qtyInput.value);
    var p = offerFor(q);
    var hint = $('[data-qty-hint]');
    var addBtn = $('[data-add-to-bag]');
    var v = currentVariant();
    if (hint) {
      hint.textContent = p.freeUnits > 0
        ? p.freeUnits + (p.freeUnits === 1 ? ' Blamp free' : ' Blamps free') + ' — you pay ' + money(p.paid * unitPrice) + ' for ' + q + '.'
        : 'Add ' + p.untilNextFree + ' more to get one free.';
    }
    if (addBtn && (!v || v.available)) addBtn.textContent = 'Add To Bag — ' + money(p.paid * unitPrice);
  }
  function renderHearts(animate) {
    if (!qtyInput) return;
    var q = clampQty(qtyInput.value);
    hearts.forEach(function (h) {
      var n = parseInt(h.getAttribute('data-heart'), 10);
      var wasLit = h.classList.contains('is-lit');
      var lit = n <= q;
      h.classList.toggle('is-lit', lit);
      h.setAttribute('aria-pressed', String(n === q));
      h.classList.remove('is-just-lit');
      if (animate && lit && !wasLit) { void h.offsetWidth; h.classList.add('is-just-lit'); }
    });
  }
  function setPickerQty(n, animate) {
    if (!qtyInput) return;
    qtyInput.value = clampQty(n);
    renderQtyHint();
    renderHearts(animate);
  }
  hearts.forEach(function (h) { on(h, 'click', function () { setPickerQty(parseInt(h.getAttribute('data-heart'), 10), true); }); });
  on(picker, 'keydown', function (e) {
    var q = clampQty(qtyInput.value);
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); setPickerQty(Math.min(hearts.length, q + 1), true); hearts[clampQty(qtyInput.value) - 1].focus(); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); setPickerQty(Math.max(1, q - 1), false); hearts[clampQty(qtyInput.value) - 1].focus(); }
  });
  if (qtyInput) setPickerQty(qtyInput.value, false);

  /* ---------- Shopify Ajax cart ---------- */
  var overlay = $('[data-overlay]');
  var cart = $('#cart');
  var cartState = null;

  function request(path, opts) {
    return fetch(ROOT + path, Object.assign({ headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' } }, opts || {}))
      .then(function (r) { return r.json().then(function (data) { if (!r.ok) throw data; return data; }); });
  }
  function fetchCart() { return request('/cart.js').then(function (c) { cartState = c; renderCart(); return c; }); }
  function addToCart(variantId, qty) {
    return request('/cart/add.js', { method: 'POST', body: JSON.stringify({ items: [{ id: variantId, quantity: qty }] }) })
      .then(fetchCart);
  }
  function changeLine(key, qty) {
    return request('/cart/change.js', { method: 'POST', body: JSON.stringify({ id: key, quantity: qty }) })
      .then(function (c) { cartState = c; renderCart(); });
  }

  function openCart() {
    if (!cart) return;
    cart.hidden = false; overlay.hidden = false;
    cart.setAttribute('aria-hidden', 'false');
    body.classList.add('is-locked');
    requestAnimationFrame(function () { cart.classList.add('is-open'); });
    var closeBtn = $('[data-close-cart]', cart); closeBtn && closeBtn.focus();
  }
  function closeCart() {
    if (!cart) return;
    cart.classList.remove('is-open');
    cart.setAttribute('aria-hidden', 'true');
    overlay.hidden = true;
    body.classList.remove('is-locked');
    setTimeout(function () { cart.hidden = true; }, 350);
  }
  $$('[data-open-cart]').forEach(function (b) { on(b, 'click', function (e) { e.preventDefault(); openCart(); fetchCart().catch(function () {}); }); });
  $$('[data-close-cart]').forEach(function (b) { on(b, 'click', closeCart); });
  on(overlay, 'click', closeCart);

  function renderCart() {
    if (!cart || !cartState) return;
    var c = cartState;
    $$('[data-cart-count]').forEach(function (el) { el.textContent = String(c.item_count); el.setAttribute('data-zero', String(c.item_count === 0)); });
    $('[data-cart-empty]').hidden = c.item_count > 0;
    $('[data-cart-footer]').hidden = c.item_count === 0;
    var items = $('[data-cart-items]');
    var hint = $('[data-offer-hint]');
    items.innerHTML = c.items.map(function (item) {
      var img = item.image ? item.image.replace(/(\.[a-z]+)(\?.*)?$/i, '_176x176$1$2') : '';
      var discounts = (item.line_level_discount_allocations || []).map(function (d) { return '<span class="cart-item__free">' + escapeHtml(d.discount_application.title) + '</span>'; }).join('<br>');
      return '<li class="cart-item" data-key="' + escapeHtml(item.key) + '">' +
        '<div class="cart-item__img">' + (img ? '<img src="' + escapeHtml(img) + '" alt="" width="88" height="88">' : '') + '</div>' +
        '<div>' +
          '<p class="cart-item__name">' + escapeHtml(item.product_title) + '</p>' +
          '<p class="cart-item__meta">' + (item.variant_title ? escapeHtml(item.variant_title) + ' · ' : '') + money(item.original_price) + ' each</p>' +
          '<div class="cart-item__row">' +
            '<div class="qty">' +
              '<button class="qty__btn" type="button" data-cart-dec aria-label="Decrease quantity">−</button>' +
              '<input class="qty__input" type="number" min="0" max="99" value="' + item.quantity + '" data-cart-qty aria-label="Quantity">' +
              '<button class="qty__btn" type="button" data-cart-inc aria-label="Increase quantity">+</button>' +
            '</div>' +
            '<div class="cart-item__price">' +
              (item.original_line_price !== item.final_line_price ? '<s>' + money(item.original_line_price) + '</s>' : '') + money(item.final_line_price) +
              (discounts ? '<br>' + discounts : '') +
            '</div>' +
          '</div>' +
          '<button class="cart-item__remove" type="button" data-cart-remove>Remove</button>' +
        '</div>' +
      '</li>';
    }).join('');

    $$('.cart-item', items).forEach(function (li) {
      var key = li.getAttribute('data-key');
      var item = c.items.filter(function (i) { return i.key === key; })[0];
      on($('[data-cart-dec]', li), 'click', function () { changeLine(key, Math.max(0, item.quantity - 1)).catch(cartError); });
      on($('[data-cart-inc]', li), 'click', function () { changeLine(key, item.quantity + 1).catch(cartError); });
      on($('[data-cart-qty]', li), 'change', function (e) { changeLine(key, Math.max(0, parseInt(e.target.value, 10) || 0)).catch(cartError); });
      on($('[data-cart-remove]', li), 'click', function () { changeLine(key, 0).catch(cartError); });
    });

    // Offer hint for the featured product (or the whole bag when there is one product)
    var productQty = c.items.reduce(function (n, i) { return n + ((PRODUCT_ID === null || i.product_id === PRODUCT_ID) ? i.quantity : 0); }, 0);
    var label = cart.getAttribute('data-offer-label') || 'Buy 2, get 1 free';
    if (c.item_count === 0) { hint.hidden = true; }
    else {
      var p = offerFor(productQty);
      hint.hidden = false;
      hint.textContent = p.untilNextFree === 0
        ? label + ' applied — ' + p.freeUnits + (p.freeUnits === 1 ? ' Blamp is' : ' Blamps are') + ' free.'
        : 'Add ' + p.untilNextFree + ' more to get ' + (p.freeUnits ? 'another' : 'one') + ' free.';
    }
    $('[data-cart-subtotal]').textContent = money(c.original_total_price);
    $('[data-cart-discount]').textContent = '−' + money(c.total_discount);
    $('[data-discount-row]').hidden = !(c.total_discount > 0);
    $('[data-cart-total]').textContent = money(c.total_price);
  }
  function cartError(err) {
    toast((err && (err.description || err.message)) || 'Sorry, something went wrong updating your bag.');
  }

  on(form, 'submit', function (e) {
    e.preventDefault();
    var idInput = $('[data-variant-id]');
    var addBtn = $('[data-add-to-bag]');
    if (!idInput) return;
    var qty = clampQty(qtyInput ? qtyInput.value : 1);
    addBtn && (addBtn.disabled = true);
    addToCart(parseInt(idInput.value, 10), qty)
      .then(function () { openCart(); })
      .catch(cartError)
      .then(function () { addBtn && (addBtn.disabled = false); });
  });
  on($('[data-add-bundle]'), 'click', function (e) {
    var n = parseInt(e.currentTarget.getAttribute('data-bundle-qty'), 10) || GROUP;
    var idInput = $('[data-variant-id]');
    if (!idInput) return;
    setPickerQty(n, true);
    addToCart(parseInt(idInput.value, 10), n).then(openCart).catch(cartError);
  });

  on(document, 'keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (cart && !cart.hidden) closeCart();
    else if (searchBar && !searchBar.hidden) closeSearch();
    else if (site.classList.contains('is-nav-open')) closeNav();
  });

  // Initial cart state for the header count
  fetchCart().catch(function () {});
})();
