// timings: https://gist.github.com/cbmeeks/e759c7061d61ec4ac354a7df44a4a8f1

const ERRORIMMUNE_COMMENT = "\nIf this behavior was intended, just add the following comment: '; M68KWB_NOERROR' at the end of the line.\n";

const MAX_32 = (1 << 30);
const MAX_16 = (1 << 16);
const SIGN_BIT_8 = 0x80;
const SIGN_BIT_16 = 0x8000;
const SIGN_BIT_32 = 0x80000000;
const MASK_8BIT = 0xff;
const MASK_16BIT = 0xffff;
const MASK_32BIT = 0xffffffff;
const ALLOW_READ = 1;
const ALLOW_WRITE = 2;
const M68K_VBL_INTERRUPT = 1;

// TARGET PLATFORM API
var CPU_isCustomAdrs = null;
var CPU_setCustom_B = null;
var CPU_setCustom_W = null;
var CPU_setCustom_L = null;
var CPU_getCustom_B = null;
var CPU_getCustom_W = null;
var CPU_getCustom_L = null;
var CPU_CUSTOM_START = null;
var CPU_DBG_READ_ALLOW_START = -1;
var CPU_DBG_READ_ALLOW_END = -1;
var CPU_DBG_WRITE_ALLOW_START = 0;
var CPU_DBG_WRITE_ALLOW_END = 9999999;
var CPU_DBG_WRITE_FORBID_START = -1;
var CPU_DBG_WRITE_FORBID_END = -1;
var CPU_LAST_INTERRUPT_TIME = 0;
var LAST_GETARG = [];
var LAST_SETARG = [];
var M68K_IP = 0;
var M68K_NEXTIP = 0;
var M68K_PREVIP = 0;
var M68K_CURLINE = null;
var M68K_lastBranches = new Uint32Array(1024);
var M68K_lastBranchIndex = 0;
var M68K_lastBranchesInterrupt = new Uint32Array(1024);
var M68K_lastBranchIndexInterrupt = 0;
var M68K_TRACINGERR = 'M68KWB_Tracing';
var M68K_INSIDETRYCATCH = false;
var M68K_CYCLES = 0;
var M68K_MINCYCLES = -1;
var M68K_MAXCYCLES = -1;
var M68K_INTERRUPT_COUNTER = 0;
var M68K_INTERRUPT_STATE = null;
var M68K_VBL_CALLBACK = null;
var M68K_HBL_CALLBACK = null;
var M68K_TICKS_PER_SECOND = 8000000;
var M68K_VECTORS_ZONE_SIZE = 0x500; // 0x466 needed for ST VBL counter
var M68K_TICKS_PER_FRAME = Math.floor(M68K_TICKS_PER_SECOND/50);
var M68K_FORCENEXTVBL = false;
var M68K_DEBUGNEXTLINE = false;
var M68K_DIVS_STAT = null;
var M68K_COLLECT_DIVS_STATS = false;

var M68K_EXECUTED = 0;
var M68K_LASTEXEC = new Array(16);

var setArgAllowPredec = true;
var getArgAllowPostInc = true;

function DisallowPrePost() {
  setArgAllowPredec = false;
  getArgAllowPostInc = false;  
}

function AllowPrePost() {
  setArgAllowPredec = true;
  getArgAllowPostInc = true;  
}

var CPU_CODE_SECTION = null;


function DREG(index,bits=32) {
  const mask = (1 << bits) - 1;
  return regs.d[index] & mask;
}

function AREG(index,bits=32) {
  const mask = (1 << bits) - 1;
  return regs.a[index] & mask;
}

// _fromIp = -1 ==> from interrupt, not from branching instruciton
function reportBranch(_fromIp) {
  if (M68K_INTERRUPT_STATE == null) {
    M68K_lastBranches[M68K_lastBranchIndex] = M68K_IP;
    M68K_lastBranchIndex = (M68K_lastBranchIndex + 1) & 1023;
  } else {
    M68K_lastBranchesInterrupt[M68K_lastBranchIndexInterrupt] = M68K_IP;
    M68K_lastBranchIndexInterrupt = (M68K_lastBranchIndexInterrupt + 1) & 1023;
  }
}

function castByte(v) {
  return (v & 0x80) ? (v - 0x100) : v;
}
function castWord(v) {
  return (v & 0x8000) ? (v - 0x10000) : v;
}
function castLong(v) {
  return (v & 0x80000000) ? (v - 0x100000000) : v;
}

function extByteToWord(v) {
  return (v & 0x80) ? (0xff00 | v) : v;
}
function extByte(v) {
  return (v & 0x80) ? ((0xffffff00 | v) >>> 0) : v;
}
function extWord(v) {
  return (v & 0x8000) ? ((0xffff0000 | v) >>> 0) : v;
}

function add32(a, b) {
  var r = a + b;
  return r > 0xffffffff ? r - 0x100000000 : r;
}

function sub32(a, b) {
  var r = a - b;
  return r < 0 ? r + 0x100000000 : r;
}


function checkSignedDouble(_v) {
  const n = Math.floor(_v);
  if ((n > (MAX_32 - 1)) || (n < -MAX_32)) {
    debugger;
    main_Alert("checkSignedDouble failed");
  }
}

function checkSignedWord(_v) {
  const n = Math.floor(_v);
  if ((n > (MAX_16 - 1)) || (n < -MAX_16)) {
    debugger;
    main_Alert("checkSignedWord failed");
  }
}

function checkUnsignedWord(_v) {
  const n = Math.floor(_v);
  if (n > (MAX_16 - 1)) {
    debugger;
    main_Alert("checkUnsignedWord failed");
  }
}


function regstruct() {
  // from: https://scriptedamigaemulator.net/sae/cpu.js
  this.a = new Uint32Array(8);
  this.d = new Uint32Array(8);

  for (let i = 0; i < 8; i++) {
    this.a[i] = 0xdeadbeef;
    this.d[i] = 0xdeadbeef;
  }

  this.pc = 0; //u32

  this.db = 0; //u16
  this.irc = 0, this.ir = 0; //u16

  this.usp = 0, this.isp = 0, this.msp = 0;

  this.t1 = false;
  this.t0 = false;
  this.s = false;
  this.m = false;
  this.x = false;
  this.n = false;
  this.z = false;
  this.v = false;
  this.c = false;
  this.sr = 0;
  this.stopped = false;
  this.halted = 0;
};

var regs = new regstruct();


var lockDataD = [null,null,null,null,null,null,null,null];
var lockDataA = [null,null,null,null,null,null,null,null];


function runtimeError68k(_e) {
  const lineIndex = ASMBL_ADRSTOLINE[M68K_IP];
  let lineStr = null;
  if (lineIndex) {
    const ln = PARSER_lines[lineIndex] ;
    if (ln.filtered)
      lineStr = ln.filtered;
    if ((!ln.filtered) || (ln.filtered == "ILLEGAL")) {
      if (ln.jsString)
        lineStr = ln.jsString;  
    }
  }
    
  showHTMLError(_e);
  if (lineStr) {
    document.getElementById("errors").innerHTML += "<br>executing:\t" + lineStr;
    _e = "<br>executing: " + lineStr + "\n" + _e;
    _e += "<br>" + M68K_CURLINE.getFailString();
  }
  /* now that we have time machine and "where am I", this is not necessary
  _e += "<br>last executed lines (most recent first):";
  for (let i = 1; i <= 16; i++) {
    const l = M68K_LASTEXEC[(M68K_EXECUTED-i)%16];
    if (l) {
      if (l.jsString)
        _e += "<br>(JS) " + l.jsString + " - " + l.getFileLineStr();
      else
        _e += "<br>" + l.filtered + " - " + l.getFileLineStr();
    }
  }*/
  _e += "<br>";

  main_Alert(_e, true);
  debug(_e);
  MACHINE.stop = true;
  //DEBUGGER_showContext();
  debugger;
}

function lock(_reg, _mask, _reason) {
  if (!_mask)
    _mask = 0xffffffff;
  _reg = _reg.toUpperCase();
  let reg = registerFromName(_reg);
  if (!reg) {
    runtimeError68k('lock: bad register name: ' + _reg);
    return;
  }

  let data = null;
  if (reg.tab == regs.a)
    data = lockDataA;
  else
    data = lockDataD;

  if (data[reg.ind]) {
    runtimeError68k(_reg + ' already locked');
  }

  data[reg.ind] = { val: reg.tab[reg.ind] & _mask, mask: _mask, reason: _reason};
}


function checklocks(_line = null) {
  for (let i = 0; i < 8; i++) {
    if (lockDataA[i]) {
      const v = regs.a[i] & lockDataA[i].mask;
      if (v != lockDataA[i].val) {
        const immune = (_line && _line.isErrorImmune) ? true : false;
        if (immune) {
          lockDataA[i].val = v; // update with new value
        } else {
          if (lockDataA[i].reason)
            debug('sorry, register A' + i + ' is locked for: ' + lockDataA[i].reason);
          else
            debug('sorry, register A' + i + ' is locked');  
        }
      }
    }
    if (lockDataD[i]) {
      const v = regs.d[i] & lockDataD[i].mask;
      if (v != lockDataD[i].val) {
        const immune = (_line && _line.isErrorImmune) ? true : false;
        if (immune) {
          lockDataD[i].val = v;  // update with new value
        } else {
          if (lockDataD[i].reason)
            debug('sorry, register D' + i + ' is locked for: ' + lockDataD[i].reason);
          else
            debug('sorry, register D' + i + ' is locked');
        }
      }
    }
  }
}

function unlock(_reg, _check = true) {
  _reg = _reg.toUpperCase();
  let reg = registerFromName(_reg);
  if (!reg) {
    runtimeError68k('unlock: bad register name: ' + _reg);
    return;
  }

  let clrTab = null;
  if (reg.tab == regs.a) clrTab = lockDataA; else clrTab = lockDataD;
  let data = reg.tab[reg.ind];

  if (_check) {
    if (!data)
      runtimeError68k("can't unlock " + _reg + " : register is not locked");
  
    if (reg.tab[reg.ind] & data.mask != data.val)
      runtimeError68k("unlock failed for:" + _reg + ". Value changed");  
  }

  clrTab[reg.ind] = null;
}

/*-----------------------------------------------------------------------*/
/* Condition codes */

function flgAdd(S, D, R, m, isADDX) { /* ADD, ADDI, ADDQ, ADDX */
  var Sn = (S & m) != 0;
  var Dn = (D & m) != 0;
  var Rn = (R & m) != 0;
  regs.v = (Sn && Dn && !Rn) || (!Sn && !Dn && Rn);
  regs.c = (Sn && Dn) || (!Rn && Dn) || (Sn && !Rn);
  regs.x = regs.c;
  regs.n = Rn;
  if (isADDX) {
    if (R != 0)
      regs.z = false;
  } else
    regs.z = R == 0;
}

function flgSub(S, D, R, m, isSUBX) { /* SUB, SUBI, SUBQ, SUBX */
  var Sn = (S & m) != 0;
  var Dn = (D & m) != 0;
  var Rn = (R & m) != 0;
  regs.v = (!Sn && Dn && !Rn) || (Sn && !Dn && Rn);
  regs.c = (Sn && !Dn) || (Rn && !Dn) || (Sn && Rn);
  regs.x = regs.c;
  regs.n = Rn;
  if (isSUBX) {
    if (R != 0)
      regs.z = false;
  } else
    regs.z = R == 0;
}

function flgCmp(S, D, R, m) { /* CAS, CAS2, CMP, CMPA, CMPI, CMPM */
  var Sn = (S & m) != 0;
  var Dn = (D & m) != 0;
  var Rn = (R & m) != 0;
  regs.v = (!Sn && Dn && !Rn) || (Sn && !Dn && Rn);
  regs.c = (Sn && !Dn) || (Rn && !Dn) || (Sn && Rn);
  regs.n = Rn;
  regs.z = R == 0;
}

function flgNeg(D, R, m, isNEGX) { /* NEG, NEGX */
  var Dn = (D & m) != 0;
  var Rn = (R & m) != 0;
  regs.v = Dn && Rn;
  regs.c = Dn || Rn;
  regs.x = regs.c;
  regs.n = Rn;
  if (isNEGX) {
    if (R != 0)
      regs.z = false;
  } else
    regs.z = R == 0;
}

function flgLogical(R, m) { /* AND ANDI OR ORI EOR EORI MOVE MOVEQ EXT NOT TST */
  regs.n = (R & m) != 0;
  regs.z = R == 0;
  regs.v = regs.c = false;
}

/*-----------------------------------------------------------------------*/
/* Bit Manipulation */

function I_BCHG_32(_instr) {
  let s = getArg(_instr.arg1, 1, false).value & 31;
  let d = getArg(_instr.arg2, 4, false).value;
  var m = (1 << s) >>> 0;
  regs.z = (d & m) == 0;
  var r = (d ^ m) >>> 0;
  setArg(_instr.arg2, r, 4, false);
  return null;
}

function I_BCHG_16(_instr) {
  let s = getArg(_instr.arg1, 1, false).value & 15;
  let d = getArg(_instr.arg2, 2, false).value;
  var m = (1 << s) >>> 0;
  regs.z = (d & m) == 0;
  var r = (d ^ m) >>> 0;
  setArg(_instr.arg2, r, 2, false);
  return null;
}

