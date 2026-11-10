/* ==========================================================
   Habitly – Daily Habit Tracker
   Sections: Data · State · Helpers · Navigation · Render ·
             Calendar · Modals · Events
   ========================================================== */
(function(){
"use strict";

/* ---------- Data ---------- */
var KEY="habitly.v1";
var CATS=["Health","Education","Productivity","Fitness","Personal Development","Lifestyle"];
var QUOTES=[
["We are what we repeatedly do. Excellence, then, is a habit.","Will Durant"],
["Small daily improvements are the key to staggering long-term results.","Robin Sharma"],
["Motivation gets you started. Habit keeps you going.","Jim Ryun"],
["You don’t rise to the level of your goals. You fall to the level of your systems.","James Clear"],
["Discipline is choosing between what you want now and what you want most.","Abraham Lincoln"],
["Success is the sum of small efforts, repeated day in and day out.","Robert Collier"],
["The secret of your future is hidden in your daily routine.","Mike Murdock"],
["It’s not what we do once in a while that shapes our lives. It’s what we do consistently.","Tony Robbins"],
["A journey of a thousand miles begins with a single step.","Lao Tzu"],
["Don’t count the days. Make the days count.","Muhammad Ali"]];
var ICON={
dash:'<path d="M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z"/>',
list:'<path d="M9 6h12M9 12h12M9 18h12M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>',
chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
cal:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/>',
gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>',
edit:'<path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/>',
del:'<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/>',
check:'<path d="M5 12l5 5 9-10"/>',
leaf:'<path d="M5 19c0-9 5-14 15-14 0 10-5 15-14 15M5 19l7-7"/>'};
function ic(n){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+ICON[n]+'</svg>';}

/* ---------- State (saved in Local Storage) ---------- */
var S=load();
function def(){return{name:"Friend",theme:matchMedia&&matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light",habits:[],log:{}};}
function load(){try{var r=localStorage.getItem(KEY);if(r){var o=JSON.parse(r);if(o&&Array.isArray(o.habits)&&o.log)return o;}}catch(e){}return def();}
function save(){try{localStorage.setItem(KEY,JSON.stringify(S));}catch(e){toast("Couldn’t save – browser storage is unavailable");}}

/* ---------- Helpers ---------- */
function $(s){return document.querySelector(s);}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function key(d){return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
function fromKey(k){var p=k.split("-");return new Date(+p[0],+p[1]-1,+p[2]);}
function addDays(d,n){var x=new Date(d);x.setDate(x.getDate()+n);return x;}
function today(){return key(new Date());}
function ids(){return S.habits.map(function(h){return h.id;});}
function doneIds(k){var v=S.log[k]||[],all=ids();return v.filter(function(i){return all.indexOf(i)>-1;});}
function isDone(id,k){return(S.log[k]||[]).indexOf(id)>-1;}
function pct(k){return S.habits.length?Math.round(doneIds(k).length/S.habits.length*100):0;}
function toggle(id,k){var v=S.log[k]||[],i=v.indexOf(id);if(i>-1)v.splice(i,1);else v.push(id);if(v.length)S.log[k]=v;else delete S.log[k];save();render();}
function activeDay(k){return doneIds(k).length>0;}
/* A day counts toward a streak when at least one habit was completed */
function streak(){var d=new Date();if(!activeDay(key(d)))d=addDays(d,-1);var n=0;while(activeDay(key(d))){n++;d=addDays(d,-1);}return n;}
function bestStreak(){var ks=Object.keys(S.log).filter(activeDay).sort(),best=0,run=0,prev=null;
 ks.forEach(function(k){var d=fromKey(k);run=(prev&&key(addDays(prev,1))===k)?run+1:1;prev=d;if(run>best)best=run;});return best;}
function range(n){var a=[];for(var i=n-1;i>=0;i--)a.push(key(addDays(new Date(),-i)));return a;}
function avg(keys){if(!S.habits.length||!keys.length)return 0;var t=0;keys.forEach(function(k){t+=pct(k);});return Math.round(t/keys.length);}
function greet(){var h=new Date().getHours();return h<12?"Good morning":h<18?"Good afternoon":"Good evening";}
var tT;function toast(m){var t=document.createElement("div");t.className="toast";t.setAttribute("role","status");t.textContent=m;document.body.appendChild(t);clearTimeout(tT);tT=setTimeout(function(){t.remove();},2200);setTimeout(function(){t.remove();},2300);}

/* ---------- Navigation ---------- */
var VIEWS=[["dashboard","Dashboard","dash"],["habits","My Habits","list"],["progress","Progress","chart"],["calendar","Calendar","cal"],["settings","Settings","gear"]];
var cur="dashboard",qi=Math.floor(Math.random()*QUOTES.length),cm=new Date(),sel=today();
function buildNav(){$("#nav").innerHTML=VIEWS.map(function(v){return '<button data-v="'+v[0]+'"'+(v[0]===cur?' aria-current="page"':'')+'>'+ic(v[2])+'<span>'+v[1]+'</span></button>';}).join("");}
$("#nav").addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;go(b.dataset.v);});
function go(v){cur=v;VIEWS.forEach(function(x){$("#v-"+x[0]).hidden=x[0]!==v;});buildNav();render();window.scrollTo(0,0);}
$("#logo").innerHTML=ic("leaf");

/* ---------- Render ---------- */
function habitHTML(h,k,full){
 var d=isDone(h.id,k),late="";
 if(h.rem&&!d&&k===today()){var n=new Date(),hm=String(n.getHours()).padStart(2,"0")+":"+String(n.getMinutes()).padStart(2,"0");if(hm>=h.rem)late=" late";}
 var dots=full?'<div class="dots" aria-label="Last 7 days">'+range(7).map(function(x){return '<i class="'+(isDone(h.id,x)?'on':'')+'" title="'+x+'"></i>';}).join("")+'</div>':'';
 return '<div class="habit'+(d?' done':'')+'" data-id="'+h.id+'">'+
 '<button class="chk" data-a="t" aria-pressed="'+d+'" aria-label="'+(d?'Unmark ':'Mark ')+esc(h.name)+' as complete">'+ic("check")+'</button>'+
 '<div class="info"><div class="nm">'+esc(h.name)+'</div>'+(h.desc?'<div class="ds">'+esc(h.desc)+'</div>':'')+
 '<div class="tags"><span class="tag">'+esc(h.cat)+'</span><span class="tag t">'+esc(h.tod)+'</span>'+(h.rem?'<span class="tag t'+late+'">Reminder '+h.rem+(late?' – due':'')+'</span>':'')+'<span class="tag t">'+(d?'Completed':'Pending')+'</span></div>'+dots+'</div>'+
 '<div class="acts"><button class="ib" data-a="e" aria-label="Edit '+esc(h.name)+'">'+ic("edit")+'</button><button class="ib" data-a="d" aria-label="Delete '+esc(h.name)+'">'+ic("del")+'</button></div></div>';
}
function listHTML(full){
 if(!S.habits.length)return '<div class="card empty"><p><b>No habits yet.</b><br>Add your first habit to start building a streak.</p><button class="btn pri" data-a="add">Add habit</button></div>';
 return '<div class="hlist">'+S.habits.map(function(h){return habitHTML(h,today(),full);}).join("")+'</div>';
}
function render(){
 var t=today(),p=pct(t),done=doneIds(t).length,q=QUOTES[qi];
 document.documentElement.setAttribute("data-theme",S.theme);
 if(cur==="dashboard"){
  $("#v-dashboard").innerHTML=
  '<div class="hero"><div><h1>'+greet()+', '+esc(S.name)+'</h1><p class="sub">'+new Date().toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"long",year:"numeric"})+'</p><p class="sub" style="margin-top:6px">'+
  (!S.habits.length?"Add a habit to begin your first streak.":p===100?"Every habit done today. Excellent consistency.":done?"Good progress – "+(S.habits.length-done)+" to go.":"A fresh day. Start with the easiest habit.")+'</p></div>'+
  '<div class="hero-r"><div class="ring" style="--p:'+p+'"><span>'+p+'%</span></div><div><b>'+done+' of '+S.habits.length+'</b><div class="sub">habits done today</div></div></div></div>'+
  '<div class="stats">'+stat("Total habits",S.habits.length)+stat("Completed today",done)+stat("Daily completion",p+"%")+stat("Current streak",streak()+(streak()===1?" day":" days"))+'</div>'+
  '<div class="card quote" style="margin-bottom:20px"><p>“'+esc(q[0])+'”</p><small>'+esc(q[1])+'</small><div style="margin-top:12px"><button class="btn sm" data-a="q">New quote</button></div></div>'+
  '<div class="head"><h2 style="margin:0">My daily habits</h2><button class="btn pri" data-a="add">Add habit</button></div>'+listHTML(false);
 }else if(cur==="habits"){
  $("#v-habits").innerHTML='<div class="head"><div><h1>My habits</h1><p class="sub">Tick the box to complete a habit. Squares show the last 7 days.</p></div><button class="btn pri" data-a="add">Add habit</button></div>'+listHTML(true);
 }else if(cur==="progress"){
  var w=range(7),m=range(30),mk=today().slice(0,7),dim=new Date(new Date().getFullYear(),new Date().getMonth()+1,0).getDate(),mdays=[];
  for(var i=1;i<=dim;i++)mdays.push(mk+"-"+String(i).padStart(2,"0"));
  var past=mdays.filter(function(k){return k<=t;}),mfull=past.filter(function(k){return S.habits.length&&pct(k)===100;}).length,mact=past.filter(activeDay).length;
  $("#v-progress").innerHTML='<h1>Progress</h1><p class="sub" style="margin-bottom:20px">Calculated from your saved completion records.</p>'+
  '<div class="stats">'+stat("Today",p+"%")+stat("Current streak",streak()+"d")+stat("Best streak",bestStreak()+"d")+stat("7-day average",avg(w)+"%")+'</div>'+
  '<div class="card" style="margin-bottom:16px"><h2>Weekly activity</h2><div class="chart" role="img" aria-label="Completion percentage for the last 7 days">'+
  w.map(function(k){var v=pct(k);return '<div class="col"><em>'+v+'%</em><div class="b'+(v?'':' z')+'" style="height:'+Math.max(v,3)+'%"></div><small>'+fromKey(k).toLocaleDateString(undefined,{weekday:"short"})+'</small></div>';}).join("")+'</div></div>'+
  '<div class="grid2"><div class="card"><h2>Overview</h2>'+
  prog("Today",p)+prog("This week (last 7 days)",avg(w))+prog("Last 30 days",avg(m))+prog("This month so far",avg(past))+'</div>'+
  '<div class="card"><h2>This month</h2><p class="sub">'+mfull+' perfect day'+(mfull===1?"":"s")+' and '+mact+' active day'+(mact===1?"":"s")+' out of '+past.length+' so far.</p>'+prog("Active days",past.length?Math.round(mact/past.length*100):0)+prog("Perfect days",past.length?Math.round(mfull/past.length*100):0)+'</div></div>'+
  '<div class="card"><h2>By habit (last 30 days)</h2>'+(S.habits.length?S.habits.map(function(h){var c=m.filter(function(k){return isDone(h.id,k);}).length;return prog(esc(h.name)+" – "+c+"/30 days",Math.round(c/30*100));}).join(""):'<p class="sub">Add habits to see per-habit progress.</p>')+'</div>';
 }else if(cur==="calendar"){
  renderCal();
 }else{
  $("#v-settings").innerHTML='<h1>Settings</h1><p class="sub" style="margin-bottom:20px">Everything is stored on this device only.</p><div class="card">'+
  '<div class="set"><div style="flex:1;min-width:200px"><label for="s-name">Display name</label><input type="text" id="s-name" maxlength="30" value="'+esc(S.name)+'"></div><button class="btn pri" data-a="name">Save name</button></div>'+
  '<div class="set"><div><b>Dark theme</b><div class="sub">Easier on the eyes at night.</div></div><button class="sw" role="switch" data-a="theme" aria-checked="'+(S.theme==="dark")+'" aria-label="Dark theme"></button></div>'+
  '<div class="set"><div><b>Reset progress</b><div class="sub">Clears all completion history. Habits are kept.</div></div><button class="btn" data-a="reset">Reset progress</button></div>'+
  '<div class="set"><div><b>Clear all habits</b><div class="sub">Deletes every habit and its history.</div></div><button class="btn dng" data-a="clear">Clear all habits</button></div></div>';
 }
}
function stat(l,v){return '<div class="card stat"><div class="lbl">'+l+'</div><div class="num">'+v+'</div></div>';}
function prog(l,v){return '<div style="margin-bottom:14px"><div class="row"><span>'+l+'</span><span>'+v+'%</span></div><div class="bar"><b style="width:'+v+'%"></b></div></div>';}

/* ---------- Calendar ---------- */
function renderCal(){
 var y=cm.getFullYear(),mo=cm.getMonth(),first=new Date(y,mo,1).getDay(),dim=new Date(y,mo+1,0).getDate(),t=today(),h="";
 ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].forEach(function(d){h+='<div class="dow">'+d+'</div>';});
 for(var i=0;i<first;i++)h+='<div class="day pad"></div>';
 for(var d=1;d<=dim;d++){var k=y+"-"+String(mo+1).padStart(2,"0")+"-"+String(d).padStart(2,"0"),p=pct(k),c="day";
  if(k>t)c+=" fut";else if(S.habits.length&&p===100)c+=" full";else if(p>0)c+=" part";else c+=" miss";
  if(k===t)c+=" today";if(k===sel)c+=" sel";
  h+='<button class="'+c+'" data-k="'+k+'" aria-label="'+k+', '+p+'% complete">'+d+'</button>';}
 var sd=fromKey(sel),det;
 if(!S.habits.length)det='<p class="sub">No habits yet.</p>';
 else det='<div class="hlist">'+S.habits.map(function(x){var dn=isDone(x.id,sel);return '<div class="habit'+(dn?' done':'')+'" data-id="'+x.id+'"><button class="chk" data-a="ct" '+(sel>t?'disabled ':'')+'aria-pressed="'+dn+'" aria-label="Toggle '+esc(x.name)+'">'+ic("check")+'</button><div class="info"><div class="nm">'+esc(x.name)+'</div></div></div>';}).join("")+'</div>';
 $("#v-calendar").innerHTML='<h1>Calendar</h1><p class="sub" style="margin-bottom:20px">Select a day to see or edit its completions.</p><div class="grid2" style="align-items:start"><div class="card"><div class="head"><button class="btn sm" data-a="pm" aria-label="Previous month">‹ Prev</button><b>'+cm.toLocaleDateString(undefined,{month:"long",year:"numeric"})+'</b><button class="btn sm" data-a="nm" aria-label="Next month">Next ›</button></div><div class="cal">'+h+'</div>'+
 '<div class="legend"><span><i style="background:var(--g)"></i>All done</span><span><i style="background:var(--gs)"></i>Some done</span><span><i style="background:var(--bg);border-color:var(--line)"></i>None</span></div></div>'+
 '<div class="card"><h2>'+sd.toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"long"})+'</h2><p class="sub" style="margin-bottom:12px">'+doneIds(sel).length+' of '+S.habits.length+' completed ('+pct(sel)+'%)</p>'+det+'</div></div>';
}

