let isMouseDown = false;
let isAnimating = false;
let animationSpeed = 100;


/*
Magenta.js has 2 models we can use: 
  - an RNN (recurrent neural network)
  - a VAE (variational autoencoder)
They both generate sequences of music based on an input,
but in slightly different ways.
*/
let useRNN = false;
let forceInputToDrums = true;

const noiseyMakey = new NoiseyMakey();
const board = new Board();

// The RNN is a recurrent neural network:
// We use it to give it an initial sequence of music, and 
// it continues playing to match that!
let model;

init();

function init() {
  // If there is a location, parse it.
  if (window.location.hash) {
    try {
      const hash = window.location.hash.slice(1);
      const parsed = hash.split('&');
      board.data = decode(parsed[0]);
      if (parsed[1]) {
        document.getElementById('input').value = parsed[1];
        animationSpeed = parsed[1];
      }
      board.draw();
    } catch(err) {
      window.location.hash = 'not-a-valid-pattern-url';
    }
  }
  
  // Set up event listeners.
  document.getElementById('container').addEventListener('mousedown', (event) => {isMouseDown = true; clickCell(event)});
  document.getElementById('container').addEventListener('mouseup', () => isMouseDown = false);
  document.getElementById('container').addEventListener('mouseover', clickCell);
  document.getElementById('input').addEventListener('change', (event) => {
    animationSpeed = parseInt(event.target.value);
    updateLocation();
  });
  document.getElementById('radioRnn').addEventListener('click', (event) => {
    useRNN = event.target.checked;
    document.getElementById('modelName').value = 'drum_kit_rnn'; 
    document.getElementById('radioForceDrumNo').click();
  });
  document.getElementById('radioVae').addEventListener('click', (event) => {
    useRNN = !event.target.checked;
    document.getElementById('modelName').value =  'drums_2bar_lokl_small';
    document.getElementById('radioForceDrumYes').click();
  });
  document.getElementById('radioForceDrumYes').addEventListener('click', (event) => {
    forceInputToDrums = event.target.checked;
  });
  document.getElementById('radioForceDrumNo').addEventListener('click', (event) => {
    forceInputToDrums = !event.target.checked;
  });
  
  
  // Secret keys! (not so secret)
  document.body.addEventListener('keypress', (event) => {
    switch(event.keyCode) {
      case 115: // s
        playSynth();
        break;
      case 100: // d
        playDrums();
        break;
      case 112:  // p
        playOrPause();
        break;
      case 105:  // i
        autoDrums();
        break;
      case 109:  // m
        showSettings();
        break;
    }
  });
}

function reset(clearLocation = false) {
  board.reset();
  if (clearLocation) {
    window.location.hash = '';
  }
}

function clickCell(event) {
  const button = event.target;
  
  // We only care about clicking on the buttons, not the container itself.
  if (button.localName !== 'button' || !isMouseDown) {
    return;
  }
  
  const x = parseInt(button.dataset.row);
  const y = parseInt(button.dataset.col);
  board.toggleCell(x, y, noiseyMakey.getSound(), button);
  
  updateLocation();
}

function animate() {
  let currentColumn = 0;
  let animationIndex = setTimeout(step, animationSpeed);
  
  const rows = document.querySelectorAll('.container > .row');
  
  // An animation step.
  function step() {
    // Draw the board at this step.
    board.animate(currentColumn, noiseyMakey);
    
    // Get ready for the next column.
    currentColumn++;
    if (currentColumn === 16) {
      currentColumn = 0;
    }
    
    // Did we get paused mid step?
    if (isAnimating) {
      setTimeout(step, animationSpeed);
    } else {
      clearTimeout(animationIndex);
      currentColumn = 0;
      board.clearAnimation();
    }
  }
}


/***********************************
 * Sample demos
 ***********************************/
function loadDemo(which) {
  switch(which) {
    case 1:
      board.data = decode('0000000000000000000000000000000022222000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000200020002000200000000000000000000000000000000000000000101000000000000001010101010010000010101010');
      break;
    case 2:
      board.data = decode('0000000000000000000000000000000000000000000000000000011001100000000001100110000000020000000020000002000000002000000020000002000000000222222000000000000000000000001000010000000000100000001101100011100100121210001010010001210000101001000010000000000000000000');
      break;
    case 3:
      board.data = decode('2222220001001000000000000000000000222222020220220000000000000000000000110000000000001000000000000001000000010000000000000000000000000000000010000010000000000000010000000000000001000000000010000100000000000000000000000000100000000000000000000000010101010000');
      break;
    case 4:
      board.data = decode('2202020202202020000020000020200000202002200220220002002000020001200000220021020000010000000000000000000100000000101010101010101000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000&100');
      break;
    case 5: 
      board.data = decode('0000000000000000000111100000000000000000000000000011111000000000000010000000000000010000010000000010000001000000000000000100000000000000100000000000001100000000000000000010010000000000001001000000000000100100000000000000010000000000000010000000000000000000');
      break;
  }
  updateLocation();
  board.draw();
}

