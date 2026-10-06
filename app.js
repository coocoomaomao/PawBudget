const CATEGORIES = [
  {id:'food',name:'食物',icon:'🥣',color:'#57be91'},
  {id:'daily',name:'日用',icon:'🧻',color:'#66a7ed'},
  {id:'clothes',name:'衣服',icon:'👕',color:'#ef8391'},
  {id:'toys',name:'玩具',icon:'🧸',color:'#f1a448'},
  {id:'grooming',name:'洗护美容',icon:'🫧',color:'#a486e3'},
  {id:'health',name:'健康',icon:'🩹',color:'#54c5bd'},
  {id:'service',name:'大件/服务',icon:'🧳',color:'#8093aa'}
];

const STORAGE_KEY='pawbudget-v01';
const REAL_BACKUP_KEY='pawbudget-real-backup-v01';
const now=new Date();
const y=now.getFullYear(), m=now.getMonth();
const iso=d=>new Date(d).toISOString().slice(0,10);
const dateInMonth=day=>iso(new Date(y,m,Math.min(day,new Date(y,m+1,0).getDate()),12));
const clone=value=>JSON.parse(JSON.stringify(value));
const REAL_PET={name:'主子',age:'',weight:'',note:'点这里完善宠物档案'};
const DEMO_PET={name:'墨团',age:'3岁',weight:5.2,note:'有点胖，但很可爱！'};

const demoState={
  demo:true,
  pet:DEMO_PET,
  records:[
    {id:1,amount:369,item:'六种鱼猫粮 6kg',category:'food',date:dateInMonth(2),note:'囤粮'},
    {id:2,amount:129,item:'万圣节斗篷',category:'clothes',date:dateInMonth(6),note:'拍照超可爱'},
    {id:3,amount:58,item:'冻干鸡胸肉',category:'food',date:dateInMonth(8),note:''},
    {id:4,amount:79,item:'豆腐猫砂',category:'daily',date:dateInMonth(10),note:''},
    {id:5,amount:46,item:'羽毛逗猫棒',category:'toys',date:dateInMonth(12),note:'只玩了纸盒'},
    {id:6,amount:120,item:'洗护美容',category:'grooming',date:dateInMonth(15),note:'香香猫'},
    {id:7,amount:92,item:'体内外驱虫',category:'health',date:dateInMonth(18),note:''},
    {id:8,amount:23.8,item:'鸡胸肉罐头',category:'food',date:iso(now),note:'今天加餐'}
  ],
  inventory:[
    {id:1,name:'猫粮',totalQuantity:6000,remainQuantity:2405,dailyUsage:65,unit:'g',restocks:[{date:dateInMonth(2),quantity:6000,cost:369,note:'月初囤粮'}]},
    {id:2,name:'猫砂',totalQuantity:6000,remainQuantity:2700,dailyUsage:300,unit:'g',restocks:[{date:dateInMonth(10),quantity:6000,cost:79,note:'豆腐猫砂'}]},
    {id:3,name:'罐头',totalQuantity:12,remainQuantity:3,dailyUsage:1,unit:'罐',restocks:[{date:dateInMonth(8),quantity:12,cost:0,note:'家里原有库存'}]},
    {id:4,name:'湿巾',totalQuantity:80,remainQuantity:24,dailyUsage:1,unit:'片',restocks:[]}
  ],
  wardrobe:[
    {id:1,name:'小黄鸭雨衣',price:128,wears:6,emoji:'🐥',wearHistory:[{date:dateInMonth(3)},{date:dateInMonth(9)}]},
    {id:2,name:'万圣节斗篷',price:199,wears:2,emoji:'🧙',wearHistory:[{date:dateInMonth(6)}]},
    {id:3,name:'圣诞围巾',price:89,wears:4,emoji:'🧣',wearHistory:[]},
    {id:4,name:'薄荷绿小领结',price:59,wears:8,emoji:'🎀',wearHistory:[{date:dateInMonth(12)}]}
  ]
};

