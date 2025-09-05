const N_DIMS = 90;
// The sorted 256 dimensions, from most to least important.
// I got this by sorting the average sigmas for each dimension, after encoding
// a large dataset into MusicVAE. Note that these dimensions only work for these 
// models. A different MusicVAE model will have a different ordering.
const MELODY_DIMS = [73,135,230,177,38,208,172,56,212,211,140,142,150,1,202,74,33,187,206,14,154,2,31,32,244,24,183,173,64,3,108,196,132,29,75,156,131,26,237,164,200,48,218,44,113,167,250,166,90,77,23,185,246,180,217,10,111,213,46,127,216,117,128,16,222,243,240,233,70,9,88,236,179,40,94,4,182,241,78,165,125,25,103,81,66,83,91,124,105,226,247,145,68,238,69,47,254,153,119,5,255,170,158,176,84,225,186,43,99,245,224,168,45,160,63,49,37,61,35,101,141,41,248,209,134,149,147,30,110,188,118,52,67,133,92,95,126,112,15,93,157,107,55,60,130,235,231,6,123,171,114,20,139,162,199,86,51,120,227,85,152,178,80,184,39,215,22,138,192,57,155,252,198,13,50,181,8,121,148,193,204,36,251,219,0,97,220,229,109,21,194,159,72,122,146,87,42,102,189,65,115,253,19,163,201,207,137,100,27,242,34,203,129,210,11,54,232,12,28,98,71,18,205,17,79,249,197,221,223,234,106,76,175,239,136,53,58,89,191,82,190,59,62,174,214,96,161,195,151,116,143,7,104,169,144,228];
const TRIO_DIMS = [132,68,160,36,105,248,75,152,135,18,246,1,77,79,7,163,87,63,72,162,236,0,221,108,29,98,78,203,166,173,69,74,129,125,142,53,8,156,52,85,189,133,206,25,65,94,253,71,233,33,31,176,116,64,131,255,159,83,35,195,214,139,127,134,86,70,165,177,194,137,187,113,190,37,161,58,151,81,210,183,62,179,218,254,230,27,222,115,73,192,112,175,145,3,229,217,251,169,90,167,11,186,120,242,208,17,150,92,215,191,209,184,46,34,188,51,60,171,12,24,250,16,38,104,172,117,128,50,212,114,95,21,2,158,96,136,147,252,126,47,43,30,19,84,91,205,42,196,234,243,146,149,13,226,225,157,22,219,138,28,103,14,101,124,200,76,174,182,238,202,100,239,198,130,141,97,66,44,56,9,123,61,231,223,244,111,247,45,153,67,232,109,41,143,201,119,5,185,154,4,170,249,99,55,15,39,26,245,197,168,106,121,6,204,213,155,23,49,118,227,57,88,80,199,211,48,82,240,144,107,89,178,216,20,148,237,207,235,224,228,180,110,193,54,181,140,241,93,59,102,220,32,10,164,40,122];
const MELODY_BARS = 2;
const TRIO_BARS = 4;

let isMelodyMode = true;
let SORTED_DIMS, MODEL_BARS;

// Models.
let mvae;
let midime;

// Soundfont players.
let playerInput, playerSample, playerMelody;

// MIDI Visualizers.
let vizInput, vizMelody, vizSample;

// The melodies for each of the players/visualizer pairs.
let input, melody, currentSample;
let playerSaidStop = false;  // So that we can loop.

let training = {};

init();

