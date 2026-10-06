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
const now = new Date();
const y=now.getFullYear(), m=now.getMonth();
const iso=(d)=>new Date(d).toISOString().slice(0,10);
const dateInMonth=(day)=>iso(new Date(y,m,Math.min(day,new Date(y,m+1,0).getDate()),12));
const demoState={
  demo:true,
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
    {id:1,name:'猫粮',days:37,total:60,unit:'天'},
    {id:2,name:'猫砂',days:9,total:30,unit:'天'},
    {id:3,name:'罐头',days:3,total:20,unit:'天'},
    {id:4,name:'驱虫',days:24,total:30,unit:'天'}
  ],
  wardrobe:[
    {id:1,name:'小黄鸭雨衣',price:128,wears:6,emoji:'🐥'},
    {id:2,name:'万圣节斗篷',price:199,wears:2,emoji:'🧙'},
    {id:3,name:'圣诞围巾',price:89,wears:4,emoji:'🧣'},
    {id:4,name:'薄荷绿小领结',price:59,wears:8,emoji:'🎀'}
  ]
};
function emptyState(){return {demo:false,records:[],inventory:[],wardrobe:[]}}
let state=load();
let selectedCategory='food';
let filter='all';

function load(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||structuredClone(demoState)}catch{return structuredClone(demoState)}}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
function money(n){return `¥${Number(n||0).toLocaleString('zh-CN',{maximumFractionDigits:2})}`}
function cat(id){return CATEGORIES.find(c=>c.id===id)||CATEGORIES[6]}
function sum(records){return records.reduce((a,b)=>a+Number(b.amount||0),0)}
function isSameDay(a,b){return a.slice(0,10)===b.slice(0,10)}
function inMonth(d){const x=new Date(d);return x.getFullYear()===y&&x.getMonth()===m}
function inYear(d){return new Date(d).getFullYear()===y}
function byCategory(records){const out={};CATEGORIES.forEach(c=>out[c.id]=0);records.forEach(r=>out[r.category]=(out[r.category]||0)+Number(r.amount));return out}
function toast(msg){const el=document.querySelector('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),1700)}

function render(){renderHome();renderRecords();renderInventory();renderWardrobe();renderReport()}
function renderHome(){
  const today=state.records.filter(r=>isSameDay(r.date,iso(now))); const month=state.records.filter(r=>inMonth(r.date)); const year=state.records.filter(r=>inYear(r.date));
  document.querySelector('#todaySpend').textContent=money(sum(today));document.querySelector('#monthSpend').textContent=money(sum(month));document.querySelector('#yearSpend').textContent=money(sum(year));
  const food=state.inventory.find(i=>i.name.includes('猫粮'));document.querySelector('#foodDays').textContent=food?`${food.days} 天`:'-- 天';
  document.querySelector('#monthLabel').textContent=`${y}年${m+1}月`;document.querySelector('#donutTotal').textContent=money(sum(month));
  const data=byCategory(month); const total=Math.max(sum(month),1); let acc=0; const stops=[];
  CATEGORIES.slice(0,6).forEach(c=>{const pct=(data[c.id]/total)*100;if(pct>0){stops.push(`${c.color} ${acc}% ${acc+pct}%`);acc+=pct}});if(!stops.length)stops.push('#e9efeb 0 100%');
  document.querySelector('#donut').style.background=`conic-gradient(${stops.join(',')})`;
  document.querySelector('#legend').innerHTML=CATEGORIES.slice(0,6).map(c=>`<div class="legend-row"><i class="legend-dot" style="background:${c.color}"></i><span>${c.name}</span><b>${Math.round(data[c.id]/total*100)}%</b></div>`).join('');
  const monthTotal=sum(month); let msg='今天还没花钱？本猫不信。'; if(monthTotal>1200)msg='这个月……我们不看账单好不好？'; else if(data.clothes>250)msg='我需要这么多衣服吗？……需要。'; else if(monthTotal>0)msg='本月还好，本猫没有太败家喵。'; document.querySelector('#mascotComment').textContent=msg;
}
function renderRecords(){
  document.querySelector('#recordFilters').innerHTML=[{id:'all',name:'全部'},...CATEGORIES].map(c=>`<button class="filter-chip ${filter===c.id?'active':''}" data-filter="${c.id}">${c.name}</button>`).join('');
  const records=[...state.records].sort((a,b)=>b.date.localeCompare(a.date)).filter(r=>filter==='all'||r.category===filter);
  document.querySelector('#recordList').innerHTML=records.length?records.map(r=>{const c=cat(r.category);return `<article class="record-item"><div class="record-cat" style="background:${c.color}22">${c.icon}</div><div><div class="record-title">${r.item}</div><div class="record-meta">${c.name} · ${r.date}${r.note?` · ${r.note}`:''}</div></div><div class="record-amount">${money(r.amount)}</div></article>`}).join(''):'<div class="empty">还没有消费记录。<br>今天真的没花钱吗？😼</div>';
}
function renderInventory(){
  document.querySelector('#inventoryList').innerHTML=state.inventory.length?state.inventory.map(i=>{const cls=i.days<=5?'danger':i.days<=10?'warn':'good';const pct=Math.max(4,Math.min(100,i.days/(i.total||30)*100));return `<article class="inventory-item"><div class="inventory-top"><div><div class="inventory-name">${i.name}</div><small>预计剩余</small></div><span class="badge ${cls}">${i.days} 天</span></div><div class="progress"><i style="width:${pct}%"></i></div><div class="inventory-meta"><span>${i.days<=5?'需要补货了！':i.days<=10?'快到补货线':'库存充足'}</span><span>${Math.round(pct)}%</span></div></article>`}).join(''):'<div class="empty">库存空空的。<br>先把主子的口粮加进来吧。</div>';
}
function renderWardrobe(){
  const total=state.wardrobe.reduce((a,b)=>a+Number(b.price),0), wears=state.wardrobe.reduce((a,b)=>a+Number(b.wears),0); const costs=state.wardrobe.map(w=>w.wears?Number(w.price)/Number(w.wears):Number(w.price));
  document.querySelector('#wardrobeTotal').textContent=money(total);document.querySelector('#wearCount').textContent=`${wears} 次`;document.querySelector('#highestWearCost').textContent=money(costs.length?Math.max(...costs):0);
  document.querySelector('#wardrobeList').innerHTML=state.wardrobe.length?state.wardrobe.map(w=>`<article class="wardrobe-item"><div class="wardrobe-visual">${w.emoji||'👕'}</div><div class="wardrobe-body"><strong>${w.name}</strong><small>入手 ${money(w.price)} · 穿 ${w.wears} 次</small><div class="wear-cost">单次穿着成本 ${money(w.wears?w.price/w.wears:w.price)}</div></div></article>`).join(''):'<div class="empty">衣橱还空着。<br>第一件穿搭会是什么？</div>';
}
function renderReport(){
  const records=state.records.filter(r=>inYear(r.date)),total=sum(records), data=byCategory(records), max=Math.max(...Object.values(data),1);
  document.querySelector('#reportYear').textContent=y;document.querySelector('#reportTotal').textContent=money(total);document.querySelector('#reportDaily').textContent=money(total/Math.max(1,Math.ceil((now-new Date(y,0,1))/86400000)));document.querySelector('#reportBars').innerHTML=CATEGORIES.filter(c=>data[c.id]>0).sort((a,b)=>data[b.id]-data[a.id]).map(c=>`<div class="bar-row"><span>${c.icon} ${c.name}</span><div class="bar-track"><i style="width:${data[c.id]/max*100}%;background:${c.color}"></i></div><span class="bar-money">${money(data[c.id])}</span></div>`).join('')||'<div class="empty">今年还没有消费数据</div>';
}

function nav(page){document.querySelectorAll('.page').forEach(p=>p.classList.toggle('active',p.dataset.page===page));document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.nav===page));window.scrollTo({top:0,behavior:'smooth'})}
document.addEventListener('click',e=>{const n=e.target.closest('[data-nav]');if(n)nav(n.dataset.nav); const a=e.target.closest('[data-action="add"]');if(a)openExpense(); const f=e.target.closest('[data-filter]');if(f){filter=f.dataset.filter;renderRecords()}})

