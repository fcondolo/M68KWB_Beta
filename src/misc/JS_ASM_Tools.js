/* How to create arrays in javascript:
  this.arrU8   = new Uint8Array(count);
  this.arrI8   = new Int8Array(count);
  this.arrU16  = new Uint16Array(count);
  this.arrI16  = new Int16Array(count);
  this.arrU32  = new Uint32Array(count);
  this.arrI32  = new Int32Array(count);

  Note that using typed arrays is the only way to make sure JavaSCript is using a specific type,
  The is no typed variable, only typed arrays.
  
  this.arrU16  = new Uint16Array(256);
  ...
  // create some mul34 table in ASM
  invoke68K("createMul34Table");
...
  // copy the ASM table to the JS table
  ASM2JS_LabelToUIn16Array("mul34table", this.arrU16);
  ...
  // verify values
  for (let i = 0; i < this.arrU16.length; i++) {
    if (this.arrU16[i] != 34*i) {
      alert("error at index:" + i);
    }
  }
  ...
  
  */

  //////////////////////////////////////////////////////
  // BASIC ARITHTMETICS
  // Does not behave exaclty like the 68K, but checks args sizes and overflows
  //////////////////////////////////////////////////////

  // s.w * d.w ==> (s*d).l
  function MULS_68K(s, d) {
    s = Math.floor(s);
    d = Math.floor(d);
    if (s < -32768 || s > 32767) {
      const msg = "muls expects a 16 bits params:\n" + s + "\n$" + s.toString(16);
      console.log(msg);
      main_Alert(msg);
      debugger;
    }
    if (d < -32768 || d > 32767) {
      const msg = "muls expects a 16 bits params:\n" + d + "\n$" + d.toString(16);
      console.log(msg);
      main_Alert(msg);
      debugger;
    }
    return s * d;
  }
    
  // _dest.l / _source.w
  function DIVS_68K(_dest, _source) {
    _dest = Math.floor(_dest);
    _source = Math.floor(_source);
    if (_source < -32768 || _source > 32767) { 
      const msg = "divs expects a 16 bits value as input:\n" + _source + "\n$" + _source.toString(16);
      console.log(msg);
      main_Alert(msg);
      debugger;
    }
  
    if (_source == 0) {
      main_Alert("DIVISION BY 0");
      debugger;
      return 0;
    }
    const quo = Math.floor(_dest / _source);
    if ((quo < -32768) || (quo > 32767)) {
        alert("DIVISION OVERFLOW: " + Math.floor(_dest) + " / " + Math.floor(_source) + " = "  + quo);
        debugger;
    }
    return quo;
  }



  //////////////////////////////////////////////////////
  // UNSIGNED --> SIGNED CONVERSION
  //////////////////////////////////////////////////////
  
  function toInt8(_v) {
    const ref = _v & 0xff;
    return (ref > 0x7F) ? ref - 0x100 : ref;
  };
  
  
  function toInt16 (_v) {
    const ref = _v & 0xffff;
    return (ref > 0x7FFF) ? ref - 0x10000 : ref;
  };

  function toInt32(_v) {
    return (_v & 0x80000000) ? (_v - 0x100000000) : _v;
  }

  function JSInt16ToAsm(_value) {
    if (_value >= 0) return _value & 0xffff;
    let complement = Math.abs(_value);
    complement = ~complement;
    complement++;
    complement &= 0xffff;
    return complement;
  }

  //////////////////////////////////////////////////////
  // A FEW FUNCTIONS TO DEAL WITH DATA REGISTERS FROM JS
  //////////////////////////////////////////////////////
  
  function GET_VARIABLE(_name, _size, _signed) {
    return MACHINE.getRAMValue(PARSER_getLabelAdrs(_name),_size,_signed);
  }

      
function DEBUGGER_GETVARIABLEINSTRUCT(_strucLabel, _varName, _sizeInBytes, _signed) {
  let structAdrs = PARSER_getLabelAdrs(_strucLabel);
  let varOffset = PARSER_getConstValue(_varName);
  return MACHINE.getRAMValue(structAdrs+varOffset,_sizeInBytes,_signed);
}  

/**
D8_SET(_index,_value)
Sets the low 8 bits of a data register
@param      _index  :   index of the data register (0..7) 
@param      _value  :   value to write
*/
function D8_SET(_index,_value) {
    _value = Math.floor(_value);
    regs.d[_index] &= 0xffffff00;
    regs.d[_index] |= _value&0xff;  
  }
  
/**
D8_GET(_index)
returns the low 8 bits of a data register
@param      _index  :   index of the data register (0..7) 
@return     the low 8 bits of the chosen data register
*/
function D8_GET(_index) {
  return regs.d[_index] & 0xff;
}
  
