  function API_CHANGED(_s, _newName = null, _extra = null) {
    if (!_newName) _newName = _s;
    let msg = "API changed for '" + _s + "': Please use 'TOOLS." + _newName + "' from now on.";
    if (_extra) msg += "\n" + _extra;
    const err = new Error();
    msg += "\ncall stack:\n" + err.stack;
    //s = filterStack(err.stack);
    main_Alert(msg);
    throw err;
  }

  function MULS_68K(s, d) {
    API_CHANGED("MULS_68K");
  }

  function DIVS_68K(_dest, _source) {
    API_CHANGED("DIVS_68K", null, "BEWARE! ARGS ORDER CHANGED! Used to be (_dest,_source), now it's (_source,_Dest)");
  }
  
  function toInt8(_v) {
    API_CHANGED("toInt8");
  };
  
  
  function toInt16 (_v) {
    API_CHANGED("toInt16");
  };

  function toInt32(_v) {
    API_CHANGED("toInt32");
  }

  function JSInt16ToAsm(_value) {
    API_CHANGED("JSInt16ToAsm");
  }

  function GET_VARIABLE(_name, _size, _signed) {
    API_CHANGED("GET_VARIABLE", "getVariable");
  }

      
function DEBUGGER_GETVARIABLEINSTRUCT(_strucLabel, _varName, _sizeInBytes, _signed) {
  API_CHANGED("DEBUGGER_GETVARIABLEINSTRUCT", "getStructField");
}  

function D8_SET(_index,_value) {
  API_CHANGED("DEBUGGER_GETVARIABLEINSTRUCT");
  }
  
function D8_GET(_index) {
  API_CHANGED("D8_GET");
}
  
function D16_SET(_index,_value) {
  API_CHANGED("D16_SET");
}
  
function D16_GET(_index) {
  API_CHANGED("D16_GET");
}
  
function D16_ADD(_index,_value) {
  API_CHANGED("D16_ADD");
}
  
function D16_SUB(_index,_value) {
  API_CHANGED("D16_SUB");
}
  
function D32_SET(_index,_value) {
  API_CHANGED("D32_SET");
}

function D32_GET(_index) {
  API_CHANGED("D32_GET");
}
  
function D32_SWAP(_index) {
  API_CHANGED("D32_SWAP");
}
    

function JS2ASM_Uint8ArrayToRAM(_array, _adrs, _RAMindex = 0, _arrayIndex = 0, _count = 0) {
  API_CHANGED("JS2ASM_Uint8ArrayToRAM", "Uint8ArrayToRAM");
}

function JS2ASM_UIn8ArrayToLabel(_array, _label, _RAMindex = 0, _arrayIndex = 0, _count = 0) {
  API_CHANGED("JS2ASM_UIn8ArrayToLabel", "UIn8ArrayToLabel");
}

function JS2ASM_Uint16ArrayToRAM(_array, _adrs, _RAMindex = 0, _arrayIndex = 0, _count = 0) {
  API_CHANGED("JS2ASM_Uint16ArrayToRAM", "Uint16ArrayToRAM");
}

function JS2ASM_Int16ArrayToRAM(_array, _adrs, _RAMindex = 0, _arrayIndex = 0, _count = 0) {
  API_CHANGED("JS2ASM_Int16ArrayToRAM", "Int16ArrayToRAM");
}

function JS2ASM_UIn16ArrayToLabel(_array, _label, _RAMindex = 0, _arrayIndex = 0, _count = 0) {
  API_CHANGED("JS2ASM_UIn16ArrayToLabel");
}

function JS2ASM_In16ArrayToLabel(_array, _label, _RAMindex = 0, _arrayIndex = 0, _count = 0) {
  API_CHANGED("JS2ASM_In16ArrayToLabel","In16ArrayToLabel");
}

function ASM2JS_LabelToIn16Array(_label, _array, _count = 0, _verify = false) {
  API_CHANGED("ASM2JS_LabelToIn16Array","LabelToIn16Array");
}

function ASM2JS_LabelToUIn16Array(_label, _array, _count = 0, _verify = false) {
  API_CHANGED("ASM2JS_LabelToUIn16Array","LabelToUIn16Array");
}

function ASM2JS_LabelToIn8Array(_label, _array, _count = 0, _verify = false) {
  API_CHANGED("ASM2JS_LabelToIn8Array","LabelToIn8Array");
}

function ASM2JS_LabelToUIn8Array(_label, _array, _count = 0, _verify = false) {
  API_CHANGED("ASM2JS_LabelToUIn8Array","LabelToUIn8Array");
}

function downloadView(view, _outputFileName) {
  API_CHANGED("downloadView");
}

function RAMToFile_bytes(_adrs, _count, _outputFileName, _showDoneMsg = false) {
  API_CHANGED("RAMToFile_bytes");
}

function RAMToFile_longs(_adrs, _count, _outputFileName, breakOn=null) {
  API_CHANGED("RAMToFile_longs", null, "extra param 'breakOn' was removed");
}

function PARSER_getLabelAdrs(_label, _canFail = false, _canBeCode = true) {
  API_CHANGED("PARSER_getLabelAdrs", "getLabelAdrs");
}


function PARSER_getConstValue(_label, _canFail = false) {
  API_CHANGED("PARSER_getConstValue", "getConstValue");
}