/* ---------- Modals ---------- */
var editId=null;
$("#f-cat").innerHTML=CATS.map(function(c){return "<option>"+c+"</option>";}).join("");
function openHabit(id){
 editId=id||null;var h=S.habits.filter(function(x){return x.id===id;})[0]||{name:"",desc:"",cat:CATS[0],tod:"Anytime",rem:""};
 $("#hmt").textContent=h.id?"Edit habit":"Add habit";
 $("#f-name").value=h.name;$("#f-desc").value=h.desc||"";$("#f-cat").value=h.cat;$("#f-tod").value=h.tod;$("#f-rem").value=h.rem||"";$("#f-err").textContent="";
 $("#hm").showModal();$("#f-name").focus();
}
$("#hm-cancel").onclick=function(){$("#hm").close();};
$("#hm-save").onclick=function(){
 var n=$("#f-name").value.trim();
 if(!n){$("#f-err").textContent="Enter a habit name.";$("#f-name").focus();return;}
 var dup=S.habits.some(function(h){return h.id!==editId&&h.name.toLowerCase()===n.toLowerCase();});
 if(dup){$("#f-err").textContent="You already have a habit with this name.";return;}
 var data={name:n,desc:$("#f-desc").value.trim(),cat:$("#f-cat").value,tod:$("#f-tod").value,rem:$("#f-rem").value};
 if(editId){S.habits.forEach(function(h){if(h.id===editId)Object.assign(h,data);});toast("Habit updated");}
 else{data.id="h"+Date.now().toString(36)+Math.random().toString(36).slice(2,5);S.habits.push(data);toast("Habit added");}
 save();$("#hm").close();render();
};
$("#hm").addEventListener("keydown",function(e){if(e.key==="Enter"&&e.target.tagName==="INPUT"){e.preventDefault();$("#hm-save").click();}});
var onYes=null;
function confirmBox(title,msg,fn){$("#cmt").textContent=title;$("#cm-msg").textContent=msg;onYes=fn;$("#cm").showModal();}
$("#cm-no").onclick=function(){$("#cm").close();};
$("#cm-yes").onclick=function(){$("#cm").close();if(onYes)onYes();};

