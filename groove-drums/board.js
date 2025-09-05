const PIXELS_WIDTH = 32;
const PITCHES = [36, 38, 42, 46, 45, 48, 50, 49, 51];

/***********************************
 * Board of dots
 ***********************************/
class Board {
  constructor() {
    this.data = [];
    this.ui = {}; // Gets populated by this.reset().
    this.reset();
    this.isPlaying = false;
  }

  reset() {
    this.data = [];
    this.ui.container = document.getElementById('container');
    this.ui.container.innerHTML = '';

    // Recreate the board.
    for (let i = 0; i < PITCHES.length; i++) {
      const pitch = PITCHES[i];
      
      // Create a row of pixels.
      this.data.push([]);
      const rowEl = document.createElement('div');
      rowEl.classList.add('row');
      rowEl.dataset.pitch = pitch;
      this.ui.container.appendChild(rowEl);

      for (let j = 0; j < PIXELS_WIDTH; j++) {
        this.data[i][j] = {on: 0};
        const button = document.createElement('button');
        button.setAttribute('aria-label', 'cell, empty');
        button.classList.add('pixel');
        button.dataset.row = i;
        button.dataset.col = j;
        button.dataset.pitch = pitch;
        
        rowEl.appendChild(button);
      }
    }
    this.ui.rows = document.querySelectorAll('.container > .row');
  }

  // Toggles a particular pixel from on to off.
  toggleCell(i, j) {
    const uiButton = document.querySelector(`.pixel[data-row="${i}"][data-col="${j}"]`);
    if (!uiButton) {
      return;
    }
  
    const row = uiButton.parentElement;
    if (row.classList.contains('hidden')) {
      return;
    }
        
    const dot = this.data[i][j];
    const pitch = PITCHES[i];
    
    if (dot.on === 0) {
      dot.on = 1;
      this.voiceButton(uiButton);
    } else {
      dot.on = 0;
      this.resetButton(uiButton);
    }
  }

  resetButton(uiButton) {
    uiButton.setAttribute('class', 'pixel');
    uiButton.setAttribute('aria-label', 'cell, empty');
  }

  voiceButton(uiButton) {
    uiButton.setAttribute('aria-label', `cell on`);
    uiButton.setAttribute('class', `pixel on`);
  }

  getNoteSequence(forPlaying=false) {
    const sequence = {notes:[], quantizationInfo: {stepsPerQuarter: 4}};
    
    for (let i = 0; i < PITCHES.length; i++) {
      const row = document.querySelector(`.row[data-pitch="${PITCHES[i]}"]`);
      
      if (row.classList.contains('hidden')) {
        continue;
      }
      
      for (let j = 0; j < PIXELS_WIDTH; j++) {
        // This note is on.
        if (this.data[i][j].on > 0) {
          sequence.notes.push(
            { pitch: PITCHES[i],
              velocity: getVelocity(i),
              quantizedStartStep: j,
              quantizedEndStep: j + 1,
              isDrum: true
            },
          );
        }
      }
    }
    
    if (forPlaying) {
      // Add a silent note on every time step so that we can draw a bar.
      for (let j = 0; j < PIXELS_WIDTH; j++) {
        sequence.notes.push(
          { pitch: PITCHES[0],
            isDrum: true,
            velocity: -1,
            quantizedStartStep: j,
            quantizedEndStep: j + 1
          },
        );
      }
    }
    
    sequence.totalQuantizedSteps = PIXELS_WIDTH;
    return sequence;
  }
  
  drawNoteSequence(ns) {
    this.reset();
    for(let n = 0; n < ns.notes.length; n++) {
      const note = ns.notes[n];
      const r = PITCHES.indexOf(note.pitch);
      const c = note.quantizedStartStep
      this.data[r][c].on = 1;
      const uiButton = document.querySelector(`.pixel[data-row="${r}"][data-col="${c}"]`);
      this.voiceButton(uiButton);
    }
  }

  playStep(note) {
    const r = PITCHES.indexOf(note.pitch);
    const c = note.quantizedStartStep;
  
    // Clear the previous step.
    const on =  document.querySelectorAll('.container .pixel.active, .pixel.bar');
    for (let p = 0; p < on.length; p++) {
      on[p].classList.remove('bar');
      if (on[p].dataset.col < c) {
        on[p].classList.remove('active');
      }
    }
  
    // Add a bar.
    const bar = document.querySelectorAll(`.pixel[data-col="${c}"]`);
    for (let p = 0; p < bar.length; p++) {
      bar[p].classList.add('bar');
    }
    
    // Add the active pixels, which overrides the bar if it exists.
    const pixels = document.querySelectorAll(`.pixel.on[data-row="${r}"][data-col="${c}"]`);
    for (let p = 0; p < pixels.length; p++) {
      pixels[p].classList.remove('bar');
      pixels[p].classList.add('active');
    }
  }

  playEnd() {
    const on = document.querySelectorAll('.container .pixel.active, .pixel.bar');
    for (let p = 0; p < on.length; p++) {
      on[p].classList.remove('bar');
      on[p].classList.remove('active');
    }
  }
  
  showAll() {
    const rows = document.querySelectorAll('.container .row');
    for (let i = 0; i < rows.length; i++) {
      rows[i].classList.remove('hidden');
    }
  }
  
  showFirst() {
    const rows = document.querySelectorAll('.container .row');
    for (let i = 0; i < rows.length; i++) {
      rows[i].classList.add('hidden');
    }
    rows[0].classList.remove('hidden');
  }
  
  getVelocity(index) {
    return index == 0 ? 100 : 80; 
  }
}
