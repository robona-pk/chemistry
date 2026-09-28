const profiles = [
  {
    name:"Maya", age:27, job:"Brand strategist", mbti:"ENFP",
    interests:["Live music","Travel","Photography"],
    // matchChance simulates whether this person swipes back on you —
    // in a real app this would be their actual like/pass action.
    matchChance:0.45,
    prompts:[
      ["A perfect Sunday","Coffee, a long walk, then finding a tiny gig nobody told us about."],
      ["Green flag","Someone who is genuinely curious about things."]
    ]
  },
  {
    name:"Rhea", age:26, job:"Product designer", mbti:"INFJ",
    interests:["Design","Cooking","Books"],
    matchChance:0.85,
    prompts:[
      ["Two truths and a lie","I can make excellent ramen. I hate cilantro. I've never owned a plant."],
      ["I'll fall for you if","You notice the small things."]
    ]
  },
  {
    name:"Anika", age:28, job:"Researcher", mbti:"INTP",
    interests:["Drums","Science","Indie music"],
    matchChance:0.85,
    prompts:[
      ["A niche thing I love","Watching someone learn a song on drums from scratch."],
      ["Most controversial opinion","The best conversations start with an oddly specific question."]
    ]
  }
];

const seededChats = {
  Anika: {
    messages:[
      ["them","Okay, serious question: what's the last song you learned?"],
      ["me","Everlong. Took me way too long to get the fills clean."],
      ["them","That's a respectable answer 😂"]
    ]
  },
  Rhea: {
    messages:[
      ["them","What's your go-to comfort food?"],
      ["me","Honestly I rotate through a few things depending on how lazy I am."],
      ["them","Haha fair, I'm obsessed with making ramen lately."]
    ]
  }
};

const state = {
  tab: localStorage.getItem("tab") || "discover",
  idx: Number(localStorage.getItem("idx") || 0),
  onboarded: localStorage.getItem("onboarded") === "1",
  coach: localStorage.getItem("coach") === "1",
  profile: JSON.parse(localStorage.getItem("profile") || "null"),
  likes: JSON.parse(localStorage.getItem("likes") || "[]"),
  // names you've mutually matched with — this, not `likes`, drives the Chats tab
  matches: JSON.parse(localStorage.getItem("matches") || "[]"),
  // The original prototype used one global coaching switch and transient messages.
  // These maps make both choices explicitly conversation-specific and durable.
  coachByChat: JSON.parse(localStorage.getItem("coachByChat") || "{}"),
  chatMessages: JSON.parse(localStorage.getItem("chatMessages") || "{}"),
  lastProfileIndex: Number(localStorage.getItem("lastProfileIndex") || -1)
};

function save(){
  localStorage.setItem("tab",state.tab);
  localStorage.setItem("idx",state.idx);
  localStorage.setItem("onboarded",state.onboarded?"1":"0");
  localStorage.setItem("coach",state.coach?"1":"0");
  localStorage.setItem("profile",JSON.stringify(state.profile));
  localStorage.setItem("likes",JSON.stringify(state.likes));
  localStorage.setItem("matches",JSON.stringify(state.matches));
  localStorage.setItem("coachByChat",JSON.stringify(state.coachByChat));
  localStorage.setItem("chatMessages",JSON.stringify(state.chatMessages));
  localStorage.setItem("lastProfileIndex",String(state.lastProfileIndex));
}

function esc(s){
  return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}

function initials(name){ return name.split(" ").map(x=>x[0]).join("").slice(0,2).toUpperCase(); }

function shell(content){
  return `<div class="app">
    <div class="topbar"><div class="brand">Signal</div><div class="small">dating, with better signal</div></div>
    <main class="screen">${content}</main>
    ${nav()}
  </div>`;
}

function nav(){
  const items=[["discover","Discover","♡"],["chats","Chats","◌"],["insights","Insights","◈"],["profile","Profile","○"]];
  return `<nav class="nav">${items.map(([id,label,icon])=>
    `<button class="${state.tab===id?"active":""}" onclick="setTab('${id}')"><div>${icon}</div>${label}</button>`
  ).join("")}</nav>`;
}

function setTab(tab){ state.tab=tab; save(); render(); }

function render(){
  if(!state.onboarded) return renderOnboarding();
  if(state.tab==="discover") return renderDiscover();
  if(state.tab==="chats") return renderChats();
  if(state.tab==="insights") return renderInsights();
  return renderProfile();
}

/* =====================================================================
   ONBOARDING — multi-step wizard
   Steps: basics -> photos -> prompts -> mbti -> review -> (modal) -> done
   ===================================================================== */

const PROMPT_BANK = [
  "A perfect Sunday looks like",
  "I'll know it's a date if",
  "My most controversial opinion is",
  "The way to win me over is",
  "I geek out on",
  "Together we could",
  "My love language, decoded",
  "Two truths and a lie",
  "A life goal of mine",
  "I'm overly competitive about",
  "The best way to ask me out is",
  "My simple pleasures",
  "I'll never shut up about",
  "A shower thought I recently had",
  "My friends would describe me as",
  "Green flag I look for",
  "I'm weirdly good at",
  "The last thing I got way too invested in"
];

