import {
  MINI_IPIP_ITEMS,
  RESPONSE_OPTIONS,
  scoreMiniIpip,
  buildInternalPersonalityModel,
  buildPersonalityNarrative
} from './personality-core.js?v=1.1.0';

const VERSION='6.4.0';
const STORE='orbita_owner_personality_v1';

export async function initOwnerTestV6(){
  if(!/\/owner-test\.html$/.test(location.pathname)) return;

  try{
    const module=await import(`./owner-test-v5.js?v=${VERSION}`);
    await module.initOwnerTestV5?.();
  }catch(error){
    console.error('owner_test_v5_load_failed',error);
  }

  injectStyles();
  installAssessmentController();
  installResultController();
}

function installAssessmentController(){
  const controls=document.querySelector('#controls');
  const messages=document.querySelector('#messages');
  if(!controls||!messages||controls.dataset.personalityController==='true') return;
  controls.dataset.personalityController='true';

  let active=false;
  let signature='';
  let step=0;
  let identity={fullName:'',kana:''};
  let responses={};

  const observer=new MutationObserver(()=>{
    const methodGrid=controls.querySelector('.method-grid');
    if(!methodGrid) return;

    const context=captureBaseContext();
    const nextSignature=hashText(JSON.stringify(context)).toString(36);
    const saved=readStore();

    if(signature&&signature!==nextSignature){
      active=false;step=0;identity={fullName:'',kana:''};responses={};
      controls.querySelector('.owner-depth-panel')?.remove();
      controls.classList.remove('owner-depth-active');
    }
    signature=nextSignature;

    if(saved?.signature===signature&&saved.completed){
      return;
    }
    if(!active) begin(context);
  });

  observer.observe(controls,{childList:true,subtree:true});

  function begin(context){
    active=true;
    step=0;
    identity={fullName:'',kana:''};
    responses={};
    controls.classList.add('owner-depth-active');
    renderIdentity(context);
  }

  function renderIdentity(context){
    let panel=controls.querySelector('.owner-depth-panel');
    if(!panel){
      panel=document.createElement('section');
      panel.className='owner-depth-panel';
      controls.append(panel);
    }
    panel.innerHTML=`
      <p class="owner-depth-eyebrow">DEEP READING</p>
      <h3>もう少し深く読み解くために</h3>
      <p class="owner-depth-note">お名前と読み方は、鑑定結果の表現にだけ使用します。このページから外部へ送信されません。</p>
      <div class="owner-name-grid">
        <label><span>お名前</span><input id="owner-full-name" type="text" maxlength="60" autocomplete="name" placeholder="例：山田 花子"></label>
        <label><span>ふりがな</span><input id="owner-kana" type="text" maxlength="80" placeholder="例：やまだ はなこ"></label>
      </div>
      <div class="owner-depth-actions">
        <button id="owner-skip-name" class="button" type="button">入力せず進む</button>
        <button id="owner-save-name" class="button primary" type="button">この内容で進む</button>
      </div>`;

    panel.querySelector('#owner-save-name').addEventListener('click',()=>{
      identity={
        fullName:panel.querySelector('#owner-full-name').value.trim(),
        kana:panel.querySelector('#owner-kana').value.trim()
      };
      renderItem(context);
    });
    panel.querySelector('#owner-skip-name').addEventListener('click',()=>{
      identity={fullName:'',kana:''};
      renderItem(context);
    });
  }

  function renderItem(context){
    const panel=controls.querySelector('.owner-depth-panel');
    const item=MINI_IPIP_ITEMS[step];
    if(!panel||!item){
      complete(context);
      return;
    }

    panel.innerHTML=`
      <div class="owner-depth-progress"><span>読み取りを深めています</span><strong>${step+1} / ${MINI_IPIP_ITEMS.length}</strong></div>
      <h3 class="owner-depth-question">「${escapeHTML(item.text)}」</h3>
      <p class="owner-depth-note">普段の自分にどの程度当てはまるかを選んでください。</p>
      <div class="owner-scale-grid">
        ${RESPONSE_OPTIONS.map((option)=>`<button type="button" data-owner-value="${option.value}"><span>${option.value}</span>${escapeHTML(option.label)}</button>`).join('')}
      </div>`;

    panel.querySelectorAll('[data-owner-value]').forEach((button)=>{
      button.addEventListener('click',()=>{
        responses[item.id]=Number(button.dataset.ownerValue);
        step+=1;
        renderItem(context);
      },{once:true});
    });
  }

  function complete(context){
    const scores=scoreMiniIpip(responses);
    const payload={
      signature,
      completed:true,
      identity,
      responses,
      scores,
      context,
      completedAt:new Date().toISOString()
    };
    sessionStorage.setItem(STORE,JSON.stringify(payload));
    controls.querySelector('.owner-depth-panel')?.remove();
    controls.classList.remove('owner-depth-active');
    active=false;
    appendSingleAgentMessage('読み取りに必要な情報が整いました。最後に、今回使う占い方法を選んでください。');
  }
}

function installResultController(){
  const root=document.querySelector('#result-root');
  if(!root||root.dataset.personalityResultController==='true') return;
  root.dataset.personalityResultController='true';

  let scheduled=false;
  const schedule=()=>{
    if(scheduled) return;
    scheduled=true;
    window.requestAnimationFrame(()=>{
      scheduled=false;
      renderPersonalityProfile();
    });
  };
  const observer=new MutationObserver(schedule);
  observer.observe(root,{childList:true,subtree:true});
  schedule();
}

