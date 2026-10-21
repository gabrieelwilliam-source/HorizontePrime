// Iana advanced property criteria v1. Pure, deterministic and independent of LLM output.
const PropertyFeatures = (() => {
 const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/²/g,'2').replace(/\s+/g,' ').trim();
 const definitions={
  pool:{label:'piscina',re:'piscinas?',fields:['hasPool','pool','piscina']},
  private_pool:{label:'piscina privativa',re:'piscina (?:privativa|privada|exclusiva)',fields:['privatePool','hasPrivatePool']},
  yard:{label:'quintal',re:'quintal|quintais',fields:['hasYard','yard','quintal']},
  outdoor_space:{label:'área externa privativa',re:'area externa(?: privativa)?|espaco externo|terreno(?: proprio|privativo)?',fields:['hasOutdoorSpace','outdoorSpace','hasLand']},
  garden:{label:'jardim',re:'jardim|jardins',fields:['hasGarden','garden']},
  pets:{label:'aceitação de pets',re:'pets?|cachorros?|gatos?|animais',fields:['acceptsPet','petsAllowed','acceptsPets']},
  furnished:{label:'mobília',re:'mobiliad[oa]s?|mobilia|moveis',fields:['furnished','isFurnished']},
  balcony:{label:'sacada ou varanda',re:'sacadas?|varandas?',fields:['hasBalcony','balcony']},
  barbecue:{label:'churrasqueira',re:'churrasqueiras?',fields:['hasBarbecue','barbecue']},
  gourmet:{label:'espaço gourmet',re:'(?:espaco|area|terraco) gourmet',fields:['hasGourmetArea','gourmetArea']},
  elevator:{label:'elevador',re:'elevador(?:es)?',fields:['hasElevator','elevator']},
  accessible:{label:'acessibilidade',re:'acessibilidade|acessivel|adaptad[oa] (?:para|a) cadeirante|acesso (?:para|a) cadeirante',fields:['wheelchairAccessible','accessible']},
  single_story:{label:'casa térrea',re:'terrea|terreo|sem escadas',fields:['singleStory','isSingleStory']},
  gated:{label:'condomínio fechado',re:'condominio fechado',fields:['gatedCommunity','isGatedCommunity']},
  covered_parking:{label:'vaga coberta',re:'vagas? cobertas?|garagem coberta',fields:['coveredParking','hasCoveredParking']},
  party_room:{label:'salão de festas',re:'salao de festas',fields:['hasPartyRoom','partyRoom']},
  gym:{label:'academia',re:'academia',fields:['hasGym','gym']},
  home_office:{label:'escritório',re:'escritorio|home office',fields:['hasOffice','homeOffice']}
 };
 const numeric={suites:{label:'suítes',fields:['suites','suitesCount']},bathrooms:{label:'banheiros',fields:['bathrooms','bathroomsCount']},area_m2:{label:'m² de área do imóvel',fields:['areaM2','usableAreaM2']},land_m2:{label:'m² de terreno',fields:['landAreaM2','lotAreaM2','terrainAreaM2']}};
 function parse(text,selected=false){
  const t=norm(text),updates={},questions=[];
  const searchCue=/\b(?:quero|preciso|procuro|busco|prefiro|preferencia|obrigatori[oa]|indispensavel|tem que|deve ter|somente|apenas|pode ser|nao quero|nao precisa|tanto faz|retir[ae]|remov[ae]|esque[cs]a)\b/.test(t);
  const question=selected&&!searchCue&&(/\?|\b(?:tem|possui|aceita|permite|ha|qual|quantos|e mobiliado|e terrea|e acessivel)\b/.test(t));
  const clauses=t.split(/[,;.!?]|\bmas\b|\bporem\b/).filter(Boolean);
  for(const [key,d]of Object.entries(definitions)){
   const re=new RegExp('\\b(?:'+d.re+')\\b','g'); const mentions=[...t.matchAll(re)];if(!mentions.length)continue;
   questions.push(key);if(question)continue;
   // Last explicit mention wins, with polarity confined to its local clause/phrase.
   for(const m of mentions){
    const before=t.slice(0,m.index);const boundary=Math.max(before.lastIndexOf(','),before.lastIndexOf(';'),before.lastIndexOf('.'),before.lastIndexOf(' mas '),before.lastIndexOf(' porem '));
    let prefix=before.slice(boundary+1);const conjunction=Math.max(prefix.lastIndexOf(' e '),prefix.lastIndexOf(' com '));
    // A new "com" or an affirmative conjunction resets a preceding negation.
    if(conjunction>=0&&/\b(?:sem|nao)\b/.test(prefix.slice(0,conjunction))&&!/\b(?:sem|nao)\b/.test(prefix.slice(conjunction)))prefix=prefix.slice(conjunction);
    const suffix=t.slice(m.index+m[0].length,m.index+m[0].length+55).split(/[,;.!?]|\bmas\b|\bporem\b/)[0];
    const clear=/\b(?:nao (?:precisa|preciso|exijo|e obrigatori[oa]|faco questao)(?:\s+(?:ter|de|que tenha))?|(?:retir[ae]|remov[ae]|esque[cs]a|dispenso)(?:\s+(?:o filtro|a exigencia|de))?)\s*$/.test(prefix)||/^\s*(?:tanto faz|e indiferente|nao (?:e obrigatori[oa]|precisa)|nao importa|opcional)\b/.test(suffix)||/\b(?:com ou sem|tanto faz(?: ter)?|independente de|nao importa(?: se tem)?)\s*$/.test(prefix);
    const negative=/\b(?:sem|nao quero|nao tenha|nao pode ter|nao aceito|nao (?:aceita|permite))\s*(?:ter|uma?|de)?\s*$/.test(prefix)||/\bnao quero\b(?:(?!\be\b).){0,45}\bcom\s*$/.test(before.slice(boundary+1));
    const preferred=/\b(?:preferencia|preferencialmente|prefiro|seria bom|se (?:tiver|possivel)|gostaria)\b/.test(prefix)&&!/\b(?:obrigatori[oa]|preciso|indispensavel|tem que)\b/.test(prefix) || /^\s*(?:de preferencia|preferencialmente|seria bom)\b/.test(suffix);
    updates[key]=clear?null:{value:!negative,mode:preferred?'preferred':'required'};
   }
  }
  // Merely naming a lot is a property type, not a demand for a house with land.
  if(updates.outdoor_space&&!/\b(?:com|sem|possui|tenha|tiver|preciso de|preferencia por)\s+(?:um\s+)?terreno\b|\b(?:area externa|espaco externo)\b/.test(t))delete updates.outdoor_space;
  // Private/shared pool scope cannot be inferred from the generic word piscina.
  if(/piscina (?:privativa|privada|exclusiva)/.test(t)&&updates.pool&&updates.private_pool){if(updates.private_pool.value===false)delete updates.pool;}
  if(/\bnao tenho\s+(?:pets?|cachorros?|gatos?|animais)\b/.test(t))delete updates.pets;
  const nums={suites:/(\d+)\s+suites?\b/,bathrooms:/(\d+)\s+banheiros?\b/,land_m2:/(?:terreno|lote)(?:\s+(?:de|com|pelo menos|no minimo|minimo de))*\s*(\d+(?:[.,]\d+)?)\s*m2\b/,area_m2:/(?:area(?: util| construida)?(?: de)?|imovel(?: de| com)?|pelo menos|no minimo|minimo de)\s*(\d+(?:[.,]\d+)?)\s*m2\b/};
  for(const [key,re]of Object.entries(nums)){
   const m=t.match(re);if(m&&!question){const n=Number(m[1].replace(',','.'));if(n>0)updates[key]={value:n,mode:'required'};}
   if(new RegExp('\\b(?:nao precisa de|tanto faz|sem exigencia de|remov[ae](?: o filtro de)?)\\s+(?:'+(key==='suites'?'suites?':key==='bathrooms'?'banheiros?':key==='land_m2'?'metragem do terreno':'metragem')+')\\b').test(t))updates[key]=null;
  }
  if(!question){
   for(const[key,word]of [['suites','suites?'],['bathrooms','banheiros?']]){
    if(new RegExp('\\b(?:com|preciso de|tenha)\\s+(?:uma?\\s+)?(?:'+word+')\\b').test(t)&&!Object.hasOwn(updates,key))updates[key]={value:1,mode:'required'};
    if(new RegExp('\\bsem\\s+(?:'+word+')\\b').test(t))updates[key]={value:0,op:'max',mode:'required'};
   }
  }
  if(!question&&/\bpiscina(?:s)?\s+(?:(?:no|do|de|em)\s+(?:um\s+)?condominio|compartilhada|coletiva)\b/.test(t)&&updates.pool&&updates.pool.value===true){updates.private_pool={value:false,mode:updates.pool.mode};}
  if(Object.hasOwn(updates,'pool')&&(updates.pool===null||updates.pool.value===false)&&!Object.hasOwn(updates,'private_pool'))updates.private_pool=null;
  const ambiguousLand=/\bsem terreno\b/.test(t)&&!question;
  return{updates,questions,question,ambiguousLand,hasUpdates:Object.keys(updates).length>0};
 }
 function merge(previous,updates){const out={...(previous||{})};for(const[k,v]of Object.entries(updates||{})){if(v===null)delete out[k];else out[k]={...v};}return out;}
 function bool(v){if(v===true||v===false)return v;if(v===1||v===0)return !!v;const s=norm(v);return ['true','sim'].includes(s)?true:['false','nao'].includes(s)?false:null;}
 function fact(row,key){
  const d=definitions[key]||numeric[key];if(!d)return null;
  const sources=[row.propertyFeatures,row.property_features,row.features,row.attributes,row];
  for(const src of sources){if(!src||typeof src!=='object'||Array.isArray(src))continue;for(const field of[key,...d.fields])if(Object.hasOwn(src,field)&&src[field]!==null&&src[field]!==''&&src[field]!==undefined){const v=src[field];if(numeric[key]){const n=Number(v);if(Number.isFinite(n)&&n>=0)return n;}else{const b=bool(v);if(b!==null)return b;}}}
  if(numeric[key])return null;
  const tokens=[...(Array.isArray(row.amenities)?row.amenities:[]),...(Array.isArray(row.tags)?row.tags:[]),row.description,row.highlight].filter(v=>typeof v==='string').map(norm);
  const re=new RegExp('\\b(?:'+d.re+')\\b');
  let positive=false,negative=false;
  for(const token of tokens){for(const clause of token.split(/[,;.!]|\bmas\b/)){if(!re.test(clause))continue;if(key==='outdoor_space'&&/\b(?:compartilhad|comum|condominio)\w*/.test(clause))continue;const m=clause.match(re),before=clause.slice(0,m.index),after=clause.slice(m.index+m[0].length);
   if(/\b(?:proximo|perto|ao lado|possibilidade|espaco para|preparacao para|projeto para|previsao de|pode construir)\b/.test(before)||/\b(?:a confirmar|sob consulta|nao informad|possibilidade)\b/.test(clause))continue;
   if(/\b(?:sem|nao (?:tem|possui|aceita|permite))\s*(?:uma?|de)?\s*$/.test(before)||/^\s*(?:nao|indisponivel)\b/.test(after))negative=true;else positive=true;
  }}
  if(positive&&negative)return null;if(negative)return false;if(positive)return true;
  if(key==='outdoor_space'&&!tokens.some(t=>/\b(?:quintal|jardim)\b.{0,25}\b(?:compartilhad|comum|condominio)\w*/.test(t))&&['yard','garden'].some(k=>fact(row,k)===true))return true;
  if(key==='pool'&&fact(row,'private_pool')===true)return true;
  return null;
 }
 function evaluate(row,criteria){let score=0;const unknown=[],mismatch=[],confirmed=[];for(const[key,c]of Object.entries(criteria||{})){
  if(!c||(!definitions[key]&&!numeric[key]))continue;const v=fact(row,key),ok=v!==null&&(numeric[key]?(c.op==='max'?v<=c.value:v>=c.value):v===c.value);
  if(ok){confirmed.push(key);score+=c.mode==='preferred'?8:2;}else if(c.mode!=='preferred'){if(v===null)unknown.push(key);else mismatch.push(key);}
 }return{matches:!unknown.length&&!mismatch.length,score,unknown,mismatch,confirmed};}
 function summary(criteria){return Object.entries(criteria||{}).filter(([k,c])=>c&&(definitions[k]||numeric[k])).map(([k,c])=>`${c.mode==='preferred'?'preferência: ':''}${numeric[k]?`${c.op==='max'?'máximo':'mínimo'} ${c.value} ${numeric[k].label}`:c.value?`com ${definitions[k].label}`:`sem ${definitions[k].label}`}`).join(' • ');}
 function answers(row,keys){return [...new Set(keys)].map(k=>{const d=definitions[k]||numeric[k];if(!d)return null;const v=fact(row,k);if(v===null)return `${d.label}: não consta confirmação na ficha; a equipe precisa verificar.`;if(numeric[k])return `${d.label}: ${v}.`;return `${d.label}: ${v?'sim, informado na ficha':'não, conforme a ficha'}${k==='pets'&&v&&row.requiresOwnerApprovalForPet?' (sujeito à aprovação do proprietário)':''}.`;}).filter(Boolean);}
 return{definitions,numeric,parse,merge,fact,evaluate,summary,answers};
})();

window.PropertyFeatures=PropertyFeatures;