/**
D16_SET(_index,_value)
Sets the low 16 bits of a data register
@param      _index  :   index of the data register (0..7) 
@param      _value  :   value to write
*/
function D16_SET(_index,_value) {
  _value = Math.floor(_value);
  regs.d[_index] &= 0xffff0000;
  regs.d[_index] |= _value&0xffff;  
}
  
/**
D16_GET(_index)
returns the low 16 bits of a data register
@param      _index  :   index of the data register (0..7) 
@return     the low 16 bits of the chosen data register
*/
function D16_GET(_index) {
  return regs.d[_index] & 0xffff;
}
  
/**
D16_ADD(_index,_value)
adds _value to the low 16 bits of a data register
@param      _index  :   index of the data register (0..7) 
@param      _value  :   value to add
@return     the new low 16 bits of the chosen data register
*/
function D16_ADD(_index,_value) {
  _value = Math.floor(_value);
  D16_SET(_index,D16_GET(_index)+_value);
  return D16_GET(_index);
}
  
/**
D16_SUB(_index,_value)
subtracts _value to the low 16 bits of a data register
@param      _index  :   index of the data register (0..7) 
@param      _value  :   value to subtract
@return     the new low 16 bits of the chosen data register
*/
function D16_SUB(_index,_value) {
  _value = Math.floor(_value);
  D16_SET(_index,D16_GET(_index)-_value);
  return D16_GET(_index);
}
  
/**
D32_SET(_index,_value)
Sets the 32 bits of a data register
@param      _index  :   index of the data register (0..7) 
@param      _value  :   value to write
*/
function D32_SET(_index,_value) {
  _value = Math.floor(_value);
  regs.d[_index] = _value;  
}
  
/**
D32_GET(_index)
returns the 32 bits of the data register
@param      _index  :   index of the data register (0..7) 
@return     the 32 bits of the chosen data register
*/
function D32_GET(_index) {
  return regs.d[_index];
}
  
/**
Swaps the low and high 16 bits of a register (same as M68K asm SWAP instruction)
returns the new 32 bits of the data register
@param      _index  :   index of the data register (0..7) 
@return     the 32 bits of the chosen data register
*/
function D32_SWAP(_index) {
  let low =  regs.d[_index] & 0xffff;
  regs.d[_index] >>>= 16;
  regs.d[_index] |= low << 16;
  return D32_GET(_index);
}
    

function JS2ASM_Uint8ArrayToRAM(_array, _adrs, _RAMindex = 0, _arrayIndex = 0, _count = 0) {
  let adrs = _adrs + _RAMindex;
  for (let c  = 0; c < _count; c++) {
    MACHINE.ram[adrs++] = _array[_arrayIndex + c];
  }
  
}

function JS2ASM_UIn8ArrayToLabel(_array, _label, _RAMindex = 0, _arrayIndex = 0, _count = 0) {
  let adrs = PARSER_getLabelAdrs(_label);
  if (isNaN(adrs))
    return;
  if (_count == 0) {
    _count = _array.length;
  }
    JS2ASM_Uint8ArrayToRAM(_array, adrs, _RAMindex, _arrayIndex, _count);
}

function JS2ASM_Uint16ArrayToRAM(_array, _adrs, _RAMindex = 0, _arrayIndex = 0, _count = 0) {
  let adrs = _adrs + _RAMindex;
  for (let c  = 0; c < _count; c++) {
    let v = _array[_arrayIndex + c];
    MACHINE.ram[adrs++] = (c>>8)&255;
    MACHINE.ram[adrs++] = c&255;
  }
  
}

function JS2ASM_Int16ArrayToRAM(_array, _adrs, _RAMindex = 0, _arrayIndex = 0, _count = 0) {
  let adrs = _adrs + _RAMindex;
  for (let c  = 0; c < _count; c++) {
    let v = _array[_arrayIndex + c];
    MACHINE.setRAMValue(v,_adrs+c*2,2);
  }  
}

function JS2ASM_UIn16ArrayToLabel(_array, _label, _RAMindex = 0, _arrayIndex = 0, _count = 0) {
  let adrs = PARSER_getLabelAdrs(_label);
  if (isNaN(adrs))
    return;
  if (_count == 0) {
    _count = _array.length;
  }
    JS2ASM_Uint16ArrayToRAM(_array, adrs, _RAMindex, _arrayIndex, _count);
}

function JS2ASM_In16ArrayToLabel(_array, _label, _RAMindex = 0, _arrayIndex = 0, _count = 0) {
  let adrs = PARSER_getLabelAdrs(_label);
  if (isNaN(adrs))
    return;
  if (_count == 0) {
    _count = _array.length;
  }
    JS2ASM_Int16ArrayToRAM(_array, adrs, _RAMindex, _arrayIndex, _count);
}

