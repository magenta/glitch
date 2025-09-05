const board = new Board();
const svgBoard = new SVGBoard();

// Players.
let playerBoard = new mm.SoundFontPlayer('https://storage.googleapis.com/magentadata/js/soundfonts/jazz_kit');
let playerBoardSVG = new mm.SoundFontPlayer('https://storage.googleapis.com/magentadata/js/soundfonts/jazz_kit');

// Models
let grooveModel;
let mvae;

let isMouseDown = false;     // So that we can drag and draw
let playerHardStop = false;  // Actually stop the board from re-looping.
let modelSequence;

init();

function init() {
  grooveModel = new mm.MusicVAE('https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/groovae_2bar_humanize'); 
  mvae = new mm.MusicVAE('https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/drums_2bar_lokl_small'); 
  
  mvae.initialize().then(() => {
    btnSample.removeAttribute('disabled');
  });
  grooveModel.initialize().then(() => {
    drumifyControls.removeAttribute('disabled');
    btnDrumify.textContent = 'groove!';
  });
  
  // Set up the players.
  playerBoard.callbackObject = {
    run: (note) => board.playStep(note),
    stop: () => {
      if (playerHardStop) {
        stop();
      } else {
        play();
      }
    }
  };
  
  playerBoardSVG.callbackObject = {
    run: (note) => svgBoard.playStep(note),
    stop: () => {
      if (playerHardStop) {
        stop(true);
      } else {
        play(true);
      }
    }
  };
  
  // Load all SoundFonts so that they're ready for clicking.
  const allNotes = [];
  for (let i = 0; i < PITCHES.length; i++) {
    allNotes.push({pitch: PITCHES[i], velocity: getVelocity(i), isDrum: true});
  }
  playerBoard.loadSamples({notes: allNotes});
  
  // Set up touch events.
  const container = document.getElementById('container');
  container.addEventListener('touchstart', (event) => { isMouseDown = true; clickCell(event) }, {passive: true});
  container.addEventListener('touchend', (event) => { isMouseDown = false}, {passive: true});
  container.addEventListener('touchmove', clickCell, {passive: true});
  container.addEventListener('mouseover', clickCell);
  
  // But don't double fire events on desktop.
  const hasTouchEvents = ('ontouchstart' in window);
  if (!hasTouchEvents) {
    container.addEventListener('mousedown', (event) => { isMouseDown = true; clickCell(event) });
    container.addEventListener('mouseup', () => isMouseDown = false);
  }
  
  // Load a default note sequence.
  board.drawNoteSequence({"notes":[{"pitch":36,"velocity":100,"quantizedStartStep":0,"quantizedEndStep":1,"isDrum":true},{"pitch":36,"velocity":100,"quantizedStartStep":7,"quantizedEndStep":8,"isDrum":true},{"pitch":36,"velocity":100,"quantizedStartStep":8,"quantizedEndStep":9,"isDrum":true},{"pitch":36,"velocity":100,"quantizedStartStep":16,"quantizedEndStep":17,"isDrum":true},{"pitch":36,"velocity":100,"quantizedStartStep":23,"quantizedEndStep":24,"isDrum":true},{"pitch":36,"velocity":100,"quantizedStartStep":24,"quantizedEndStep":25,"isDrum":true},{"pitch":38,"velocity":80,"quantizedStartStep":4,"quantizedEndStep":5,"isDrum":true},{"pitch":38,"velocity":80,"quantizedStartStep":12,"quantizedEndStep":13,"isDrum":true},{"pitch":38,"velocity":80,"quantizedStartStep":20,"quantizedEndStep":21,"isDrum":true},{"pitch":38,"velocity":80,"quantizedStartStep":28,"quantizedEndStep":29,"isDrum":true},{"pitch":42,"velocity":80,"quantizedStartStep":2,"quantizedEndStep":3,"isDrum":true},{"pitch":42,"velocity":80,"quantizedStartStep":3,"quantizedEndStep":4,"isDrum":true},{"pitch":42,"velocity":80,"quantizedStartStep":4,"quantizedEndStep":5,"isDrum":true},{"pitch":42,"velocity":80,"quantizedStartStep":6,"quantizedEndStep":7,"isDrum":true},{"pitch":42,"velocity":80,"quantizedStartStep":7,"quantizedEndStep":8,"isDrum":true},{"pitch":42,"velocity":80,"quantizedStartStep":8,"quantizedEndStep":9,"isDrum":true},{"pitch":42,"velocity":80,"quantizedStartStep":10,"quantizedEndStep":11,"isDrum":true},{"pitch":42,"velocity":80,"quantizedStartStep":11,"quantizedEndStep":12,"isDrum":true},{"pitch":42,"velocity":80,"quantizedStartStep":12,"quantizedEndStep":13,"isDrum":true},{"pitch":42,"velocity":80,"quantizedStartStep":14,"quantizedEndStep":15,"isDrum":true},{"pitch":42,"velocity":80,"quantizedStartStep":15,"quantizedEndStep":16,"isDrum":true},{"pitch":42,"velocity":80,"quantizedStartStep":16,"quantizedEndStep":17,"isDrum":true},{"pitch":42,"velocity":80,"quantizedStartStep":18,"quantizedEndStep":19,"isDrum":true},{"pitch":42,"velocity":80,"quantizedStartStep":19,"quantizedEndStep":20,"isDrum":true},{"pitch":42,"velocity":80,"quantizedStartStep":20,"quantizedEndStep":21,"isDrum":true},{"pitch":42,"velocity":80,"quantizedStartStep":22,"quantizedEndStep":23,"isDrum":true},{"pitch":42,"velocity":80,"quantizedStartStep":23,"quantizedEndStep":24,"isDrum":true},{"pitch":42,"velocity":80,"quantizedStartStep":24,"quantizedEndStep":25,"isDrum":true},{"pitch":42,"velocity":80,"quantizedStartStep":25,"quantizedEndStep":26,"isDrum":true},{"pitch":42,"velocity":80,"quantizedStartStep":26,"quantizedEndStep":27,"isDrum":true},{"pitch":42,"velocity":80,"quantizedStartStep":27,"quantizedEndStep":28,"isDrum":true},{"pitch":42,"velocity":80,"quantizedStartStep":28,"quantizedEndStep":29,"isDrum":true},{"pitch":42,"velocity":80,"quantizedStartStep":30,"quantizedEndStep":31,"isDrum":true},{"pitch":42,"velocity":80,"quantizedStartStep":31,"quantizedEndStep":32,"isDrum":true}],"quantizationInfo":{"stepsPerQuarter":4},"totalQuantizedSteps":32});
}

