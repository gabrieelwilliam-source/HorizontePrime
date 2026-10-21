(function () {
  'use strict';
  var U = window.ImobUtils;
  if (!U) return;
  var state = { query: '', purpose: '', category: '', neighborhood: '', bedrooms: '', parking: '', price: '', pet: false, sort: 'featured' };
  var properties = U.catalog();
  var F = window.PropertyFeatures;
  var visibleLimit=9;
  state.features={};


  function categoryLabel(c) {
    c = String(c || '').toLowerCase();
    var labels = {
      apartamento: 'Apartamento',
      casa: 'Casa',
      sobrado: 'Sobrado',
      studio: 'Studio',
      cobertura: 'Cobertura',
      comercial: 'Comercial',
      galpao: 'Galpão',
      terreno: 'Terreno'
    };
    return labels[c] || c || 'Imóvel';
  }

  function statIcon(value, label) {
    if (value === undefined || value === null || value === '') return '';
    return '<span><strong>' + U.esc(value) + '</strong> ' + U.esc(label) + '</span>';
  }

  function cardStats(p) {
    var c = String((p && p.category) || '').toLowerCase();
    if (c === 'terreno') {
      return statIcon(categoryLabel(c), 'tipo') + statIcon((p.areaM2 || 0) + ' m²', 'área');
    }
    if (c === 'comercial' || c === 'galpao') {
      return statIcon(categoryLabel(c), 'tipo') + statIcon(p.bathrooms || 0, 'banheiros') + statIcon(p.parkingSpots || 0, Number(p.parkingSpots)===1?'vaga':'vagas') + statIcon((p.areaM2 || 0) + ' m²', 'área');
    }
    return statIcon(p.bedrooms || 0, Number(p.bedrooms)===1?'quarto':'quartos') + statIcon(p.suites || 0, Number(p.suites)===1?'suíte':'suítes') + statIcon(p.parkingSpots || 0, Number(p.parkingSpots)===1?'vaga':'vagas') + statIcon((p.areaM2 || 0) + ' m²', 'área');
  }

  function card(p) {
    var url = p.listingUrl || ('imovel.html?codigo=' + encodeURIComponent(p.listingCode));
    var img = U.imgPath(p.imageUrl || (p.images && p.images[0] && p.images[0].url) || 'property-fallback.jpg');
    var price = U.propertyPrice(p);
    var monthly = p.purpose === 'locacao' ? '<small> locação</small>' : '<small> venda</small>';
    return '' +
      '<article class="property-card" data-code="' + U.esc(p.listingCode) + '">' +
        '<a class="property-image" href="' + U.esc(url) + '"><img src="' + U.esc(img) + '" alt="' + U.esc(p.title) + '" loading="lazy" onerror="this.src=\'property-fallback.jpg\'"><div class="badge-stack"><span class="badge badge-dark">' + U.esc(U.purposeLabel(p.purpose)) + '</span>' + (p.isFeatured ? '<span class="badge badge-soft">Destaque</span>' : '') + '</div></a>' +
        '<div class="card-content"><h3><a href="' + U.esc(url) + '">' + U.esc(p.title) + '</a></h3><div class="card-location">' + U.esc(p.neighborhood + ', ' + p.city + ' - ' + p.stateCode) + '</div><div class="card-price">' + price + monthly + '</div>' +
        '<div class="card-stats">' + cardStats(p) + '</div>' +
        (p.propertyFeatures ? '<div class="card-features">'+Object.keys(p.propertyFeatures).filter(function(k){return ['pool','private_pool','yard','furnished','single_story','gated','accessible'].includes(k)&&p.propertyFeatures[k]===true&&!(k==='pool'&&p.propertyFeatures.private_pool===true);}).slice(0,3).map(function(k){return '<span>'+U.esc(F.definitions[k].label)+'</span>';}).join('')+'</div>':'') +
        '<div class="card-actions"><a class="button button-secondary" href="' + U.esc(url) + '">Ver detalhes</a><button class="button button-primary interest-btn" type="button" data-code="' + U.esc(p.listingCode) + '">Tenho interesse</button></div></div>' +
      '</article>';
  }

  function matches(p) {
    var hay = U.normalize([p.title, p.neighborhood, p.city, p.listingCode, p.category, (p.amenities || []).join(' ')].join(' '));
    if (state.query && hay.indexOf(U.normalize(state.query)) < 0) return false;
    if (state.purpose && p.purpose !== state.purpose) return false;
    if (state.category && p.category !== state.category) return false;
    if (state.neighborhood && p.neighborhood !== state.neighborhood) return false;
    if (state.bedrooms && Number(p.bedrooms || 0) < Number(state.bedrooms)) return false;
    if (state.parking && Number(p.parkingSpots || 0) < Number(state.parking)) return false;
    if (state.price && Number(p.priceFrom || p.salePrice || p.rentValue || 0) > Number(state.price)) return false;
    if (state.pet && !p.acceptsPet) return false;
    if (F && !F.evaluate(p,state.features).matches) return false;
    return true;
  }

  function sorted(list) {
    return list.slice().sort(function (a, b) {
      if (state.sort === 'price-asc') return Number(a.priceFrom || 0) - Number(b.priceFrom || 0);
      if (state.sort === 'price-desc') return Number(b.priceFrom || 0) - Number(a.priceFrom || 0);
      if (state.sort === 'area-desc') return Number(b.areaM2 || 0) - Number(a.areaM2 || 0);
      return Number(!!b.isFeatured) - Number(!!a.isFeatured) || Number(b.priceFrom || 0) - Number(a.priceFrom || 0);
    });
  }

  function renderStats() {
    var total = document.getElementById('stat-total'); if (total) total.textContent = properties.length;
    var sale = document.getElementById('stat-sale'); if (sale) sale.textContent = properties.filter(function (p) { return p.purpose === 'compra' || p.purpose === 'investimento'; }).length;
    var rent = document.getElementById('stat-rent'); if (rent) rent.textContent = properties.filter(function (p) { return p.purpose === 'locacao'; }).length;
  }

  function renderFeatured() {
    var root = document.getElementById('featured-grid'); if (!root) return;
    var featured = properties.filter(function (p) { return p.isFeatured; }).slice(0, 3);
    if (!featured.length) featured = properties.slice(0, 3);
    root.innerHTML = featured.map(card).join('');
  }

  function renderCatalog() {
    var grid = document.getElementById('catalog-grid'); var empty = document.getElementById('catalog-empty'); var summary = document.getElementById('catalog-summary');
    if (!grid) return;
    var list = sorted(properties.filter(matches));
    grid.innerHTML = list.slice(0,visibleLimit).map(card).join('');
    var more=document.getElementById('catalog-load-more');if(more)more.classList.toggle('hidden',list.length<=visibleLimit);
    window.HorizonteSearchCriteria={property_features:state.features,summary:F?F.summary(state.features):''};
    if (summary) summary.textContent = list.length + (list.length===1?' imóvel encontrado · exibindo ':' imóveis encontrados · exibindo ') + Math.min(visibleLimit,list.length) + '.';
    if (empty) empty.classList.toggle('hidden', list.length > 0);
    renderActiveFilters();
    bindInterestButtons();
  }

  function renderActiveFilters() {
    var root = document.getElementById('active-filters'); if (!root) return;
    var chips = [];
    if (state.query) chips.push('Busca: ' + state.query);
    if (state.purpose) chips.push(U.purposeLabel(state.purpose));
    if (state.category) chips.push(state.category);
    if (state.neighborhood) chips.push(state.neighborhood);
    if (state.bedrooms) chips.push(state.bedrooms + '+ quartos');
    if (state.parking) chips.push(state.parking + '+ vagas');
    if (state.price) chips.push('Até ' + U.money(state.price));
    if (state.pet) chips.push('Aceita animais');
    if (F) Object.keys(state.features).forEach(function(k){chips.push(F.summary({[k]:state.features[k]}));});
    root.innerHTML = chips.map(function (c) { return '<span class="filter-chip">' + U.esc(c) + '</span>'; }).join('');
  }

  function renderNeighborhoods() {
    var root = document.getElementById('neighborhood-grid'); if (!root) return;
    var counts = {};
    properties.forEach(function (p) { counts[p.neighborhood] = (counts[p.neighborhood] || 0) + 1; });
    root.innerHTML = Object.keys(counts).sort().map(function (n) {
      return '<button class="neighborhood-card" type="button" data-neighborhood="' + U.esc(n) + '"><strong>' + U.esc(n) + '</strong><span>' + counts[n] + (counts[n] > 1 ? ' imóveis disponíveis' : ' imóvel disponível') + '</span></button>';
    }).join('');
    U.$$('.neighborhood-card', root).forEach(function (btn) {
      btn.addEventListener('click', function () { setControl('filter-neighborhood', btn.dataset.neighborhood || ''); location.hash = '#catalogo'; renderCatalog(); });
    });
  }

  function fillNeighborhoods() {
    var select = document.getElementById('filter-neighborhood'); if (!select) return;
    var names = Array.from(new Set(properties.map(function (p) { return p.neighborhood; }).filter(Boolean))).sort();
    names.forEach(function (n) { var opt = document.createElement('option'); opt.value = n; opt.textContent = n; select.appendChild(opt); });
  }

  function setControl(id, value) {
    var el = document.getElementById(id); if (!el) return;
    if (el.type === 'checkbox') el.checked = !!value; else el.value = value || '';
    readControls();
  }
  function readControls() {
    state.query = (document.getElementById('filter-query') || {}).value || '';
    state.purpose = (document.getElementById('filter-purpose') || {}).value || '';
    state.category = (document.getElementById('filter-category') || {}).value || '';
    state.neighborhood = (document.getElementById('filter-neighborhood') || {}).value || '';
    state.bedrooms = (document.getElementById('filter-bedrooms') || {}).value || '';
    state.parking = (document.getElementById('filter-parking') || {}).value || '';
    state.price = (document.getElementById('filter-price') || {}).value || '';
    state.pet = !!((document.getElementById('filter-pet') || {}).checked);
    state.features={};
    document.querySelectorAll('[data-feature]').forEach(function(el){
      var k=el.dataset.feature,v=el.value;if(!v)return;
      if(k==='pool' && (v==='private'||v==='shared')){state.features.pool={value:true,mode:'required'};state.features.private_pool={value:v==='private',mode:'required'};}
      else if(F.numeric[k]){if(Number(v)>0)state.features[k]={value:Number(v),mode:'required'};}
      else state.features[k]={value:v==='true',mode:'required'};
    });
    visibleLimit=9;
    state.sort = (document.getElementById('sort-properties') || {}).value || 'featured';
  }

  function setupFilters() {
    var ids = ['filter-query', 'filter-purpose', 'filter-category', 'filter-neighborhood', 'filter-bedrooms', 'filter-parking', 'filter-price', 'filter-pet', 'sort-properties'];
    document.querySelectorAll('[data-feature]').forEach(function(el){ids.push(el.id);});
    var more=document.getElementById('catalog-load-more');if(more)more.addEventListener('click',function(){visibleLimit+=9;renderCatalog();});
    ids.forEach(function (id) { var el = document.getElementById(id); if (el) el.addEventListener(id === 'filter-query' ? 'input' : 'change', function () { readControls(); renderCatalog(); }); });
    var clear = document.querySelector('.clear-filters'); if (clear) clear.addEventListener('click', function () { ids.forEach(function (id) { var el = document.getElementById(id); if (!el) return; if (el.type === 'checkbox') el.checked = false; else el.value = id === 'sort-properties' ? 'featured' : ''; }); readControls(); renderCatalog(); });
    var toggle = document.querySelector('.filter-toggle'); var panel = document.getElementById('catalog-filters');
    function closeFilters(){if(!panel||!toggle)return;panel.classList.remove('open');toggle.setAttribute('aria-expanded','false');panel.removeAttribute('role');panel.removeAttribute('aria-modal');toggle.focus();}
    var apply=document.getElementById('filters-apply');if(apply)apply.addEventListener('click',closeFilters);
    if (toggle && panel) toggle.addEventListener('click', function () { var open = panel.classList.toggle('open'); toggle.setAttribute('aria-expanded', open ? 'true' : 'false');if(open&&window.matchMedia('(max-width:760px)').matches){panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Filtrar imóveis');var first=panel.querySelector('button,input,select');if(first)first.focus();}else{panel.removeAttribute('role');panel.removeAttribute('aria-modal');} });
    document.addEventListener('keydown',function(e){if(!panel||!panel.classList.contains('open')||!window.matchMedia('(max-width:760px)').matches)return;if(e.key==='Escape'){closeFilters();return;}if(e.key==='Tab'){var focusables=Array.from(panel.querySelectorAll('button,input,select,summary')).filter(function(el){return el.getClientRects().length>0;});var first=focusables[0],last=focusables[focusables.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
    document.querySelectorAll('[data-footer-purpose]').forEach(function (a) { a.addEventListener('click', function () { setTimeout(function () {
      var p = a.getAttribute('data-footer-purpose') || '';
      setControl('filter-purpose', p);
      document.querySelectorAll('.search-tab').forEach(function (t) {
        var active = (t.getAttribute('data-purpose') || '') === p;
        t.classList.toggle('active', active);
        t.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      renderCatalog();
    }, 60); }); });
  }

  function setupHeroSearch() {
    var form = document.getElementById('hero-search-form'); if (!form) return;
    var purpose = '';

    function setActiveTab(activeTab) {
      document.querySelectorAll('.search-tab').forEach(function (t) {
        var isActive = t === activeTab;
        t.classList.toggle('active', isActive);
        t.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
      purpose = activeTab ? (activeTab.getAttribute('data-purpose') || '') : '';
    }

    function applyHeroSearch(shouldScroll) {
      setControl('filter-query', (document.getElementById('hero-query') || {}).value || '');
      setControl('filter-category', (document.getElementById('hero-category') || {}).value || '');
      setControl('filter-purpose', purpose);
      renderCatalog();
      if (shouldScroll) {
        var catalog = document.getElementById('catalogo');
        if (catalog && catalog.scrollIntoView) catalog.scrollIntoView({ behavior: 'smooth', block: 'start' });
        else location.hash = '#catalogo';
      }
    }

    document.querySelectorAll('.search-tab').forEach(function (tab) {
      if (tab.classList.contains('active')) purpose = tab.getAttribute('data-purpose') || '';
      tab.addEventListener('click', function () {
        setActiveTab(tab);
        applyHeroSearch(true);
      });
    });

    var category = document.getElementById('hero-category');
    if (category) category.addEventListener('change', function () { applyHeroSearch(false); });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      applyHeroSearch(true);
    });
  }

  function bindInterestButtons() {
    document.querySelectorAll('.interest-btn').forEach(function (btn) {
      if (btn.dataset.bound) return; btn.dataset.bound = '1';
      btn.addEventListener('click', function () {
        var p = properties.find(function (x) { return String(x.listingCode) === String(btn.dataset.code); });
        if (!p || !window.openLeadModal) return;
        window.openLeadModal({ type: 'property', code: p.listingCode, propertyTitle: p.title, url: new URL(p.listingUrl || ('imovel.html?codigo=' + p.listingCode), location.href).href, title: 'Tenho interesse neste imóvel', description: p.title + ' • Código ' + p.listingCode, message: 'Olá, tenho interesse no imóvel ' + p.listingCode + ' - ' + p.title + '. Gostaria de mais informações.' });
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderStats(); fillNeighborhoods(); renderFeatured(); renderNeighborhoods(); setupFilters(); setupHeroSearch(); readControls(); renderCatalog(); bindInterestButtons();
  });
})();
