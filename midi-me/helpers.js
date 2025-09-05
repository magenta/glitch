const mm = window.mm;

function getInstruments(ns) {
  return splitSequence(ns);
}

function getMelody(seqs) {
  // instrument, polyphony, notes, range;
  const instruments = [];
  
  // Some rules.
  const POLYPHONY_EPSILON = 5;
  const DISTINCT_EPSILON = 5;
  const MIN_PITCH = 49;
  
  for (let i = 0; i < seqs.length; i++) {
    const ns = seqs[i];
    const program = ns.notes[0].program;
    const notes = ns.notes.length;
    const polyphony = getPolyphony(ns);
    const pitches = ns.notes.map(n => n.pitch);
    const distinctPitches = [...new Set(pitches)].length;
    const minPitch = Math.min(...pitches);
    const maxPitch = Math.max(...pitches);
    instruments.push([ns.notes[0].instrument, 
                      {polyphony: polyphony < POLYPHONY_EPSILON ? 0 : polyphony, 
                       notes: ns.notes.length, 
                       distinct: distinctPitches > DISTINCT_EPSILON ? 1 : -1,
                       inRange: minPitch >= MIN_PITCH ? 1 : -1}]);
  }
  
  //  Sort by magic.
  instruments.sort((a, b) => {
    const result = 
          b[1].inRange - a[1].inRange ||       // pitches are in range 
          b[1].distinct - a[1].distinct ||       // pitches are distinct enough
          a[1].polyphony - b[1].polyphony ||   // smallest polyphony
          b[1].notes - b[1].notes;             // most notes
    return result;
  });
  
  return seqs[instruments[0][0]];
}

function splitSequence(ns) {
  const seqs = [];
  let instruments = [];
  for (let note of ns.notes) {
    if (instruments.indexOf(note.instrument) === -1) {
      instruments.push(note.instrument);
    }
  }
  for (let i of instruments) {
    seqs.push(extractForInstrument(ns, i));
  }
  return seqs;
}


function extractForInstrument(ns, instrument) {
  const out = mm.NoteSequence.create(ns);
  out.notes = [];
  
  for (let note of ns.notes) {
    if (note.instrument === instrument) {
      // Make a copy just in case.
      const n = mm.NoteSequence.Note.create(note);
      out.notes.push(n);
    }
  }
  return out;
}

function getPolyphony(ns) {
  // Is it almost monophonic?
  let polyphony = 0;
  const qs = mm.sequences.quantizeNoteSequence(ns, 4);
  const sortedNotes = qs.notes.sort((n1, n2) => {
    if (n1.quantizedStartStep === n2.quantizedStartStep) {
      return n2.pitch - n1.pitch;
    }
    return n1.quantizedStartStep - n2.quantizedStartStep;
  });
  
  let lastStart = -1;
  sortedNotes.forEach(n => {
    if (n.quantizedStartStep === lastStart) {
      polyphony++;
    }
    lastStart = n.quantizedStartStep;
  });
  return polyphony;
}

function trimSilence(ns) {
  for (let i = 0; i < ns.length; i++) {
    const notes = ns[i].notes.sort((n1, n2) => n1.startTime - n2.startTime);
    const silence = notes[0].startTime;
    for (let j = 0; j < ns[i].notes.length; j++) {
      ns[i].notes[j].startTime -= silence;
      ns[i].notes[j].endTime -= silence;
    }
  }
}