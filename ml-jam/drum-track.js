class DrumTrack {
  constructor(num_beats, num_measures) {
    this.model = new mm.MusicRNN(
      'https://storage.googleapis.com/download.magenta.tensorflow.org/tfjs_checkpoints/music_rnn/drum_kit_rnn'
    );
    this.model.initialize();
    this.temperature = 1.5;
    this.reset(num_beats, num_measures);
    let drum_notes = Array.from(DRUM_NOTE_TO_NAME.keys());
    this.note_to_midi = new Map([]);
    this.midi_to_note = new Map([]);
    for (let i = 0; i < drum_notes.length; i++) {
      this.note_to_midi.set(drum_notes[i], mm.data.DEFAULT_DRUM_PITCH_CLASSES[i][0]);
      for (let j = 0; j < mm.data.DEFAULT_DRUM_PITCH_CLASSES[i].length; j++) {
        this.midi_to_note.set(mm.data.DEFAULT_DRUM_PITCH_CLASSES[i][j], drum_notes[i]);
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
    this.ml_melody = null;
    this.notes = null;
    this.note_sequence = null;
    this.initialize_melody();
    this.playing = false;
  }
  
  initialize_melody() {
    this.melody = [];
    for (let i = 0; i < num_measures; i++) {
      this.melody.push({time: i + ":0:0", note: "C1"});
      for (let j = 0; j < num_beats; j++) {
        for (let k = 0; k < 4; k += 2) {
          this.melody.push({time: i + ":" + j + ":" + k, note: "F#1"});
        }
      }
    }
  }
  
  set_temperature(val) {
    this.temperature = val;
  }
  
  add_note(time, note) {
    this.melody.push({time : time, note : note});
  }
  
  start() {
    let melody = this.melody;
    if (this.ml_melody != null) {
      melody = this.ml_melody;
    }
    this.part = new Tone.Part(function(time, event){
      DRUM_INSTRUMENT.triggerAttackRelease(event.note, time);
      
      Tone.Draw.schedule(function() {
        highlightDrum(event.note);
      }, time);
    }, melody).start("0:0:0");
    this.part.loop = true;
    this.part.loopEnd = this.num_measures + "m";
    this.playing = true;
    document.getElementById("DrumsRecord").style.visibility = "visible";
  }
  
  clear() {
    if (this.part != null) {
      this.part.dispose();
    }
    this.part = null;
    this.initialize_melody();
    this.ml_melody = null;
    this.playing = false;
  }
  
  has_ml_melody() {
    return this.ml_melody != null;
  }
  
  toggle() {
    if (this.melody.length == 0) {
      return;
    }
    if (this.part == null) {
      this.start()
      this.playing = true;
    } else {
      this.part.mute = !this.part.mute;
      this.playing = !this.part.mute;
    }
  }
  
  is_playing() {
    return this.playing;
  }
  
  is_recording() {
    return this.has_ml_melody();
  }
  
  deterministic() {
    if (this.melody.length == 0) { 
        return;
    }
    if (this.part != null) {
      this.part.dispose();
    }
    this.part = null;
    this.ml_melody = null;
    this.start();
    this.playing = true;
  }
  
  generate_ml_drums() {
    if (this.melody.length == 0) {
      return null;
    }
    this.notes = [];
    for (let i = 0; i < this.melody.length; i++) {
      if (!this.note_to_midi.has(this.melody[i].note)) {
        continue;
      }
      let split_time = this.melody[i].time.split(":");
      let current_measure = parseInt(split_time[0]);
      let current_beat = parseInt(split_time[1]);
      let current_sixteenth = parseInt(split_time[2]);
      let step = current_measure * this.num_beats * 4 + current_beat * 4 + current_sixteenth;
      this.notes.push(
        {pitch: this.note_to_midi.get(this.melody[i].note),
         quantizedStartStep: step,
         quantizedEndStep: step + 1,
         isDrum: true
        })
    }
    let total_sequence_length = this.num_measures * this.num_beats * 4;
    this.note_sequence = {
      notes: this.notes,
      quantizationInfo: {stepsPerQuarter: 4},
      tempos: [{time: 0, qpm: 120}],
      totalQuantizedSteps: total_sequence_length
    };
    this.model.continueSequence(this.note_sequence, total_sequence_length, this.temperature)
      .then((sample) => this.set_generated_note_sequence(sample));
  }
  
  set_generated_note_sequence(sample) {
    this.ml_melody = [];
    for (let i = 0; i < sample.notes.length; i++) {
      if (!this.midi_to_note.has(sample.notes[i].pitch)) {
        continue;
      }
      let start_step = sample.notes[i].quantizedStartStep;
      let measure = Math.floor(start_step / (this.num_beats * 4));
      let total_sixteenths = start_step % (this.num_beats * 4);
      let beat = Math.floor(total_sixteenths / 4);
      let sixteenth = total_sixteenths % 4;
      this.ml_melody.push({
        time: measure + ":" + beat + ":" + sixteenth,
        note: this.midi_to_note.get(sample.notes[i].pitch)
      })
    }
    this.part.dispose();
    this.start();
    togglePlay();
    recordRestore("DrumsRecord", drum_track);
  }
  
  set_volume(val) {
    DRUM_INSTRUMENT.set("volume", val)
  }
}