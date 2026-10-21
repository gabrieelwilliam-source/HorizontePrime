const fs=require('fs'),vm=require('vm'),assert=require('node:assert/strict'),path=require('path');const root=path.resolve(__dirname,'..'),window={};
vm.runInNewContext(fs.readFileSync(path.join(root,'imoveis-data.js'),'utf8'),{window});vm.runInNewContext(fs.readFileSync(path.join(root,'property-features.js'),'utf8'),{window});const rows=window.DEMO_PROPERTIES,F=window.PropertyFeatures;
assert.equal(rows.length,34);assert.equal(new Set(rows.map(r=>r.listingCode)).size,34);
const added=rows.filter(r=>r.source==='zaion_demo_catalog_20261021');assert.equal(added.length,12);
for(const row of added){assert.equal(row.demoOnly,true);assert.ok(row.priceFrom>0);assert.ok(row.images.length);for(const img of row.images)assert.ok(fs.existsSync(path.join(root,img.url)),img.url);assert.equal(row.purpose==='locacao'?row.rentValue:row.salePrice,row.priceFrom);}
const criteria=t=>F.parse(t).updates;const codes=(t,where=()=>true)=>rows.filter(where).filter(r=>F.evaluate(r,criteria(t)).matches).map(r=>r.listingCode);
assert.ok(codes('Com piscina privativa',r=>r.purpose==='compra').includes('V10202'));
assert.ok(!codes('Com piscina privativa').includes('L10206'));
assert.ok(codes('Com piscina no condomínio').includes('L10206'));
assert.ok(!codes('Com piscina no condomínio').includes('L10205'));
assert.ok(codes('Sem piscina e sem quintal').includes('V10208'));
assert.ok(!codes('Sem piscina e sem quintal').includes('V10004')); // unknown is not false
assert.ok(codes('Com acessibilidade').includes('L10211'));
assert.ok(codes('Com terreno de 600 m²').includes('V10203'));
assert.ok(!codes('Com terreno de 600 m²').includes('V10202'));
const fields={'#lead-name':'Pessoa QA','#lead-phone':'(00) 00000-0000','#lead-email':'','#lead-message':'Procuro um imóvel.','#lead-listing-code':'','#lead-listing-title':'','#lead-listing-url':'','#lead-form-type':'buyer','#lead-scenario':'site'};
const form={dataset:{},querySelector:s=>({value:fields[s]||''})};const document={querySelector:()=>null,querySelectorAll:()=>[],addEventListener(){},title:'QA',referrer:''};window.SITE_CONFIG={tenantId:'horizonte-prime'};window.HorizonteSearchCriteria={purpose:'locacao',property_features:{pool:{value:true,mode:'required'}},summary:'Aluguel • casa • bairro Santo Antônio • 3 quartos • até R$ 6.000 • com piscina'};
vm.runInNewContext(fs.readFileSync(path.join(root,'site.js'),'utf8'),{window,document,location:{href:'https://example.invalid/',pathname:'/',search:'',hash:''},navigator:{userAgent:'QA'},URLSearchParams,Date,setTimeout,clearTimeout});
const payload=window.ImobUtils.buildLeadPayload(form);assert.equal(payload.finalidade,'locacao');assert.ok(payload.message.includes('Santo Antônio'));assert.equal(payload.property_features.pool.value,true);
const backend=process.argv[2];if(backend){const data=JSON.parse(fs.readFileSync(backend));const by=new Map(data.listings.map(r=>[r.listingCode,r]));assert.equal(by.size,rows.length);for(const r of rows){const b=by.get(r.listingCode);assert.ok(b);for(const k of['purpose','category','neighborhood','priceFrom','bedrooms','parkingSpots'])assert.equal(b[k],r[k],r.listingCode+':'+k);if(r.demoOnly)assert.deepEqual(b.propertyFeatures,JSON.parse(JSON.stringify(r.propertyFeatures)));}}
console.log('Catalog, photos, feature filters, payload and optional backend parity: PASS');