function I_BCHG_8(_instr) {
  let s = getArg(_instr.arg1, 1, false).value & 7;
  let d = getArg(_instr.arg2, 1, false).value;
  var m = (1 << s) >>> 0;
  regs.z = (d & m) == 0;
  var r = (d ^ m) >>> 0;
  setArg(_instr.arg2, r, 1, false);
  return null;
}

function I_BCLR_32(_instr) {
  let s = getArg(_instr.arg1, 1, false).value & 31;
  let d = getArg(_instr.arg2, 4, false).value;
  var m = (1 << s) >>> 0;
  regs.z = (d & m) == 0;
  var r = (d & ~m) >>> 0;
  setArg(_instr.arg2, r, 4, false);
  return null;
}

function I_BCLR_16(_instr) {
  let s = getArg(_instr.arg1, 1, false).value & 15;
  let d = getArg(_instr.arg2, 2, false).value;
  var m = (1 << s) >>> 0;
  regs.z = (d & m) == 0;
  var r = (d & ~m) >>> 0;
  setArg(_instr.arg2, r, 2, false);
  return null;
}

function I_BCLR_8(_instr) {
  let s = getArg(_instr.arg1, 1, false).value & 7;
  let d = getArg(_instr.arg2, 1, false).value;
  var m = (1 << s) >>> 0;
  regs.z = (d & m) == 0;
  var r = (d & ~m) >>> 0;
  setArg(_instr.arg2, r, 1, false);
  return null;
}

function I_BSET_32(_instr) {
  let s = getArg(_instr.arg1, 1, false).value & 31;
  let d = getArg(_instr.arg2, 4, false).value;
  var m = (1 << s) >>> 0;
  regs.z = (d & m) == 0;
  var r = (d | m) >>> 0;
  setArg(_instr.arg2, r, 4, false);
  return null;
}

function I_BSET_16(_instr) {
  let s = getArg(_instr.arg1, 1, false).value & 15;
  let d = getArg(_instr.arg2, 2, false).value;
  var m = (1 << s) >>> 0;
  regs.z = (d & m) == 0;
  var r = (d | m) >>> 0;
  setArg(_instr.arg2, r, 2, false);
  return null;
}

function I_BSET_8(_instr) {
  let s = getArg(_instr.arg1, 1, false).value & 7;
  let d = getArg(_instr.arg2, 1, false).value;
  var m = (1 << s) >>> 0;
  regs.z = (d & m) == 0;
  var r = (d | m) >>> 0;
  setArg(_instr.arg2, r, 1, false);
  return null;
}

function I_BTST_32(_instr) {
  let s = getArg(_instr.arg1, 1, false).value & 31;
  let d = getArg(_instr.arg2, 4, false).value;
  var m = (1 << s) >>> 0;
  regs.z = (d & m) == 0;
  return null;
}

function I_BTST_8(_instr) {
  let s = getArg(_instr.arg1, 1, false).value & 7;
  let d = getArg(_instr.arg2, 1, false).value;
  var m = (1 << s) >>> 0;
  regs.z = (d & m) == 0;
  return null;
}

function I_NOT_32(_instr) {
  let a = getArg(_instr.arg1, 4, false).value;
  var r = ~a >>> 0;
  flgLogical(r, SIGN_BIT_32);
  setArg(_instr.arg1, r, 4, false);
  return null;
}
function I_NOT_16(_instr) {
  let a = getArg(_instr.arg1, 2, false).value;
  var r = ~a >>> 0;
  flgLogical(r, SIGN_BIT_16);
  setArg(_instr.arg1, r, 2, false);
  return null;
}
function I_NOT_8(_instr) {
  let a = getArg(_instr.arg1, 1, false).value;
  var r = ~a >>> 0;
  flgLogical(r, SIGN_BIT_8);
  setArg(_instr.arg1, r, 1, false);
  return null;
}

/*-----------------------------------------------------------------------*/
/*  Integer Arithmetic - Extended */

function I_ADDX_32(_instr) {
  let s = getArg(_instr.arg1, 4, false).value;
  DisallowPrePost();
  let d = getArg(_instr.arg2, 4, false).value;
  var r = s + d + (regs.x ? 1 : 0); if (r > 0xffffffff) r -= 0x100000000;
  setArg(_instr.arg2, r, 4, false);
  flgAdd(s, d, r, 0x80000000, true);
  AllowPrePost();
  return null;
}

function I_ADDX_16(_instr) {
  let s = getArg(_instr.arg1, 2, false).value;
  DisallowPrePost();
  let d = getArg(_instr.arg2, 2, false).value;
  var r = s + d + (regs.x ? 1 : 0); if (r > 0xffff) r -= 0x10000;
  setArg(_instr.arg2, r, 2, false);
  flgAdd(s, d, r, 0x8000, true);
  AllowPrePost();
  return null;
}

function I_ADDX_8(_instr) {
  let s = getArg(_instr.arg1, 1, false).value;
  DisallowPrePost();
  let d = getArg(_instr.arg2, 1, false).value;
  var r = s + d + (regs.x ? 1 : 0); if (r > 0xff) r -= 0x100;
  setArg(_instr.arg2, r, 1, false);
  flgAdd(s, d, r, 0x80, true);
  AllowPrePost();
  return null;
}

function I_ROXL_32(_instr) {
  let s = getArg(_instr.arg1, 4, false).value;
  let d = getArg(_instr.arg2, 4, false).value;

  var _d = d;
  var n = s;
  _instr.updateShiftCycles(n);
  if (n) {
    regs.c = (d & (1 << (32-n))) != 0;
    d = (((d << n) | (d >>> (32-n))) & 0xffffffff) >>> 0;
    d = ((d & 0xfffffffe) | (regs.x ? 1 : 0)) >>> 0;
    setArg(_instr.arg2, d, 4, false);
    regs.x = regs.c;
  } else regs.c = regs.x;
  regs.n = (d & 0x80000000) != 0;
  regs.z = d == 0;
  regs.v = false;
  return null;
}

function I_ROXL_16(_instr) {
  let s = getArg(_instr.arg1, 2, false).value;
  let d = getArg(_instr.arg2, 2, false).value;

  var _d = d;
  var n = s;
  _instr.updateShiftCycles(n);
  if (n) {
    regs.c = (d & (1 << (16-n))) != 0;
    d = ((d << n) | (d >> (16-n))) & 0xffff;
    d = (d & 0xfffe) | (regs.x ? 1 : 0);
    setArg(_instr.arg2, d, 2, false);
    regs.x = regs.c;
  } else regs.c = regs.x;
  regs.n = (d & 0x8000) != 0;
  regs.z = d == 0;
  regs.v = false;
  return null;
}

function I_ROXL_8(_instr) {
  let s = getArg(_instr.arg1, 1, false).value;
  let d = getArg(_instr.arg2, 1, false).value;

  var _d = d;
  var n = s;
  _instr.updateShiftCycles(n);
  if (n) {
    regs.c = (d & (1 << (8-n))) != 0;
    d = ((d << n) | (d >> (8-n))) & 0xff;
    d = (d & 0xfe) | (regs.x ? 1 : 0);
    setArg(_instr.arg2, d, 1, false);
    regs.x = regs.c;
  } else regs.c = regs.x;
  regs.n = (d & 0x80) != 0;
  regs.z = d == 0;
  regs.v = false;
  return null;
}

function I_ROXR_32(_instr) {
  let s = getArg(_instr.arg1, 4, false).value;
  let d = getArg(_instr.arg2, 4, false).value;

  var _d = d;
  var n = s;
  _instr.updateShiftCycles(n);
  if (n) {
    regs.c = (d & (1 << (n-1))) != 0;
    d = (((d << (32-n)) | (d >>> n)) & 0xffffffff) >>> 0;
    d = ((regs.x ? 0x80000000 : 0) | (d & 0x7fffffff)) >>> 0;
    setArg(_instr.arg2, d, 4, false);
    regs.x = regs.c;
  } else regs.c = regs.x;
  regs.n = (d & 0x80000000) != 0;
  regs.z = d == 0;
  regs.v = false;
  return null;
}

function I_ROXR_16(_instr) {
  let s = getArg(_instr.arg1, 2, false).value;
  let d = getArg(_instr.arg2, 2, false).value;

  var _d = d;
  var n = s;
  _instr.updateShiftCycles(n);
  if (n) {
    regs.c = (d & (1 << (n-1))) != 0;
    d = ((d << (16-n)) | (d >>> n)) & 0xffff;
    d = (regs.x ? 0x8000 : 0) | (d & 0x7fff);
    setArg(_instr.arg2, d, 2, false);
    regs.x = regs.c;
  } else regs.c = regs.x;
  regs.n = (d & 0x8000) != 0;
  regs.z = d == 0;
  regs.v = false;
  return null;
}

function I_ROXR_8(_instr) {
  let s = getArg(_instr.arg1, 1, false).value;
  let d = getArg(_instr.arg2, 1, false).value;

  var _d = d;
  var n = s;
  _instr.updateShiftCycles(n);
  if (n) {
    regs.c = (d & (1 << (n-1))) != 0;
    d = ((d << (8-n)) | (d >>> n)) & 0xff;
    d = (regs.x ? 0x80 : 0) | (d & 0x7f);
    setArg(_instr.arg2, d, 1, false);
    regs.x = regs.c;
  } else regs.c = regs.x;
  regs.n = (d & 0x80) != 0;
  regs.z = d == 0;
  regs.v = false;
  return null;
}

function I_SUBX_32(_instr) {
  let s = getArg(_instr.arg1, 4, false).value;
  let d = getArg(_instr.arg2, 4, false).value;
  var r = d - s - (regs.x ? 1 : 0); if (r < 0) r += 0x100000000;
  setArg(_instr.arg2, r, 4, false);
  flgSub(s, d, r, 0x80000000, true);
  return null;
}

function I_SUBX_16(_instr) {
  let s = getArg(_instr.arg1, 2, false).value;
  let d = getArg(_instr.arg2, 2, false).value;
  var r = d - s - (regs.x ? 1 : 0); if (r < 0) r += 0x10000;
  setArg(_instr.arg2, r, 2, false);
  flgSub(s, d, r, 0x8000, true);
  return null;
}

function I_SUBX_8(_instr) {
  let s = getArg(_instr.arg1, 1, false).value;
  let d = getArg(_instr.arg2, 1, false).value;
  var r = d - s - (regs.x ? 1 : 0); if (r < 0) r += 0x100;
  setArg(_instr.arg2, r, 1, false);
  flgSub(s, d, r, 0x80, true);
  return null;
}

function I_NEGX_32(_instr) {
  let _source = _instr.arg1;
  let d = getArg(_source, 4, false).value;
  let r = 0 - d - (regs.x ? 1 : 0); if (r < 0) r += 0x100000000;
  setArg(_source, r, 4, false);
  flgNeg(d, r, 0x80000000, false);
  return null;
}

function I_NEGX_16(_instr) {
  let _source = _instr.arg1;
  let d = getArg(_source, 2, false).value;
  let r = 0 - d - (regs.x ? 1 : 0); if (r < 0) r += 0x10000;
  setArg(_source, r, 2, false);
  flgNeg(d, r, 0x8000, false);
  return null;
}

function I_NEGX_8(_instr) {
  let _source = _instr.arg1;
  let d = getArg(_source, 1, false).value;
  let r = 0 - d - (regs.x ? 1 : 0); if (r < 0) r += 0x100;
  setArg(_source, r, 1, false);
  flgNeg(d, r, 0x80, false);
  return null;
}

function I_ASL_32(_instr) {
  let _source = _instr.arg1;
  let _dest = _instr.arg2;
  let ret = null;

  let src = getArg(_source, 1, false);
  if (src.err) { return src.err; }

  let dst = _dest;

  var n = src.value & 63;
  _instr.updateShiftCycles(n);
  var d = dst.tab[dst.ind];
  if (n) {
    var sign = (d & 0x80000000) != 0;
    var mask = ~((1 << (32 - n)) - 1) >>> 0;
    regs.x = regs.c = (d & (1 << (32 - n))) != 0;
    regs.v = sign ? (((d & mask) >>> 0) != mask) : (((d & mask) >>> 0) != 0);
    d = ((d << n) & 0xffffffff) >>> 0;
    dst.tab[dst.ind] = d;
  } else regs.v = regs.c = false;
  regs.n = (d & 0x80000000) != 0;
  regs.z = d == 0;
  return ret;
}

function I_ASL_16(_instr) {
  let _source = _instr.arg1;
  let _dest = _instr.arg2;
  let ret = null;

  let src = getArg(_source, 1, false);
  if (src.err) { return src.err; }

  let dst = _dest;
  var n = src.value & 63;
  _instr.updateShiftCycles(n);

  var d = dst.tab[dst.ind] & 0xffff;
  if (n) {
    var sign = (d & 0x8000) != 0;
    var mask = ~((1 << (16 - n)) - 1) & 0xffff;
    regs.x = regs.c = (d & (1 << (16 - n))) != 0;
    regs.v = sign ? (d & mask) != mask : (d & mask) != 0;
    //regs.v = (d & mask) != mask && (d & mask) != 0;
    d = ((d << n) & 0xffff) >>> 0;
    dst.tab[dst.ind] = (dst.tab[dst.ind] & 0xffff0000) | d;
  } else regs.v = regs.c = false;
  regs.n = (d & 0x8000) != 0;
  regs.z = d == 0;
  return ret;
}

