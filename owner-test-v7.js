const VERSION='7.4.0';
const IDENTITY_STORE='orbita_owner_identity_v2';
const PERSONALITY_STORE='orbita_owner_personality_v1';

export async function initOwnerTestV7(){
  if(!/\/owner-test\.html$/.test(location.pathname)) return;

  try{
    const module=await import(`./owner-test-v6.js?v=${VERSION}`);
    await module.initOwnerTestV6?.();
  }catch(error){
    console.error('owner_test_v6_load_failed',error);
  }

  injectStyles();
  installInitialIdentityController();
  installLateIdentityBridge();
}

function installInitialIdentityController(){
  const controls=document.querySelector('#controls');
  const messages=document.querySelector('#messages');
  if(!controls||!messages||controls.dataset.ownerInitialIdentityController==='true') return;
  controls.dataset.ownerInitialIdentityController='true';

  const renderIfNeeded=()=>{
    if(controls.querySelector('.owner-initial-identity')) return;

    const input=controls.querySelector('#chat-input');
    const send=controls.querySelector('#send');
    const userMessages=messages.querySelectorAll('.message.user .bubble');
    const isFirstQuestion=input&&send&&userMessages.length===0&&/ミナ|呼び名/.test(`${input.placeholder||''} ${messages.textContent||''}`);
    if(!isFirstQuestion) return;

    sessionStorage.removeItem(IDENTITY_STORE);
    sessionStorage.removeItem(PERSONALITY_STORE);

    const agentBubbles=[...messages.querySelectorAll('.message.agent .bubble')];
    const lastAgent=agentBubbles.at(-1);
    if(lastAgent&&/お呼びする名前|呼び名/.test(lastAgent.textContent||'')){
      lastAgent.textContent='最初に、お名前と読み方、鑑定中の呼び名を教えてください。';
    }

    const panel=document.createElement('section');
    panel.className='owner-initial-identity';
    panel.innerHTML=`
      <p class="owner-initial-eyebrow">FIRST READING</p>
      <h3>最初に、お名前を教えてください</h3>
      <p class="owner-initial-note">お名前と読み方は鑑定結果の表現に使用します。鑑定中は、指定した呼び名でお呼びします。</p>
      <div class="owner-initial-grid">
        <label>
          <span>お名前（本名またはニックネーム）</span>
          <input id="owner-initial-full-name" type="text" maxlength="60" autocomplete="name" placeholder="例：山田 花子">
        </label>
        <label>
          <span>ふりがな</span>
          <input id="owner-initial-kana" type="text" maxlength="80" inputmode="text" placeholder="例：やまだ はなこ">
        </label>
        <label>
          <span>鑑定中の呼び名</span>
          <input id="owner-initial-call-name" type="text" maxlength="40" placeholder="例：花子さん">
        </label>
      </div>
      <div id="owner-initial-error" class="error hidden"></div>
      <div class="owner-initial-actions">
        <button id="owner-initial-submit" class="button primary" type="button">この内容で進む</button>
      </div>`;

    controls.classList.add('owner-initial-active');
    controls.append(panel);

    const fullName=panel.querySelector('#owner-initial-full-name');
    const kana=panel.querySelector('#owner-initial-kana');
    const callName=panel.querySelector('#owner-initial-call-name');
    const error=panel.querySelector('#owner-initial-error');

    const submit=()=>{
      const identity={
        fullName:fullName.value.trim(),
        kana:kana.value.trim(),
        callName:callName.value.trim()
      };

      if(!identity.fullName||!identity.kana||!identity.callName){
        error.textContent='お名前・ふりがな・鑑定中の呼び名をすべて入力してください。';
        error.classList.remove('hidden');
        return;
      }

      sessionStorage.setItem(IDENTITY_STORE,JSON.stringify(identity));
      input.value=identity.callName;
      input.dispatchEvent(new Event('input',{bubbles:true}));
      input.dispatchEvent(new Event('change',{bubbles:true}));

      controls.classList.remove('owner-initial-active');
      panel.remove();
      send.click();
    };

    panel.querySelector('#owner-initial-submit').addEventListener('click',submit);
    panel.addEventListener('keydown',(event)=>{
      if(event.key==='Enter'){
        event.preventDefault();
        submit();
      }
    });

    window.setTimeout(()=>fullName.focus(),60);
  };

  const observer=new MutationObserver(renderIfNeeded);
  observer.observe(controls,{childList:true,subtree:true});
  renderIfNeeded();
}

function installLateIdentityBridge(){
  const controls=document.querySelector('#controls');
  if(!controls||controls.dataset.ownerIdentityBridge==='true') return;
  controls.dataset.ownerIdentityBridge='true';

  const bridge=()=>{
    const fullName=controls.querySelector('#owner-full-name');
    const kana=controls.querySelector('#owner-kana');
    const save=controls.querySelector('#owner-save-name');
    if(!fullName||!kana||!save||save.dataset.ownerIdentityBridged==='true') return;

    const identity=readIdentity();
    if(!identity?.fullName||!identity?.kana) return;

    save.dataset.ownerIdentityBridged='true';
    fullName.value=identity.fullName;
    kana.value=identity.kana;
    const panel=fullName.closest('.owner-depth-panel');
    panel?.classList.add('owner-identity-autofill');

    window.requestAnimationFrame(()=>{
      save.click();
      panel?.classList.remove('owner-identity-autofill');
    });
  };

  const observer=new MutationObserver(bridge);
  observer.observe(controls,{childList:true,subtree:true});
  bridge();
}

function readIdentity(){
  try{return JSON.parse(sessionStorage.getItem(IDENTITY_STORE)||'null');}
  catch{return null;}
}

function injectStyles(){
  if(document.querySelector('style[data-owner-name-flow-v7]')) return;
  const style=document.createElement('style');
  style.dataset.ownerNameFlowV7='true';
  style.textContent=`
    #controls.owner-initial-active>:not(.owner-initial-identity){display:none!important}
    .owner-initial-identity{margin-top:12px;padding:24px;border:1px solid rgba(215,182,108,.42);border-radius:18px;background:radial-gradient(circle at 10% 0,rgba(215,182,108,.12),transparent 36%),linear-gradient(145deg,rgba(18,13,7,.98),rgba(7,6,4,.99))}
    .owner-initial-eyebrow{margin:0 0 8px;color:#d7b66c;font:11px Georgia,serif;letter-spacing:.22em}
    .owner-initial-identity h3{margin:0 0 8px;color:#f2dda0;font-size:24px}
    .owner-initial-note{margin:0;color:#aaa08d;font-size:13px;line-height:1.75}
    .owner-initial-grid{display:grid;grid-template-columns:1fr 1fr;gap:13px;margin-top:20px}
    .owner-initial-grid label:last-child{grid-column:1/-1}
    .owner-initial-grid label span{display:block;margin-bottom:6px;color:#d7cdbb;font-size:12px}
    .owner-initial-grid input{width:100%;padding:14px;border:1px solid rgba(215,182,108,.32);border-radius:12px;background:#070604;color:#f6efe1;outline:none}
    .owner-initial-grid input:focus{border-color:#f2dda0;box-shadow:0 0 0 3px rgba(215,182,108,.09)}
    .owner-initial-actions{display:flex;justify-content:flex-end;margin-top:20px}
    #controls .owner-depth-panel.owner-identity-autofill{display:none!important}
    @media(max-width:760px){.owner-initial-identity{padding:20px}.owner-initial-grid{grid-template-columns:1fr}.owner-initial-grid label:last-child{grid-column:auto}}
  `;
  document.head.append(style);
}