const MBTI_QUESTIONS = [
  // Energy: Extraversion (A) vs Introversion (B)
  {axis:"EI", section:"How you recharge", a:"After a long week, I recharge by going out and being around people.", b:"After a long week, I recharge with quiet time alone."},
  {axis:"EI", section:"How you recharge", a:"I think out loud and talk through ideas as I have them.", b:"I think things through privately before I share them."},
  {axis:"EI", section:"How you recharge", a:"A party full of strangers sounds energizing.", b:"A party full of strangers sounds draining."},
  {axis:"EI", section:"How you recharge", a:"In a group, I usually have a lot to say.", b:"In a group, I usually listen more than I speak."},
  {axis:"EI", section:"How you recharge", a:"I make new friends easily and often.", b:"I keep a smaller, closer circle of people."},
  {axis:"EI", section:"How you recharge", a:"Silence in a conversation feels a little awkward.", b:"Silence in a conversation feels comfortable."},
  {axis:"EI", section:"How you recharge", a:"I'd rather reply right away.", b:"I'd rather take my time before responding."},

  // Perspective: Sensing (A) vs Intuition (B)
  {axis:"SN", section:"How you take in the world", a:"I trust what I can see, touch, and verify.", b:"I trust my gut sense of where things are headed."},
  {axis:"SN", section:"How you take in the world", a:"I focus on the details right in front of me.", b:"I focus on the big picture and what it could become."},
  {axis:"SN", section:"How you take in the world", a:"I like instructions that are clear and step-by-step.", b:"I like room to improvise and figure it out myself."},
  {axis:"SN", section:"How you take in the world", a:"I'd rather talk about real events and facts.", b:"I'd rather talk about ideas and possibilities."},
  {axis:"SN", section:"How you take in the world", a:"I notice when something is practical.", b:"I notice when something is original."},
  {axis:"SN", section:"How you take in the world", a:"I'm drawn to what's tried and true.", b:"I'm drawn to what's new and unconventional."},
  {axis:"SN", section:"How you take in the world", a:"I tend to describe things literally.", b:"I tend to describe things in metaphors and analogies."},

  // Decisions: Thinking (A) vs Feeling (B)
  {axis:"TF", section:"How you decide", a:"I make decisions with logic first.", b:"I make decisions with my values and feelings first."},
  {axis:"TF", section:"How you decide", a:"Being fair matters more to me than being kind.", b:"Being kind matters more to me than being fair."},
  {axis:"TF", section:"How you decide", a:"I give feedback straight, even if it stings.", b:"I soften feedback so it lands gently."},
  {axis:"TF", section:"How you decide", a:"In a disagreement, I want to understand the problem.", b:"In a disagreement, I want to understand how people feel."},
  {axis:"TF", section:"How you decide", a:"I stay calm and objective during conflict.", b:"I stay attuned to everyone's feelings during conflict."},
  {axis:"TF", section:"How you decide", a:"I value being right.", b:"I value being understanding."},
  {axis:"TF", section:"How you decide", a:"Criticism doesn't stick with me for long.", b:"Criticism stays with me for a while."},

  // Structure: Judging (A) vs Perceiving (B)
  {axis:"JP", section:"How you like your days structured", a:"I like having a plan and sticking to it.", b:"I like keeping my options open."},
  {axis:"JP", section:"How you like your days structured", a:"I feel best once a decision is made.", b:"I feel best keeping a decision open a little longer."},
  {axis:"JP", section:"How you like your days structured", a:"My space is usually organized.", b:"My space is usually a little chaotic, and I like it that way."},
  {axis:"JP", section:"How you like your days structured", a:"I finish things well before the deadline.", b:"I do my best work right up against the deadline."},
  {axis:"JP", section:"How you like your days structured", a:"Spontaneous plans stress me out a little.", b:"Spontaneous plans excite me."},
  {axis:"JP", section:"How you like your days structured", a:"I like a clear schedule for the day.", b:"I like to see where the day takes me."},
  {axis:"JP", section:"How you like your days structured", a:"Loose ends bother me.", b:"Loose ends don't bother me much."}
];

const AXIS_META = {
  EI: {aLetter:"E", bLetter:"I", aFrag:"outgoing and socially energized", bFrag:"reflective and inward-focused"},
  SN: {aLetter:"S", bLetter:"N", aFrag:"grounded in facts and details", bFrag:"drawn to ideas and possibilities"},
  TF: {aLetter:"T", bLetter:"F", aFrag:"guided by logic", bFrag:"guided by values and feelings"},
  JP: {aLetter:"J", bLetter:"P", aFrag:"structured and decisive", bFrag:"flexible and open-ended"}
};

const OB_STEP_ORDER = ["basics","photos","prompts","mbti","review"];
let obStep = "basics";
let obDragSrc = null;
const ob = {
  name:"", birthday:"", gender:"", interested:"",
  photos:[],
  prompts:[{prompt:"",answer:""},{prompt:"",answer:""},{prompt:"",answer:""}],
  mbtiAnswers:{},
  mbtiResult:null
};

