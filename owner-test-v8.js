const VERSION='8.4.0';

/**
 * Owner test entry point.
 *
 * v3-v7 each own one feature area (copy/result decoration, waiting screen,
 * final tarot art, personality assessment, and initial identity). Those
 * controllers are idempotent and observe their own DOM area. Keep this entry
 * point free of repair mutations: synthetic result mutations previously kept
 * resetting the tarot/personality render timers and prevented both features
 * from ever completing.
 */
export async function initOwnerTestV8(){
  if(!/\/owner-test\.html$/.test(location.pathname)) return;
  if(document.body.dataset.ownerTestV8===VERSION) return;
  document.body.dataset.ownerTestV8=VERSION;

  try{
    const module=await import(`./owner-test-v7.js?v=${VERSION}`);
    await module.initOwnerTestV7?.();
  }catch(error){
    document.body.removeAttribute('data-owner-test-v8');
    console.error('owner_test_v7_load_failed',error);
  }
}
