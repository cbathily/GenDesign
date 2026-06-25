/* ============================================================
   HORROR ATMOSPHERE MIXER — Local Audio Files Only
   - Layered audio playback (up to 3 simultaneous)
   - Real audio files from sounds/ directory
   - Volume control per layer
   - Random atmosphere generation
============================================================ */

const AUDIO_CONFIG = {
  sounds: {
    ambience: [
      { file: 'sounds/ambience/wind.wav', name: 'Wind' },
      { file: 'sounds/ambience/rain.mp3', name: 'Rain' },
      { file: 'sounds/ambience/forest.m4a', name: 'Forest' },
      { file: 'sounds/ambience/abandoned_place.wav', name: 'Abandoned Place' },
      { file: 'sounds/ambience/dream_core1.mp3', name: 'Dream Core 1' },
      { file: 'sounds/ambience/dream_core2.ogg', name: 'Dream Core 2' },
      { file: 'sounds/ambience/backrooms_light.mp3', name: 'Backrooms Light' },
    ],
    tension: [
      { file: 'sounds/tension/heartbeat.wav', name: 'Heartbeat' },
      { file: 'sounds/tension/deep_bass.wav', name: 'Deep Bass' },
      { file: 'sounds/tension/drone_and_cackling.wav', name: 'Drone & Cackling' },
      { file: 'sounds/tension/metal_screech.wav', name: 'Metal Screech' },
      { file: 'sounds/tension/rumble.wav', name: 'Rumble' },
      { file: 'sounds/tension/orchestral.wav', name: 'Orchestral' },
      { file: 'sounds/tension/haunting_piano.wav', name: 'Haunting Piano' },
      { file: 'sounds/tension/ticking_clock.wav', name: 'Ticking Clock' },
    ],
    events: [
      { file: 'sounds/events/footsteps.wav', name: 'Footsteps' },
      { file: 'sounds/events/whisper.wav', name: 'Whisper' },
      { file: 'sounds/events/distant_children.wav', name: 'Distant Children' },
      { file: 'sounds/events/monster_scream.wav', name: 'Monster Scream' },
      { file: 'sounds/events/monster_scream2.wav', name: 'Monster Scream 2' },
      { file: 'sounds/events/female_scream.wav', name: 'Female Scream' },
      { file: 'sounds/events/broken_glass.wav', name: 'Broken Glass' },
      { file: 'sounds/events/window_knock.aiff', name: 'Window Knock' },
      { file: 'sounds/events/chain_rattling.aiff', name: 'Chain Rattling' },
      { file: 'sounds/events/wooddoor_creak.wav', name: 'Wood Door Creak' },
    ],
  }
};

// Track open dropdowns
const DROPDOWN_STATE = {
  ambience: false,
  tension: false,
  events: false
};

const AUDIO_STATE = {
  layers: [null, null, null],         // max 3 layers
  howlers: [null, null, null],         // Howler instances
  volumes: [100, 100, 100],            // volume per layer
  muted: [false, false, false],         // mute state
};

function log(msg) {
  console.log(`[AUDIO] ${msg}`);
}

function err(msg) {
  console.error(`[AUDIO ERROR] ${msg}`);
}

/* ============================================================
   LAYER MANAGEMENT
============================================================ */

function playSound(soundFile, soundName, layerIndex) {
  if (layerIndex < 0 || layerIndex >= 3) return;

  // Stop existing sound in this layer
  stopLayer(layerIndex);

  // Create new Howler instance
  const howl = new Howl({
    src: [soundFile],
    html5: true,
    autoplay: true,
    loop: true,
    volume: AUDIO_STATE.volumes[layerIndex] / 100,
    onload: () => {
      log(`✓ Loaded: ${soundName}`);
      updateLayerUI(layerIndex);
    },
    onerror: () => {
      err(`Failed to load: ${soundFile}`);
    }
  });

  AUDIO_STATE.howlers[layerIndex] = howl;
  AUDIO_STATE.layers[layerIndex] = { file: soundFile, name: soundName };

  updateLayerUI(layerIndex);
  updateStatus();
  renderAudioPanel();
}

function stopLayer(layerIndex) {
  if (layerIndex < 0 || layerIndex >= 3) return;

  const howl = AUDIO_STATE.howlers[layerIndex];
  if (howl) {
    howl.stop();
    howl.unload();
  }

  AUDIO_STATE.howlers[layerIndex] = null;
  AUDIO_STATE.layers[layerIndex] = null;
  AUDIO_STATE.muted[layerIndex] = false;

  updateLayerUI(layerIndex);
  updateStatus();
  renderAudioPanel();
}

function togglePlayPause(layerIndex) {
  if (layerIndex < 0 || layerIndex >= 3) return;
  const howl = AUDIO_STATE.howlers[layerIndex];
  if (!howl) return;

  if (howl.playing()) {
    howl.pause();
  } else {
    howl.play();
  }
  updateLayerUI(layerIndex);
}