function ASM2JS_LabelToIn16Array(_label, _array, _count = 0, _verify = false) {
  let adrs = PARSER_getLabelAdrs(_label);
  if (isNaN(adrs))
    return;
  if (_count == 0) {
    _count = _array.length;
  }
  for (let i = 0; i < _count; i++) {
    const v = MACHINE.getRAMValue(adrs + i * 2, 2, true);
    if (_verify && (_array[i] != v)) {
      console.log("index: " + i + ", expected: " + _array[i] + ", got: " + v);
      debugger;
    }
    _array[i] = v;
  }
}

function ASM2JS_LabelToUIn16Array(_label, _array, _count = 0, _verify = false) {
  let adrs = PARSER_getLabelAdrs(_label);
  if (isNaN(adrs))
    return;
  if (_count == 0) {
    _count = _array.length;
  }
  for (let i = 0; i < _count; i++) {
    const v = MACHINE.getRAMValue(adrs + i * 2, 2, false);
    if (_verify && (_array[i] != v)) {
      console.log("index: " + i + ", expected: " + _array[i] + ", got: " + v);
      debugger;
    }
    _array[i] = v;
  }
}

function ASM2JS_LabelToIn8Array(_label, _array, _count = 0, _verify = false) {
  let adrs = PARSER_getLabelAdrs(_label);
  if (isNaN(adrs))
    return;
  if (_count == 0) {
    _count = _array.length;
  }
  for (let i = 0; i < _count; i++) {
    const v = MACHINE.getRAMValue(adrs + i, 1, true);
    if (_verify && (_array[i] != v)) {
      console.log("index: " + i + ", expected: " + _array[i] + ", got: " + v);
      debugger;
    }
    _array[i] = v;
  }
}

function ASM2JS_LabelToUIn8Array(_label, _array, _count = 0, _verify = false) {
  let adrs = PARSER_getLabelAdrs(_label);
  if (isNaN(adrs))
    return;
  if (_count == 0) {
    _count = _array.length;
  }
  for (let i = 0; i < _count; i++) {
    const v = MACHINE.getRAMValue(adrs + i, 1, false);
    if (_verify && (_array[i] != v)) {
      console.log("index: " + i + ", expected: " + _array[i] + ", got: " + v);
      debugger;
    }
    _array[i] = v;
  }
}


function downloadView(view, _outputFileName) {
  var dataBlob = new Blob([view], { type: 'application/octet-stream' });
  var blobUrl = URL.createObjectURL(dataBlob);
  var link = document.createElement("a"); // Or maybe get it from the current document
  link.href = blobUrl;
  link.download = _outputFileName;
  link.innerHTML = "Click here to download " + _outputFileName;
  document.body.appendChild(link); // Or append it whereever you want    
  var clickEvent = new MouseEvent("click", {
    "view": window,
    "bubbles": true,
    "cancelable": false
  });
  link.dispatchEvent(clickEvent);
}

function RAMToFile_bytes(_adrs, _count, _outputFileName, _showDoneMsg = false) {
  var buffer = new ArrayBuffer(_count);
  var view = new DataView(buffer);
  for (let i = 0; i < _count; i++)
    view.setUint8(i, MACHINE.ram[_adrs + i]);
  downloadView(view, _outputFileName);
  if (_showDoneMsg) alert("saved " + _outputFileName);
}

function RAMToFile_longs(_adrs, _count, _outputFileName, breakOn=null) {
  var buffer = new ArrayBuffer(_count * 4);
  var view = new DataView(buffer);
  for (let i = 0; i < _count; i++) {
    if (i == 304)
      debugger;
    let v = new Uint32Array(5);
    v[0] = MACHINE.ram[_adrs + i * 4 + 3] & 0xff;
    v[1] = (MACHINE.ram[_adrs + i * 4 + 2] & 0xff) << 8;
    v[2] = (MACHINE.ram[_adrs + i * 4 + 1] & 0xff) << 16;
    v[3] = (MACHINE.ram[_adrs + i * 4 + 0] & 0xff) << 24;
    if (breakOn && breakOn.length > 0) {
      v[4] = v[0] | v[1] | v[2] | v[3];
      for (let bo = 0; bo < breakOn.length; bo++) {
        if (v[4] == breakOn[bo]) {
          debugger;
        }  
      }
    }
    view.setUint8(i * 4 + 0, v[3]);
    view.setUint8(i * 4 + 1, v[2]);
    view.setUint8(i * 4 + 2, v[1]);
    view.setUint8(i * 4 + 3, v[0]);
  }

  downloadView(view, _outputFileName);
}
