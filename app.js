// ===== UTF‑8 Safe Base64 helpers =====
const enc = new TextEncoder();
const dec = new TextDecoder();

function toBase64(str){
  const bytes = enc.encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function fromBase64(b64){
  const clean = b64.trim();
  if (!/^[A-Za-z0-9+/=\s]*$/.test(clean)) {
    throw new Error("Invalid Base64 characters detected.");
  }
  const pad = clean.length % 4;
  const padded = pad ? clean + "=".repeat(4 - pad) : clean;

  let binary;
  try { binary = atob(padded); }
  catch (e){ throw new Error("Malformed Base64 input."); }

  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  try { return dec.decode(bytes); }
  catch (e){ throw new Error("Decoded bytes are not valid UTF‑8."); }
}

// ===== UI wiring =====
const raw = document.getElementById('raw');
const b64 = document.getElementById('b64');
const encodeBtn = document.getElementById('encodeBtn');
const decodeBtn = document.getElementById('decodeBtn');
const copyRaw = document.getElementById('copyRaw');
const copyB64 = document.getElementById('copyB64');
const clearBtn = document.getElementById('clearBtn');
const swapBtn = document.getElementById('swapBtn');
const modeLabel = document.getElementById('modeLabel');

function flash(el){
  const old = el.style.outline;
  el.style.outline = '2px solid var(--ring)';
  setTimeout(()=>{ el.style.outline = old; }, 200);
}

encodeBtn.addEventListener('click', () => {
  b64.value = toBase64(raw.value);
  flash(b64);
  modeLabel.textContent = 'Mode: Encode';
});

decodeBtn.addEventListener('click', () => {
  try{
    raw.value = fromBase64(b64.value);
    flash(raw);
    modeLabel.textContent = 'Mode: Decode';
  }catch(err){
    alert(err.message);
  }
});

copyRaw.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(raw.value); flash(raw); }
  catch { alert('Clipboard blocked by browser.'); }
});

copyB64.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText(b64.value); flash(b64); }
  catch { alert('Clipboard blocked by browser.'); }
});

clearBtn.addEventListener('click', () => {
  raw.value = ''; b64.value = '';
  modeLabel.textContent = 'Mode: Auto';
});

swapBtn.addEventListener('click', () => {
  const tmp = raw.value;
  raw.value = b64.value;
  b64.value = tmp;
  flash(raw); flash(b64);
});

// Keyboard shortcut: Ctrl/Cmd+Enter → encode/decode based on focus
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    if (document.activeElement === raw) encodeBtn.click();
    else if (document.activeElement === b64) decodeBtn.click();
  }
});

// ===== GitHub card for @johannes61 =====
const ghAvatar = document.getElementById('ghAvatar');
const ghFollowers = document.getElementById('ghFollowers');
const ghRepos = document.getElementById('ghRepos');
const ghLink = document.getElementById('ghLink');
const ghBio = document.getElementById('ghBio');

function animateCount(el, target){
  const start = 0;
  const duration = 900;
  const startTime = performance.now();
  function tick(now){
    const p = Math.min(1, (now - startTime) / duration);
    const val = Math.floor(start + (target - start) * (p * (2 - p))); // easeOutQuad
    el.textContent = el.dataset.label + ': ' + val.toLocaleString();
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

async function loadGitHub(){
  try{
    const r = await fetch('https://api.github.com/users/johannes61', {
      headers: { 'Accept': 'application/vnd.github+json' }
    });
    if (!r.ok) throw new Error('GitHub rate limit or user not found.');
    const data = await r.json();
    ghAvatar.src = data.avatar_url;
    ghAvatar.alt = 'GitHub avatar of @' + (data.login || 'johannes61');
    ghLink.href = data.html_url || ghLink.href;
    ghBio.textContent = data.bio || '';

    // Animate counts
    ghFollowers.dataset.label = 'Followers';
    ghRepos.dataset.label = 'Repos';
    animateCount(ghFollowers, Number(data.followers || 0));
    animateCount(ghRepos, Number(data.public_repos || 0));
  }catch(e){
    ghAvatar.src = 'data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"72\" height=\"72\"><rect width=\"100%\" height=\"100%\" fill=\"%23222\"/><text x=\"50%\" y=\"54%\" font-size=\"12\" text-anchor=\"middle\" fill=\"white\">GH</text></svg>';
    ghFollowers.textContent = 'Followers: unavailable';
    ghRepos.textContent = 'Repos: unavailable';
    console.warn(e);
  }
}
loadGitHub();
