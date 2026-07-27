const VERSION='3.5.0';

export function initOwnerTestEnhancements(){
  if(!/\/owner-test\.html$/.test(location.pathname)) return;
  if(document.body.dataset.ownerTestEnhancements==='true') return;
  document.body.dataset.ownerTestEnhancements='true';

  injectStyles();
  enhance(document.body);
  const observer=new MutationObserver((mutations)=>{
    for(const mutation of mutations){
      for(const node of mutation.addedNodes){
        if(node.nodeType===Node.ELEMENT_NODE) enhance(node);
        else if(node.nodeType===Node.TEXT_NODE) normalizeTextNode(node);
      }
    }
    enhanceConsent();
    enhanceResult();
  });
  observer.observe(document.body,{childList:true,subtree:true});
}

function injectStyles(){
  if(document.querySelector('link[data-owner-test-v3]')) return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href=`owner-test-v3.css?v=${VERSION}`;
  link.dataset.ownerTestV3='true';
  document.head.append(link);
}

function enhance(root){
  normalizeTextTree(root);
  enhanceConsent();
  enhanceResult();
}

function replaceText(value){
  return String(value??'')
    .replace(/一つ目の候補を入力してください。/g,'今のまま進む道を入力してください。')
    .replace(/もう一つの候補を入力してください。/g,'別の方向へ進む道を入力してください。')
    .replace(/二つの候補を比較/g,'二つの道を比較')
    .replace(/候補1とは違う内容を入力してください。/g,'「今のまま進む道」とは違う内容を入力してください。')
    .replace(/候補1と候補2/g,'今のまま進む道と別の方向へ進む道')
    .replace(/候補1/g,'今のまま進む道')
    .replace(/候補2/g,'別の方向へ進む道')
    .replace(/三枚の象徴札|三枚の象徴カード|3枚の象徴札|3枚の象徴カード/g,'3枚のタロットカード')
    .replace(/象徴札|象徴カード/g,'タロットカード')
    .replace(/3枚のタロット(?!カード)/g,'3枚のタロットカード')
    .replace(/中心札/g,'中心のタロットカード')
    .replace(/中心のタロット(?!カード)/g,'中心のタロットカード')
    .replace(/AとB|A・B/g,'二つの道')
    .replace(/A側/g,'今のまま進む道')
    .replace(/B側/g,'別の方向へ進む道')
    .replace(/Aを/g,'今のまま進む道を')
    .replace(/Bを/g,'別の方向へ進む道を')
    .replace(/Aで/g,'今のまま進む道で')
    .replace(/Bで/g,'別の方向へ進む道で')
    .replace(/Aの/g,'今のまま進む道の')
    .replace(/Bの/g,'別の方向へ進む道の');
}

function normalizeTextNode(node){
  const next=replaceText(node.nodeValue);
  if(next!==node.nodeValue) node.nodeValue=next;
}

