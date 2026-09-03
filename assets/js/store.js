/* The Blamp™ storefront — vanilla JS
   Cart, buy-2-get-1-free pricing, checkout, wishlist, search, accordions, header. */
(function () {
  'use strict';

  var PRODUCT = {
    id: 'blamp-warm-white',
    name: 'The Blamp™',
    variant: 'Warm White',
    price: 29.99,
    wasPrice: 49.99,
    image: 'assets/img/product-front.svg'
  };
  var OFFER = { buy: 2, free: 1 }; // buy 2, get 1 free => every 3rd unit free
  var STORAGE_KEY = 'blamp-store-v1';

  var state = load();

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var s = JSON.parse(raw);
        return { qty: Math.max(0, parseInt(s.qty, 10) || 0), wishlist: !!s.wishlist, orders: s.orders || [] };
      }
    } catch (e) { /* storage unavailable */ }
    return { qty: 0, wishlist: false, orders: [] };
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  /* ---------- helpers ---------- */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function money(n) { return '£' + (Math.round(n * 100) / 100).toFixed(2); }
  function on(el, ev, fn) { if (el) el.addEventListener(ev, fn); }

  function pricing(qty, delivery) {
    var groupSize = OFFER.buy + OFFER.free;
    var freeUnits = Math.floor(qty / groupSize) * OFFER.free;
    var paidUnits = qty - freeUnits;
    var subtotal = qty * PRODUCT.price;
    var discount = freeUnits * PRODUCT.price;
    var del = delivery || 0;
    return {
      qty: qty, freeUnits: freeUnits, paidUnits: paidUnits,
      subtotal: subtotal, discount: discount, delivery: del,
      total: paidUnits * PRODUCT.price + del,
      untilNextFree: qty === 0 ? groupSize : (groupSize - (qty % groupSize)) % groupSize
    };
  }

  var toastTimer;
  function toast(msg) {
    var t = $('[data-toast]');
    if (!t) return;
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 2600);
  }

  /* ---------- header: compact on scroll, mobile nav ---------- */
  var site = $('#site');
  var lastCompact = null;
  function onScroll() {
    var compact = window.scrollY > 40;
    if (compact !== lastCompact) {
      site.classList.toggle('float-header', compact);
      lastCompact = compact;
    }
  }
  on(window, 'scroll', onScroll, { passive: true });
  onScroll();

  var toggler = $('#mobile-header');
  on(toggler, 'click', function () {
    var open = site.classList.toggle('is-nav-open');
    toggler.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('is-locked', open);
  });
  $$('.main-nav__link').forEach(function (a) {
    on(a, 'click', function () {
      site.classList.remove('is-nav-open');
      toggler && toggler.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('is-locked');
    });
  });
  // highlight current section in nav
  var sectionLinks = $$('.main-nav__link[href^="#"]');
  var sections = sectionLinks.map(function (a) { return $(a.getAttribute('href')); }).filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        sectionLinks.forEach(function (a) {
          a.parentElement.classList.toggle('main-nav__item--selected', a.getAttribute('href') === '#' + en.target.id);
        });
      });
    }, { rootMargin: '-40% 0px -50% 0px' });
    sections.forEach(function (s) { io.observe(s); });
  }

  /* ---------- search ---------- */
  var searchBar = $('#search-bar');
  var searchInput = $('#search-input');
  var searchResults = $('[data-search-results]');
  var INDEX = [
    { title: 'The Blamp™ — £29.99 (was £49.99)', href: '#shop', keys: 'blamp bag lamp light buy price sale offer torch' },
    { title: 'Buy 2, get 1 free', href: '#shop', keys: 'offer deal free bundle three 3' },
    { title: 'How to use The Blamp', href: '#how-to-use', keys: 'how use clip charge sensor motion instructions' },
    { title: 'FAQs — delivery, returns, battery, warranty', href: '#faqs', keys: 'faq delivery returns battery warranty shipping fit' },
    { title: 'Our story', href: '#our-story', keys: 'story founded 2026 about safe' }
  ];
  function openSearch() {
    searchBar.hidden = false;
    setTimeout(function () { searchInput.focus(); }, 30);
  }
  function closeSearch() {
    searchBar.hidden = true;
    searchInput.value = '';
    searchResults.innerHTML = '';
  }
  $$('[data-open-search]').forEach(function (b) { on(b, 'click', openSearch); });
  on($('[data-close-search]'), 'click', closeSearch);
  function runSearch() {
    var q = searchInput.value.trim().toLowerCase();
    if (!q) { searchResults.innerHTML = ''; return; }
    var hits = INDEX.filter(function (i) { return (i.title + ' ' + i.keys).toLowerCase().indexOf(q) !== -1; });
    searchResults.innerHTML = hits.length
      ? hits.map(function (h) { return '<p><a href="' + h.href + '">' + h.title + '</a></p>'; }).join('')
      : '<p>No results for “' + escapeHtml(q) + '”. Try “Blamp”, “delivery” or “offer”.</p>';
    $$('a', searchResults).forEach(function (a) { on(a, 'click', closeSearch); });
  }
  on(searchInput, 'input', runSearch);
  on($('[data-search-form]'), 'submit', function (e) {
    e.preventDefault();
    runSearch();
    var first = $('a', searchResults);
    if (first) { window.location.hash = first.getAttribute('href'); closeSearch(); }
  });
  function escapeHtml(s) { return s.replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ---------- gallery ---------- */
  var mainImg = $('#product-main-image');
  $$('.product__thumb').forEach(function (btn) {
    on(btn, 'click', function () {
      $$('.product__thumb').forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');
      mainImg.src = btn.getAttribute('data-image');
      mainImg.alt = btn.getAttribute('data-alt') || '';
    });
  });

  /* ---------- accordions ---------- */
  $$('[data-accordion]').forEach(function (acc) {
    $$('.accordion__trigger', acc).forEach(function (btn) {
      on(btn, 'click', function () {
        var expanded = btn.getAttribute('aria-expanded') === 'true';
        var panel = document.getElementById(btn.getAttribute('aria-controls'));
        btn.setAttribute('aria-expanded', String(!expanded));
        if (panel) panel.hidden = expanded;
      });
    });
  });

  /* ---------- wishlist ---------- */
  function renderWishlist() {
    $$('[data-wishlist-toggle]').forEach(function (b) { b.setAttribute('aria-pressed', String(state.wishlist)); });
    $$('[data-wishlist-count]').forEach(function (c) {
      c.textContent = state.wishlist ? '1' : '0';
      c.setAttribute('data-zero', String(!state.wishlist));
    });
  }
  $$('[data-wishlist-toggle]').forEach(function (b) {
    on(b, 'click', function () {
      state.wishlist = !state.wishlist;
      save();
      renderWishlist();
      toast(state.wishlist ? 'The Blamp™ added to your wishlist' : 'Removed from your wishlist');
    });
  });

  /* ---------- product qty + add to bag ---------- */
  var qtyInput = $('#product-qty');
  var qtyHint = $('[data-qty-hint]');
  function clampQty(v) { v = parseInt(v, 10); if (isNaN(v) || v < 1) v = 1; if (v > 99) v = 99; return v; }
  function renderQtyHint() {
    var q = clampQty(qtyInput.value);
    var p = pricing(q);
    var addBtn = $('[data-add-to-bag]');
    if (p.freeUnits > 0) {
      qtyHint.textContent = p.freeUnits + (p.freeUnits === 1 ? ' Blamp free' : ' Blamps free') + ' — you pay ' + money(p.total) + ' for ' + q + '.';
    } else {
      qtyHint.textContent = 'Add ' + p.untilNextFree + ' more to get one free.';
    }
    addBtn.textContent = 'Add To Bag — ' + money(p.total);
  }
  on($('[data-qty-dec]'), 'click', function () { qtyInput.value = clampQty(qtyInput.value) - 1 || 1; renderQtyHint(); });
  on($('[data-qty-inc]'), 'click', function () { qtyInput.value = clampQty(qtyInput.value) + 1; renderQtyHint(); });
  on(qtyInput, 'input', renderQtyHint);
  on(qtyInput, 'change', function () { qtyInput.value = clampQty(qtyInput.value); renderQtyHint(); });
  renderQtyHint();

  function addToBag(n) {
    state.qty = Math.min(99, state.qty + n);
    save();
    renderCart();
    openCart();
  }
  on($('[data-add-form]'), 'submit', function (e) {
    e.preventDefault();
    addToBag(clampQty(qtyInput.value));
  });
  on($('[data-add-bundle]'), 'click', function () { addToBag(OFFER.buy + OFFER.free); });

  /* ---------- cart drawer ---------- */
  var overlay = $('[data-overlay]');
  var cart = $('#cart');
  function openCart() {
    cart.hidden = false;
    overlay.hidden = false;
    cart.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-locked');
    requestAnimationFrame(function () { cart.classList.add('is-open'); });
    var closeBtn = $('[data-close-cart]', cart);
    closeBtn && closeBtn.focus();
  }
  function closeCart() {
    cart.classList.remove('is-open');
    cart.setAttribute('aria-hidden', 'true');
    overlay.hidden = true;
    document.body.classList.remove('is-locked');
    setTimeout(function () { cart.hidden = true; }, 350);
  }
  $$('[data-open-cart]').forEach(function (b) { on(b, 'click', openCart); });
  $$('[data-close-cart]').forEach(function (b) { on(b, 'click', closeCart); });
  on(overlay, 'click', closeCart);

  function renderCart() {
    var p = pricing(state.qty);
    $$('[data-cart-count]').forEach(function (c) { c.textContent = String(state.qty); c.setAttribute('data-zero', String(state.qty === 0)); });
    $('[data-cart-empty]').hidden = state.qty > 0;
    $('[data-cart-footer]').hidden = state.qty === 0;
    var items = $('[data-cart-items]');
    var hint = $('[data-offer-hint]');
    if (state.qty === 0) { items.innerHTML = ''; hint.hidden = true; }
    else {
      items.innerHTML =
        '<li class="cart-item">' +
          '<div class="cart-item__img"><img src="' + PRODUCT.image + '" alt="" width="88" height="88"></div>' +
          '<div>' +
            '<p class="cart-item__name">' + PRODUCT.name + '</p>' +
            '<p class="cart-item__meta">' + PRODUCT.variant + ' · ' + money(PRODUCT.price) + ' each <s>' + money(PRODUCT.wasPrice) + '</s></p>' +
            '<div class="cart-item__row">' +
              '<div class="qty">' +
                '<button class="qty__btn" type="button" data-cart-dec aria-label="Decrease quantity">−</button>' +
                '<input class="qty__input" type="number" min="0" max="99" value="' + state.qty + '" data-cart-qty aria-label="Quantity">' +
                '<button class="qty__btn" type="button" data-cart-inc aria-label="Increase quantity">+</button>' +
              '</div>' +
              '<div class="cart-item__price">' +
                (p.discount > 0 ? '<s>' + money(p.subtotal) + '</s>' : '') + money(p.total) +
                (p.freeUnits > 0 ? '<br><span class="cart-item__free">' + p.freeUnits + ' free</span>' : '') +
              '</div>' +
            '</div>' +
            '<button class="cart-item__remove" type="button" data-cart-remove>Remove</button>' +
          '</div>' +
        '</li>';
      on($('[data-cart-dec]', items), 'click', function () { setQty(state.qty - 1); });
      on($('[data-cart-inc]', items), 'click', function () { setQty(state.qty + 1); });
      on($('[data-cart-qty]', items), 'change', function (e) { setQty(parseInt(e.target.value, 10)); });
      on($('[data-cart-remove]', items), 'click', function () { setQty(0); });
      hint.hidden = false;
      hint.textContent = p.untilNextFree === 0
        ? 'Buy 2, get 1 free applied — ' + p.freeUnits + (p.freeUnits === 1 ? ' Blamp is' : ' Blamps are') + ' free.'
        : 'Add ' + p.untilNextFree + ' more to get ' + (p.freeUnits ? 'another' : 'one') + ' free.';
    }
    $$('[data-cart-subtotal]').forEach(function (el) { el.textContent = money(p.subtotal); });
    $$('[data-cart-discount]').forEach(function (el) { el.textContent = '−' + money(p.discount); });
    $$('[data-discount-row]').forEach(function (el) { el.hidden = p.discount === 0; });
    $$('[data-cart-total]').forEach(function (el) { el.textContent = money(p.total); });
    renderCheckoutSummary();
  }
  function setQty(n) {
    n = parseInt(n, 10); if (isNaN(n) || n < 0) n = 0; if (n > 99) n = 99;
    state.qty = n; save(); renderCart();
  }

  /* ---------- checkout ---------- */
  var checkout = $('#checkout');
  var checkoutForm = $('[data-checkout-form]');
  function deliveryCost() {
    var sel = checkoutForm.querySelector('input[name="delivery"]:checked');
    return sel ? parseFloat(sel.value) || 0 : 0;
  }
  function renderCheckoutSummary() {
    var p = pricing(state.qty, deliveryCost());
    var list = $('[data-checkout-items]');
    list.innerHTML = state.qty
      ? '<li><span>' + PRODUCT.name + ' × ' + state.qty + (p.freeUnits ? ' <em>(' + p.freeUnits + ' free)</em>' : '') + '</span><span>' + money(p.paidUnits * PRODUCT.price) + '</span></li>'
      : '<li><span>Your bag is empty</span><span></span></li>';
    $('[data-checkout-delivery]').textContent = p.delivery ? money(p.delivery) : 'Free';
    $('[data-checkout-total]').textContent = money(p.total);
  }
  function showStep(name) {
    $$('[data-checkout-step]', checkout).forEach(function (s) { s.hidden = s.getAttribute('data-checkout-step') !== name; });
  }
  function openCheckout() {
    if (!state.qty) { toast('Your bag is empty'); return; }
    closeCart();
    showStep('form');
    renderCheckoutSummary();
    checkout.hidden = false;
    document.body.classList.add('is-locked');
    checkout.scrollTop = 0;
    var first = checkoutForm.querySelector('input');
    first && first.focus();
  }
  function closeCheckout() {
    checkout.hidden = true;
    document.body.classList.remove('is-locked');
  }
  $$('[data-open-checkout]').forEach(function (b) { on(b, 'click', openCheckout); });
  $$('[data-close-checkout]').forEach(function (b) { on(b, 'click', closeCheckout); });
  $$('input[name="delivery"]', checkoutForm).forEach(function (r) { on(r, 'change', renderCheckoutSummary); });

  // light formatting for card fields
  var cardNumber = checkoutForm.querySelector('[name="cardNumber"]');
  on(cardNumber, 'input', function () {
    var v = cardNumber.value.replace(/\D/g, '').slice(0, 19);
    cardNumber.value = v.replace(/(.{4})/g, '$1 ').trim();
  });
  var cardExpiry = checkoutForm.querySelector('[name="cardExpiry"]');
  on(cardExpiry, 'input', function () {
    var v = cardExpiry.value.replace(/\D/g, '').slice(0, 4);
    cardExpiry.value = v.length > 2 ? v.slice(0, 2) + ' / ' + v.slice(2) : v;
  });

  function luhn(num) {
    var s = 0, alt = false;
    for (var i = num.length - 1; i >= 0; i--) {
      var d = parseInt(num.charAt(i), 10);
      if (alt) { d *= 2; if (d > 9) d -= 9; }
      s += d; alt = !alt;
    }
    return num.length >= 13 && s % 10 === 0;
  }

  on(checkoutForm, 'submit', function (e) {
    e.preventDefault();
    var err = $('[data-checkout-error]');
    err.hidden = true;
    var problems = [];
    $$('input', checkoutForm).forEach(function (i) { i.classList.remove('is-invalid'); });
    function bad(name, msg) { var f = checkoutForm.querySelector('[name="' + name + '"]'); if (f) f.classList.add('is-invalid'); problems.push(msg); }
    var d = {};
    $$('input, select', checkoutForm).forEach(function (f) { if (f.type === 'radio') { if (f.checked) d[f.name] = f.value; } else d[f.name] = f.value.trim(); });

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) bad('email', 'Enter a valid email address.');
    ['firstName', 'lastName', 'address1', 'city'].forEach(function (k) { if (!d[k]) bad(k, 'Complete your delivery address.'); });
    if (!/^[A-Za-z]{1,2}\d[A-Za-z\d]?\s*\d[A-Za-z]{2}$/.test(d.postcode)) bad('postcode', 'Enter a valid UK postcode.');
    if (!d.cardName) bad('cardName', 'Enter the name on your card.');
    var digits = (d.cardNumber || '').replace(/\D/g, '');
    if (!luhn(digits)) bad('cardNumber', 'Check your card number.');
    var exp = (d.cardExpiry || '').replace(/\D/g, '');
    if (exp.length !== 4) bad('cardExpiry', 'Enter the card expiry as MM / YY.');
    else {
      var mm = parseInt(exp.slice(0, 2), 10), yy = 2000 + parseInt(exp.slice(2), 10);
      var now = new Date();
      if (mm < 1 || mm > 12 || new Date(yy, mm, 0) < now) bad('cardExpiry', 'Your card has expired.');
    }
    if (!/^\d{3,4}$/.test(d.cardCvc)) bad('cardCvc', 'Enter your card security code.');

    if (problems.length) {
      err.textContent = problems.filter(function (v, i, a) { return a.indexOf(v) === i; }).join(' ');
      err.hidden = false;
      var firstBad = checkoutForm.querySelector('.is-invalid');
      firstBad && firstBad.focus();
      return;
    }

    var p = pricing(state.qty, deliveryCost());
    var ref = 'BL-' + Date.now().toString(36).toUpperCase().slice(-6);
    state.orders.push({ ref: ref, qty: state.qty, total: p.total, email: d.email, at: new Date().toISOString() });
    $('[data-order-ref]').textContent = ref;
    $('[data-order-email]').textContent = d.email;
    $('[data-order-summary]').textContent =
      state.qty + ' × ' + PRODUCT.name + (p.freeUnits ? ' (' + p.freeUnits + ' free)' : '') + ' — ' + money(p.total) + (p.delivery ? ' including next-day delivery.' : ' with free delivery.');
    state.qty = 0;
    save();
    renderCart();
    checkoutForm.reset();
    showStep('confirm');
    checkout.scrollTop = 0;
  });

  /* ---------- account modal ---------- */
  var account = $('#account');
  $$('[data-open-account]').forEach(function (b) { on(b, 'click', function (e) { e.preventDefault(); account.hidden = false; document.body.classList.add('is-locked'); }); });
  $$('[data-close-account]').forEach(function (b) { on(b, 'click', function () { account.hidden = true; document.body.classList.remove('is-locked'); }); });
  on(account, 'click', function (e) { if (e.target === account) { account.hidden = true; document.body.classList.remove('is-locked'); } });

  /* ---------- newsletter ---------- */
  $$('[data-signup-form]').forEach(function (form) {
    on(form, 'submit', function (e) {
      e.preventDefault();
      var input = form.querySelector('input[type="email"]');
      var msg = form.parentElement.querySelector('[data-signup-msg]') || form.querySelector('[data-signup-msg]');
      if (!input.checkValidity()) { msg.textContent = 'Please enter a valid email address.'; return; }
      try {
        var list = JSON.parse(localStorage.getItem('blamp-signups') || '[]');
        if (list.indexOf(input.value) === -1) list.push(input.value);
        localStorage.setItem('blamp-signups', JSON.stringify(list));
      } catch (err) { /* ignore */ }
      msg.textContent = 'Thank you — you\'re on the list.';
      input.value = '';
    });
  });

  /* ---------- keyboard: escape closes overlays ---------- */
  on(document, 'keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!checkout.hidden) closeCheckout();
    else if (!cart.hidden) closeCart();
    else if (!account.hidden) { account.hidden = true; document.body.classList.remove('is-locked'); }
    else if (!searchBar.hidden) closeSearch();
    else if (site.classList.contains('is-nav-open')) toggler.click();
  });

  /* ---------- init ---------- */
  renderWishlist();
  renderCart();
})();
