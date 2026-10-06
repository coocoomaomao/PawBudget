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
    {id:1,name:'猫粮',totalQuantity:6000,remainQuantity:2405,dailyUsage:65,unit:'g'},
    {id:2,name:'猫砂',totalQuantity:6000,remainQuantity:2700,dailyUsage:300,unit:'g'},
    {id:3,name:'罐头',totalQuantity:12,remainQuantity:3,dailyUsage:1,unit:'罐'},
    {id:4,name:'湿巾',totalQuantity:80,remainQuantity:24,dailyUsage:1,unit:'片'}
  ],
  wardrobe:[
    {id:1,name:'小黄鸭雨衣',price:128,wears:6,emoji:'🐥'},
    {id:2,name:'万圣节斗篷',price:199,wears:2,emoji:'🧙'},
    {id:3,name:'圣诞围巾',price:89,wears:4,emoji:'🧣'},
    {id:4,name:'薄荷绿小领结',price:59,wears:8,emoji:'🎀'}
  ]
};

function emptyState(){return {demo:false,pet:clone(REAL_PET),records:[],inventory:[],wardrobe:[]}}
function normalizeState(raw){
  const s=raw&&typeof raw==='object'?raw:emptyState();
  s.demo=Boolean(s.demo);
  s.pet={...(s.demo?DEMO_PET:REAL_PET),...(s.pet||{})};
  s.records=Array.isArray(s.records)?s.records:[];
  s.wardrobe=Array.isArray(s.wardrobe)?s.wardrobe:[];
  s.inventory=(Array.isArray(s.inventory)?s.inventory:[]).map(i=>{
    if(i.remainQuantity==null && i.days!=null){
      return {...i,totalQuantity:Number(i.total||30),remainQuantity:Number(i.days),dailyUsage:1,unit:i.unit||'天'};
    }
    return {
      ...i,
      totalQuantity:Number(i.totalQuantity||0),
      remainQuantity:Number(i.remainQuantity||0),
      dailyUsage:Number(i.dailyUsage||0),
      unit:i.unit||'份'
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
    return `<article class="inventory-item">
      <div class="inventory-top"><div><div class="inventory-name">${esc(i.name)}</div><div class="inventory-quantity">剩余 ${esc(i.remainQuantity)} ${esc(i.unit)} · 日均 ${esc(i.dailyUsage)} ${esc(i.unit)}</div></div><span class="badge ${cls}">${days} 天</span></div>
      <div class="progress"><i style="width:${pct}%"></i></div>
      <div class="inventory-meta"><span>${days<=3?'需要补货了！':days<=10?'快到补货线':'库存充足'}</span><span>预计 ${days} 天后用完</span></div>
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
  document.querySelector('#wardrobeList').innerHTML=state.wardrobe.length?state.wardrobe.map(w=>`<article class="wardrobe-item"><div class="wardrobe-visual">${esc(w.emoji||'👕')}</div><div class="wardrobe-body"><strong>${esc(w.name)}</strong><small>入手 ${money(w.price)} · 穿 ${esc(w.wears)} 次</small><div class="wear-cost">单次穿着成本 ${money(Number(w.wears)>0?Number(w.price)/Number(w.wears):Number(w.price))}</div></div></article>`).join(''):'<div class="empty">衣橱还空着。<br>第一件穿搭会是什么？</div>';
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
    state.inventory.push({id:Date.now(),name:fd.get('name').trim(),totalQuantity:Number(fd.get('totalQuantity')),remainQuantity:Number(fd.get('remainQuantity')),dailyUsage:Number(fd.get('dailyUsage')),unit:fd.get('unit').trim()||'份'});
  }else{
    state.wardrobe.push({id:Date.now(),name:fd.get('name').trim(),price:Number(fd.get('price')),wears:Number(fd.get('wears')),emoji:fd.get('emoji').trim()||'👕'});
  }
  save();render();simpleDialog.close();e.target.reset();toast('保存成功 ✨');
});

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
  ctx.clearRect(0,0,W,H);ctx.fillStyle='#fffaf1';ctx.fillRect(0,0,W,H);

  ctx.fillStyle='#0f6f5d';ctx.font='900 52px "PingFang SC","Microsoft YaHei",sans-serif';ctx.fillText('PawBudget',60,78);
  ctx.fillStyle='#12312e';ctx.font='800 28px "PingFang SC","Microsoft YaHei",sans-serif';ctx.fillText('毛球账本 · 年度消费报告',62,118);

  rounded(ctx,48,160,804,270,38,'#dff7ef');
  ctx.fillStyle='#12312e';ctx.font='900 48px "PingFang SC","Microsoft YaHei",sans-serif';ctx.fillText(`${p.name||'主子'}的 ${y} 年度账单`,78,230);
  ctx.fillStyle='#60736d';ctx.font='500 24px "PingFang SC","Microsoft YaHei",sans-serif';ctx.fillText('这一年，谢谢你把最好的都给我 ♡',80,276);
  drawCat(ctx,725,320,.78);

  rounded(ctx,48,458,804,180,30,'#ffffff');
  ctx.fillStyle='#6b7874';ctx.font='600 22px "PingFang SC","Microsoft YaHei",sans-serif';ctx.fillText('年度总消费',92,510);ctx.fillText('平均每天',500,510);
  ctx.fillStyle='#12312e';ctx.font='900 48px "PingFang SC","Microsoft YaHei",sans-serif';ctx.fillText(money(total),92,575);ctx.fillText(money(total/daysElapsedInYear()),500,575);

  ctx.fillStyle='#12312e';ctx.font='900 30px "PingFang SC","Microsoft YaHei",sans-serif';ctx.fillText('消费分类',62,700);
  const sorted=CATEGORIES.filter(c=>data[c.id]>0).sort((a,b)=>data[b.id]-data[a.id]).slice(0,6);
  const max=Math.max(...sorted.map(c=>data[c.id]),1);
  sorted.forEach((c,idx)=>{
    const yy=750+idx*62;
    ctx.fillStyle='#2f4a44';ctx.font='700 20px "PingFang SC","Microsoft YaHei",sans-serif';ctx.fillText(c.name,70,yy);
    rounded(ctx,190,yy-20,430,18,9,'#edf1ee');
    rounded(ctx,190,yy-20,Math.max(18,430*data[c.id]/max),18,9,c.color);
    ctx.fillStyle='#12312e';ctx.font='800 20px "PingFang SC","Microsoft YaHei",sans-serif';ctx.textAlign='right';ctx.fillText(money(data[c.id]),820,yy);ctx.textAlign='left';
  });

  rounded(ctx,60,1080,780,78,24,'#12312e');
  ctx.fillStyle='#fff';ctx.font='900 27px "PingFang SC","Microsoft YaHei",sans-serif';ctx.textAlign='center';ctx.fillText('养我很贵，但值得。',450,1128);
  ctx.fillStyle='#c9e9df';ctx.font='500 17px "PingFang SC","Microsoft YaHei",sans-serif';ctx.fillText('帮你算清楚，不替你花钱。 · MeowBuild Lab',450,1152);ctx.textAlign='left';
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

if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js').catch(()=>{})}
render();
