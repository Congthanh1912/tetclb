const petals = document.getElementById("petals");

function spawnPetal(){
  const p = document.createElement("div");
  p.className = "petal";

  const left = Math.random()*100;
  const size = 8 + Math.random()*10;
  const duration = 4 + Math.random()*4;

  p.style.left = left + "vw";
  p.style.width = size + "px";
  p.style.height = size*1.2 + "px";
  p.style.animationDuration = `${duration}s, ${1.2 + Math.random()*1.5}s`;

  petals.appendChild(p);
  setTimeout(()=>p.remove(), (duration+1)*1000);
}

setInterval(()=>{ for(let i=0;i<3;i++) spawnPetal(); }, 200);
// setTimeout(() => {
//   window.location.href = "./fireworks.html";
// }, 4000);