function init() {
  btnGoMelodies.addEventListener('click', () => ready(true));
  btnGoTrios.addEventListener('click', () => ready(false));
  fileBtn.addEventListener('change', loadFile);
  sampleBtn.addEventListener('click', loadSample);
  urlBtn.addEventListener('click', loadURL);
  saveBtn.addEventListener('click', () => saveAs(new File([mm.sequenceProtoToMidi(currentSample)], 'midime_sample.mid')));
  
  btnPlayInput.addEventListener('click', (e) => play(e, 0));
  btnPlayMelody.addEventListener('click', (e) => play(e, 1));
  btnPlaySample.addEventListener('click',(e) => play(e, 2));
  btnSample.addEventListener('click', sample);
  btnTrain.addEventListener('click', train);
  window.addEventListener('resize', onResize);
  
  mvaeSliders.addEventListener('change', updateFromFullSliders);
  midimeSliders.addEventListener('change', updateFromMidimeSliders);
}

function ready(mode) {
  isMelodyMode = mode;
  SORTED_DIMS = isMelodyMode ? MELODY_DIMS : TRIO_DIMS;
  MODEL_BARS = isMelodyMode ? MELODY_BARS : TRIO_BARS;
  updateCopy();
  
  splashScreen.hidden = true;
  mainScreen.hidden = false;
  updateUI('model-loading');
  
  const url = 'https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/' +
              (isMelodyMode ? 'mel_2bar_small' : 'trio_4bar');
  mvae = new mm.MusicVAE(url);
  mvae.initialize().then(() => {
    sample();
    updateUI('model-loaded');
  });
  
  playerInput = new mm.SoundFontPlayer('https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus');
  playerMelody = new mm.SoundFontPlayer('https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus');
  playerSample = new mm.SoundFontPlayer('https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus');
  
  playerInput.callbackObject = {
    run: (note) => vizInput.redraw(note, true),
    stop: () => {}
  };
  playerMelody.callbackObject = {
    run: (note) => vizMelody.redraw(note, true),
    stop: () => {}
  };
  playerSample.callbackObject = {
    run: (note) => vizSample.redraw(note, true),
    stop: () => {}
  };
  
  for (let i = 0; i < N_DIMS; i++) {
    const div = document.createElement('div');
    div.classList.add('range-wrap');
    div.innerHTML = `<input type="range" data-index=${i} min="-2" max="2" step="0.1" value="0">`;
    mvaeSliders.appendChild(div);
  }
}

// Loads a file from the user.
function loadFile() {
  updateUI('file-loading');
  
  midime = new mm.MidiMe({epochs: 100});
  midime.initialize();

  const promises = [];
  for (let i = 0; i < fileInput.files.length; i++) {
    promises.push(mm.blobToNoteSequence(fileInput.files[i]));
  }
  Promise.all(promises).then(showInput);
}

// Loads an example if you don't have a file.
function loadSample() {
  updateUI('file-loading');
  
  midime = new mm.MidiMe({epochs: 100});
  midime.initialize();
  
  const url = isMelodyMode ? 
        'https://cdn.glitch.com/d18fef17-09a1-41f5-a5ff-63a80674b090%2Fmel_input.mid?v=1564186536933':
        'https://cdn.glitch.com/d18fef17-09a1-41f5-a5ff-63a80674b090%2Ftrios_input.mid?v=1564186506192';
  //const url = 'https://cdn.glitch.com/d18fef17-09a1-41f5-a5ff-63a80674b090%2Fchpn_op10_e01_format0.mid?1556142864200';
  mm.urlToNoteSequence(url).then((mel) => {
    showInput([mel]);
  });
}

function loadURL() {
  updateUI('file-loading');
  
  midime = new mm.MidiMe({epochs: 100});
  midime.initialize();

  // Oops, urlToNoteSequence doesn't reject correctly,
  // so do this by hand for now.
  mm.urlToBlob(urlInput.value).then((blob) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        showInput([mm.midiToSequenceProto(reader.result)]);
      } catch (err) {
        updateUI('file-error');
      }
    };
    reader.readAsBinaryString(blob);
  });
}

