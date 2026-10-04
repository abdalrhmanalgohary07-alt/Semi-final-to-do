import*as S from"./store.js";import{home,subject,calendar,dataPage,printPage}from"./views.js";import{closeSheet}from"./ui.js";
const app=document.getElementById("app");let last="";
function render(){
  const[,r,a]=(location.hash.slice(1)||"/").split("/"),same=last===location.hash,y=scrollY;
  app.replaceChildren(r==="s"?subject(a):r==="cal"?calendar(a):r==="data"?dataPage():r==="print"?printPage(a):home());
  scrollTo(0,same?y:0);last=location.hash;
  const cur=r==="cal"?"cal":r==="data"||r==="print"?"data":"home";document.querySelectorAll(".tabs a").forEach(t=>t.classList.toggle("on",t.dataset.t===cur));
}
S.subscribe(render);
addEventListener("hashchange",()=>{closeSheet();render()});
render();
if("serviceWorker"in navigator)addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
document.getElementById("theme").onclick=()=>setTheme(document.documentElement.dataset.theme==="dark"?"light":"dark",1);