function ageFromDate(dateStr){
  if(!dateStr) return 0;
  const b=new Date(dateStr), t=new Date();
  let a=t.getFullYear()-b.getFullYear();
  const m=t.getMonth()-b.getMonth();
  if(m<0 || (m===0 && t.getDate()<b.getDate())) a--;
  return a;
}

function obProgressBar(){
  const filled = obStep==="review" ? OB_STEP_ORDER.length : OB_STEP_ORDER.indexOf(obStep)+1;
  return `<div class="ob-progressbar">${OB_STEP_ORDER.map((_,i)=>
    `<span class="ob-seg${i<filled?" on":""}"></span>`).join("")}</div>`;
}

function obShell(inner){
  return `<div class="app"><main class="screen">
    ${obProgressBar()}
    ${inner}
  </main></div>`;
}

function renderOnboarding(){
  if(obStep==="basics") return renderObBasics();
  if(obStep==="photos") return renderObPhotos();
  if(obStep==="prompts") return renderObPrompts();
  if(obStep==="mbti") return renderObMbti();
  return renderObReview();
}

function obBack(){
  const idx = OB_STEP_ORDER.indexOf(obStep);
  if(idx>0){ obStep = OB_STEP_ORDER[idx-1]; renderOnboarding(); }
}

function obPick(field,val,el){
  ob[field]=val;
  el.parentElement.querySelectorAll(".select").forEach(x=>x.classList.remove("selected"));
  el.classList.add("selected");
}

/* ---- Step 1: basics ---- */
function renderObBasics(){
  document.getElementById("app").innerHTML = obShell(`
    <div class="eyebrow">Step 1 of 4</div>
    <h1>Let's start with the basics.</h1>
    <p>This is what people see first. Keep it honest — the rest of your profile will do the interesting work.</p>
    <div class="card">
      <div class="field"><label>First name</label>
        <input id="ob-name" value="${esc(ob.name)}" placeholder="What should we call you?">
      </div>
      <div class="field"><label>Birthday</label>
        <input id="ob-birthday" type="date" value="${ob.birthday}">
      </div>
      <div class="field"><label>I am</label>
        <div class="select-grid">${["Woman","Man","Nonbinary","Self-describe"].map(g=>
          `<button class="select${ob.gender===g?" selected":""}" onclick="obPick('gender','${g}',this)">${g}</button>`).join("")}</div>
      </div>
      <div class="field"><label>Show me</label>
        <div class="select-grid">${["Women","Men","Everyone"].map(g=>
          `<button class="select${ob.interested===g?" selected":""}" onclick="obPick('interested','${g}',this)">${g}</button>`).join("")}</div>
      </div>
      <div class="small ob-error" id="ob-basics-error">Add your name, birthday (18+), and both selections to continue.</div>
      <button class="btn primary full" onclick="obNextBasics()">Continue</button>
    </div>
  `);
}

function obNextBasics(){
  ob.name = document.getElementById("ob-name").value.trim();
  ob.birthday = document.getElementById("ob-birthday").value;
  const ok = ob.name.length>0 && ob.birthday && ageFromDate(ob.birthday)>=18 && ob.gender && ob.interested;
  document.getElementById("ob-basics-error").classList.toggle("show", !ok);
  if(!ok) return;
  obStep="photos";
  renderOnboarding();
}

/* ---- Step 2: photos ---- */
const OB_MAX_PHOTOS = 6, OB_MIN_PHOTOS = 2;

function renderObPhotos(){
  document.getElementById("app").innerHTML = obShell(`
    <div class="eyebrow">Step 2 of 4</div>
    <h1>Add your photos.</h1>
    <p>Add 2–6 photos. Drag to reorder — your first photo is what people see first in the stack.</p>
    <div class="card">
      <div class="ob-photo-grid" id="ob-photo-grid"></div>
      <div class="small">Tap an empty tile to upload. Drag a filled tile to reorder.</div>
      <input type="file" id="ob-photo-input" accept="image/*" multiple style="display:none;">
      <div class="small ob-error" id="ob-photos-error">Add at least 2 photos to continue.</div>
    </div>
    <div class="actions">
      <button class="btn" onclick="obBack()">Back</button>
      <button class="btn primary" onclick="obNextPhotos()">Continue</button>
    </div>
  `);
  renderObPhotoGrid();
  document.getElementById("ob-photo-input").addEventListener("change", obHandlePhotoFiles);
}

