var CLICK_LAST_ONE_BEAT = 0.0;
var CLICK_MUTED = false;

class ClickTrack {
  constructor(num_beats, num_measures) {
    this.part = null;
    this.reset(num_beats, num_measures);
  }
  
  reset(num_beats, num_measures) {
    if (this.part != null) {
      this.part.dispose();
    }
    this.click_events = [];
    for (let i = 0; i < num_measures; i++) {
      for (let j = 0; j < num_beats; j++) {
        let note = "E3";
        if (i == 0 && j == 0) {
          note = "C3";
        } else if (j == 0) {
          note = "D3";
        }
        this.click_events.push({time: i + ":" + j, note: note, measure_num: i, beat_num: j})
      }
    }
    this.part = new Tone.Sequence(function(time, event) {
      let note = event.note;
      if (CLICK_MUTED) {
        note = "?";
      }
      CLICK_INSTRUMENT.triggerAttack(note, time);
      
      Tone.Draw.schedule(function() {
        if (event.measure_num == 0 && event.beat_num == 0) {
          CLICK_LAST_ONE_BEAT = time;
          updateRecordStatus();
        }
        const clickElement = document.querySelector('#click' + event.measure_num + event.beat_num);
        clickElement.classList.add("active");
        setTimeout(() => {
          clickElement.classList.remove("active");
        }, 100);
      }, time);
    }, this.click_events).start("0:0:0");
  }
  
  is_playing() {
    return Tone.Transport.state == 'started';
  }
  
  toggle() {
    CLICK_MUTED = !CLICK_MUTED;
  }
  
  set_volume(val) {
    CLICK_INSTRUMENT.set("volume", val)
  }
}