function renderPersonalityProfile(){
  const root=document.querySelector('#result-root');
  if(!root||!root.children.length||root.querySelector('.owner-personality-profile')) return;

  const saved=readStore();
  if(!saved?.completed||!saved?.scores) return;

  const context={...saved.context};
  const tarotNames=[...root.querySelectorAll('.tarot-card h3')].map((element)=>element.textContent.trim()).filter(Boolean);
  const advisorTone=document.querySelector('#chat-head h2')?.textContent?.trim()||'';
  const model=buildInternalPersonalityModel({
    scores:saved.scores,
    context,
    identity:saved.identity,
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

function captureBaseContext(){
  const values=[...document.querySelectorAll('#messages .message.user .bubble')].map((element)=>element.textContent.trim());
  return {
    nickname:values[0]||'',
    birthdate:values[1]||'',
    category:values[2]||'',
    question:values[3]||'',
    option1:values[4]||'',
    option2:values[5]||'',
    timeframe:values[6]||'',
    tension:values[7]||''
  };
}

function appendSingleAgentMessage(text){
  const messages=document.querySelector('#messages');
  if(!messages||[...messages.querySelectorAll('.message.agent .bubble')].some((node)=>node.textContent===text)) return;
  const row=document.createElement('div');
  row.className='message agent owner-personality-message';
  row.innerHTML=`<div class="bubble">${escapeHTML(text)}</div>`;
  messages.append(row);
  messages.scrollTop=messages.scrollHeight;
}

function injectStyles(){
  if(document.querySelector('style[data-owner-personality-v6]')) return;
  const style=document.createElement('style');
  style.dataset.ownerPersonalityV6='true';
  style.textContent=`
    #controls.owner-depth-active>.method-grid{display:none!important}
    .owner-depth-panel{margin-top:12px;padding:22px;border:1px solid rgba(215,182,108,.38);border-radius:18px;background:linear-gradient(145deg,rgba(215,182,108,.08),rgba(8,7,4,.98))}
    .owner-depth-eyebrow,.owner-personality-eyebrow{margin:0 0 8px;color:#d7b66c;font:11px Georgia,serif;letter-spacing:.22em}
    .owner-depth-panel h3{margin:0 0 8px;color:#f2dda0;font-size:23px}
    .owner-depth-note{color:#aaa08d;font-size:13px}
    .owner-name-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:18px}
    .owner-name-grid label span{display:block;margin-bottom:6px;color:#d7cdbb;font-size:12px}
    .owner-name-grid input{width:100%;padding:14px;border:1px solid rgba(215,182,108,.3);border-radius:12px;background:#070604;color:#f6efe1}
    .owner-depth-actions{display:flex;justify-content:flex-end;gap:10px;flex-wrap:wrap;margin-top:18px}
    .owner-depth-progress{display:flex;justify-content:space-between;gap:12px;color:#aaa08d;font-size:12px}
    .owner-depth-progress strong{color:#f2dda0}
    .owner-depth-question{margin:22px 0 8px!important;line-height:1.65}
    .owner-scale-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin-top:18px}
    .owner-scale-grid button{min-height:96px;padding:10px 7px;border:1px solid rgba(215,182,108,.3);border-radius:13px;background:#080704;color:#d9cfbd;cursor:pointer;font-size:12px;line-height:1.45}
    .owner-scale-grid button:hover,.owner-scale-grid button:focus{border-color:#f2dda0;background:rgba(215,182,108,.1);outline:none}
    .owner-scale-grid button span{display:block;margin-bottom:5px;color:#f2dda0;font:20px Georgia,serif}
    .owner-personality-profile{margin:28px 0;padding:30px;border:1px solid rgba(240,217,153,.48);border-radius:20px;background:radial-gradient(circle at 15% 0,rgba(215,182,108,.13),transparent 36%),linear-gradient(145deg,rgba(18,13,7,.98),rgba(6,5,3,.98))}
    .owner-personality-profile h2{margin:4px 0 18px;color:#f2dda0;font-size:clamp(28px,4vw,42px)}
    .owner-personality-copy{max-width:900px}
    .owner-personality-copy p{margin:0 0 16px;color:#eee4d2;font-size:clamp(16px,2vw,19px);line-height:1.95}
    .owner-personality-copy p:last-child{margin-bottom:0}
    @media(max-width:760px){.owner-name-grid{grid-template-columns:1fr}.owner-scale-grid{grid-template-columns:1fr}.owner-scale-grid button{min-height:54px;text-align:left;padding:10px 14px}.owner-scale-grid button span{display:inline-block;width:28px;margin:0 7px 0 0}.owner-personality-profile{padding:21px}}
  `;
  document.head.append(style);
}

function readStore(){
  try{return JSON.parse(sessionStorage.getItem(STORE)||'null');}catch{return null;}
}

function hashText(value){
  let hash=2166136261;
  for(const char of String(value||'')){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619);}
  return hash>>>0;
}

function escapeHTML(value){
  return String(value??'').replace(/[&<>'"]/g,(char)=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}