/***********************************
 * UI actions
 ***********************************/

function playOrPause() {
  const container = document.getElementById('container');
  
  if (isAnimating) {
    container.classList.remove('playing');
    noiseyMakey.pause();
  } else {
    container.classList.add('playing');
    animate();
    noiseyMakey.play();
  }
  
  isAnimating = !isAnimating;
  document.getElementById('btnPlay').textContent = isAnimating? 'Pause' : 'Play!';
}

function playSynth() {
  noiseyMakey.isSynth = true;
  document.getElementById('btnSynth').classList.add('synth');
  document.getElementById('btnDrums').classList.remove('drums');
}

function playDrums() {
  noiseyMakey.isSynth = false;
  document.getElementById('btnSynth').classList.remove('synth');
  document.getElementById('btnDrums').classList.add('drums');
}

function showHelp() {
  const box = document.getElementById('help');
  box.hidden = !box.hidden;
}

function showSettings() {
  const box = document.getElementById('settings');
  // If we're closing this, also re-initialize the model if needed
  if (!box.hidden) {
    loadModel();
  }
  box.hidden = !box.hidden;
}

function autoDrums() {
  const btn = document.getElementById('btnAuto');

  // Load the magenta model if we haven't already.
  if (btn.hasAttribute('not-loaded')) {
    loadModel();
  } else {
    btn.setAttribute('disabled', true);
    
    // Don't block the UI thread while this is happening.
    setTimeout(() => {
      if (useRNN) {
        const sequence = board.getSynthSequence(forceInputToDrums); 
        
        // High temperature to get interesting beats!
        model.continueSequence(sequence, 16, 1.3).then((dream) => {
          board.drawDreamSequence(dream, sequence);
          updateLocation();
          btn.removeAttribute('disabled');
        });
      } else {
        const sequence = board.getSynthSequence(forceInputToDrums);
        
        // TODO: use async/await here omg.
        model.encode([sequence]).then((encoded) => {
          model.decode(encoded).then((decoded) => {
            board.drawDreamSequence(decoded[0], sequence);
            
            updateLocation();
            btn.removeAttribute('disabled');
          });
        });
        
        // Example: This generates a random sequence all the time:
        // model.sample(1).then((dreams) => {...});
      }
    });
  }
}

function loadModel() {
  const btn = document.getElementById('btnAuto');
  btn.textContent = 'Loading...';
  btn.setAttribute('disabled', true);
  
  const name = document.getElementById('modelName').value.trim();
  const root = useRNN ? 'music_rnn' : 'music_vae';

  const url = 
      `https://storage.googleapis.com/magentadata/js/checkpoints/${root}/${name}`;
  
  if (!model || model.checkpointURL != url) {
    model = useRNN ? new mm.MusicRNN(url) : new mm.MusicVAE(url);
  }
  
  Promise.all([
    model.initialize()
  ]).then(([vars]) => {
    const btn = document.getElementById('btnAuto');
    btn.removeAttribute('not-loaded');
    btn.removeAttribute('disabled');
    btn.textContent = 'Improvise!';
  });
}

/***********************************
 * Save and load application state
 ***********************************/
function updateLocation() {
  // New board state, so update the URL.
  const speed = parseInt(document.getElementById('input').value);
  window.location.hash = `#${encode(board.data)}&${speed}`;
}
function encode(arr) {
  let bits = '';
  for (let i = 0; i < 16; i++) {
    for (let j = 0; j < 16; j++) {
      bits += arr[i][j].on ? arr[i][j].on : 0;
    }
  }
  return bits;
}

function decode(bits) {
  const arr = [];
  for (let i = 0; i < 16; i++) {
    let row = [];
    arr.push(row);
    for (let j = 0; j < 16; j++) {
      arr[i][j] = {};
      const c = bits.charAt(i * 16 + j);
      if (c != '0') {
        arr[i][j].on = parseInt(c);
      }
    }
  }
  return arr;
}