function renderObPhotoGrid(){
  const grid = document.getElementById("ob-photo-grid");
  let html = "";
  for(let i=0;i<OB_MAX_PHOTOS;i++){
    if(ob.photos[i]){
      html += `<div class="ob-photo-slot filled" draggable="true" data-index="${i}">
        <img src="${ob.photos[i]}">
        ${i===0?'<span class="ob-photo-tag">Primary</span>':""}
        <button type="button" class="ob-photo-remove" onclick="obRemovePhoto(${i},event)">&times;</button>
      </div>`;
    } else {
      html += `<div class="ob-photo-slot" onclick="document.getElementById('ob-photo-input').click()">
        <span class="ob-photo-add">+</span>
      </div>`;
    }
  }
  grid.innerHTML = html;
  grid.querySelectorAll(".ob-photo-slot.filled").forEach(slot=>{
    slot.addEventListener("dragstart", ()=>{ obDragSrc = Number(slot.dataset.index); });
    slot.addEventListener("dragover", e=>{ e.preventDefault(); slot.classList.add("dragover"); });
    slot.addEventListener("dragleave", ()=> slot.classList.remove("dragover"));
    slot.addEventListener("drop", e=>{
      e.preventDefault();
      slot.classList.remove("dragover");
      const dest = Number(slot.dataset.index);
      if(obDragSrc===null || obDragSrc===dest) return;
      const moved = ob.photos.splice(obDragSrc,1)[0];
      ob.photos.splice(dest,0,moved);
      obDragSrc = null;
      renderObPhotoGrid();
    });
  });
}

function obRemovePhoto(i,e){
  e.stopPropagation();
  ob.photos.splice(i,1);
  renderObPhotoGrid();
}

