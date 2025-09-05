ML-Jam
=================

The quality of outputs produced by deep generative models for music have seen a
dramatic improvement in the last few years. Most of these models, however,
perform in "offline" mode: they can take as long as they'd like before they come
up with a melody!

For those of us that perform live music, this is a deal-breaker, as anything
making music with us on stage has to be on the beat and in harmony. In addition
to this, the generative models available tend to be agnostic to the style of a
performer which could make their integration into a live set fairly awkward.

In this post we describe how we have begun exploring what it would take to take
out-of-the-box generative musical models and integrate them into live
performance. To do this, we make use of two "old" (for today's standards)
Magenta models:
[DrumsRNN](https://github.com/tensorflow/magenta/tree/master/magenta/models/drums_rnn)
and
[MelodyRNN](https://github.com/tensorflow/magenta/tree/master/magenta/models/melody_rnn).

You can read about the details in my <a href="https://magenta.tensorflow.org/mljam">blog post</a>, 
<a href="https://arxiv.org/abs/1904.13285">ICCC 2019 Paper</a>,
or try out the full <a href="https://github.com/psc-g/Psc2">Python Code</a>.

This web app is based on the Python code but is strictly inferior for two important reasons:

  * You can't (easily) do multi-threading with tensorflow.js, so whenever inference is happening, it pauses playback.
  * The melody model I'm using with the Python code is `attention_rnn`, but this model is unfortunately not available
    in magenta.js, so I have to stick with `melody_rnn`, which is not as good.