function emptyState(){return {demo:false,pet:clone(REAL_PET),records:[],inventory:[],wardrobe:[]}}
function normalizeState(raw){
  const s=raw&&typeof raw==='object'?raw:emptyState();
  s.demo=Boolean(s.demo);
  s.pet={...(s.demo?DEMO_PET:REAL_PET),...(s.pet||{})};
  s.records=Array.isArray(s.records)?s.records:[];
  s.wardrobe=(Array.isArray(s.wardrobe)?s.wardrobe:[]).map(w=>({
    ...w,
    price:Number(w.price||0),
    wears:Number(w.wears||0),
    wearHistory:Array.isArray(w.wearHistory)?w.wearHistory:[]
  }));
  s.inventory=(Array.isArray(s.inventory)?s.inventory:[]).map(i=>{
    if(i.remainQuantity==null && i.days!=null){
      return {...i,totalQuantity:Number(i.total||30),remainQuantity:Number(i.days),dailyUsage:1,unit:i.unit||'天',restocks:Array.isArray(i.restocks)?i.restocks:[]};
    }
    return {
      ...i,
      totalQuantity:Number(i.totalQuantity||0),
      remainQuantity:Number(i.remainQuantity||0),
      dailyUsage:Number(i.dailyUsage||0),
      unit:i.unit||'份',
      restocks:Array.isArray(i.restocks)?i.restocks:[]
    };
  });
  return s;
}
function load(){
  try{return normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY))||emptyState())}
  catch{return emptyState()}
}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
function esc(value){return String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]))}
function money(n){return `¥${Number(n||0).toLocaleString('zh-CN',{maximumFractionDigits:2})}`}
function cat(id){return CATEGORIES.find(c=>c.id===id)||CATEGORIES[6]}
function sum(records){return records.reduce((a,b)=>a+Number(b.amount||0),0)}
function isSameDay(a,b){return String(a).slice(0,10)===String(b).slice(0,10)}
function inMonth(d){const x=new Date(d);return x.getFullYear()===y&&x.getMonth()===m}
function inYear(d){return new Date(d).getFullYear()===y}
function byCategory(records){const out={};CATEGORIES.forEach(c=>out[c.id]=0);records.forEach(r=>out[r.category]=(out[r.category]||0)+Number(r.amount));return out}
function inventoryDays(i){return Number(i.dailyUsage)>0?Math.max(0,Math.ceil(Number(i.remainQuantity||0)/Number(i.dailyUsage))):0}
function toast(msg){const el=document.querySelector('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),1800)}
function daysElapsedInYear(){return Math.max(1,Math.floor((now-new Date(y,0,1))/86400000)+1)}

let state=load();
let selectedCategory='food';
let filter='all';
let editingRecordId=null;

function render(){renderPet();renderHome();renderRecords();renderInventory();renderWardrobe();renderReport()}
function renderPet(){
  const p=state.pet;
  const meta=[p.name,p.age,p.weight?`${p.weight}kg`:''].filter(Boolean).join(' · ');
  document.querySelector('#petTitle').textContent=meta||'主子';
  document.querySelector('#petSub').textContent=p.note||'点这里完善宠物档案';
  document.querySelector('#commentLabel').textContent=`${p.name||'主子'}的消费点评`;
  document.querySelector('#wardrobeHeading').textContent=`${p.name||'主子'}的衣橱`;
  document.querySelector('#reportPetName').textContent=p.name||'主子';
}
function renderHome(){
  const today=state.records.filter(r=>isSameDay(r.date,iso(now)));
  const month=state.records.filter(r=>inMonth(r.date));
  const yearRecords=state.records.filter(r=>inYear(r.date));
  document.querySelector('#todaySpend').textContent=money(sum(today));
  document.querySelector('#monthSpend').textContent=money(sum(month));
  document.querySelector('#yearSpend').textContent=money(sum(yearRecords));
  const food=state.inventory.find(i=>/[猫狗]粮|主粮|粮/.test(i.name));
  document.querySelector('#foodDays').textContent=food?`${inventoryDays(food)} 天`:'-- 天';
  document.querySelector('#monthLabel').textContent=`${y}年${m+1}月`;
  document.querySelector('#donutTotal').textContent=money(sum(month));

  const data=byCategory(month),total=Math.max(sum(month),1);
  let acc=0;const stops=[];
  CATEGORIES.slice(0,6).forEach(c=>{const pct=data[c.id]/total*100;if(pct>0){stops.push(`${c.color} ${acc}% ${acc+pct}%`);acc+=pct}});
  if(!stops.length)stops.push('#e9efeb 0 100%');
  document.querySelector('#donut').style.background=`conic-gradient(${stops.join(',')})`;
  document.querySelector('#legend').innerHTML=CATEGORIES.slice(0,6).map(c=>`<div class="legend-row"><i class="legend-dot" style="background:${c.color}"></i><span>${c.name}</span><b>${Math.round(data[c.id]/total*100)}%</b></div>`).join('');

  const monthTotal=sum(month);
  let msg='今天还没花钱？本猫不信。';
  if(monthTotal>1200)msg='这个月……我们不看账单好不好？';
  else if(data.clothes>250)msg='我需要这么多衣服吗？……需要。';
  else if(data.toys>200)msg='你买你的，我玩纸箱。';
  else if(monthTotal>0)msg='本月还好，本猫没有太败家喵。';
  document.querySelector('#mascotComment').textContent=msg;
}
function renderRecords(){
  document.querySelector('#recordFilters').innerHTML=[{id:'all',name:'全部'},...CATEGORIES].map(c=>`<button class="filter-chip ${filter===c.id?'active':''}" data-filter="${c.id}">${c.name}</button>`).join('');
  const records=[...state.records].sort((a,b)=>String(b.date).localeCompare(String(a.date))).filter(r=>filter==='all'||r.category===filter);
  document.querySelector('#recordList').innerHTML=records.length?records.map(r=>{
    const c=cat(r.category);
    return `<article class="record-item">
      <div class="record-cat" style="background:${c.color}22">${c.icon}</div>
      <div><div class="record-title">${esc(r.item)}</div><div class="record-meta">${c.name} · ${esc(r.date)}${r.note?` · ${esc(r.note)}`:''}</div></div>
      <div class="record-side"><div class="record-amount">${money(r.amount)}</div><div class="record-actions"><button class="tiny-action record-edit" data-id="${esc(r.id)}">编辑</button><button class="tiny-action danger record-delete" data-id="${esc(r.id)}">删除</button></div></div>
    </article>`;
  }).join(''):'<div class="empty">还没有消费记录。<br>今天真的没花钱吗？😼</div>';
}
function renderInventory(){
  document.querySelector('#inventoryList').innerHTML=state.inventory.length?state.inventory.map(i=>{
    const days=inventoryDays(i),cls=days<=3?'danger':days<=10?'warn':'good';
    const pct=Number(i.totalQuantity)>0?Math.max(3,Math.min(100,Number(i.remainQuantity)/Number(i.totalQuantity)*100)):Math.max(3,Math.min(100,days/30*100));
    const last=[...(i.restocks||[])].sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0];
    return `<article class="inventory-item">
      <div class="inventory-top"><div><div class="inventory-name">${esc(i.name)}</div><div class="inventory-quantity">剩余 ${esc(i.remainQuantity)} ${esc(i.unit)} · 日均 ${esc(i.dailyUsage)} ${esc(i.unit)}</div></div><span class="badge ${cls}">${days} 天</span></div>
      <div class="progress"><i style="width:${pct}%"></i></div>
      <div class="inventory-meta"><span>${days<=3?'需要补货了！':days<=10?'快到补货线':'库存充足'}</span><span>预计 ${days} 天后用完</span></div>
      ${last?`<div class="history-line">最近补货：${esc(last.date)} · +${esc(last.quantity)} ${esc(i.unit)}${Number(last.cost)>0?` · ${money(last.cost)}`:''}</div>`:''}
      <div class="inventory-actions"><button class="inline-action accent inventory-restock" data-id="${esc(i.id)}">＋ 补货</button></div>
    </article>`;
  }).join(''):'<div class="empty">库存空空的。<br>先把主子的口粮加进来吧。</div>';
}
function renderWardrobe(){
  const total=state.wardrobe.reduce((a,b)=>a+Number(b.price),0);
  const wears=state.wardrobe.reduce((a,b)=>a+Number(b.wears),0);
  const costs=state.wardrobe.map(w=>Number(w.wears)>0?Number(w.price)/Number(w.wears):Number(w.price));
  document.querySelector('#wardrobeTotal').textContent=money(total);
  document.querySelector('#wearCount').textContent=`${wears} 次`;
  document.querySelector('#highestWearCost').textContent=money(costs.length?Math.max(...costs):0);
  document.querySelector('#wardrobeList').innerHTML=state.wardrobe.length?state.wardrobe.map(w=>{
    const last=[...(w.wearHistory||[])].sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0];
    return `<article class="wardrobe-item"><div class="wardrobe-visual">${esc(w.emoji||'👕')}</div><div class="wardrobe-body"><strong>${esc(w.name)}</strong><small>入手 ${money(w.price)} · 穿 ${esc(w.wears)} 次</small><div class="wear-cost">单次穿着成本 ${money(Number(w.wears)>0?Number(w.price)/Number(w.wears):Number(w.price))}</div>${last?`<div class="history-line">最近穿着：${esc(last.date)}</div>`:''}<button class="inline-action accent wardrobe-wear" data-id="${esc(w.id)}">✓ 今天穿了</button></div></article>`;
  }).join(''):'<div class="empty">衣橱还空着。<br>第一件穿搭会是什么？</div>';
}
function renderReport(){
  const records=state.records.filter(r=>inYear(r.date)),total=sum(records),data=byCategory(records),max=Math.max(...Object.values(data),1);
  document.querySelector('#reportYear').textContent=y;
  document.querySelector('#reportTotal').textContent=money(total);
  document.querySelector('#reportDaily').textContent=money(total/daysElapsedInYear());
  document.querySelector('#reportBars').innerHTML=CATEGORIES.filter(c=>data[c.id]>0).sort((a,b)=>data[b.id]-data[a.id]).map(c=>`<div class="bar-row"><span>${c.icon} ${c.name}</span><div class="bar-track"><i style="width:${data[c.id]/max*100}%;background:${c.color}"></i></div><span class="bar-money">${money(data[c.id])}</span></div>`).join('')||'<div class="empty">今年还没有消费数据</div>';
}