function normalizeTextTree(root){
  if(!root) return;
  if(root.nodeType===Node.TEXT_NODE){normalizeTextNode(root);return;}
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
  const nodes=[];
  while(walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(normalizeTextNode);
  root.querySelectorAll?.('[aria-label],[title],[placeholder]').forEach((element)=>{
    for(const attr of ['aria-label','title','placeholder']){
      const current=element.getAttribute(attr);
      if(!current) continue;
      const next=replaceText(current);
      if(next!==current) element.setAttribute(attr,next);
    }
  });
}

function enhanceConsent(){
  const input=document.querySelector('#adult');
  if(!input) return;
  const label=input.closest('label');
  if(!label||label.dataset.ownerConsent==='true') return;
  const checked=input.checked;
  const replacement=input.cloneNode(true);
  replacement.checked=checked;
  label.className='owner-consent-row';
  label.htmlFor='adult';
  label.innerHTML='<span>18歳以上であり、鑑定結果を参考にしながら最終的には自分で判断することを確認しました</span>';
  label.append(replacement);
  label.dataset.ownerConsent='true';
}

function enhanceResult(){
  const root=document.querySelector('#result-root');
  if(!root||!root.children.length) return;
  normalizeTextTree(root);
  makeRecommendationAssertive(root);
  relabelPaths(root);
  addLuckyFortune(root);
  upgradeTarotCards(root);
}

function makeRecommendationAssertive(root){
  const section=root.querySelector('.recommend');
  if(!section||section.dataset.ownerAssertive==='true') return;
  section.classList.add('owner-assertive-result');
  const heading=section.querySelector('h2');
  if(heading){
    const selected=heading.textContent.match(/「(.+?)」/)?.[1];
    if(selected) heading.textContent=`今回の答えは「${selected}」です`;
  }
  const intro=section.querySelector('h2 + p');
  if(intro) intro.textContent='今はこの道を選び、今日できる一歩を進めてください。';
  section.querySelectorAll('li').forEach((item)=>{
    item.textContent=replaceText(item.textContent)
      .replace(/の方が、今の状況と合わせやすい結果です。/,'を選ぶ流れが出ています。')
      .replace(/無理なく試せる流れです。/,'迷わず進める流れです。');
  });
  section.dataset.ownerAssertive='true';
}

function relabelPaths(root){
  const cards=[...root.querySelectorAll('.choice-result')];
  cards.forEach((card,index)=>{
    if(card.dataset.ownerPathLabel==='true') return;

    const smalls=card.querySelectorAll('small');
    if(smalls[0]) smalls[0].textContent=index===0?'今のまま進む道':'別の方向へ進む道';
    const status=card.querySelector('p');
    if(status){
      if(/こちらを優先|選ぶ道/.test(status.textContent)){
        status.textContent='今回選ぶ道';
        card.classList.add('owner-selected-path');
      }else{
        status.textContent='今回は選ばない道';
      }
    }
    if(smalls[1]){
      smalls[1].textContent=smalls[1].textContent
        .replace('おすすめの強さ：高め','この道を選ぶ強さ：強い')
        .replace('おすすめの強さ：やや高め','この道を選ぶ強さ：やや強い')
        .replace('おすすめの強さ：慎重','この道を選ぶ強さ：弱い');
    }
    card.dataset.ownerPathLabel='true';
  });
}

function addLuckyFortune(root){
  if(root.querySelector('.owner-lucky-section')) return;
  const tarotHeading=[...root.querySelectorAll('h2')].find((element)=>/タロットカード/.test(element.textContent));
  if(!tarotHeading) return;
  const seed=stringSeed(root.innerText);
  const directions=[['東','新しい情報を取りに行く方向'],['南東','人との縁を動かす方向'],['南','自信を取り戻す方向'],['南西','生活を安定させる方向'],['西','気持ちを切り替える方向'],['北西','決断を固める方向'],['北','考えを静かに整理する方向'],['北東','流れを変える方向']];
  const items=[['金色のペン','決めたことを一文で書く'],['小さな鍵','新しい扉を意識する'],['白いハンカチ','不要な不安を手放す'],['丸い鏡','自分の本音を確認する'],['温かい飲み物','焦りを落ち着かせる'],['星柄の小物','長い目で考える'],['革の手帳','今日の一歩を記録する'],['香りのあるもの','気持ちを切り替える']];
  const colors=[['深い金色','決断力'],['月白','冷静さ'],['深緑','安定'],['藍色','集中'],['琥珀色','行動力'],['薄紫','直感'],['黒','境界線'],['青緑','回復']];
  const times=[['7:00〜9:00','一日の方向を決める'],['10:00〜12:00','連絡や確認を進める'],['14:00〜16:00','具体的な一歩を動かす'],['18:00〜20:00','人との話を整える'],['21:00〜23:00','本音を書き出す']];
  const values=[directions[seed%directions.length],items[(seed>>>3)%items.length],colors[(seed>>>6)%colors.length],times[(seed>>>9)%times.length]];
  const labels=['今日の吉方','ラッキーアイテム','ラッキーカラー','動く時間'];
  const section=document.createElement('section');
  section.className='owner-lucky-section';
  section.innerHTML=`<h2 class="owner-lucky-title">今日の運を味方につけるもの</h2><div class="owner-lucky-grid">${values.map((value,index)=>`<article class="owner-lucky-item"><span>${labels[index]}</span><strong>${escapeHTML(value[0])}</strong><p>${escapeHTML(value[1])}${index===2?'を引き出します':''}</p></article>`).join('')}</div>`;
  tarotHeading.before(section);
}

function upgradeTarotCards(root){
  const cards=[...root.querySelectorAll('.tarot-card')];
  cards.forEach((card,index)=>{
    if(card.dataset.ownerTarot==='true') return;
    card.classList.add('owner-tarot-card');
    const art=card.querySelector('.tarot-art');
    const name=card.querySelector('h3')?.textContent?.trim()||`タロットカード${index+1}`;
    const glyph=art?.textContent?.trim()||'✦';
    if(art){
      art.className='owner-tarot-illustration';
      art.innerHTML=tarotIllustration(name,glyph,index);
    }
    const position=card.querySelector('.position');
    if(position&&!card.querySelector('.owner-tarot-keyword')){
      const keyword=document.createElement('span');
      keyword.className='owner-tarot-keyword';
      keyword.textContent=['現在','注意','行動'][index]||'導き';
      position.after(keyword);
    }
    card.dataset.ownerTarot='true';
  });
}

function stringSeed(value){
  let hash=2166136261;
  for(const char of String(value||'')){
    hash^=char.charCodeAt(0);
    hash=Math.imul(hash,16777619);
  }
  return hash>>>0;
}

function escapeHTML(value){
  return String(value??'').replace(/[&<>'"]/g,(char)=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}

function tarotIllustration(name,glyph,index){
  const seed=stringSeed(`${name}|${index}`);
  const uid=`owner-tarot-${index}-${seed.toString(36)}`;
  const motif=seed%6;
  const stars=Array.from({length:28},(_,i)=>{
    const x=35+((seed+i*83)%530);
    const y=48+(((seed>>>3)+i*127)%710);
    const r=i%5===0?2.4:i%3===0?1.7:1.1;
    const opacity=(0.28+(i%6)*0.1).toFixed(2);
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="#f5dfa0" opacity="${opacity}"/>`;
  }).join('');
  const rays=Array.from({length:16},(_,i)=>{
    const a=i*Math.PI/8;
    const x1=300+118*Math.cos(a),y1=230+118*Math.sin(a),x2=300+156*Math.cos(a),y2=230+156*Math.sin(a);
    return `<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="#d7b66c" stroke-width="4"/>`;
  }).join('');
  const motifs=[
    `<path d="M245 585 V328 L300 270 L355 328 V585" fill="url(#${uid}-metal)" stroke="#f1d992" stroke-width="4"/><path d="M270 585 V405 H330 V585" fill="#08070a" stroke="#cfa95a" stroke-width="3"/><circle cx="300" cy="205" r="92" fill="none" stroke="#f1d992" stroke-width="5"/><path d="M330 126 A92 92 0 1 0 330 284 A70 70 0 1 1 330 126" fill="url(#${uid}-moon)"/>`,
    `<circle cx="300" cy="230" r="92" fill="url(#${uid}-sun)" stroke="#f5dda0" stroke-width="5"/>${rays}<path d="M205 610 V390 Q300 300 395 390 V610" fill="url(#${uid}-metal)" stroke="#f1d992" stroke-width="5"/><path d="M255 610 V415 Q300 370 345 415 V610" fill="#09070b"/>`,
    `<path d="M300 170 V600" stroke="#f0d58c" stroke-width="8"/><path d="M185 280 H415" stroke="#f0d58c" stroke-width="7"/><path d="M215 285 L150 450 H280 Z M385 285 L320 450 H450 Z" fill="none" stroke="#d9b65e" stroke-width="5"/><circle cx="150" cy="450" r="72" fill="url(#${uid}-glass)" stroke="#f1d992" stroke-width="4"/><circle cx="450" cy="450" r="72" fill="url(#${uid}-glass)" stroke="#f1d992" stroke-width="4"/>`,
    `<path d="M300 600 C270 510 230 470 188 420 C250 438 270 400 300 330 C330 400 350 438 412 420 C370 470 330 510 300 600Z" fill="url(#${uid}-tree)" stroke="#e3c374" stroke-width="4"/><path d="M300 345 C250 310 225 260 245 210 C285 235 300 265 300 315 C300 265 315 235 355 210 C375 260 350 310 300 345Z" fill="url(#${uid}-leaf)" stroke="#f0d58c" stroke-width="4"/><path d="M300 600 C245 650 205 690 170 760 M300 600 C355 650 395 690 430 760 M300 600 V775" fill="none" stroke="#c79b45" stroke-width="6"/>`,
    `<circle cx="300" cy="330" r="118" fill="url(#${uid}-glass)" stroke="#f0d58c" stroke-width="5"/><path d="M300 212 V448 M182 330 H418 M218 248 L382 412 M382 248 L218 412" stroke="#c99d49" stroke-width="3"/><path d="M300 330 C345 270 395 285 405 335 C413 380 370 420 300 480 C230 420 187 380 195 335 C205 285 255 270 300 330Z" fill="none" stroke="#f3dda1" stroke-width="7"/><path d="M300 448 V650 M300 590 H395 M360 590 V645" stroke="#f0d58c" stroke-width="15" stroke-linecap="round"/>`,
    `<path d="M100 610 Q300 340 500 610" fill="url(#${uid}-mountain)" stroke="#e0bd68" stroke-width="5"/><path d="M170 610 Q300 450 430 610" fill="#09070b" stroke="#9e7938" stroke-width="4"/><path d="M300 140 C345 200 370 255 300 320 C230 255 255 200 300 140Z" fill="url(#${uid}-feather)" stroke="#f2d78f" stroke-width="4"/><path d="M300 175 V315 M300 225 L265 205 M300 250 L340 225 M300 275 L270 265" stroke="#6f5428" stroke-width="3"/>`
  ];
  return `<svg viewBox="0 0 600 900" role="img" aria-label="${escapeHTML(name)}の高精細タロットカードイラスト" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="${uid}-bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#120d1c"/><stop offset=".48" stop-color="#08070c"/><stop offset="1" stop-color="#241506"/></linearGradient><linearGradient id="${uid}-metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#503516"/><stop offset=".5" stop-color="#d8b05b"/><stop offset="1" stop-color="#211408"/></linearGradient><radialGradient id="${uid}-sun"><stop stop-color="#fff1b8"/><stop offset=".35" stop-color="#e0b45a"/><stop offset="1" stop-color="#7d4d16"/></radialGradient><radialGradient id="${uid}-moon"><stop stop-color="#fff3c7"/><stop offset=".65" stop-color="#ccb06e"/><stop offset="1" stop-color="#5f4a28"/></radialGradient><radialGradient id="${uid}-glass"><stop stop-color="#b69be0" stop-opacity=".3"/><stop offset=".6" stop-color="#6f4b87" stop-opacity=".15"/><stop offset="1" stop-color="#08070b"/></radialGradient><linearGradient id="${uid}-tree"><stop stop-color="#35220d"/><stop offset=".5" stop-color="#bd9141"/><stop offset="1" stop-color="#150d06"/></linearGradient><linearGradient id="${uid}-leaf"><stop stop-color="#5f6e3e"/><stop offset=".5" stop-color="#c5b66c"/><stop offset="1" stop-color="#26311f"/></linearGradient><linearGradient id="${uid}-mountain" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#59401d"/><stop offset="1" stop-color="#0a0706"/></linearGradient><linearGradient id="${uid}-feather"><stop stop-color="#fff0be"/><stop offset=".5" stop-color="#cda855"/><stop offset="1" stop-color="#5d3c18"/></linearGradient><filter id="${uid}-glow"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect width="600" height="900" fill="url(#${uid}-bg)"/><rect x="18" y="18" width="564" height="864" rx="24" fill="none" stroke="#d5aa55" stroke-width="4"/><rect x="35" y="35" width="530" height="830" rx="18" fill="none" stroke="#765525" stroke-width="2"/>${stars}<circle cx="300" cy="360" r="230" fill="none" stroke="#d7b66c" stroke-opacity=".18" stroke-width="2"/><circle cx="300" cy="360" r="190" fill="none" stroke="#d7b66c" stroke-opacity=".12" stroke-width="2" stroke-dasharray="8 14"/><g filter="url(#${uid}-glow)">${motifs[motif]}</g><path d="M0 690 Q90 610 165 668 T330 646 T600 675 V900 H0Z" fill="#100a06"/><path d="M0 720 Q120 650 240 712 T480 690 T600 710" fill="none" stroke="#d7b66c" stroke-opacity=".5" stroke-width="3"/><g transform="translate(300 780)"><circle r="58" fill="#0b0807" stroke="#e4c06c" stroke-width="4"/><circle r="44" fill="none" stroke="#6f5124" stroke-width="2"/><text text-anchor="middle" dominant-baseline="middle" fill="#f6e3aa" font-size="44" font-family="serif">${escapeHTML(glyph)}</text></g><path d="M85 95 H210 M390 95 H515" stroke="#c99d49" stroke-width="3"/><circle cx="300" cy="95" r="9" fill="#f1d992"/></svg>`;
}