function toggleMute(layerIndex) {
  if (layerIndex < 0 || layerIndex >= 3) return;
  const howl = AUDIO_STATE.howlers[layerIndex];
  if (!howl) return;

  AUDIO_STATE.muted[layerIndex] = !AUDIO_STATE.muted[layerIndex];
  howl.mute(AUDIO_STATE.muted[layerIndex]);
  updateLayerUI(layerIndex);
}

function setVolume(layerIndex, volume) {
  if (layerIndex < 0 || layerIndex >= 3) return;
  AUDIO_STATE.volumes[layerIndex] = Math.max(0, Math.min(100, volume));

  const howl = AUDIO_STATE.howlers[layerIndex];
  if (howl) {
    howl.volume(AUDIO_STATE.volumes[layerIndex] / 100);
  }
  updateLayerUI(layerIndex);
}

function stopAllLayers() {
  for (let i = 0; i < 3; i++) {
    stopLayer(i);
  }
  updateStatus();
}

/* ============================================================
   RANDOMIZE ATMOSPHERE
============================================================ */

function generateRandomAtmosphere() {
  stopAllLayers();

  const categories = ['ambience', 'tension', 'events'];
  const layerCount = Math.floor(Math.random() * 3) + 1; // 1-3 layers

  // Pick random sounds from different categories
  const pickedCategories = [];
  for (let i = 0; i < layerCount; i++) {
    let category;
    do {
      category = categories[Math.floor(Math.random() * categories.length)];
    } while (pickedCategories.includes(category));

    pickedCategories.push(category);
  }

  // Assign to layers
  pickedCategories.forEach((category, idx) => {
    const sounds = AUDIO_CONFIG.sounds[category];
    const sound = sounds[Math.floor(Math.random() * sounds.length)];
    playSound(sound.file, sound.name, idx);
  });

  log(`✓ Generated atmosphere with ${layerCount} layers`);
  setStatus('atmosphere generated.');
}

/* ============================================================
   UI UPDATES
============================================================ */

function updateLayerUI(layerIndex) {
  const container = document.querySelector(`[data-layer="${layerIndex}"]`);
  if (!container) return;

  const layer = AUDIO_STATE.layers[layerIndex];
  const howl = AUDIO_STATE.howlers[layerIndex];
  const volume = AUDIO_STATE.volumes[layerIndex];
  const muted = AUDIO_STATE.muted[layerIndex];

  // Highlight filled layers
  container.classList.toggle('filled', !!layer);

  // Determine category
  let category = '';
  if (layer) {
    for (const [cat, sounds] of Object.entries(AUDIO_CONFIG.sounds)) {
      if (sounds.some(s => s.file === layer.file)) {
        category = cat;
        break;
      }
    }
  }

  // Display category
  const catEl = container.querySelector('.layer-category');
  if (catEl) {
    catEl.textContent = category ? `[${category.toUpperCase()}]` : '';
    catEl.style.opacity = category ? '1' : '0.5';
  }

  // Display sound name
  const nameEl = container.querySelector('.layer-name');
  if (nameEl) {
    nameEl.textContent = layer ? layer.name : '(empty)';
    nameEl.style.opacity = layer ? '1' : '0.5';
  }

  // Update play/pause button
  const playBtn = container.querySelector('.layer-play');
  if (playBtn && howl) {
    playBtn.textContent = howl.playing() ? 'PAUSE' : 'PLAY';
    playBtn.disabled = false;
  } else if (playBtn) {
    playBtn.textContent = 'PLAY';
    playBtn.disabled = true;
  }

  // Update mute button
  const muteBtn = container.querySelector('.layer-mute');
  if (muteBtn) {
    muteBtn.textContent = muted ? 'UNMUTE' : 'MUTE';
    muteBtn.disabled = !layer;
    muteBtn.classList.toggle('muted', muted);
  }

  // Update volume slider
  const volSlider = container.querySelector('.layer-volume');
  if (volSlider) {
    volSlider.value = volume;
    volSlider.disabled = !layer;
  }

  // Update volume display
  const volDisplay = container.querySelector('.layer-volume-display');
  if (volDisplay) {
    volDisplay.textContent = volume + '%';
  }

  // Update stop button
  const stopBtn = container.querySelector('.layer-stop');
  if (stopBtn) {
    stopBtn.disabled = !layer;
  }
}

function updateStatus() {
  const activeLayers = AUDIO_STATE.layers.filter(l => l !== null).length;
  const countEl = document.querySelector('.layers-count');
  if (countEl) {
    countEl.textContent = `${activeLayers} / 3`;
    countEl.classList.toggle('has-active', activeLayers > 0);
  }
}

function setStatus(msg) {
  const statusEl = document.getElementById('stage-status');
  if (statusEl) {
    statusEl.textContent = msg;
  }
}

/* ============================================================
   DROPDOWN TOGGLE
============================================================ */

