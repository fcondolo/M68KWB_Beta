// https://developer.mozilla.org/en-US/docs/Web/API/AudioBuffer


var AUDIO_SINGLETON = null;

class Audio {
  constructor() {
    let t = this;
    AUDIO_SINGLETON = this;
    t.audioCtx = new AudioContext();
    t.channels = 2;
    t.waitFile = null;
    t.source = null;
  }

  restart(){
    let t = this;
    if (t.source != null) t.source.stop();
  }

  wavToByteArray(path) {
    let t = this;
    while (t.waitFile != null);    
    t.waitFile = path;

    var req = new XMLHttpRequest();
    req.open("GET", path, false);
    req.overrideMimeType("text/plain; charset=binary-data");
    req.send(null);
    if (req.status !== 200) {
        console.error("error");
        return null;
    }
    var text = req.responseText;
    var resultArray = new Uint8Array(text.length);
    for(var i = 0; i < text.length;i++){
      resultArray[i] = (text[i].charCodeAt() & 255) & 255;
    }
    let ret = {};
    let w =  text[0]+text[1]+text[2]+text[3];
    if (w != "RIFF")
      console.error("sample is not a wav file");
    w =  text[8]+text[9]+text[10]+text[11];
    if (w != "WAVE")
      console.error("sample is not a wav file");
    let fmt = (resultArray[21]<<8) + resultArray[20];
    if (fmt != 1)
      console.error("sample is not stored as PCM");
    let chan = (resultArray[23]<<8) + resultArray[22];
    if (chan != 1)
      console.error("sample is not mono");
    ret.rate = (resultArray[27]<<24) + (resultArray[26]<<16) + (resultArray[25]<<8) + (resultArray[24]);
    ret.bits = (resultArray[35]<<8) + resultArray[34];
    if (ret.bits != 8)
      console.error("sample is not 8 bits");
    w =  text[36]+text[37]+text[38]+text[39];
    if (w != "data")
      console.error("can't find data chunk");
    ret.size = (resultArray[43]<<24) + (resultArray[42]<<16) + (resultArray[41]<<8) + (resultArray[40]);
    ret.data = resultArray.slice(44,44+ret.size);
    t.waitFile = null;
    return ret;
 }

 modSampleToByteArray(sample) {
  let t = this;
  var resultArray = sample.data;
  let ret = {};
  ret.rate = t.audioCtx.sampleRate;
  ret.bits = 8;
  ret.size = sample.data.length;
  ret.data = sample.data;
  return ret;
}

memoryToByteArray(_start, _stop) {
  let t = this;
  let len = _stop - _start;
  let ret = {};
  ret.rate = t.audioCtx.sampleRate;
  ret.bits = 8;
  ret.size = len;
  ret.data = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    ret.data[i] = MACHINE.ram[_start + i];
  }
  return ret;
}

byteArrayToBuffer(_array, _samplesPerSec, _channelsCount = 1) {
    let t = this;
    let smoothing = false;
    const len = _array.length;
    const duration = len /  _samplesPerSec;
    const rate = t.audioCtx.sampleRate;
    let  buffer = new AudioBuffer({
      numberOfChannels: _channelsCount,
      length: duration * rate,
      sampleRate: rate,
    });

    if (t.audioCtx.sampleRate < _samplesPerSec) {
      console.error("web sample rate is lower than sample");
      debugger;
    }
    const repeat = Math.floor(t.audioCtx.sampleRate/_samplesPerSec);
    let nowBuffering = buffer.getChannelData(0);
    let ofs = 0;
    let prevS = 0;
    for (let i = 0; i < len; i++) {
      let s = _array[i]; // 0..255
      s = (s & 0x80) ? (s - 0x100) : s; // 0..255 ==> -128 .. + 127
      s /= 128.0; // -1..1
      if (smoothing) {
        if (i>0) s = (s + prevS )/2;
        prevS = s;
      }
      for (let cpy = 0; cpy < repeat; cpy++) {
        nowBuffering[ofs++] = s; 
      }
    }
    console.log("padding " + (nowBuffering.length-ofs).toString() +  "/" + nowBuffering.length + " bytes");
    while (ofs < nowBuffering.length) nowBuffering[ofs++] = 0;
    return buffer;
  }


  

  playBuffer(_buf) {
    let t = this;
    // Get an AudioBufferSourceNode.
    // This is the AudioNode to use when we want to play an AudioBuffer
    if (t.source == null)
      t.source = t.audioCtx.createBufferSource();
    // Set the buffer in the AudioBufferSourceNode
    t.source.buffer = _buf;
    // Connect the AudioBufferSourceNode to the
    // destination so we can hear the sound
    t.source.connect(t.audioCtx.destination);
    // start the source playing
    t.source.start();
  }

  WAV_floatTo16BitPCM(output, offset, input) {
    for (var i = 0; i < input.length; i++, offset += 2) {
        var s = Math.max(-1, Math.min(1, input[i]));
        output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
  }

  WAV_writeString(view, offset, string) {
    for (var i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  encodeWAV(samples, outputFileName) {
    const numChannels = 1;
    const sampleRate = 22050;

    var buffer = new ArrayBuffer(44 + samples.length * 2);
    var view = new DataView(buffer);

    /* RIFF identifier */
    this.WAV_writeString(view, 0, 'RIFF');
    /* RIFF chunk length */
    view.setUint32(4, 36 + samples.length * 2, true);
    /* RIFF type */
    this.WAV_writeString(view, 8, 'WAVE');
    /* format chunk identifier */
    this.WAV_writeString(view, 12, 'fmt ');
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (raw) */
    view.setUint16(20, 1, true);
    /* channel count */
    view.setUint16(22, numChannels, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, sampleRate * 4, true);
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, numChannels * 2, true);
    /* bits per sample */
    view.setUint16(34, 16, true);
    /* data chunk identifier */
    this.WAV_writeString(view, 36, 'data');
    /* data chunk length */
    view.setUint32(40, samples.length * 2, true);

    this.WAV_floatTo16BitPCM(view, 44, samples);

    var audioBlob = new Blob([view], { type: 'audio/wav' });
    var blobUrl = URL.createObjectURL(audioBlob);
    var link = document.createElement("a"); // Or maybe get it from the current document
    link.href = blobUrl;
    link.download = outputFileName;
    link.innerHTML = "Click here to download " + outputFileName;
    document.body.appendChild(link); // Or append it whereever you want    
  }

}