function nav(page){
  document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.dataset.page===page));
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.nav===page));
  window.scrollTo({top:0,behavior:'smooth'});
}
document.addEventListener('click',e=>{
  const n=e.target.closest('[data-nav]');if(n)nav(n.dataset.nav);
  const a=e.target.closest('[data-action="add"]');if(a)openExpense();
  const f=e.target.closest('[data-filter]');if(f){filter=f.dataset.filter;renderRecords()}
  const edit=e.target.closest('.record-edit');if(edit)openExpense(edit.dataset.id);
  const del=e.target.closest('.record-delete');if(del)deleteRecord(del.dataset.id);
  const restock=e.target.closest('.inventory-restock');if(restock)openRestock(restock.dataset.id);
  const wear=e.target.closest('.wardrobe-wear');if(wear)recordWear(wear.dataset.id);
});

const expenseDialog=document.querySelector('#expenseDialog');
function openExpense(recordId=null){
  editingRecordId=recordId;
  const record=recordId!=null?state.records.find(r=>String(r.id)===String(recordId)):null;
  selectedCategory=record?.category||'food';
  document.querySelector('#expenseModalTitle').textContent=record?'编辑消费':'记一笔消费';
  document.querySelector('#expenseSubmitBtn').textContent=record?'保存修改':'保存记录';
  document.querySelector('#amountInput').value=record?.amount??'';
  document.querySelector('#itemInput').value=record?.item??'';
  document.querySelector('#noteInput').value=record?.note??'';
  document.querySelector('#dateInput').value=record?.date||iso(now);
  renderCategoryPicker();
  expenseDialog.showModal();
}
function renderCategoryPicker(){
  document.querySelector('#categoryPicker').innerHTML=CATEGORIES.map(c=>`<button type="button" class="category-option ${selectedCategory===c.id?'active':''}" data-cat="${c.id}">${c.icon}<br>${c.name}</button>`).join('');
}
document.querySelector('#categoryPicker').addEventListener('click',e=>{const b=e.target.closest('[data-cat]');if(b){selectedCategory=b.dataset.cat;renderCategoryPicker()}});
document.querySelector('#expenseForm').addEventListener('submit',e=>{
  e.preventDefault();
  const amount=Number(document.querySelector('#amountInput').value),item=document.querySelector('#itemInput').value.trim();
  if(!amount||!item)return;
  const payload={amount,item,category:selectedCategory,date:document.querySelector('#dateInput').value,note:document.querySelector('#noteInput').value.trim()};
  if(editingRecordId!=null){
    const idx=state.records.findIndex(r=>String(r.id)===String(editingRecordId));
    if(idx>=0)state.records[idx]={...state.records[idx],...payload};
  }else state.records.push({id:Date.now(),...payload});
  save();render();expenseDialog.close();toast(editingRecordId!=null?'修改好啦 ✨':'记好啦，本猫知道你又花钱了 😼');editingRecordId=null;
});
function deleteRecord(id){
  const record=state.records.find(r=>String(r.id)===String(id));
  if(!record)return;
  if(!confirm(`确定删除“${record.item}”这笔消费吗？`))return;
  state.records=state.records.filter(r=>String(r.id)!==String(id));save();render();toast('这笔记录已经删除');
}
['#quickAddBtn','#addRecordBtn'].forEach(s=>document.querySelector(s).addEventListener('click',()=>openExpense()));

