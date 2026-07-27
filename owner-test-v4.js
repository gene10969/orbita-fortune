const VERSION='4.3.0';

export async function initOwnerTestV4(){
  if(!/\/owner-test\.html$/.test(location.pathname)) return;

  injectWaitingStyles();
  installWaitingController();

  const NativeMutationObserver=window.MutationObserver;

  try{
    const module=await import(`./owner-test-v3.js?v=${VERSION}`);
    module.initOwnerTestEnhancements?.();
  }catch(error){
    console.error('owner_test_v3_load_failed',error);
  }

  installTarotTitleController(NativeMutationObserver);
}

function injectWaitingStyles(){
  if(document.querySelector('style[data-owner-waiting-v4]')) return;
  const style=document.createElement('style');
  style.dataset.ownerWaitingV4='true';
  style.textContent=`
    #waiting-panel .estimate,
    #waiting-panel .orb{display:none!important}

    #waiting-panel .progress{padding:54px 18px 68px}
    #waiting-panel .owner-waiting-mark{
      width:112px;height:112px;margin:0 auto 30px;border-radius:50%;
      position:relative;border:1px solid rgba(215,182,108,.52);
      display:grid;place-items:center;color:#f2dda0;font-family:Georgia,serif;font-size:28px
    }
    #waiting-panel .owner-waiting-mark:before,
    #waiting-panel .owner-waiting-mark:after{
      content:"";position:absolute;border-radius:50%;border:1px solid rgba(215,182,108,.25)
    }
    #waiting-panel .owner-waiting-mark:before{inset:13px}
    #waiting-panel .owner-waiting-mark:after{inset:27px;border-style:dashed;animation:ownerWaitingSpin 5s linear infinite}
    #waiting-panel .owner-waiting-mark span{position:relative;z-index:1}
    #waiting-panel #waiting-title{max-width:780px;margin:0 auto 14px;font-size:clamp(30px,5vw,50px)}
    #waiting-panel #waiting-detail{max-width:700px;margin:0 auto;color:#c5baa6;font-size:16px}
    #waiting-panel .waiting-content{
      display:block!important;
      margin-top:30px;
      min-height:150px;
      border-color:rgba(215,182,108,.38);
      background:linear-gradient(145deg,rgba(215,182,108,.08),rgba(10,8,5,.96))
    }
    #waiting-panel .waiting-content h3{font-size:21px}
    #waiting-panel .waiting-dots{display:flex!important;margin-top:18px}
    @keyframes ownerWaitingSpin{to{transform:rotate(360deg)}}
  `;
  document.head.append(style);
}

function installWaitingController(){
  const panel=document.querySelector('#waiting-panel');
  if(!panel||panel.dataset.ownerWaitingController==='true') return;
  panel.dataset.ownerWaitingController='true';

  let active=false;

  const configureWaitingScreen=()=>{
    const progress=panel.querySelector('.progress');
    if(progress&&!progress.querySelector('.owner-waiting-mark')){
      const mark=document.createElement('div');
      mark.className='owner-waiting-mark';
      mark.setAttribute('aria-hidden','true');
      mark.innerHTML='<span>✦</span>';
      progress.prepend(mark);
    }

    const title=panel.querySelector('#waiting-title');
    if(title) title.textContent='鑑定士があなたのために結果をまとめています';

    const detail=panel.querySelector('#waiting-detail');
    if(detail) detail.textContent='相談内容と選んだ占い方法を丁寧に読み解いています。待っている間は、下の内容をご覧ください。';
  };

  const update=()=>{
    const visible=!panel.classList.contains('hidden');
    if(visible&&!active){
      active=true;
      configureWaitingScreen();
    }else if(!visible&&active){
      active=false;
    }
  };

  const observer=new MutationObserver(update);
  observer.observe(panel,{attributes:true,attributeFilter:['class']});
  update();
}

function installTarotTitleController(NativeMutationObserver){
  const root=document.querySelector('#result-root');
  if(!root||root.dataset.ownerTarotTitleController==='true') return;
  root.dataset.ownerTarotTitleController='true';

  let timer=0;
  const schedule=()=>{
    window.clearTimeout(timer);
    timer=window.setTimeout(labelTarotCards,80);
  };

  const observer=new NativeMutationObserver(schedule);
  observer.observe(root,{childList:true,subtree:true});
  schedule();
}

function labelTarotCards(){
  const namespace='http://www.w3.org/2000/svg';
  const cards=[...document.querySelectorAll('#result-root .tarot-card')];

  cards.forEach((card,index)=>{
    const svg=card.querySelector('.owner-tarot-illustration svg');
    if(!svg||svg.dataset.ownerCardName==='true') return;

    const name=card.querySelector('h3')?.textContent?.trim()||`タロットカード${index+1}`;
    const group=document.createElementNS(namespace,'g');
    group.setAttribute('class','owner-tarot-nameplate');
    group.setAttribute('aria-hidden','true');

    const plate=document.createElementNS(namespace,'rect');
    plate.setAttribute('x','88');
    plate.setAttribute('y','48');
    plate.setAttribute('width','424');
    plate.setAttribute('height','54');
    plate.setAttribute('rx','18');
    plate.setAttribute('fill','#09070b');
    plate.setAttribute('fill-opacity','.92');
    plate.setAttribute('stroke','#d7b66c');
    plate.setAttribute('stroke-width','2');

    const text=document.createElementNS(namespace,'text');
    text.setAttribute('x','300');
    text.setAttribute('y','83');
    text.setAttribute('text-anchor','middle');
    text.setAttribute('fill','#f6e3aa');
    text.setAttribute('font-family','Yu Mincho, Hiragino Mincho ProN, serif');
    text.setAttribute('font-size',name.length>=8?'25':'29');
    text.setAttribute('letter-spacing','2');
    text.textContent=name;

    group.append(plate,text);
    svg.append(group);
    svg.dataset.ownerCardName='true';
    svg.setAttribute('aria-label',`${name}のタロットカードイラスト`);
  });
}