function I_ASL_8(_instr) {
  let _source = _instr.arg1;
  let _dest = _instr.arg2;
  let ret = null;

  let src = getArg(_source, 1, false);
  if (src.err) { return src.err; }

  let dst = _dest;

  var n = src.value & 63;
  _instr.updateShiftCycles(n);
  var d = dst.tab[dst.ind] & 0xff;
  if (n) {
    var sign = (d & 0x80) != 0;
    var mask = ~((1 << (8 - n)) - 1) & 0xff;
    regs.x = regs.c = (d & (1 << (8 - n))) != 0;
    regs.v = sign ? (d & mask) != mask : (d & mask) != 0;
    d = ((d << n) & 0xff) >>> 0;
    dst.tab[dst.ind] = (dst.tab[dst.ind] & 0xffffff00) | d;
  } else regs.v = regs.c = false;
  regs.n = (d & 0x80) != 0;
  regs.z = d == 0;
  return ret;
}

function I_ASR_32(_instr) {
  let _source = _instr.arg1;
  let _dest = _instr.arg2;
  let ret = null;

  let src = getArg(_source, 1, false);
  if (src.err) { return src.err; }

  let dst = _dest;

  var n = src.value & 63;
  _instr.updateShiftCycles(n);
  var d = dst.tab[dst.ind];
  if (n) {
    regs.x = regs.c = (d & (1 << (n - 1))) != 0;
    d = (d >> n) >>> 0; //js 32
    dst.tab[dst.ind] = d;
  } else regs.c = false;
  regs.n = (d & 0x80000000) != 0;
  regs.z = d == 0;
  regs.v = false;
  return ret;
}

function I_ASR_16(_instr) {
  let _source = _instr.arg1;
  let _dest = _instr.arg2;
  let ret = null;

  let src = getArg(_source, 1, false);
  if (src.err) { return src.err; }

  let dst = _dest;

  var n = src.value & 63;
  _instr.updateShiftCycles(n);
  var d = dst.tab[dst.ind] & 0xffff;
  if (n) {
    regs.x = regs.c = (d & (1 << (n - 1))) != 0;
    d = extWord(d); d = ((d >> n) & 0xffff) >>> 0; //js 32
    dst.tab[dst.ind] = (dst.tab[dst.ind] & 0xffff0000) | d;
  } else regs.c = false;
  regs.n = (d & 0x8000) != 0;
  regs.z = d == 0;
  regs.v = false;
  return ret;
}

function I_ASR_8(_instr) {
  let _source = _instr.arg1;
  let _dest = _instr.arg2;
  let ret = null;

  let src = getArg(_source, 1, false);
  if (src.err) { return src.err; }

  let dst = _dest;

  var n = src.value & 63;
  _instr.updateShiftCycles(n);
  var d = dst.tab[dst.ind] & 0xff;
  if (n) {
    regs.x = regs.c = (d & (1 << (n - 1))) != 0;
    d = extByte(d); d = ((d >> n) & 0xff) >>> 0; //js 32
    dst.tab[dst.ind] = (dst.tab[dst.ind] & 0xffffff00) | d;
  } else regs.c = false;
  regs.n = (d & 0x80) != 0;
  regs.z = d == 0;
  regs.v = false;
  return ret;
}

function I_LSL_32(_instr) {
  let _source = _instr.arg1;
  let _dest = _instr.arg2;
  let ret = null;

  let src = getArg(_source, 1, false);
  if (src.err) { return src.err; }

  let dst = _dest;


  var n = src.value & 63;
  _instr.updateShiftCycles(n);
  var d = dst.tab[dst.ind];

  if (n) {
    regs.x = regs.c = (d & (1 << (32 - n))) != 0;
    d = ((d << n) & 0xffffffff) >>> 0;
    dst.tab[dst.ind] = d;
  } else regs.c = false;
  regs.n = (d & 0x80000000) != 0;
  regs.z = d == 0;
  regs.v = false;
  return ret;
}

function I_LSL_16(_instr) {
  let _source = _instr.arg1;
  let _dest = _instr.arg2;
  let ret = null;

  let src = getArg(_source, 1, false);
  if (src.err) { return src.err; }

  let dst = _dest;

  var n = src.value & 63;
  _instr.updateShiftCycles(n);
  var d = dst.tab[dst.ind] & 0xffff;
  if (n) {
    regs.x = regs.c = (d & (1 << (16 - n))) != 0;
    d = ((d << n) & 0xffff) >>> 0;
    dst.tab[dst.ind] = (dst.tab[dst.ind] & 0xffff0000) | d;
  } else regs.c = false;
  regs.n = (d & 0x8000) != 0;
  regs.z = d == 0;
  regs.v = false;
  return ret;
}

function I_LSL_8(_instr) {
  let _source = _instr.arg1;
  let _dest = _instr.arg2;
  let ret = null;

  let src = getArg(_source, 1, false);
  if (src.err) { return src.err; }

  let dst = _dest;

  var n = src.value & 63;
  _instr.updateShiftCycles(n);
  var d = dst.tab[dst.ind] & 0xff;
  if (n) {
    regs.x = regs.c = (d & (1 << (8 - n))) != 0;
    d = ((d << n) & 0xff) >>> 0;
    dst.tab[dst.ind] = (dst.tab[dst.ind] & 0xffffff00) | d;
  } else regs.c = false;
  regs.n = (d & 0x80) != 0;
  regs.z = d == 0;
  regs.v = false;
  return ret;
}

function I_LSR_32(_instr) {
  let _source = _instr.arg1;
  let _dest = _instr.arg2;
  let ret = null;

  let src = getArg(_source, 1, false);
  if (src.err) { return src.err; }

  let dst = _dest;

  var n = src.value & 63;
  _instr.updateShiftCycles(n);
  var d = dst.tab[dst.ind];
  if (n) {
    regs.x = regs.c = (d & (1 << (n - 1))) != 0;
    d = d >>> n;
    dst.tab[dst.ind] = d;
  } else regs.c = false;
  regs.n = (d & 0x80000000) != 0;
  regs.z = d == 0;
  regs.v = false;
  return ret;
}

function I_LSR_16(_instr) {
  let _source = _instr.arg1;
  let _dest = _instr.arg2;
  let ret = null;

  let src = getArg(_source, 1, false);
  if (src.err) { return src.err; }

  let dst = _dest;

  var n = src.value & 63;
  _instr.updateShiftCycles(n);
  var d = dst.tab[dst.ind] & 0xffff;
  if (n) {
    regs.x = regs.c = (d & (1 << (n - 1))) != 0;
    d >>= n;
    dst.tab[dst.ind] = (dst.tab[dst.ind] & 0xffff0000) | d;
  } else regs.c = false;
  regs.n = (d & 0x8000) != 0;
  regs.z = d == 0;
  regs.v = false;
  return ret;
}

function I_LSR_8(_instr) {
  let _source = _instr.arg1;
  let _dest = _instr.arg2;
  let ret = null;

  let src = getArg(_source, 1, false);
  if (src.err) { return src.err; }

  let dst = _dest;

  var n = src.value & 63;
  _instr.updateShiftCycles(n);
  var d = dst.tab[dst.ind] & 0xff;
  if (n) {
    regs.x = regs.c = (d & (1 << (n - 1))) != 0;
    d >>= n;
    dst.tab[dst.ind] = (dst.tab[dst.ind] & 0xffffff00) | d;
  } else regs.c = false;
  regs.n = (d & 0x80) != 0;
  regs.z = d == 0;
  regs.v = false;
  return ret;
}

function I_SWAP(_instr) {
  const arg = _instr.arg1;
  var d = arg.tab[arg.ind];
  var r = (((d & 0xffff) << 16) | (d >>> 16)) >>> 0;
  arg.tab[arg.ind] = r;
  regs.n = (r & 0x80000000) != 0;
  regs.z = r == 0;
  regs.v = regs.c = false;
  return null;
}

// MULS.w : 16x16 --> 32
function I_MULS(_instr) {
  let _source = _instr.arg1;
  let _dest = _instr.arg2;

  let src = getArg(_source, 2, true);
  if (src.err) { return src.err; }

  let dst = getArg(_dest, 2, true);
  if (dst.err) { return dst.err; }

  var s = src.value;
  var d = dst.value;
  var sign = s ^ d;
  if (s & 0x8000) s = -s + 0x10000;
  if (d & 0x8000) d = -d + 0x10000;
  var r = s * d;
  if (r && (sign & 0x8000)) r = -r + 0x100000000;
 // if (r >= 1<<32) runtimeError68k("MULS overflow, result >= 1<<32");
 // else if (r <= -1<<32) runtimeError68k("MULS overflow, result <= -1<<32");
  setArg(_dest, r, 4, true);
  regs.n = (r & 0x80000000) != 0;
  regs.z = r == 0;
  regs.v = false;
  regs.c = false;
  return null;
}

// MULU.w : 16x16 --> 32
function I_MULU(_instr) {
  let _source = _instr.arg1;
  let _dest = _instr.arg2;

  let src = getArg(_source, 2, false);
  if (src.err) { return src.err; }

  let dst = getArg(_dest, 2, false);
  if (dst.err) { return dst.err; }

  var s = src.value;
  var d = dst.value;
  var r = s * d;
  setArg(_dest, r, 4, false);
  regs.n = (r & 0x80000000) != 0;
  regs.z = r == 0;
  regs.v = false;
  regs.c = false;
  return null;
}

function onDivision(_dividend, _divisor) {
  if (!M68K_DIVS_STAT) {
    M68K_DIVS_STAT = {
    minDividend : _dividend,
    maxDividend : _dividend,
    minDivisor : _divisor,
    maxDivisor : _divisor,
    };
  } else {
    M68K_DIVS_STAT.minDividend = Math.min(M68K_DIVS_STAT.minDividend, _dividend);
    M68K_DIVS_STAT.maxDividend = Math.max(M68K_DIVS_STAT.maxDividend, _dividend);
    M68K_DIVS_STAT.minDivisor = Math.min(M68K_DIVS_STAT.minDivisor, _divisor);
    M68K_DIVS_STAT.maxDivisor = Math.max(M68K_DIVS_STAT.maxDivisor, _divisor);
  }
}

// _dest.l / _source.w
// must check if result fits in a word or raise error
// _e : non-blocking errors are allowed
function I_DIVS(_source, _dest, _e) {
  checkSignedWord(_source);
  checkSignedDouble(_dest);

  var s = TOOLS.toInt16(_source);

  regs.c = false;
  if (s == 0) {
    runtimeError68k("DIVISION BY 0");
    return 0;
  } else {   
    var d = Math.floor(_dest);
    if (M68K_COLLECT_DIVS_STATS) onDivision(d, s);
    let quo = d / s;
    if (quo < 0) quo = Math.ceil(quo);
    else quo = Math.floor(quo);

    regs.v = false;
    if ((quo < -32768) || (quo > 32767)) {
      regs.v = true;
      if (CPU_CONFIG.check_div_overflow && _e) {
        runtimeError68k("DIVISION OVERFLOW: " + Math.floor(d) + " / " + Math.floor(s) + " = "  + quo + ERRORIMMUNE_COMMENT);
      }
    }
    var rem = Math.abs(Math.floor(d % s));
    let uquo = new Uint16Array(1);
    uquo[0] = quo;
    _dest = ((rem & 0xffff) << 16) | uquo[0];
    regs.z = quo == 0;
    regs.n = quo < 0;
  }
  return _dest;
}

// _e : non-blocking errors are allowed
function I_DIVU(_source, _dest, _e = true) {
  checkUnsignedWord(_source);

  var s = Math.floor(_source) & 0xffff;

  regs.c = false;
  if (s == 0) {
    runtimeError68k("DIVISION BY 0");
    return 0;
  } else {
    var d = Math.floor(_dest);
    if (M68K_COLLECT_DIVS_STATS) onDivision(d, s);
    var quo = (d / s) >>> 0;
    regs.v = false;
    if (quo > 0xffff) {
      regs.v = true;
      if (CPU_CONFIG.check_div_overflow && _e) {
        runtimeError68k("DIVISION OVERFLOW: " + Math.floor(d) + " / " + Math.floor(s) + " = "  + quo + ERRORIMMUNE_COMMENT);
      }
    } else {
      var rem = d % s;
      _dest = (rem << 16) | quo;
      regs.z = quo == 0;
      regs.n = (quo & 0x8000) != 0;
    }
    return _dest;
  }
}

function I_ROL_32(_amount, _dest) {
  var d = _dest;
  var n = _amount & 63;
  if (n) {
    regs.c = (d & (1 << (32 - n))) != 0;
    d = (((d << n) | (d >>> (32 - n))) & 0xffffffff) >>> 0;
    _dest = d;
  } else regs.c = false;
  regs.n = (d & 0x80000000) != 0;
  regs.z = d == 0;
  regs.v = false;
  return _dest;
}

