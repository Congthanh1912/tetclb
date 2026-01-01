
const API_URL = "https://localhost:7242/api/Countdown/newyear?test=1"; // đổi test=0 khi chạy thật
const SYNC_INTERVAL_MS = 5000;
const RENDER_INTERVAL_MS = 100;

const elH = document.getElementById("hours");
const elM = document.getElementById("minutes");
const elS = document.getElementById("seconds");
const elStatus = document.getElementById("status");

let baseServerSeconds = 0;
let basePerfTime = 0;
let finished = false;

const isTest = API_URL.includes("test=1");
let syncTimer = null;
let renderTimer = null;

function pad2(n){ return String(n).padStart(2,"0"); }
function renderFromSeconds(total){
  const h = Math.floor(total/3600);
  const m = Math.floor((total%3600)/60);
  const s = total%60;
  elH.textContent = pad2(h);
  elM.textContent = pad2(m);
  elS.textContent = pad2(s);
}
function getCurrentSeconds(){
  const elapsed = Math.floor((performance.now()-basePerfTime)/1000);
  return Math.max(baseServerSeconds - elapsed, 0);
}
function stopAll(){
  if(syncTimer) clearInterval(syncTimer);
  if(renderTimer) clearInterval(renderTimer);
}

async function syncFromServer(reason="sync"){
  try{
    const res = await fetch(API_URL, { cache:"no-store" });
    const data = await res.json();
    baseServerSeconds = Number(data.totalSeconds) || 0;
    basePerfTime = performance.now();
    elStatus.textContent = ``;
  }catch(e){
    elStatus.textContent = `❌ API lỗi: ${e?.message || e}`;
  }
}

function tick(){
  if(finished) return;
  const cur = getCurrentSeconds();
  renderFromSeconds(cur);
if(cur <= 0){
      finished = true;
      stopAll(); 
      
    setTimeout(() => {
    
      window.location.href = "./fireworks.html";
    }, 600); // đúng bằng thời gian fade

    // ✅ chuyển sang tranlg welcome
    // window.location.href = "./fireworks.html";
  }

}
 
(async function start(){
  await syncFromServer("first");
  renderTimer = setInterval(tick, RENDER_INTERVAL_MS);

  // ✅ test=1 thì không sync lại (tránh reset)
  if(!isTest){
    syncTimer = setInterval(()=>syncFromServer("periodic"), SYNC_INTERVAL_MS);
  }  
 
})();