const expenseDialog=document.querySelector('#expenseDialog');
function openExpense(){selectedCategory='food';document.querySelector('#amountInput').value='';document.querySelector('#itemInput').value='';document.querySelector('#noteInput').value='';document.querySelector('#dateInput').value=iso(now);renderCategoryPicker();expenseDialog.showModal()}
function renderCategoryPicker(){document.querySelector('#categoryPicker').innerHTML=CATEGORIES.map(c=>`<button type="button" class="category-option ${selectedCategory===c.id?'active':''}" data-cat="${c.id}">${c.icon}<br>${c.name}</button>`).join('')}
document.querySelector('#categoryPicker').addEventListener('click',e=>{const b=e.target.closest('[data-cat]');if(b){selectedCategory=b.dataset.cat;renderCategoryPicker()}})
document.querySelector('#expenseForm').addEventListener('submit',e=>{e.preventDefault();const amount=Number(document.querySelector('#amountInput').value);const item=document.querySelector('#itemInput').value.trim();if(!amount||!item)return;state.records.push({id:Date.now(),amount,item,category:selectedCategory,date:document.querySelector('#dateInput').value,note:document.querySelector('#noteInput').value.trim()});save();render();expenseDialog.close();toast('记好啦，本猫知道你又花钱了 😼')})
;['#quickAddBtn','#addRecordBtn'].forEach(s=>document.querySelector(s).addEventListener('click',openExpense));

