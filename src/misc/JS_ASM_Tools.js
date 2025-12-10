var TOOLS = null;


/**
 * @class JS_ASM_Tools
 * @classdesc A series of helpers to navigate smoothly between "regular" js and asm
 */
class JS_ASM_Tools {
  constructor() {
    if (TOOLS != null) {
        debugger;
        return;
    }
    TOOLS = this;
  }

  /**
   * JS_ASM_Tools is a series of helpers to navigate smoothly between "regular" js and asm. You can invoke all its methods through singleton "TOOLS", using TOOLS.methodname(args). For example: regs.d[0]=TOOLS.MULS_68K(79,regs.d[0]);
   */
  __READ_ME_FIRST__(){ // empty funtion just here to appear at the top of the doc
  }
     
//     =====================
//      ARITHMETICS HELPERS 
//     =====================

  /**
   * Emulates the MULS asm instruction: s.w * d.w ==> (s*d).l.
   * @example let yOfs = TOOLS.MULS_68K(40, lineY);
   * @example regs.d[0] = TOOLS.MULS_68K(79, TOOLS.toInt16(regs.d[0])); // remember that regiters are stored as unsigned long while JS variables are signed integers, so need to convert
   * @param   {number} s - source (16 bit signed int)
   * @param   {number} d - destination (16 bit signed int). NOT MODIFIED AS A M68K WOULD DO: Result is returned, not copied to arg2.
   * @returns {number}  s.w * d.w (javascript number)
   * @throws error (alert box) if params>32767 or <-32768
   */
  MULS_68K(s, d) {
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
      
  /**
   * Partially emulates the DIVS asm instruction: _dest.l / _source.w.
   * @example let slope = TOOLS.DIVS_68K(delta, iter);
   * @example regs.d[0] = TOOLS.DIVS_68K(TOOLS.toInt32(regs.d[0]), TOOLS.toInt16(regs.d[1]); // remember that regiters are stored as unsigned long while JS variables are signed integers, so need to convert
   * @param   {number} _source  - source (16 bit signed int)
   * @param   {number} _dest    - destination (32 bit signed int). NOT MODIFIED AS A M68K WOULD DO: Result is returned, not copied to arg2.
   * @returns {number} _dest.l/_source.w (javascript number). DOES NOT RETURN REMAINDER IN THE MSB LIKE THE M68K WOULD DO
   * @throws error (alert box) if _source>32767 or _source<-32768
   * @throws error (alert box) if _source == 0
   * @throws error (alert box) if division overflow
   */
  DIVS_68K(_source, _dest) {
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


//    ==================================
//     SIGNED <==> UNSIGNED CONVERSIONS 
//    ==================================


 
  /**
   * Converts an unsigned int 8 to a signed int 8
   * @param   {number} _v  - unsigned 8 bit value of the number to convert
   * @returns {number} signed value of the number
   */
  toInt8(_v) {
      const ref = _v & 0xff;
      return (ref > 0x7F) ? ref - 0x100 : ref;
  };
    
    
  /**
   * Converts an unsigned int 16 to a signed int 16
   * @param   {number} _v  - unsigned 16 bit value of the number to convert
   * @returns {number} signed value of the number
  */
  toInt16 (_v) {
      const ref = _v & 0xffff;
      return (ref > 0x7FFF) ? ref - 0x10000 : ref;
    };

  /**
   * Converts an unsigned int 32 to a signed int 32
   * @param   {number} _v  - unsigned 32 bit value of the number to convert
   * @returns {number} signed value of the number
  */
  toInt32(_v) {
      return (_v & 0x80000000) ? (_v - 0x100000000) : _v;
    }

  /**
   * Converts a signed or unsigned javascript int16 to its 2-complement asm version (e.g. transforms -1 to 0xffff)
   * @param   {number} _v  - 16 bit JS variable to convert
   * @returns {number} asm representation of the numbe r(same if positive, 2 complement if negative)
  */
  JSInt16ToAsm(_value) {
    return (_value >>> 0) & 0xffff;
  }

  /**
   * Converts a signed or unsigned javascript int32 to its 2-complement asm version  (e.g. transforms -1 to 0xffffffff)
   * @param   {number} _v  - 32 bit JS variable to convert
   * @returns {number} asm representation of the numbe r(same if positive, 2 complement if negative)
  */
  JSInt32ToAsm(_value) {
    return (_value >>> 0);
  }

//    ==================================
//     ACCESSING ASM VARIABLES FROM JS
//    ==================================
    
  /**
   * Fetches a label's address (a bit like LEA)
   * @param   {string} _label  - the label to find
   * @param   {boolean} _canFail  - (optional) set to true is the label search can fail silently (default: false)
   * @param   {boolean} _canBeCode  - (optional) set to true is the label is a code label (vs data label) (default: false)
   * @returns {number} the label's address
   * @throws     alert box if _canFail is true, and label is not found, or if no data follows the label in the ASM source code(labels pointing to no data are not valid)
  */
  getLabelAdrs(_label, _canFail = false, _canBeCode = true) {
    if (!CODERPARSER_SINGLETON || !CODERPARSER_SINGLETON.labels) {
      alert("calling TOOLS.getLabelAdrs too soon: asm file not yet read. Don't call from your FX class constructor, do it at init");
      return NaN;
    }
    if (CODERPARSER_SINGLETON.fastLabels.length > 0) {
      let c = CODERPARSER_SINGLETON.fastLabels[_label];
      if (c) {
        if (CODERPARSER_SINGLETON.labels[c].dcData)
          return CODERPARSER_SINGLETON.labels[c].dcData;
        else {
          const ofs = CODERPARSER_SINGLETON.labels[c].codeSectionOfs;
          if (!isNaN(ofs) && typeof ofs != 'undefined') {
            return ofs;
          } else {
            if (_canBeCode) {
              if (!isNaN(ofs)) return ofs;
            } else {
              debugger;
              main_Alert("TOOLS.getLabelAdrs failed: label " + _label + " is not linked to dc.x data or not linked to code");
              return NaN;    
            }
          }
        }
      }  
    }

    _label = _label.toUpperCase();
    for (let i = 0; i < CODERPARSER_SINGLETON.labels.length; i++) {
      const l = CODERPARSER_SINGLETON.labels[i].label.toUpperCase();
      if (l == _label) {
        if (CODERPARSER_SINGLETON.labels[i].dcData)
          return CODERPARSER_SINGLETON.labels[i].dcData;
        else {
          if (_canBeCode) {
            const ofs = CODERPARSER_SINGLETON.labels[i].codeSectionOfs;
            if (ofs != null) return ofs;
            return NaN;
          } else {
            debugger;
            main_Alert("TOOLS.getLabelAdrs failed: label " + _label + " is not linked to dc.x data or not linked to code");
            return NaN;
          }
        }
      }
    }

    if (!_canFail) {
      let err = "TOOLS.getLabelAdrs failed: label " + _label + " not found.\n";
        main_Alert(err);
      }
    return NaN;
  }


  /**
   * Returns the size of a file given its URL (typicall loaded through incbin)
   * @param   {string} _url  - file local path (path used to incbin for example)
   * @returns {number} the file size in bytes (bytes actually loaded in RAM)
   * @throws     breakpoint if file not found in the list of loaded files
  */
  getFileSizeFromURL(_url) {
    let url = "";
    if (FX_INFO && FX_INFO.rootPath) {
      url = FX_INFO.rootPath.toUpperCase();
    }
    if (url[url.length-1] != '/')
      url += '/';
    url += _url.toUpperCase();

    if (CODERPARSER_SINGLETON && CODERPARSER_SINGLETON.loadedFiles) {
      const f = CODERPARSER_SINGLETON.loadedFiles;
      for (let i = 0; i < f.length; i++) {
        if (f[i].name == url)
          return f[i].size;
      }
    }
    debug(_url + " not found");
  }

  /**
   * Returns the size of a file given its address
   * @param   {number} _adrs  - the address where the file was loaded
   * @returns {number} the file size in bytes
   * @throws     breakpoint if file not found in the list of loaded files
  */
  getFileSizeFromAdrs(_adrs) {
    if (CODERPARSER_SINGLETON && CODERPARSER_SINGLETON.loadedFiles) {
      const f = CODERPARSER_SINGLETON.loadedFiles;
      for (let i = 0; i < f.length; i++) {
        if (f[i].adrs == _adrs)
          return f[i].bytes;
      }
    }
    debug("file not found");
  }


  /**
   * Returns the address at which a file was loaded given its URL
   * @param   {string} _url  - file local path (path used to incbin for example)
   * @returns {number} the file address (where it' ben loaded in RAM)
   * @throws     breakpoint if file not found in the list of loaded files
  */
  getFileAdrsFromURL(_url) {
    const url = _url.toUpperCase();
    if (CODERPARSER_SINGLETON && CODERPARSER_SINGLETON.loadedFiles) {
      const f = CODERPARSER_SINGLETON.loadedFiles;
      for (let i = 0; i < f.length; i++) {
        if (f[i].name == url)
          return f[i].adrs;
      }
    }
    debug(_url + " not found");
  }


  /**
   * Retrieves the value of an asm constant declared with 'EQU' or '='
   * @param   {string} _label  - the name of the constant
   * @param   {boolean} _canFail  - (optional) set to true is the constant search can fail silently (default: false)
   * @returns {number} the value of the constant, or NaN if not found
   * @throws  alert box if constant not found AND _canFail is false
   */
  getConstValue(_label, _canFail = false) {
  let c = CODERPARSER_SINGLETON.fastConst[_label];
  if (c != null)
    return CODERPARSER_SINGLETON.constants[c].value;

  c = CODERPARSER_SINGLETON.fastConst[_label.toUpperCase()];
  if (c != null)
    return CODERPARSER_SINGLETON.constants[c].value;

  if (!_canFail) {
    let err = "TOOLS.getConstValue failed: constnat name " + _label + " not found.";
    main_Alert(err);
  }
  return NaN;
}


  /**
   * Retrieves a value from an asm label's address
   * @param   {string} _name  - Label's name
   * @param   {number} _size  - Bytes to retrieve (1, 2 or 4)
   * @param   {boolean} _signed  - Retrieve as a signed or unsigned value (true for signed)
   * @returns {number} The value of _size bytes at label _name's address
  */
   getVariable(_name, _size, _signed) {
      return MACHINE.getRAMValue(TOOLS.getLabelAdrs(_name),_size,_signed);
    }

  /**
   * Sets the value at a given label
   * @param   {string} _name  - Label's name
   * @param   {number} _value - The value to set
   * @param   {number} _size  - Bytes to write (1, 2 or 4)
  */
   setVariable(_name, _value, _size) {
      MACHINE.setRAMValue(_value, TOOLS.getLabelAdrs(_name), _size);
    }

        
  /**
   * Retrieves a value (field) in a rs.x structure
   * @param   {string} _strucLabel  - Label of the address where the struct is stored
   * @param   {string} _varName  - Name of the field
   * @param   {number} _sizeInBytes  - Bytes to retrieve (1, 2 or 4)
   * @param   {boolean} _signed  - Retrieve as a signed or unsigned value (true for signed)
   * @returns {number} The field's value
  */
  getStructField(_strucLabel, _varName, _sizeInBytes, _signed) {
    let structAdrs = TOOLS.getLabelAdrs(_strucLabel);
    let varOffset = TOOLS.getConstValue(_varName);
    return MACHINE.getRAMValue(structAdrs+varOffset,_sizeInBytes,_signed);
  }  


//    ==================================
//     ACCESSING CPU REGISTERS FROM JS
//    ==================================

  /**
  Sets the low 8 bits of a data register
  @param {number} _index  -   index of the data register (0..7) 
  @param {number} _value  -   value to write
  */
  D8_SET(_index,_value) {
      _value = Math.floor(_value);
      regs.d[_index] &= 0xffffff00;
      regs.d[_index] |= _value&0xff;  
    }
    
  /**
  returns the low 8 bits of a data register
  @param {number} _index  -   index of the data register (0..7) 
  @return {number} the low 8 bits of the chosen data register
  */
  D8_GET(_index) {
    return regs.d[_index] & 0xff;
  }
    
  /**
  Sets the low 16 bits of a data register
  @param {number} _index  -   index of the data register (0..7) 
  @param {number} _value  -   value to write
  */
  D16_SET(_index,_value) {
    _value = Math.floor(_value);
    regs.d[_index] &= 0xffff0000;
    regs.d[_index] |= _value&0xffff;  
  }
    
  /**
  returns the low 16 bits of a data register
  @param {number} _index  -   index of the data register (0..7) 
  @return {number} the low 16 bits of the chosen data register
  */
  D16_GET(_index) {
    return regs.d[_index] & 0xffff;
  }
    
  /**
  adds _value to the low 16 bits of a data register
  @param {number} _index  -   index of the data register (0..7) 
  @param {number} _value  -   value to add
  @return {number} the new low 16 bits of the chosen data register
  */
  D16_ADD(_index,_value) {
    _value = Math.floor(_value);
    TOOLS.D16_SET(_index,TOOLS.D16_GET(_index)+_value);
    return TOOLS.D16_GET(_index);
  }
    
  /**
  subtracts _value to the low 16 bits of a data register
  @param {number} _index  -   index of the data register (0..7) 
  @param {number} _value  -   value to subtract
  @return {number} the new low 16 bits of the chosen data register
  */
  D16_SUB(_index,_value) {
    _value = Math.floor(_value);
    TOOLS.D16_SET(_index,TOOLS.D16_GET(_index)-_value);
    return TOOLS.D16_GET(_index);
  }
    
  /**
  Sets the 32 bits of a data register
  @param {number} _index  -   index of the data register (0..7) 
  @param {number} _value  -   value to write
  */
  D32_SET(_index,_value) {
    _value = Math.floor(_value);
    regs.d[_index] = _value;  
  }
    
  /**
  returns the 32 bits of a data register
  @param {number} _index  -   index of the data register (0..7) 
  @return {number} the 32 bits of the chosen data register
  */
  D32_GET(_index) {
    return regs.d[_index];
  }
    
  /**
  Swaps the low and high 16 bits of a register (same as M68K asm SWAP instruction)
  @param {number} _index  -   index of the data register (0..7) 
  @return {number} the new 32 bits value of the chosen data register
  */
  D32_SWAP(_index) {
    let low =  regs.d[_index] & 0xffff;
    regs.d[_index] >>>= 16;
    regs.d[_index] |= low << 16;
    return TOOLS.D32_GET(_index);
  }
      
//    =====================
//     PLAYING WITH ARRAYS
//    =====================


  /**
  Copies a js Uint8array to asm RAM
  @param {object} _array  -   The js array to copy
  @param {number} _adrs  -   The destination address
  @param {number} _RAMindex  -   (optional) offset added to _adrs
  @param {number} _arrayIndex  -   (optional) start index in the array (default = 0)
  @param {number} _count  -   (optional) number of items to copy (default: _array.length - _arrayIndex)
  */
  Uint8ArrayToRAM(_array, _adrs, _RAMindex = 0, _arrayIndex = 0, _count = 0) {
    let adrs = _adrs + _RAMindex;
    if (_count == 0)
      _count = _array.length - _arrayIndex;
    for (let c  = 0; c < _count; c++) {
      MACHINE.ram[adrs++] = _array[_arrayIndex + c];
    }
    
  }

  /**
  Copies a js Uint8array to asm RAM
  @param {object} _array  -   The js array to copy
  @param {string} _label  -   asm label for the destination address
  @param {number} _RAMindex  -   (optional) offset added to _adrs
  @param {number} _arrayIndex  -   (optional) start index in the array (default = 0)
  @param {number} _count  -   (optional) number of items to copy (default: _array.length - _arrayIndex)
  @throws error if _label not found in asm code
  */
  UIn8ArrayToLabel(_array, _label, _RAMindex = 0, _arrayIndex = 0, _count = 0) {
    let adrs = TOOLS.getLabelAdrs(_label);
    if (isNaN(adrs))
      return;
    TOOLS.Uint8ArrayToRAM(_array, adrs, _RAMindex, _arrayIndex);
  }

  /**
  Copies a js Uint16array to asm RAM
  @param {object} _array  -   The js array to copy
  @param {number} _adrs  -   The destination address
  @param {number} _RAMindex  -   (optional) offset added to _adrs
  @param {number} _arrayIndex  -   (optional) start index in the array (default = 0)
  @param {number} _count  -   (optional) number of items to copy (default: _array.length - _arrayIndex)
  */
  Uint16ArrayToRAM(_array, _adrs, _RAMindex = 0, _arrayIndex = 0, _count = 0) {
    let adrs = _adrs + _RAMindex;
    if (_count == 0)
      _count = _array.length - _arrayIndex;
    for (let c = 0; c < _count; c++) {
      let v = _array[_arrayIndex + c];
      MACHINE.setRAMValue(v,adrs+c*2,2);
    }  
  }

  /**
  Copies a js Int16array to asm RAM
  @param {object} _array  -   The js array to copy
  @param {number} _adrs  -   The destination address
  @param {number} _RAMindex  -   (optional) offset added to _adrs
  @param {number} _arrayIndex  -   (optional) start index in the array (default = 0)
  @param {number} _count  -   (optional) number of items to copy (default: _array.length - _arrayIndex)
  */
  Int16ArrayToRAM(_array, _adrs, _RAMindex = 0, _arrayIndex = 0, _count = 0) {
    let adrs = _adrs + _RAMindex;
    if (_count == 0)
      _count = _array.length - _arrayIndex;
    for (let c = 0; c < _count; c++) {
      let v = _array[_arrayIndex + c];
      MACHINE.setRAMValue(JSInt16ToAsm(v),adrs+c*2,2);
    }  
  }

  /**
  Copies a js Uint16array to asm RAM
  @param {object} _array  -   The js array to copy
  @param {string} _label  -   asm label for the destination address
  @param {number} _RAMindex  -   (optional) offset added to _adrs
  @param {number} _arrayIndex  -   (optional) start index in the array (default = 0)
  @param {number} _count  -   (optional) number of items to copy (default: _array.length - _arrayIndex)
  @throws error if _label not found in asm code
  */
  UIn16ArrayToLabel(_array, _label, _RAMindex = 0, _arrayIndex = 0, _count = 0) {
    let adrs = TOOLS.getLabelAdrs(_label);
    if (isNaN(adrs))
      return;
    if (_count == 0) {
      _count = _array.length;
    }
    TOOLS.Uint16ArrayToRAM(_array, adrs, _RAMindex, _arrayIndex, _count);
  }

  /**
  Copies a js Int16array to asm RAM
  @param {object} _array  -   The js array to copy
  @param {string} _label  -   asm label for the destination address
  @param {number} _RAMindex  -   (optional) offset added to _adrs
  @param {number} _arrayIndex  -   (optional) start index in the array (default = 0)
  @param {number} _count  -   (optional) number of items to copy (default: _array.length - _arrayIndex)
  @throws error if _label not found in asm code
  */
  In16ArrayToLabel(_array, _label, _RAMindex = 0, _arrayIndex = 0, _count = 0) {
    let adrs = TOOLS.getLabelAdrs(_label);
    if (isNaN(adrs))
      return;
    TOOLS.Int16ArrayToRAM(_array, adrs, _RAMindex, _arrayIndex, _count);
  }

  /**
  Copies from asm RAM to a js Int16array
  @param {string} _label  -   asm label for the source address
  @param {object} _array  -   Destination js array
  @param {number} _count  -   (optional) number of items to copy (default: _array.length)
  @param {boolean} _verify  -  (optional) if true, will expect the js array to already contain the exact same values as the asm array. Useful to verify that a js and an asm code compute the same set of values (default: false)
  @throws error if _label not found in asm code
  @throws error if _verify is true and values do not match
  */
  LabelToIn16Array(_label, _array, _count = 0, _verify = false) {
    let adrs = TOOLS.getLabelAdrs(_label);
    if (isNaN(adrs))
      return;
    if (_count == 0)
      _count = _array.length;
    for (let i = 0; i < _count; i++) {
      const v = MACHINE.getRAMValue(adrs + i * 2, 2, true);
      if (_verify && (_array[i] != v)) {
        alert("LabelToIn16Array verification failed.\nindex: " + i + ", expected: " + _array[i] + ", got: " + v);
        console.error("index: " + i + ", expected: " + _array[i] + ", got: " + v);
        debugger;
      }
      _array[i] = v;
    }
  }

  /**
  Copies from asm RAM to a js Uint16array
  @param {string} _label  -   asm label for the source address
  @param {object} _array  -   Destination js array
  @param {number} _count  -   (optional) number of items to copy (default: _array.length)
  @param {boolean} _verify  -  (optional) if true, will expect the js array to already contain the exact same values as the asm array. Useful to verify that a js and an asm code compute the same set of values (default: false)
  @throws error if _label not found in asm code
  @throws error if _verify is true and values do not match
  */
  LabelToUIn16Array(_label, _array, _count = 0, _verify = false) {
    let adrs = TOOLS.getLabelAdrs(_label);
    if (isNaN(adrs))
      return;
    if (_count == 0)
      _count = _array.length;
    for (let i = 0; i < _count; i++) {
      const v = MACHINE.getRAMValue(adrs + i * 2, 2, false);
      if (_verify && (_array[i] != v)) {
        alert("LabelToUIn16Array verification failed.\nindex: " + i + ", expected: " + _array[i] + ", got: " + v);
        console.log("index: " + i + ", expected: " + _array[i] + ", got: " + v);
        debugger;
      }
      _array[i] = v;
    }
  }

  /**
  Copies from asm RAM to a js Int8array
  @param {string} _label  -   asm label for the source address
  @param {object} _array  -   Destination js array
  @param {number} _count  -   (optional) number of items to copy (default: _array.length)
  @param {boolean} _verify  -  (optional) if true, will expect the js array to already contain the exact same values as the asm array. Useful to verify that a js and an asm code compute the same set of values (default: false)
  @throws error if _label not found in asm code
  @throws error if _verify is true and values do not match
  */
  LabelToIn8Array(_label, _array, _count = 0, _verify = false) {
    let adrs = TOOLS.getLabelAdrs(_label);
    if (isNaN(adrs))
      return;
    if (_count == 0)
      _count = _array.length;
    for (let i = 0; i < _count; i++) {
      const v = MACHINE.getRAMValue(adrs + i, 1, true);
      if (_verify && (_array[i] != v)) {
        alert("LabelToIn8Array verification failed.\nindex: " + i + ", expected: " + _array[i] + ", got: " + v);
        console.log("index: " + i + ", expected: " + _array[i] + ", got: " + v);
        debugger;
      }
      _array[i] = v;
    }
  }

  /**
  Copies from asm RAM to a js Uint8array
  @param {string} _label  -   asm label for the source address
  @param {object} _array  -   Destination js array
  @param {number} _count  -   (optional) number of items to copy (default: _array.length)
  @param {boolean} _verify  -  (optional) if true, will expect the js array to already contain the exact same values as the asm array. Useful to verify that a js and an asm code compute the same set of values (default: false)
  @throws error if _label not found in asm code
  @throws error if _verify is true and values do not match
  */
  LabelToUIn8Array(_label, _array, _count = 0, _verify = false) {
    let adrs = TOOLS.getLabelAdrs(_label);
    if (isNaN(adrs))
      return;
    if (_count == 0)
      _count = _array.length;
    for (let i = 0; i < _count; i++) {
      const v = MACHINE.getRAMValue(adrs + i, 1, false);
      if (_verify && (_array[i] != v)) {
        alert("LabelToUIn8Array verification failed.\nindex: " + i + ", expected: " + _array[i] + ", got: " + v);
        console.log("index: " + i + ", expected: " + _array[i] + ", got: " + v);
        debugger;
      }
      _array[i] = v;
    }
  }


//    =============
//     RAM TO DISK
//    =============


  // internal
  downloadView(view, _outputFileName) {
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

  /**
  Dumps RAM to a file
  @param {number} _adrs  -   The source address
  @param {number} _count  -  The number of bytes to write to disk
  @param {string} _outputFileName  -  The file name to write to
  @param {boolean} _showDoneMsg  -  (optional) Show an alert box when save is done (default: false)
  */
  RAMToFile_bytes(_adrs, _count, _outputFileName, _showDoneMsg = false) {
    var buffer = new ArrayBuffer(_count);
    var view = new DataView(buffer);
    for (let i = 0; i < _count; i++)
      view.setUint8(i, MACHINE.ram[_adrs + i]);
    TOOLS.downloadView(view, _outputFileName);
    if (_showDoneMsg) alert("saved " + _outputFileName);
  }

  /**
  Dumps RAM to a file
  @param {number} _adrs  -   The source address
  @param {number} _count  -  The number of longs to write to disk
  @param {string} _outputFileName  -  The file name to write to
  */
  RAMToFile_longs(_adrs, _count, _outputFileName) {
    var buffer = new ArrayBuffer(_count * 4);
    var view = new DataView(buffer);
    for (let i = 0; i < _count; i++) {
      let v = new Uint32Array(5);
      v[0] = MACHINE.ram[_adrs + i * 4 + 3] & 0xff;
      v[1] = (MACHINE.ram[_adrs + i * 4 + 2] & 0xff) << 8;
      v[2] = (MACHINE.ram[_adrs + i * 4 + 1] & 0xff) << 16;
      v[3] = (MACHINE.ram[_adrs + i * 4 + 0] & 0xff) << 24;
      view.setUint8(i * 4 + 0, v[3]);
      view.setUint8(i * 4 + 1, v[2]);
      view.setUint8(i * 4 + 2, v[1]);
      view.setUint8(i * 4 + 3, v[0]);
    }

    TOOLS.downloadView(view, _outputFileName);
  }

  /**
   * Takes a screenshot of the current render and saves it to disk.
   * @param {string} _fileName  - If null, will generate a name as follows: "<fx_classname>_frame_<frame_number>"
   */
  Screenshot(_fileName) {
    if (!_fileName) {
      if (MYFX && FX_INFO)
        _fileName = FX_INFO.classname + "_frame_" + MYFX.updatedFramesCount;
      else
      _fileName = "M68kWB_screenshot";
    }

    const resolution = MACHINE.getResolution();
    const scanvas = document.createElement("canvas");
    scanvas.width = resolution.w;
    scanvas.height = resolution.h;
    const sctx = scanvas.getContext("2d");
    sctx.drawImage(BACKBUF_CVS, PLATFORM_OFSX, PLATFORM_OFSY, resolution.w, resolution.h, 0, 0, resolution.w, resolution.h);    
    const strData = scanvas.toDataURL("image/octet-stream");
    let saveLink = document.createElement("a");
    saveLink.download = _fileName + ".png";
    saveLink.href = strData;
    saveLink.click();  
  }

  /**
   * Forbids memory read access outside a given zone [_min, _max[
   * @param {integer} _min  - Minimum allowed read address (inclusive)
   * @param {integer} _max  - Maximum allowed read address (exclusive)
   */
  limitRead(_min, _max) {
    CPU_DBG_READ_ALLOW_START = _min;
    CPU_DBG_READ_ALLOW_END = _max;
  }

  /**
   * Cancels memory read limit
   */
  freeRead() {
    CPU_DBG_READ_ALLOW_START = -1;
    CPU_DBG_READ_ALLOW_END = -1;
  }

  /**
   * Forbids memory write access outside a given zone [_min, _max[
   * @param {integer} _min  - Minimum allowed write address (inclusive)
   * @param {integer} _max  - Maximum allowed write address (exclusive)
   */
  limitWrite(_min, _max) {
    CPU_DBG_WRITE_ALLOW_START = _min;
    CPU_DBG_WRITE_ALLOW_END = _max;
  }

  /**
   * Cancels memory write limit
   */
  freeWrite() {
    CPU_DBG_WRITE_ALLOW_START = -1;
    CPU_DBG_WRITE_ALLOW_END = -1;
  }
 
  /**
   * Loads a file and returs its contents as a string
   * @param {string} _path  - The file's path
   */
  LoadStringFiles(_paths, _onLoaded) {
    let t = this;
    if (!t.filesToload) t.filesToload = [];

    let startIndex = t.filesToload.length;
    for (let i = 0; i < _paths.length; i++) {
      let rootPath = "";
      if (FX_INFO && FX_INFO.rootPath)
        rootPath= FX_INFO.rootPath;
      if (rootPath.length > 0 && rootPath[rootPath.length-1] != '/')
          rootPath += "/";    
      let path = rootPath + _paths[i];
      t.filesToload.push({path: path, onLoaded: _onLoaded});
    }

    for (let i = startIndex; i < t.filesToload.length; i++) {
      let data = t.filesToload[i];
      let path = data.path;
      const d = new Date();
      let ms = d.getMilliseconds();
      const file = path + "?v="+ms; // avoid cache sending an old version of the file
      let rawFile = new XMLHttpRequest();
      rawFile.open("GET", file, false);
      rawFile.userPath = path;
      rawFile.onreadystatechange = function () {
        if (rawFile.readyState === 4) {
          if (rawFile.status === 200 || rawFile.status == 0) {
            MYFX.onFileLoaded(rawFile.responseText, rawFile.userPath);
          }
        }
        else switch (rawFile.status) {
              case 403: main_Alert("can't load file: " + path + " : error 403 (forbidden)");
                this.waitingOnFile = null;
              return false;
              case 404:
                main_Alert("can't load file: " + path + " : error 404 (not found)");
                this.waitingOnFile = null;
              return false;
              default:
                if (rawFile.status >= 400) main_Alert("can't load " + path + " : error #" + rawFile.status);
                  this.waitingOnFile = null;
                return false;
        }
      }
      try {
        rawFile.send(null);
      } catch (e) {
        main_Alert(e);
        t.waitingOnFile = null;
      }
    }
  }
}


  /*
   How to create arrays in javascript:
    this.arrU8   = new Uint8Array(count);
    this.arrI8   = new Int8Array(count);
    this.arrU16  = new Uint16Array(count);
    this.arrI16  = new Int16Array(count);
    this.arrU32  = new Uint32Array(count);
    this.arrI32  = new Int32Array(count);

    Note that using typed arrays is the only way to make sure JavaScript is using a specific type,
    The is no typed variable, only typed arrays.
    
    this.arrU16  = new Uint16Array(256);
    ...
    // create some mul34 table in ASM
    invoke68K("createMul34Table");
  ...
    // copy the ASM table to the JS table
    TOOLS.LabelToUIn16Array("mul34table", this.arrU16);
    ...
    // verify values
    for (let i = 0; i < this.arrU16.length; i++) {
      if (this.arrU16[i] != 34*i) {
        alert("error at index:" + i);
      }
    }
    ...
    
    */
