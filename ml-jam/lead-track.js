class LeadTrack {
  constructor(num_beats, num_measures) {
    this.model = new mm.MusicRNN(
      'https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/melody_rnn'
    );
    this.model.initialize();
    this.max_notes = 40;  // We keep a maximum of 40 notes at a time.
    this.temperature = 1.0;
    this.reset(num_beats, num_measures);
    this.note_to_midi = new Map([]);
    this.midi_to_note = new Map([]);
    let curr_midi_number = 24;  // C1
    for (let octave = 1; octave <= 7; octave++) {
      for (let key = 0; key < ALL_KEY_NAMES.length; key++) {
        this.note_to_midi.set(ALL_KEY_NAMES[key] + octave, curr_midi_number);
        this.midi_to_note.set(curr_midi_number, ALL_KEY_NAMES[key] + octave)
        curr_midi_number++;
      }
    }
  }
  
  reset(num_beats, num_measures) {
    this.num_beats = num_beats;
    this.num_measures = num_measures;
    if (this.part != null) {
      this.part.dispose();
    }
    this.part = null;
    this.melody = [];
    this.ml_notes = null;
    this.ml_melody = null;
    this.ml_ready = false;
    this.recording = false;
  }
  
  is_recording() {
    return this.recording;
  }
  
  set_temperature(val) {
    this.temperature = val;
  }
  
  play_note(note, duration) {
    let playable_note = note;
    let highlight_type = "play";
    if (this.is_ml_melody()) {
      playable_note = this.ml_melody.shift();
      highlight_type = "recorded";
      if (this.ml_melody.length == 0) {
        this.ml_ready = false;
        mode = "recording";
        updateMode();
      }
    }
    LEAD_INSTRUMENT.triggerAttackRelease(playable_note, duration);
    highlightKey("Lead" + playable_note, highlight_type);
  }
  
  add_note(time, note) {
    if (!this.recording) {
      return;
    }
    this.melody.push({time : time, note : note});
    if (this.melody.length > this.max_notes) {
      this.melody.shift();
    }
  }
  
  is_ml_melody() {
    return this.ml_ready && this.ml_melody.length > 0;
  }
  
  start() {
  }
  
  clear() {
    if (this.part != null) {
      this.part.dispose();
    }
    this.part = null;
    this.melody = [];
  }
  
  is_playing() {
    return this.ml_ready;
  }
  
  toggle_recording() {
    this.recording = !this.recording;
    if (this.recording) {
      this.melody = [];
    }
  }
  
  generateMLLead() {
    if (!this.recording || this.melody.length == 0) {
      return;
    }
    this.ml_notes = [];
    this.ml_melody = [];
    for (let i = 0; i < this.melody.length; i++) {
      if (this.note_to_midi.get(this.melody[i].note) > 83) {
        continue;  // Magenta doesn't like things 84 and up...
      }
      let split_time = this.melody[i].time.split(":");
      let current_measure = parseInt(split_time[0]);
      let current_beat = parseInt(split_time[1]);
      let current_sixteenth = parseInt(split_time[2]);
      let step = current_measure * this.num_beats * 4 + current_beat * 4 + current_sixteenth;
      this.ml_notes.push(
        {pitch: this.note_to_midi.get(this.melody[i].note),
         quantizedStartStep: step,
         quantizedEndStep: step + 1,
        });
    }
    let total_sequence_length = this.max_notes;
    let note_sequence = {
      notes: this.ml_notes,
      quantizationInfo: {stepsPerQuarter: 4},
      tempos: [{time: 0, qpm: 120}],
      totalQuantizedSteps: total_sequence_length
    };
    this.model.continueSequence(note_sequence, total_sequence_length, this.temperature)
      .then((sample) => this.set_generated_note_sequence(sample));
  }
  
  set_generated_note_sequence(sample) {
    for (let i = 0; i < sample.notes.length; i++) {
      if (!this.midi_to_note.has(sample.notes[i].pitch)) {
        continue;
      }
      this.ml_melody.push(this.midi_to_note.get(sample.notes[i].pitch));
    }
    this.ml_ready = true;
    document.getElementById("LeadPlayInner").style.visibility = "visible";
    document.getElementById("LeadPlayOuter").style.visibility = "visible";
    updateMode();
  }
  
  set_volume(val) {
    LEAD_INSTRUMENT.set("volume", val)
  }
}