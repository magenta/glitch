var mode = "free";
var instrument = null;
var last_one_beat = -1;
var listening_to_keypress = true;

buildTour();
drawWelcome();

var tour_step = 0;
var doing_tour = true;
const num_measures = 2;
var num_beats = 4;
var advanced_user = false;  // For multiple time-signatures, tempo... not quite working yet.
var click_track = new ClickTrack(num_beats, num_measures);
var drum_track = new DrumTrack(num_beats, num_measures);
var lead_track = new LeadTrack(num_beats, num_measures);
var bass_track = new BassTrack(num_measures);
var chords_track = new ChordsTrack(num_measures);
var player_started = false;
var click_on = true;
createToolbar();
createClickArea();
createPianoRow("Bass", "bass", bass_track, 2);
createDrumsRow();
createPianoRow("Chords", "harm", chords_track, 3);
createPianoRow("Lead", "lead", lead_track, 4);

// Functions to connect to MIDI controllers.
function getMIDIMessage(midiMessage) {
  if (midiMessage.data[0] == 144) {  // Note on event.
    triggerNote(MIDI_MAPPINGS.get(midiMessage.data[1]));
  }
}

navigator.requestMIDIAccess().then(
  function(access) {
    for (var input of access.inputs.values())
        input.onmidimessage = getMIDIMessage;
  },
  function() {
    console.log("Unable to get MIDI access!");
  });

