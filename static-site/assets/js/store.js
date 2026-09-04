/* The Blamp™ static one-pager — vanilla JS
   Pack picker (1 / 2 / 3 Blamps), cart drawer, checkout, wishlist, search, accordions, header. */
(function () {
  'use strict';

  var PACKS = [
    { n: 1, title: '1 Blamp',  price: 19.99, was: 23.99 },
    { n: 2, title: '2 Blamps', price: 29.99, was: 35.99, tag: 'Most popular' },
    { n: 3, title: '3 Blamps', price: 34.99, was: 41.99, tag: 'Best value' }
  ];
  var PRODUCT = { name: 'The Blamp™', variant: 'White', image: 'assets/img/pdp/pdp-01-front-thumb.jpg' };
  var STORAGE_KEY = 'blamp-store-v2';

  var state = load();
  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) { var s = JSON.parse(raw); return { items: s.items || {}, wishlist: !!s.wishlist, orders: s.orders || [] }; }
    } catch (e) { /* storage unavailable */ }
    return { items: {}, wishlist: false, orders: [] };
  }
  function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ } }

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function money(n) { return '£' + (Math.round(n * 100) / 100).toFixed(2); }
  function on(el, ev, fn) { if (el) el.addEventListener(ev, fn); }
  function packFor(n) { return PACKS[Math.max(1, Math.min(PACKS.length, n)) - 1]; }

  function cartLines() {
    return Object.keys(state.items).map(function (k) { return { pack: packFor(parseInt(k, 10)), qty: state.items[k] }; })
      .filter(function (l) { return l.qty > 0; }).sort(function (a, b) { return a.pack.n - b.pack.n; });
  }
  function totals(delivery) {
    var lines = cartLines();
    var count = lines.reduce(function (s, l) { return s + l.qty; }, 0);
    var subtotal = lines.reduce(function (s, l) { return s + l.qty * l.pack.price; }, 0);
    return { lines: lines, count: count, subtotal: subtotal, delivery: delivery || 0, total: subtotal + (delivery || 0) };
  }

  var toastTimer;
  function toast(msg) {
    var t = $('[data-toast]'); if (!t) return;
    t.textContent = msg; t.hidden = false; clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 2600);
  }

  /* ---------- header ---------- */
  var site = $('#site'); var lastCompact = null;
  function onScroll() { var c = window.scrollY > 40; if (c !== lastCompact) { site.classList.toggle('float-header', c); lastCompact = c; } }
  on(window, 'scroll', onScroll); onScroll();
  var toggler = $('#mobile-header');
  on(toggler, 'click', function () {
    var open = site.classList.toggle('is-nav-open');
    toggler.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('is-locked', open);
  });
  $$('.main-nav__link').forEach(function (a) { on(a, 'click', function () { site.classList.remove('is-nav-open'); toggler && toggler.setAttribute('aria-expanded', 'false'); document.body.classList.remove('is-locked'); }); });
  var sectionLinks = $$('.main-nav__link[href^="#"]');
  var sections = sectionLinks.map(function (a) { return $(a.getAttribute('href')); }).filter(Boolean);
  if ('IntersectionObserver' in window && sections.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (!en.isIntersecting) return; sectionLinks.forEach(function (a) { a.parentElement.classList.toggle('main-nav__item--selected', a.getAttribute('href') === '#' + en.target.id); }); });
    }, { rootMargin: '-40% 0px -50% 0px' });
    sections.forEach(function (s) { io.observe(s); });
  }

  /* ---------- search ---------- */
  var searchBar = $('#search-bar'), searchInput = $('#search-input'), searchResults = $('[data-search-results]');
  var INDEX = [
    { title: 'The Blamp™ — 1 for £19.99, 2 for £29.99, 3 for £34.99', href: '#shop', keys: 'blamp bag lamp light buy price pack torch' },
    { title: 'How to use The Blamp', href: '#how-to-use', keys: 'how use clip charge tap touch brightness instructions usb-c' },
    { title: 'FAQs — delivery, returns, battery, warranty', href: '#faqs', keys: 'faq delivery returns battery warranty shipping fit' },
    { title: 'Our story', href: '#our-story', keys: 'story founded 2026 about safe' }
  ];
  function openSearch() { searchBar.hidden = false; setTimeout(function () { searchInput.focus(); }, 30); }
  function closeSearch() { searchBar.hidden = true; searchInput.value = ''; searchResults.innerHTML = ''; }
  $$('[data-open-search]').forEach(function (b) { on(b, 'click', openSearch); });
  on($('[data-close-search]'), 'click', closeSearch);
  function escapeHtml(s) { return s.replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function runSearch() {
    var q = searchInput.value.trim().toLowerCase();
    if (!q) { searchResults.innerHTML = ''; return; }
    var hits = INDEX.filter(function (i) { return (i.title + ' ' + i.keys).toLowerCase().indexOf(q) !== -1; });
    searchResults.innerHTML = hits.length ? hits.map(function (h) { return '<p><a href="' + h.href + '">' + h.title + '</a></p>'; }).join('') : '<p>No results for “' + escapeHtml(q) + '”.</p>';
    $$('a', searchResults).forEach(function (a) { on(a, 'click', closeSearch); });
  }
  on(searchInput, 'input', runSearch);
  on($('[data-search-form]'), 'submit', function (e) { e.preventDefault(); runSearch(); var f = $('a', searchResults); if (f) { window.location.hash = f.getAttribute('href'); closeSearch(); } });

  /* ---------- gallery ---------- */
  var mainImg = $('#product-main-image');
  $$('.product__thumb').forEach(function (btn) {
    on(btn, 'click', function () { $$('.product__thumb').forEach(function (b) { b.classList.remove('is-active'); }); btn.classList.add('is-active'); mainImg.src = btn.getAttribute('data-image'); mainImg.alt = btn.getAttribute('data-alt') || ''; });
  });

  /* ---------- accordions ---------- */
  $$('[data-accordion] .accordion__trigger').forEach(function (btn) {
    on(btn, 'click', function () { var ex = btn.getAttribute('aria-expanded') === 'true'; var panel = document.getElementById(btn.getAttribute('aria-controls')); btn.setAttribute('aria-expanded', String(!ex)); if (panel) panel.hidden = ex; });
  });

  /* ---------- wishlist ---------- */
  function renderWishlist() {
    $$('[data-wishlist-toggle]').forEach(function (b) { b.setAttribute('aria-pressed', String(state.wishlist)); });
    $$('[data-wishlist-count]').forEach(function (c) { c.textContent = state.wishlist ? '1' : '0'; c.setAttribute('data-zero', String(!state.wishlist)); });
  }
  $$('[data-wishlist-toggle]').forEach(function (b) { on(b, 'click', function () { state.wishlist = !state.wishlist; save(); renderWishlist(); toast(state.wishlist ? 'The Blamp™ added to your wishlist' : 'Removed from your wishlist'); }); });

  /* ---------- pack picker ---------- */
  var qtyInput = $('#product-qty');
  var hearts = $$('[data-heart]');
  var packRows = $$('[data-pack-row]');
  var selected = 1;
  function renderPicker(animate) {
    var pack = packFor(selected);
    hearts.forEach(function (h) {
      var n = parseInt(h.getAttribute('data-heart'), 10), wasLit = h.classList.contains('is-lit'), lit = n <= selected;
      h.classList.toggle('is-lit', lit); h.setAttribute('aria-pressed', String(n === selected)); h.classList.remove('is-just-lit');
      if (animate && lit && !wasLit) { void h.offsetWidth; h.classList.add('is-just-lit'); }
    });
    packRows.forEach(function (r) { var n = parseInt(r.getAttribute('data-pack-row'), 10); r.classList.toggle('is-selected', n === selected); r.setAttribute('aria-pressed', String(n === selected)); });
    var now = $('[data-price-now]'), was = $('[data-price-was]'), saving = $('[data-price-saving]'), title = $('[data-pack-title]'), hint = $('[data-qty-hint]'), addBtn = $('[data-add-to-bag]');
    if (now) now.textContent = money(pack.price);
    if (was) was.textContent = money(pack.was);
    if (saving) saving.textContent = 'Save ' + money(pack.was - pack.price);
    if (title) title.textContent = pack.title;
    if (hint) {
      var single = PACKS[0].price;
      hint.textContent = pack.n > 1 ? money(pack.price / pack.n) + ' each — save ' + money(single * pack.n - pack.price) + ' against buying singly.' : pack.title;
    }
    if (addBtn) addBtn.textContent = 'Add To Bag — ' + money(pack.price);
    if (qtyInput) qtyInput.value = pack.n;
  }
  function setPack(n, animate) { selected = Math.max(1, Math.min(PACKS.length, parseInt(n, 10) || 1)); renderPicker(animate); }
  hearts.forEach(function (h) { on(h, 'click', function () { setPack(h.getAttribute('data-heart'), true); }); });
  packRows.forEach(function (r) { on(r, 'click', function () { setPack(r.getAttribute('data-pack-row'), true); }); });
  on($('[data-heart-picker]'), 'keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); setPack(selected + 1, true); hearts[selected - 1].focus(); }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); setPack(selected - 1, false); hearts[selected - 1].focus(); }
  });
  renderPicker(false);

  on($('[data-add-form]'), 'submit', function (e) {
    e.preventDefault();
    state.items[selected] = (state.items[selected] || 0) + 1;
    save(); renderCart(); openCart();
  });

  /* ---------- cart drawer ---------- */
  var overlay = $('[data-overlay]'), cart = $('#cart');
  function openCart() { cart.hidden = false; overlay.hidden = false; cart.setAttribute('aria-hidden', 'false'); document.body.classList.add('is-locked'); requestAnimationFrame(function () { cart.classList.add('is-open'); }); var c = $('[data-close-cart]', cart); c && c.focus(); }
  function closeCart() { cart.classList.remove('is-open'); cart.setAttribute('aria-hidden', 'true'); overlay.hidden = true; document.body.classList.remove('is-locked'); setTimeout(function () { cart.hidden = true; }, 350); }
  $$('[data-open-cart]').forEach(function (b) { on(b, 'click', openCart); });
  $$('[data-close-cart]').forEach(function (b) { on(b, 'click', closeCart); });
  on(overlay, 'click', closeCart);

  function setLine(n, qty) { qty = parseInt(qty, 10); if (isNaN(qty) || qty < 0) qty = 0; if (qty > 99) qty = 99; if (qty === 0) delete state.items[n]; else state.items[n] = qty; save(); renderCart(); }

  function renderCart() {
    var t = totals();
    $$('[data-cart-count]').forEach(function (c) { c.textContent = String(t.count); c.setAttribute('data-zero', String(t.count === 0)); });
    $('[data-cart-empty]').hidden = t.count > 0;
    $('[data-cart-footer]').hidden = t.count === 0;
    var items = $('[data-cart-items]'), hint = $('[data-offer-hint]');
    items.innerHTML = t.lines.map(function (l) {
      return '<li class="cart-item" data-pack="' + l.pack.n + '">' +
        '<div class="cart-item__img"><img src="' + PRODUCT.image + '" alt="" width="88" height="88"></div>' +
        '<div><p class="cart-item__name">' + PRODUCT.name + '</p>' +
        '<p class="cart-item__meta">' + l.pack.title + ' · ' + money(l.pack.price) + ' <s>' + money(l.pack.was) + '</s>' + (l.pack.tag ? ' · ' + l.pack.tag : '') + '</p>' +
        '<div class="cart-item__row"><div class="qty">' +
        '<button class="qty__btn" type="button" data-cart-dec aria-label="Fewer">−</button>' +
        '<input class="qty__input" type="number" min="0" max="99" value="' + l.qty + '" data-cart-qty aria-label="Number of packs">' +
        '<button class="qty__btn" type="button" data-cart-inc aria-label="More">+</button></div>' +
        '<div class="cart-item__price">' + money(l.qty * l.pack.price) + '</div></div>' +
        '<button class="cart-item__remove" type="button" data-cart-remove>Remove</button></div></li>';
    }).join('');
    $$('.cart-item', items).forEach(function (li) {
      var n = parseInt(li.getAttribute('data-pack'), 10), q = state.items[n] || 0;
      on($('[data-cart-dec]', li), 'click', function () { setLine(n, q - 1); });
      on($('[data-cart-inc]', li), 'click', function () { setLine(n, q + 1); });
      on($('[data-cart-qty]', li), 'change', function (e) { setLine(n, e.target.value); });
      on($('[data-cart-remove]', li), 'click', function () { setLine(n, 0); });
    });
    hint.hidden = true;
    $$('[data-cart-subtotal]').forEach(function (el) { el.textContent = money(t.subtotal); });
    $$('[data-discount-row]').forEach(function (el) { el.hidden = true; });
    $$('[data-cart-total]').forEach(function (el) { el.textContent = money(t.total); });
    renderCheckoutSummary();
  }

  /* ---------- checkout ---------- */
  var checkout = $('#checkout'), checkoutForm = $('[data-checkout-form]');
  function deliveryCost() { var s = checkoutForm.querySelector('input[name="delivery"]:checked'); return s ? parseFloat(s.value) || 0 : 0; }
  function renderCheckoutSummary() {
    var t = totals(deliveryCost()), list = $('[data-checkout-items]');
    list.innerHTML = t.count ? t.lines.map(function (l) { return '<li><span>' + PRODUCT.name + ' — ' + l.pack.title + ' × ' + l.qty + '</span><span>' + money(l.qty * l.pack.price) + '</span></li>'; }).join('') : '<li><span>Your bag is empty</span><span></span></li>';
    $('[data-checkout-delivery]').textContent = t.delivery ? money(t.delivery) : 'Free';
    $('[data-checkout-total]').textContent = money(t.total);
  }
  function showStep(name) { $$('[data-checkout-step]', checkout).forEach(function (s) { s.hidden = s.getAttribute('data-checkout-step') !== name; }); }
  function openCheckout() { if (!totals().count) { toast('Your bag is empty'); return; } closeCart(); showStep('form'); renderCheckoutSummary(); checkout.hidden = false; document.body.classList.add('is-locked'); checkout.scrollTop = 0; var f = checkoutForm.querySelector('input'); f && f.focus(); }
  function closeCheckout() { checkout.hidden = true; document.body.classList.remove('is-locked'); }
  $$('[data-open-checkout]').forEach(function (b) { on(b, 'click', openCheckout); });
  $$('[data-close-checkout]').forEach(function (b) { on(b, 'click', closeCheckout); });
  $$('input[name="delivery"]', checkoutForm).forEach(function (r) { on(r, 'change', renderCheckoutSummary); });
  var cardNumber = checkoutForm.querySelector('[name="cardNumber"]');
  on(cardNumber, 'input', function () { var v = cardNumber.value.replace(/\D/g, '').slice(0, 19); cardNumber.value = v.replace(/(.{4})/g, '$1 ').trim(); });
  var cardExpiry = checkoutForm.querySelector('[name="cardExpiry"]');
  on(cardExpiry, 'input', function () { var v = cardExpiry.value.replace(/\D/g, '').slice(0, 4); cardExpiry.value = v.length > 2 ? v.slice(0, 2) + ' / ' + v.slice(2) : v; });
  function luhn(num) { var s = 0, alt = false; for (var i = num.length - 1; i >= 0; i--) { var d = parseInt(num.charAt(i), 10); if (alt) { d *= 2; if (d > 9) d -= 9; } s += d; alt = !alt; } return num.length >= 13 && s % 10 === 0; }
  on(checkoutForm, 'submit', function (e) {
    e.preventDefault();
    var err = $('[data-checkout-error]'); err.hidden = true; var problems = [];
    $$('input', checkoutForm).forEach(function (i) { i.classList.remove('is-invalid'); });
    function bad(name, msg) { var f = checkoutForm.querySelector('[name="' + name + '"]'); if (f) f.classList.add('is-invalid'); problems.push(msg); }
    var d = {}; $$('input, select', checkoutForm).forEach(function (f) { if (f.type === 'radio') { if (f.checked) d[f.name] = f.value; } else d[f.name] = f.value.trim(); });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) bad('email', 'Enter a valid email address.');
    ['firstName', 'lastName', 'address1', 'city'].forEach(function (k) { if (!d[k]) bad(k, 'Complete your delivery address.'); });
    if (!/^[A-Za-z]{1,2}\d[A-Za-z\d]?\s*\d[A-Za-z]{2}$/.test(d.postcode)) bad('postcode', 'Enter a valid UK postcode.');
    if (!d.cardName) bad('cardName', 'Enter the name on your card.');
    if (!luhn((d.cardNumber || '').replace(/\D/g, ''))) bad('cardNumber', 'Check your card number.');
    var exp = (d.cardExpiry || '').replace(/\D/g, '');
    if (exp.length !== 4) bad('cardExpiry', 'Enter the card expiry as MM / YY.');
    else { var mm = parseInt(exp.slice(0, 2), 10), yy = 2000 + parseInt(exp.slice(2), 10); if (mm < 1 || mm > 12 || new Date(yy, mm, 0) < new Date()) bad('cardExpiry', 'Your card has expired.'); }
    if (!/^\d{3,4}$/.test(d.cardCvc)) bad('cardCvc', 'Enter your card security code.');
    if (problems.length) { err.textContent = problems.filter(function (v, i, a) { return a.indexOf(v) === i; }).join(' '); err.hidden = false; var fb = checkoutForm.querySelector('.is-invalid'); fb && fb.focus(); return; }
    var t = totals(deliveryCost()); var ref = 'BL-' + Date.now().toString(36).toUpperCase().slice(-6);
    state.orders.push({ ref: ref, lines: t.lines.map(function (l) { return { pack: l.pack.n, qty: l.qty }; }), total: t.total, email: d.email, at: new Date().toISOString() });
    $('[data-order-ref]').textContent = ref; $('[data-order-email]').textContent = d.email;
    $('[data-order-summary]').textContent = t.lines.map(function (l) { return l.qty + ' × ' + l.pack.title; }).join(', ') + ' — ' + money(t.total) + ' including delivery.';
    state.items = {}; save(); renderCart(); checkoutForm.reset(); showStep('confirm'); checkout.scrollTop = 0;
  });

  /* ---------- account modal + newsletter ---------- */
  var account = $('#account');
  $$('[data-open-account]').forEach(function (b) { on(b, 'click', function (e) { e.preventDefault(); account.hidden = false; document.body.classList.add('is-locked'); }); });
  $$('[data-close-account]').forEach(function (b) { on(b, 'click', function () { account.hidden = true; document.body.classList.remove('is-locked'); }); });
  on(account, 'click', function (e) { if (e.target === account) { account.hidden = true; document.body.classList.remove('is-locked'); } });
  $$('[data-signup-form]').forEach(function (form) {
    on(form, 'submit', function (e) {
      e.preventDefault(); var input = form.querySelector('input[type="email"]'); var msg = form.parentElement.querySelector('[data-signup-msg]') || form.querySelector('[data-signup-msg]');
      if (!input.checkValidity()) { msg.textContent = 'Please enter a valid email address.'; return; }
      try { var list = JSON.parse(localStorage.getItem('blamp-signups') || '[]'); if (list.indexOf(input.value) === -1) list.push(input.value); localStorage.setItem('blamp-signups', JSON.stringify(list)); } catch (err) { /* ignore */ }
      msg.textContent = 'Thank you — you\'re on the list.'; input.value = '';
    });
  });

  on(document, 'keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!checkout.hidden) closeCheckout(); else if (!cart.hidden) closeCart(); else if (!account.hidden) { account.hidden = true; document.body.classList.remove('is-locked'); } else if (!searchBar.hidden) closeSearch(); else if (site.classList.contains('is-nav-open')) toggler.click();
  });

  renderWishlist(); renderCart();
})();