/* ---------- Events ---------- */
document.addEventListener("click",function(e){
 var b=e.target.closest("[data-a],[data-k]");if(!b)return;
 if(b.dataset.k){sel=b.dataset.k;renderCal();return;}
 var a=b.dataset.a,row=b.closest(".habit"),id=row&&row.dataset.id;
 if(a==="t")toggle(id,today());
 else if(a==="ct")toggle(id,sel);
 else if(a==="add")openHabit();
 else if(a==="e")openHabit(id);
 else if(a==="d"){var h=S.habits.filter(function(x){return x.id===id;})[0];confirmBox("Delete habit?","“"+h.name+"” and its history will be removed.",function(){S.habits=S.habits.filter(function(x){return x.id!==id;});Object.keys(S.log).forEach(function(k){S.log[k]=S.log[k].filter(function(i){return i!==id;});if(!S.log[k].length)delete S.log[k];});save();render();toast("Habit deleted");});}
 else if(a==="q"){var n;do{n=Math.floor(Math.random()*QUOTES.length);}while(n===qi&&QUOTES.length>1);qi=n;render();}
 else if(a==="pm"){cm=new Date(cm.getFullYear(),cm.getMonth()-1,1);renderCal();}
 else if(a==="nm"){cm=new Date(cm.getFullYear(),cm.getMonth()+1,1);renderCal();}
 else if(a==="name"){var v=$("#s-name").value.trim();if(!v){toast("Enter a display name");return;}S.name=v;save();toast("Name saved");}
 else if(a==="theme"){S.theme=S.theme==="dark"?"light":"dark";save();render();}
 else if(a==="reset")confirmBox("Reset progress?","All completion history will be erased. Your habits stay.",function(){S.log={};save();render();toast("Progress reset");});
 else if(a==="clear")confirmBox("Clear all habits?","Every habit and its history will be deleted. This can’t be undone.",function(){S.habits=[];S.log={};save();render();toast("All habits cleared");});
});

/* Refresh day-based views if the page stays open past midnight */
var lastDay=today();setInterval(function(){if(today()!==lastDay){lastDay=today();sel=today();render();}},60000);

/* ---------- Start ---------- */
buildNav();render();
})();