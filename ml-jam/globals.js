const PLAY_GREEN = "rgb(89, 159, 94)";

const WHITE_KEY_NAMES = ["C", "D", "E", "F", "G", "A", "B"];
const WHITE_KEY_LETTERS = ["a", "s", "d", "f", "g", "h", "j"]
const BLACK_KEY_NAMES = ["C#", "D#", "?", "F#", "G#", "A#", "?"];
const BLACK_KEY_LETTERS = ["w", "e", "?", "t", "y", "u", "?"];
const ALL_KEY_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const TIME_SIGNATURES = [2, 3, 4, 5, 6, 7, 8, 9];

const SAMPLES = new Map([
  ["click0", "https://cdn.glitch.com/50c809c6-0bcb-4d15-b0cd-aee591f1225a%2Fclick0.wav"],
  ["click1", "https://cdn.glitch.com/50c809c6-0bcb-4d15-b0cd-aee591f1225a%2Fclick1.wav"],
  ["click2", "https://cdn.glitch.com/50c809c6-0bcb-4d15-b0cd-aee591f1225a%2Fclick2.wav"],
  ["click3", "https://cdn.glitch.com/50c809c6-0bcb-4d15-b0cd-aee591f1225a%2Fclick3.wav"],
  ["kick", "https://cdn.glitch.com/50c809c6-0bcb-4d15-b0cd-aee591f1225a%2Fkick.wav"],
  ["snare", "https://cdn.glitch.com/50c809c6-0bcb-4d15-b0cd-aee591f1225a%2Fsnare.wav"],
  ["clhat", "https://cdn.glitch.com/50c809c6-0bcb-4d15-b0cd-aee591f1225a%2Fclhat.wav"],
  ["ophat", "https://cdn.glitch.com/50c809c6-0bcb-4d15-b0cd-aee591f1225a%2Fophat.wav"],
  ["tom1", "https://cdn.glitch.com/50c809c6-0bcb-4d15-b0cd-aee591f1225a%2Ftom1.wav"],
  ["tom2", "https://cdn.glitch.com/50c809c6-0bcb-4d15-b0cd-aee591f1225a%2Ftom2.wav"],
  ["tom3", "https://cdn.glitch.com/50c809c6-0bcb-4d15-b0cd-aee591f1225a%2Ftom3.wav"],
  ["crash", "https://cdn.glitch.com/50c809c6-0bcb-4d15-b0cd-aee591f1225a%2Fcrash.wav"],
  ["ride", "https://cdn.glitch.com/50c809c6-0bcb-4d15-b0cd-aee591f1225a%2Fride.wav"],
]);

var CLICK_VOLUME = new Tone.Volume();

const CLICK_INSTRUMENT = new Tone.Sampler({
  "C3": SAMPLES.get("click0"),
  "D3": SAMPLES.get("click1"),
  "E3": SAMPLES.get("click2"),
  "F3": SAMPLES.get("click3"),
}).toMaster();

