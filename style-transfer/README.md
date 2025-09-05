Arbitrary Style Transfer Network
=================
A small demo of the <a href="https://www.jsdelivr.com/package/npm/@magenta/image">magenta/image</a> library that performs stylization on a content/style image pair **without** having to retrain the 
model if the style image changes.

`ArbitraryStyleTransferNetwork` wraps around [Reiichiro Nakano](https://twitter.com/ReiiYoda)'s TensorFlow.js [port](https://github.com/reiinakano/arbitrary-image-stylization-tfjs) of Ghiasi et al.'s [arbitrary stylization model](https://arxiv.org/abs/1705.06830).