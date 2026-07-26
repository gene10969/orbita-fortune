const VERSION='4.0.0';

export async function initOwnerTestV4(){
  if(!/\/owner-test\.html$/.test(location.pathname)) return;

  injectWaitingStyles();
  installWaitingController();

  const NativeMutationObserver=window.MutationObserver;
  window.MutationObserver=createBatchedMutationObserver(NativeMutationObserver);

  try{
    const module=await import(`./owner-test-v3.js?v=${VERSION}`);
    module.initOwnerTestEnhancements?.();
  }catch(error){
    console.error('owner_test_v3_load_failed',error);
  }finally{
    window.MutationObserver=NativeMutationObserver;
  }
}

function createBatchedMutationObserver(NativeMutationObserver){
  return class BatchedMutationObserver{
    constructor(callback){
      this.callback=callback;
      this.records=[];
      this.timer=0;
      this.native=new NativeMutationObserver((records)=>{
        this.records.push(...records);
        if(this.timer) return;
        this.timer=window.setTimeout(()=>this.flush(),32);
      });
    }

    flush(){
      window.clearTimeout(this.timer);
      this.timer=0;
      const records=this.records.splice(0);
      if(!records.length) return;

      const addedElements=[];
      for(const record of records){
        for(const node of record.addedNodes||[]){
          if(node.nodeType===Node.ELEMENT_NODE) addedElements.push(node);
        }
      }

      const first=addedElements[0];
      const target=first?.closest?.('#result-panel,#chat-panel,#waiting-panel,#advisor-panel')||first||document.body;
      const collapsedRecord={addedNodes:[target]};

      try{
        this.callback([collapsedRecord],this);
      }catch(error){
        console.error('owner_test_observer_callback_failed',error);
      }
    }

    observe(...args){return this.native.observe(...args);}
    disconnect(){
      window.clearTimeout(this.timer);
      this.timer=0;
      this.records.length=0;
      return this.native.disconnect();
    }
    takeRecords(){return this.native.takeRecords();}
  };
}

function injectWaitingStyles(){
  if(document.querySelector('style[data-owner-waiting-v4]')) return;
  const style=document.createElement('style');
  style.dataset.ownerWaitingV4='true';
  style.textContent=`
    #waiting-panel .estimate,
    #waiting-panel .orb,
    #waiting-panel .waiting-content,
    #waiting-panel .waiting-dots{display:none!important}

    #waiting-panel .progress{padding:72px 18px 78px}
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
    @keyframes ownerWaitingSpin{to{transform:rotate(360deg)}}
  `;
  document.head.append(style);
}

function installWaitingController(){
  const panel=document.querySelector('#waiting-panel');
  if(!panel||panel.dataset.ownerWaitingController==='true') return;
  panel.dataset.ownerWaitingController='true';

  let active=false;
  let fastForwardTimer=0;
  let restoreTimer=0;
  const realDateNow=Date.now.bind(Date);

  const restoreDateNow=()=>{
    if(Date.now!==realDateNow) Date.now=realDateNow;
    window.clearTimeout(restoreTimer);
    restoreTimer=0;
  };

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
    if(detail) detail.textContent='相談内容と選んだ占い方法を丁寧に読み解いています。準備ができ次第、結果を表示します。';
  };

  const fastForwardInternalTimer=()=>{
    window.clearTimeout(fastForwardTimer);
    fastForwardTimer=window.setTimeout(()=>{
      if(panel.classList.contains('hidden')) return;
      Date.now=()=>realDateNow()+10*60*1000;
      restoreTimer=window.setTimeout(restoreDateNow,800);
    },900);
  };

  const update=()=>{
    const visible=!panel.classList.contains('hidden');
    if(visible&&!active){
      active=true;
      configureWaitingScreen();
      fastForwardInternalTimer();
    }else if(!visible&&active){
      active=false;
      window.clearTimeout(fastForwardTimer);
      fastForwardTimer=0;
      restoreDateNow();
    }
  };

  const observer=new MutationObserver(update);
  observer.observe(panel,{attributes:true,attributeFilter:['class']});
  update();
}
