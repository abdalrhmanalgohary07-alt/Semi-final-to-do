import{h,ring,sheet,closeSheet,toast,mark,glyph}from"./ui.js";
import*as S from"./store.js";
const pct=(d,a)=>a?Math.round(d/a*100):0;
const cnt=s=>({d:s.chapters.filter(c=>c.done).length,a:s.chapters.length});
const p2=n=>String(n).padStart(2,"0"),key=(y,m,d)=>`${y}-${p2(m+1)}-${p2(d)}`;
const todayKey=()=>{const n=new Date();return key(n.getFullYear(),n.getMonth(),n.getDate())};
const find=(st,id)=>st.subjects.find(x=>x.id===id);

export function home(){
  const st=S.get(),t=st.subjects.reduce((a,s)=>{const c=cnt(s);return{d:a.d+c.d,a:a.a+c.a}},{d:0,a:0});
  const day=st.days[todayKey()]||{},days=Object.values(st.days).filter(x=>x.done).length;
  return h("div",{class:"view"},
    h("header",{class:"hero"},ring(pct(t.d,t.a),104,"var(--accent)",10),
      h("div",{class:"grow"},h("small",{class:"muted"},"بسم الله الرحمن الرحيم"),h("h1",{class:"brand"},mark(36),"To Do"),
        h("div",{class:"chips"},h("span",{class:"chip"},`${t.d} من ${t.a} مهمة`),h("span",{class:"chip"},`${days} يوم منجز`),streak(st.days)>1?h("span",{class:"chip"},`${streak(st.days)} يوم ورا بعض`):null))),
    h("button",{class:"card today",onclick:()=>openDay(todayKey(),new Date().toLocaleDateString("ar-EG-u-nu-latn",{weekday:"long",day:"numeric",month:"long"}))},h("b",{},"خطة النهاردة"+(day.done?" ✓":"")),h("p",{class:"muted"},day.note||"مفيش خطة مكتوبة — اضغط لإضافة")),
    h("div",{class:"sec"},h("h2",{},"المواد"),h("button",{class:"btn primary",onclick:addSubject},"＋ مادة")),
    h("section",{class:"grid"},...st.subjects.map(s=>{const{d,a}=cnt(s);
      return h("a",{class:"card subj",href:`#/s/${s.id}` },h("div",{class:"ico"},glyph(s.icon)),
        h("div",{class:"grow"},h("b",{},s.ar),h("div",{class:"en"},s.en),h("small",{class:"muted"},`${d} / ${a}`+(s.exam&&dleft(s.exam)>=0?" · "+examTxt(s):""))),ring(pct(d,a),52,"var(--accent)",5))})),
  );
}
function addSubject(){
  const ar=h("input",{placeholder:"اسم المادة",required:true}),en=h("input",{placeholder:"Subject name (اختياري)",dir:"ltr"});
  sheet(h("h3",{},"مادة جديدة"),h("form",{class:"stack",onsubmit:e=>{e.preventDefault();const n=ar.value.trim();if(!n)return;
    S.update(s=>s.subjects.push({id:S.uid(),ar:n,en:en.value.trim(),icon:S.ICONS[s.subjects.length%S.ICONS.length],color:S.PALETTE[s.subjects.length%S.PALETTE.length],chapters:[]}));closeSheet()}},ar,en,h("button",{class:"btn primary"},"إضافة")));
  ar.focus();
}
export function subject(id){
  const s=find(S.get(),id);
  if(!s)return h("div",{class:"view"},h("p",{class:"muted"},"المادة مش موجودة."),h("a",{class:"btn",href:"#/"},"الرئيسية"));
  const{d,a}=cnt(s),inp=h("input",{id:"addIn",placeholder:"المهمة الجديدة","aria-label":"المهمة"});
  const edit=fn=>S.update(st=>fn(find(st,id)));
  return h("div",{class:"view"},h("a",{class:"back",href:"#/"},"→ كل المواد"),
    h("header",{class:"shead"},h("div",{class:"ico"},glyph(s.icon)),h("div",{class:"grow"},h("h1",{},s.ar),h("div",{class:"en"},s.en),h("small",{class:"muted"},`${d} من ${a} خلصت`),s.exam?h("div",{class:"exam"},pace(s)):null),ring(pct(d,a),68,"var(--accent)",7)),
    h("form",{class:"addrow",onsubmit:e=>{e.preventDefault();const v=inp.value.trim();if(!v)return;edit(x=>x.chapters.push({id:S.uid(),name:v,done:false}));requestAnimationFrame(()=>document.getElementById("addIn")?.focus())}},inp,h("button",{class:"btn primary"},"＋ إضافة")),
    s.chapters.length?h("ul",{class:"list"},...s.chapters.map(c=>h("li",{class:"row"+(c.done?" done":"")},
      h("label",{},h("input",{type:"checkbox",checked:c.done,onchange:e=>edit(x=>{x.chapters.find(y=>y.id===c.id).done=e.target.checked})}),h("span",{},c.name)),
      h("button",{class:"icon",title:"تعديل",onclick:()=>editTask(id,c)},"✎"),h("button",{class:"icon",title:"حذف المهمة",onclick:()=>{const i=s.chapters.indexOf(c);edit(x=>{x.chapters.splice(i,1)});toast("اتحذفت المهمة",()=>edit(x=>{x.chapters.splice(i,0,c)}))}},"✕")))):h("p",{class:"empty"},"لسه مفيش مهام — اكتب أول واحدة فوق."),
    h("button",{class:"btn",onclick:()=>editSubject(s)},"تعديل المادة"),h("button",{class:"btn danger",onclick:()=>{if(confirm("تحذف المادة وكل المهام اللي جواها؟")){S.update(st=>{st.subjects=st.subjects.filter(x=>x.id!==id)});location.hash="#/"}}},"حذف المادة"));
}
export function calendar(ym){
  const n=new Date();let[y,m]=(ym||`${n.getFullYear()}-${n.getMonth()+1}`).split("-").map(Number);m-=1;
  const st=S.get(),first=new Date(y,m,1),off=(first.getDay()+1)%7,len=new Date(y,m+1,0).getDate(),tk=todayKey();
  const go=dm=>{const d=new Date(y,m+dm,1);location.hash=`#/cal/${d.getFullYear()}-${d.getMonth()+1}`};
  const fmt=(o,d=first)=>d.toLocaleDateString("ar-EG-u-nu-latn",o);
  const done=Object.entries(st.days).filter(([k,v])=>k.startsWith(`${y}-${p2(m+1)}-`)&&v.done).length;
  const cells=[...Array(off).fill(null).map(()=>h("i",{class:"cell off"}))];
  for(let d=1;d<=len;d++){const k=key(y,m,d),v=st.days[k]||{};
    cells.push(h("button",{class:"cell"+(v.done?" done":"")+(k===tk?" today":""),onclick:()=>openDay(k,fmt({weekday:"long",day:"numeric",month:"long"},new Date(y,m,d)))},h("b",{},d),v.done?h("em",{},"✓"):v.note?h("u",{}):null))}
  return h("div",{class:"view"},h("header",{class:"mhead"},h("button",{class:"icon",onclick:()=>go(-1),"aria-label":"الشهر السابق"},"‹"),h("div",{class:"grow"},h("h1",{},fmt({month:"long",year:"numeric"})),h("small",{class:"muted"},`${done} من ${len} يوم منجز`)),h("button",{class:"icon",onclick:()=>go(1),"aria-label":"الشهر التالي"},"›")),
    h("div",{class:"cal"},...["سبت","أحد","اثنين","ثلاثاء","أربعاء","خميس","جمعة"].map(x=>h("span",{class:"dn"},x)),...cells),
    h("p",{class:"muted hint"},"اضغط على أي يوم لكتابة خطته أو تعليمه كمنجز."));
}
function openDay(k,label){
  const cur=()=>S.get().days[k]||{note:"",done:false};
  const set=p=>S.update(s=>{const v={...cur(),...p};if(!v.note&&!v.done)delete s.days[k];else s.days[k]=v});
  const ta=h("textarea",{rows:5,placeholder:"اكتب خطة / مهمة اليوم...",value:cur().note,oninput:()=>set({note:ta.value})});
  sheet(h("h3",{},label),ta,h("label",{class:"check"},h("input",{type:"checkbox",checked:cur().done,onchange:e=>set({done:e.target.checked})}),h("span",{},"خلصت يومي")),h("button",{class:"btn primary",onclick:closeSheet},"تم"));
}