const petDialog=document.querySelector('#petDialog');
document.querySelector('#petHero').addEventListener('click',()=>{
  const p=state.pet;
  document.querySelector('#petNameInput').value=p.name||'';
  document.querySelector('#petAgeInput').value=p.age||'';
  document.querySelector('#petWeightInput').value=p.weight||'';
  document.querySelector('#petNoteInput').value=p.note||'';
  petDialog.showModal();
});
document.querySelector('#petForm').addEventListener('submit',e=>{
  e.preventDefault();
  state.pet={
    name:document.querySelector('#petNameInput').value.trim()||'主子',
    age:document.querySelector('#petAgeInput').value.trim(),
    weight:Number(document.querySelector('#petWeightInput').value)||'',
    note:document.querySelector('#petNoteInput').value.trim()
  };
  save();render();petDialog.close();toast('主子档案更新啦 🐾');
});

const simpleDialog=document.querySelector('#simpleDialog');let simpleMode='';
function openSimple(mode){
  simpleMode=mode;const fields=document.querySelector('#simpleFields');
  if(mode==='inventory'){
    document.querySelector('#simpleTitle').textContent='添加库存';
    document.querySelector('#simpleSubtitle').textContent='填剩余量和日均消耗，自动算还能用几天';
    fields.innerHTML='<label>名称<input name="name" placeholder="例如：猫粮" required></label><label>购买总量<input name="totalQuantity" type="number" min="0" step="0.01" placeholder="6000" required></label><label>当前剩余量<input name="remainQuantity" type="number" min="0" step="0.01" placeholder="2405" required></label><label>单位<input name="unit" value="g" placeholder="g / 罐 / 袋 / 片" required></label><label>每日平均消耗<input name="dailyUsage" type="number" min="0.01" step="0.01" placeholder="65" required></label>';
  }else{
    document.querySelector('#simpleTitle').textContent='添加衣橱';
    document.querySelector('#simpleSubtitle').textContent='算算每次穿它到底值不值';
    fields.innerHTML='<label>名称<input name="name" placeholder="例如：小黄鸭雨衣" required></label><label>入手价<input name="price" type="number" min="0" step="0.01" required></label><label>已穿次数<input name="wears" type="number" min="0" value="0" required></label><label>小图标<input name="emoji" value="👕"></label>';
  }
  simpleDialog.showModal();
}
document.querySelector('#addInventoryBtn').addEventListener('click',()=>openSimple('inventory'));
document.querySelector('#addWardrobeBtn').addEventListener('click',()=>openSimple('wardrobe'));
document.querySelector('#simpleForm').addEventListener('submit',e=>{
  e.preventDefault();const fd=new FormData(e.target);
  if(simpleMode==='inventory'){
    state.inventory.push({id:Date.now(),name:fd.get('name').trim(),totalQuantity:Number(fd.get('totalQuantity')),remainQuantity:Number(fd.get('remainQuantity')),dailyUsage:Number(fd.get('dailyUsage')),unit:fd.get('unit').trim()||'份',restocks:[]});
  }else{
    state.wardrobe.push({id:Date.now(),name:fd.get('name').trim(),price:Number(fd.get('price')),wears:Number(fd.get('wears')),emoji:fd.get('emoji').trim()||'👕',wearHistory:[]});
  }
  save();render();simpleDialog.close();e.target.reset();toast('保存成功 ✨');
});