function obHandlePhotoFiles(e){
  const files = Array.from(e.target.files||[]);
  const room = OB_MAX_PHOTOS - ob.photos.length;
  files.slice(0,room).forEach(file=>{
    if(!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = ev=>{ ob.photos.push(ev.target.result); renderObPhotoGrid(); };
    reader.readAsDataURL(file);
  });
  e.target.value = "";
}

function obNextPhotos(){
  const ok = ob.photos.length >= OB_MIN_PHOTOS;
  document.getElementById("ob-photos-error").classList.toggle("show", !ok);
  if(!ok) return;
  obStep="prompts";
  renderOnboarding();
}

/* ---- Step 3: prompts ---- */
function renderObPrompts(){
  document.getElementById("app").innerHTML = obShell(`
    <div class="eyebrow">Step 3 of 4</div>
    <h1>Answer three prompts.</h1>
    <p>Prompts say more than a bio ever could. Pick three and answer like you're texting a friend.</p>
    <div id="ob-prompt-cards"></div>
    <div class="small ob-error" id="ob-prompts-error">Pick three different prompts and write an answer for each (under 150 characters).</div>
    <div class="actions">
      <button class="btn" onclick="obBack()">Back</button>
      <button class="btn primary" onclick="obNextPrompts()">Continue</button>
    </div>
  `);
  renderObPromptCards();
}

function obUsedPrompts(exceptIdx){
  return ob.prompts.map((p,i)=> i===exceptIdx ? null : p.prompt).filter(Boolean);
}

function renderObPromptCards(){
  const wrap = document.getElementById("ob-prompt-cards");
  wrap.innerHTML = ob.prompts.map((p,i)=>{
    const used = obUsedPrompts(i);
    const options = PROMPT_BANK.filter(o=> used.indexOf(o)===-1);
    return `<div class="card ob-prompt-card">
      <select onchange="obSetPromptChoice(${i},this.value)">
        <option value="">Choose a prompt</option>
        ${options.map(o=>`<option value="${esc(o)}"${o===p.prompt?" selected":""}>${esc(o)}</option>`).join("")}
      </select>
      <textarea maxlength="150" placeholder="Your answer" oninput="obSetPromptAnswer(${i},this.value)">${esc(p.answer)}</textarea>
      <div class="small ob-charcount" data-index="${i}">${p.answer.length} / 150</div>
    </div>`;
  }).join("");
}

function obSetPromptChoice(i,val){
  ob.prompts[i].prompt = val;
  renderObPromptCards();
}

function obSetPromptAnswer(i,val){
  ob.prompts[i].answer = val;
  document.querySelector(`.ob-charcount[data-index="${i}"]`).textContent = val.length + " / 150";
}

function obNextPrompts(){
  const chosen = ob.prompts.map(p=>p.prompt);
  const uniqueChosen = chosen.filter((v,i,a)=> v && a.indexOf(v)===i);
  const allAnswered = ob.prompts.every(p=> p.prompt && p.answer.trim().length>0 && p.answer.length<=150);
  const ok = uniqueChosen.length===3 && allAnswered;
  document.getElementById("ob-prompts-error").classList.toggle("show", !ok);
  if(!ok) return;
  obStep="mbti";
  renderOnboarding();
}

/* ---- Step 4: MBTI assessment ---- */
function renderObMbti(){
  document.getElementById("app").innerHTML = obShell(`
    <div class="eyebrow">Step 4 of 4</div>
    <h1>Take the personality assessment.</h1>
    <p>28 quick questions. For each pair, slide toward whichever statement sounds more like you — there's no right answer.</p>
    <div class="small" id="ob-mbti-progress">${Object.keys(ob.mbtiAnswers).length} of ${MBTI_QUESTIONS.length} answered</div>
    <div id="ob-mbti-questions"></div>
    <div class="small ob-error" id="ob-mbti-error">Answer every question to see your result — a few are still blank.</div>
    <div class="actions">
      <button class="btn" onclick="obBack()">Back</button>
      <button class="btn primary" onclick="obNextMbti()">See my result</button>
    </div>
  `);
  renderObMbtiQuestions();
}

function renderObMbtiQuestions(){
  const wrap = document.getElementById("ob-mbti-questions");
  let html = ""; let lastSection = null;
  MBTI_QUESTIONS.forEach((q,i)=>{
    if(q.section!==lastSection){
      html += `<div class="ob-mbti-section">${q.section}</div>`;
      lastSection = q.section;
    }
    html += `<div class="ob-mbti-q">
      <div class="ob-mbti-stmts"><span>${esc(q.a)}</span><span class="right">${esc(q.b)}</span></div>
      <div class="ob-mbti-scale">${[1,2,3,4,5].map(v=>
        `<label class="ob-pip${ob.mbtiAnswers[i]===v?" on":""}">
          <input type="radio" name="ob-q${i}" value="${v}" ${ob.mbtiAnswers[i]===v?"checked":""} onchange="obSetMbtiAnswer(${i},${v})">
        </label>`).join("")}</div>
    </div>`;
  });
  wrap.innerHTML = html;
}

function obSetMbtiAnswer(i,v){
  ob.mbtiAnswers[i] = v;
  document.getElementById("ob-mbti-progress").textContent = Object.keys(ob.mbtiAnswers).length + " of " + MBTI_QUESTIONS.length + " answered";
  const scale = document.querySelectorAll(".ob-mbti-q")[i].querySelectorAll(".ob-pip");
  scale.forEach((pip,idx)=> pip.classList.toggle("on", idx+1===v));
}

function computeMbti(){
  const totals={EI:0,SN:0,TF:0,JP:0}, counts={EI:0,SN:0,TF:0,JP:0};
  MBTI_QUESTIONS.forEach((q,i)=>{ totals[q.axis]+=ob.mbtiAnswers[i]; counts[q.axis]++; });
  const axes={}; let code="";
  Object.keys(totals).forEach(axis=>{
    const min=counts[axis]*1, max=counts[axis]*5;
    const bPct=Math.round(((totals[axis]-min)/(max-min))*100);
    const aPct=100-bPct;
    const meta=AXIS_META[axis];
    const letter = bPct>50 ? meta.bLetter : meta.aLetter;
    code += letter;
    axes[axis] = {aPct,bPct,letter,meta};
  });
  return {code, axes};
}

function obNextMbti(){
  const ok = Object.keys(ob.mbtiAnswers).length === MBTI_QUESTIONS.length;
  document.getElementById("ob-mbti-error").classList.toggle("show", !ok);
  if(!ok) return;
  ob.mbtiResult = computeMbti();
  obStep="review";
  renderOnboarding();
}

/* ---- Step 5: review ---- */
function renderObReview(){
  document.getElementById("app").innerHTML = obShell(`
    <div class="eyebrow">Almost there</div>
    <h1>Here's your profile.</h1>
    <p>This is what people will see when you match. You can change photos, prompts, or retake the assessment later.</p>
    <div class="card profile-card">
      <div class="ob-review-photo">
        ${ob.photos[0] ? `<img src="${ob.photos[0]}">` : `<div class="avatar">${initials(ob.name||"You")}</div>`}
      </div>
      <div class="name">${esc(ob.name)}${ob.birthday ? ", "+ageFromDate(ob.birthday) : ""}</div>
      ${ob.prompts.map(p=>`<div class="prompt"><b>${esc(p.prompt)}</b><p>${esc(p.answer)}</p></div>`).join("")}
    </div>
    <div class="actions">
      <button class="btn" onclick="obBack()">Back</button>
      <button class="btn primary full" onclick="obFinish()">Finish &amp; save profile</button>
    </div>
  `);
}

function obTypeHeadline(){
  const frags = ["EI","SN","TF","JP"].map(axis=>{
    const ax = ob.mbtiResult.axes[axis];
    return ax.bPct>50 ? ax.meta.bFrag : ax.meta.aFrag;
  });
  return `You tend to be ${frags[0]}, ${frags[1]}, ${frags[2]} when you decide, and ${frags[3]} about structure.`;
}

/* ---- Finish popup + handoff to the main app ---- */
function obFinish(){
  const overlay = document.createElement("div");
  overlay.className = "ob-modal-overlay";
  overlay.innerHTML = `<div class="ob-modal-card">
    <div class="ob-modal-check">✓</div>
    <div class="ob-modal-eyebrow">Profile saved</div>
    <div class="ob-modal-type">${ob.mbtiResult.code}</div>
    <p class="ob-modal-headline">${esc(obTypeHeadline())}</p>
    <button class="btn primary full" id="ob-modal-done">Go to Signal</button>
  </div>`;
  document.body.appendChild(overlay);
  document.getElementById("ob-modal-done").addEventListener("click", ()=>{
    overlay.remove();
    completeOnboarding();
  });
}

function completeOnboarding(){
  state.profile = {
    name: ob.name,
    birthday: ob.birthday,
    gender: ob.gender,
    interested: ob.interested,
    interests: [],
    photos: ob.photos,
    prompts: ob.prompts,
    mbti: ob.mbtiResult.code,
    mbtiAxes: ob.mbtiResult.axes
  };
  state.onboarded = true;
  state.tab = "discover"; // lands the person on the main app — Discover, with Chats/Insights/Profile in the nav
  save();
  render();
}

/* =====================================================================
   DISCOVER / MATCHES / CHAT / COACH
   Card-stack familiarity from swipe apps + a Hinge-style, specific Like.
   ===================================================================== */

let activeChat = null;
let selectedMoment = 0;
let dragStart = null;

function profileMoments(p){
  return [
    {label:"Photo", value:`${p.name}'s profile photo`, icon:"◉"},
    ...p.prompts.map(([label,value])=>({label,value,icon:"✦"}))
  ];
}

function currentProfile(){ return profiles[state.idx % profiles.length]; }

function renderDiscover(){
  const p=currentProfile();
  const moments=profileMoments(p);
  selectedMoment=Math.min(selectedMoment,moments.length-1);
  document.getElementById("app").innerHTML=shell(`
    <div class="discover-head"><div><div class="eyebrow">Discover</div><b>People nearby</b></div><button class="round-btn" aria-label="Filters">☷</button></div>
    <section class="swipe-stage" id="swipe-stage">
      <article class="discover-card" id="discover-card" aria-label="${esc(p.name)}'s profile">
        <div class="card-art"><div class="card-gradient"></div><div class="card-avatar">${initials(p.name)}</div><span class="card-photo-label">${p.interests[0]}</span></div>
        <div class="card-content">
          <div class="name">${esc(p.name)}, ${p.age}</div>
          <div class="meta">${esc(p.job)} · ${esc(p.mbti)}</div>
          <div class="chips">${p.interests.map(i=>`<span class="chip">${esc(i)}</span>`).join("")}</div>
          <div class="moment-picker" aria-label="Choose something to like">
            ${moments.map((m,i)=>`<button class="moment ${i===selectedMoment?"selected":""}" onclick="selectMoment(${i})"><span>${m.icon}</span>${esc(m.label)}</button>`).join("")}
          </div>
          <div class="selected-moment"><div class="eyebrow">${esc(moments[selectedMoment].label)}</div><p>${esc(moments[selectedMoment].value)}</p></div>
        </div>
      </article>
      <div class="swipe-hint">Swipe left to pass · right to like</div>
    </section>
    <div class="swipe-actions">
      <button class="action-button rewind" onclick="rewind()" title="Undo last pass">↶</button>
      <button class="action-button pass" onclick="reject()" title="Pass">×</button>
      <button class="action-button note" onclick="openLikeSheet()" title="Like with a note">✎</button>
      <button class="action-button like" onclick="like()" title="Like">♥</button>
    </div>
    <p class="small discover-footnote">Tap a photo or prompt, then add a note when you want to make the first message easier.</p>
  `);
  bindSwipe();
}

function selectMoment(index){ selectedMoment=index; renderDiscover(); }

function bindSwipe(){
  const card=document.getElementById("discover-card");
  if(!card) return;
  card.addEventListener("pointerdown", e=>{ dragStart={x:e.clientX, y:e.clientY}; card.setPointerCapture(e.pointerId); });
  card.addEventListener("pointermove", e=>{
    if(!dragStart) return;
    const dx=e.clientX-dragStart.x;
    card.style.transform=`translateX(${dx}px) rotate(${dx/22}deg)`;
    card.classList.toggle("swiping-right",dx>32); card.classList.toggle("swiping-left",dx<-32);
  });
  card.addEventListener("pointerup", e=>{
    if(!dragStart) return;
    const dx=e.clientX-dragStart.x; dragStart=null;
    card.style.transform=""; card.classList.remove("swiping-right","swiping-left");
    if(dx>100) like(); else if(dx<-100) reject();
  });
}

function nextProfile(){ state.lastProfileIndex=state.idx; state.idx=(state.idx+1)%profiles.length; selectedMoment=0; save(); render(); }
function reject(){ nextProfile(); }
function rewind(){
  if(state.lastProfileIndex<0) return;
  state.idx=state.lastProfileIndex; state.lastProfileIndex=-1; selectedMoment=0; save(); render();
}

function openLikeSheet(){
  const p=currentProfile(), moment=profileMoments(p)[selectedMoment];
  const overlay=document.createElement("div"); overlay.className="ob-modal-overlay"; overlay.id="like-overlay";
  overlay.innerHTML=`<div class="ob-modal-card action-sheet">
    <button class="sheet-close" onclick="closeOverlay('like-overlay')">×</button>
    <div class="eyebrow">Like a specific detail</div>
    <h2>${esc(moment.label)}</h2><p class="sheet-quote">${esc(moment.value)}</p>
    <label class="field"><span>Add a note <em>optional</em></span><textarea id="like-note" maxlength="240" placeholder="Make it personal. Signal can help after you match."></textarea></label>
    <button class="btn primary full" onclick="like(document.getElementById('like-note').value)">Send like</button>
  </div>`;
  document.body.appendChild(overlay); document.getElementById("like-note").focus();
}

function closeOverlay(id){ const el=document.getElementById(id); if(el) el.remove(); }

function like(note=""){
  closeOverlay("like-overlay");
  const p=currentProfile();
  if(!state.likes.includes(p.name)) state.likes.push(p.name);
  const alreadyMatched=state.matches.includes(p.name);
  const mutual=!alreadyMatched && Math.random()<(p.matchChance??0.6);
  if(mutual){
    state.matches.push(p.name);
    state.chatMessages[p.name]=state.chatMessages[p.name]||[];
    if(note.trim()) state.chatMessages[p.name].push(["me",note.trim()]);
    save(); showMatchPopup(p,note); return;
  }
  save(); showSentLike(p);
}

function showSentLike(p){
  const overlay=document.createElement("div"); overlay.className="ob-modal-overlay";
  overlay.innerHTML=`<div class="ob-modal-card compact-sheet"><div class="ob-modal-check">♥</div><h2>Like sent</h2><p class="ob-modal-headline">If ${esc(p.name)} likes you back, you’ll find each other in Matches.</p><button class="btn primary full" onclick="this.closest('.ob-modal-overlay').remove();nextProfile()">Keep discovering</button></div>`;
  document.body.appendChild(overlay);
}

function showMatchPopup(p,note){
  const overlay=document.createElement("div"); overlay.className="ob-modal-overlay";
  overlay.innerHTML=`<div class="ob-modal-card match-sheet"><div class="match-orbit one"></div><div class="match-orbit two"></div><div class="ob-modal-check">♥</div><div class="ob-modal-eyebrow">You matched</div><div class="ob-modal-type" style="font-size:38px;">You + ${esc(p.name)}</div><p class="ob-modal-headline">${note.trim()?"Your note has been sent with your Like.":"Start with something specific when you’re ready."}</p><button class="btn primary full" onclick="openMatchedChat('${esc(p.name)}')">Send a message</button><button class="text-btn" onclick="this.closest('.ob-modal-overlay').remove();nextProfile()">Keep discovering</button></div>`;
  document.body.appendChild(overlay);
}

function openMatchedChat(name){ closeOverlay("like-overlay"); document.querySelectorAll(".ob-modal-overlay").forEach(el=>el.remove()); activeChat=name; state.tab="chats"; save(); renderChat(); }
function chatMessages(name){ return [...((seededChats[name]||{messages:[]}).messages), ...(state.chatMessages[name]||[])]; }

function renderChats(){
  const names=state.matches;
  document.getElementById("app").innerHTML=shell(`
    <div class="discover-head"><div><div class="eyebrow">Matches</div><b>Your conversations</b></div><span class="inbox-count">${names.length}</span></div>
    ${names.length ? names.map(n=>{ const msgs=chatMessages(n), last=msgs.length?msgs[msgs.length-1][1]:"You matched — say hi 👋"; return `<button class="chat-row" onclick="openChat('${esc(n)}')"><div class="mini-avatar">${initials(n)}</div><div class="chat-copy"><div class="chat-title">${esc(n)}</div><div class="preview">${esc(last)}</div></div><span class="chat-arrow">›</span></button>`; }).join("") : `<div class="card empty-state"><div class="empty-icon">♡</div><b>No matches yet</b><p class="muted">Keep exploring. Mutual likes will appear here.</p><button class="btn primary" onclick="setTab('discover')">Discover people</button></div>`}
    <div class="card coach-promise"><div class="eyebrow">Your coach, your choice</div><b>Private help inside each chat</b><p class="muted">Signal only reads a conversation after you enable coaching for that specific match.</p></div>
  `);
}

function openChat(name){ activeChat=name; renderChat(); }
function coachInsight(name){
  const msgs=chatMessages(name);
  if(!msgs.length) return {title:"Start with their profile",body:"A specific observation lands warmer than a generic opener.",suggestion:"I have to know — what got you into that?"};
  if(name==="Anika") return {title:"A thread worth following",body:"Music already has momentum here. Make it more specific, then share your own answer.",suggestion:"What song would you pick if you had to convince someone to start listening to your taste?"};
  if(name==="Rhea") return {title:"Try a genuine pivot",body:"You’ve covered comfort food. Shift to something you actually want to know about.",suggestion:"Okay, enough food talk — what are you currently weirdly obsessed with?"};
  return {title:"Keep the exchange balanced",body:"A little of your own perspective before the next question gives them more to respond to.",suggestion:"That reminds me of something I tried recently — what about you?"};
}
function coachingEnabled(name){ return Boolean(state.coachByChat[name]); }

function renderChat(){
  const messages=chatMessages(activeChat), coachOn=coachingEnabled(activeChat);
  document.getElementById("app").innerHTML=shell(`
    <div class="chat-header"><button class="back-btn" onclick="setTab('chats')">‹</button><div><b>${esc(activeChat)}</b><div class="small">Match</div></div><button class="coach-trigger ${coachOn?"enabled":""}" onclick="openCoach()">✦ Coach</button></div>
    <div class="messages">${messages.length ? messages.map(([who,msg])=>`<div class="bubble ${who==="me"?"me":""}">${esc(msg)}</div>`).join("") : `<div class="chat-empty"><div class="empty-icon">✦</div><b>You matched with ${esc(activeChat)}</b><p>Open with something you noticed, not just “hey.”</p><button class="text-btn" onclick="openCoach()">Get opening ideas</button></div>`}</div>
    <div class="chat-input"><input id="draft" placeholder="Write a message…" onkeydown="if(event.key==='Enter')sendDraft()"><button class="btn primary" onclick="sendDraft()">Send</button></div>
  `);
}

function openCoach(){
  const on=coachingEnabled(activeChat), insight=coachInsight(activeChat);
  const overlay=document.createElement("div"); overlay.className="ob-modal-overlay"; overlay.id="coach-overlay";
  overlay.innerHTML=`<div class="ob-modal-card coach-sheet"><button class="sheet-close" onclick="closeOverlay('coach-overlay')">×</button><div class="eyebrow">Private dating coach</div><h2>${on?esc(insight.title):"Turn on coaching for this chat"}</h2><p>${on?esc(insight.body):"Signal will use this conversation only to offer optional help. It never sends messages, and you can turn it off anytime."}</p>${on?`<button class="coach-option" onclick="applyCoachSuggestion()"><span>✦</span><div><b>Use this idea</b><small>${esc(insight.suggestion)}</small></div><span>›</span></button><button class="coach-option" onclick="applyCoachSuggestion('warmer')"><span>♡</span><div><b>Make it warmer</b><small>Keep the intent, soften the delivery</small></div><span>›</span></button><button class="text-btn danger-text" onclick="toggleCoachForChat()">Turn off coaching</button>`:`<button class="btn primary full" onclick="toggleCoachForChat()">Enable coaching for ${esc(activeChat)}</button>`}</div>`;
  document.body.appendChild(overlay);
}
function toggleCoachForChat(){ state.coachByChat[activeChat]=!coachingEnabled(activeChat); save(); closeOverlay("coach-overlay"); renderChat(); }
function applyCoachSuggestion(mode="default"){
  closeOverlay("coach-overlay"); const d=document.getElementById("draft");
  d.value=mode==="warmer" ? "I like that — tell me more about what makes it special to you." : coachInsight(activeChat).suggestion;
  d.focus();
}
function sendDraft(){ const d=document.getElementById("draft"), value=d.value.trim(); if(!value)return; state.chatMessages[activeChat]=state.chatMessages[activeChat]||[]; state.chatMessages[activeChat].push(["me",value]); save(); renderChat(); }

function renderInsights(){
  const totalSent=Object.values(state.chatMessages).reduce((n,msgs)=>n+msgs.filter(([who])=>who==="me").length,0);
  document.getElementById("app").innerHTML=shell(`<div class="eyebrow">Insights</div><div class="hero"><h1>Your dating<br>signal.</h1><p>Private, behavior-based reflections—not a score and not a personality diagnosis.</p></div><div class="card"><div class="stat"><span>Topics with energy</span><b>Music ↑</b></div><div class="bar"><span style="width:82%"></span></div><div class="stat"><span>Messages you’ve sent</span><b>${totalSent}</b></div><div class="stat"><span>One thing to try</span><b>Share, then ask</b></div></div><div class="card"><div class="eyebrow">What Signal is learning</div><p class="muted">Specific topics give people more to react to than broad small talk. The coach turns these patterns into optional suggestions, only in chats where you enable it.</p><p class="small">Insights are directional and private. They are not a judgement of your value or compatibility.</p></div>`);
}

function renderProfile(){
  const p=state.profile||{name:"You",interests:[],mbti:"ENFP",photos:[],prompts:[]};
  document.getElementById("app").innerHTML=shell(`<div class="eyebrow">Profile</div><div class="card">${p.photos&&p.photos[0]?`<img class="avatar-photo" src="${p.photos[0]}">`:`<div class="avatar">${initials(p.name)}</div>`}<div class="name">${esc(p.name)}</div><div class="meta">${esc(p.mbti)}</div>${(p.prompts||[]).filter(pr=>pr.prompt).map(pr=>`<div class="prompt"><b>${esc(pr.prompt)}</b><p>${esc(pr.answer)}</p></div>`).join("")}</div><div class="card"><div class="eyebrow">Privacy</div><b>Coaching is always per conversation</b><p class="muted">Turn it on only for the chats where you want support. Signal never sends on your behalf.</p></div><div class="card"><div class="eyebrow">Demo</div><button class="btn full" onclick="resetDemo()">Reset demo data</button></div>`);
}
function resetDemo(){ localStorage.clear(); location.reload(); }
render();