const dleft=k=>Math.round((new Date(k+"T00:00")-new Date(todayKey()+"T00:00"))/864e5);
const examTxt=s=>{const n=dleft(s.exam);return n<0?"الامتحان عدّى":n===0?"الامتحان النهاردة":n===1?"الامتحان بكرة":`الامتحان بعد ${n} يوم`};
const pace=s=>{const n=dleft(s.exam),r=s.chapters.filter(c=>!c.done).length;return examTxt(s)+(n>0&&r?` · محتاج ${Math.ceil(r/n)} مهمة في اليوم`:"")};
const streak=days=>{let n=0;const d=new Date(),k=()=>key(d.getFullYear(),d.getMonth(),d.getDate());if(!days[k()]?.done)d.setDate(d.getDate()-1);while(days[k()]?.done){n++;d.setDate(d.getDate()-1)}return n};
const PICK=["⚗️","🩸","🔬","📘","🦠","🧫","🧪","🧠","📝","🧬","📚","📖"];
function editTask(id,c){
  const n=h("input",{value:c.name,required:true});
  sheet(h("h3",{},"تعديل المهمة"),h("form",{class:"stack",onsubmit:e=>{e.preventDefault();const v=n.value.trim();if(!v)return;S.update(st=>{find(st,id).chapters.find(y=>y.id===c.id).name=v});closeSheet()}},n,h("button",{class:"btn primary"},"حفظ")));
  n.focus();
}
function editSubject(s){
  const ar=h("input",{value:s.ar,required:true}),en=h("input",{value:s.en,dir:"ltr",placeholder:"Subject name"}),ex=h("input",{type:"date",value:s.exam||""});let ic=s.icon;
  const pk=h("div",{class:"picks"},...PICK.map(e=>h("button",{type:"button",class:"pick"+(e===ic?" on":""),onclick:ev=>{ic=e;pk.querySelectorAll(".pick").forEach(b=>b.classList.toggle("on",b===ev.currentTarget))}},glyph(e))));
  sheet(h("h3",{},"تعديل المادة"),h("form",{class:"stack",onsubmit:e=>{e.preventDefault();const v=ar.value.trim();if(!v)return;S.update(st=>Object.assign(find(st,s.id),{ar:v,en:en.value.trim(),icon:ic,exam:ex.value}));closeSheet()}},ar,en,pk,h("label",{class:"lab"},"موعد الامتحان (اختياري)",ex),h("button",{class:"btn primary"},"حفظ")));
}