let restockInventoryId=null;
const restockDialog=document.querySelector('#restockDialog');
function openRestock(id){
  const item=state.inventory.find(i=>String(i.id)===String(id));if(!item)return;
  restockInventoryId=id;
  document.querySelector('#restockTitle').textContent=`${item.name} · 补货`;
  document.querySelector('#restockQuantityInput').value='';
  document.querySelector('#restockCostInput').value='';
  document.querySelector('#restockDateInput').value=iso(now);
  document.querySelector('#restockNoteInput').value='';
  restockDialog.showModal();
}
function inventoryExpenseCategory(name){
  if(/粮|罐头|冻干|零食|肉|营养/.test(name))return 'food';
  if(/驱虫|药|疫苗|保健/.test(name))return 'health';
  return 'daily';
}
document.querySelector('#restockForm').addEventListener('submit',e=>{
  e.preventDefault();
  const item=state.inventory.find(i=>String(i.id)===String(restockInventoryId));if(!item)return;
  const quantity=Number(document.querySelector('#restockQuantityInput').value);
  const cost=Number(document.querySelector('#restockCostInput').value||0);
  const date=document.querySelector('#restockDateInput').value;
  const note=document.querySelector('#restockNoteInput').value.trim();
  if(!quantity||quantity<=0)return;
  item.remainQuantity=Number(item.remainQuantity||0)+quantity;
  item.totalQuantity=Math.max(Number(item.totalQuantity||0),Number(item.remainQuantity||0));
  item.restocks=Array.isArray(item.restocks)?item.restocks:[];
  item.restocks.push({id:Date.now(),date,quantity,cost,note});
  if(cost>0)state.records.push({id:Date.now()+1,amount:cost,item:`${item.name}补货`,category:inventoryExpenseCategory(item.name),date,note:note||'库存补货'});
  save();render();restockDialog.close();toast(cost>0?'补货成功，花费也记到账本啦':'补货成功，库存已更新');
});
function recordWear(id){
  const item=state.wardrobe.find(w=>String(w.id)===String(id));if(!item)return;
  item.wearHistory=Array.isArray(item.wearHistory)?item.wearHistory:[];
  if(item.wearHistory.some(x=>x.date===iso(now))){toast('今天已经记录过这套穿搭啦 👕');return;}
  item.wearHistory.push({id:Date.now(),date:iso(now)});
  item.wears=Number(item.wears||0)+1;
  save();render();toast(`${item.name} +1 次穿着，越来越值啦 ✨`);
}