function I_ROL_16(_amount, _dest) {
  var d = _dest & 0xffff;
  var n = _amount & 63;
  if (n) {
    regs.c = (d & (1 << (16 - n))) != 0;
    d = (((d << n) | (d >> (16 - n))) & 0xffff) >>> 0;
    _dest = (_dest & 0xffff0000) | d;
  } else regs.c = false;
  regs.n = (d & 0x8000) != 0;
  regs.z = d == 0;
  regs.v = false;
  return _dest;
}

function I_ROL_8(_amount, _dest) {
  var d = _dest & 0xff;
  var n = _amount & 63;
  if (n) {
    regs.c = (d & (1 << (8 - n))) != 0;
    d = (((d << n) | (d >> (8 - n))) & 0xff) >>> 0;
    _dest = (_dest & 0xffffff00) | d;
  } else regs.c = false;
  regs.n = (d & 0x80) != 0;
  regs.z = d == 0;
  regs.v = false;
  return _dest;
}

function I_ROR_32(_amount, _dest) {
  var d = _dest;
  var n = _amount & 63;
  if (n) {
    regs.c = (d & (1 << (n - 1))) != 0;
    d = (((d << (32 - n)) | (d >>> n)) & 0xffffffff) >>> 0;
    _dest = d;
  } else regs.c = false;
  regs.n = (d & 0x80000000) != 0;
  regs.z = d == 0;
  regs.v = false;
  return _dest;
}

function I_ROR_16(_amount, _dest) {
  var d = _dest & 0xffff;
  var n = _amount & 63;
  if (n) {
    regs.c = (d & (1 << (n - 1))) != 0;
    d = (((d << (16 - n)) | (d >>> n)) & 0xffff) >>> 0;
    _dest = (_dest & 0xffff0000) | d;
  } else regs.c = false;
  regs.n = (d & 0x8000) != 0;
  regs.z = d == 0;
  regs.v = false;
  return _dest;
}

function I_ROR_8(_amount, _dest) {
  var d = _dest & 0xff;
  var n = _amount & 63;
  if (n) {
    regs.c = (d & (1 << (n - 1))) != 0;
    d = (((d << (8 - n)) | (d >>> n)) & 0xff) >>> 0;
    _dest = (_dest & 0xffffff00) | d;
  } else regs.c = false;
  regs.n = (d & 0x80) != 0;
  regs.z = d == 0;
  regs.v = false;
  return _dest;
}

function I_ADD_8(_src, _dst) {
  var s = _src & 0xff;
  var d = _dst & 0xff;
  var r = s + d; if (r > 0xffff) r -= 0x10000;
  _dst = (_dst & 0xffff0000) | r;
  flgAdd(s, d, r, 0x80, false);
  return _dst;
}

function I_ADD_16(_src, _dst) {
  var s = _src & 0xffff;
  var d = _dst & 0xffff;
  var r = s + d; if (r > 0xffff) r -= 0x10000;
  _dst = (_dst & 0xffff0000) | r;
  flgAdd(s, d, r, 0x8000, false);
  return _dst;
}

function I_ADD_32(_src, _dst) {
  var s = _src;
  var d = _dst;
  var r = s + d; if (r > 0xffffffff) r -= 0x100000000;
  _dst = r;
  flgAdd(s, d, r, 0x80000000, false);
  return _dst;
}

function I_ADDA_32(_src, _dst) {
  var s = _src;
  var d = _dst;
  var r = s + d; if (r > 0xffffffff) r -= 0x100000000;
  _dst = r;
  return _dst;
}

function I_ADDA_16(_src, _dst) {
  var s = _src & 0xffff;
  s  = extWord(s);
  var d = _dst;
  var r = s + d; if (r > 0xffffffff) r -= 0x100000000;
  _dst = r;
  return _dst;
}

function I_SUB_8(_src, _dst) {
  var s = _src & 0xff;
  var d = _dst & 0xff;
  var r = d - s; if (r < 0) r += 0x100;
  _dst = (_dst & 0xffffff00) | r;
  flgSub(s, d, r, 0x80, false);
  return _dst;
}

function I_SUB_16(_src, _dst) {
  var s = _src & 0xffff;
  var d = _dst & 0xffff;
  var r = d - s; if (r < 0) r += 0x10000;
  _dst = (_dst & 0xffff0000) | r;
  flgSub(s, d, r, 0x8000, false);
  return _dst;
}

function I_SUB_32(_src, _dst) {
  var s = _src;
  var d = _dst;
  var r = d - s; if (r < 0) r += 0x100000000;
  _dst = r;
  flgSub(s, d, r, 0x80000000, false);
  return _dst;
}

function I_NEG_8(_src) {
  var d = _src & 0xff;
  var r = 0 - d; if (r < 0) r += 0x100;
  _src = (_src & 0xffffff00) | r;
  flgNeg(d, r, 0x80, false);
  return _src;
}

function I_NEG_16(_src) {
  var d = _src & 0xffff;
  var r = 0 - d; if (r < 0) r += 0x10000;
  _src = (_src & 0xffff0000) | r;
  flgNeg(d, r, 0x8000, false);
  return _src;
}

function I_NEG_32(_src) {
  var d = _src;
  var r = 0 - d; if (r < 0) r += 0x100000000;
  _src = r;
  flgNeg(d, r, 0x80000000, false);
  return _src;
}

function I_CMP_32(_instr) {
  let _source = _instr.arg1;
  let _dest = _instr.arg2;
  let ret = null;

  let src = getArg(_source, 4, true);
  if (src.err) { return src.err; }

  let dst = getArg(_dest, 4, true);
  if (dst.err) { return dst.err; }

  var s = src.value;
  var d = dst.value;
  var r = d - s; if (r < 0) r += 0x100000000;
  flgCmp(s, d, r, 0x80000000);
  return ret;
}

function I_CMP_16(_instr) {
  let _source = _instr.arg1;
  let _dest = _instr.arg2;
  let ret = null;

  let src = getArg(_source, 2, true);
  if (src.err) { return src.err; }

  let dst = getArg(_dest, 2, true);
  if (dst.err) { return dst.err; }

  var s = src.value;
  var d = dst.value;
  var r = d - s; if (r < 0) r += 0x10000;
  flgCmp(s, d, r, 0x8000);
  return ret;
}

function I_CMP_8(_instr) {
  let _source = _instr.arg1;
  let _dest = _instr.arg2;
  let ret = null;

  let src = getArg(_source, 1, true);
  if (src.err) { return src.err; }

  let dst = getArg(_dest, 1, true);
  if (dst.err) { return dst.err; }

  var s = src.value;
  var d = dst.value;
  var r = d - s; if (r < 0) r += 0x100;
  flgCmp(s, d, r, 0x80);
  return ret;
}


function I_AND_32(_src, _dst) {
  var s = _src & 0xffffffff;
  var d = _dst & 0xffffffff;
  var r = s & d;
  d = r;
  flgLogical(r, SIGN_BIT_32);
  return d;
}

function I_AND_16(_src, _dst) {
  var s = _src & 0xffff;
  var d = _dst & 0xffff;
  var r = s & d;
  d = (d & 0xffff0000) | r;
  flgLogical(r, SIGN_BIT_16);
  return d;
}

function I_AND_8(_src, _dst) {
  var s = _src & 0xff;
  var d = _dst & 0xff;
  var r = s & d;
  d = (d & 0xffffff00) | r;
  flgLogical(r, SIGN_BIT_8);
  return d;
}

function I_OR_32(_src, _dst) {
  var s = _src & 0xffffffff;
  var d = _dst & 0xffffffff;
  var r = s | d;
  d = r;
  flgLogical(r, SIGN_BIT_32);
  return d;
}

function I_OR_16(_src, _dst) {
  var s = _src & 0xffff;
  var d = _dst & 0xffff;
  var r = s | d;
  d = (d & 0xffff0000) | r;
  flgLogical(r, SIGN_BIT_16);
  return d;
}

function I_OR_8(_src, _dst) {
  var s = _src & 0xff;
  var d = _dst & 0xff;
  var r = s | d;
  d = (d & 0xffffff00) | r;
  flgLogical(r, SIGN_BIT_8);
  return d;
}


function I_EOR_32(_src, _dst) {
  var s = _src & 0xffffffff;
  var d = _dst & 0xffffffff;
  var r = s ^ d;
  d = r;
  flgLogical(r, SIGN_BIT_32);
  return d;
}

function I_EOR_16(_src, _dst) {
  var s = _src & 0xffff;
  var d = _dst & 0xffff;
  var r = s ^ d;
  d = (d & 0xffff0000) | r;
  flgLogical(r, SIGN_BIT_16);
  return d;
}

function I_EOR_8(_src, _dst) {
  var s = _src & 0xff;
  var d = _dst & 0xff;
  var r = s ^ d;
  d = (d & 0xffffff00) | r;
  flgLogical(r, SIGN_BIT_8);
  return d;
}


function I_EXT_16(_tab, _ind) {
  var d = _tab[_ind] & 0xff;
  var r = (d & 0x80) ? 0xff00 | d : d;
  d = (d & 0xffff0000) | r;
  flgLogical(r, 0x8000);
  _tab[_ind] = d;
}

function I_EXT_32(_tab, _ind) {
  var d = _tab[_ind] & 0xffff;
  var r = (d & 0x8000) ? ((0xffff0000 | d) >>> 0) : d;
  d = r;
  flgLogical(r, 0x80000000);
  _tab[_ind] = d;
}

function I_TST_8(_dst) {
  var d = getArg(_dst, 1, false).value;
  flgLogical(d, SIGN_BIT_8);
}
function I_TST_16(_dst) {
  var d = getArg(_dst, 2, false).value;
  flgLogical(d, SIGN_BIT_16);
}

function I_TST_32(_dst) {
  var d = getArg(_dst, 4, false).value;
  flgLogical(d, SIGN_BIT_32);
}


function I_MOVEP_32(_instr) {
  let _source = _instr.arg1;
  let a = getEffectiveAddressFromArg(_instr.arg2);

  let src = getArg(_source, 4, true);
  if (src.err) { return src.err; }

  var s = src.value;

  DEBUGGER_lastWrittenAdrs = a;
  MACHINE.chkMem(a, 6, ALLOW_WRITE, s, true);
  MACHINE.ram[a] = (s >>> 24) & 0xff;
  MACHINE.ram[a + 2] = (s >>> 16) & 0xff;
  MACHINE.ram[a + 4] = (s >>> 8) & 0xff;
  MACHINE.ram[a + 6] = s & 0xff;
  return null;
}


function I_MOVEP_16(_instr) {
  let _source = _instr.arg1;
  let a = getEffectiveAddressFromArg(_instr.arg2);

  let src = getArg(_source, 2, true);
  if (src.err) { return src.err; }

  var s = src.value;

  DEBUGGER_lastWrittenAdrs = a;
  MACHINE.chkMem(a, 2, ALLOW_WRITE, s, true);
  MACHINE.ram[a] = (s >>> 8) & 0xff;
  MACHINE.ram[a + 2] = s & 0xff;
  return null;
}


function getArg(_arg, _size, _signed, _isLEA = false, _memOfs = 0) {
  //if (_signed)
    //debugger; // at this stage, everything should be unsigned. decoding of signed/unsigned should be in calling instruction
  let ret = {};
  let mask = 0;
  switch (_size) {
    case 1: mask = MASK_8BIT; break;
    case 2: mask = MASK_16BIT; break;
    case 4: mask = MASK_32BIT; break;
    default: main_Alert('fuck'); break;
  }
  if (_arg.type == 'imm') _isLEA = true;

  if (_isLEA && (!isNaN(_arg.isLabelIndex))) {
    const label = CODERPARSER_SINGLETON.labels[_arg.isLabelIndex];
    if (label.dcData != null)
      ret.value = label.dcData & mask;
    else if (label.codeSectionOfs != null) {
      ret.value = label.codeSectionOfs & mask;
    }
    else runtimeError68k("could not solve arg address (label not found?)");
    if (DEBUGGER_tracing) LAST_GETARG.push("error");
    return ret;
  }
  switch (_arg.type) {
    case 'reg': {
      ret.value = _arg.tab[_arg.ind] & mask;
    }
      break;
    case 'imm':
      ret.value = _arg.value & mask;
      break;
    case 'ind':
    case 'adrs': {
      let mem = NaN;
      let r = _arg // let r = registerFromName(_arg.reg);
      if (_arg.predecrement) r.tab[r.ind] -= _size;
      if (_arg.type == 'adrs')
        mem = _arg.value + _memOfs;
      else
        mem = r.tab[r.ind];
      if (_arg.disp) mem += _arg.disp;
      if (_arg.indReg) {
        let indVal = _arg.indTab[_arg.indInd] & 0xffff;
        indVal = castWord(indVal);        
        mem += indVal;
      }
      ret.value = MACHINE.getRAMValue(mem,_size,false);      
      if (_arg.postincrement && getArgAllowPostInc) r.tab[r.ind] += _size;
    }
      break;
    default:
      if (!isNaN(_arg.isLabelIndex)) {
        ret.value = MACHINE.getRAMValue(CODERPARSER_SINGLETON.labels[_arg.isLabelIndex].dcData + _memOfs, _size, false);
    if (DEBUGGER_tracing) LAST_GETARG.push(_arg.str + "= $" + ret.value.toString(16));
        return ret;
      }
      debugger;
      ret.err = 'unknown adressing mode: ' + _arg.str;
      break;
  }

  if (DEBUGGER_tracing) LAST_GETARG.push(_arg.str + "= $" + ret.value.toString(16));
  return ret;
}