const simpleDialog=document.querySelector('#simpleDialog');let simpleMode='';
function openSimple(mode){simpleMode=mode;const fields=document.querySelector('#simpleFields');if(mode==='inventory'){document.querySelector('#simpleTitle').textContent='添加库存';document.querySelector('#simpleSubtitle').textContent='记录剩余天数，快用完时提醒你';fields.innerHTML='<label>名称<input name="name" placeholder="例如：猫粮" required></label><label>预计剩余天数<input name="days" type="number" min="0" required></label><label>完整周期（天）<input name="total" type="number" min="1" value="30" required></label>'}else{document.querySelector('#simpleTitle').textContent='添加衣橱';document.querySelector('#simpleSubtitle').textContent='算算每次穿它到底值不值';fields.innerHTML='<label>名称<input name="name" placeholder="例如：小黄鸭雨衣" required></label><label>入手价<input name="price" type="number" min="0" step="0.01" required></label><label>已穿次数<input name="wears" type="number" min="0" value="0" required></label><label>小图标<input name="emoji" value="👕"></label>'}simpleDialog.showModal()}
document.querySelector('#addInventoryBtn').addEventListener('click',()=>openSimple('inventory'));document.querySelector('#addWardrobeBtn').addEventListener('click',()=>openSimple('wardrobe'));
document.querySelector('#simpleForm').addEventListener('submit',e=>{e.preventDefault();const fd=new FormData(e.target);if(simpleMode==='inventory')state.inventory.push({id:Date.now(),name:fd.get('name'),days:Number(fd.get('days')),total:Number(fd.get('total'))});else state.wardrobe.push({id:Date.now(),name:fd.get('name'),price:Number(fd.get('price')),wears:Number(fd.get('wears')),emoji:fd.get('emoji')||'👕'});save();render();simpleDialog.close();toast('保存成功 ✨')})

document.querySelector('#demoBtn').addEventListener('click',()=>{state=state.demo?emptyState():structuredClone(demoState);save();render();toast(state.demo?'已切换到墨团演示模式':'已切换到空白真实账本')});
document.querySelector('#shareBtn').addEventListener('click',()=>toast('v0.2 会加入一键生成 3:4 分享长图 📸'));
if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js').catch(()=>{})}
render();