window.mobilecheck = function() {
  var check = false;
  (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
  return check;
};

if (window.mobilecheck()) {
  window.location = "./no-mobile.html";
}

// Detecting keypresses on keyboard.
document.onkeypress = detectkeys;
function detectkeys(e) {
  if (!listening_to_keypress) {
    return;
  }
  listening_to_keypress = false;
  if (KEYNOTE_MAPPINGS.has(e.keyCode)) {
    let notePlaying = KEYNOTE_MAPPINGS.get(e.keyCode);
    if (instrument == "Bass") {
      notePlaying += "2";
    } else if (instrument == "Chords") {
      notePlaying += "3";
    } else if (instrument == "Lead") {
      notePlaying += "4";
    } else {
      return;
    }
    triggerNote(notePlaying);
  } else if (instrument == "Lead" && lead_track.ml_ready) {
    triggerNote(e.keyCode);
  }
}

document.onkeyup = function(e) {
  listening_to_keypress = true;
}

function skipTour() {
  document.getElementById("TourStep" + (tour_step - 1)).style.visibility = "hidden";
  document.getElementById("TourStep" + (tour_step - 1)).style.zIndex = 0;
  doing_tour = false;
  let rows = ["Toolbar", "Bass", "Drums", "Chords", "Lead"];
  for (let i = 0; i < rows.length; i++) {
    document.getElementById(rows[i]).style.visibility = "visible";
  }
}

function buildTour() {
  let tour_screen = document.getElementById("TourScreen");
  for (let i = 0; i < TOUR_STEPS.length; i++) {
    let tour_div = document.createElement("div");
    tour_div.classList.add("TourDiv");
    tour_div.id = "TourStep" + i;
    tour_div.style.width = TOUR_STEPS[i].width + "px";
    tour_div.style.height = TOUR_STEPS[i].height + "px";
    tour_div.style.left = TOUR_STEPS[i].x + "px";
    tour_div.style.top = TOUR_STEPS[i].y + "px";
    tour_div.innerHTML = TOUR_STEPS[i].text;
    let next_step = document.createElement("div");
    next_step.classList.add("StepNav");
    next_step.id = tour_div.id + "Next";
    next_step.innerHTML = "Next step";
    next_step.style.left = "40px";
    next_step.onmouseover = function() { mouseTourButton("on", next_step.id); }
    next_step.onmouseout = function() { mouseTourButton("off", next_step.id); }
    next_step.onclick = function() { takeTourStep(); }
    tour_div.appendChild(next_step);
    let skip = document.createElement("div");
    skip.classList.add("StepNav");
    skip.id = tour_div.id + "Skip";
    skip.innerHTML = "Skip Tour";
    skip.style.left = "160px";
    skip.onmouseover = function() { mouseTourButton("on", skip.id); }
    skip.onmouseout = function() { mouseTourButton("off", skip.id); }
    skip.onclick = function() { skipTour(); }
    tour_div.appendChild(skip);
    tour_screen.appendChild(tour_div);
  }
}

function takeTourStep() {
  if (!doing_tour || tour_step < 0) {
    return;
  }
  if (tour_step > 0) {
    document.getElementById("TourStep" + (tour_step - 1)).style.visibility = "hidden";
    document.getElementById("TourStep" + (tour_step - 1)).style.zIndex = 0;
  }
  if (tour_step == TOUR_STEPS.length) {
    tour_step = -1;
    return;
  }
  if (TOUR_STEPS[tour_step].toshow != null) {
    document.getElementById(TOUR_STEPS[tour_step].toshow).style.visibility = "visible";
  }
  document.getElementById("TourScreen").style.visibility = "visible";
  let step = document.getElementById("TourStep" + tour_step);
  step.style.visibility = "visible";
  step.style.zIndex = 7;
  tour_step++;
}

function mouseTourButton(type, id) {
  if (type == "on") {
    document.getElementById(id).style.background = "white";
    document.getElementById(id).style.color = "black";
  } else {
    document.getElementById(id).style.background = "rgb(82, 138, 229)";
    document.getElementById(id).style.color = "white";
  }
}

function drawWelcome() {
  let title_div = document.createElement("div");
  title_div.id = "WelcomeTitle";
  let title = document.createElement("h1");
  title.innerHTML = "Welcome to ML-Jam!";
  title_div.appendChild(title);
  let welcome_div = document.getElementById("WelcomeScreen");
  welcome_div.appendChild(title_div);
  let instructions_div = document.createElement("div");
  let steps = [
    "If this is your first time using this tool, I highly recommend following the tour,",
    "Otherwise, feel free to skip the tour and start jamming!",
  ]
  if (window.innerWidth < 1718) {
    steps.push("(By the way, I noticed your window is narrower than my pianos, so don't forget to scroll left/right to make sure you don't miss anything!)")
  }
  for (let i = 0; i < steps.length; i++) {
    let p = document.createElement("p");
    p.innerHTML = steps[i];
    instructions_div.appendChild(p);
  }
  welcome_div.appendChild(instructions_div);
  let tour_div = document.createElement("div");
  tour_div.classList.add("TourButton");
  tour_div.id = "TakeTour";
  tour_div.style.marginTop = "10px";
  tour_div.style.marginLeft = "100px";
  tour_div.innerHTML = "Take the tour";
  tour_div.onclick = function() { closeWelcome(true); }
  tour_div.onmouseover = function() { mouseTourButton("on", "TakeTour"); }
  tour_div.onmouseout = function() { mouseTourButton("off", "TakeTour"); }
  welcome_div.appendChild(tour_div);
  let no_tour_div = document.createElement("div");
  no_tour_div.id = "NoTour";
  no_tour_div.style.marginTop = "10px";
  no_tour_div.style.marginLeft = "230px";
  no_tour_div.classList.add("TourButton");
  no_tour_div.innerHTML = "Skip the tour";
  no_tour_div.onclick = function() { closeWelcome(false); }
  no_tour_div.onmouseover = function() { mouseTourButton("on", "NoTour"); }
  no_tour_div.onmouseout = function() { mouseTourButton("off", "NoTour"); }
  welcome_div.appendChild(no_tour_div);
}

function closeWelcome(do_tour) {
  doing_tour = do_tour;
  document.getElementById("WelcomeScreen").style.visibility = "hidden";
  document.getElementById("DAW").style.visibility = "visible";
  if (do_tour) {
    let rows = ["Toolbar", "Bass", "Drums", "Chords", "Lead"];
    for (let i = 0; i < rows.length; i++) {
      document.getElementById(rows[i]).style.visibility = "hidden";
    }
  }
  takeTourStep();
}

function showWelcome() {
  document.getElementById("WelcomeScreen").style.visibility = "visible";
  document.getElementById("DAW").style.visibility = "hidden";
}

function reInitializeTracks() {
  click_track.reset(num_beats, num_measures);
  drum_track.reset(num_beats, num_measures);
  lead_track.reset(num_beats, num_measures);
  bass_track.reset(num_measures);
  chords_track.reset(num_measures);
}

function createClickArea() {
  let toolbar = document.getElementById("Toolbar");
  let old_click_area = document.getElementById("ClickArea");
  if (old_click_area != null) {
    toolbar.removeChild(old_click_area);
  }
  let click_area = document.createElement("div");
  click_area.classList.add("ClickArea");
  click_area.id = "ClickArea";
  let click_width = (100.0 / num_beats) + "%";
  for (let i = 0; i < num_measures; i++) {
    let measure_div = document.createElement("div");
    measure_div.classList.add("Measure");
    for (let j = 0; j < num_beats; j++) {
      let click_div = document.createElement("div");
      click_div.id = "click" + i + j;
      click_div.classList.add("Click");
      click_div.style.width = click_width;
      measure_div.appendChild(click_div);
    }
    click_area.appendChild(measure_div);
  }
  toolbar.appendChild(click_area);
}

function updateTimeSignature(new_time_signature) {
  let li_numerator = document.getElementById("SelectedNumerator");
  li_numerator.innerHTML = new_time_signature;
  let ul_numerator = document.createElement("ul");
  ul_numerator.classList.add("dropdown");
  for (let i = 0; i < TIME_SIGNATURES.length; i++) {
    let li_ts = document.createElement("li");
    let a_ts = document.createElement("a");
    a_ts.onclick = function() { updateTimeSignature(TIME_SIGNATURES[i]); };
    a_ts.innerHTML = TIME_SIGNATURES[i];
    li_ts.appendChild(a_ts);
    ul_numerator.appendChild(li_ts);
  }
  li_numerator.appendChild(ul_numerator);
  num_beats = new_time_signature;
  createClickArea();
  reInitializeTracks();
}

function updateTempo(new_tempo) {
  Tone.Transport.bpm.setValueAtTime(new_tempo, Tone.Transport.now());
}

function createToolbar() {
  let toolbar = document.createElement("div");
  toolbar.id = "Toolbar";
  let play_div = document.createElement("div");
  play_div.id = "PlayDiv"
  let play_button_outer = document.createElement("div");
  play_button_outer.id = "ClickPlayOuter";
  play_button_outer.classList.add("PlayButtonOuter");
  play_button_outer.style.marginTop = "8px";
  play_button_outer.style.marginLeft = "20px";
  play_div.appendChild(play_button_outer);
  let play_button_inner = document.createElement("div");
  play_button_inner.id = "ClickPlayInner";
  play_button_inner.classList.add("PlayButtonInner");
  play_button_inner.style.marginTop = "14px";
  play_button_inner.style.marginLeft = "23px";
  let play_button_tooltip = document.createElement("span");
  play_button_tooltip.classList.add("tooltiptext");
  play_button_tooltip.innerHTML = "start /stop the music";
  play_button_inner.appendChild(play_button_tooltip);
  play_div.appendChild(play_button_inner);
  play_button_outer.onclick = function() { togglePlay(); }
  play_button_outer.onmouseover = function() { playHighlight("ClickPlayInner"); }
  play_button_outer.onmouseout = function() { playRestore("ClickPlayInner", click_track); }
  play_button_inner.onclick = function() { togglePlay(); }
  play_button_inner.onmouseover = function() { playHighlight("ClickPlayInner"); }
  play_button_inner.onmouseout = function() { playRestore("ClickPlayInner", click_track); }
  toolbar.appendChild(play_div);
  let mode_div = document.createElement("div");
  mode_div.id = "mode";
  mode_div.innerHTML = "none";
  let mode_button_tooltip = document.createElement("span");
  mode_button_tooltip.classList.add("tooltiptext");
  mode_button_tooltip.innerHTML = "current mode";
  mode_div.appendChild(mode_button_tooltip);
  toolbar.appendChild(mode_div);
  let click_mode = document.createElement("div");
  click_mode.id = "ClickMode";
  click_mode.classList.add("ToolbarText");
  click_mode.innerHTML = "click on";
  let click_button_tooltip = document.createElement("span");
  click_button_tooltip.classList.add("tooltiptext");
  click_button_tooltip.innerHTML = "turn click on/off";
  click_mode.appendChild(click_button_tooltip);
  toolbar.appendChild(click_mode);
  click_mode.onclick = function() { toggleClick(); }
  click_mode.onmouseover = function() { textHighlight("ClickMode"); }
  click_mode.onmouseout = function() { textRestore("ClickMode"); }
  if (advanced_user) {
    let ts_div = document.createElement("div");
    ts_div.id = "TimeSignature";
    let nav = document.createElement("nav");
    nav.role = "navigation";
    let ul = document.createElement("ul");
    let li_text = document.createElement("li");
    li_text.classList.add("TSText");
    li_text.innerHTML = "time signature:"
    ul.appendChild(li_text);
    let li_numerator = document.createElement("li");
    li_numerator.id = "SelectedNumerator";
    ul.appendChild(li_numerator);
    let denominator_text = document.createElement("li");
    denominator_text.classList.add("TSText");
    denominator_text.innerHTML = "&nbsp;/ 4";
    ul.appendChild(denominator_text);
    nav.appendChild(ul);
    ts_div.appendChild(nav);
    let ts_button_tooltip = document.createElement("span");
    ts_button_tooltip.classList.add("tooltiptext");
    ts_button_tooltip.innerHTML = "change time signature";
    ts_div.appendChild(ts_button_tooltip);
    toolbar.appendChild(ts_div);
    let tempo = document.createElement("div");
    tempo.id = "Tempo";
    tempo.classList.add("ToolbarText")
    tempo.innerHTML = "&nbsp;tempo";
    tempo.style.paddingTop = "5px";
    let tempo_slider = document.createElement("input");
    tempo_slider.classList.add("input-range");
    tempo_slider.type = "range";
    tempo_slider.step = 10;
    tempo_slider.min = "100";
    tempo_slider.max = "300";
    tempo_slider.value = "240";
    tempo_slider.style.width = "90%";
    tempo.appendChild(tempo_slider);
    let tempo_button_tooltip = document.createElement("span");
    tempo_button_tooltip.classList.add("tooltiptext");
    tempo_button_tooltip.innerHTML = "change tempo";
    tempo.appendChild(tempo_button_tooltip);
    toolbar.appendChild(tempo);
    updateTimeSignature(4);
    tempo_slider.onchange = function() { updateTempo(this.value); }
  }
  document.getElementById("DAW").appendChild(toolbar);
}

function createLeftBar(type, title, track) {
  let left_bar = document.createElement("div");
  left_bar.classList.add("PianoLeftBar");
  let row_title = document.createElement("div");
  row_title.classList.add("PianoTitle");
  row_title.innerHTML = title;
  left_bar.appendChild(row_title);
  let record_button = document.createElement("div");
  record_button.id = type + "Record";
  record_button.classList.add("RecordButton");
  let record_button_tooltip = document.createElement("span");
  record_button_tooltip.classList.add("tooltiptext");
  if (type == "Drums") {
    record_button_tooltip.innerHTML = "start/stop ML drums";
    record_button.style.visibility = "hidden";
  } else if (type == "Lead") {
    record_button_tooltip.innerHTML = "record notes for " + type;
  } else {
    record_button_tooltip.innerHTML = "record " + type;
  }
  record_button.appendChild(record_button_tooltip);
  left_bar.appendChild(record_button);
  record_button.onclick = function() { record(type); }
  record_button.onmouseover = function() { recordHighlight(type + "Record"); }
  record_button.onmouseout = function() { recordRestore(type + "Record", track); }
  let play_button_outer = document.createElement("div");
  play_button_outer.id = type + "PlayOuter";
  play_button_outer.classList.add("PlayButtonOuter");
  play_button_outer.style.marginTop = "189px";
  play_button_outer.style.marginLeft = "0.9%";
  left_bar.appendChild(play_button_outer);
  let play_button_inner = document.createElement("div");
  play_button_inner.id = type + "PlayInner";
  play_button_inner.classList.add("PlayButtonInner");
  play_button_inner.style.marginTop = "195px";
  play_button_inner.style.marginLeft = "1.05%";
  let play_button_tooltip = document.createElement("span");
  play_button_tooltip.classList.add("tooltiptext");
  if (type == "Lead") {
    play_button_tooltip.innerHTML = "start/stop ML melodies";
  } else {
    play_button_tooltip.innerHTML = "start/stop " + type;
  }
  play_button_inner.appendChild(play_button_tooltip);
  left_bar.appendChild(play_button_inner);
  play_button_outer.onclick = function() { toggle(type); }
  play_button_outer.onmouseover = function() { playHighlight(type + "PlayInner"); }
  play_button_outer.onmouseout = function() { playRestore(type + "PlayInner", track); }
  play_button_inner.onclick = function() { toggle(type); }
  play_button_inner.onmouseover = function() { playHighlight(type + "PlayInner"); }
  play_button_inner.onmouseout = function() { playRestore(type + "PlayInner", track); }
  if (type == "Lead") {
    play_button_outer.style.visibility = "hidden";
    play_button_inner.style.visibility = "hidden";
  }
  return left_bar;
}

function createSlider(type, track) {
  let slider = document.createElement("div");
  slider.id = type + "Slider";
  slider.classList.add("Slider");
  slider.style.zIndex = "3";
  let input_range = document.createElement("input");
  input_range.classList.add("input-range");
  input_range.setAttribute("orient", "vertical");
  input_range.type = "range";
  input_range.step = "0.5";
  input_range.value = "0";
  input_range.min = "-20";
  input_range.max = "20";
  slider.appendChild(input_range);
  input_range.onchange = function() { track.set_volume(this.value); }
  let tooltip = document.createElement("span");
  tooltip.classList.add("tooltiptext");
  tooltip.innerHTML = "change " + type + " volume";
  slider.appendChild(tooltip);
  return slider;
}

function createTemperatureSlider(type, track) {
  let slider = document.createElement("div");
  slider.id = type + "TemperatureSlider";
  slider.classList.add("TemperatureSlider");
  let input_range = document.createElement("input");
  input_range.classList.add("input-range");
  input_range.type = "range";
  input_range.step = "0.1";
  input_range.value = "1.5";
  input_range.min = "0.1";
  input_range.max = "3.0";
  slider.appendChild(input_range);
  input_range.onchange = function() { track.set_temperature(parseInt(this.value)); }
  let tooltip = document.createElement("span");
  tooltip.classList.add("tooltiptext");
  tooltip.innerHTML = "change " + type + " ML temperature";
  slider.appendChild(tooltip);
  return slider;
}

function createDrumsRow() {
  let type = "Drums";
  let title = "drum";
  let drums_div = document.createElement("div");
  drums_div.id = type;
  drums_div.classList.add("Piano");
  drums_div.appendChild(createLeftBar(type, title, drum_track));
  let kit_div = document.createElement("div");
  let kick_div = document.createElement("div");
  kick_div.classList.add("Drum");
  kick_div.classList.add("Kick");
  kick_div.id = "Kick";
  kit_div.appendChild(kick_div);
  let snare_div = document.createElement("div");
  snare_div.classList.add("Drum");
  snare_div.classList.add("Snare");
  snare_div.id = "Snare";
  kit_div.appendChild(snare_div);
  let hh_uo_div = document.createElement("div");
  hh_uo_div.classList.add("CymbalUpper");
  hh_uo_div.classList.add("HiHatUpperOuter");
  hh_uo_div.id = "HiHatUpperOuter";
  kit_div.appendChild(hh_uo_div);
  let hh_lo_div = document.createElement("div");
  hh_lo_div.classList.add("CymbalLower");
  hh_lo_div.classList.add("HiHatLowerOuter");
  hh_lo_div.id = "HiHatLowerOuter";
  kit_div.appendChild(hh_lo_div);
  let hh_ui_div = document.createElement("div");
  hh_ui_div.classList.add("CymbalUpper");
  hh_ui_div.classList.add("HiHatUpperInner");
  hh_ui_div.id = "HiHatUpperInner";
  kit_div.appendChild(hh_ui_div);
  let hh_li_div = document.createElement("div");
  hh_li_div.classList.add("CymbalLower");
  hh_li_div.classList.add("HiHatLowerInner");
  hh_li_div.id = "HiHatLowerInner";
  kit_div.appendChild(hh_li_div);
  let tom1_div = document.createElement("div");
  tom1_div.classList.add("Tom1");
  tom1_div.id = "Tom1";
  kit_div.appendChild(tom1_div);
  let tom2_div = document.createElement("div");
  tom2_div.classList.add("Drum");
  tom2_div.classList.add("Tom2");
  tom2_div.id = "Tom2";
  kit_div.appendChild(tom2_div);
  let tom3_div = document.createElement("div");
  tom3_div.classList.add("Drum");
  tom3_div.classList.add("Tom3");
  tom3_div.id = "Tom3";
  kit_div.appendChild(tom3_div);
  let crash_outer_div = document.createElement("div");
  crash_outer_div.classList.add("CymbalUpper");
  crash_outer_div.classList.add("CrashOuter");
  crash_outer_div.id = "CrashOuter";
  kit_div.appendChild(crash_outer_div);
  let crash_inner_div = document.createElement("div");
  crash_inner_div.classList.add("CymbalUpper");
  crash_inner_div.classList.add("CrashInner");
  crash_inner_div.id = "CrashInner";
  kit_div.appendChild(crash_inner_div);
  let ride_outer_div = document.createElement("div");
  ride_outer_div.classList.add("CymbalUpper");
  ride_outer_div.classList.add("RideOuter");
  ride_outer_div.id = "RideOuter";
  kit_div.appendChild(ride_outer_div);
  let ride_inner_div = document.createElement("div");
  ride_inner_div.classList.add("CymbalUpper");
  ride_inner_div.classList.add("RideInner");
  ride_inner_div.id = "RideInner";
  kit_div.appendChild(ride_inner_div);
  drums_div.appendChild(kit_div);
  drums_div.appendChild(createTemperatureSlider(type, drum_track));
  drums_div.appendChild(createSlider(type, drum_track));
  document.getElementById("DAW").appendChild(drums_div);
}

function pianoRowColor(id, event) {
  if (instrument != id) {
    let color = "rgb(83, 73, 73)";
    if (event == "hover") {
      color = "rgb(233, 208, 85)";
    } else if (event == "click") {
      color = "rgb(90, 135, 88)";
    }
    document.getElementById(id).style.background = color;
  }
}

function selectPianoRow(id) {
  pianoRowColor(id, "click");
  let old_instrument = instrument;
  instrument = id;
  if (old_instrument != null) {
    pianoRowColor(old_instrument, "out");
  }
  updateMode();
  showLetters(id);
}

function showLetters(type) {
  let letter_types = ["WhiteKeyLetter", "BlackKeyLetter"];
  for (let i = 0; i < letter_types.length; i++) {
    let letters = document.getElementsByClassName(letter_types[i]);
    for (let j = 0; j < letters.length; j++) {
      if (letters[j].id.startsWith(type)) {
        letters[j].style.visibility = "visible";
      } else {
        letters[j].style.visibility = "hidden";
      }
    }
  }
}

function createPianoRow(type, title, track, starting_octave) {
  let row_div = document.createElement("div");
  row_div.id = type;
  row_div.classList.add("Piano");
  row_div.appendChild(createLeftBar(type, title, track));
  row_div.onmouseover = function() { pianoRowColor(type, "hover"); }
  row_div.onmouseout = function() { pianoRowColor(type, "out"); }
  row_div.onclick = function() { selectPianoRow(type); }
  // Now do the piano keys.
  let white_keys = document.createElement("div");
  white_keys.classList.add("WhiteKeys");
  let white_key_length = WHITE_KEY_NAMES.length;
  for (let i = starting_octave; i <= starting_octave + 2; i++) {
    if (i == starting_octave + 2 && type == "Lead") {
      white_key_length -= 1;
    }
    for (let j = 0; j < white_key_length; j++) {
      let white_key = document.createElement("div");
      white_key.id = type + WHITE_KEY_NAMES[j] + i;
      white_key.classList.add("WhiteKey");
      white_key.onclick = function() { triggerNote(WHITE_KEY_NAMES[j] + i); }
      if (i == starting_octave) {
        let white_key_letter = document.createElement("div");
        white_key_letter.classList.add("WhiteKeyLetter");
        white_key_letter.id = type + WHITE_KEY_LETTERS[j];
        white_key_letter.innerHTML = WHITE_KEY_LETTERS[j];
        white_key.appendChild(white_key_letter);
      }
      white_keys.appendChild(white_key);
    }
  }
  row_div.appendChild(white_keys);
  let black_keys = document.createElement("div");
  black_keys.classList.add("BlackKeys");
  let black_key_length = BLACK_KEY_NAMES.length;
  for (let i = starting_octave; i <= starting_octave + 2; i++) {
    if (i == starting_octave + 2 && type == "Lead") {
      black_key_length -= 2;
    }
    for (let j = 0; j < black_key_length; j++) {
      if (BLACK_KEY_NAMES[j] == "?") {
        let empty_key = document.createElement("div");
        empty_key.classList.add("EmptyKey");
        black_keys.appendChild(empty_key);
      } else {
        let black_key = document.createElement("div");
        black_key.id = type + BLACK_KEY_NAMES[j] + i;
        black_key.classList.add("BlackKey");
        black_key.onclick = function() { triggerNote(BLACK_KEY_NAMES[j] + i); }
        if (i == starting_octave) {
          let black_key_letter = document.createElement("div");
          black_key_letter.classList.add("BlackKeyLetter");
          black_key_letter.id = type + BLACK_KEY_LETTERS[j];
          black_key_letter.innerHTML = BLACK_KEY_LETTERS[j];
          black_key.appendChild(black_key_letter);
        }
        black_keys.appendChild(black_key);
      }
    }
  }
  row_div.appendChild(black_keys);
  if (type == "Lead") {
    row_div.appendChild(createTemperatureSlider(type, track));
  }
  row_div.appendChild(createSlider(type, track));
  document.getElementById("DAW").appendChild(row_div);
}

function record(type) {
  if (type == "Bass") {
    recordBass();
  } else if (type == "Chords") {
    recordChords();
  } else if (type == "Lead") {
    recordLead();
  } else if (type == "Drums") {
    generateMLDrums();
  }
}

function toggle(type) {
  if (type == "Bass") {
    toggleBass();
  } else if (type == "Chords") {
    toggleChords();
  } else if (type == "Lead") {
    toggleLead();
  } else if (type == "Drums") {
    toggleDrums();
  }
}

function playHighlight(id) {
  document.getElementById(id).style.borderLeft = "22px solid white";
}

function recordHighlight(id) {
  document.getElementById(id).style.background = "white";
}

function textHighlight(id) {
  document.getElementById(id).style.color = "white";
}

function playRestore(id, track) {
  if (track.is_playing()) {
    document.getElementById(id).style.borderLeft = "22px solid " + PLAY_GREEN;
  } else {
    document.getElementById(id).style.borderLeft = "22px solid rgb(121, 108, 108)";
  }
}

function recordRestore(id, track) {
  if (track.is_recording()) {
    document.getElementById(id).style.background = "red";
  } else {
    document.getElementById(id).style.background = "rgb(121, 108, 108)";
  }
}

function textRestore(id) {
  document.getElementById(id).style.color = "black";
}

function updateRecordStatus() {
  let currTime = Tone.TransportTime().toBarsBeatsSixteenths().split(":");
  let currentMeasure = ((parseInt(currTime[0])) % 2);
  if (mode == "recording" && (instrument == "Bass" || instrument == "Chords" )) {
    if (last_one_beat < 0) {
      last_one_beat = CLICK_LAST_ONE_BEAT;
    }
    if (last_one_beat < CLICK_LAST_ONE_BEAT) {
      last_one_beat = -1;
      if (instrument == "Bass") {
        document.getElementById("BassRecord").style.background = "rgb(121, 108, 108)";
        bass_track.recording = false;
        bass_track.start();
        playRestore("BassPlayInner", bass_track);
      } else if (instrument == "Chords") {
        document.getElementById("ChordsRecord").style.background = "rgb(121, 108, 108)";
        chords_track.recording = false;
        chords_track.start();
        playRestore("ChordsPlayInner", chords_track);
      }
      mode = "free";
      updateMode();
    }
  }
  return currTime;
}

function triggerNote(note) {
  let currTime = updateRecordStatus();
  let currentMeasure = ((parseInt(currTime[0])) % 2);
  let currentBeat = currTime[1];
  let currentSixteenth = parseInt(currTime[2].split(".")[0]);
  if (instrument == "Bass") {
    bass_track.play_note(note, "4n");
  } else if (instrument == "Chords") {
    chords_track.play_note(note, "4n");
  } else if (instrument == "Lead") {
    lead_track.play_note(note, "4n");
  }
  let time = currentMeasure + ":" + currentBeat + ":" + currentSixteenth;
  if (mode == "recording") {
    if (instrument == "Bass") {
      bass_track.add_note(time, note, "4n.");
      drum_track.add_note(time, "D1");  // Snare hit.
    } else if (instrument == "Chords") {
      chords_track.add_note(time, note, "4n.");
    } else if (instrument == "Lead") {
      lead_track.add_note(time, note);
    }
  }
}

function updateMode() {
  if (instrument == null) {
    return;
  }
  let mode_div = document.getElementById('mode');
  mode_div.innerHTML = instrument;
  if (instrument == "Lead" && lead_track.is_ml_melody()) {
    mode_div.style.color = "blue";
  } else if (mode == "recording") {
    mode_div.style.color = "red";
  } else {
    mode_div.style.color = "black";
  }
}

function highlightKey(note, highlight_type) {
  const key_element = document.getElementById(note);
  key_element.classList.add(highlight_type);
  setTimeout(() => {
    key_element.classList.remove(highlight_type);
  }, 200);
}

function highlightDrum(note) {
  if (!DRUM_NOTE_TO_NAME.has(note)) {
    console.log('Did not find note! ' + note);
    return;
  }
  const drum_types = DRUM_NOTE_TO_NAME.get(note);
  for (let i = 0; i < drum_types.length; i++) {
    const drum_element = document.getElementById(drum_types[i]);
    drum_element.classList.add("active");
    setTimeout(() => {
      drum_element.classList.remove("active");
    }, 200);
  }
}

function recordBass() {
  if (bass_track.is_recording()) {
    bass_track.recording = false;
    bass_track.start();
    recordRestore("BassRecord", bass_track);
    selectPianoRow("Bass");
    mode = "free";
    updateMode();
    playRestore("BassPlayInner", bass_track);
  } else {
    bass_track.clear();
    bass_track.recording = true;
    recordRestore("BassRecord", bass_track);
    if (!drum_track.has_ml_melody()) {
      drum_track.clear();
    }
    selectPianoRow("Bass");
    mode = "recording";
    updateMode();
  }
}

function recordChords() {
  if (chords_track.is_recording()) {
    chords_track.recording = false;
    chords_track.start();
    recordRestore("ChordsRecord", chords_track);
    selectPianoRow("Chords");
    mode = "free";
    updateMode();
    playRestore("ChordsPlayInner", chords_track);
  } else {
    chords_track.clear();
    chords_track.recording = true;
    recordRestore("ChordsRecord", chords_track);
    selectPianoRow("Chords");
    mode = "recording";
    updateMode();
  }
}

function recordLead() {
  lead_track.toggle_recording();
  if (mode != "recording") {
    mode = "recording";
    selectPianoRow("Lead");
    updateMode();
    document.getElementById("LeadPlayOuter").style.visibility = "visible";
    document.getElementById("LeadPlayInner").style.visibility = "visible";
  } else {
    mode = "free";
    updateMode();
    document.getElementById("LeadPlayOuter").style.visibility = "hidden";
    document.getElementById("LeadPlayInner").style.visibility = "hidden";
  }
}

function toggleClick() {
  if (CLICK_MUTED) {
    document.getElementById("ClickMode").innerHTML = "click on";
  } else {
    document.getElementById("ClickMode").innerHTML = "click off";
  }
  click_track.toggle();
}

function togglePlay() {
  if (!player_started) {
    Tone.context.resume();
    Tone.Transport.start("+0.1");
    document.getElementById("ClickPlayInner").style.borderLeft = "22px solid " + PLAY_GREEN;
    player_started = true;
    return;
  }
  if (Tone.Transport.state == 'started') {
    document.getElementById("ClickPlayInner").style.borderLeft = "22px solid rgb(121, 108, 108)";
    Tone.Transport.stop();
  } else {
    document.getElementById("ClickPlayInner").style.borderLeft = "22px solid " + PLAY_GREEN;
    Tone.Transport.start("+0.1");
  }
}

function toggleMetronome() {
  click_track.toggle();
}

function toggleBass() {
  bass_track.toggle();
}

function toggleDrums() {
  drum_track.toggle();
}

function toggleChords() {
  chords_track.toggle();
}

function toggleLead() {
  mode = "free";
  lead_track.generateMLLead();
}

function generateMLDrums() {
  if (drum_track.part == null) {
    return;
  }
  if (drum_track.has_ml_melody()) {
    drum_track.deterministic();
    recordRestore("DrumsRecord", drum_track);
  } else {
    Tone.Transport.stop();
    drum_track.generate_ml_drums();
  }
}

 