function setArg(_arg, _value, _size, _signed, _ofs) {
  // if (_signed)
   // debugger; // at this stage, everything should be unsigned. decoding of signed/unsigned should be in calling instruction
  if (DEBUGGER_tracing) LAST_SETARG.push(_arg.str + "= $" + _value.toString(16));
  let ret = {};
  let mask = 0;
  switch (_size) {
    case 1: mask = MASK_8BIT; break;
    case 2: mask = MASK_16BIT; break;
    case 4: mask = MASK_32BIT; break;
    default: main_Alert('fuck'); break;
  }
  _value &= mask;
  ret.val = _value;
  switch (_arg.type) {
    case 'reg': {
      // if destination is an address register and the size is word, sign extend
      if (_arg.tab == regs.a && _size == 2) {
        const r = (_value & 0x8000) ? ((0xffff0000 | _value) >>> 0) : _value;
        _arg.tab[_arg.ind] = r;
      } else { // default case
        _arg.tab[_arg.ind] &= ~mask;
        _arg.tab[_arg.ind] |= _value;  
      }
    }
    break;
    case 'imm':
    case 'adrs': {
      let mem = _arg.value;
      if (_ofs)
        mem += _ofs;
      MACHINE.setRAMValue(_value, mem,_size);
    }
      break;
    case 'ind': {
      let r = _arg // let r = registerFromName(_arg.reg);
      if (_arg.predecrement && setArgAllowPredec) r.tab[r.ind] -= _size;
      let mem = r.tab[r.ind];
      if (_arg.disp) mem += _arg.disp;
      if (_arg.indReg) {
        let indVal = _arg.indTab[_arg.indInd] & 0xffff;
        indVal = castWord(indVal);        
        mem += indVal;
      }
      if (_ofs)
        mem += _ofs;
      MACHINE.setRAMValue(_value, mem,_size);      
      if (_arg.postincrement) r.tab[r.ind] += _size;
    }
      break;
    default:
      if (!isNaN(_arg.isLabelIndex)) {
        MACHINE.setRAMValue(_value, CODERPARSER_SINGLETON.labels[_arg.isLabelIndex].dcData, _size);
        return ret;
      }
      debugger;
      ret.err = 'unknown adressing mode: ' + _arg.str;
      break;
  }
  return ret;
}

function registerFromName(_n) {
  let ret = {};
  if (_n[0] == 'D')
    ret.tab = regs.d;
  else if (_n[0] == 'A')
    ret.tab = regs.a;
  else { ret.err = "bad register name, expected 'A' or 'D', but found: " + _n; return ret; }
  switch (_n[1]) {
    case '0': ret.ind = 0; break;
    case '1': ret.ind = 1; break;
    case '2': ret.ind = 2; break;
    case '3': ret.ind = 3; break;
    case '4': ret.ind = 4; break;
    case '5': ret.ind = 5; break;
    case '6': ret.ind = 6; break;
    case '7': ret.ind = 7; break;
    default: { ret.err = "bad register index, expected 0..7, but found: " + _n; return ret; }
  }
  return ret;
}


function DBG_reg(_name, _size, _signed) {
  _name = _name.toUpperCase();
  let r = registerFromName(_name);
  if (r.err) {
    return NaN;
  }
  let ret = r.tab[r.ind];
  switch (_size) {
    case 1: ret &= 0xff; break;
    case 2: ret &= 0xffff; break;
    default: break;
  }

  if (_signed) {
    switch (_size) {
      case 1: if (ret >= 128) ret = ret - 256; break;
      case 2: if (ret >= 32768) ret = ret - 65536; break;
      case 4: if (ret >= (1 << 31)) ret = ret - (1 << 32); break;
      default: break;
    }
  }

  return ret;
}

function getEffectiveAddressFromArg(_arg) {
  let base = 0;

  if (!isNaN(_arg.isLabelIndex)) { // label (memory address)
    const l = CODERPARSER_SINGLETON.labels[_arg.isLabelIndex];
    base = l.dcData;
    if (base == null) { // no data: it's a code label
      base = l.codeSectionOfs;
    }
  }
  else if (_arg.tab) // register
    base = _arg.tab[_arg.ind];
  else if (_arg.type == 'imm') // immediate address (constant)
    base = _arg.value; // trick to load constants such as 'lea CUSTOM,a6'
  else if (_arg.type == 'adrs') {
    return _arg.value;
  }
  else {
    debugger;
    main_Alert("getEffectiveAddressFromArg: can't interpret agument: " + _arg.str);
    return null;
  }
  if (_arg.disp) // indirect addressing displacement
    base += _arg.disp;
  if (_arg.indReg) {
    let indVal = _arg.indTab[_arg.indInd] & 0xffff;
    indVal = castWord(indVal);        
    base += indVal;
  }
  return base;
}

function LEA(_instr) {
  let _dest = _instr.arg2;
  let dst = _dest // let dst = registerFromName(_dest.reg);

  let base = getEffectiveAddressFromArg(_instr.arg1);

  dst.tab[dst.ind] = base;

  return null;
}

function PEA(_instr) {
  let base = getEffectiveAddressFromArg(_instr.arg1);
  STACK_PUSH(base, 4);
  return null;
}

function MOVE_B(_instr) {
  let _source = _instr.arg1;
  let _dest = _instr.arg2;
  let ret = null;

  let res = setArg(_dest, getArg(_source, 1, false).value, 1, false);
  if (res.err) return res.err;

  const isAdReg = (_dest.type == 'reg') && (_dest.tab == regs.a);
  if (!isAdReg) // flags not updated when writing to address register
    flgLogical(res.val, SIGN_BIT_8)
  return ret;
}

function MOVE_W(_instr) {
  let _source = _instr.arg1;
  let _dest = _instr.arg2;
  let ret = null;

  let res = setArg(_dest, getArg(_source, 2, false).value, 2, false);
  if (res.err) return res.err;

  const isAdReg = (_dest.type == 'reg') && (_dest.tab == regs.a);
  if (!isAdReg) // flags not updated when writing to address register
    flgLogical(res.val, SIGN_BIT_16)
  return ret;
}

function MOVE_L(_instr) {
  let _source = _instr.arg1;
  let _dest = _instr.arg2;
  let ret = null;

  let res = setArg(_dest, getArg(_source, 4, false, _source.isFetchingCodeLabel).value, 4, false);
  if (res.err) return res.err;

  const isAdReg = (_dest.type == 'reg') && (_dest.tab == regs.a);
  if (!isAdReg) // flags not updated when writing to address register
    flgLogical(res.val, SIGN_BIT_32)
  return ret;
}

function MOVEA_X(_instr) {
  let _source = _instr.arg1;
  let _dest = _instr.arg2;
  let ret = null;
  let val = getArg(_source, _instr.instrSize, false, _source.isFetchingCodeLabel).value;
  _dest.tab[_dest.ind] = val;
  if (_instr.instrSize == 2) I_EXT_32(_dest.tab, _dest.ind);
 
  const isAdReg = (_dest.type == 'reg') && (_dest.tab == regs.a);
  if (!isAdReg) // flags not updated when writing to address register
    flgLogical(val, SIGN_BIT_32)
  return ret;
}

function DIVU(_instr) {
  let _source = _instr.arg1;
  let _dest = _instr.arg2;
  let ret = null;

  let src = getArg(_source, 2, false);
  if (src.err) { return src.err; }

  let dst = getArg(_dest, 4, false);
  if (dst.err) { return dst.err; }

  setArg(_dest, I_DIVU(src.value, dst.value, !_instr.isErrorImmune), 4, false);
  return ret;
}

function DIVS(_instr) {
  let _source = _instr.arg1;
  let _dest = _instr.arg2;
  let ret = null;

  let src = getArg(_source, 2, true);
  if (src.err) { return src.err; }

  let dst = getArg(_dest, 4, true);
  if (dst.err) { return dst.err; }

  setArg(_dest, I_DIVS(src.value, dst.value, !_instr.isErrorImmune), 4, true);
  return ret;
}

function MOVE(_instr) {
  switch (_instr.instrSize) {
    case 1: return MOVE_B(_instr);
    case 2: return MOVE_W(_instr);
    case 4: return MOVE_L(_instr);
    default: return { err: 'unknown instruction' };
  }
}

function MOVEM(_instr) {
  if (_instr.instrSize < 2)
    return { err: 'movem size can be only .w or .l' };
  if (_instr.arg1.movem) { // registers ==> memory
    if (_instr.arg2.movem)
      return { err: "movem can't use registers lists both as source and destination" };
    let _dest = _instr.arg2;
    let destOfs = 0;
    if (_dest.predecrement) { // store registers in reverse order when dest is predecremented (i.e., -(An))
      for (let i = _instr.arg1.movem.length - 1; i >= 0; i--) {
        let _source = _instr.arg1;
        _source.reg = _instr.arg1.movem[i].reg;
        _source.tab = _instr.arg1.movem[i].tab;
        _source.ind = _instr.arg1.movem[i].ind;
        let res = setArg(_dest, getArg(_source, _instr.instrSize, false).value, _instr.instrSize, false, destOfs);
        if (res.err) return res.err;
      }
    } else {
      for (let i = 0; i < _instr.arg1.movem.length; i++) {
        let _source = _instr.arg1;
        _source.reg = _instr.arg1.movem[i].reg;
        _source.tab = _instr.arg1.movem[i].tab;
        _source.ind = _instr.arg1.movem[i].ind;

        let valueToSet = getArg(_source, _instr.instrSize, false).value;
        let res = setArg(_dest, valueToSet, _instr.instrSize, false, destOfs);
        if (res.err) return res.err;
        // When a group of registers is transferred to or from memory (using an addressing mode other than pre-decrementing or postincrementing), the registers are transferred starting at the specified address and up through higher addresses.
        if ((!_dest.postincrement) && (!_dest.predecrement))
          destOfs += _instr.instrSize;
      }
    }
    return null;
  }
  if (_instr.arg2.movem) { // memory ==> registers
    let _source = _instr.arg1;
    let readOfs = 0;
    let restoreSource = null;
    if (_source.type == 'ind') {
      if ((_source.tab == regs.a) && (!_source.postincrement) && (!_source.predecrement))
      {
        restoreSource = _source.tab[_source.ind];
      }
    }
    for (let i = 0; i < _instr.arg2.movem.length; i++) {
      // let _dest = _instr.arg2;
      // _dest.reg = _instr.arg2.movem[i].reg;
      // _dest.tab = _instr.arg2.movem[i].tab;
      // _dest.ind = _instr.arg2.movem[i].ind;
      let val = getArg(_source, _instr.instrSize, false, false, readOfs).value;
      // When a group of registers is transferred to or from memory (using an addressing mode other than pre-decrementing or postincrementing), the registers are transferred starting at the specified address and up through higher addresses.
      if (restoreSource)
        _source.tab[_source.ind] += _instr.instrSize;

      // MOVEM.W sign-extends words when writing to data or address registers
      if (_instr.instrSize == 2) {
        const r = (val & 0x8000) ? ((0xffff0000 | val) >>> 0) : val;
        val = r;  
      }
      _instr.arg2.movem[i].tab[_instr.arg2.movem[i].ind] = val;
      //let res = setArg(_dest, val, 4, false);
      //if (res.err) return res.err;
      readOfs += _instr.instrSize;
    }
    if (restoreSource)
      _source.tab[_source.ind] = restoreSource;
    return null;
  }
  main_Alert("fucked up movem");
  return null;
}


function ROR(_instr) {
  let ret = null;
  let amount = getArg(_instr.arg1, _instr.instrSize, false).value & 63;
  let r = _instr.arg2; // let r = registerFromName(_instr.arg2.reg);
  _instr.updateShiftCycles(amount&63);
  switch (_instr.instrSize) {
    case 1: r.tab[r.ind] = I_ROR_8(amount, r.tab[r.ind]); break;
    case 2: r.tab[r.ind] = I_ROR_16(amount, r.tab[r.ind]); break;
    case 4: r.tab[r.ind] = I_ROR_32(amount, r.tab[r.ind]); break;
    default: return 'unknown instruction';
  }
  return ret;
}

function ROL(_instr) {
  let ret = null;
  let amount = getArg(_instr.arg1, _instr.instrSize, false) & 63;
  let r = _instr.arg2; // let r = registerFromName(_instr.arg2.reg);
  _instr.updateShiftCycles(amount&63);
  switch (_instr.instrSize) {
    case 1: r.tab[r.ind] = I_ROL_8(amount, r.tab[r.ind]); break;
    case 2: r.tab[r.ind] = I_ROL_16(amount, r.tab[r.ind]); break;
    case 4: r.tab[r.ind] = I_ROL_32(amount, r.tab[r.ind]); break;
    default: return 'unknown instruction';
  }
  return ret;
}

