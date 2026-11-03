(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const pads = [...document.querySelectorAll('.pad')];
  const paces = [...document.querySelectorAll('input[name="pace"]')];
  const speeds = { cozy: { on: 700, gap: 300, tag: 'TAKE IT EASY' }, classic: { on: 480, gap: 220, tag: 'FIND YOUR RHYTHM' }, speedy: { on: 300, gap: 160, tag: 'FEEL THE SPARK' } };
  const colors = ['Purple star', 'Green circle', 'Orange triangle', 'Blue diamond'];
  const notes = [261.63, 329.63, 392, 523.25];
  let mode = 'cozy', sequence = [], position = 0, completed = 0, state = 'idle', run = 0;
  let audio, muted = false, resumeNextRound = false;
  const flashTimers = new Map();
  function read(key, fallback) { try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; } }
  function save(key, value) { try { localStorage.setItem(key, value); } catch { /* Play also works without storage. */ } }
  muted = read('color-echo-muted', 'false') === 'true';
  function best() { return Math.max(0, Number(read(`color-echo-best-${mode}`, '0')) || 0); }
  function renderBest() { $('best').textContent = String(best()).padStart(2, '0'); }
  function soundUI() { $('sound').setAttribute('aria-pressed', String(muted)); $('sound').setAttribute('aria-label', muted ? 'Turn sounds on' : 'Mute sounds'); }
  function unlockAudio() {
    try { const Context = window.AudioContext || window.webkitAudioContext; if (!audio && Context) audio = new Context(); if (audio?.state === 'suspended') audio.resume().catch(() => {}); } catch { /* Visual play does not require audio. */ }
  }
  function tone(frequency, duration = .22, type = 'sine') {
    if (muted || !audio || audio.state !== 'running') return;
    try {
      const oscillator = audio.createOscillator(), gain = audio.createGain(), now = audio.currentTime;
      oscillator.type = type; oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(.12, now + .015); gain.gain.exponentialRampToValueAtTime(.001, now + duration);
      oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(now); oscillator.stop(now + duration + .02);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    } catch { /* Keep the game usable if an audio device is unavailable. */ }
  }
  function clearLights() { for (const timer of flashTimers.values()) clearTimeout(timer); flashTimers.clear(); pads.forEach(p => p.classList.remove('lit')); }
  function flash(color, duration) {
    const pad = pads[color]; clearTimeout(flashTimers.get(color)); pad.classList.add('lit'); tone(notes[color], duration / 1000);
    flashTimers.set(color, setTimeout(() => { pad.classList.remove('lit'); flashTimers.delete(color); }, duration));
  }
  function status(title, detail, dot = '#9eab8d') { $('status-title').textContent = title; $('status-detail').textContent = detail; $('status-dot').style.background = dot; }
  function setState(next) {
    state = next; $('board').dataset.state = state;
    pads.forEach(p => p.setAttribute('aria-disabled', String(state !== 'input')));
    $('replay').disabled = state !== 'input';
    const active = ['watch', 'input', 'success', 'paused'].includes(state);
    paces.forEach(p => p.disabled = active);
    $('start-label').textContent = state === 'idle' ? 'Let’s play' : state === 'over' ? 'Play again' : state === 'paused' ? 'Continue' : 'Start over';
  }
  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  async function showPattern() {
    const token = ++run; clearLights(); position = 0; setState('watch');
    status('Look & listen…', `${sequence.length} ${sequence.length === 1 ? 'color' : 'colors'} to remember.`, '#a27acb');
    await wait(650);
    const speed = speeds[mode];
    // Gradually increase the pace, keeping an easy-to-follow lower bound.
    const duration = Math.max(mode === 'cozy' ? 420 : 190, speed.on - (sequence.length - 1) * 10);
    for (const color of sequence) {
      if (token !== run) return;
      flash(color, duration); await wait(duration + speed.gap);
    }
    if (token !== run) return;
    setState('input'); status('Your turn to echo!', `Tap ${sequence.length} ${sequence.length === 1 ? 'color' : 'colors'} in order. Take your time.`, '#6caa83');
  }
  function addRound() { sequence.push(Math.floor(Math.random() * 4)); $('round').textContent = String(sequence.length).padStart(2, '0'); showPattern(); }
  function start() {
    unlockAudio();
    if (state === 'paused') {
      if (resumeNextRound) { resumeNextRound = false; addRound(); } else showPattern();
      return;
    }
    ++run; clearLights(); resumeNextRound = false; sequence = []; position = 0; completed = 0; addRound();
  }
  async function choose(color) {
    if (state !== 'input') return;
    unlockAudio(); flash(color, 220);
    if (color !== sequence[position]) {
      const expected = colors[sequence[position]];
      ++run; setState('over');
      status(completed ? 'Good growing, little brain!' : 'Every try is a fresh start!', `You finished ${completed} ${completed === 1 ? 'round' : 'rounds'}. Next was ${expected.toLowerCase()}.`, '#d69865');
      tone(164.81, .3); return;
    }
    position++;
    if (position < sequence.length) { status('You’ve got the rhythm!', `${position} of ${sequence.length} colors echoed.`, '#6caa83'); return; }
    completed++;
    if (completed > best()) { save(`color-echo-best-${mode}`, String(completed)); $('best').textContent = String(completed).padStart(2, '0'); }
    setState('success'); status('That’s the one. Nice work!', 'Let’s add one more color.', '#6caa83');
    const token = run; await wait(1000); if (token === run) addRound();
  }
  pads.forEach((pad, color) => pad.addEventListener('click', () => choose(color)));
  document.addEventListener('keydown', event => {
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || /INPUT|SELECT|TEXTAREA/.test(event.target.tagName)) return;
    if (/^[1-4]$/.test(event.key)) { event.preventDefault(); choose(Number(event.key) - 1); }
  });
  $('start').addEventListener('click', start);
  $('replay').addEventListener('click', () => { if (state === 'input') { unlockAudio(); showPattern(); } });
  $('sound').addEventListener('click', () => { muted = !muted; save('color-echo-muted', String(muted)); soundUI(); unlockAudio(); });
  paces.forEach(input => input.addEventListener('change', () => {
    if (!input.checked || !['idle', 'over'].includes(state)) return;
    mode = input.value; ++run; clearLights(); sequence = []; completed = 0; position = 0;
    $('mode-tag').textContent = speeds[mode].tag; $('round').textContent = '01'; renderBest(); setState('idle');
    status('Ready when you are', 'A colorful little challenge awaits.');
  }));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && ['watch', 'input', 'success'].includes(state)) {
      resumeNextRound = state === 'success';
      ++run; clearLights(); setState('paused'); status('A little breather', resumeNextRound ? 'Tap Continue for the next pattern.' : 'Tap Continue to watch this pattern again.');
    }
  });
  renderBest(); soundUI(); setState('idle');
})();