async function showInput(ns) {
  const instruments = [];
  let shouldSplit = false;
  ns.forEach((m) => {
    const i = getInstruments(m);
    instruments.push(i)
    if (i.length > 1) shouldSplit = true;
  });
  
  
  const mels = [];
  const quantizedMels = [];
  
  if (isMelodyMode && shouldSplit) {
    instruments.forEach((i) => mels.push(getMelody(i)));
    mels.forEach((m) => quantizedMels.push(mm.sequences.quantizeNoteSequence(m, 4)));
    
    trimSilence(mels);
    melody = mm.sequences.concatenate(mels);
    playerMelody.loadSamples(melody);
    vizMelody = new mm.PianoRollSVGVisualizer(
      melody,
      document.getElementById('vizMelody'), 
      {noteRGB:'35,70,90', activeNoteRGB:'157, 229, 184', noteHeight:3}); 
    updateUI('has-melody');
  } else {
    ns.forEach((m) => quantizedMels.push(mm.sequences.quantizeNoteSequence(m, 4)));
  }
  
  trimSilence(ns);
  input = mm.sequences.concatenate(ns);
  playerInput.loadSamples(input);
  vizInput = new mm.PianoRollSVGVisualizer(
    input,
    document.getElementById('vizInput'), 
    {noteRGB:'35,70,90', activeNoteRGB:'157, 229, 184', noteHeight:3}); 
  
  // This is the input that we're going to train on.
  const chunks = getChunks(quantizedMels);
  const z = await mvae.encode(chunks);  // shape of z is [chunks, 256]
  
  updateUI('file-loaded');
  
  training.z = z;
  await sample();
  
  function getChunks(quantizedMels) {
    // Encode the input into MusicVAE, get back a z.
    // Split this sequence into 32 bar chunks.
    let chunks = [];
    quantizedMels.forEach((m) => {
      const melChunks = mm.sequences.split(mm.sequences.clone(m), 16 * MODEL_BARS);
      chunks = chunks.concat(melChunks);
    });
    return chunks;
  }
}

// Get a new random sample.
async function sample() {
  stopPlayer(playerSample, document.getElementById('btnPlaySample'));
  
  let zArray;
  if (midime && midime.trained) {
    // If we've trained, then we sample from MidiMe.
    const s = await midime.sample(1);
    zArray = s.arraySync()[0];
    currentSample = (await mvae.decode(s))[0];
    
    // Get the 4 inputs from midime too.
    const z = midime.encoder.predict(s);
    const z_ = z[0].arraySync()[0];
    s.dispose();
    updateMidiMeSliders(z_);
  } else {
    // Get a random sample from music vae. This is basically the 
    // code inside mvae.sample(), but since we need the z to 
    // display, might as well do it here.
    const randZs = mm.tf.tidy(() => mm.tf.randomNormal([1, mvae.decoder.zDims]));
    currentSample = (await mvae.decode(randZs, 0.5))[0];
    zArray = randZs.arraySync()[0];
    randZs.dispose();
  }
  
  updateFullSliders(zArray);
  updateVisualizer();
  training.zArray = zArray;
}

function onResize() {
  if (training && training.zArray && training.zArray.length !== 0) {
    plot(training.zArray); 
  }
}

// Train the model!!
async function train() {
  updateUI('training');
  stopPlayer(playerMelody, document.getElementById('btnPlayMelody'));
  
  currentSample = null;
  trainingStep.textContent = 0;
  totalSteps.textContent = midime.config.epochs = parseInt(trainingSteps.value);
  
  const losses = [];

  await midime.train(training.z, async (epoch, logs) => {
    await mm.tf.nextFrame();
    trainingStep.textContent = epoch + 1;
    losses.push(logs.total);
    plotLoss(losses);
  });
  updateUI('training-done');
  sample();
}

async function play(event, playerIndex) {
  let player, mel;
  if (playerIndex === 0) player = playerInput;
  else if (playerIndex === 1) player = playerMelody;
  else if (playerIndex === 2) player = playerSample;
  
  if (playerIndex === 0) mel = input;
  else if (playerIndex === 1) mel = melody;
  else if (playerIndex === 2) mel = currentSample;
  
  const btn = event.target;
  if (player.isPlaying()) {
    stopPlayer(player, btn);
  } else {
    startPlayer(player, btn);
    player.loadSamples(mel).then(() => loopMelody(player, mel, btn))
  } 
}