function ADD(_instr) {
  let ret = null;
  let _source = _instr.arg1;
  let _dest = _instr.arg2;
  let size = _instr.instrSize;

  let src = getArg(_source, size, true);
  if (src.err) return src.err;

  let srcVal = src.value;

  // extend to 32 bits when destination is an address register
  if ((size == 2) && (_dest.tab == regs.a) && (_dest.type == 'reg')) {
    srcVal = extWord(srcVal);
    size = 4;
  }

  DisallowPrePost();
  let dst = getArg(_dest, size, true);
  if (dst.err) return dst.err;

  switch (size) {
    case 1: setArg(_dest, I_ADD_8(srcVal, dst.value), 1, true); break;
    case 2: setArg(_dest, I_ADD_16(srcVal, dst.value), 2, true); break;
    case 4: setArg(_dest, I_ADD_32(srcVal, dst.value), 4, true); break;
    default: return 'unknown instruction';
  }
  AllowPrePost();
  return ret;
}

function ADDA(_instr) {
  let ret = null;
  let _source = _instr.arg1;
  let _dest = _instr.arg2;

  let size = _instr.instrSize;
  let src = getArg(_source, size, true);
  if (src.err) return src.err;

  // extend to long if source is word and writing to address register
  if ((size == 2) && (_dest.tab == regs.a) && (_dest.type == 'reg')) {
    src.value = extWord(src.value);
    size = 4;
  }
  
  DisallowPrePost();
  let dst = getArg(_dest, 4, true);
  if (dst.err) return dst.err;

  switch (size) {
    case 2: setArg(_dest, I_ADDA_16(src.value, dst.value), 2, true); break;
    case 4: setArg(_dest, I_ADDA_32(src.value, dst.value), 4, true); break;
    default: return 'unknown instruction';
  }
  AllowPrePost();
  return ret;
}

function BCHG(_instr) {
  switch (_instr.instrSize) {
    case 1: I_BCHG_8(_instr); break;
    case 2: I_BCHG_16(_instr); break;
    case 4: I_BCHG_32(_instr); break;
    default: return 'unknown instruction';
  }
  return null;
}


function BCLR(_instr) {
  switch (_instr.instrSize) {
    case 1: I_BCLR_8(_instr); break;
    case 2: I_BCLR_16(_instr); break;
    case 4: I_BCLR_32(_instr); break;
    default: return 'unknown instruction';
  }
  return null;
}


function BSET(_instr) {
  switch (_instr.instrSize) {
    case 1: I_BSET_8(_instr); break;
    case 2: I_BSET_16(_instr); break;
    case 4: I_BSET_32(_instr); break;
    default: return 'unknown instruction';
  }
  return null;
}


function BTST(_instr) {
  switch (_instr.instrSize) {
    case 1: I_BTST_8(_instr); break;
    case 2: return "BTST is .B or .L only";
    case 4: I_BTST_32(_instr); break;
    default: return 'unknown instruction';
  }
  return null;
}

function ILLEGAL(_instr) {
  if (_instr.jsString) {
    if (!DEBUGGER_AllowJS) return null;
    try {
      eval(_instr.jsString);
    } catch (error) {
      debugger;
      showHTMLError(error.toString());
      debug("error executing inline JS: " + error.toString());
    }
    return null;
  }
  debug("ILLEGAL instruction reached");
  return null;
}

function TRAP(_instr) {
  switch (FX_INFO.platform) {
    case "ST" :
    case "STE" :
      let v1 = getArg(_instr.arg1, 4, false);
      ST_Trap(v1.value);
    return null;
    default: return null;
  }  
}

function NOP(_instr) {
  return null;
}

function EXG(_instr) {
  let v = new Uint32Array(2);
  v[0] = _instr.arg1.tab[_instr.arg1.ind];
  v[1] = _instr.arg2.tab[_instr.arg2.ind];
  _instr.arg1.tab[_instr.arg1.ind] = v[1];
  _instr.arg2.tab[_instr.arg2.ind] = v[0];
}

function NOT(_instr) {
  switch (_instr.instrSize) {
    case 1: I_NOT_8(_instr); break;
    case 2: I_NOT_16(_instr); break;
    case 4: I_NOT_32(_instr); break;
    default: return 'unknown instruction';
  }
  return null;
}


function ADDX(_instr) {
  switch (_instr.instrSize) {
    case 1: I_ADDX_8(_instr); break;
    case 2: I_ADDX_16(_instr); break;
    case 4: I_ADDX_32(_instr); break;
    default: return 'unknown instruction';
  }
  return null;
}

function ROXL(_instr) {
  switch (_instr.instrSize) {
    case 1: I_ROXL_8(_instr); break;
    case 2: I_ROXL_16(_instr); break;
    case 4: I_ROXL_32(_instr); break;
    default: return 'unknown instruction';
  }
  return null;
}

function ROXR(_instr) {
  switch (_instr.instrSize) {
    case 1: I_ROXR_8(_instr); break;
    case 2: I_ROXR_16(_instr); break;
    case 4: I_ROXR_32(_instr); break;
    default: return 'unknown instruction';
  }
  return null;
}

function SUBX(_instr) {
  switch (_instr.instrSize) {
    case 1: I_SUBX_8(_instr); break;
    case 2: I_SUBX_16(_instr); break;
    case 4: I_SUBX_32(_instr); break;
    default: return 'unknown instruction';
  }
  return null;
}

function NEGX(_instr) {
  switch (_instr.instrSize) {
    case 1: I_NEGX_8(_instr); break;
    case 2: I_NEGX_16(_instr); break;
    case 4: I_NEGX_32(_instr); break;
    default: return 'unknown instruction';
  }
  return null;
}

function MOVEP(_instr) {
  const p = DEBUGGER_paranoid;
  DEBUGGER_paranoid = false;    // need to disengage memory check for this instruciton
  switch (_instr.instrSize) {
    case 2: I_MOVEP_16(_instr); break;
    case 4: I_MOVEP_32(_instr); break;
    default: return 'MOVEP is .W or .L only';
  }
  DEBUGGER_paranoid = p;      // set paranoid mode back
  return null;
}

function AND(_instr) {
  let ret = null;
  let _source = _instr.arg1;
  let _dest = _instr.arg2;

  let src = getArg(_source, _instr.instrSize, true);
  if (src.err) return src.err;

  DisallowPrePost();
  let dst = getArg(_dest, _instr.instrSize, true);
  if (dst.err) return dst.err;

  switch (_instr.instrSize) {
    case 1: setArg(_dest, I_AND_8(src.value, dst.value), 1, true); break;
    case 2: setArg(_dest, I_AND_16(src.value, dst.value), 2, true); break;
    case 4: setArg(_dest, I_AND_32(src.value, dst.value), 4, true); break;
    default: return 'unknown instruction';
  }
  AllowPrePost();
  return ret;
}

function OR(_instr) {
  let ret = null;
  let _source = _instr.arg1;
  let _dest = _instr.arg2;

  let src = getArg(_source, _instr.instrSize, true);
  if (src.err) return src.err;

  DisallowPrePost();
  let dst = getArg(_dest, _instr.instrSize, true);
  if (dst.err) return dst.err;

  switch (_instr.instrSize) {
    case 1: setArg(_dest, I_OR_8(src.value, dst.value), 1, true); break;
    case 2: setArg(_dest, I_OR_16(src.value, dst.value), 2, true); break;
    case 4: setArg(_dest, I_OR_32(src.value, dst.value), 4, true); break;
    default: return 'unknown instruction';
  }
  AllowPrePost();
  return ret;
}

function EOR(_instr) {
  let ret = null;
  let _source = _instr.arg1;
  let _dest = _instr.arg2;

  let src = getArg(_source, _instr.instrSize, true);
  if (src.err) return src.err;

  DisallowPrePost();
  let dst = getArg(_dest, _instr.instrSize, true);
  if (dst.err) return dst.err;

  switch (_instr.instrSize) {
    case 1: setArg(_dest, I_EOR_8(src.value, dst.value), 1, true); break;
    case 2: setArg(_dest, I_EOR_16(src.value, dst.value), 2, true); break;
    case 4: setArg(_dest, I_EOR_32(src.value, dst.value), 4, true); break;
    default: return 'unknown instruction';
  }
  AllowPrePost();
  return ret;
}

function SUB(_instr) {
  let ret = null;
  let _source = _instr.arg1;
  let _dest = _instr.arg2;
  let size = _instr.instrSize;

  let src = getArg(_source, size, true);
  if (src.err) return src.err;

  DisallowPrePost();
  let dst = getArg(_dest, size, true);
  if (dst.err) return dst.err;

  let srcVal = src.value;
  // extend to 32 bits when destination is an address register
  if ((size == 2) && (_dest.tab == regs.a) && (_dest.type == 'reg')) {
    srcVal = extWord(srcVal);
    size = 4;
  }

  switch (size) {
    case 1: setArg(_dest, I_SUB_8(srcVal, dst.value), 1, true); break;
    case 2: setArg(_dest, I_SUB_16(srcVal, dst.value), 2, true); break;
    case 4: setArg(_dest, I_SUB_32(srcVal, dst.value), 4, true); break;
    default: return 'unknown instruction';
  }
  AllowPrePost();
  return ret;
}


function EXT(_instr) {
  let ret = null;

  switch (_instr.instrSize) {
    case 1: return 'ext.b is wrong, must be .w or ,l';
    case 2: I_EXT_16(_instr.arg1.tab, _instr.arg1.ind); break;
    case 4: I_EXT_32(_instr.arg1.tab, _instr.arg1.ind); break;
    default: return 'unknown instruction';
  }
  return ret;
}

function ASL(_instr) {
  let ret = null;

  switch (_instr.instrSize) {
    case 1: I_ASL_8(_instr); break;
    case 2: I_ASL_16(_instr); break;
    case 4: I_ASL_32(_instr); break;
    default: return 'unknown instruction';
  }
  return ret;
}

function ASR(_instr) {
  let ret = null;

  switch (_instr.instrSize) {
    case 1: I_ASR_8(_instr); break;
    case 2: I_ASR_16(_instr); break;
    case 4: I_ASR_32(_instr); break;
    default: return 'unknown instruction';
  }
  return ret;
}


function LSL(_instr) {
  let ret = null;

  switch (_instr.instrSize) {
    case 1: I_LSL_8(_instr); break;
    case 2: I_LSL_16(_instr); break;
    case 4: I_LSL_32(_instr); break;
    default: return 'unknown instruction';
  }
  return ret;
}

function LSR(_instr) {
  let ret = null;

  switch (_instr.instrSize) {
    case 1: I_LSR_8(_instr); break;
    case 2: I_LSR_16(_instr); break;
    case 4: I_LSR_32(_instr); break;
    default: return 'unknown instruction';
  }
  return ret;
}


function CLR(_instr) {
  let ret = null;
  let _source = _instr.arg1;

  switch (_instr.instrSize) {
    case 1: setArg(_source, 0, 1, false); break;
    case 2: setArg(_source, 0, 2, false); break;
    case 4: setArg(_source, 0, 4, false); break;
    default: return 'unknown instruction';
  }
  regs.z = true; regs.n = regs.v = regs.c = false;
  return ret;
}

function NEG(_instr) {
  let ret = null;

  let src = getArg(_instr.arg1, _instr.instrSize, true);

  switch (_instr.instrSize) {
    case 1: setArg(_instr.arg1,I_NEG_8(src.value), 1, true); break;
    case 2: setArg(_instr.arg1,I_NEG_16(src.value), 2, true); break;
    case 4: setArg(_instr.arg1,I_NEG_32(src.value), 4, true); break;
    default: return 'unknown instruction size';
  }
  return ret;
}

function CMP(_instr) {
  let ret = null;
  switch (_instr.instrSize) {
    case 1: I_CMP_8(_instr); break;
    case 2: I_CMP_16(_instr); break;
    case 4: I_CMP_32(_instr); break;
    default: return 'unknown instruction size';
  }
  return ret;
}

function SPL(_instr) {
  if (regs.n)
    setArg(_instr.arg1, 0, 1, false);
  else
    setArg(_instr.arg1, 0xff, 1, false);
  return null;
}

function SCC(_instr) {
  if (regs.c)
    setArg(_instr.arg1, 0, 1, false);
  else
    setArg(_instr.arg1, 0xff, 1, false);
  return null;
}

function SCS(_instr) {
  if (regs.c)
    setArg(_instr.arg1, 0xff, 1, false);
  else
    setArg(_instr.arg1, 0, 1, false);
  return null;
}

function SHI(_instr) {
  if (!regs.c && !regs.z)
    setArg(_instr.arg1, 0xff, 1, false);
  else
    setArg(_instr.arg1, 0, 1, false);
  return null;
}

function SLS(_instr) {
  if (regs.c || regs.z)
    setArg(_instr.arg1, 0xff, 1, false);
  else
    setArg(_instr.arg1, 0, 1, false);
  return null;
}

function SGE(_instr) {
  if ((regs.n && regs.v) || (!regs.n && !regs.v))
    setArg(_instr.arg1, 0xff, 1, false);
  else
    setArg(_instr.arg1, 0, 1, false);
  return null;
}

