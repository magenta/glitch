MidiMe
=================
MidiMe is a machine learning experiment to train a small model to sound 
like you! (or rather, like a MIDI file that you upload).


Try loading a single, full song to get outputs that sound like variations
on it, or load multiple songs to get samples that combine various 
characteristics of them. All the training happens directly in the browser 
-- no servers or backends here!


The models we're using are monophonic -- which means that the songs 
that work best only have one musical instrument present. If your 
file has multiple instruments, the model will try its best, but it's 
not guaranteed to find the "real" melody in the song.