function stopPlayer(player, btn) {
  player.stop();
  playerSaidStop = true;
  btn.querySelector('.iconPlay').removeAttribute('hidden');
  btn.querySelector('.iconStop').setAttribute('hidden', true);
}

function startPlayer(player, btn) {
  playerSaidStop = false;
  btn.querySelector('.iconStop').removeAttribute('hidden');
  btn.querySelector('.iconPlay').setAttribute('hidden', true);
}

function loopMelody(player, mel, btn) {
  player.start(mel).then(() => {
    if (!playerSaidStop) {
      loopMelody(player, mel, btn);
    } else {
      stopPlayer(player, btn);
    }
  });
}

function updateMidiMeSliders(z) {
  const sliders = midimeSliders.querySelectorAll('input');
  for (let i = 0; i < 4; i++) {
    sliders[i].value = z[i];
  }
}

function updateFullSliders(z) {
  // Display the Z in the sliders.
  const sliders = mvaeSliders.querySelectorAll('input');
  for (let i = 0; i < N_DIMS; i++) {
    const dim = SORTED_DIMS[i];
    sliders[i].value = z[dim];
  }
  plot(z);
}

async function updateFromFullSliders() {
  stopPlayer(playerSample, document.getElementById('btnPlaySample'));
  
  const z = JSON.parse(JSON.stringify(training.zArray));
  
  // Update the dimensions displayed for each of the batches.
  const sliders = mvaeSliders.querySelectorAll('input');
  for (let i = 0; i < N_DIMS; i++) {
    const dim = SORTED_DIMS[i];
    z[dim] = parseFloat(sliders[i].value);
  }
  plot(z);
  
  const zTensor = mm.tf.tensor(z, [1, 256]);
  const ns = await mvae.decode(zTensor);
  currentSample = mm.sequences.concatenate(ns);
  updateVisualizer();                    
}

async function updateFromMidimeSliders() {
  stopPlayer(playerSample, document.getElementById('btnPlaySample'));
  let z = [0,0,0,0];
  
  // Update the dimensions displayed for each of the batches.
  let sliders = midimeSliders.querySelectorAll('input');
  for (let i = 0; i < 4; i++) {
    z[i] = parseFloat(sliders[i].value);
  }
  sample = await midime.decode(mm.tf.tensor(z, [1,4]));
  currentSample = (await mvae.decode(sample))[0];
  
  z = sample.arraySync()[0];
  
  updateFullSliders(z);
  updateVisualizer();
}

function updateVisualizer() {
  vizSample = new mm.PianoRollSVGVisualizer(
    currentSample, document.getElementById('vizSample'), 
    {noteRGB:'35,70,90', activeNoteRGB:'157, 229, 184', noteHeight:5}); 
}

function plot(z, color='white', el='lines') {
  // We're actually displaying the most important N dimensions, not the first N dimensions,
  // so get those dimensions from the data.
  const data = [];
  for (let i = 0; i < N_DIMS; i++) {
    const dim = SORTED_DIMS[i];
    data.push(z[dim]);
  }
  
  const svgEl = document.getElementById(el)
  svgEl.innerHTML = '';
  
  const svg = d3.select('#' + el);
  
  const rekt = mvaeSliders.getBoundingClientRect();
  const width = rekt.width;
  const height = rekt.height;
  svg.attr('width', width+10);
  svg.attr('height', width);
  
  const x = d3.scaleLinear().domain([0, N_DIMS]).range([0, width]);
  const y = d3.scaleLinear().domain([-2,2]).range([height, 0]);
  
  function isEdge(i) { return i === 0 || i > N_DIMS; }
  
  const line = d3.line()
    .x((d,i) => i == 0 ? -1: x(i)-2)
    .y((d,i) => isEdge(i) ? height / 2 : y(d))
    .curve(d3.curveStep);
  
  svg.append('g').append('path').datum([0,...data,0])
      .style('fill', color)
      .style('stroke', '#23465A')
      .style('stroke-opacity', 0.3)
      .style('fill-opacity', 1)
      .attr('d', line);
}

