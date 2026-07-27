const VERSION='5.3.0';

export async function initOwnerTestV5(){
  if(!/\/owner-test\.html$/.test(location.pathname)) return;

  try{
    const module=await import(`./owner-test-v4.js?v=${VERSION}`);
    await module.initOwnerTestV4?.();
  }catch(error){
    console.error('owner_test_v4_load_failed',error);
  }

  installIllustrationController();
}

function installIllustrationController(){
  const root=document.querySelector('#result-root');
  if(!root||root.dataset.ownerTarotConceptController==='true') return;
  root.dataset.ownerTarotConceptController='true';

  let scheduled=false;
  const schedule=()=>{
    if(scheduled) return;
    scheduled=true;
    window.requestAnimationFrame(()=>{
      scheduled=false;
      applyConceptIllustrations(root);
    });
  };

  const observer=new MutationObserver(schedule);
  observer.observe(root,{childList:true,subtree:true});
  schedule();
}

export function applyConceptIllustrations(root=document){
  const cards=[...root.querySelectorAll('.tarot-card')];

  cards.forEach((card,index)=>{
    const art=card.querySelector('.owner-tarot-illustration,.tarot-art');
    const name=card.querySelector('h3')?.textContent?.trim();
    if(!art||!name) return;

    const currentSVG=art.querySelector('svg');
    const currentLabel=currentSVG?.getAttribute('aria-label')||'';
    if(art.dataset.ownerConceptName===name&&currentLabel.includes(`${name}を表した`)) return;

    card.classList.add('owner-tarot-card');
    card.dataset.ownerTarot='true';
    art.classList.remove('tarot-art');
    art.classList.add('owner-tarot-illustration');
    art.innerHTML=buildTarotSVG(name,index);
    art.dataset.ownerConceptName=name;

    const position=card.querySelector('.position');
    if(position&&!card.querySelector('.owner-tarot-keyword')){
      const keyword=document.createElement('span');
      keyword.className='owner-tarot-keyword';
      keyword.textContent=['現在','注意','行動'][index]||'導き';
      position.after(keyword);
    }

    const svg=art.querySelector('svg');
    if(svg){
      svg.dataset.ownerCardName='true';
      svg.setAttribute('aria-label',`${name}を表したタロットカードイラスト`);
    }
  });
}

export function buildTarotSVG(name,index=0){
  const uid=`orbita-concept-${index}-${hashText(name).toString(36)}`;
  const concept=CARD_CONCEPTS[name]||fallbackConcept(name);
  const stars=makeStars(hashText(`${name}|stars`));

  return `<svg viewBox="0 0 600 900" role="img" aria-label="${escapeHTML(name)}を表したタロットカードイラスト" data-owner-card-name="true" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="${uid}-bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#171024"/><stop offset=".5" stop-color="#08070c"/><stop offset="1" stop-color="#241506"/></linearGradient>
      <linearGradient id="${uid}-gold" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff0b1"/><stop offset=".48" stop-color="#d4a94f"/><stop offset="1" stop-color="#704716"/></linearGradient>
      <linearGradient id="${uid}-darkgold" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#8d6428"/><stop offset="1" stop-color="#1c1006"/></linearGradient>
      <radialGradient id="${uid}-light"><stop stop-color="#fff5c9" stop-opacity=".95"/><stop offset=".38" stop-color="#e4b85b" stop-opacity=".58"/><stop offset="1" stop-color="#e4b85b" stop-opacity="0"/></radialGradient>
      <linearGradient id="${uid}-glass" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#d8c5ff" stop-opacity=".35"/><stop offset=".55" stop-color="#755996" stop-opacity=".16"/><stop offset="1" stop-color="#08070b" stop-opacity=".88"/></linearGradient>
      <filter id="${uid}-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>
    <rect width="600" height="900" fill="url(#${uid}-bg)"/><circle cx="300" cy="390" r="250" fill="url(#${uid}-light)" opacity=".22"/>${stars}
    <rect x="18" y="18" width="564" height="864" rx="26" fill="none" stroke="#d8ad57" stroke-width="4"/><rect x="35" y="35" width="530" height="830" rx="19" fill="none" stroke="#765525" stroke-width="2"/>
    <path d="M84 118 H218 M382 118 H516" stroke="#c99d49" stroke-width="3"/><circle cx="300" cy="118" r="8" fill="#f4d98f"/>
    <g class="card-nameplate"><rect x="82" y="54" width="436" height="52" rx="18" fill="#09070b" fill-opacity=".94" stroke="#d7b66c" stroke-width="2"/><text x="300" y="88" text-anchor="middle" fill="#f6e3aa" font-family="Yu Mincho, Hiragino Mincho ProN, serif" font-size="${name.length>=8?24:29}" letter-spacing="2">${escapeHTML(name)}</text></g>
    <circle cx="300" cy="385" r="230" fill="none" stroke="#d7b66c" stroke-opacity=".16" stroke-width="2"/><circle cx="300" cy="385" r="190" fill="none" stroke="#d7b66c" stroke-opacity=".12" stroke-width="2" stroke-dasharray="8 14"/>
    <g filter="url(#${uid}-glow)">${concept.svg(uid)}</g>
    <path d="M0 704 Q92 620 168 680 T332 656 T600 690 V900 H0Z" fill="#100a06"/><path d="M0 734 Q122 662 244 724 T482 702 T600 722" fill="none" stroke="#d7b66c" stroke-opacity=".55" stroke-width="3"/>
    <g transform="translate(300 792)"><circle r="59" fill="#0b0807" stroke="#e4c06c" stroke-width="4"/><circle r="44" fill="none" stroke="#6f5124" stroke-width="2"/><text text-anchor="middle" dominant-baseline="middle" fill="#f6e3aa" font-size="42" font-family="serif">${escapeHTML(concept.glyph)}</text></g>
  </svg>`;
}

