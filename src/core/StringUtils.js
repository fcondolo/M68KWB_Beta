
function isSpace(_t) {
  if (!_t) return true;
  if (_t.length < 1) return true;
  if (_t.length > 1) { console.error("'isSpace' should be passed a single character"); debugger; return true; }
  if (_t == ' ') return true;
  if (_t == '\t') return true;
  if (_t == '\n') return true;
  if (_t == '\r') return true;
  return false;
}

function indexOfSingleWord(_what, _where) {
  let what = _what.slice().trim();
  let where = _where.slice().trim();
  if (what.normalize() === where.normalize()) {
    return 0;
  }

  let ofs = where.indexOf(what);
  if (ofs < 0) {
    return -1;
  }


  if (ofs > 0) {
    if (where[ofs - 1] != ' ' && where[ofs - 1] != '\t')
      return -1;
  }
  if (ofs < where.length - 1) {
    let len = what.length;
    if (where[ofs + len] != ' ' && where[ofs + len] != '\t') {
      return -1;
    }
  }
  return ofs;
}


function readNextRegister(_paramstr, _ofs, _mustBeRegister, isMovem, _l) {
  let ret = { reg: '', index: _ofs, regStr: null };
  let _str = _paramstr;
  if (_str == 'SP') _str = 'A7';
  while (ret.index < _str.length) {
    let c = _str[ret.index];
    switch (c) {
      case 'A':
      case 'D':
        if (ret.index > 0) {
          switch(_str[ret.index-1]) { // avoid interpreting a number (e.g. '$D1') or label (e.g. 'CLOUD0') as a register
            case ' ' : break;
            case '\t' : break;
            case '\n' : break;
            case '\r' : break;
            case '(' : break; // move (a0),d0
            case ',' : break; // move d0,(a0,d0.w)
            case '/' : if (isMovem) break; else return null; // movem Dn/An
            case '-' : if (isMovem) break; else return null;; // movem D0-D3
            default: return null;
          }
        }
        ret.regStr = c;
        break;
      default:
        if (_mustBeRegister) {
          _l.Failed("wrong register: " + _str);
        }
        return null;
    }
    ret.index++;
    if (ret.index >= _str.length) return null;
    c = _str[ret.index];
    switch (c) {
      case '0':
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
        let nextIndex = ret.index + 1;
        if (nextIndex < _str.length) {
          switch (_str[nextIndex]) { // avoid interpreting a number (e.g. '$D1') or label (e.g. 'CLOUD0') as a register
            case ' ' : break;
            case '\t' : break;
            case '\n' : break;
            case '\r' : break;
            case ')' : break;
            case '.' : break;
            case ',' : break;
            case '/' : if (isMovem) break; else return null; // movem Dn/An
            case '-' : if (isMovem) break; else return null;; // movem D0-D3
            default: return null;
          }  
        }
        ret.regStr += c;
        ret.index++;
        const r = registerFromName(ret.regStr);
        if (r.err) {
          _l.Failed("wrong register: " + _str + ' : ' + r.err);
          return null;
        }
        ret.tab = r.tab;
        ret.ind = r.ind;
        ret.reg = ret.regStr;
        return ret;
        break;
      default:
        if (_mustBeRegister) {
          l.Failed("wrong register: " + _str);
        }
        return null;
    }
  }
  return null;
}

function readNextLabel(_str, _ofs) {
  let ret = { index: _ofs, num: NaN };
  let candidate = '';
  let done = false;
  while ((ret.index < _str.length) && (!done)) {
    let c = _str[ret.index++];
    switch (c) {
      case '-': sign = -1; break;
      case '(':
      case ')':
      case ',':
      case ' ':
      case '\t':
      case '\r':
      case ',':
      case ';':
      case ':':
        done = true;
        break;
      default:
        candidate += c;
        break;
    }
  }
  candidate = candidate.toUpperCase();
  for (let j = 0; j < CODERPARSER_SINGLETON.labels.length; j++) {
    const l = CODERPARSER_SINGLETON.labels[j].label.toUpperCase();
    if (candidate == l) {
      ret.num = j;
      return ret;
    }
  }

  return null;
}

function readNextConstant(_str, _index) {
  for (let i = 0; i < CODERPARSER_SINGLETON.constants.length; i++) {
    let ofs = _str.indexOf(CODERPARSER_SINGLETON.constants[i].name); // don't use indexOfSingleWord here, e.g. "BLTCON0(A6)" would not work because of the (A6)
    if ((ofs >= 0) && (ofs >= _index)) {
      return { index: ofs + CODERPARSER_SINGLETON.constants[i].name.length, num: CODERPARSER_SINGLETON.constants[i].value };
    }
  }
  
  for (let i = 0; i < MACHINE.constants.length; i++) {
    let ofs = _str.indexOf(MACHINE.constants[i].name); // don't use indexOfSingleWord here, e.g. "BLTCON0(A6)" would not work because of the (A6)
    if ((ofs >= 0) && (ofs >= _index)) {
      return { index: ofs + MACHINE.constants[i].name.length, num: MACHINE.constants[i].value };
    }
  }

  return null;
}

function skipSpaces(_i, _t) {
  let i = _i;
  while (i < _t.length) {
    if (!isSpace(_t[i]))
      return i;
    i++;
  }
  return i;
}



function strReplaceAt(str, index, chr) {
  if (index > str.length - 1) return str;
  return str.substring(0, index) + chr + str.substring(index + 1);
}


function load_binary_resource(_url, _label) {
  var req = null;
  try {
    const d = new Date();
    let ms = d.getMilliseconds();

    req = new XMLHttpRequest();
    req.open('GET', _url + "?v=" + ms, false);
    req.overrideMimeType('text\/plain; charset=x-user-defined');
    req.send(null);
  } catch (error) {
    return error;
  }
  if (req.status != 200) {
    return "failed loading binary file";
  }
  const bytes = req.responseText.length;
  if ((!bytes) || (bytes <= 0)) {
    main_Alert("Can't load empty file: " + _url);
    return null;
  }
  if (!CODERPARSER_SINGLETON.loadedFiles) {
    CODERPARSER_SINGLETON.loadedFiles = [];
  }
  let byteArray = MACHINE.allocRAM(bytes, 1, "load binary file: " + _url);
  CODERPARSER_SINGLETON.loadedFiles.push({name:_url.toUpperCase(), size:bytes, adrs:byteArray});
  let w = byteArray;
  for (var i = 0; i < bytes; ++i) {
    w = MACHINE.setRAMValue(req.responseText.charCodeAt(i) & 0xff, w, 1);
  }
  if ((!_label.dcData) || (byteArray < _label.dcData))
    _label.dcData = byteArray;
  if (!_label.dcLen) _label.dcLen = 0;
  _label.dcLen = Math.max(_label.dcLen, w - _label.dcData);
  return null;
}