export function dataPage(){
  const fi=h("input",{type:"file",accept:".json,application/json",hidden:true,onchange:e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{S.importJSON(r.result);toast("تم استرجاع بياناتك")}catch{toast("ملف النسخة الاحتياطية غير صالح")}};r.readAsText(f);e.target.value=""}});
  return h("div",{class:"view"},h("h1",{},"البيانات"),
    h("a",{class:"card",href:"#/print"},h("div",{class:"grow"},h("b",{},"تقرير الشهر للطباعة"),h("p",{class:"muted"},"ملف جاهز فيه كل التقدم وجدول الشهر وخانات فاضية تتملي بالإيد — اطبعه أو احفظه PDF.")),h("span",{class:"gl"},"›")),
    h("div",{class:"sec"},h("h2",{},"النسخ الاحتياطي")),
    h("div",{class:"tools"},
      h("button",{class:"btn",onclick:()=>{const u=URL.createObjectURL(new Blob([S.exportJSON()],{type:"application/json"})),a=h("a",{href:u,download:"todo-backup.json"});document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000)}},"↓ نسخة احتياطية"),
      h("button",{class:"btn",onclick:()=>fi.click()},"↑ استرجاع"),
      h("button",{class:"btn",onclick:()=>S.update(s=>s.subjects.forEach(x=>x.chapters.forEach(c=>c.done=false)))},"إلغاء العلامات"),
      h("button",{class:"btn danger",onclick:()=>confirm("هترجع القائمة الأساسية وتمسح كل المهام والجدول؟")&&S.reset()},"إعادة ضبط"),fi)
  );
}
export function printPage(ym){
  const n=new Date();let[y,m]=(ym||`${n.getFullYear()}-${n.getMonth()+1}`).split("-").map(Number);m-=1;
  const st=S.get(),len=new Date(y,m+1,0).getDate(),ar=(o,d)=>d.toLocaleDateString("ar-EG-u-nu-latn",o),mon=ar({month:"long",year:"numeric"},new Date(y,m,1));
  const go=dm=>{const d=new Date(y,m+dm,1);location.hash=`#/print/${d.getFullYear()}-${d.getMonth()+1}`};
  const t=st.subjects.reduce((a,s)=>{const c=cnt(s);return{d:a.d+c.d,a:a.a+c.a}},{d:0,a:0}),P=pct(t.d,t.a);
  const doneN=Object.entries(st.days).filter(([k,v])=>k.startsWith(`${y}-${p2(m+1)}-`)&&v.done).length;
  const bx=on=>h("i",{class:"bx"+(on?" on":"")}),lines=k=>h("div",{class:"lines"},...Array.from({length:k},()=>h("i")));
  const th=a=>h("tr",{},...a.map(x=>h("th",{},x))),sec=(ttl,...k)=>h("section",{},h("h2",{},ttl),...k);
  const blocks=st.subjects.map(s=>{const c=cnt(s);return{mm:17+Math.ceil(s.chapters.length/2)*5.2,el:h("div",{class:"sub"},h("h3",{},`${s.ar} (${c.d}/${c.a})`),s.chapters.length?h("ul",{class:"two"},...s.chapters.map(x=>h("li",{},bx(x.done),x.name))):null,lines(1))}});
  const tp=[];let cur=[],used=0;
  for(const b of blocks){if(cur.length&&used+b.mm>240){tp.push(cur);cur=[];used=0}cur.push(b.el);used+=b.mm}
  if(cur.length)tp.push(cur);
  const subjRows=st.subjects.map(s=>{const c=cnt(s);return h("tr",{},h("td",{},s.ar+(s.en?" — "+s.en:"")),h("td",{},`${c.d} / ${c.a}`),h("td",{},pct(c.d,c.a)+"%"),h("td",{},s.exam||""),h("td",{class:"bl"}))});
  const dayRows=Array.from({length:len},(_,i)=>{const v=st.days[key(y,m,i+1)]||{};return h("tr",{},h("td",{},i+1),h("td",{},ar({weekday:"long"},new Date(y,m,i+1))),h("td",{},v.note||""),h("td",{style:"text-align:center"},bx(v.done)),h("td",{class:"bl"}))});
  const pages=[
    [h("h1",{},"To Do — تقرير "+mon),h("div",{class:"fld"},"الاسم",h("i"),"التاريخ",h("i")),
     sec("ملخص التقدم",h("p",{},`${t.d} من ${t.a} مهمة (${P}%) · ${doneN} من ${len} يوم منجز في الشهر`),h("div",{class:"bar"},h("i",{style:`width:${P}%`}))),
     sec("المواد",h("table",{},th(["المادة","منجز / الكل","النسبة","الامتحان","ملاحظات"]),...subjRows)),
     sec("أهداف الشهر",lines(5))],
    ...tp.map((p,i)=>[sec("تفاصيل المهام"+(tp.length>1?` (${i+1}/${tp.length})`:""),...p)]),
    [sec("جدول "+mon,h("table",{class:"dt"},th(["التاريخ","اليوم","الخطة","منجز","ملاحظات"]),...dayRows))],
    [sec("ملاحظات",lines(28))]];
  return h("div",{class:"view"},
    h("div",{class:"ctl"},h("a",{class:"back",href:"#/data"},"→ البيانات"),h("div",{class:"mnav"},h("button",{class:"icon",onclick:()=>go(-1),"aria-label":"الشهر السابق"},"‹"),h("b",{},mon),h("button",{class:"icon",onclick:()=>go(1),"aria-label":"الشهر التالي"},"›")),h("small",{class:"muted"},`${pages.length} ورقة A4`),h("button",{class:"btn primary",onclick:()=>window.print()},"طباعة / PDF")),
    ...pages.map((p,i)=>h("article",{class:"paper"},...p,h("small",{class:"pf"},`${mon} · ورقة ${i+1} من ${pages.length}`))));
}