const TOUR_STEPS = [
  {x: 60, y: 40, width: 700, height: 55, toshow: "Toolbar", text: "<-- First click on this play button to start the click track"},
  {x: 130, y: 40, width: 1200, height: 70, toshow: null, text: "<-- This will tell you what instrument is currently enabled. When recording, the text will be red.<br>&nbsp;&nbsp;&nbsp;&nbsp;When using ML for generating Lead melodies, the text will be blue."},
  {x: 250, y: 40, width: 500, height: 55, toshow: null, text: "<-- This allows you to turn the click on/off"},
  {x: 250, y: 100, width: 1100, height: 105, toshow: null, text: "^^^ This section at the top shows two measures of click track ^^^<br>&nbsp;&nbsp;&nbsp;&nbsp;The high pitch click indicates the first beat of the first measure.<br>&nbsp;&nbsp;&nbsp;&nbsp;The clap indicates the first beat of the second measure."},
  {x: 60, y: 100, width: 900, height: 240, toshow: "Bass", text: "<-- This will be the bass track"},
  {x: 60, y: 100, width: 900, height: 240, toshow: null, text: "<-- You can click on the 'bass' letters to enable the track (it will turn green).<br>&nbsp;&nbsp;&nbsp;&nbsp;Notice at the top the status now says 'Bass'!"},
  {x: 60, y: 100, width: 900, height: 240, toshow: null, text: "When you are in 'free-play' mode the keys you play will be green.<br>When you are in 'record' mode (or when in loop-playback mode), they keys will be red.<br>Try playing on a few keys!"},
  {x: 60, y: 240, width: 700, height: 70, toshow: null, text: "<-- Press the record button to record a two-measure bassline (you can use the keys, a MIDI keyboard, and/or your computer keyboard)"},
  {x: 60, y: 240, width: 700, height: 70, toshow: null, text: "The bassline will loop over the two measures you recorded. It may sound a bit different because we have to quantize it for the ML models!"},
  {x: 60, y: 240, width: 700, height: 70, toshow: null, text: "The keys from the recorded loop will be red, but you can continue playing the keyboard (and keys will light up as green)."},
  {x: 60, y: 300, width: 700, height: 50, toshow: null, text: "<-- This allows you to turn the recorded bass loop on/off"},
  {x: 1120, y: 210, width: 550, height: 50, toshow: null, text: "Each track will have this slider to adjust its volume -->"},
  {x: 60, y: 360, width: 900, height: 240, toshow: "Drums", text: "<-- This will be the drums track"},
  {x: 60, y: 560, width: 900, height: 50, toshow: null, text: "<-- Press the play button to generate a deterministic groove based on your bassline"},
  {x: 460, y: 450, width: 1150, height: 50, toshow: null, text: "Use the thermometer slider to adjust the temperature for the machine learning (ML) model. (Higher means crazier!) -->"},
  {x: 60, y: 500, width: 700, height: 70, toshow: null, text: "<-- Press the record button to generate a new machine learning drumbeat<br>&nbsp;&nbsp;&nbsp;&nbsp;based on the current drumbeat (might pause playback for a bit)"},
  {x: 60, y: 500, width: 900, height: 70, toshow: null, text: "<-- If you click this again it will erase the ML beat and go back to the original beat<br>&nbsp;&nbsp;&nbsp;(and then you can click it again for another ML beat)"},
  {x: 60, y: 610, width: 700, height: 240, toshow: "Chords", text: "<-- This will be the chords track"},
  {x: 60, y: 610, width: 700, height: 240, toshow: "Chords", text: "<-- Just like with the bass track, you can click on the letters to enable this instrument (see mode change at the top)"},
  {x: 60, y: 750, width: 700, height: 50, toshow: null, text: "<-- Press the record button to record a two-measure set of chords"},
  {x: 60, y: 810, width: 700, height: 50, toshow: null, text: "<-- This allows you to turn the recorded chord loop on/off"},
  {x: 60, y: 870, width: 700, height: 240, toshow: "Lead", text: "<-- This will be the lead track"},
  {x: 60, y: 1010, width: 900, height: 50, toshow: null, text: "<-- Press the record button to begin storing your notes in a circular buffer of length 40"},
  {x: 460, y: 960, width: 1150, height: 50, toshow: null, text: "Use the thermometer slider to adjust the temperature for the machine learning (ML) model. (Higher means crazier!) -->"},
  {x: 60, y: 1040, width: 800, height: 80, toshow: null, text: "&nbsp;&nbsp;&nbsp;&nbsp;Press the play button to generate a new melody (might pause playback a bit).<br><-- Once it's ready you can hit any key and the melody comes from the ML model!"},
  {x: 60, y: 1040, width: 800, height: 80, toshow: null, text: "When the melody is coming from the ML model, the keys will light up red and the status at the top will also be in red."},
  {x: 230, y: 360, width: 350, height: 240, toshow: null, text: "That's it! Have fun!"}
];