const CARD_CONCEPTS={
  '静かな塔':{glyph:'塔',svg:(u)=>`<path d="M230 650 V340 L300 255 L370 340 V650" fill="url(#${u}-darkgold)" stroke="#f1d992" stroke-width="5"/><path d="M260 650 V458 H340 V650" fill="#09070b" stroke="#cfa95a" stroke-width="4"/><path d="M248 340 H352 M265 305 H335" stroke="#f1d992" stroke-width="5"/><circle cx="390" cy="220" r="72" fill="none" stroke="#f1d992" stroke-width="5"/><path d="M412 157 A72 72 0 1 0 412 283 A55 55 0 1 1 412 157" fill="url(#${u}-gold)"/>`},
  '開いた扉':{glyph:'扉',svg:(u)=>`<path d="M195 665 V318 Q300 220 405 318 V665" fill="url(#${u}-darkgold)" stroke="#f1d992" stroke-width="6"/><path d="M245 665 V350 Q300 300 355 350 V665" fill="#08070b" stroke="#d9b55d" stroke-width="5"/><path d="M300 350 L355 380 V650 L300 625 Z" fill="url(#${u}-gold)" opacity=".88"/><ellipse cx="332" cy="488" rx="11" ry="11" fill="#fff0b1"/><path d="M300 350 V625" stroke="#fff0b1" stroke-width="4"/><path d="M262 412 L150 520 M338 412 L450 520" stroke="#e4bd67" stroke-opacity=".55" stroke-width="4"/>`},
  '金の糸':{glyph:'糸',svg:(u)=>`<circle cx="220" cy="430" r="92" fill="url(#${u}-glass)" stroke="#f1d992" stroke-width="5"/><circle cx="220" cy="430" r="34" fill="#0b0807" stroke="#cfa95a" stroke-width="4"/><path d="M220 338 C252 378 260 452 220 522 M172 360 C236 400 246 470 180 500 M268 360 C206 406 204 468 266 500" fill="none" stroke="#f4d88b" stroke-width="5"/><path d="M312 430 C376 372 448 366 472 422 C494 474 438 516 390 472 C346 430 374 374 430 392" fill="none" stroke="#ffd978" stroke-width="8" stroke-linecap="round"/><path d="M310 430 C356 468 404 524 454 590" fill="none" stroke="#d39d32" stroke-width="5" stroke-linecap="round"/><circle cx="472" cy="422" r="10" fill="#fff0b1"/>`},
  '月の井戸':{glyph:'月',svg:(u)=>`<ellipse cx="300" cy="560" rx="145" ry="74" fill="url(#${u}-glass)" stroke="#e7c872" stroke-width="5"/><path d="M170 555 Q300 455 430 555" fill="none" stroke="#b98b3a" stroke-width="12"/><path d="M190 560 V655 M410 560 V655" stroke="#d8b45d" stroke-width="12"/><path d="M300 180 C360 230 370 300 305 340 C245 375 200 330 205 278 C212 220 254 188 300 180Z" fill="url(#${u}-gold)"/><path d="M328 190 C286 212 268 258 282 299 C294 335 330 350 360 338 C326 370 270 372 235 330 C197 283 215 214 272 183Z" fill="#09070b"/><path d="M300 340 V500" stroke="#e5c56f" stroke-opacity=".7" stroke-width="4" stroke-dasharray="10 12"/>`},
  '最初の火花':{glyph:'火',svg:(u)=>`<path d="M300 190 C352 260 380 318 324 372 C392 350 446 400 426 470 C404 548 330 590 300 654 C270 590 196 548 174 470 C154 400 208 350 276 372 C220 318 248 260 300 190Z" fill="url(#${u}-gold)" stroke="#fff0b1" stroke-width="5"/><path d="M300 332 C336 386 340 430 300 470 C260 430 264 386 300 332Z" fill="#fff5cc"/><path d="M170 230 L204 264 M430 230 L396 264 M144 364 H194 M456 364 H406" stroke="#f1d992" stroke-width="7" stroke-linecap="round"/>`},
  '還る潮':{glyph:'潮',svg:(u)=>`<path d="M105 500 C180 410 255 410 330 500 C405 590 480 590 540 500" fill="none" stroke="#f1d992" stroke-width="10"/><path d="M75 565 C150 475 225 475 300 565 C375 655 450 655 525 565" fill="none" stroke="#b98c3b" stroke-width="7"/><path d="M410 230 A150 150 0 1 0 448 420" fill="none" stroke="#e7c872" stroke-width="8"/><path d="M448 420 L395 396 L434 356" fill="none" stroke="#e7c872" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="300" cy="310" r="46" fill="url(#${u}-glass)" stroke="#d9b65e" stroke-width="4"/>`},
  '硝子の橋':{glyph:'橋',svg:(u)=>`<path d="M120 590 Q300 300 480 590" fill="none" stroke="#f1d992" stroke-width="10"/><path d="M150 590 Q300 355 450 590" fill="none" stroke="#9c7cc1" stroke-width="22" stroke-opacity=".28"/><path d="M145 590 H455" stroke="#d7b66c" stroke-width="8"/><path d="M165 590 L205 515 M210 590 L235 505 M255 590 L265 495 M300 590 L300 485 M345 590 L335 495 M390 590 L365 505 M435 590 L395 515" stroke="#f4dfa2" stroke-width="3"/><circle cx="300" cy="245" r="72" fill="url(#${u}-glass)" stroke="#e5c36c" stroke-width="4"/>`},
  '封じた手紙':{glyph:'封',svg:(u)=>`<rect x="145" y="285" width="310" height="250" rx="18" fill="url(#${u}-darkgold)" stroke="#f1d992" stroke-width="5"/><path d="M145 315 L300 445 L455 315" fill="#0c0908" stroke="#d7b66c" stroke-width="5"/><path d="M145 535 L270 420 M455 535 L330 420" stroke="#9b7130" stroke-width="4"/><circle cx="300" cy="470" r="48" fill="#8e2f28" stroke="#f1c66c" stroke-width="5"/><path d="M278 470 H322 M300 448 V492" stroke="#f8d98b" stroke-width="5"/><path d="M230 590 H370" stroke="#d7b66c" stroke-width="7" stroke-linecap="round"/>`},
  '北の窓':{glyph:'北',svg:(u)=>`<rect x="165" y="250" width="270" height="330" rx="18" fill="url(#${u}-glass)" stroke="#f1d992" stroke-width="7"/><path d="M300 250 V580 M165 415 H435" stroke="#d7b66c" stroke-width="6"/><path d="M300 195 L316 235 L358 240 L326 267 L336 309 L300 286 L264 309 L274 267 L242 240 L284 235Z" fill="url(#${u}-gold)" stroke="#fff0b1" stroke-width="3"/><text x="300" y="375" text-anchor="middle" fill="#f6e3aa" font-size="42" font-family="serif">N</text><path d="M185 600 H415" stroke="#7c5a29" stroke-width="8"/>`},
  '小さな鍵':{glyph:'鍵',svg:(u)=>`<circle cx="270" cy="330" r="112" fill="url(#${u}-glass)" stroke="#f1d992" stroke-width="7"/><circle cx="270" cy="330" r="48" fill="#09070b" stroke="#d7b66c" stroke-width="5"/><path d="M270 442 V645 M270 565 H365 M332 565 V620" stroke="#f4d98e" stroke-width="18" stroke-linecap="round" stroke-linejoin="round"/><path d="M215 272 C250 238 292 230 332 252" fill="none" stroke="#fff0b1" stroke-width="5"/>`},
  '灯る前のランタン':{glyph:'灯',svg:(u)=>`<path d="M230 290 H370 L395 600 H205 Z" fill="url(#${u}-glass)" stroke="#f1d992" stroke-width="6"/><path d="M250 290 Q300 210 350 290" fill="none" stroke="#d7b66c" stroke-width="8"/><path d="M245 350 H355 M230 520 H370" stroke="#8c6328" stroke-width="6"/><path d="M300 390 C340 430 340 480 300 520 C260 480 260 430 300 390Z" fill="#2b1d10" stroke="#c89b42" stroke-width="4"/><circle cx="300" cy="455" r="88" fill="url(#${u}-light)" opacity=".18"/><path d="M260 650 H340" stroke="#f1d992" stroke-width="8" stroke-linecap="round"/>`},
  '二つの岸':{glyph:'岸',svg:(u)=>`<path d="M70 570 Q160 430 250 510 V690 H70Z" fill="url(#${u}-darkgold)" stroke="#d7b66c" stroke-width="5"/><path d="M530 570 Q440 430 350 510 V690 H530Z" fill="url(#${u}-darkgold)" stroke="#d7b66c" stroke-width="5"/><path d="M250 510 C275 540 325 540 350 510" fill="none" stroke="#f1d992" stroke-width="5" stroke-dasharray="10 12"/><path d="M275 260 L300 220 L325 260 L300 300Z" fill="url(#${u}-gold)"/><path d="M300 300 V455" stroke="#e6c66f" stroke-width="4" stroke-dasharray="9 11"/>`},
  '隠れた階段':{glyph:'階',svg:(u)=>`<path d="M135 640 H225 V565 H305 V490 H385 V415 H465" fill="none" stroke="#f1d992" stroke-width="12" stroke-linejoin="round"/><path d="M135 640 H225 V565 H305 V490 H385 V415 H465 V680 H135Z" fill="url(#${u}-darkgold)" opacity=".58"/><path d="M405 335 Q465 275 525 335 V500" fill="none" stroke="#d7b66c" stroke-width="6"/><path d="M470 225 L486 263 L526 268 L496 294 L505 334 L470 312 L435 334 L444 294 L414 268 L454 263Z" fill="url(#${u}-gold)"/>`},
  '金の天秤':{glyph:'衡',svg:(u)=>`<path d="M300 220 V650" stroke="#f1d992" stroke-width="10"/><path d="M175 330 H425" stroke="#f1d992" stroke-width="8"/><path d="M210 335 L145 490 H275 Z M390 335 L325 490 H455 Z" fill="none" stroke="#d9b65e" stroke-width="6"/><circle cx="145" cy="490" r="72" fill="url(#${u}-glass)" stroke="#f1d992" stroke-width="5"/><circle cx="455" cy="490" r="72" fill="url(#${u}-glass)" stroke="#f1d992" stroke-width="5"/><path d="M235 650 H365" stroke="#d7b66c" stroke-width="12" stroke-linecap="round"/>`},
  '雨あがり':{glyph:'晴',svg:(u)=>`<path d="M145 430 C150 365 215 330 270 360 C302 300 390 305 425 365 C485 365 510 430 475 470 H155 C120 460 118 430 145 430Z" fill="url(#${u}-glass)" stroke="#d8c27a" stroke-width="5"/><path d="M165 545 Q300 405 435 545" fill="none" stroke="#f1d992" stroke-width="10"/><path d="M180 570 Q300 445 420 570" fill="none" stroke="#b99345" stroke-width="7"/><path d="M205 505 L185 545 M300 485 L285 530 M395 505 L415 545" stroke="#c7b5e3" stroke-width="6" stroke-linecap="round"/><circle cx="455" cy="250" r="64" fill="url(#${u}-gold)"/>`},
  '鏡の部屋':{glyph:'鏡',svg:(u)=>`<ellipse cx="300" cy="390" rx="145" ry="205" fill="url(#${u}-glass)" stroke="#f1d992" stroke-width="7"/><ellipse cx="300" cy="390" rx="112" ry="170" fill="#09070b" stroke="#8c682e" stroke-width="4"/><path d="M245 335 Q300 280 355 335 Q330 425 300 490 Q270 425 245 335Z" fill="none" stroke="#f3dda1" stroke-width="6"/><path d="M300 205 V575 M190 390 H410" stroke="#d7b66c" stroke-opacity=".35" stroke-width="3"/><path d="M240 620 H360" stroke="#f1d992" stroke-width="10" stroke-linecap="round"/>`},
  '石の種':{glyph:'種',svg:(u)=>`<path d="M175 560 Q300 410 425 560 Q390 690 300 690 Q210 690 175 560Z" fill="url(#${u}-darkgold)" stroke="#d7b66c" stroke-width="5"/><ellipse cx="300" cy="430" rx="62" ry="86" fill="#2b2118" stroke="#f1d992" stroke-width="5"/><path d="M300 516 V650 M300 570 C250 585 225 615 205 650 M300 570 C350 585 375 615 395 650" fill="none" stroke="#c99d49" stroke-width="6"/><path d="M300 425 C260 380 245 330 270 285 C300 305 315 335 300 380 C315 335 330 305 360 285 C385 330 370 380 300 425Z" fill="url(#${u}-gold)" stroke="#fff0b1" stroke-width="4"/>`},
  '横風':{glyph:'風',svg:(u)=>`<path d="M90 300 C180 245 260 255 335 305 C395 345 450 330 510 280" fill="none" stroke="#f1d992" stroke-width="8" stroke-linecap="round"/><path d="M120 390 C205 340 290 350 355 395 C410 433 455 425 500 390" fill="none" stroke="#b98c3b" stroke-width="7" stroke-linecap="round"/><path d="M145 485 C225 450 305 460 360 500" fill="none" stroke="#e3c476" stroke-width="6" stroke-linecap="round"/><path d="M285 650 C285 570 300 500 335 430" fill="none" stroke="#d7b66c" stroke-width="8"/><path d="M335 430 C390 450 415 495 405 545 C360 520 335 485 335 430Z" fill="url(#${u}-gold)" stroke="#f1d992" stroke-width="4"/>`},
  '空いた椅子':{glyph:'椅',svg:(u)=>`<path d="M205 300 Q300 210 395 300 V480 H205Z" fill="url(#${u}-glass)" stroke="#f1d992" stroke-width="7"/><path d="M230 330 Q300 270 370 330 V455 H230Z" fill="#0b0807" stroke="#9d7430" stroke-width="4"/><path d="M185 480 H415 V590 H185Z" fill="url(#${u}-darkgold)" stroke="#f1d992" stroke-width="7"/><path d="M205 590 L185 690 M395 590 L415 690" stroke="#d7b66c" stroke-width="12" stroke-linecap="round"/><path d="M170 485 Q130 500 145 555 M430 485 Q470 500 455 555" fill="none" stroke="#d7b66c" stroke-width="10"/><circle cx="300" cy="385" r="44" fill="none" stroke="#e3c06e" stroke-width="4"/>`},
  '夜明けの線':{glyph:'明',svg:(u)=>`<path d="M90 560 H510" stroke="#f1d992" stroke-width="8"/><path d="M170 560 A130 130 0 0 1 430 560" fill="url(#${u}-gold)" stroke="#fff0b1" stroke-width="5"/><path d="M155 514 L105 480 M180 450 L135 405 M230 405 L205 350 M300 390 V320 M370 405 L395 350 M420 450 L465 405 M445 514 L495 480" stroke="#d7b66c" stroke-width="5"/><path d="M120 625 Q220 590 300 625 T480 625" fill="none" stroke="#8b672f" stroke-width="5"/>`},
  '根の地図':{glyph:'根',svg:(u)=>`<path d="M300 220 V430" stroke="#f1d992" stroke-width="10"/><path d="M300 300 C245 270 210 220 220 170 C265 185 292 220 300 270 C308 220 335 185 380 170 C390 220 355 270 300 300Z" fill="url(#${u}-gold)" stroke="#fff0b1" stroke-width="4"/><path d="M300 430 C250 485 215 530 180 620 M300 430 C350 485 385 530 420 620 M300 430 V660 M260 480 L205 450 M340 480 L395 450 M235 535 L165 530 M365 535 L435 530" fill="none" stroke="#d7b66c" stroke-width="7" stroke-linecap="round"/><circle cx="180" cy="620" r="12" fill="#f1d992"/><circle cx="420" cy="620" r="12" fill="#f1d992"/><circle cx="300" cy="660" r="12" fill="#f1d992"/>`},
  '白い羽':{glyph:'羽',svg:(u)=>`<path d="M300 185 C380 250 405 345 350 445 C300 535 225 590 165 650 C210 555 235 490 235 420 C235 325 260 245 300 185Z" fill="url(#${u}-gold)" stroke="#fff0b1" stroke-width="5"/><path d="M300 205 C292 325 255 440 180 625" fill="none" stroke="#6f4b1c" stroke-width="6"/><path d="M275 300 L225 270 M270 360 L205 335 M250 425 L185 410 M235 490 L170 485 M320 270 L360 245 M315 335 L370 305 M300 405 L360 370" stroke="#8d6329" stroke-width="4"/><circle cx="405" cy="245" r="58" fill="url(#${u}-light)" opacity=".45"/>`},
  '鳴らない鐘':{glyph:'鐘',svg:(u)=>`<path d="M205 505 Q205 315 300 260 Q395 315 395 505 L445 575 H155Z" fill="url(#${u}-darkgold)" stroke="#f1d992" stroke-width="7"/><path d="M250 575 Q300 635 350 575" fill="none" stroke="#d7b66c" stroke-width="9"/><circle cx="300" cy="590" r="24" fill="url(#${u}-gold)"/><path d="M175 250 L425 600 M425 250 L175 600" stroke="#c0574e" stroke-width="12" stroke-linecap="round" opacity=".85"/><path d="M250 230 Q300 185 350 230" fill="none" stroke="#d7b66c" stroke-width="7"/>`},
  '軌道変更':{glyph:'軌',svg:(u)=>`<circle cx="300" cy="390" r="72" fill="url(#${u}-gold)"/><ellipse cx="300" cy="390" rx="205" ry="92" fill="none" stroke="#f1d992" stroke-width="6" transform="rotate(-18 300 390)"/><ellipse cx="300" cy="390" rx="160" ry="225" fill="none" stroke="#9b7ec2" stroke-opacity=".55" stroke-width="5" transform="rotate(28 300 390)"/><path d="M135 460 C190 355 270 300 350 285 C430 270 485 225 510 165" fill="none" stroke="#ffd978" stroke-width="9" stroke-linecap="round"/><path d="M510 165 L476 181 L493 211" fill="none" stroke="#ffd978" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><circle cx="160" cy="470" r="17" fill="#fff1b7"/><circle cx="440" cy="295" r="14" fill="#d8c5ff"/>`}
};

export const OWNER_TAROT_CARD_NAMES=Object.freeze(Object.keys(CARD_CONCEPTS));

function fallbackConcept(){return {glyph:'✦',svg:(u)=>`<circle cx="300" cy="390" r="145" fill="url(#${u}-glass)" stroke="#f1d992" stroke-width="6"/><path d="M300 210 L326 345 L460 390 L326 435 L300 570 L274 435 L140 390 L274 345Z" fill="url(#${u}-gold)"/>`};}
function makeStars(seed){return Array.from({length:32},(_,i)=>{const x=42+((seed+i*89)%516),y=128+(((seed>>>3)+i*131)%540),r=i%6===0?2.5:i%3===0?1.7:1.1,opacity=(0.24+(i%6)*0.1).toFixed(2);return `<circle cx="${x}" cy="${y}" r="${r}" fill="#f5dfa0" opacity="${opacity}"/>`;}).join('');}
function hashText(value){let hash=2166136261;for(const char of String(value||'')){hash^=char.charCodeAt(0);hash=Math.imul(hash,16777619);}return hash>>>0;}
function escapeHTML(value){return String(value??'').replace(/[&<>'"]/g,(char)=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));}
