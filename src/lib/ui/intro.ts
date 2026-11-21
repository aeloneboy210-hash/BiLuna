/** Runs in the page's HTML before first paint: hides the intro when the device asks to reduce motion. */
export const INTRO_GATE_SCRIPT = `try{if(matchMedia('(prefers-reduced-motion: reduce)').matches){var e=document.getElementById('biluna-intro');if(e)e.style.display='none'}}catch(e){}`
