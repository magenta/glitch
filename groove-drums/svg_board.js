class SVGBoard {
  constructor() { 
    this.reset();
  }

  reset() {
    this.svg = document.getElementById('visualizer');
    this.boardContainer = document.getElementById('container');
    this.svg.innerHTML = '';
  }
  
  drawNoteSequence(ns) {
    this.reset();
    
    // Need to find out exactly how wide the board is. The container's width can lie
    const rekt = this.boardContainer.getBoundingClientRect();
    const onePixel = document.querySelector('.pixel[data-row="0"][data-col="31"]').getBoundingClientRect();
    // The right point of the last pixel on a row, minus the starting padding of the whole container.
    const width = onePixel.right - rekt.left;
    this.svg.setAttribute('width', width);
    this.svg.setAttribute('height', rekt.height);
    
    //We draw 32 pixels, which covers 4s
    // => 32/4 = amount for 1s
    const timePerSecond = width / 4;

    for (let i = 0; i < ns.notes.length; i++) {
      const note = ns.notes[i];
      if (note.startTime < 0) {
        note.startTime = 0;
      }
      const row = PITCHES.indexOf(note.pitch);
      const pixelRekt = document.querySelectorAll(`.pixel[data-row="${row}"]`)[0].getBoundingClientRect();
      const y = pixelRekt.y - rekt.top;

      const r = this.drawRect(note.startTime * timePerSecond, y, pixelRekt.width, pixelRekt.height);

      r.setAttribute('data-start', note.startTime.toFixed(2));
      r.setAttribute('data-end', note.endTime.toFixed(2));

      this.svg.appendChild(r);
    }
  }

  playStep(note) {
    const s = note.startTime.toFixed(2);
    const e = note.endTime.toFixed(2);

    // Clear the previous step.
    const on =  document.querySelectorAll('#visualizer rect.active');
    for (let p = 0; p < on.length; p++) {
      on[p].removeAttribute('class');
      // Reset to the original size.
      on[p].setAttribute('width', on[p].getAttribute('data-width'));
      on[p].setAttribute('height', on[p].getAttribute('data-height'));
    }

    const r = this.svg.querySelectorAll(`rect[data-start="${s}"][data-end="${e}"]`);
    for (let i = 0; i < r.length; i++) {
      r[i].setAttribute('class', 'active');
      // Scale up the rect. SVG doesn't seem to have a max-height and max-width, so we can't 
      // do this in CSS without sometimes having huge looking rects.
      r[i].setAttribute('width', r[i].getAttribute('data-max-width'));
      r[i].setAttribute('height', r[i].getAttribute('data-max-height'));
    }
  }

  playEnd() {
    const r = this.svg.querySelector('rect.active');
    if (r) {
      r.removeAttribute('class');
      // Reset to the original size.
      r.setAttribute('width', r.getAttribute('data-width'));
      r.setAttribute('height', r.getAttribute('data-height'));
    }
  }
  
  drawRect(x,y, w, h) {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', Math.round(x));
    rect.setAttribute('y', Math.round(y));
    rect.setAttribute('width', w);
    rect.setAttribute('height', h);
    rect.setAttribute('data-width', w);
    rect.setAttribute('data-height', h);
    // Scale up the rect. SVG doesn't seem to have a max-height and max-width, so we can't 
    // do this in CSS without sometimes having huge looking rects.
    const maxH = Math.min(60, 1.5*h);
    const maxW = Math.min(60, 1.5*w);
    rect.setAttribute('data-max-width', maxW);
    rect.setAttribute('data-max-height', maxH);
    return rect;
  }
}