function SGT(_instr) {
  if ((regs.n && regs.v && !regs.z) || (!regs.n && !regs.v && !regs.z))
    setArg(_instr.arg1, 0xff, 1, false);
  else
    setArg(_instr.arg1, 0, 1, false);
  return null;
}

function SMI(_instr) {
  if (regs.n)
    setArg(_instr.arg1, 0xff, 1, false);
  else
    setArg(_instr.arg1, 0, 1, false);
  return null;
}

function SEQ(_instr) {
  if (regs.z)
    setArg(_instr.arg1, 0xff, 1, false);
  else
    setArg(_instr.arg1, 0, 1, false);
  return null;
}

function SLE(_instr) {
  if ((regs.z) || (regs.n && !regs.v) || (!regs.n && regs.v))
    setArg(_instr.arg1, 0xff, 1, false);
  else
    setArg(_instr.arg1, 0, 1, false);
  return null;
}

function SLT(_instr) {
  if ((regs.n && !regs.v) || (!regs.n && regs.v))
    setArg(_instr.arg1, 0xff, 1, false);
  else
    setArg(_instr.arg1, 0, 1, false);
  return null;
}

function SNE(_instr) {
  if (regs.z)
    setArg(_instr.arg1, 0, 1, false);
  else
    setArg(_instr.arg1, 0xff, 1, false);
  return null;
}

function SVC(_instr) {
  if (regs.v)
    setArg(_instr.arg1, 0, 1, false);
  else
    setArg(_instr.arg1, 0xff, 1, false);
  return null;
}

function SVS(_instr) {
  if (regs.v)
    setArg(_instr.arg1, 0xff, 1, false);
  else
    setArg(_instr.arg1, 0, 1, false);
  return null;
}

function ST(_instr) {
  setArg(_instr.arg1, 0xff, 1, false);
  return null;
}

function SF(_instr) {
  setArg(_instr.arg1, 0, 1, false);
  return null;
}

function TST(_instr) {
  let ret = null;
  switch (_instr.instrSize) {
    case 1: I_TST_8(_instr.arg1); break;
    case 2: I_TST_16(_instr.arg1); break;
    case 4: I_TST_32(_instr.arg1); break;
    default: return 'unknown instruction';
  }
  return ret;
}


function NOT_IMPLEMENTED(_instr) {
  main_Alert(_instr.filtered + ": instruction not yet implemented. Sorry");
  return null;
}

function EVEN(_instr) {
  return null;
}


function STACK_PUSH(_value, _size) {
  regs.a[7] -= _size;
  MACHINE.setRAMValue(_value, regs.a[7], _size);
}

function STACK_POP(_size) {
  let r = MACHINE.getRAMValue(regs.a[7], _size, false);
  regs.a[7] += _size;
  return r;
}

function BCCExec(_l, _cond) {
  if (_cond) {
    M68K_NEXTIP = _l.branchIP; 
    reportBranch(M68K_IP);
  }
}

function DBCCExec(_l, _v) {
  if (_v != -1) {
    _l.cycles = 10; // branch taken
    M68K_NEXTIP = _l.branchIP; 
    reportBranch(M68K_IP);
  } else {
    _l.cycles = 14; // cc is false
  }
}

function CCIsTrue(_l) {
    _l.cycles = 12;
}

function BHI(_line) { BCCExec(_line,((!regs.c) && (!regs.z)));}			// !C && !Z
function BLS(_line) { BCCExec(_line, ((regs.c) || (regs.z)));}			// C || Z
function BCS(_line) { BCCExec(_line, (regs.c));}									// C
function BCC(_line) { BCCExec(_line, (!regs.c));}									// !C
function BNE(_line) { BCCExec(_line, (!regs.z));}									// !Z
function BEQ(_line) { BCCExec(_line, (regs.z));}									// Z
function BVC(_line) { BCCExec(_line, (!regs.v));}									// !V
function BVS(_line) { BCCExec(_line, (regs.v));}									// V
function BPL(_line) { BCCExec(_line, (!regs.n));}									// !N
function BMI(_line) { BCCExec(_line, (regs.n));}									// N
function BGE(_line) { BCCExec(_line, ((regs.n && regs.v) || (!regs.n && !regs.v)));}			// (N && V) || (!N && !V)
function BLT(_line) { BCCExec(_line, ((regs.n && !regs.v) || (!regs.n && regs.v)));}			// (N && !V) || (!N && V)
function BGT(_line) { BCCExec(_line, ((regs.n && regs.v && !regs.z) || (!regs.n && !regs.v && !regs.z)));} // (N && V && !Z) || (!N && !V && !Z)
function BLE(_line) { BCCExec(_line, ((regs.z) || (regs.n && !regs.v) || (!regs.n && regs.v)));} // Z || (N && !V) || (!N && V)
function BSR(_line) { 
  reportBranch(M68K_IP);
  STACK_PUSH(M68K_NEXTIP, 4);
  if (!isNaN(_line.branchAx)) 
    M68K_NEXTIP = regs.a[_line.branchAx]; 
  else if (_line.branchAnRn != null)
    M68K_NEXTIP = regs.a[_line.branchAnRn.An] + TOOLS.toInt16(_line.branchAnRn.rTab[_line.branchAnRn.rInd]);
  else 
    M68K_NEXTIP = _line.branchIP;
}
function BRA(_line) { 
  reportBranch(M68K_IP); 
  if (!isNaN(_line.branchAx)) {
    M68K_NEXTIP = regs.a[_line.branchAx]; 
    if (!_line.isErrorImmune && DEBUGGER_paranoid) {
      if (M68K_NEXTIP < M68K_VECTORS_ZONE_SIZE) runtimeError68k("Pointing to the wrong address? Instruction jumping below code section: $"  + M68K_NEXTIP.toString(16) + ERRORIMMUNE_COMMENT);
      if (M68K_NEXTIP > MACHINE.maxCodeAdrs) runtimeError68k("Pointing to the wrong address? Instruction jumping above code section: $"  + M68K_NEXTIP.toString(16) + ERRORIMMUNE_COMMENT);
    }  
  }
  else if (_line.branchAnRn != null) {
    M68K_NEXTIP = regs.a[_line.branchAnRn.An] + TOOLS.toInt16(_line.branchAnRn.rTab[_line.branchAnRn.rInd]);
    if (!_line.isErrorImmune && DEBUGGER_paranoid) {
      if (M68K_NEXTIP < M68K_VECTORS_ZONE_SIZE) runtimeError68k("Pointing to the wrong address? Instruction jumping below code section: $"  + M68K_NEXTIP.toString(16) + ERRORIMMUNE_COMMENT);
      if (M68K_NEXTIP > MACHINE.maxCodeAdrs) runtimeError68k("Pointing to the wrong address? Instruction jumping above code section: $"  + M68K_NEXTIP.toString(16) + ERRORIMMUNE_COMMENT);
    }  
  }
  else M68K_NEXTIP = _line.branchIP;
}

function DBF(_line) {
  let v = _line.arg1.tab[_line.arg1.ind] & 0xffff;
  v -= 1;
  _line.arg1.tab[_line.arg1.ind] = (_line.arg1.tab[_line.arg1.ind] & 0xffff0000) | (v & 0xffff);
  DBCCExec(_line, v);
}

function DBHI(_line) {
  if ((!regs.c) && (!regs.z)) return CCIsTrue(_line);
  let v = _line.arg1.tab[_line.arg1.ind] & 0xffff;
  v -= 1;
  _line.arg1.tab[_line.arg1.ind] = (_line.arg1.tab[_line.arg1.ind] & 0xffff0000) | (v & 0xffff);
  DBCCExec(_line, v);
}

function DBLS(_line) {
  if ((regs.c) || (regs.z)) return CCIsTrue(_line);
  let v = _line.arg1.tab[_line.arg1.ind] & 0xffff;
  v -= 1;
  _line.arg1.tab[_line.arg1.ind] = (_line.arg1.tab[_line.arg1.ind] & 0xffff0000) | (v & 0xffff);
  DBCCExec(_line, v);
}

function DBCS(_line) {
  if (regs.c) return CCIsTrue(_line);
  let v = _line.arg1.tab[_line.arg1.ind] & 0xffff;
  v -= 1;
  _line.arg1.tab[_line.arg1.ind] = (_line.arg1.tab[_line.arg1.ind] & 0xffff0000) | (v & 0xffff);
  DBCCExec(_line, v);
}

function DBCC(_line) {
  if (!regs.c) return CCIsTrue(_line);
  let v = _line.arg1.tab[_line.arg1.ind] & 0xffff;
  v -= 1;
  _line.arg1.tab[_line.arg1.ind] = (_line.arg1.tab[_line.arg1.ind] & 0xffff0000) | (v & 0xffff);
  DBCCExec(_line, v);
}

function DBNE(_line) {
  if (!regs.z) return CCIsTrue(_line);
  let v = _line.arg1.tab[_line.arg1.ind] & 0xffff;
  v -= 1;
  _line.arg1.tab[_line.arg1.ind] = (_line.arg1.tab[_line.arg1.ind] & 0xffff0000) | (v & 0xffff);
  DBCCExec(_line, v);
}

function DBEQ(_line) {
  if (regs.z) return CCIsTrue(_line);
  let v = _line.arg1.tab[_line.arg1.ind] & 0xffff;
  v -= 1;
  _line.arg1.tab[_line.arg1.ind] = (_line.arg1.tab[_line.arg1.ind] & 0xffff0000) | (v & 0xffff);
  DBCCExec(_line, v);
}

function DBVC(_line) {
  if (!regs.v) return CCIsTrue(_line);
  let v = _line.arg1.tab[_line.arg1.ind] & 0xffff;
  v -= 1;
  _line.arg1.tab[_line.arg1.ind] = (_line.arg1.tab[_line.arg1.ind] & 0xffff0000) | (v & 0xffff);
  DBCCExec(_line, v);
}

function DBVS(_line) {
  if (regs.v) return CCIsTrue(_line);
  let v = _line.arg1.tab[_line.arg1.ind] & 0xffff;
  v -= 1;
  _line.arg1.tab[_line.arg1.ind] = (_line.arg1.tab[_line.arg1.ind] & 0xffff0000) | (v & 0xffff);
  DBCCExec(_line, v);
}

function DBPL(_line) {
  if (!regs.n) return CCIsTrue(_line);
  let v = _line.arg1.tab[_line.arg1.ind] & 0xffff;
  v -= 1;
  _line.arg1.tab[_line.arg1.ind] = (_line.arg1.tab[_line.arg1.ind] & 0xffff0000) | (v & 0xffff);
  DBCCExec(_line, v);
}

function DBMI(_line) {
  if (regs.n) return CCIsTrue(_line);
  let v = _line.arg1.tab[_line.arg1.ind] & 0xffff;
  v -= 1;
  _line.arg1.tab[_line.arg1.ind] = (_line.arg1.tab[_line.arg1.ind] & 0xffff0000) | (v & 0xffff);
  DBCCExec(_line, v);
}

function DBGE(_line) {
  if ((regs.n && regs.v) || (!regs.n && !regs.v)) return CCIsTrue(_line);
  let v = _line.arg1.tab[_line.arg1.ind] & 0xffff;
  v -= 1;
  _line.arg1.tab[_line.arg1.ind] = (_line.arg1.tab[_line.arg1.ind] & 0xffff0000) | (v & 0xffff);
  DBCCExec(_line, v);
}

function DBLT(_line) {
  if ((regs.n && !regs.v) || (!regs.n && regs.v)) return CCIsTrue(_line);
  let v = _line.arg1.tab[_line.arg1.ind] & 0xffff;
  v -= 1;
  _line.arg1.tab[_line.arg1.ind] = (_line.arg1.tab[_line.arg1.ind] & 0xffff0000) | (v & 0xffff);
  DBCCExec(_line, v);
}

function DBGT(_line) {
  if ((regs.n && regs.v && !regs.z) || (!regs.n && !regs.v && !regs.z)) return CCIsTrue(_line);
  let v = _line.arg1.tab[_line.arg1.ind] & 0xffff;
  v -= 1;
  _line.arg1.tab[_line.arg1.ind] = (_line.arg1.tab[_line.arg1.ind] & 0xffff0000) | (v & 0xffff);
  DBCCExec(_line, v);
}

function DBLE(_line) {
  if ((regs.z) || (regs.n && !regs.v) || (!regs.n && regs.v)) return CCIsTrue(_line);
  let v = _line.arg1.tab[_line.arg1.ind] & 0xffff;
  v -= 1;
  _line.arg1.tab[_line.arg1.ind] = (_line.arg1.tab[_line.arg1.ind] & 0xffff0000) | (v & 0xffff);
  DBCCExec(_line, v);
}



