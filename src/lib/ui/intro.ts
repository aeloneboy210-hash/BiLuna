export const INTRO_KEY = 'biluna-intro-seen'

/** Runs in the page's HTML before first paint: hides the intro if it was already seen or motion is reduced. */
export const INTRO_GATE_SCRIPT = `try{if(sessionStorage.getItem('${INTRO_KEY}')==='1'||matchMedia('(prefers-reduced-motion: reduce)').matches){var e=document.getElementById('biluna-intro');if(e)e.style.display='none'}}catch(e){}`
