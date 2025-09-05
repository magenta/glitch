let isMouseDown = false;
let isAnimating = false;
let animationSpeed = 100;

const noiseyMakey = new NoiseyMakey();
const board = new Board();

// The RNN is a recurrent neural network:
// We use it to give it an initial sequence of music, and 
// it continues playing to match that!
let rnn;

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
  
  // Secret keys! (not so secret)
  document.body.addEventListener('keypress', (event) => {
    if (event.keyCode == 115) { // s
      playSynth();
      event.preventDefault();
    } else if (event.keyCode == 100) { // d
      playDrums();
      event.preventDefault();
    } else if (event.keyCode == 112) { // p
      playOrPause();
      event.preventDefault();
    }else if (event.keyCode == 105) { // i
      autoDrums();
      event.preventDefault();
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
  const helpBox = document.getElementById('help');
  helpBox.hidden = !helpBox.hidden;
}

function autoDrums() {
  const btn = document.getElementById('btnAuto');

  // Load the magenta model if we haven't already.
  if (btn.hasAttribute('not-loaded')) {
    loadRNN();
  } else {
    btn.setAttribute('disabled', true);
    
    // Don't block the UI thread while this is happening.
    setTimeout(() => {
      const sequence = board.getSynthSequence(); 
      // High temperature to get interesting beats!
      const dreamSequence = rnn.continueSequence(sequence, 16, 1.3).then((dream) => {
        board.drawDreamSequence(dream, sequence);
        
        updateLocation();
        btn.removeAttribute('disabled');
      });
    });
  }
}

function loadRNN() {
  const btn = document.getElementById('btnAuto');
  btn.textContent = 'Loading...';
  btn.setAttribute('disabled', true);
  rnn = new mm.MusicRNN(
    'https://storage.googleapis.com/download.magenta.tensorflow.org/tfjs_checkpoints/music_rnn/drum_kit_rnn'
  );
  Promise.all([
    rnn.initialize()
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


