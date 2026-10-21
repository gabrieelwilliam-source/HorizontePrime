(function () {
  'use strict';
  var U = window.ImobUtils;
  var cfg = window.SITE_CONFIG || {};
  var businessName = cfg.businessName || 'Horizonte Prime Imóveis';
  if (!U) return;
  var properties = U.catalog();
  var root = document.getElementById('property-root');

  function requestedCode() {
    var q = new URLSearchParams(location.search);
    return String(q.get('codigo') || q.get('code') || q.get('ref') || '').toUpperCase();
  }
  function findProperty() {
    var code = requestedCode();
    return properties.find(function (p) { return String(p.listingCode || '').toUpperCase() === code; }) || null;
  }
  function costLine(label, value) {
    if (value === undefined || value === null || value === '') return '';
    return '<div class="cost-item"><span>' + U.esc(label) + '</span><strong>' + (typeof value === 'number' ? U.money(value) : U.esc(value)) + '</strong></div>';
  }
  function stat(value, label) { return '<div class="property-stat"><strong>' + U.esc(value) + '</strong><span>' + U.esc(label) + '</span></div>'; }

  function categoryLabel(c) {
    c = String(c || '').toLowerCase();
    var labels = { apartamento: 'Apartamento', casa: 'Casa', sobrado: 'Sobrado', studio: 'Studio', cobertura: 'Cobertura', comercial: 'Comercial', galpao: 'Galpão', terreno: 'Terreno' };
    return labels[c] || c || 'Imóvel';
  }
  function propertyStats(p) {
    var c = String((p && p.category) || '').toLowerCase();
    if (c === 'terreno') {
      return stat(categoryLabel(c), 'Tipo') + stat((p.areaM2 || 0) + ' m²', 'Área') + stat(p.neighborhood || '', 'Bairro');
    }
    if (c === 'comercial' || c === 'galpao') {
      return stat(categoryLabel(c), 'Tipo') + stat(p.bathrooms || 0, 'Banheiros') + stat(p.parkingSpots || 0, 'Vagas') + stat((p.areaM2 || 0) + ' m²', 'Área') + (p.landAreaM2>0&&c!=='terreno'?stat(p.landAreaM2+' m²','Terreno'):'');
    }
    return stat(p.bedrooms || 0, 'Quartos') + stat(p.suites || 0, 'Suítes') + stat(p.bathrooms || 0, 'Banheiros') + stat(p.parkingSpots || 0, 'Vagas') + stat((p.areaM2 || 0) + ' m²', 'Área') + (p.landAreaM2>0&&c!=='terreno'?stat(p.landAreaM2+' m²','Terreno'):'');
  }
  function relatedCard(p) {
    var img = U.imgPath(p.imageUrl || (p.images && p.images[0] && p.images[0].url) || 'property-fallback.jpg');
    var url = p.listingUrl || ('imovel.html?codigo=' + p.listingCode);
    return '<article class="property-card"><a class="property-image" href="' + U.esc(url) + '"><img src="' + U.esc(img) + '" alt="' + U.esc(p.title) + '" loading="lazy" onerror="this.src=\'property-fallback.jpg\'"><div class="badge-stack"><span class="badge badge-dark">' + U.esc(U.purposeLabel(p.purpose)) + '</span></div></a><div class="card-content"><h3><a href="' + U.esc(url) + '">' + U.esc(p.title) + '</a></h3><div class="card-location">' + U.esc(p.neighborhood + ', ' + p.city) + '</div><div class="card-price">' + U.propertyPrice(p) + '</div><div class="card-actions"><a class="button button-secondary" href="' + U.esc(url) + '">Ver imóvel</a></div></div></article>';
  }

  function render(p) {
    if (!root || !p) return;
    var imgs = (Array.isArray(p.images) && p.images.length ? p.images : [{ url: p.imageUrl, alt: p.title }]).map(function (i) { return { url: U.imgPath(i.url || i.imageUrl || p.imageUrl), alt: i.alt || p.title }; });
    var main = imgs[0] || { url: 'property-fallback.jpg', alt: p.title };
    var price = U.propertyPrice(p);
    document.title = p.title + ' | ' + businessName;
    var related = properties.filter(function (x) { return x.listingCode !== p.listingCode && (x.neighborhood === p.neighborhood || x.category === p.category || x.purpose === p.purpose); }).slice(0, 3);
    if (related.length < 3) related = related.concat(properties.filter(function (x) { return x.listingCode !== p.listingCode && !related.includes(x); }).slice(0, 3 - related.length));

    root.innerHTML = '' +
      '<section class="property-top"><div class="breadcrumb"><a href="index.html">Início</a> › <a href="index.html#catalogo">Imóveis</a> › ' + U.esc(p.title) + '</div><div class="property-title-wrap"><div><div class="property-badges"><span class="pill pill-dark">' + U.esc(U.purposeLabel(p.purpose)) + '</span><span class="pill pill-soft">Código ' + U.esc(p.listingCode) + '</span>' + (p.isFeatured ? '<span class="pill pill-soft">Destaque</span>' : '') + '</div><h1>' + U.esc(p.title) + '</h1><div class="property-location">' + U.esc([p.neighborhood, p.city, p.stateCode].filter(Boolean).join(', ').replace(', SC', ' - SC')) + '</div></div><a class="share-btn" href="#" id="share-property" title="Copiar link">🔗</a></div>' +
      '<div class="gallery-pro"><div class="gallery-main"><img id="main-gallery-image" src="' + U.esc(main.url) + '" alt="' + U.esc(main.alt) + '" onerror="this.src=\'property-fallback.jpg\'"></div><div class="gallery-side">' + imgs.map(function (img, idx) { return '<button type="button" class="gallery-thumb" data-src="' + U.esc(img.url) + '" data-alt="' + U.esc(img.alt) + '"><img src="' + U.esc(img.url) + '" alt="' + U.esc(img.alt) + '" onerror="this.src=\'property-fallback.jpg\'">' + (idx === 3 && imgs.length > 4 ? '<span class="gallery-more">+' + (imgs.length - 4) + ' fotos</span>' : '') + '</button>'; }).join('') + '</div></div></section>' +
      '<section class="property-body"><div><div class="property-stats">' + propertyStats(p) + '</div>' +
      (p.demoOnly?'<p class="demo-disclosure property-disclosure">Imóvel e valores fictícios para demonstração. Imagens ilustrativas.</p>':'') +
      '<div class="property-section"><h2>Sobre este imóvel</h2><p>' + U.esc(p.description || '') + '</p><p><strong>' + U.esc(p.highlight || '') + '</strong></p></div>' +
      '<div class="property-section"><h2>Diferenciais</h2><div class="amenities">' + (p.amenities || []).map(function (a) { return '<span class="amenity">' + U.esc(a) + '</span>'; }).join('') + (p.acceptsPet ? '<span class="amenity">Aceita animais</span>' : '') + '</div></div>' +
      '<div class="property-section"><h2>Custos e informações</h2><div class="cost-grid">' + costLine(p.purpose === 'locacao' ? 'Aluguel' : 'Valor de venda', p.purpose === 'locacao' ? (p.rentValue || p.priceFrom) : (p.salePrice || p.priceFrom)) + costLine('Condomínio', p.condoFee == null ? 'A confirmar' : p.condoFee) + costLine('IPTU — periodicidade a confirmar', p.iptu == null ? 'A confirmar' : p.iptu) + '</div></div>' +
      '<div class="property-section"><h2>Localização</h2><div class="location-box"><div><strong>' + U.esc(p.neighborhood + ', ' + p.city + ' - ' + p.stateCode) + '</strong><p>Endereço completo informado durante o atendimento para preservar segurança e privacidade.</p></div></div></div></div>' +
      '<aside><div class="price-card"><small>' + U.esc(p.purpose === 'locacao' ? 'Valor mensal' : 'Valor do imóvel') + '</small><strong>' + U.esc(price) + '</strong><div class="price-meta"><div><span>Código</span><strong>' + U.esc(p.listingCode) + '</strong></div><div><span>Finalidade</span><strong>' + U.esc(U.purposeLabel(p.purpose)) + '</strong></div><div><span>Bairro</span><strong>' + U.esc(p.neighborhood) + '</strong></div></div><button class="button button-primary" type="button" id="property-interest">Tenho interesse</button><a class="button button-secondary" data-whatsapp-link href="#">Chamar no WhatsApp</a><p class="side-note">Confirme disponibilidade, valores, taxas, endereço completo e condições comerciais com o atendimento.</p></div></aside></section>' +
      '<section class="related-section"><div class="section-heading"><div><span class="eyebrow dark">Você também pode gostar</span><h2>Imóveis relacionados</h2></div><a class="text-link" href="index.html#catalogo">Ver catálogo completo →</a></div><div class="property-grid related-grid">' + related.map(relatedCard).join('') + '</div></section>';

    bind(p, imgs);
  }

  function bind(p, imgs) {
    document.querySelectorAll('.gallery-thumb').forEach(function (btn) {
      btn.addEventListener('click', function () { var main = document.getElementById('main-gallery-image'); if (main) { main.src = btn.dataset.src; main.alt = btn.dataset.alt || p.title; } });
    });
    var share = document.getElementById('share-property');
    if (share) share.addEventListener('click', function (e) { e.preventDefault(); if (navigator.clipboard) navigator.clipboard.writeText(location.href); if (window.HorizonteToast) window.HorizonteToast('Link do imóvel copiado.'); else alert('Link do imóvel copiado.'); });
    var interest = document.getElementById('property-interest');
    if (interest) interest.addEventListener('click', function () {
      if (window.openLeadModal) window.openLeadModal({ type: 'property', code: p.listingCode, propertyTitle: p.title, url: location.href, title: 'Tenho interesse neste imóvel', description: p.title + ' • Código ' + p.listingCode, message: 'Olá, tenho interesse no imóvel ' + p.listingCode + ' - ' + p.title + '. Gostaria de mais informações e disponibilidade.' });
    });
    document.querySelectorAll('[data-whatsapp-link]').forEach(function (a) { a.href = U.buildWhatsappUrl('Olá, tenho interesse no imóvel ' + p.listingCode + ' - ' + p.title + '.'); });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!properties.length) { if (root) root.innerHTML = '<div class="not-found"><h1>Nenhum imóvel cadastrado</h1><p>Tente novamente ou volte para o catálogo.</p></div>'; return; }
    var selected = findProperty();
    if (!selected) { if (root) root.innerHTML = '<section class="not-found"><h1>Imóvel não encontrado</h1><p>Esta referência não está no catálogo atual.</p><a class="button button-primary" href="index.html#catalogo">Voltar ao catálogo</a></section>'; return; }
    render(selected);
  });
})();