const BASS_INSTRUMENT = new Tone.FMSynth({
  "harmonicity" : 1,
  "modulationIndex" : 3.0,
  "carrier" : {
    "oscillator" : {
      "type" : "sawtooth",
      "partials" : [0.25, 0.25, 0.5, 0.5]
    },
    "envelope" : {
      "attack" : 0.001,
      "decay" : 0.2,
      "sustain" : 0,
      "release" : 0.1
    },
  },
  "modulator" : {
    "oscillator" : {
      "type" : "sawtooth",
      "partials" : [0.25, 0.25, 0.5, 0.5]
    },
    "envelope" : {
      "attack" : 0.001,
      "decay" : 0.2,
      "sustain" : 0.3,
      "release" : 0.01
    },
  }
}).toMaster();

const DRUM_INSTRUMENT = new Tone.Sampler({
  "C1": SAMPLES.get("kick"),
  "D1": SAMPLES.get("snare"),
  "F#1": SAMPLES.get("clhat"),
  "A#1": SAMPLES.get("ophat"),
  "A1": SAMPLES.get("tom3"),
  "C2": SAMPLES.get("tom2"),
  "D2": SAMPLES.get("tom1"),
  "A2": SAMPLES.get("crash"),
  "B2": SAMPLES.get("ride"),
}).toMaster();


const LOWPASS_FILTER = new Tone.LowpassCombFilter({"delay": 0.0}).toMaster();

const COMPRESSOR = new Tone.Compressor().toMaster();


const LEAD_INSTRUMENT = new Tone.MonoSynth({
  "volume": -10,
  "oscillator": {
    "type" : "square4"
  },
  "envelope" : {
    "attack" : 0.1,
  },
  "filter" : {
    "Q" : 1,
    "type" : "lowpass",
    "rolloff" : -24,
  },
  "filterEnvelope" : {
    "exponent" : 0,
  }
}).connect(COMPRESSOR).toMaster();

const FILTER = new Tone.Filter({
  type: "bandpass",
  frequency: 440,
  Q: 1,
}).toMaster();


const CHORDS_INSTRUMENT = new Tone.PolySynth({
  "volume": -10,
  "oscillator": {
    "type": "sine",
    "partials": [0.99, 1, 1.001, 1.008],
  },
  "envelope": {
    "attack": 0.01,
    "decay": 0.1,
    "release": 0.8,
    "sustain": 1.0,
    "decayCurve": "exponential",
    "releaseCurve": "exponential",
  }
}).connect(LOWPASS_FILTER).connect(COMPRESSOR).toMaster();

const DRUM_NOTE_TO_NAME = new Map([
  ["C1", ["Kick"]],
  ["D1", ["Snare"]],
  ["F#1", ["HiHatUpperInner", "HiHatLowerInner"]],
  ["A#1", ["HiHatUpperInner", "HiHatLowerInner"]],
  ["A1", ["Tom3"]],
  ["C2", ["Tom2"]],
  ["D2", ["Tom1"]],
  ["A2", ["CrashInner"]],
  ["B2", ["RideInner"]],
]);

const KEYNOTE_MAPPINGS = new Map([
  [97, "C"],  // a
  [119, "C#"],  // w
  [115, "D"],  // s
  [101, 'D#'],  // e
  [100, "E"],  // d
  [102, "F"],  // f
  [116, "F#"],  // t
  [103, "G"],  // g
  [121, "G#"],  // y
  [104, "A"],  // h
  [117, "A#"],  // u
  [106, "B"],  // j
  [65, "C"],  // A
  [87, "C#"],  // W
  [83, "D"],  // S
  [69, "D#"],  // E
  [68, "E"],  // D
  [70, "F"],  // F
  [84, "F#"],  // T
  [71, "G"],  // G
  [89, "G#"],  // Y
  [72, "A"],  // H
  [85, "A#"],  // U
  [74, "B"],  // J
]);

const MIDI_MAPPINGS = new Map([]);
let octave = 0;
let curr_pos = 9;  // To start in A0.
for (let midi_note = 21; midi_note <= 108; midi_note++) {
  MIDI_MAPPINGS.set(midi_note, ALL_KEY_NAMES[curr_pos] + octave);
  curr_pos += 1;
  if (curr_pos == ALL_KEY_NAMES.length) {
    octave += 1;
    curr_pos = 0;
  }
}