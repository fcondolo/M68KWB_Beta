  function INT8TOWAV_floatTo16BitPCM(output, offset, input) {
    for (var i = 0; i < input.length; i++, offset += 2) {
        var s = Math.max(-1, Math.min(1, input[i]));
        output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
  }

  function INT8TOWAV_writePCM16(output, offset, input) {
    for (var i = 0; i < input.length; i++, offset += 2) {
        var s = input[i] * 256;
        output.setInt16(offset, s , true);
    }
  }


  function INT8TOWAV_writeString(view, offset, string) {
    for (var i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  function INT8TOWAV_encode(samples, outputFileName) {
    const numChannels = 1;
    const sampleRate = 22050;

    var buffer = new ArrayBuffer(44 + samples.length * 2);
    var view = new DataView(buffer);

    /* RIFF identifier */
    INT8TOWAV_writeString(view, 0, 'RIFF');
    /* RIFF chunk length */
    view.setUint32(4, 36 + samples.length * 2, true);
    /* RIFF type */
    INT8TOWAV_writeString(view, 8, 'WAVE');
    /* format chunk identifier */
    INT8TOWAV_writeString(view, 12, 'fmt ');
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
    INT8TOWAV_writeString(view, 36, 'data');
    /* data chunk length */
    view.setUint32(40, samples.length * 2, true);

    INT8TOWAV_writePCM16(view, 44, samples);

    var audioBlob = new Blob([view], { type: 'audio/wav' });
    var blobUrl = URL.createObjectURL(audioBlob);
    var link = document.createElement("a"); // Or maybe get it from the current document
    link.href = blobUrl;
    link.download = outputFileName;
    link.innerHTML = "Click here to download " + outputFileName;
    document.body.appendChild(link); // Or append it whereever you want    
    var clickEvent = new MouseEvent("click", {
      "view": window,
      "bubbles": true,
      "cancelable": false
    });
    link.dispatchEvent(clickEvent);    
  }

  function INT8TORAW_encode(samples, outputFileName) {
    const numChannels = 1;
    const sampleRate = 22050;

    var buffer = new ArrayBuffer(samples.length);
    var view = new DataView(buffer);
    for (let i = 0; i < samples.length; i++)
      view.setInt8(i, samples[i]);

    var audioBlob = new Blob([view], { type: 'application/octet-stream' });
    var blobUrl = URL.createObjectURL(audioBlob);
    var link = document.createElement("a"); // Or maybe get it from the current document
    link.href = blobUrl;
    link.download = outputFileName;
    link.innerHTML = "Click here to download " + outputFileName;
    document.body.appendChild(link); // Or append it whereever you want    
    var clickEvent = new MouseEvent("click", {
      "view": window,
      "bubbles": true,
      "cancelable": false
    });
    link.dispatchEvent(clickEvent);    
  }