function toggleCategory(category) {
  DROPDOWN_STATE[category] = !DROPDOWN_STATE[category];
  renderAudioPanel();
}

/* ============================================================
   RENDER SOUND CATEGORY SECTIONS (dropdowns)
   - Re-renders ONLY the .audio-sections container so the
     active-layers section above is never touched.
============================================================ */

function renderAudioPanel() {
  const panel = document.querySelector('[data-panel="audio"]');
  if (!panel) return;

  // Find or create the dedicated sections container (don't wipe siblings)
  let sections = panel.querySelector('.audio-sections');
  if (!sections) {
    sections = document.createElement('div');
    sections.className = 'audio-sections';
    const actionRow = panel.querySelector('.action-row');
    actionRow.parentElement.insertBefore(sections, actionRow);
  }

  sections.innerHTML = ['ambience', 'tension', 'events'].map(category => {
    const isOpen = DROPDOWN_STATE[category];
    const soundsHtml = AUDIO_CONFIG.sounds[category].map(sound => {
      // Is this sound currently loaded in a layer?
      const activeLayer = AUDIO_STATE.layers.findIndex(l => l && l.file === sound.file);
      const isActive = activeLayer !== -1;
      return `
        <div class="sound-item ${isActive ? 'active' : ''}">
          <span class="sound-name">${sound.name}</span>
          ${isActive
            ? `<button class="play-icon stop" onclick="stopLayer(${activeLayer})">STOP</button>`
            : `<button class="play-icon" onclick="playInAvailableLayer('${sound.file}', '${sound.name}')">PLAY</button>`
          }
        </div>
      `;
    }).join('');

    return `
      <div class="audio-category">
        <div class="category-header" onclick="toggleCategory('${category}')">
          <span class="category-chevron" style="transform: rotate(${isOpen ? '90deg' : '0deg'})">></span>
          <span>${category.toUpperCase()}</span>
        </div>
        ${isOpen ? `<div class="category-sounds">${soundsHtml}</div>` : ''}
      </div>
    `;
  }).join('');
}

function playInAvailableLayer(soundFile, soundName) {
  let layerIndex = AUDIO_STATE.layers.findIndex(l => l === null);
  if (layerIndex === -1) {
    setStatus('all 3 layers full — stop one first.');
    return;
  }
  playSound(soundFile, soundName, layerIndex);
}

/* ============================================================
   LAYER CONTROLS HTML
============================================================ */

function renderLayerControls() {
  const panel = document.querySelector('[data-panel="audio"]');
  if (!panel) return;

  let layersContainer = panel.querySelector('.audio-layers');
  if (!layersContainer) {
    layersContainer = document.createElement('div');
    layersContainer.className = 'audio-layers';
    // Insert before the action-row so it sits BELOW the categories
    const actionRow = panel.querySelector('.action-row');
    actionRow.parentElement.insertBefore(layersContainer, actionRow);
  }

  layersContainer.innerHTML = `
    <div class="layers-header">ACTIVE LAYERS <span class="layers-count">0 / 3</span></div>
    ${[0, 1, 2].map(i => `
      <div class="layer-control" data-layer="${i}">
        <div class="layer-top">
          <span class="layer-label">LAYER ${i + 1}</span>
          <span class="layer-category"></span>
          <span class="layer-name">(empty)</span>
        </div>
        <div class="layer-actions">
          <button class="layer-play" onclick="togglePlayPause(${i})" disabled>PLAY</button>
          <button class="layer-mute" onclick="toggleMute(${i})" disabled>MUTE</button>
          <button class="layer-stop" onclick="stopLayer(${i})" disabled>STOP</button>
        </div>
        <div class="layer-volume-control">
          <input type="range" class="layer-volume" min="0" max="100" value="100" disabled
                 oninput="setVolume(${i}, this.value)">
          <span class="layer-volume-display">100%</span>
        </div>
      </div>
    `).join('')}
  `;
}

/* ============================================================
   INIT
============================================================ */

function initAudio() {
  log('Horror Atmosphere Mixer Ready');
  log('Loading sound categories...');

  // Order: categories first, then the active-layers section
  renderAudioPanel();
  renderLayerControls();

  // Generate button
  const generateBtn = document.createElement('button');
  generateBtn.className = 'btn-solid wide';
  generateBtn.textContent = 'GENERATE ATMOSPHERE';
  generateBtn.style.width = '100%';
  generateBtn.onclick = generateRandomAtmosphere;

  const actionRow = document.querySelector('[data-panel="audio"] .action-row');
  if (actionRow) {
    actionRow.innerHTML = '';
    actionRow.appendChild(generateBtn);
    const stopAllBtn = document.createElement('button');
    stopAllBtn.className = 'btn-ghost';
    stopAllBtn.textContent = 'STOP ALL';
    stopAllBtn.onclick = stopAllLayers;
    actionRow.appendChild(stopAllBtn);
  }

  updateStatus();
  log('✓ Audio system ready');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAudio);
} else {
  initAudio();
}
