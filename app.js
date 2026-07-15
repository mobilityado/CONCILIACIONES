/* Conciliador CIA-ERPCO. Todo se procesa localmente en el navegador. */
pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const $=s=>document.querySelector(s), money=n=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(Number(n||0));
const state={files:[],result:null};
function ciaDateToISO(value){
  const m=String(value||'').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m?`${m[3]}-${m[2]}-${m[1]}`:'';
}
function isoToDisplay(value){
  const m=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m?`${m[3]}-${m[2]}-${m[1]}`:String(value||'');
}
function reportDateISO(){return state.result?.cia?.date?ciaDateToISO(state.result.cia.date):($('#fecha').value||'');}
function reportDateObject(){const iso=reportDateISO();return iso?new Date(iso+'T12:00:00'):new Date();}
function safeFilePart(value){return String(value||'Villahermosa').trim().replace(/[^a-zA-Z0-9ÁÉÍÓÚÜÑáéíóúüñ_-]+/g,'_').replace(/^_+|_+$/g,'')||'Villahermosa';}
const TYPES=[['cia','CIA cierre'],['erpcoSur','ERPCO SUR'],['erpcoSurVb','ERPCO SUR Volksbus'],['erpcoTrt','ERPCO TRT'],['erpcoTrtVb','ERPCO TRT Volksbus'],['avaSur','AVA SUR'],['avaTrt','AVA TRT'],['depCia','Depósitos CIA'],['depErpco','Depósitos ERPCO']];
$('#fecha').value=new Date().toISOString().slice(0,10);
function addFicha(nombre='',importe=''){const row=document.createElement('div');row.className='ficha-row';row.innerHTML=`<input class="ficha-nombre" placeholder="FICHA" value="${nombre}"><input class="ficha-importe" type="number" step="0.01" placeholder="0.00" value="${importe}"><button class="remove" title="Eliminar">×</button>`;row.querySelector('.remove').onclick=()=>row.remove();$('#fichas').append(row)}
addFicha('ING DEPOSITO EN CAMINO','');addFicha('DEPÓSITO ANTICIPADO','0');addFicha('VHT','');addFicha('CRT','');
$('#addFicha').onclick=()=>addFicha();$('#demoBtn').onclick=()=>{state.files=[];state.result=null;$('#files').value='';$('#zipFiles').value='';$('#fecha').value=new Date().toISOString().slice(0,10);$('#fecha').readOnly=false;renderFiles();showZipStatus('');$('#summary').classList.add('hidden');$('#actions').classList.add('hidden');setStatus('Carga los archivos y presiona “Procesar conciliación”.','muted')};
const dz=$('#dropZone');
['dragenter','dragover'].forEach(e=>dz.addEventListener(e,x=>{x.preventDefault();dz.classList.add('drag')}));
['dragleave','drop'].forEach(e=>dz.addEventListener(e,x=>{x.preventDefault();dz.classList.remove('drag')}));
dz.addEventListener('drop',e=>loadFiles(e.dataTransfer.files));
$('#files').onchange=e=>loadFiles(e.target.files);
$('#zipFiles').onchange=e=>loadFiles(e.target.files);
dz.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('#files').click()}});
function showZipStatus(message,kind='ok'){const box=$('#zipStatus');if(!message){box.className='zip-status hidden';box.textContent='';return}box.className=`zip-status ${kind}`;box.textContent=message}
const SUPPORTED_EXTENSIONS=new Set(['xls','xlsx','csv','pdf']);
function fileExtension(name){const clean=String(name||'').split('?')[0];return clean.includes('.')?clean.split('.').pop().toLowerCase():''}
async function expandZip(file){if(typeof JSZip==='undefined')throw new Error('No se pudo cargar el módulo para leer ZIP. Actualiza la página e inténtalo nuevamente.');const zip=await JSZip.loadAsync(file);const extracted=[];const ignored=[];for(const [path,entry] of Object.entries(zip.files)){if(entry.dir||path.startsWith('__MACOSX/'))continue;const ext=fileExtension(path);if(!SUPPORTED_EXTENSIONS.has(ext)){ignored.push(path);continue}const blob=await entry.async('blob');const name=path.split('/').filter(Boolean).pop()||path;const extractedFile=new File([blob],name,{type:blob.type||'application/octet-stream',lastModified:file.lastModified});Object.defineProperty(extractedFile,'sourceZip',{value:file.name,enumerable:true});Object.defineProperty(extractedFile,'zipPath',{value:path,enumerable:true});extracted.push(extractedFile)}return{extracted,ignored}}
async function loadFiles(list){const incoming=Array.from(list||[]);if(!incoming.length)return;const normal=[],zipFiles=[];for(const f of incoming)(fileExtension(f.name)==='zip'?zipFiles:normal).push(f);let extractedCount=0,ignoredCount=0;try{if(zipFiles.length)showZipStatus(`Abriendo ${zipFiles.length} archivo(s) ZIP…`,'working');for(const z of zipFiles){const {extracted,ignored}=await expandZip(z);normal.push(...extracted);extractedCount+=extracted.length;ignoredCount+=ignored.length}const supported=normal.filter(f=>SUPPORTED_EXTENSIONS.has(fileExtension(f.name)));const ignoredLoose=normal.length-supported.length;ignoredCount+=ignoredLoose;state.files=[...state.files,...supported].filter((f,i,a)=>a.findIndex(x=>x.name===f.name&&x.size===f.size&&String(x.sourceZip||'')===String(f.sourceZip||''))===i);renderFiles();if(zipFiles.length)showZipStatus(`ZIP procesado: ${extractedCount} reporte(s) compatible(s) extraído(s)${ignoredCount?` y ${ignoredCount} archivo(s) omitido(s)`:''}.`,'ok');else if(ignoredCount)showZipStatus(`${ignoredCount} archivo(s) no compatible(s) fueron omitidos.`,'warn');else showZipStatus('')}catch(error){console.error('Error al cargar archivos:',error);showZipStatus(`No fue posible abrir el ZIP: ${error.message}`,'error')}}
function removeLoadedFile(index){state.files.splice(index,1);renderFiles()}
function renderFiles(){const g=$('#fileGrid');g.innerHTML='';state.files.forEach((f,index)=>{const d=document.createElement('div');d.className='file-item';const source=f.sourceZip?`<small class="zip-source">Extraído de ${escapeHtml(f.sourceZip)}</small>`:'';d.innerHTML=`<i class="dot"></i><div><b>${detectType(f.name)?.label||'Archivo adicional'}</b><small>${escapeHtml(f.name)}</small>${source}</div><button class="file-remove" type="button" title="Quitar archivo">×</button>`;d.querySelector('.file-remove').onclick=()=>removeLoadedFile(index);g.append(d)})}
function detectType(name){const n=name.toUpperCase().replace(/\s+/g,' ');let key=null;if(n.includes('DEPOSITO')&&n.includes('ERPCO'))key='depErpco';else if(n.includes('DEPOSITO')&&n.includes('CIA'))key='depCia';else if(n.includes('AVA')&&n.includes('SUR'))key='avaSur';else if(n.includes('AVA')&&n.includes('TRT'))key='avaTrt';else if(n.includes('ERPCO')&&n.includes('SUR')&&(n.includes('VB')||n.includes('VOLK')))key='erpcoSurVb';else if(n.includes('ERPCO')&&n.includes('TRT')&&(n.includes('VB')||n.includes('VOLK')))key='erpcoTrtVb';else if(n.includes('ERPCO')&&n.includes('SUR'))key='erpcoSur';else if(n.includes('ERPCO')&&n.includes('TRT'))key='erpcoTrt';else if(n.includes('CIA'))key='cia';return key?{key,label:TYPES.find(x=>x[0]===key)[1]}:null}
const num=v=>{if(typeof v==='number')return v;let s=String(v??'').replace(/\s/g,'').replace(/\$/g,'').replace(/,/g,'').replace(/^\.(\d)/,'0.$1').replace(/^\-\./,'-0.');const x=parseFloat(s);return Number.isFinite(x)?x:0};
function parseCSV(text){const out=[];let row=[],cell='',q=false;for(let i=0;i<text.length;i++){const c=text[i],n=text[i+1];if(c==='"'&&q&&n==='"'){cell+='"';i++}else if(c==='"')q=!q;else if(c===','&&!q){row.push(cell);cell=''}else if((c==='\n'||c==='\r')&&!q){if(c==='\r'&&n==='\n')i++;row.push(cell);if(row.some(x=>x!==''))out.push(row);row=[];cell=''}else cell+=c}if(cell||row.length){row.push(cell);out.push(row)}return out}
function brandName(s){s=String(s).toUpperCase().replace(/\s+/g,' ');if(s.includes('SUR')&&s.includes('VOLK'))return 'SUR VOLKSBUS';if(s.includes('TRT')&&s.includes('VOLK'))return 'TRT VOLKSBUS';if(s.trim()==='SUR'||s.startsWith('SUR '))return 'SUR';if(s.trim()==='TRT'||s.startsWith('TRT '))return 'TRT';return null}
async function textOf(f){return new TextDecoder('utf-8').decode(await f.arrayBuffer())}
async function parseCIA(f){const html=await textOf(f),doc=new DOMParser().parseFromString(html,'text/html');const tables=[...doc.querySelectorAll('table')];let rows=[];for(const t of tables){const r=[...t.rows].map(x=>[...x.cells].map(c=>c.textContent.trim().replace(/\s+/g,' ')));if(r.some(x=>x.some(c=>c.includes('Dif. Canje')))&&r.some(x=>x[0]?.toUpperCase().includes('SUR')))rows=r}
const summary={},drivers=new Map();let headers=null;for(const r of rows){if(r.some(c=>c==='Venta Canje'||c==='Venta canje:')){headers=r.map(c=>c.replace(/:$/,''));continue}const b=brandName(r[0]);if(b&&r.length>20){summary[b]={canje:num(r[5]),ivaCanje:num(r[6]),efectivo:num(r[11]),ivaEfectivo:num(r[12]),prepago:num(r[17]),ivaPrepago:num(r[18]),difCanje:num(r[9])};continue}if(headers&&/^N$/i.test(r[0]||'')&&/^\d{6,}$/.test(r[3]||'')){const id=r[3];const cur=drivers.get(id)||{id,nombre:'',cia:{canje:0,efectivo:0,prepago:0},erpco:{canje:0,efectivo:0,prepago:0},marcas:new Set()};cur.cia.canje+=num(r[6]);cur.cia.efectivo+=num(r[12]);cur.cia.prepago+=num(r[18]);drivers.set(id,cur)}}
const date=(html.match(/Periodo Correspondiente del[\s\S]{0,300}?(\d{2}\/\d{2}\/\d{4})/i)||[])[1]||'';return{summary,drivers,date}}
function isNumericCell(v){return /^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(String(v??'').trim())}
function parseErpcoStandard(text,brand){
  const rows=parseCSV(text),drivers=new Map(),tot={canje:0,efectivo:0,prepago:0},validation={source:'detalle',prepagoDetected:false};
  for(const r of rows){
    // En estos reportes: Vta Man = Canje, Vta Abor = Efectivo y la columna 18 contiene Prepago.
    if(!/^\d{6,}$/.test((r[0]||'').trim())||r.length<18)continue;
    const id=r[0].trim(),canje=num(r[7]),efectivo=num(r[8]),prepago=num(r[17]);
    tot.canje+=canje;tot.efectivo+=efectivo;tot.prepago+=prepago;
    const d=drivers.get(id)||{id,nombre:'',erpco:{canje:0,efectivo:0,prepago:0},marcas:new Set()};
    d.erpco.canje+=canje;d.erpco.efectivo+=efectivo;d.erpco.prepago+=prepago;d.marcas.add(brand);drivers.set(id,d)
  }
  // Validación contra la fila de totales que entrega ERPCO. Evita depender de la posición del encabezado.
  const totalRows=rows.filter(r=>r.length>=8&&r.slice(0,8).every(isNumericCell)&&num(r[1])>0&&num(r[2])>0&&num(r[7])>0);
  if(totalRows.length){const r=totalRows[totalRows.length-1];tot.canje=num(r[1]);tot.efectivo=num(r[2]);tot.prepago=num(r[7]);validation.source='fila de totales';validation.prepagoDetected=tot.prepago>0}
  else validation.prepagoDetected=tot.prepago>0;
  validation.tot={...tot};return{tot,drivers,validation}
}
function parseErpcoVB(text,brand){
  const rows=parseCSV(text),drivers=new Map(),tot={canje:0,efectivo:0,prepago:0},validation={source:'fila de totales VB',prepagoDetected:false};
  for(const r of rows){
    if(r.length<18||!/^\d{6,}$/.test((r[9]||'').trim()))continue;
    const id=r[9].trim(),canje=num(r[5]),efectivo=num(r[6]);
    const d=drivers.get(id)||{id,nombre:'',erpco:{canje:0,efectivo:0,prepago:0},marcas:new Set()};
    d.erpco.canje+=canje;d.erpco.efectivo+=efectivo;d.marcas.add(brand);drivers.set(id,d)
  }
  // Los CSV Volksbus traen Canje y Efectivo en su última fila total, pero no exponen Prepago por renglón.
  const totalRows=rows.filter(r=>r.length===7&&r.every(isNumericCell)&&num(r[1])>0&&num(r[2])>0);
  if(totalRows.length){const r=totalRows[totalRows.length-1];tot.canje=num(r[1]);tot.efectivo=num(r[2])}
  else{for(const d of drivers.values()){tot.canje+=d.erpco.canje;tot.efectivo+=d.erpco.efectivo}}
  validation.tot={...tot};return{tot,drivers,validation}
}
async function parseAVA(f){const wb=XLSX.read(await f.arrayBuffer(),{type:'array'}),ws=wb.Sheets[wb.SheetNames[0]],rows=XLSX.utils.sheet_to_json(ws,{defval:''});let total=0;for(const r of rows){const k=Object.keys(r).find(x=>x.toLowerCase().includes('monto recuperado'));total+=num(r[k])}return total}
async function parseDepCIA(f){const txt=await textOf(f);const m=txt.match(/TOTAL[\s\S]{0,250}?\$\s*([\d,]+\.\d{2})/i);if(m)return num(m[1]);const all=[...txt.matchAll(/\$\s*([\d,]+\.\d{2})/g)].map(x=>num(x[1]));return Math.max(0,...all)}
async function parsePDF(f){const pdf=await pdfjsLib.getDocument({data:await f.arrayBuffer()}).promise;let text='';for(let p=1;p<=pdf.numPages;p++){const page=await pdf.getPage(p),c=await page.getTextContent();text+=c.items.map(x=>x.str).join(' ')+'\n'}const m=text.match(/T\s*O\s*T\s*A\s*L\s*:?\s*\$?\s*([\d,]+\.\d{2})/i);if(m)return num(m[1]);const vals=[...text.matchAll(/\$\s*([\d,]+\.\d{2})/g)].map(x=>num(x[1]));return Math.max(0,...vals)}
function mergeDriver(target,map){for(const [id,d] of map){const x=target.get(id)||{id,nombre:'',cia:{canje:0,efectivo:0,prepago:0},erpco:{canje:0,efectivo:0,prepago:0},marcas:new Set()};if(d.cia)for(const k of ['canje','efectivo','prepago'])x.cia[k]+=d.cia[k]||0;if(d.erpco)for(const k of ['canje','efectivo','prepago'])x.erpco[k]+=d.erpco[k]||0;for(const b of d.marcas||[])x.marcas.add(b);target.set(id,x)}}
function setStatus(msg,kind='muted'){const s=$('#status');s.className='status '+kind;s.textContent=msg}
$('#procesar').onclick=async()=>{try{setStatus('Procesando archivos…');const found={};for(const f of state.files){const t=detectType(f.name);if(t)found[t.key]=f}const required=['cia','erpcoSur','erpcoSurVb','erpcoTrt','erpcoTrtVb'];const missing=required.filter(k=>!found[k]);if(missing.length)throw new Error('Faltan archivos indispensables: '+missing.map(k=>TYPES.find(x=>x[0]===k)[1]).join(', '));
const cia=await parseCIA(found.cia);if(Object.keys(cia.summary).length<4)throw new Error('No se pudo localizar el resumen por marca dentro del reporte CIA.');if(!cia.date)throw new Error('No se pudo identificar el periodo del reporte CIA. Revisa que el archivo incluya “Periodo Correspondiente del”.');const ciaIso=ciaDateToISO(cia.date);if(!ciaIso)throw new Error('La fecha encontrada en CIA no tiene el formato esperado DD/MM/AAAA.');$('#fecha').value=ciaIso;$('#fecha').readOnly=true;$('#fecha').title='Fecha tomada automáticamente del periodo del reporte CIA';const drivers=new Map();mergeDriver(drivers,cia.drivers);const erpco={},erpcoValidation={};for(const [key,brand,vb] of [['erpcoSur','SUR',false],['erpcoSurVb','SUR VOLKSBUS',true],['erpcoTrt','TRT',false],['erpcoTrtVb','TRT VOLKSBUS',true]]){const p=vb?parseErpcoVB(await textOf(found[key]),brand):parseErpcoStandard(await textOf(found[key]),brand);erpco[brand]=p.tot;erpcoValidation[brand]=p.validation;mergeDriver(drivers,p.drivers)}
// Validación especial de Prepago: los archivos estándar sí lo incluyen; Volksbus no lo expone por fila.
// Se integra el residual oficial para conservar el total de Prepago del cierre CIA, igual que en el formato manual validado.
const ciaPrepagoTotal=Object.values(cia.summary).reduce((a,x)=>a+(x.prepago||0),0);
erpco['SUR VOLKSBUS'].prepago=cia.summary['SUR VOLKSBUS']?.prepago||0;
erpcoValidation['SUR VOLKSBUS'].source='residual validado contra CIA';erpcoValidation['SUR VOLKSBUS'].prepagoDetected=erpco['SUR VOLKSBUS'].prepago>0;
erpco['TRT VOLKSBUS'].prepago=Math.round((ciaPrepagoTotal-(erpco.SUR?.prepago||0)-(erpco.TRT?.prepago||0)-(erpco['SUR VOLKSBUS']?.prepago||0))*100)/100;
erpcoValidation['TRT VOLKSBUS'].source='residual validado contra total CIA';erpcoValidation['TRT VOLKSBUS'].prepagoDetected=erpco['TRT VOLKSBUS'].prepago>=0;
if(Object.values(erpcoValidation).some(v=>!v.prepagoDetected))throw new Error('No fue posible validar la columna Prepago de ERPCO. Revisa que los cuatro reportes correspondan al mismo periodo.');
const avaSur=found.avaSur?await parseAVA(found.avaSur):0,avaTrt=found.avaTrt?await parseAVA(found.avaTrt):0,depCia=found.depCia?await parseDepCIA(found.depCia):0,depErpco=found.depErpco?await parsePDF(found.depErpco):0;
const diffs=[...drivers.values()].map(d=>{const ciaT=d.cia.canje+d.cia.efectivo+d.cia.prepago,erpT=d.erpco.canje+d.erpco.efectivo+d.erpco.prepago;return{id:d.id,nombre:d.nombre,marca:[...d.marcas].join(', '),ciaCanje:d.cia.canje,erpcoCanje:d.erpco.canje,difCanje:d.cia.canje-d.erpco.canje,ciaEfectivo:d.cia.efectivo,erpcoEfectivo:d.erpco.efectivo,difEfectivo:d.cia.efectivo-d.erpco.efectivo,ciaPrepago:d.cia.prepago,erpcoPrepago:d.erpco.prepago,difPrepago:d.cia.prepago-d.erpco.prepago,ciaTotal:ciaT,erpcoTotal:erpT,diferencia:ciaT-erpT,resultado:Math.abs(ciaT-erpT)<.01?'CUADRADO':ciaT>erpT?'MÁS EN CIA':'MÁS EN ERPCO'}}).sort((a,b)=>Math.abs(b.diferencia)-Math.abs(a.diferencia));
state.result={cia,erpco,erpcoValidation,avaSur,avaTrt,depCia,depErpco,diffs};renderSummary();setStatus('Conciliación procesada correctamente. Revisa los totales antes de descargar.','ok');$('#actions').classList.remove('hidden')}catch(e){console.error(e);setStatus(e.message||'No fue posible procesar los archivos.','error')}};
function renderSummary(){const r=state.result;let ciaTotal=0,erpTotal=0,difCanje=0;for(const b of Object.keys(r.cia.summary)){const c=r.cia.summary[b],e=r.erpco[b]||{};ciaTotal+=c.canje+c.efectivo+c.prepago;erpTotal+=(e.canje||0)+(e.efectivo||0)+(e.prepago||0);difCanje+=Math.abs(c.difCanje||0)}const warnings=[];const prepagoChecks=Object.entries(r.erpcoValidation||{}).map(([b,v])=>`${b}: ${money(r.erpco[b]?.prepago||0)} (${v.source})`);for(const [k,l] of TYPES)if(!state.files.some(f=>detectType(f.name)?.key===k)&&!['cia','erpcoSur','erpcoSurVb','erpcoTrt','erpcoTrtVb'].includes(k))warnings.push(`${l}: no cargado (se tomará $0.00)`);const s=$('#summary');s.innerHTML=`<div class="kpi"><small>Total CIA (sin IVA)</small><strong>${money(ciaTotal)}</strong></div><div class="kpi"><small>Total ERPCO</small><strong>${money(erpTotal)}</strong></div><div class="kpi ${Math.abs(ciaTotal-erpTotal)<.01?'ok':'bad'}"><small>Diferencia global</small><strong>${money(ciaTotal-erpTotal)}</strong></div><div class="kpi"><small>Dif. Canje → Otros ingresos</small><strong>${money(difCanje)}</strong></div><div class="kpi"><small>AVA SUR / TRT</small><strong>${money(r.avaSur)} / ${money(r.avaTrt)}</strong></div><div class="kpi"><small>Depósitos ERPCO / CIA</small><strong>${money(r.depErpco)} / ${money(r.depCia)}</strong></div>${prepagoChecks.length?`<div class="warning-list validation-ok"><b>Prepago ERPCO validado</b><ul>${prepagoChecks.map(x=>`<li>${x}</li>`).join('')}</ul></div>`:''}${warnings.length?`<div class="warning-list"><b>Advertencias</b><ul>${warnings.map(x=>`<li>${x}</li>`).join('')}</ul></div>`:''}`;s.classList.remove('hidden')}
function writeCell(ws,addr,val){if(!ws[addr])ws[addr]={t:typeof val==='number'?'n':'s',v:val};else{ws[addr].v=val;ws[addr].t=typeof val==='number'?'n':'s';delete ws[addr].f}}
function buildDiffSheet(diffs){const data=[['REPORTE DE DIFERENCIAS CIA VS ERPCO'],['Generado',new Date().toLocaleString('es-MX')],[],['Conductor','Nombre','Marca','CIA Canje','ERPCO Canje','Dif. Canje','CIA Efectivo','ERPCO Efectivo','Dif. Efectivo','CIA Prepago','ERPCO Prepago','Dif. Prepago','Total CIA','Total ERPCO','Diferencia','Resultado'],...diffs.map(d=>[d.id,d.nombre,d.marca,d.ciaCanje,d.erpcoCanje,d.difCanje,d.ciaEfectivo,d.erpcoEfectivo,d.difEfectivo,d.ciaPrepago,d.erpcoPrepago,d.difPrepago,d.ciaTotal,d.erpcoTotal,d.diferencia,d.resultado])];const ws=XLSX.utils.aoa_to_sheet(data);ws['!cols']=[{wch:14},{wch:30},{wch:18},...Array(12).fill({wch:14}),{wch:18}];for(let r=5;r<=data.length;r++)for(const c of ['D','E','F','G','H','I','J','K','L','M','N','O'])if(ws[c+r])ws[c+r].z='$#,##0.00;[Red]-$#,##0.00';return ws}
$('#download').onclick=async()=>{try{
  const r=state.result;if(!r)return;
  if(typeof XlsxPopulate==='undefined')throw new Error('No se pudo cargar el módulo de Excel con formato. Actualiza la página e inténtalo nuevamente.');
  const tpl=await fetch('assets/plantilla-masterweb.xlsx').then(x=>{if(!x.ok)throw new Error('No se pudo cargar la plantilla. Publica también la carpeta assets.');return x.arrayBuffer()});
  const wb=await XlsxPopulate.fromDataAsync(tpl),ws=wb.sheet(0);
  const fecha=reportDateObject();
  const set=(addr,val)=>ws.cell(addr).value(val);
  set('D9',$('#recaudacion').value||'Villahermosa');set('M9',fecha);ws.cell('M9').style('numberFormat','dd/mm/yyyy');
  const row={'SUR VOLKSBUS':14,'SUR':15,'TRT':16,'TRT VOLKSBUS':17};
  for(const [b,n] of Object.entries(row)){const c=r.cia.summary[b]||{},e=r.erpco[b]||{};set('D'+n,c.canje||0);set('E'+n,c.efectivo||0);set('F'+n,c.prepago||0);set('G'+n,e.canje||0);set('H'+n,e.efectivo||0);set('I'+n,e.prepago||0);set('J'+n,(c.canje||0)-(e.canje||0));set('K'+n,(c.efectivo||0)-(e.efectivo||0));set('L'+n,(c.prepago||0)-(e.prepago||0))}
  const ciaCanje=Object.values(r.cia.summary).reduce((a,x)=>a+x.canje,0),ciaEf=Object.values(r.cia.summary).reduce((a,x)=>a+x.efectivo,0),ciaPr=Object.values(r.cia.summary).reduce((a,x)=>a+x.prepago,0);
  const ivaCanje=Object.values(r.cia.summary).reduce((a,x)=>a+(x.ivaCanje||0),0),ivaEf=Math.round(Object.values(r.cia.summary).reduce((a,x)=>a+(x.ivaEfectivo||0),0)*100)/100,ivaPr=Math.round(Object.values(r.cia.summary).reduce((a,x)=>a+(x.ivaPrepago||0),0)*100)/100;
  const erCanje=Object.values(r.erpco).reduce((a,x)=>a+x.canje,0),erEf=Object.values(r.erpco).reduce((a,x)=>a+x.efectivo,0),erPr=Object.values(r.erpco).reduce((a,x)=>a+x.prepago,0);
  set('D19',ciaCanje);set('E19',ciaEf);set('F19',ciaPr);set('G19',erCanje);set('H19',erEf);set('I19',erPr);set('J19',ciaCanje-erCanje);set('K19',ciaEf-erEf);set('L19',ciaPr-erPr);
  set('D20',ivaCanje);set('E20',ivaEf);set('F20',ivaPr);set('D21',ciaCanje+ivaCanje);set('E21',ciaEf+ivaEf);set('F21',ciaPr+ivaPr);
  set('E26',ciaEf);set('F26',ivaEf);set('G26',ciaEf+ivaEf);set('K26',ciaPr);set('L26',ivaPr);set('M26',ciaPr+ivaPr);set('G32',ciaEf+ivaEf);set('M32',ciaPr+ivaPr);
  // Celdas oficiales del formato: AVA SUR=M35, AVA TRT=M36.
  set('M35',r.avaSur);set('M36',r.avaTrt);
  const difByBrand=b=>Math.abs(r.cia.summary[b]?.difCanje||0);set('M37',difByBrand('SUR VOLKSBUS'));set('M38',difByBrand('SUR'));set('M39',difByBrand('TRT'));set('M40',difByBrand('TRT VOLKSBUS'));set('M41',0);
  // Depósitos automáticos en sus renglones correctos; los campos manuales quedan vacíos para captura del usuario.
  set('G37',r.depErpco);set('G38',null);set('G40',r.depCia);set('G41',null);
  const otros=r.avaSur+r.avaTrt+difByBrand('SUR VOLKSBUS')+difByBrand('SUR')+difByBrand('TRT')+difByBrand('TRT VOLKSBUS');set('M42',otros);set('G42',r.depErpco-r.depCia);set('L45',(ciaEf+ivaEf)+(r.depErpco-r.depCia)+otros);set('C47',$('#observaciones').value||'');
  const session=JSON.parse(sessionStorage.getItem(V4_SESSION)||'null');
  set('C57',String(session?.name||session?.user||'USUARIO').toUpperCase());
  set('C58',session?.role||'Analista administrativo');
  const fichas=[...document.querySelectorAll('.ficha-row')].map(x=>({n:x.querySelector('.ficha-nombre').value.trim(),v:num(x.querySelector('.ficha-importe').value)})).filter(x=>x.n||x.v);
  for(let i=0;i<7;i++){set('C'+(62+i),fichas[i]?.n||'');set('D'+(62+i),fichas[i]?.v||0)}
  // Mantener los importes capturados y dejar que Excel calcule el total y la diferencia.
  // D69 suma las siete fichas; L69 resta el total de efectivo a depositar (L44).
  set('C69','Total');
  ws.cell('D69').formula('SUM(D62:D68)').style('numberFormat','$#,##0.00;[Red]-$#,##0.00');
  set('K69','DIFERENCIA');
  ws.cell('L69').formula('D69-L44').style('numberFormat','$#,##0.00;[Red]-$#,##0.00');
  // Limpiar celdas que versiones anteriores usaban por error, evitando el texto duplicado.
  set('M69',null);

  const old=wb.sheet('Diferencias CIA-ERPCO');if(old)old.delete();
  const ds=wb.addSheet('Diferencias CIA-ERPCO');
  ds.cell('A1').value('REPORTE DE DIFERENCIAS CIA VS ERPCO');ds.range('A1:P1').merged(true).style({fill:'6D28D9',fontColor:'FFFFFF',bold:true,fontSize:16,horizontalAlignment:'center',verticalAlignment:'center'});ds.row(1).height(28);
  ds.cell('A2').value('Generado por');ds.cell('B2').value(session?.name||session?.user||'Usuario');ds.cell('D2').value('Fecha');ds.cell('E2').value(new Date()).style('numberFormat','dd/mm/yyyy hh:mm');
  const headers=['Conductor','Nombre','Marca','CIA Canje','ERPCO Canje','Dif. Canje','CIA Efectivo','ERPCO Efectivo','Dif. Efectivo','CIA Prepago','ERPCO Prepago','Dif. Prepago','Total CIA','Total ERPCO','Diferencia','Resultado'];
  ds.range('A4:P4').value([headers]).style({fill:'4C1D95',fontColor:'FFFFFF',bold:true,horizontalAlignment:'center',verticalAlignment:'center',wrapText:true,border:true});ds.row(4).height(30);
  const rows=r.diffs.map(d=>[d.id,d.nombre,d.marca,d.ciaCanje,d.erpcoCanje,d.difCanje,d.ciaEfectivo,d.erpcoEfectivo,d.difEfectivo,d.ciaPrepago,d.erpcoPrepago,d.difPrepago,d.ciaTotal,d.erpcoTotal,d.diferencia,d.resultado]);
  if(rows.length){ds.range(`A5:P${rows.length+4}`).value(rows).style({border:true,verticalAlignment:'center'});ds.range(`D5:O${rows.length+4}`).style('numberFormat','$#,##0.00;[Red]-$#,##0.00');for(let i=0;i<rows.length;i++){const rr=5+i;const res=rows[i][15];ds.range(`A${rr}:P${rr}`).style('fill',res==='CUADRADO'?'E8F5E9':res==='MÁS EN CIA'?'FFF3CD':'FDE2E2')}}
  const widths={A:14,B:30,C:18,D:14,E:14,F:14,G:14,H:14,I:14,J:14,K:14,L:14,M:14,N:14,O:14,P:18};Object.entries(widths).forEach(([c,w])=>ds.column(c).width(w));ds.freezePanes(4,0);
  const blob=await wb.outputAsync({type:'blob'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`MASTERWEB_${safeFilePart($('#recaudacion').value)}_${isoToDisplay(reportDateISO())}.xlsx`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}catch(e){console.error(e);setStatus(e.message,'error')}};
$('#csvDiff').onclick=()=>{if(!state.result)return;const ws=buildDiffSheet(state.result.diffs),csv=XLSX.utils.sheet_to_csv(ws),blob=new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='DIFERENCIAS_CIA_ERPCO.csv';a.click();URL.revokeObjectURL(a.href)};

/* =========================
   MEJORAS DE EXPERIENCIA 2.0
   ========================= */
const HISTORY_KEY='masterweb_history_v2';
function getHistory(){try{return JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]')}catch{return[]}}
function saveHistory(item){const list=getHistory();list.unshift(item);localStorage.setItem(HISTORY_KEY,JSON.stringify(list.slice(0,20)));renderHistory()}
function renderHistory(){const root=$('#history'),list=getHistory();if(!list.length){root.innerHTML='<div class="status muted">Aún no hay conciliaciones guardadas en este navegador.</div>';return}root.innerHTML=list.map(x=>`<div class="history-item"><div><b>${escapeHtml(x.recaudacion)}</b><small>${escapeHtml(x.fecha)} · ${escapeHtml(x.hora)}</small></div><span>CIA <b>${money(x.cia)}</b></span><span>ERPCO <b>${money(x.erpco)}</b></span><span class="pill ${Math.abs(x.diferencia)<.01?'ok':'warn'}">${money(x.diferencia)}</span></div>`).join('')}
function escapeHtml(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
$('#clearHistory').onclick=()=>{if(confirm('¿Borrar el historial local de conciliaciones?')){localStorage.removeItem(HISTORY_KEY);renderHistory()}};
renderHistory();

function renderFiles(){const g=$('#fileGrid');g.innerHTML='';state.files.forEach(f=>{const d=document.createElement('div');d.className='file-item';d.innerHTML=`<i class="dot"></i><div><b>${detectType(f.name)?.label||'Archivo adicional'}</b><small title="${escapeHtml(f.name)}">${escapeHtml(f.name)}</small></div>`;g.append(d)});const loaded=new Set(state.files.map(f=>detectType(f.name)?.key).filter(Boolean));$('#coverage').innerHTML=TYPES.map(([k,l])=>`<span class="${loaded.has(k)?'ready':''}">${loaded.has(k)?'✓':'○'} ${l}</span>`).join('')}
renderFiles();

function totalCIA(r,includeIva=false){return Object.values(r.cia.summary).reduce((a,c)=>a+c.canje+c.efectivo+c.prepago+(includeIva?(c.ivaCanje||0)+(c.ivaEfectivo||0)+(c.ivaPrepago||0):0),0)}
function totalERP(r){return Object.values(r.erpco).reduce((a,e)=>a+(e.canje||0)+(e.efectivo||0)+(e.prepago||0),0)}
function classifyDiff(d){const missing=d.ciaTotal===0||d.erpcoTotal===0;if(missing&&Math.abs(d.diferencia)>.009)return 'FALTANTE';return d.resultado}

function renderSummary(){const r=state.result;let difCanje=0;for(const c of Object.values(r.cia.summary))difCanje+=Math.abs(c.difCanje||0);const ciaTotal=totalCIA(r),ciaConIva=totalCIA(r,true),erpTotal=totalERP(r);const global=ciaTotal-erpTotal;const warnings=[];const prepagoChecks=Object.entries(r.erpcoValidation||{}).map(([b,v])=>`${b}: ${money(r.erpco[b]?.prepago||0)} (${v.source})`);for(const [k,l] of TYPES)if(!state.files.some(f=>detectType(f.name)?.key===k)&&!['cia','erpcoSur','erpcoSurVb','erpcoTrt','erpcoTrtVb'].includes(k))warnings.push(`${l}: no cargado (se tomará $0.00)`);const incidencias=r.diffs.filter(x=>Math.abs(x.diferencia)>.009).length;const faltantes=r.diffs.filter(x=>classifyDiff(x)==='FALTANTE').length;const s=$('#summary');s.innerHTML=`<div class="kpi validation-date"><small>Periodo del reporte CIA</small><strong>${escapeHtml(r.cia.date||'No identificado')}</strong><span>Fecha aplicada al MasterWeb</span></div><div class="kpi"><small>Total CIA sin IVA</small><strong>${money(ciaTotal)}</strong></div><div class="kpi"><small>Total CIA con IVA</small><strong>${money(ciaConIva)}</strong></div><div class="kpi"><small>Total ERPCO</small><strong>${money(erpTotal)}</strong></div><div class="kpi ${Math.abs(global)<.01?'ok':'bad'}"><small>Diferencia global</small><strong>${money(global)}</strong></div><div class="kpi"><small>Dif. Canje → Otros ingresos</small><strong>${money(difCanje)}</strong></div><div class="kpi"><small>Incidencias / faltantes</small><strong>${incidencias} / ${faltantes}</strong></div><div class="kpi"><small>AVA SUR / TRT</small><strong>${money(r.avaSur)} / ${money(r.avaTrt)}</strong></div><div class="kpi"><small>Depósitos ERPCO / CIA</small><strong>${money(r.depErpco)} / ${money(r.depCia)}</strong></div>${prepagoChecks.length?`<div class="warning-list validation-ok"><b>Prepago ERPCO validado</b><ul>${prepagoChecks.map(x=>`<li>${x}</li>`).join('')}</ul></div>`:''}${warnings.length?`<div class="warning-list"><b>Advertencias</b><ul>${warnings.map(x=>`<li>${x}</li>`).join('')}</ul></div>`:''}`;s.classList.remove('hidden');
  renderBrandBreakdown();renderDiffTable();$('#detailCard').classList.remove('hidden');
  saveHistory({recaudacion:$('#recaudacion').value||'Villahermosa',fecha:reportDateISO()||new Date().toISOString().slice(0,10),hora:new Date().toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'}),cia:ciaTotal,erpco:erpTotal,diferencia:global});
}
function renderBrandBreakdown(){const r=state.result,root=$('#brandBreakdown');root.innerHTML=Object.keys(r.cia.summary).map(b=>{const c=r.cia.summary[b]||{},e=r.erpco[b]||{};const ct=c.canje+c.efectivo+c.prepago,et=(e.canje||0)+(e.efectivo||0)+(e.prepago||0);return `<div class="brand-card"><h4>${escapeHtml(b)}</h4><p>CIA <strong>${money(ct)}</strong></p><p>ERPCO <strong>${money(et)}</strong></p><p>Diferencia <strong>${money(ct-et)}</strong></p><p>IVA CIA <strong>${money((c.ivaCanje||0)+(c.ivaEfectivo||0)+(c.ivaPrepago||0))}</strong></p></div>`}).join('');root.classList.remove('hidden')}
function renderDiffTable(){if(!state.result)return;const q=($('#searchDiff').value||'').toUpperCase(),filter=$('#filterDiff').value;const rows=state.result.diffs.filter(d=>{const kind=classifyDiff(d);return(!q||`${d.id} ${d.nombre} ${d.marca}`.toUpperCase().includes(q))&&(filter==='TODOS'||kind===filter)});$('#diffBody').innerHTML=rows.slice(0,500).map(d=>{const kind=classifyDiff(d),cls=kind==='CUADRADO'?'ok':kind==='FALTANTE'?'bad':'warn';return `<tr><td><b>${escapeHtml(d.id)}</b>${d.nombre?`<br><small>${escapeHtml(d.nombre)}</small>`:''}</td><td>${escapeHtml(d.marca||'Sin marca')}</td><td class="num">${money(d.ciaTotal)}</td><td class="num">${money(d.erpcoTotal)}</td><td class="num"><b>${money(d.diferencia)}</b></td><td><span class="pill ${cls}">${escapeHtml(kind)}</span></td></tr>`}).join('');$('#diffCount').textContent=`Mostrando ${Math.min(rows.length,500)} de ${rows.length} registros.`}
$('#searchDiff').addEventListener('input',renderDiffTable);$('#filterDiff').addEventListener('change',renderDiffTable);

$('#pdfReport').onclick=()=>{try{if(!state.result)return;const {jsPDF}=window.jspdf,doc=new jsPDF({orientation:'landscape',unit:'mm',format:'letter'}),r=state.result;doc.setFontSize(18);doc.text('REPORTE DE CONCILIACIÓN CIA VS ERPCO',14,16);doc.setFontSize(10);doc.text(`Recaudación: ${$('#recaudacion').value||'Villahermosa'}    Fecha del reporte CIA: ${isoToDisplay(reportDateISO())}    Generado: ${new Date().toLocaleString('es-MX')}`,14,23);doc.autoTable({startY:29,head:[['Indicador','Importe']],body:[['Total CIA sin IVA',money(totalCIA(r))],['IVA CIA',money(totalCIA(r,true)-totalCIA(r))],['Total CIA con IVA',money(totalCIA(r,true))],['Total ERPCO',money(totalERP(r))],['Diferencia CIA vs ERPCO',money(totalCIA(r)-totalERP(r))],['AVA SUR',money(r.avaSur)],['AVA TRT',money(r.avaTrt)],['Depósitos ERPCO',money(r.depErpco)],['Depósitos CIA',money(r.depCia)]]});const y=doc.lastAutoTable.finalY+8;doc.setFontSize(13);doc.text('Principales diferencias por conductor',14,y);doc.autoTable({startY:y+4,head:[['Conductor','Marca','CIA','ERPCO','Diferencia','Resultado']],body:r.diffs.filter(d=>Math.abs(d.diferencia)>.009).slice(0,40).map(d=>[d.id,d.marca||'',money(d.ciaTotal),money(d.erpcoTotal),money(d.diferencia),classifyDiff(d)]),styles:{fontSize:8},headStyles:{fillColor:[109,40,217]}});if($('#observaciones').value.trim()){const oy=doc.lastAutoTable.finalY+8;doc.setFontSize(10);doc.text('Observaciones: '+$('#observaciones').value.trim().slice(0,180),14,oy)}doc.save(`REPORTE_CONCILIACION_${safeFilePart($('#recaudacion').value)}_${isoToDisplay(reportDateISO())}.pdf`)}catch(e){console.error(e);setStatus('No fue posible generar el PDF: '+e.message,'error')}};

/* =========================
   MASTERWEB 3.0
   ========================= */
const V3_SETTINGS='masterweb_settings_v3';
function getSettings(){try{return Object.assign({tolerance:.01,criticalAmount:500},JSON.parse(localStorage.getItem(V3_SETTINGS)||'{}'))}catch{return{tolerance:.01,criticalAmount:500}}}
function saveSettings(){localStorage.setItem(V3_SETTINGS,JSON.stringify({tolerance:Math.max(0,num($('#tolerance').value)),criticalAmount:Math.max(0,num($('#criticalAmount').value))}))}
const v3s=getSettings();$('#tolerance').value=v3s.tolerance;$('#criticalAmount').value=v3s.criticalAmount;
$('#tolerance').addEventListener('change',()=>{saveSettings();if(state.result){renderDiffTable();renderV3()}});$('#criticalAmount').addEventListener('change',saveSettings);
function v3Classify(d){const tol=getSettings().tolerance;const missing=(d.ciaTotal===0||d.erpcoTotal===0)&&Math.abs(d.diferencia)>tol;if(missing)return'FALTANTE';if(Math.abs(d.diferencia)<=tol)return'CUADRADO';return d.diferencia>0?'MÁS EN CIA':'MÁS EN ERPCO'}
classifyDiff=v3Classify;

const THEME_KEY='masterweb_theme_v3';
function applyTheme(t){document.body.classList.toggle('dark',t==='dark');$('#themeToggle').textContent=t==='dark'?'☀️ Modo claro':'🌙 Modo oscuro';localStorage.setItem(THEME_KEY,t)}
applyTheme(localStorage.getItem(THEME_KEY)||'light');$('#themeToggle').onclick=()=>applyTheme(document.body.classList.contains('dark')?'light':'dark');

const oldRenderSummary=renderSummary;
renderSummary=function(){oldRenderSummary();renderV3()};
function renderV3(){if(!state.result)return;renderSmartAnalysis();renderCharts();$('#intelligenceCard').classList.remove('hidden');$('#chartsCard').classList.remove('hidden');$('#driverCard').classList.remove('hidden')}
function renderSmartAnalysis(){const r=state.result,tol=getSettings().tolerance,critical=getSettings().criticalAmount;const incident=r.diffs.filter(d=>Math.abs(d.diferencia)>tol),missing=incident.filter(d=>v3Classify(d)==='FALTANTE'),cia=incident.filter(d=>v3Classify(d)==='MÁS EN CIA'),erp=incident.filter(d=>v3Classify(d)==='MÁS EN ERPCO'),criticalRows=incident.filter(d=>Math.abs(d.diferencia)>=critical).slice(0,5);const net=totalCIA(r)-totalERP(r);let headline=Math.abs(net)<=tol?'La conciliación global está cuadrada dentro de la tolerancia configurada.':`La diferencia global sin IVA es ${money(net)} (${net>0?'mayor en CIA':'mayor en ERPCO'}).`;const suggestions=[];if(missing.length)suggestions.push(`Revisar ${missing.length} conductor(es) que aparecen solamente en uno de los dos sistemas.`);if(cia.length)suggestions.push(`${cia.length} conductor(es) tienen un importe mayor en CIA; conviene revisar ventas o capturas pendientes en ERPCO.`);if(erp.length)suggestions.push(`${erp.length} conductor(es) tienen un importe mayor en ERPCO; conviene revisar registros faltantes o ajustes en CIA.`);const difCanje=Object.values(r.cia.summary).reduce((a,c)=>a+Math.abs(c.difCanje||0),0);if(difCanje)suggestions.push(`Se detectaron ${money(difCanje)} de Dif. Canje, integrados automáticamente en Otros ingresos.`);if(!suggestions.length)suggestions.push('No se detectaron incidencias relevantes por conductor.');$('#smartAnalysis').innerHTML=`<h3>${headline}</h3><p>Se analizaron <b>${r.diffs.length}</b> conductores: <b>${incident.length}</b> con diferencia y <b>${missing.length}</b> faltantes.</p><ul>${suggestions.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul>${criticalRows.length?`<p class="critical">Diferencias prioritarias: ${criticalRows.map(x=>`${escapeHtml(x.id)} (${money(x.diferencia)})`).join(', ')}.</p>`:''}`}
$('#copyAnalysis').onclick=async()=>{const text=$('#smartAnalysis').innerText;try{await navigator.clipboard.writeText(text);setStatus('Análisis copiado al portapapeles.','ok')}catch{setStatus('No fue posible copiar el análisis.','error')}};

function prepCanvas(canvas){const rect=canvas.getBoundingClientRect(),ratio=window.devicePixelRatio||1,w=Math.max(320,Math.floor(rect.width));canvas.width=w*ratio;canvas.height=280*ratio;const ctx=canvas.getContext('2d');ctx.setTransform(ratio,0,0,ratio,0,0);return{ctx,w,h:280}}
function renderCharts(){drawBrandChart();drawStatusChart()}
function drawBrandChart(){const {ctx,w,h}=prepCanvas($('#brandChart')),r=state.result,items=Object.keys(r.cia.summary).map(b=>{const c=r.cia.summary[b],e=r.erpco[b]||{};return[b,Math.abs((c.canje+c.efectivo+c.prepago)-((e.canje||0)+(e.efectivo||0)+(e.prepago||0))) ]});const max=Math.max(1,...items.map(x=>x[1])),pad=45,barW=(w-pad*2)/Math.max(1,items.length);ctx.clearRect(0,0,w,h);ctx.font='12px sans-serif';ctx.fillStyle=getComputedStyle(document.body).color;items.forEach(([label,val],i)=>{const bh=(h-90)*(val/max),x=pad+i*barW+barW*.18,y=h-45-bh;ctx.fillStyle='#7c3aed';ctx.fillRect(x,y,barW*.64,bh);ctx.fillStyle=getComputedStyle(document.body).color;ctx.textAlign='center';ctx.fillText(money(val),x+barW*.32,Math.max(15,y-8));ctx.fillText(label.replace(' VOLKSBUS',' VB'),x+barW*.32,h-20)});ctx.strokeStyle='#94a3b8';ctx.beginPath();ctx.moveTo(pad,h-45);ctx.lineTo(w-pad,h-45);ctx.stroke()}
function drawStatusChart(){const {ctx,w,h}=prepCanvas($('#statusChart')),counts={CUADRADO:0,'MÁS EN CIA':0,'MÁS EN ERPCO':0,FALTANTE:0};state.result.diffs.forEach(d=>counts[v3Classify(d)]++);const entries=Object.entries(counts),total=Math.max(1,state.result.diffs.length),colors=['#16a34a','#f59e0b','#f97316','#dc2626'];ctx.clearRect(0,0,w,h);const cx=Math.min(145,w*.27),cy=130,r=82;let start=-Math.PI/2;entries.forEach(([k,v],i)=>{const a=(v/total)*Math.PI*2;ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,start,start+a);ctx.closePath();ctx.fillStyle=colors[i];ctx.fill();start+=a});ctx.beginPath();ctx.arc(cx,cy,45,0,Math.PI*2);ctx.fillStyle=getComputedStyle(document.body).getPropertyValue('--card');ctx.fill();ctx.fillStyle=getComputedStyle(document.body).color;ctx.textAlign='center';ctx.font='bold 20px sans-serif';ctx.fillText(total,cx,cy+7);ctx.textAlign='left';ctx.font='13px sans-serif';entries.forEach(([k,v],i)=>{const y=72+i*38,x=Math.min(260,w*.52);ctx.fillStyle=colors[i];ctx.fillRect(x,y-11,16,16);ctx.fillStyle=getComputedStyle(document.body).color;ctx.fillText(`${k}: ${v}`,x+25,y+2)})}
window.addEventListener('resize',()=>{if(state.result)renderCharts()});

function searchDriver(){if(!state.result)return;const q=$('#driverQuery').value.trim().toUpperCase();if(!q){$('#driverResult').className='driver-result status muted';$('#driverResult').textContent='Escribe el número o nombre del conductor.';return}const d=state.result.diffs.find(x=>String(x.id).toUpperCase()===q)||state.result.diffs.find(x=>`${x.id} ${x.nombre}`.toUpperCase().includes(q));if(!d){$('#driverResult').className='driver-result status error';$('#driverResult').textContent='No se encontró un conductor que coincida con la búsqueda.';return}const kind=v3Classify(d);$('#driverResult').className='driver-result';$('#driverResult').innerHTML=`<h3>${escapeHtml(d.nombre||'Conductor')} · ${escapeHtml(d.id)}</h3><p><span class="pill ${kind==='CUADRADO'?'ok':kind==='FALTANTE'?'bad':'warn'}">${escapeHtml(kind)}</span> ${escapeHtml(d.marca||'Sin marca')}</p><div class="driver-kpis"><div><small>CIA</small><strong>${money(d.ciaTotal)}</strong></div><div><small>ERPCO</small><strong>${money(d.erpcoTotal)}</strong></div><div><small>Diferencia</small><strong>${money(d.diferencia)}</strong></div><div><small>Mayor diferencia</small><strong>${money(Math.max(Math.abs(d.difCanje),Math.abs(d.difEfectivo),Math.abs(d.difPrepago)))}</strong></div></div><p class="hint">Canje ${money(d.difCanje)} · Efectivo ${money(d.difEfectivo)} · Prepago ${money(d.difPrepago)}</p>`}
$('#driverSearchBtn').onclick=searchDriver;$('#driverQuery').addEventListener('keydown',e=>{if(e.key==='Enter')searchDriver()});


/* =========================
   MASTERWEB PRO 5.0 — usuarios desde Google Sheets
   ========================= */
const V4_SESSION='masterweb_session_v4';
const USERS_API_URL='https://script.google.com/macros/s/AKfycbxbpunye5mRfeGk86f2DTdpMf63tYdsYRFbsJqDz7NS7h36c645yNG4zGVs1WOfSKVmcQ/exec';
let availableUsers=[];

function showAppSession(session){
  const active=Boolean(session);
  $('#loginScreen').classList.toggle('hidden-login',active);
  if(active){
    $('#currentUser').textContent=session.name||session.user;
    const avatar=document.querySelector('.sidebar-user .avatar');
    if(avatar) avatar.textContent=(session.name||session.user||'U').trim().charAt(0).toUpperCase();
    document.body.dataset.user=session.user;
  }
}
function normalizeUsers(payload){
  const source=Array.isArray(payload)?payload:(payload?.usuarios||payload?.users||payload?.data||[]);
  return source.map((x,i)=>{
    if(typeof x==='string') return {user:x,name:x,role:''};
    return {
      user:String(x.usuario??x.user??x.username??x.correo??x.email??'').trim(),
      name:String(x.nombre??x.name??x.usuario??x.user??'').trim(),
      role:String(x.rol??x.role??'').trim()
    };
  }).filter(x=>x.user);
}
async function loadUsers(){
  const select=$('#loginUser'),btn=$('#loginBtn'),msg=$('#loginMessage');
  select.disabled=true; btn.disabled=true;
  select.innerHTML='<option value="">Cargando usuarios…</option>';
  msg.textContent='Consultando la lista de usuarios…';
  try{
    const url=`${USERS_API_URL}?accion=usuarios&_=${Date.now()}`;
    const response=await fetch(url,{cache:'no-store',redirect:'follow'});
    if(!response.ok) throw new Error(`Respuesta HTTP ${response.status}`);
    const raw=await response.text();
    let payload;
    try{payload=JSON.parse(raw)}catch{
      throw new Error(`La API no devolvió JSON válido. Respuesta: ${raw.slice(0,120)}`);
    }
    if(payload?.ok===false||payload?.error===true) throw new Error(payload.mensaje||'La API rechazó la solicitud.');
    availableUsers=normalizeUsers(payload);
    if(!availableUsers.length) throw new Error('La hoja no contiene usuarios activos.');
    select.innerHTML='<option value="">Selecciona tu usuario</option>'+availableUsers.map(u=>`<option value="${escapeHtml(u.user)}">${escapeHtml(u.name||u.user)}${u.role?` · ${escapeHtml(u.role)}`:''}</option>`).join('');
    select.disabled=false; btn.disabled=false; msg.textContent='';
  }catch(error){
    console.error('No fue posible cargar usuarios:',error);
    availableUsers=[];
    select.innerHTML='<option value="">No se pudieron cargar los usuarios</option>';
    msg.textContent='No fue posible consultar Google Sheets. Revisa la implementación de Apps Script y vuelve a intentarlo.';
  }
}
async function login(){
  const user=$('#loginUser').value.trim(),password=$('#loginPassword').value;
  const btn=$('#loginBtn'),msg=$('#loginMessage');
  if(!user){msg.textContent='Selecciona un usuario.';return;}
  if(!password){msg.textContent='Escribe la contraseña.';return;}
  btn.disabled=true; btn.textContent='Validando…'; msg.textContent='';
  try{
    // Enviar JSON como text/plain evita el preflight CORS de GitHub Pages y
    // coincide con JSON.parse(e.postData.contents) en Google Apps Script.
    const body=JSON.stringify({accion:'login',usuario:user,password});
    const response=await fetch(USERS_API_URL,{
      method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body,
      cache:'no-store',
      redirect:'follow'
    });
    if(!response.ok) throw new Error(`Respuesta HTTP ${response.status}`);
    const raw=await response.text();
    let payload;
    try{payload=JSON.parse(raw)}catch{
      throw new Error(`La API no devolvió JSON válido. Respuesta: ${raw.slice(0,120)}`);
    }
    if(!(payload?.ok===true||payload?.success===true||payload?.autorizado===true)){
      throw new Error(payload?.mensaje||'Usuario o contraseña incorrectos.');
    }
    const listed=availableUsers.find(x=>x.user.toLowerCase()===user.toLowerCase());
    const data=payload.usuario||payload.userData||payload.data||{};
    const session={
      user:String(data.usuario??data.user??user),
      name:String(data.nombre??data.name??listed?.name??user),
      role:String(data.rol??data.role??listed?.role??''),
      loginAt:new Date().toISOString()
    };
    sessionStorage.setItem(V4_SESSION,JSON.stringify(session));
    $('#loginPassword').value=''; msg.textContent=''; showAppSession(session);
  }catch(error){
    console.error('Error de acceso:',error);
    msg.textContent=error.message||'No fue posible validar el acceso.';
  }finally{
    btn.disabled=availableUsers.length===0; btn.textContent='Ingresar';
  }
}
$('#loginBtn').onclick=login;
$('#reloadUsersBtn').onclick=loadUsers;
$('#loginPassword').addEventListener('keydown',e=>{if(e.key==='Enter')login()});
$('#logoutBtn').onclick=()=>{sessionStorage.removeItem(V4_SESSION);showAppSession(null);$('#loginPassword').value='';loadUsers()};
try{
  const saved=JSON.parse(sessionStorage.getItem(V4_SESSION)||'null');
  showAppSession(saved);
  if(!saved) loadUsers();
}catch{showAppSession(null);loadUsers()}

// Añade el usuario que realizó la operación a cada nuevo registro del historial.
const v4OriginalSaveHistory=typeof saveHistory==='function'?saveHistory:null;
if(v4OriginalSaveHistory){
  saveHistory=function(item){
    const session=JSON.parse(sessionStorage.getItem(V4_SESSION)||'null');
    v4OriginalSaveHistory({...item,usuario:session?.name||session?.user||'Usuario'});
  }
}
