class BassTrack {
  constructor(num_measures) {
    this.reset(num_measures);
  }
  
  reset(num_measures) {
    this.num_measures = num_measures;
    this.part = null;
    this.melody = [];
    this.playing = false;
    this.recording = false;
  }
  
  play_note(note, duration) {
    BASS_INSTRUMENT.triggerAttackRelease(note, duration);
    highlightKey("Bass" + note, "play");
  }
  
  add_note(time, note, duration) {
    this.melody.push({time : time, note : note, dur: duration});
    highlightKey("Bass" + note, "recorded");
  }
  
  start() {
    this.part = new Tone.Part(function(time, event){
      BASS_INSTRUMENT.triggerAttackRelease(event.note, event.dur, time);
      
      Tone.Draw.schedule(function() {
        highlightKey("Bass" + event.note, "recorded");
      }, time);
    }, this.melody).start("0:0:0");
    this.playing = true;
    this.part.loop = true;
    this.part.loopEnd = this.num_measures + "m";
  }
  
  clear() {
    if (this.part != null) {
      this.part.dispose();
    }
    this.part = null;
    this.melody = [];
  }
  
  is_playing() {
    return this.playing;
  }
  
  is_recording() {
    return this.recording;
  }
  
  toggle() {
    if (this.melody.length == 0) {
      return;
    }
    if (this.part == null) {
      this.start();
      this.playing = true;
    } else {
      this.part.mute = !this.part.mute;
      this.playing = !this.part.mute;
    }
  }
  
  set_volume(val) {
    BASS_INSTRUMENT.set("volume", val)
  }
}