function setDemoMode(){
  if(state.demo){
    let restored=emptyState();
    try{restored=normalizeState(JSON.parse(localStorage.getItem(REAL_BACKUP_KEY))||emptyState())}catch{}
    restored.demo=false;state=restored;save();render();toast('已恢复你的真实账本');
  }else{
    localStorage.setItem(REAL_BACKUP_KEY,JSON.stringify({...state,demo:false}));
    state=clone(demoState);save();render();toast('已进入墨团演示模式');
  }
}
document.querySelector('#demoBtn').addEventListener('click',setDemoMode);

function rounded(ctx,x,y,w,h,r,fill){
  ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();
}
function drawCat(ctx,cx,cy,scale=1){
  ctx.save();ctx.translate(cx,cy);ctx.scale(scale,scale);
  ctx.fillStyle='#111820';
  ctx.beginPath();ctx.moveTo(-65,-28);ctx.lineTo(-54,-92);ctx.lineTo(-20,-55);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(65,-28);ctx.lineTo(54,-92);ctx.lineTo(20,-55);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.ellipse(0,0,76,68,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(-25,-10,12,16,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(25,-10,12,16,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#111820';ctx.beginPath();ctx.arc(-22,-7,5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(28,-7,5,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#ef9ca4';ctx.beginPath();ctx.ellipse(-39,20,13,7,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(39,20,13,7,0,0,Math.PI*2);ctx.fill();
  ctx.strokeStyle='#fff';ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-12,18);ctx.quadraticCurveTo(0,30,12,18);ctx.stroke();
  ctx.fillStyle='#58c8a6';ctx.beginPath();ctx.moveTo(-12,-67);ctx.quadraticCurveTo(0,-96,12,-68);ctx.quadraticCurveTo(3,-71,0,-58);ctx.quadraticCurveTo(-4,-70,-12,-67);ctx.fill();
  ctx.restore();
}
function generateSharePoster(){
  const canvas=document.querySelector('#shareCanvas'),ctx=canvas.getContext('2d'),W=900,H=1200;
  const p=state.pet,records=state.records.filter(r=>inYear(r.date)),total=sum(records),data=byCategory(records);
  const sorted=CATEGORIES.filter(catItem=>data[catItem.id]>0).sort((a,b)=>data[b.id]-data[a.id]).slice(0,5);
  const top=sorted[0];
  const wardrobeCosts=state.wardrobe.map(w=>({name:w.name,cost:Number(w.wears)>0?Number(w.price)/Number(w.wears):Number(w.price)})).sort((a,b)=>b.cost-a.cost);
  const expensiveWear=wardrobeCosts[0];
  const tight=[...state.inventory].sort((a,b)=>inventoryDays(a)-inventoryDays(b))[0];

  ctx.clearRect(0,0,W,H);
  const grad=ctx.createLinearGradient(0,0,W,H);grad.addColorStop(0,'#fffaf1');grad.addColorStop(.55,'#f0fbf6');grad.addColorStop(1,'#ffe9e4');ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);

  ctx.globalAlpha=.35;ctx.fillStyle='#91d8c2';ctx.beginPath();ctx.arc(840,80,120,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f4b8bd';ctx.beginPath();ctx.arc(80,1130,95,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;

  ctx.fillStyle='#0f6f5d';ctx.font='900 52px "PingFang SC","Microsoft YaHei",sans-serif';ctx.fillText('PawBudget',58,72);
  ctx.fillStyle='#71817b';ctx.font='700 18px "PingFang SC","Microsoft YaHei",sans-serif';ctx.fillText('MEOWBUILD LAB · 007',60,105);

  rounded(ctx,48,142,804,255,40,'#dff7ef');
  ctx.fillStyle='#12312e';ctx.font='900 45px "PingFang SC","Microsoft YaHei",sans-serif';ctx.fillText(`${p.name||'主子'}的 ${y} 年度账单`,78,215);
  ctx.fillStyle='#5f746c';ctx.font='500 23px "PingFang SC","Microsoft YaHei",sans-serif';ctx.fillText('这一年，谢谢你把最好的都给我 ♡',80,255);
  ctx.fillStyle='#0f6f5d';ctx.font='900 30px "PingFang SC","Microsoft YaHei",sans-serif';ctx.fillText('养我很贵，但值得。',80,320);
  drawCat(ctx,735,300,.72);

  const kpis=[
    ['年度总消费',money(total)],
    ['平均每天',money(total/daysElapsedInYear())],
    ['消费记录',`${records.length} 笔`]
  ];
  kpis.forEach((item,idx)=>{
    const x=48+idx*268;rounded(ctx,x,425,244,128,28,'#ffffff');
    ctx.fillStyle='#71817b';ctx.font='600 18px "PingFang SC","Microsoft YaHei",sans-serif';ctx.fillText(item[0],x+24,466);
    ctx.fillStyle='#12312e';ctx.font='900 31px "PingFang SC","Microsoft YaHei",sans-serif';ctx.fillText(item[1],x+24,515);
  });

  ctx.fillStyle='#12312e';ctx.font='900 28px "PingFang SC","Microsoft YaHei",sans-serif';ctx.fillText('这一年，钱都花去哪儿了？',58,615);
  const max=Math.max(...sorted.map(item=>data[item.id]),1);
  sorted.forEach((item,idx)=>{
    const yy=664+idx*54;
    ctx.fillStyle='#314e47';ctx.font='700 18px "PingFang SC","Microsoft YaHei",sans-serif';ctx.fillText(item.name,66,yy);
    rounded(ctx,168,yy-17,450,16,8,'#e8eeea');
    rounded(ctx,168,yy-17,Math.max(16,450*data[item.id]/max),16,8,item.color);
    ctx.fillStyle='#12312e';ctx.font='800 18px "PingFang SC","Microsoft YaHei",sans-serif';ctx.textAlign='right';ctx.fillText(money(data[item.id]),824,yy);ctx.textAlign='left';
  });

  rounded(ctx,48,950,804,132,30,'#ffffff');
  const insights=[
    top?`最费钱：${top.name} ${money(data[top.id])}`:'今年还没怎么花钱',
    expensiveWear?`最贵单次穿搭：${expensiveWear.name} ${money(expensiveWear.cost)}/次`:'衣橱还没开始记录',
    tight?`最该补货：${tight.name} 约剩 ${inventoryDays(tight)} 天`:'库存还没开始记录'
  ];
  ctx.fillStyle='#0f6f5d';ctx.font='900 20px "PingFang SC","Microsoft YaHei",sans-serif';ctx.fillText('年度小结',72,985);
  ctx.fillStyle='#526861';ctx.font='600 18px "PingFang SC","Microsoft YaHei",sans-serif';
  insights.forEach((line,idx)=>ctx.fillText('• '+line,72,1020+idx*27));

  rounded(ctx,60,1110,780,58,22,'#12312e');
  ctx.fillStyle='#fff';ctx.font='900 22px "PingFang SC","Microsoft YaHei",sans-serif';ctx.textAlign='center';ctx.fillText('你买你的，我玩纸箱。',450,1146);
  ctx.fillStyle='#617770';ctx.font='600 14px "PingFang SC","Microsoft YaHei",sans-serif';ctx.fillText('PawBudget 毛球账本 · 帮你算清楚，不替你花钱',450,1190);ctx.textAlign='left';
  return canvas;
}
const shareDialog=document.querySelector('#shareDialog');
document.querySelector('#shareBtn').addEventListener('click',()=>{generateSharePoster();shareDialog.showModal()});
document.querySelector('#shareCloseBtn').addEventListener('click',()=>shareDialog.close());
document.querySelector('#downloadShareBtn').addEventListener('click',()=>{
  const canvas=generateSharePoster();
  canvas.toBlob(blob=>{
    if(!blob)return;
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=`${state.pet.name||'主子'}-${y}-PawBudget-年度账单.png`;a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1200);toast('分享图已经生成 📸');
  },'image/png');
});

function downloadBlob(content,type,filename){
  const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1200);
}
function exportBackup(){
  const payload={app:'PawBudget',version:'0.1.2',exportedAt:new Date().toISOString(),data:{...state,demo:false}};
  downloadBlob(JSON.stringify(payload,null,2),'application/json;charset=utf-8',`PawBudget-${state.pet.name||'pet'}-${iso(now)}.json`);
  toast('完整账本备份已导出');
}
function csvCell(value){return '"'+String(value??'').replace(/"/g,'""')+'"'}
function exportCsv(){
  const rows=[['日期','分类','商品','金额','备注'],...state.records.slice().sort((a,b)=>String(b.date).localeCompare(String(a.date))).map(r=>[r.date,cat(r.category).name,r.item,r.amount,r.note||''])];
  const csv='\uFEFF'+rows.map(row=>row.map(csvCell).join(',')).join('\n');
  downloadBlob(csv,'text/csv;charset=utf-8',`PawBudget-消费记录-${iso(now)}.csv`);
  toast('消费 CSV 已导出');
}
async function importBackup(file){
  try{
    const payload=JSON.parse(await file.text()),candidate=payload.data||payload;
    if(!candidate||typeof candidate!=='object'||!Array.isArray(candidate.records)||!Array.isArray(candidate.inventory)||!Array.isArray(candidate.wardrobe))throw new Error('invalid');
    if(!confirm('导入会覆盖当前真实账本。确定继续吗？'))return;
    state=normalizeState({...candidate,demo:false});localStorage.setItem(REAL_BACKUP_KEY,JSON.stringify(state));save();render();toast('账本导入成功');
  }catch{alert('这个文件不是有效的 PawBudget 备份。');}
}
document.querySelector('#exportDataBtn').addEventListener('click',exportBackup);
document.querySelector('#exportCsvBtn').addEventListener('click',exportCsv);
document.querySelector('#importDataBtn').addEventListener('click',()=>document.querySelector('#importFileInput').click());
document.querySelector('#importFileInput').addEventListener('change',e=>{const file=e.target.files?.[0];if(file)importBackup(file);e.target.value='';});

if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js').catch(()=>{})}
render();
