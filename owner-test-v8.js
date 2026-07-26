import {
  buildInternalPersonalityModel,
  buildPersonalityNarrative
} from './personality-core.js?v=1.0.1';

const VERSION='8.0.0';
const PERSONALITY_STORE='orbita_owner_personality_v1';

export async function initOwnerTestV8(){
  if(!/\/owner-test\.html$/.test(location.pathname)) return;

  try{
    const module=await import(`./owner-test-v7.js?v=${VERSION}`);
    await module.initOwnerTestV7?.();
  }catch(error){
    console.error('owner_test_v7_load_failed',error);
  }

  installAssessmentFlowRecovery();
  await reinstallFinalTarotController();
  installPersonalityResultRecovery();
}

function installAssessmentFlowRecovery(){
  const controls=document.querySelector('#controls');
  if(!controls||controls.dataset.ownerFlowRecovery==='true') return;
  controls.dataset.ownerFlowRecovery='true';

  let timer=0;
  const schedule=()=>{
    window.clearTimeout(timer);
    timer=window.setTimeout(repair,24);
  };

  const repair=()=>{
    const panel=controls.querySelector('.owner-depth-panel.owner-identity-autofill');
    if(panel&&(panel.querySelector('.owner-depth-question')||panel.querySelector('[data-owner-value]'))){
      panel.classList.remove('owner-identity-autofill');
    }

    const saved=readPersonalityStore();
    const methodGrid=controls.querySelector('.method-grid');
    const depthPanel=controls.querySelector('.owner-depth-panel');

    if(saved?.completed&&methodGrid){
      controls.classList.remove('owner-depth-active');
      methodGrid.style.removeProperty('display');
    }

    if(controls.classList.contains('owner-depth-active')&&!depthPanel&&saved?.completed){
      controls.classList.remove('owner-depth-active');
    }
  };

  const observer=new MutationObserver(schedule);
  observer.observe(controls,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  repair();
}

async function reinstallFinalTarotController(){
  const root=document.querySelector('#result-root');
  if(!root||root.dataset.ownerFinalTarotRecovery==='true') return;
  root.dataset.ownerFinalTarotRecovery='true';

  try{
    root.removeAttribute('data-owner-tarot-concept-controller');
    const module=await import(`./owner-test-v5.js?v=${VERSION}`);
    await module.initOwnerTestV5?.();
  }catch(error){
    console.error('owner_final_tarot_reload_failed',error);
  }

  let timer=0;
  let refreshing=false;

  const schedule=()=>{
    window.clearTimeout(timer);
    timer=window.setTimeout(ensureFinalIllustrations,90);
  };

  const ensureFinalIllustrations=()=>{
    if(refreshing) return;

    const cards=[...root.querySelectorAll('.tarot-card')];
    if(!cards.length) return;

    const mismatched=cards.filter((card)=>{
      const name=card.querySelector('h3')?.textContent?.trim();
      const art=card.querySelector('.owner-tarot-illustration');
      const svg=art?.querySelector('svg');
      if(!name||!art||!svg) return false;
      const label=svg.getAttribute('aria-label')||'';
      return art.dataset.ownerConceptName!==name||!label.includes(`${name}を表した`);
    });

    if(!mismatched.length) return;

    refreshing=true;
    mismatched.forEach((card)=>{
      const art=card.querySelector('.owner-tarot-illustration');
      if(art) art.removeAttribute('data-owner-concept-name');
    });

    const marker=document.createComment('owner-tarot-v8-refresh');
    root.append(marker);
    marker.remove();

    window.setTimeout(()=>{
      refreshing=false;
      ensureFinalIllustrations();
    },320);
  };

  const observer=new MutationObserver(schedule);
  observer.observe(root,{childList:true,subtree:true});
  schedule();
}

function installPersonalityResultRecovery(){
  const root=document.querySelector('#result-root');
  if(!root||root.dataset.ownerPersonalityRecovery==='true') return;
  root.dataset.ownerPersonalityRecovery='true';

  let timer=0;
  const schedule=()=>{
    window.clearTimeout(timer);
    timer=window.setTimeout(renderPersonalityIfMissing,170);
  };

  const observer=new MutationObserver(schedule);
  observer.observe(root,{childList:true,subtree:true});
  schedule();
}

function renderPersonalityIfMissing(){
  const root=document.querySelector('#result-root');
  if(!root||!root.children.length||root.querySelector('.owner-personality-profile')) return;

  const saved=readPersonalityStore();
  if(!saved?.completed||!saved?.scores) return;

  const tarotNames=[...root.querySelectorAll('.tarot-card h3')]
    .map((element)=>element.textContent.trim())
    .filter(Boolean);
  const advisorTone=document.querySelector('#chat-head h2')?.textContent?.trim()||'';
  const model=buildInternalPersonalityModel({
    scores:saved.scores,
    context:{...saved.context},
    identity:saved.identity||{},
    tarotNames,
    advisorTone
  });
  const narrative=buildPersonalityNarrative(model);

  const section=document.createElement('section');
  section.className='owner-personality-profile';
  section.innerHTML=`
    <p class="owner-personality-eyebrow">INNER PORTRAIT</p>
    <h2>${escapeHTML(narrative.title)}</h2>
    <div class="owner-personality-copy">${narrative.paragraphs.map((paragraph)=>`<p>${escapeHTML(paragraph)}</p>`).join('')}</div>`;

  const target=root.querySelector('.recommend')||root.firstElementChild;
  if(target) target.before(section);
  else root.prepend(section);
}

function readPersonalityStore(){
  try{return JSON.parse(sessionStorage.getItem(PERSONALITY_STORE)||'null');}
  catch{return null;}
}

function escapeHTML(value){
  return String(value??'').replace(/[&<>'"]/g,(char)=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}
