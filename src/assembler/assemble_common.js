var ASMBL_INSTRGRP = [];
var ASMBL_ADRSTOLINE = []; // ASMBL_ADRSTOLINE contains for each address the corresponding line index in CODERPARSER_SINGLETON.strings.lines[]

var ASMBL_ADRSTOLINE_GEN = [];
var ASSEMBLER_CONTEXT = [];
var ASSEMBLER_CURLINE = null;

const OP_SIZE_SHIFT = 6;
const OP_SIZE_MASK  = 0b011000000;
const OP_SIZE_BYTE  = 0b00;
const OP_SIZE_WORD  = 0b01;
const OP_SIZE_LONG  = 0b10;

const OP_MODE_DREG    = 0b000;      // Dn
const OP_MODE_AREG    = 0b001;      // An
const OP_MODE_AD      = 0b010;      // (An)
const OP_MODE_AD_POST = 0b011;      // (An)+
const OP_MODE_AD_PRE  = 0b100;      // -(An)
const OP_MODE_AD_DISP = 0b101;      // disp.w(An)
const OP_MODE_AD_IND  = 0b110;      // (An,Xn.w) AND disp.b(An,Xn.w)
const OP_MODE_PC_DISP = 0b111;      // (Dn.w,PC)
const OP_MODE_PC_IND  = 0b111;      // (Dn.b,PC,Xn)
const OP_MODE_ABS_W   = 0b111;      // (xxx).W
const OP_MODE_ABS_L   = 0b111;      // (xxx).L
const OP_MODE_ABS_IMM = 0b111;      // #imm


function asmbl_error(_e) {
  let he = _e;
  let ce = _e;
  for (let i = 0; i < ASSEMBLER_CONTEXT.length; i++) {
    he += "<br>" + ASSEMBLER_CONTEXT[i];
    ce += "\n" + ASSEMBLER_CONTEXT[i];
    CODERPARSER_SINGLETON.push_error(ASSEMBLER_CONTEXT[i]);
    CODERPARSER_SINGLETON.stopGlobalCompilation = true;
  }
  CODERPARSER_SINGLETON.push_error(_e);
  console.error(ce);
  showHTMLError(he);
  debugger;  
}

function asmbl_syntaxError(_l, _e, _syntax) {
  let he = _l.getFailString(_e);
  let ce = _l.getFailString(_e);
  if (_syntax && _syntax.length>0) {
    he += '<br>Supported syntax:';
    ce += '\nSupported syntax:';
    for (let i = 0; i < _syntax.length; i++) {
        he += '<br>' + _syntax[i];
        ce += '\n' + _syntax[i];
    }  
  }
  CODERPARSER_SINGLETON.push_error(ce);
  console.error(ce);
  showHTMLError(he);
  debugger;  
}

function asmbl_warning(_l, _e) {
  let str = _l.getWarningString(_e);
  console.warn(str);
  showHTMLError(str);
}

function asmbl_clearBits(_op, _bits) {
    _op &= ~_bits;
    return _op;
  }

function asmbl_setBits(_op, _bits) {
    _op |= _bits;
    return _op;
  }
    

function asmbl_getRegisterAsmCode(_tab, _ind) {
  if (_tab == regs.d) {
    if (_ind >= 0 && _ind <= 7)
      return _ind;
  }

  if (_tab == regs.a) {
    if (_ind >= 0 && _ind <= 7)
      return 0x80 + 0x10 * _ind;
  }
  
  asmbl_error("bad register");
  return NaN;
}

function asmbl_modeError(_msg) {
    asmbl_error("asmbl_setMode: " + _msg);
    return {op : NaN, byteData:[]};
}