function plotLoss(data) {
  const svg = d3.select('#errorGraph');
  svg.selectAll('*').remove();

  const rekt = document.getElementById('duringTraining').getBoundingClientRect();
  const width = rekt.width - 20;
  const height = 200;
  
  svg.attr('width', width);
  svg.attr('height', height);
  const margin = {left: 20, top: 20};
  
  const dataset = d3.range(data.length).map((d, i) => data[i].toFixed(3));  
  const x = d3.scaleLinear().domain([0, data.length - 1]).range([0, width - 2*margin.left]);
  const y = d3.scaleLinear().domain([0, Math.max(...data)]).range([height - 2*margin.top, 0]);
  
  const group = svg.append('g').attr(
      'transform', `translate(${margin.left}, ${margin.top})`);

  group.append('g')
      .attr('class', 'x axis')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x));
  group.append('g').attr('class', 'y axis').call(d3.axisLeft(y));

  const line = d3.line()
      .x((d, i) => x(i))
      .y((d) => y(d))
      .curve(d3.curveMonotoneX);
  group.append('path').datum(dataset).attr('class', 'line').attr('d', line);
}

function updateUI(state) {
  function show(el)    { document.getElementById(el).removeAttribute('hidden'); }
  function hide(el)    { document.getElementById(el).setAttribute('hidden', true) };
  function enable(el)  { document.getElementById(el).removeAttribute('disabled'); }
  function disable(el) { document.getElementById(el).setAttribute('disabled', true) };
  switch(state) {
    case 'model-loading':
      hide('afterLoading');
      show('status');
      document.getElementById('status').textContent = 'Loading model...one sec!';
      disable('btnSample');
      break;
    case 'model-loaded':
      show('afterLoading');
      enable('btnSample');
      show('section_2');
      hide('status');
      hide('loadingStatus');
      break;
    case 'file-loading':
      show('status');
      hide('input');
      hide('hasMelody');
      document.getElementById('status').textContent = 'The robots are nomming on your file...';
      break;
    case 'file-error':
      show('status');
      document.getElementById('status').textContent = 'Oops, there was a problem reading your file. Make sure it\'s a valid MIDI and try again?';
      break;
    case 'file-loaded':
      hide('status');
      show('section_3');
      show('input');
      enable('input');
      enable('section_3');
      hide('duringTraining');
      enable('btnTrain');
      hide('midimeSlidersContainer');
      btnTrain.focus();
      btnTrain.scrollIntoView();
      break;
    case 'has-melody':
      show('hasMelody');
      break;
    case 'training':
      disable('fileBtn');
      disable('section_2');
      disable('section_1');
      disable('sampleBtn');
      show('duringTraining');
      disable('btnTrain');
      hide('midimeSlidersContainer');
      errorGraph.scrollIntoView();
      break;
    case 'training-done':
      enable('fileBtn');
      enable('sampleBtn');
      enable('section_2');
      show('afterTraining');
      enable('section_1');
      hide('beforeTraining');
      show('doneTraining');
      disable('btnTrain');
      show('midimeSlidersContainer');
      helpMsg.innerHTML = 'Now that the model is trained, the random variations should sound much closer to your input!';
      btnSample.focus();
      btnSample.scrollIntoView();
  }
}

function updateCopy() {
  modeText.textContent = isMelodyMode ? 'melody' : 'trio';
  trainingSteps.value = 100; //(isMelodyMode ? 100 : 300);
}

window.updateUI = updateUI;