function clickCell(event) {
  let button;
  
  // Check if this is a touch event or a mouse event.
  if (event.changedTouches) {
    button = document.elementFromPoint(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
  } else {
    button = event.target;
  }
  
  if (!button || button.localName !== 'button' || !isMouseDown) {
    return;
  }
  
  // Which cell?
  const x = parseInt(button.dataset.row);
  const y = parseInt(button.dataset.col);
  
  // If we're not erasing, sound it out.
  if (!button.classList.contains('on')) {
    playerBoard.playNoteDown({pitch: PITCHES[x], velocity: getVelocity(x), isDrum: true});
    setTimeout(() => playerBoard.playNoteUp({pitch: PITCHES[x], velocity: getVelocity(x), isDrum: true}), 150);
  }
  
  board.toggleCell(x, y);
}

async function groove() {
  stopAllPlayers();
  
  const sequence = board.getNoteSequence();
  const temp = parseFloat(inputTemperature.value);
  
  const z = await grooveModel.encode([sequence]);
  const recon = await grooveModel.decode(z, temp, undefined, 4, parseInt(inputTempo.value));
  modelSequence = recon[0];
  console.log(modelSequence);
  z.dispose();

  // TODO: this is where we fix the velocities if we need to.
  // The samples for low kick drum velocities are too quiet, so don't use them.
  for (let i = 0; i < modelSequence.notes.length; i++) {
    const note = modelSequence.notes[i];
    if (note.pitch === PITCHES[0]) {
      note.velocity = Math.max(note.velocity, 50);
    }
  }
  
  svgBoard.drawNoteSequence(modelSequence);
  btnPlayGroove.disabled = false;
  btnSaveGroove.disabled = false;
  play(true);
}

function reset() {
  board.reset();
  svgBoard.reset();
}

async function sample() {
  stopAllPlayers();
  
  const seq = await mvae.sample(1);
  board.reset();
  board.drawNoteSequence(seq[0]);
  svgBoard.reset();
  btnPlayGroove.disabled = true;
  btnSaveGroove.disabled = true;
}

function playOrPause(isplayerBoardSVG = false ) {
  const isPlaying = isplayerBoardSVG ? playerBoardSVG.isPlaying() : playerBoard.isPlaying(); 
  
  // Stop both players.
  playerHardStop = true;
  stopAllPlayers();
    
  if (!isPlaying) {
    // If we're stopped, start playing.
    playerHardStop = false;
    play(isplayerBoardSVG);
  }
}

function play(isplayerBoardSVG = false) {
  stopAllPlayers();
  const tempo = parseInt(inputTempo.value);
  if (isplayerBoardSVG) {
    btnPlayGroove.textContent = 'stop groove';
    playerBoardSVG.setTempo(tempo);
    playerBoardSVG.start(modelSequence);
  } else{
    btnPlay.textContent = 'stop';
    board.playEnd();
    document.getElementById('container').classList.add('playing');

    const sequence = board.getNoteSequence(true);
    playerBoard.start(sequence, tempo);
  }
}

function stop(isplayerBoardSVG = false) {
  if (isplayerBoardSVG) {
    btnPlayGroove.textContent = 'play groove';
    playerBoardSVG.stop();
    svgBoard.playEnd();
  } else {
    playerBoard.stop();
    btnPlay.textContent = 'play';
    board.playEnd();
    document.getElementById('container').classList.remove('playing');
  }
}

function stopAllPlayers() {
  stop();
  stop(true);
}

function save() {
  modelSequence.tempos[0].time = 0;
  saveAs(new File([mm.sequenceProtoToMidi(modelSequence)], 'groove.mid'));
}


function getVelocity(index) {
  return index == 0 ? 100 : 80; 
}