function asmbl_isEffectiveAddress(_arg) {
    switch(_arg.type) {
        case 'imm':
        case 'reg':
        return false;
        case 'adrs':
        case 'labl':
        case 'ind': return true;
    }
    asmbl_error("unknown argument type for: " + _arg.str);
    return false;
}

  function asmbl_setMode(_arg, _op, _sft, _bitCount, _ret = null) {
    let ret = _ret;
    if (ret == null) ret = {op : _op, byteData:[]};
    let _msk = (1<<_bitCount)-1;
    _msk <<= _sft;
    if ((_op & _msk) != 0) return asmbl_modeError("opcode already has MODE set");
    switch(_arg.type) {
        case 'imm':
            ret.op = _op | 0b111100;
        return ret;
        case 'ind':
          if (_arg.tab != regs.a) return asmbl_modeError("indirect addressing requires an addresss register");
          if (_arg.predecrement) {
            if (_arg.postincrement) return asmbl_modeError("can't have both pre-decrement and post-increment");
            if (_arg.disp) return asmbl_modeError("can't have both pre-decrement and displacement");
            if (_arg.indTab) return asmbl_modeError("can't have both pre-decrement and ',Dn.w' indirect addressing");
            ret.op = _op | (OP_MODE_AD_PRE << _sft); return ret;
          }
          if (_arg.postincrement) {
            if (_arg.disp) return asmbl_modeError("can't have both post-increment and displacement");
            if (_arg.indTab) return asmbl_modeError("can't have both post-increment and ',Dn.w' indirect addressing");
            ret.op = _op | (OP_MODE_AD_POST << _sft); return ret;
          }
          let dispval = 0;
          if (_arg.disp)
            dispval = _arg.disp;
          if (_arg.indTab) {
            if (dispval < -256 || dispval > 255) return asmbl_modeError("d(An,Xn.w): displacement is 8 bits max");
            let indRegCode = asmbl_getRegisterAsmCode(_arg.indTab, _arg.indInd);
            if (indRegCode<8)
              indRegCode <<= 4;
            ret.byteData.push(indRegCode);
            ret.byteData.push(dispval);
            ret.op = _op | (OP_MODE_AD_IND << _sft);
            return ret;
          }
          if (dispval < -65536 || dispval > 65535) return asmbl_modeError("d.w(An): displacement is 16 bits max");
          if (_arg.indTab) {
            ret.byteData.push((dispval>>8)&0xff);
            ret.byteData.push(dispval&0xff);
            ret.op = _op | (OP_MODE_AD_IND << _sft); return ret;
          }
          else {
            let mode = OP_MODE_AD;
            if (_arg.disp) {
              mode = OP_MODE_AD_DISP;
              ret.byteData.push((dispval>>8)&0xff);
              ret.byteData.push(dispval&0xff);
            }
            ret.op = _op | (mode << _sft); return ret;
          }
          // not yet covered
          // const OP_MODE_PC_DISP = 0b111;      // (Dn.w,PC)
          // const OP_MODE_PC_IND  = 0b111;      // (Dn.b,PC,Xn)
        break;
        case 'reg':
          if (_arg.tab == regs.d) {
            ret.op =  _op | (OP_MODE_DREG << _sft);
          }
          if (_arg.tab == regs.a) {
            ret.op =  _op | (OP_MODE_AREG << _sft);
          }
        return ret;
        case 'adrs':
            ret.byteData.push((_arg.value>>24)&0xff);
            ret.byteData.push((_arg.value>>16)&0xff);
            ret.byteData.push((_arg.value>>8)&0xff);
            ret.byteData.push(_arg.value&0xff);
            ret.op =  _op | (OP_MODE_ABS_L << _sft);
        return ret;
        case 'labl':
            CODERPARSER_SINGLETON.labelToAddress.push({l:ASSEMBLER_CURLINE, dataStart:ret.byteData.length, dataLen:4, arg:_arg});
            ret.byteData.push(0xde);
            ret.byteData.push(0xad);
            ret.byteData.push(0xbe);
            ret.byteData.push(0xef);
            ret.op =  _op | (OP_MODE_ABS_L << _sft);
        return ret;
    }
    return asmbl_modeError("illegal addressing mode");
  }
  
  
function asmbl_setUniqueBits(_op, _bits) {
if ((_op & _bits) != 0) {
    for (let i = 0; i<16; i++) {
        const msk = 1<<i;
        if ((_bits & msk) != 0) {
            if ((_op & msk) != 0) {
                console.error("bit #"+i+" already set");
            }    
        }
    }
    asmbl_error("opcode already has bits set");
}
return _op | _bits;
}

function asmbl_setGroup(_op, _grp) {
    if ((_op & 0b1111000000000000) != 0) asmbl_error("opcode already has group set");
    if ((_grp  & 0xfffffff0) != 0)
        asmbl_error("group should be 4 bits");
    return _op | (_grp << 12);
  }