function RTS(_line) {
  if (MACHINE.isStackOver()) {
    M68K_IP = 0;
    M68K_NEXTIP = 0;
    M68K_lastBranches = new Uint32Array(1024);    
    M68K_lastBranchIndex = 0;
    M68K_lastBranchesInterrupt = new Uint32Array(1024);    
    M68K_lastBranchIndexInterrupt = 0;
    return 'exit';
  }
  let candidateIP = STACK_POP(4);
  if (DEBUGGER_paranoid) {
    if (candidateIP < M68K_VECTORS_ZONE_SIZE) {
      runtimeError68k("Corrupted stack? RTS instruction popped invalid address from stack: Address below code section: $"  + M68K_NEXTIP.toString(16) + ". If intended (e.g. generated code in data section), disable DEBUGGER_paranoid mode using ';>JS DEBUGGER_paranoid=false' in your code.");
      return;
    }
    if (candidateIP > MACHINE.maxCodeAdrs) {
      runtimeError68k("Corrupted stack? RTS instruction popped invalid address from stack: Address above code section: $"  + M68K_NEXTIP.toString(16) + ". If intended (e.g. generated code in data section), disable DEBUGGER_paranoid mode using ';>JS DEBUGGER_paranoid=false' in your code.");
      return;
    }
  }
  reportBranch(M68K_IP);
  M68K_NEXTIP = candidateIP;
}


function RTE(_line) {
  reportBranch(M68K_IP);
  MACHINE.exitSuper(_line);
  M68K_INTERRUPT_STATE = null;
}

/* reAssembles instructions in RAM
_ip : start address to reAssemble
_count : number of instructions to reAssemble
needed to get the debugger show the right insturctions when opcodes are modified 
*/
function reAssemble(_ip,_count) {
  let line = null;
  for (let i = 0; i < _count; i++) {
    let byteCode = new Uint8Array(16);
    let w = 0;
    for (let k = 0; k < 16; k++) {
      byteCode[w++] = CPU_CODE_SECTION[_ip + k];
    }
    let r = decode_instruction_generated(byteCode, _ip);
    let str = InstructionToString(r.instruction).fullString;
    line = new LineParser("disassembly", str, str);
    CODERPARSER_SINGLETON.process_oneLineInstr(line);
    if (CODERPARSER_SINGLETON.stopGlobalCompilation) return null;
    CODERPARSER_SINGLETON.process_executionCallback_oneLine(line);
    line.IP = _ip;
    line.codeSectionOfs = _ip;
    let lnIndex = ASMBL_ADRSTOLINE[_ip];
    if (lnIndex) {
      line.finalLine = lnIndex;
      PARSER_lines[lnIndex] = line;
      ASMBL_ADRSTOLINE[_ip] = lnIndex;
    } else {
      line.finalLine = PARSER_lines.length;
      ASMBL_ADRSTOLINE[_ip] = PARSER_lines.length;
      PARSER_lines.push(line);  
    }
    let out = {tab:new Uint8Array(16), ofs:0};
    asmbl_go(line, out);
    if (out.ofs > 0) {
      line.instrBytes = out.ofs;
      _ip += out.ofs;
    }
  }
  if (DEBUGGER_tracing)  
    DEBUGGER_initFile();
  else
    DEBUGGER_NeedReload = true;
  return line;
}

function DBG_ExitASMBackToJS() {
  DEBUGGER_insideInvoke = null;
  MACHINE.super = false;
  M68K_INTERRUPT_STATE = null;
  MACHINE.forceExitAsm = true;
  return 'exit';
}

function CPU_EvaluateVBL(_nextInstr) {
  const save = DEBUGGER_paranoid;
  DEBUGGER_paranoid = false;

  let doInterrupt = M68K_FORCENEXTVBL;

  if (DEBUGGER_tracing) { // do not trust clock when tracing, use cycle counter instead
    return;/*
    if (M68K_INTERRUPT_COUNTER >= M68K_TICKS_PER_FRAME)
      doInterrupt = true;*/
  } else { // use clock when not tracing, way more accurate
    const ctime = new Date().getTime();
    if (ctime - CPU_LAST_INTERRUPT_TIME >= 16) {
      CPU_LAST_INTERRUPT_TIME = ctime;
      doInterrupt = true;
    }
  }

 
  if (doInterrupt && (M68K_INTERRUPT_STATE == null)) {
      switch (FX_INFO.platform) {
        case "ST" :
        case "STE" :
        {
          let frameIndex = MACHINE.getRAMValue(0x466,4,false);
          MACHINE.setRAMValue(frameIndex+1,0x466,4);
        }
        break;
      }  
      if (M68K_VBL_CALLBACK) {
      //console.log("ENTERING VBL");
      M68K_INTERRUPT_COUNTER = 0;    
      M68K_INTERRUPT_STATE = "VBL";
      M68K_FORCENEXTVBL = false;
      reportBranch(M68K_VBL_INTERRUPT);  // specific address to indicate interrupt instead of actual branch
      MACHINE.enterSuper(M68K_VBL_CALLBACK, _nextInstr);
      if (DEBUGGER_PAUSEVBL) debug();
    }
  }
  DEBUGGER_paranoid = save;
}


function canExecuteNextInstr() {
  WAITING_USERINPUT = true;
  return new Promise((resolve) => {
    document.addEventListener('keydown', onKeyHandler);
    function onKeyHandler(e) {
      if (!DEBUGGER_tracing || DEBUGGER_canStep || DEBUGGER_traceTillRTS || DEBUGGER_runTillIP) {
        document.removeEventListener('keydown', onKeyHandler);
        WAITING_USERINPUT = false;
        resolve();
      }
    }
  });
}



async function execCPU() {
  if (!DEBUGGER_insideInvoke) {
    main_Alert("should not call execCPU() outside of an invoke");
    debugger;
    return;
  }
  MYFX.updateInvokedAsm = true;
  let WATCHDOG = 0;
  while (M68K_IP < MACHINE.ram.length) {
    if (MACHINE.stop) {
      LAST_GETARG = [];
      LAST_SETARG = [];
      return;
    }
    regs.PC = M68K_IP;
    let line = null;
    let lineIndex = ASMBL_ADRSTOLINE[M68K_IP];
    //if (typeof lineIndex == 'undefined') debugger;

    if (typeof lineIndex != 'undefined' && lineIndex !== null) {
      // line already compiled
      line = PARSER_lines[lineIndex];
      if (isNaN(line.instrBytes) || line.instrBytes <= 0) {
        let errStr  = "wrong instruction at OFS: $" + M68K_IP.toString(16);
        if (M68K_CURLINE) {
          errStr += "<br>" + "prev instruction: " + M68K_CURLINE.getFileLineStr();
          errStr += "<br>" + M68K_CURLINE.filtered;
          errStr += "<br> OFS: $" + M68K_CURLINE.IP.toString(16);
          errStr += "<br> opcode size: " + M68K_CURLINE.instrBytes;
        }
        runtimeError68k(errStr);
        MACHINE.stop = true;
        LAST_GETARG = [];
        LAST_SETARG = [];
        return;
      }
    } else {
      line = null;
      const l = ASMBL_ADRSTOLINE_GEN.length;
      for (let i = 0; i < l; i++) {
        if (ASMBL_ADRSTOLINE_GEN[i].ip == M68K_IP) {
          lineIndex = ASMBL_ADRSTOLINE_GEN[i].ln;
          line = PARSER_lines[lineIndex];
          break;
        }
      }
      if (!line) {
        // line not yet compiled (modified or generated code?)
        let byteCode = new Uint8Array(16);
        let w = 0;
        for (let k = 0; k < 16; k++) {
          byteCode[w++] = CPU_CODE_SECTION[M68K_IP + k];
        }
        let r = decode_instruction_generated(byteCode, M68K_IP);
        let str = InstructionToString(r.instruction);
        line = new LineParser("disassembly", str.fullString, str.fullString);
        line.instr = str.instr;
        line.isInstr = true;
        line.instrSize = str.size;
        line.parsingOK = true;
        if (line.instr) {
          CODERPARSER_SINGLETON.process_oneLineInstr(line);
          CODERPARSER_SINGLETON.process_executionCallback_oneLine(line);
          ASMBL_ADRSTOLINE_GEN.push({ip:M68K_IP, ln:PARSER_lines.length});
          PARSER_lines.push(line);
          let out = {tab:new Uint8Array(16), ofs:0};
          asmbl_go(line, out);
          if (out.ofs > 0) {
            line.instrBytes = out.ofs;
          }
        }
        //console.log(line.filtered);
      }
    }    
    if (!line) debugger;
    M68K_CURLINE = line;
    M68K_NEXTIP = M68K_IP + line.instrBytes;

    DEBUGGER_BeforeInstr();

    if (DEBUGGER_tracing && !DEBUGGER_canStep && !DEBUGGER_traceTillRTS && !DEBUGGER_runTillIP) {
      await canExecuteNextInstr();
    }

    if (line.isInstr) { // if actual 68k code
      if (M68K_DEBUGNEXTLINE) {
        M68K_DEBUGNEXTLINE = false;
        alert("open your browser's debugger cause we reached M68K_DEBUGNEXTLINE");
        debugger;
      }
      const out = line.call(line);
      if (MACHINE.forceExitAsm) {
        MACHINE.forceExitAsm = false;
        LAST_GETARG = [];
        LAST_SETARG = [];
        return;
      }

      if (TIME_MACHINE) TIME_MACHINE.onCPUInstr();
      M68K_LASTEXEC[M68K_EXECUTED%16] = line;
      M68K_EXECUTED++;
       
      //console.log("executed: " + line.filtered);
      if (!isNaN(line.cycles)) {
        M68K_CYCLES += line.cycles;
        M68K_INTERRUPT_COUNTER += line.cycles;  
      } else {
        line.cycles = 0;
        debugger;
      }

      /* don't do this, would forbid jumping to auto generated code
      if (M68K_NEXTIP>=ASMBL_ADRSTOLINE.length) {
        runtimeError68k("Next instruction is out of bounds. Did you overwrite the stack or jump to a fancy address?");
        DEBUGGER_insideInvoke = null;
        return;
      }
      */
      if (out) {
        if (line.instr == 'RTS') {
          if (out == 'exit') { // all asm code executed, final RTS executed (back to the top of the stack)
            DEBUGGER_insideInvoke = null;
            if (MACHINE.super) {
              console.error(line.getFailString("should exit supervisor mode through RTE, not RTS"));
              debugger;
              MACHINE.exitSuper(line);
            }
            else if (M68K_INTERRUPT_STATE != null) {
              console.error(line.getFailString("interrupt state but not in super mode"));
              debugger;
            }
            LAST_GETARG = [];
            LAST_SETARG = [];
            return;
          }
          else if (DEBUGGER_tracing && !DEBUGGER_canStep && !DEBUGGER_runTillIP) {
            await canExecuteNextInstr();
          }
          alert("RTS + out = " + out);
          LAST_GETARG = [];
          LAST_SETARG = [];
          return;
        }
        runtimeError68k(out);
      }
    } 
    if (DEBUGGER_tracing)
      DEBUGGER_AfterInstr();
    else {
      LAST_GETARG = [];
      LAST_SETARG = [];
    }
    
    if (DEBUGGER_paranoid)
      checklocks(line);

    M68K_PREVIP = M68K_IP;
    M68K_IP = M68K_NEXTIP;

    CPU_EvaluateVBL(M68K_IP);

    if (DEBUGGER_traceTillRTS)
      DEBUGGER_canStep = true;
    else
      DEBUGGER_canStep = false;

      if (CPU_CONFIG.watchdog_maxInstr > 0) {
        WATCHDOG++;
        if (WATCHDOG > CPU_CONFIG.watchdog_maxInstr) { // avoid blocking infinite loop
          debug("watchdog triggered: infinite loop? If not, increase CPU_CONFIG.watchdog_maxInstr, or set it to 0 to disable watchdog");
          return;
        }
      }
  }

  runtimeError68k("CPU is lost! Are you still executing source code? IP = $" + M68K_IP.toString(16));
  DEBUGGER_insideInvoke = null;
}

function invoke68K(_label, _trace) {
  if (MACHINE.super) {
    main_Alert("Not sure how the JS could invoke anything if the CPU is executin an interruption. contact Soundy (if possible, send the browser's call stack)");
    debugger;
    return;
  } else {
    if (!_label) {
      debugger;
      main_Alert("can't invoke null label");
      return;
    }
  
    if (DEBUGGER_insideInvoke) {
      debugger;
      if (DEBUGGER_insideInvoke == _label) {
        if (DEBUGGER_tracing) {
          return; // Already tracing this function. The main loop will call CPU update on this function, we're good
        }
      }  
      main_Alert("error: can't invoke68K '" + _label + "' while already executing '" + DEBUGGER_insideInvoke + "'. You probably need to use execution lists.");
      return;
    }
    M68K_IP = CODERPARSER_SINGLETON.getLabelCodeSectionOffset(_label);
  }
  if (_trace || DEBUGGER_PAUSEUPDATE) {
    setTraceMode(true);
  }

  if (M68K_IP >= 0) {
    DEBUGGER_insideInvoke = _label;
    if (!DEBUGGER_tracing) {
      execCPU();
    }
    if (WAITING_USERINPUT) {
      // tracing asm? skip the rest on the FX update and jump back to the main loop
      throw new Error("WAITING_USERINPUT");
    }
    return;
  } else {
    debugger;
    main_Alert("invoke68K: invoked asm label not found: " + _label);  
  }
}