function asmbl_setSize(_l, _op) {
    if ((_op & OP_SIZE_MASK) != 0) asmbl_error("opcode already has SIZE set");
    let c = NaN;
    switch(_l.instrSize) {
      case 1 : c = OP_SIZE_BYTE; break;
      case 2 : c = OP_SIZE_WORD; break;
      case 4 : c = OP_SIZE_LONG; break;
    }
    if (!isNaN(c)) {
      return _op | (c << OP_SIZE_SHIFT);
    }
    asmbl_error("- set_size - illegal size: expected byte, word or long");
    return NaN;
  }
  
  function asmbl_setDataReg03(_arg, _op) {
    if ((_op & 0b111) != 0) asmbl_error("asmbl_setDataReg03 aready set");
    if (_arg.tab == regs.d) {
        if (_arg.ind >= 0 && _arg.ind <= 7)
            return _op | _arg.ind;
        else asmbl_error("asmbl_setDataReg03: bad data register index: " + _arg.ind);
    } else asmbl_error("asmbl_setDataReg03: data register not found in: " + _arg.str);
}

function asmbl_setDataReg93(_arg, _op) {
    if ((_op & 0b0000111000000000) != 0) asmbl_error("asmbl_setDataReg93 aready set");
    if (_arg.tab == regs.d) {
        if (_arg.ind >= 0 && _arg.ind <= 7)
            return _op | (_arg.ind << 9);
        else asmbl_error("asmbl_setDataReg93: bad data register index: " + _arg.ind);
    } else asmbl_error("asmbl_setDataReg93: data register not found in: " + _arg.str);
}


function asmbl_setAdrsReg03(_arg, _op) {
    if ((_op & 0b0000000000000111) != 0) asmbl_error("asmbl_setAdrsReg03 aready set");
    if (_arg.tab == regs.a) {
        if (_arg.ind >= 0 && _arg.ind <= 7)
            return _op | _arg.ind;
        else asmbl_error("asmbl_setAdrsReg03: bad address register index: " + _arg.ind);
    } else {
        if ((_arg.type == 'adrs') || (_arg.type == 'labl')) {
            return _op | 1;
        }
        else asmbl_error("asmbl_setAdrsReg03: address register not found in: " + _arg.str);
    }
}

function asmbl_setAdrsReg93(_arg, _op) {
    if ((_op & 0b0000111000000000) != 0) asmbl_error("asmbl_setAdrsReg93 aready set");
    if (_arg.tab == regs.a) {
        if (_arg.ind >= 0 && _arg.ind <= 7)
            return _op | (_arg.ind << 9);
        else asmbl_error("asmbl_setAdrsReg93: bad address register index: " + _arg.ind);
    } else {
      if ((_arg.type == 'adrs') || (_arg.type == 'labl')) {
        return _op | (1<<9);
        }
        else asmbl_error("asmbl_setAdrsReg93: address register not found in: " + _arg.str);
    }
}

function asmbl_argIsAnyReg(_arg) {
    if (asmbl_argIsDataReg(_arg)) return true;
    if (asmbl_argIsAdrsReg(_arg)) return true;
    return false;
}

function asmbl_argIsDataReg(_arg) {
    if (_arg.type == 'reg') {
        if (_arg.tab == regs.d) {
            if (_arg.ind >= 0 && _arg.ind <= 7)
                return true;
        }
    }
    return false;
}


function asmbl_argIsAdrsReg(_arg) {
    if (_arg.type == 'reg') {
        if (_arg.tab == regs.a) {
            if (_arg.ind >= 0 && _arg.ind <= 7) {
                return true;
            }
        }
    }
    return false;
}



function asmbl_buildArray(_op, _out) {
    _out.tab[_out.ofs++] = (_op.op>>8)&0xff;
    _out.tab[_out.ofs++] = _op.op&0xff;
    for (let i = 0; i < _op.byteData.length; i++) {
        _out.tab[_out.ofs++] = _op.byteData[i]&0xff;
    }
}

// _l : instruction (LineParser)
// _out : {tab:Uint8Array, ofs:int}
function asmbl_go(_l, _out) {
  ASSEMBLER_CONTEXT.push("assembling: " + _l.getFileLineStr() + " ( " + _l.filtered + " )");
  ASSEMBLER_CURLINE = _l;
  let w0 = 0;
  const func = ASMBL_INSTRGRP[_l.instr];
  if (func) {
    try {
      func(_l, w0, _out)
    } catch (err) {
      asmbl_syntaxError(_l,"Can't compile instruction (" + err + ")", []);
      debugger;  
    }
  }
  else {
    asmbl_syntaxError(_l,"Unrecognized instruction", []);
    debugger;
  }
  ASSEMBLER_CONTEXT.pop();
  return _out;
}