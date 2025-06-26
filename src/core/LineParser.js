const PARSE_FAIL_OK = 0;
const PARSE_FAIL_ERROR = 1;
const PARSE_FAIL_REWIND = 2;

var PARSEJSNUMBER_ALLOWDCDATA = false;
  
class LineParser {

  constructor(_path, _line, _text, _originalIndex) {
    // WARNING! UPDATE THE clone() METHOD WHEN ADDING/REMOVING A FIELD HERE!!!!!
    let t = this;
    t.ofs = 0;      // current read offset (used by parser only)
    t.path = _path;  // original file
    t.line = _line;  // original line in original file
    t.text = _text   // original string 
    t.filtered = null;   // filtered (work) string
    t.isLabel = false;   // line contains a label, not an instruction
    t.isInstr = true;   // line contains an instruction
    t.instr = null;   // name of the instruction (MOVE, DC, etc.)
    t.instrSize = 2;      // byte = 1, word = 2, long = 4. All instructions default to word
    t.parsingOK = true;   // parsing could properly decode this line (used to know if a 2md parsing pass is needed for this line)
    t.attachedLabel = null; // used by dc.x/ds.x to know to which label they are attached (nearrest label before them)
    t.dcData = null;  // used by labels to point to the address of the data they may contain
    t.dcLen = null;  // used by labels to indicate the size of the data they may contain
    t.finalLine = NaN; // line number in the fully deployed string table 
    t.jsString = null; // Javascript to execute on this lline (if any)
    t.originalIndex = _originalIndex; // index of the line in the original file
    t.endLabelIndex = -100;
    t.filter();
    t.lastFoundNumberIndex = NaN;
    t.IP = NaN;
    t.updateImmunityflag();
  }

  clone() {
    const t = this;
    let ret = new LineParser(t.path, t.line, t.text, t.originalIndex);

    ret.ofs = t.ofs;
    ret.path = t.path;
    ret.line = t.line;
    ret.text = t.text;
    ret.filtered = t.filtered;
    ret.isLabel = t.isLabel;
    ret.instr = t.instr;
    ret.parsingOK = t.parsingOK;
    ret.attachedLabel = t.attachedLabel;
    ret.dcData = t.dcData;
    ret.dcLen = t.dcLen;
    ret.finalLine = t.finalLine;
    ret.jsString = t.jsString;
    ret.isInstr = t.isInstr;
    ret.instr = t.instr;
    ret.originalIndex = t.originalIndex;
    ret.IP = t.IP;
    ret.endLabelIndex = t.endLabelIndex;
    ret.isErrorImmune = t.isErrorImmune;
    return ret;
  }

  filter() {
    let t = this;
    let len = t.text.length;

    // determine if we want to keep comments or not
    let keepComments = false;
    const jsCmd = t.text.indexOf('>JS');
    if (jsCmd >= 0)
      keepComments = true;

    // get rid of comments
    if (!keepComments) {
      // hack for comments using '*' instead of ';'
      const comment1 = t.text.indexOf('/*'); 
      if (comment1 >= 0) {
        t.text = t.text.replace("/*", ";;");
      }
      const comment2 = t.text.indexOf('*');
      if (comment2 >= 0 && ((t.text[comment2+1] == ' ') || (t.text[comment2+1] == '\t'))) {
        t.text = t.text.replace("*", ";");
      } else if (comment2 == 0) {
        t.text = t.text.replace("*", ";");
      }
      const comment = t.text.indexOf(';');
      if (comment >= 0)
        len = comment;
    }

    while ((len > 0) && ((t.text[len - 1] == '\r')||(t.text[len - 1] == '\n')||(t.text[len - 1] == '\t')))
      len--;

    if (len <= 0) {
      t.filtered = "";
      return;
    }
    t.filtered = t.text.substring(0, len);
    t.updateLabelStatus();
    let upperCase = true;
    if (t.isLabel)
      upperCase = false;
    if (t.filtered.indexOf('>JS') >= 0)
      upperCase = false;
    if (upperCase)
      t.filtered = t.filtered.toUpperCase();
    t.filtered = t.filtered.replace('(PC)', '');
    t.filtered = t.filtered.replace('(SP)', '(A7)');
    t.filtered = t.filtered.trim();
  }


  // update this.isLabel and return the index of the last character of the label's name
  updateLabelStatus(_allowMacros = false) {
    let t = this;
    if (!_allowMacros) {
      if (t.isMacroDef) {
        t.isLabel = false;
        return -1;
      }  
    }

    let saveOfs = t.ofs;
    const wrd1 = t.readNextWord();
    const wrd2 = t.readNextWord();
    t.ofs = saveOfs;
    if (wrd2 == "EQU" || wrd2 == "=") {
      t.isLabel = false;
      return -1;
    }

    if ((t.endLabelIndex > -100) && (!t.isLabel))
      return -1;

    t.endLabelIndex = -1;


    t.isLabel = false;
    const f = t.filtered.toUpperCase();
    const l = f.length;
    // use "text" instead of "filtered" to check for a space as first character (resists the "trim")
    if ((l == 0) || (t.text[0] == ' ') || (t.text[0] == '\t') || (f[0] == ';'))
      return -1;

    if (t.isReservedName(f))
      return -1;

    t.isLabel = true;
    let ret = 0;
    while (ret < l) {
      t.endLabelIndex = ret;
      switch (f[ret]) {
        case ' ':
        case '\n':
        case '\r':
        case '\t':
          return ret;
      }
      ret++;
    } 
    return ret;
  }

  getFileLineStr() {
    let t = this;
    if (t.fromMacro)
      return "from macro: " + t.fromMacro.name + ", inferred from " + t.fromMacro.fileLine;
    return "file: " + t.path + ", line " + (t.line + 1).toString();
  }

  updateImmunityflag() {
    if (this.text.includes("M68KWB_NOERROR"))
      this.isErrorImmune = true;
    else
      this.isErrorImmune = false;
  }

  getFailString(_err) {
    let t = this;
    CODERPARSER_SINGLETON.stopGlobalCompilation = true;
    t.parsingOK = false;
    let ret = t.getFileLineStr();
    if (_err)
      ret += "<br>" + _err;
    ret += "<br>instr: " + t.filtered;
    return ret;
  }

  isReservedName(f) {
    const words = [
      'RS.B',4,
      'RS.W',4,
      'RS.L',4,
      'SET',3,
      'EQU',3,
      '=',1,
      'MACRO',5,
      'ENDM',4,
      'REPT',4,
      'ENDR',4,
      'REPTN',5,
      'IFEQ',4,
      'IFNE',4,
      'IFD',3,
      'IFND',4,
      'ENDC',4,
      'ELSE',4,
      'ENDIF',5
      ];
    let t = this;
    let keyword = -1;
    let klen = 0;
    let foundWord = null;
    for (let i = 0; i < words.length; i += 2) {
      keyword = f.indexOf(words[i]);
      if (keyword >= 0) {
        foundWord = words[i];
        klen = words[i+1];
        let spaceBefore = true;
        let spaceAfter = true;
        if (keyword > 0) {
          if ((f[keyword-1] != ' ') && (f[keyword-1] != '\t'))
            spaceBefore = false;
        }
        if (keyword+klen < f.length) {
          if ((f[keyword+klen] != ' ') && (f[keyword+klen] != '\t'))
          spaceAfter = false;
        }
        if (spaceBefore && spaceAfter) // did we find one of the forbidden words for labels?
          return true;
      }
    }
    return false;
  }


  getWarningString(_msg) {
    let t = this;
    let ret = t.getFileLineStr() + " : - warning - ";
    if (_msg)
      ret += _msg;
    ret += " (" + t.filtered + " )";
    return ret;
  }
  

  Failed(_err) {
    let t = this;
    t.parsingOK = false;
    CODERPARSER_SINGLETON.stopGlobalCompilation = true;
    if (CODERPARSER_SINGLETON.errors.length == 0)
      CODERPARSER_SINGLETON.push_error(t.getFileLineStr() + " :<br>" + _err + "<br>" + t.filtered + "<br>");
    CODERPARSER_SINGLETON.Error(t.getFileLineStr() + " :<br>" + _err + "<br>" + t.filtered + "<br>");
  }

  applyFailBhv(_failBhv, _err, _originalOfs) {
    let t = this;
    switch (_failBhv) {
      case null: break;
      case PARSE_FAIL_OK: break;
      case PARSE_FAIL_ERROR: t.Failed(_err);
      case PARSE_FAIL_REWIND: t.ofs = _originalOfs; break;
    }
  }

  skipNextComa() {
    let t = this;
    t.findNextComa();
    t.skipSpaces();
    if (t.ofs < t.filtered.length) {
      if (t.filtered[t.ofs] == ',')
        t.ofs++;
      t.skipSpaces();
    }
  }

  findNextComa(_failBhv) {
    let t = this;
    const saveOfs = t.ofs;
    const len = t.filtered.length;
    while (t.ofs < len) {
      if (t.filtered[t.ofs] == ',')
        return;
      t.ofs++;
    }
    t.applyFailBhv(_failBhv, "failed looking for ',' ", saveOfs);
  }


  isRegisterName(_str,_index) {
    if (_index+1 >= _str.length)
      return false;
      switch (_str[_index]) {
        case 'A':
        case 'D':
        case 'a':
        case 'd':
        break;
        default: return false;
      }
      switch (_str[_index+1]) {
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        return true;
        default: return false;
      }
  }

  isConstantSeparator(_c) {
    let t = this;
    switch (_c) {
      case ' ':
      case '\t':
      case '\r':
      case '\n':
      case '*':
      case '/':
      case '+':
      case '-':
      case '(':
      case ')':
      case '<':
      case '>':
      case '!':
      case '?':
      case '&':
      case '~':
      case '=':
      case '|':
      case '"':
      case "'":
      case '^':
      case null:
      return true;

      default:
      return false;
    }
  }

  replaceFullWordByValue(_e, _w, _v) {
    let t = this;
    let watchDog = 0;
    while (watchDog < 1000) { // loop in case the same constant is used multiple times in a same expression
      watchDog++;
      let i = _e.indexOf(_w);

      if (i < 0)
        return _e;
  
      // check characters before
      if (i > 0) {
        if (!t.isConstantSeparator(_e[i-1]))
          return _e;
      }
  
      // check characters after
      i += _w.length;
      if (i < _e.length) {
        if (!t.isConstantSeparator(_e[i]))
          return _e;
      }
  
      _e =  _e.replace(_w, _v);  
    }
    console.error("replaceFullWordByValue hit watchdog");
    return _e;
  }

  parseJSNumber(_str = null, _ofs = NaN, _tryLabels = true) {
    let t = this;
    let fromStr = t.filtered;
    let fromOfs = t.ofs;

    if (_str)
      fromStr = _str;

    if (!isNaN(_ofs))
      fromOfs = _ofs;

    const len = fromStr.length;
    
    let exprStr = fromStr.slice(fromOfs, len);
    t.skipSpaces();

    // if a coma is found, stop right before it
    const coma = exprStr.indexOf(',');
    if (coma >= 0)
      exprStr = exprStr.substring(0, coma);

    // if a ( followed by a register is found, stop right before it
    const parenthesis = exprStr.indexOf('(');
    if (parenthesis >= 0) {
      if (t.isRegisterName(exprStr, parenthesis+1))
        exprStr = exprStr.substring(0, parenthesis);
    }

    t.lastFoundNumberIndex = exprStr.length;

      // convert from asm to js conventions
    exprStr = exprStr.replaceAll('$-', '-0x');
    exprStr = exprStr.replaceAll('%-', '-0b');
    exprStr = exprStr.replaceAll('$', '0x');
    exprStr = exprStr.replaceAll('%', '0b');
    exprStr = exprStr.replaceAll('#', ' ');
    exprStr = exprStr.replaceAll('!', '|');
    if (exprStr[exprStr.length-1] == 'W' && exprStr[exprStr.length-2] == '.') { // handle move.l a0,$70.w
      exprStr = exprStr.substring(0, exprStr.length-2);
    }



    // replace any constant by its value
    for (let i = 0; i < CODERPARSER_SINGLETON.constants.length; i++) {
      exprStr = t.replaceFullWordByValue(exprStr, CODERPARSER_SINGLETON.constants[i].name, CODERPARSER_SINGLETON.constants[i].value.toString());
      exprStr = t.replaceFullWordByValue(exprStr, CODERPARSER_SINGLETON.constants[i].name.toUpperCase(), CODERPARSER_SINGLETON.constants[i].value.toString());
    }
    for (let i = 0; i < MACHINE.constants.length; i++) {
      exprStr = t.replaceFullWordByValue(exprStr, MACHINE.constants[i].name, MACHINE.constants[i].value.toString());
      exprStr = t.replaceFullWordByValue(exprStr, MACHINE.constants[i].name.toUpperCase(), MACHINE.constants[i].value.toString());
    }

    if (_tryLabels) {
      // replace any label by its data address
      for (let i = 0; i < CODERPARSER_SINGLETON.labels.length; i++) {
        if (CODERPARSER_SINGLETON.labels[i].dcData != null) {
          exprStr = t.replaceFullWordByValue(exprStr, CODERPARSER_SINGLETON.labels[i].label, CODERPARSER_SINGLETON.labels[i].dcData.toString());
          exprStr = t.replaceFullWordByValue(exprStr, CODERPARSER_SINGLETON.labels[i].label.toUpperCase(), CODERPARSER_SINGLETON.labels[i].dcData.toString());
        } else if (PARSEJSNUMBER_ALLOWDCDATA) {
          const csofs = CODERPARSER_SINGLETON.labels[i].codeSectionOfs;
          if (csofs) {
            const csstr = csofs.toString();
            exprStr = t.replaceFullWordByValue(exprStr, CODERPARSER_SINGLETON.labels[i].label, csstr);
            exprStr = t.replaceFullWordByValue(exprStr, CODERPARSER_SINGLETON.labels[i].label.toUpperCase(), csstr);
          }
        }
      }
    }

    // replace any SET by its value
    for (let i = 0; i < CODERPARSER_SINGLETON.set.length; i++) {
      const set = CODERPARSER_SINGLETON.set[i];
      for (let k = set.values.length - 1; k >= 0; k--) {
        if (set.values[k].line <= t.finalLine) {
          exprStr = t.replaceFullWordByValue(exprStr, set.name, set.values[k].value);
          break;
        }
      }
    }


    // replace all quoted characters by their ascii code
    let eofs = 0;
    let elen = exprStr.length;
    while (eofs + 2 < elen) {
      const c = exprStr[eofs];
      if (c == "'") {
        if (exprStr[eofs + 2] == "'") {
          const val = exprStr.charCodeAt(eofs + 1);
          const cent = Math.floor(val / 100);
          const dix = Math.floor(Math.floor(val % 100) / 10);
          const unit = Math.floor(val % 10);
          if (cent > 0) exprStr = strReplaceAt(exprStr, eofs, cent.toString());
          else exprStr = strReplaceAt(exprStr, eofs, ' ');
          if ((dix > 0) || (cent > 0)) exprStr = strReplaceAt(exprStr, eofs + 1, dix.toString());
          else exprStr = strReplaceAt(exprStr, eofs + 1, ' ');
          exprStr = strReplaceAt(exprStr, eofs + 2, unit.toString());
          eofs += 2;
        }
      }
      eofs++;
    }

    //warn in case of spaces
    if ((ASSEMBLER_CONFIG.no_space_after_operator) && (!this.isDC)) {
      elen = exprStr.length;
      for (let i = 0; i < elen; i++) {
        const c = exprStr[i];
        let forbidSpace = false;
        switch(c) {
          case  '+':
          case  '-':
          case  '*':
          case  '/':
          case  '>>':
          case  '<<':
          case  '&':
          case  '|':
          case  '^':
          case  '~':
              forbidSpace = true;
          break;
        }
        if (forbidSpace) {
          if (i > 0) {
            const c2 = exprStr[i-1];
            if (c2 == ' ' || c2 == '\t') {
              this.Failed("vasm won't like spaces before operator '" + c + "'");
              debugger;
            }
          }
          if (i < elen-1) {
            const c2 = exprStr[i+1];
            if (c2 == ' ' || c2 == '\t') {
              this.Failed("vasm won't like spaces after operator '" + c + "'");
            }
          }
        }
      }  
    }

    // now we can let js evaluate the expression
    let expr = NaN;
    try {
      expr = eval(exprStr);
    //  console.log("parseJSNumber succeeded parsing: " + fromStr + ", resolved to: " + exprStr + ", obtained: " + expr);
    } catch (error) {
    //  console.log("parseJSNumber failed parsing: " + fromStr + ", resolved to: " + exprStr);
      expr = NaN;
    }
    return expr;
  }

  
  readNextNumber(_failBhv) {
    let t = this;
    t.lastFoundNumberIndex = NaN;
    const saveOfs = t.ofs;
    let jsnum = t.parseJSNumber();
    if (!isNaN(jsnum))
      return jsnum;

    t.applyFailBhv(_failBhv, "wrong number ", t.ofs);
    return NaN;
    /* this code proved to ignore errors when the user is suing a combination of valid and invalid defines
    e.g: move.w d0,undefined+4(a0) ==> will transform undefined+4 to just 4.
  t.ofs = saveOfs;

    let s = '';
    let base = 10;
    let sign = 1;
    t.skipSpaces();
    t.lastFoundNumberIndex = t.ofs;
    const c = t.filtered[t.ofs];
    if (c == '$') {
      base = 16;
      t.ofs++;
    }
    else if (c == '%') {
      base = 2;
      t.ofs++;
    }
    const len = t.filtered.length;
    while (t.ofs < len) {
      const c = t.filtered[t.ofs];
      switch (c) {
        case '-': sign = -1; break;
        case '(':
        case ')':
        case ',':
        case ' ':
        case '\t':
        case '\r':
        case ',':
          if (s.length > 0)
            return Math.floor(parseInt(s, base) * sign);
          else
            return NaN;
        case 'A':
        case 'B':
        case 'C':
        case 'D':
        case 'E':
        case 'F':
          if (base == 16)
            s += c;
          else {
            t.applyFailBhv(_failBhv, "wrong number ", saveOfs);
            return NaN;
          }
          break;
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          if (base >= 10)
            s += c;
          else {
            t.applyFailBhv(_failBhv, "wrong number ", saveOfs);
            return NaN;
          }
          break;
        case '0':
        case '1':
          s += c;
          break;
        default:
          t.applyFailBhv(_failBhv, "wrong number ", saveOfs);
          return NaN;
          break;
      }
      t.ofs++;
    }
    let ret = parseInt(s, base);
    if (isNaN(ret))
      t.applyFailBhv(_failBhv, "wrong number ", saveOfs);
    return Math.floor(ret * sign);
    */
  }

  readArg() {
    let ret = "";
    let insideParenthesis = 0;
    let t = this;
    const len = t.filtered.length;
    while (t.ofs < len) {
      const c = t.filtered[t.ofs];
      if (c == '(') {
       // if (insideParenthesis) { t.Failed("readArg failed, found multiple opening parenthesis"); return; }
        insideParenthesis++;
      } else if (c == ')') {
        if (insideParenthesis <= 0) { 
          t.Failed("readArg failed, closing parenthesis found with no matching opening parenthesis"); 
          return "READARG-ERROR";
        }
        insideParenthesis--;
      } else if (isSpace(c)) {
        t.ofs++;
        continue;
      } else if (c == ',') {
        if (insideParenthesis == 0) {
          if (ASSEMBLER_CONFIG.no_space_after_coma) {
            const nextC = t.filtered[t.ofs+1];
            if ((nextC == ' ') || (nextC == '\t')) {
              t.Failed("you should avoid spaces or tabs after the ',' separating arguments. This is generally not supported by assemblers"); 
              return "READARG-ERROR";          
            }    
          }
          return ret;
        }
      }
      ret += c;
      t.ofs++;
    }
    return ret;
  }

  isSpace(_t) {
    if (!_t) return true;
    if (_t.length < 1) return true;
    if (_t.length > 1) { main_Alert("function 'isSpace' expects a single character input"); return true; }
    if (_t == ' ') return true;
    if (_t == '\t') return true;
    if (_t == '\n') return true;
    if (_t == '\r') return true;
    return false;
  }

  isStricltySpace(_t) {
    if (_t == ' ') return true;
    if (_t == '\t') return true;
    return false;
  }


  skipSpaces() {
    let t = this;
    const len = t.filtered.length;
    while (t.ofs < len) {
      if (!isSpace(t.filtered[t.ofs]))
        return;
      t.ofs++;
    }
  }

  readUntilSpace() {
    let t = this;
    const len = t.filtered.length;
    let ret = "";
    while (t.ofs < len) {
      const c = t.filtered[t.ofs];
      if (isSpace(c))
        return ret;
      ret += c;
      t.ofs++;
    }
    return ret;
  }

  readNextWord(_stopAt = null) {
    let t = this;
    const len = t.filtered.length;
    let ret = "";
    t.skipSpaces();
    let exit = false;
    while (t.ofs < len) {
      const c = t.filtered[t.ofs];

      if (isSpace(c)) break;
      if (_stopAt) {
        for (let i = 0; i < _stopAt.length; i++) {
          if (c == _stopAt[i]) {
            exit = true;
            break;
          }
        }
        if (exit) {
          t.ofs--;
          break;
        }
      }
      ret += c;
      t.ofs++;
    }
    t.skipSpaces();
    return ret;
  }

  readNextWordBetweenQuotes() {
    let t = this;
    const len = t.filtered.length;
    let ret = "";
    t.skipSpaces();
    let inside = false;
    while (t.ofs < len) {
      const c = t.filtered[t.ofs];
      if ((c == '"') || (c == "'")) {
        if (inside)
          break;
        inside = true;
      } else {
        if (inside) {
          if (!isSpace(c))
            ret += c;
        }
      }
      t.ofs++;
    }
    t.skipSpaces();
    return ret;
  }

  makeComment() {
    let t = this;
    t.filtered = "; ==> " + t.filtered;
    t.text = "; ==> " + t.text;
    t.isInstr = false;
    t.isLabel = false;
  }

  readDx() {
    let t = this;
    const instr = t.readNextWord(['.']);
    const filtLen = t.filtered.length;
    if ((t.ofs + 2 < filtLen) && (t.filtered[t.ofs + 1] == '.') && ((instr == 'DC') || (instr == 'DS')|| (instr == 'DCB') || (instr == 'BLK'))) {
      t.instr = instr;
      switch (t.filtered[t.ofs + 2]) {
        case 'B': t.instrSize = 1; break;
        case 'W': t.instrSize = 2; break;
        case 'L': t.instrSize = 4; break;
        default: t.Failed("expected 'B', 'W' or 'L' after '.'"); break;
      }
      t.isInstr = false;
      t.ofs += 3;
      t.isDS = false;
      t.isDC = false;
      t.isDCB = false;
      switch (t.instr) {
        case 'DC' : t.isDC = true; break;
        case 'DS' : t.isDS = true; break;
        case 'DCB' : t.isDCB = true; break;
        case 'BLK' : t.isDCB = true; break;
      }
      return true;
    }
    return false;
  }

  
  collectArgs(_lastPass = false) {
    let ln = this;
    const filtLen = ln.filtered.length;
    ln.DxArgs = [];
    ln.DxArgsOfs = ln.ofs;
    while (ln.ofs < filtLen) {
      let whileIterOfs = ln.ofs;
      let numberAdded = false;
      const found = ln.readNextNumber(PARSE_FAIL_OK);
      if (!isNaN(found)) { // it's a number
        if (ln.instr == 'DC') {
          let failMsg = checkNumberSize(Math.floor(found), ln.instrSize);
          if (failMsg != null) {
            ln.Failed("number exceeds instr size: " + Math.floor(found) + ". reason: " + failMsg);
            return false;              
          }  
        }
        ln.DxArgs.push({v:Math.floor(found),dbg:Math.floor(found)});
        numberAdded = true;
      } else { // cant read number, maybe it's a string
        if (ln.instrSize == 1) { // strings can only be dc.b
          let strchar = null;
          if (ln.filtered[ln.ofs] == '"') strchar = '"';
          else if (ln.filtered[ln.ofs] == "'") strchar = "'";
          if (strchar) {
            ln.ofs++;
            while ((ln.ofs < filtLen) && (ln.filtered[ln.ofs] != strchar)) {
              ln.hideDxArgsDbg = true;
              ln.DxArgs.push({v:ln.filtered.charCodeAt(ln.ofs),dbg:undefined});
              numberAdded = true;
              ln.ofs++;
            }
            if (ln.filtered[ln.ofs] == strchar) ln.ofs++;
          }
        }
      }
      if (!numberAdded) {
        if ((_lastPass) && (ln.instr == 'DC')) {
          PARSEJSNUMBER_ALLOWDCDATA = true;
          const found = ln.readNextNumber(PARSE_FAIL_OK);
          PARSEJSNUMBER_ALLOWDCDATA = false;
          if (!isNaN(found)) { // it's a number
            let failMsg = checkNumberSize(Math.floor(found), ln.instrSize);
            if (failMsg != null) {
              ln.Failed("number exceeds instr size: " + Math.floor(found) + ". reason: " + failMsg);
              return false;              
            } 
            ln.DxArgs.push({v:Math.floor(found),dbg:Math.floor(found)});
            numberAdded = true; 
          }
        }
        if (!numberAdded) ln.DxArgs.push({v:NaN,dbg:undefined});
      }
      ln.skipNextComa();
      if (ln.ofs == whileIterOfs) ln.ofs++; // avoid being stuck in an infinite loop
    }

  }


  warn(_msg) {
    showHTMLError(this.getWarningString(_msg));
  }

  getArgDispSize(_d) {
    if (_d >= -128 && _d <= 127) return 8;
    if (_d >= -32768 && _d <= 32767) return 16;
    return 32;
  }

  getArgAdrsSize(_a) {
    if (!_a ||  _a == 0) {
        this.warn("getArgAdrsSize: null adrress");
        return 0;
    }
    if (_a < 0) {
        this.warn("getArgAdrsSize: adrress is negative");
        return 0;
    }
    if (_a < 65536) return 16;
    return 32;
  }

  checkCycleValue(_v) {
    if (_v < 0) {
        this.warn("unsupported case, bug in cycles tables");
        return 0;
    }
    return _v;
  }

  getArgCycles(
    _a, 
    reg_data,               // Dn
    reg_adrs,               // An
    indirect,               // (A)
    indirect_postIncr,      // (A)+
    indirect_predecr,       // -(A)
    indirect_disp1,         // $(A)
    indirect_disp2,         // I(A)
    adrs_w,                 // .W
    adrs_l,                 // .L
    pcrel_1,                // $(P)
    pcrel_2,                // I(P)
    immediate               // #
    ) {
    let t = this;
    switch(_a.type) {
        case 'reg':
            if (_a.tab == regs.d) return t.checkCycleValue(reg_data);
            if (_a.tab == regs.a) return t.checkCycleValue(reg_adrs);
            t.warn("can't compute cycles: wrong register type");
        break;
        case 'ind':
            if (_a.predecrement) return t.checkCycleValue(indirect_predecr);
            if (_a.postincrement) return t.checkCycleValue(indirect_postIncr);
            if (_a.disp) {
                if (_a.indReg) return t.checkCycleValue(indirect_disp2);
                return t.checkCycleValue(indirect_disp1);
            }
            return t.checkCycleValue(indirect);
        case 'labl': {
            if (!isNaN(_a.isLabelIndex)) { // label (memory address)
                const l = CODERPARSER_SINGLETON.labels[_a.isLabelIndex];
                let adrs = l.dcData;
                if (adrs == null) { // no data: it's a code label
                    adrs = l.codeSectionOfs;
                }
                if (t.getArgAdrsSize(_a.value) < 32) return t.checkCycleValue(adrs_w);
                return t.checkCycleValue(adrs_l);
            }
            t.warn("can't compute cycles: label has no address");
        }            
        case 'adrs':
            if (t.getArgAdrsSize(_a.value) < 32) return t.checkCycleValue(adrs_w);
            return t.checkCycleValue(adrs_l);
        case 'imm': return t.checkCycleValue(immediate);
        default:
          t.warn("can't compute cycles: unhandled addressing type");
        return 0;
    }
    return 0;
  }

  isDReg(_a) {
    return ((_a.type == 'reg') && (_a.tab == regs.d));
  }

  isAReg(_a) {
    return ((_a.type == 'reg') && (_a.tab == regs.a));
  }

  updateShiftCycles(c) {
    let t = this;
    if (c < 0) {
      c = 1;
      if (t.arg1.type == 'imm') c = t.arg1.value;  
    }
    c--;
    c *= 2;            
    if (t.instrSize == 4) c += 4;
    t.cycles = t.getArgCycles(t.arg2,  8+c,-1, 12+c, 12+c, 16+c, 16+c, 20+c, 16+c, 20+c, -1, -1,-1);
    // Name                : Dn   An  (A)  (A)+ -(A) $(A) I(A)  .W   .L  $(P) I(P)  #
    // asl.w #1,*             8   -1   12   12   16   16   20   16   20
  }

  SetInstrCycles() {
    let t = this;
    let cycles = 0;
    switch (t.instr) {
        case 'ADD':
        case 'ADDI':
        case 'ADDA': {
            if (t.instrSize < 4) {
              if (t.isDReg(t.arg2))       { cycles = t.getArgCycles(t.arg1,  4,  4,  8,  8, 12, 12, 16, 12, 16, 12, 16,  8); break; }
              if (t.isDReg(t.arg1))       { cycles = t.getArgCycles(t.arg2,  4,  8, 12, 12, 16, 16, 20, 16, 20, -1, -1, -1); break; }
              if (t.isAReg(t.arg2))       { cycles = t.getArgCycles(t.arg1,  8,  8, 12, 12, 16, 16, 20, 16, 20, 16, 20, 12); break; }
              if (t.arg1.type == 'imm')   { cycles = t.getArgCycles(t.arg2,  8,  8, 16, 16, 20, 20, 24, 20, 24, -1, -1, -1); break; }
              // Name                : Dn   An  (A)  (A)+ -(A) $(A) I(A)  .W   .L  $(P) I(P)  #
              // add.w *,d0             4    4    8    8   12   12   16   12   16   12   16    8
              // add.w d0,*             4    8   12   12   16   16   20   16   20
              // adda.w *,a1            8    8   12   12   16   16   20   16   20   16   20   12
              // add.w #1,*             8    8   16   16   20   20   24   20   24
            } else {
              if (t.isDReg(t.arg2))       { cycles = t.getArgCycles(t.arg1,  8,  8, 16, 16, 20, 20, 24, 20, 24, 20, 24, 16); break; }
              if (t.isDReg(t.arg1))       { cycles = t.getArgCycles(t.arg2,  8,  8, 20, 20, 24, 24, 28, 24, 28, -1, -1, -1); break; }
              if (t.isAReg(t.arg2))       { cycles = t.getArgCycles(t.arg1,  8,  8, 16, 16, 20, 20, 24, 20, 24, 20, 24, 16); break; }
              if (t.arg1.type == 'imm')   { cycles = t.getArgCycles(t.arg2, 16, 16, 28, 28, 32, 32, 36, 32, 36, -1, -1, -1); break; }
              // Name                : Dn   An  (A)  (A)+ -(A) $(A) I(A)  .W   .L  $(P) I(P)  #
              // add.l *,d0             8    8   16   16   20   20   24   20   24   20   24   16
              // add.l d0,*             8    8   20   20   24   24   28   24   28
              // adda.l *,a1            8    8   16   16   20   20   24   20   24   20   24   16
              // add.l #1,*            16    16  28   28   32   32   36   32   36
            }
        }
        break;
        case 'ADDQ':
          if (t.instrSize < 4)      { cycles = t.getArgCycles(t.arg2,  4,  8, 12, 12, 16, 16, 20, 16, 20, -1, -1, -1); break; }
          else                      { cycles = t.getArgCycles(t.arg2,  8,  8, 20, 20, 24, 24, 28, 24, 28, -1, -1, -1); break; }
          // Name                : Dn   An  (A)  (A)+ -(A) $(A) I(A)  .W   .L  $(P) I(P)  #
          // addq.w #1,*            4    8   12   12   16   16   20   16   20
          // addq.l #1,*            8    8   20   20   24   24   28   24   28
        case 'ADDX':
          if (t.instrSize < 4)      { cycles = t.getArgCycles(t.arg1,  4, -1, -1, -1, 20, -1, -1, -1, -1, -1, -1, -1); break; }
          else                      { cycles = t.getArgCycles(t.arg1,  8, -1, -1, -1, 32, -1, -1, -1, -1, -1, -1, -1); break; }
          // Name                : Dn   An  (A)  (A)+ -(A) $(A) I(A)  .W   .L  $(P) I(P)  #
          // addx.w *,*             4                  20
          // addx.l *,*             8                  32
        case 'AND':
        case 'ANDI':
          if (t.instrSize < 4) {
            if (t.isDReg(t.arg2))     { cycles = t.getArgCycles(t.arg1,  4, -1,  8,  8, 12, 12, 16, 12, 16, 12, 16,  8); break; }
            if (t.isDReg(t.arg1))     { cycles = t.getArgCycles(t.arg2,  4, -1, 12, 12, 16, 16, 20, 16, 20, -1, -1, -1); break; }
            if (t.arg1.type == 'imm') { cycles = t.getArgCycles(t.arg2,  8, -1, 16, 16, 20, 20, 24, 20, 24, -1, -1, -1); break; }
            // Name                : Dn   An  (A)  (A)+ -(A) $(A) I(A)  .W   .L  $(P) I(P)  #
            // and.w *,d0             4   -1   8    8   12   12   16   12   16   12   16    8
            // and.w d0,*             4   -1  12   12   16   16   20   16   20
            // and.w #1,*             8   -1  16   16   20   20   24   20   24
          } else { 
            if (t.isDReg(t.arg2))     { cycles = t.getArgCycles(t.arg1,  8, -1, 16, 16, 20, 20, 24, 20, 24, 20, 24, 16); break; }
            if (t.isDReg(t.arg1))     { cycles = t.getArgCycles(t.arg2,  8, -1, 20, 20, 24, 24, 28, 24, 28, -1, -1, -1); break; }
            if (t.arg1.type == 'imm') { cycles = t.getArgCycles(t.arg2,  16,-1, 28, 28, 32, 32, 36, 32, 36, -1, -1, -1); break; }
            // Name                : Dn   An  (A)  (A)+ -(A) $(A) I(A)  .W   .L  $(P) I(P)  #
            // and.l *,d0             8   -1   16   16   20   20   24   20   24   20   24   16
            // and.l d0,*             8   -1   20   20   24   24   28   24   28
            // and.l #1,*            16   -1   28   28   32   32   36   32   36
          }
        break;
        case 'CLR':
          if (t.instrSize < 4)      { cycles = t.getArgCycles(t.arg1,  4, -1, 12, 12, 16, 16, 20, 16, 20, -1, -1, -1); break; }
          else                      { cycles = t.getArgCycles(t.arg1,  8, -1, 20, 20, 24, 24, 28, 24, 28, -1, -1, -1); break; }
          // Name                : Dn   An  (A)  (A)+ -(A) $(A) I(A)  .W   .L  $(P) I(P)  #
          // clr.w *                4   -1   12   12   16   16   20   16   20
          // clr.l *                8   -1   20   20   24   24   28   24   28
          case 'CMP':
          case 'CMPA':
          case 'CMPI': {
          if (t.instrSize < 4) {
            if (t.isDReg(t.arg2))     { cycles = t.getArgCycles(t.arg1,  4,  4,   8,  8, 12, 12, 16, 12, 16, 12, 16,  8); break; }
            if (t.isAReg(t.arg2))     { cycles = t.getArgCycles(t.arg1,  8,  8,  12, 12, 16, 16, 20, 16, 20, 16, 20, 12); break; }
            if (t.arg1.type == 'imm') { cycles = t.getArgCycles(t.arg2,  8,  12, 12, 12, 16, 16, 20, 16, 20, -1, -1, -1); break; }
            // Name                : Dn   An  (A)  (A)+ -(A) $(A) I(A)  .W   .L  $(P) I(P)  #
            // cmp.w *,d0             4    4    8    8   12   12   16   12   16   12   16    8
            // cmpa.w *,a1            8    8   12   12   16   16   20   16   20   16   20   12
            // cmp.w #1,*             8    12  12   12   16   16   20   16   20
          } else { 
            if (t.isDReg(t.arg2))     { cycles = t.getArgCycles(t.arg1,  8,  8, 16, 16, 20, 20, 24, 20, 24, 20, 24, 16); break; }
            if (t.isAReg(t.arg2))     { cycles = t.getArgCycles(t.arg1,  8,  8, 16, 16, 20, 20, 24, 20, 24, 20, 24, 16); break; }
            if (t.arg1.type == 'imm') { cycles = t.getArgCycles(t.arg2,  16, 16,20, 20, 24, 24, 28, 24, 28, -1, -1, -1); break; }
            // Name                : Dn   An  (A)  (A)+ -(A) $(A) I(A)  .W   .L  $(P) I(P)  #
            // cmp.l *,d0             8    8   16   16   20   20   24   20   24   20   24   16
            // cmpa.l *,a1            8    8   16   16   20   20   24   20   24   20   24   16
            // cmp.l #1,*            16    16  20   20   24   24   28   24   28
          }
        }
        break;
        case 'EOR':
        case 'EORI':
        if (t.instrSize < 4) {
          if (t.isDReg(t.arg1))     { cycles = t.getArgCycles(t.arg2,  4, -1, 12, 12, 16, 16, 20, 16, 20, -1, -1, -1); break; }
          if (t.arg1.type == 'imm') { cycles = t.getArgCycles(t.arg2,  8, -1, 16, 16, 20, 20, 24, 20, 24, -1, -1, -1); break; }
          // Name                : Dn   An  (A)  (A)+ -(A) $(A) I(A)  .W   .L  $(P) I(P)  #
          // eor.w d0,*             4   -1   12   12   16   16   20   16   20
          // eor.w #1,*             8   -1   16   16   20   20   24   20   24
        } else { 
          if (t.isDReg(t.arg1))     { cycles = t.getArgCycles(t.arg2,  8, -1, 20, 20, 24, 24, 28, 24, 28, -1, -1, -1); break; }
          if (t.arg1.type == 'imm') { cycles = t.getArgCycles(t.arg2,  16,-1, 28, 28, 32, 32, 36, 32, 36, -1, -1, -1); break; }
          // Name                : Dn   An  (A)  (A)+ -(A) $(A) I(A)  .W   .L  $(P) I(P)  #
          // eor.l d0,*             8   -1   20   20   24   24   28   24   28
          // eor.l #1,*            16   -1   28   28   32   32   36   32   36
        }
      break;
      case 'MOVE':
      case 'MOVEA': {
        if (t.instrSize < 4) {
          if (t.isDReg(t.arg2))     { cycles = t.getArgCycles(t.arg1,  4,  4,  8,  8, 12, 12, 16, 12, 16, 12, 16,  8); break; }
          if (t.isAReg(t.arg2))     { cycles = t.getArgCycles(t.arg1,  4,  4,  8,  8, 12, 12, 16, 12, 16, 12, 16,  8); break; }
          if (t.arg2.type == 'ind') {
            if (!t.arg2.disp)       { cycles = t.getArgCycles(t.arg1,  8,  8, 12, 12, 16, 16, 20, 16, 20, 16, 20, 12); break; }
            else {
              if (t.arg2.indReg)    { cycles = t.getArgCycles(t.arg1,  16,16, 20, 20, 24, 24, 28, 24, 28, 24, 28, 20); break; }
              else                  { cycles = t.getArgCycles(t.arg1,  12,12, 16, 16, 20, 20, 24, 20, 24, 20, 24, 16); break; }
            }
          }
          if (t.arg2.type == 'adrs') {
            if (t.getArgAdrsSize(t.arg2.value) < 32)
                                    { cycles = t.getArgCycles(t.arg1,  12,12, 16, 16, 20, 20, 24, 20, 24, 20, 24, 16); break; }
            else
                                    { cycles = t.getArgCycles(t.arg1,  16,16, 20, 20, 24, 24, 28, 24, 28, 24, 28, 20); break; }
          }
          if (t.arg2.type == 'labl') {
            if (!isNaN(t.arg2.isLabelIndex)) { // label (memory address)
              const l = CODERPARSER_SINGLETON.labels[t.arg2.isLabelIndex];
              let adrs = l.dcData;
              if (adrs == null) { // no data: it's a code label
                  adrs = l.codeSectionOfs;
              }
              if (t.getArgAdrsSize(adrs) < 32)
                { cycles = t.getArgCycles(t.arg1,  12,12, 16, 16, 20, 20, 24, 20, 24, 20, 24, 16); break; }
              else
                { cycles = t.getArgCycles(t.arg1,  16,16, 20, 20, 24, 24, 28, 24, 28, 24, 28, 20); break; }
            }
          }
          // Name                : Dn   An  (A)  (A)+ -(A) $(A) I(A)  .W   .L  $(P) I(P)  #
          // move.w *,d0            4    4    8    8   12   12   16   12   16   12   16    8
          // move.w *,a1            4    4    8    8   12   12   16   12   16   12   16    8
          // move.w *,-(a1)+        8    8   12   12   16   16   20   16   20   16   20   12
          // move.w *,24(a1)       12   12   16   16   20   20   24   20   24   20   24   16
          // move.w *,20(a1,d0.w)  16   16   20   20   24   24   28   24   28   24   28   20
          // move.w *,$200.w       12   12   16   16   20   20   24   20   24   20   24   16
          // move.w *,scratchpad   16   16   20   20   24   24   28   24   28   24   28   20
        } else { 
          if (t.isDReg(t.arg2))     { cycles = t.getArgCycles(t.arg1,  4,  4, 12, 12, 16, 16, 20, 16, 20, 16, 20, 12); break; }
          if (t.isAReg(t.arg2))     { cycles = t.getArgCycles(t.arg1,  4,  4, 12, 12, 16, 16, 20, 16, 20, 16, 20, 12); break; }
          if (t.arg2.type == 'ind') {
            if (!t.arg2.disp)       { cycles = t.getArgCycles(t.arg1,  12, 12, 20, 20, 24, 24, 28, 24, 28, 24, 28, 20); break; }
            else {
              if (t.arg2.indReg)    { cycles = t.getArgCycles(t.arg1,  20,20, 28, 28, 32, 32, 36, 32, 36, 32, 36, 28); break; }
              else                  { cycles = t.getArgCycles(t.arg1,  16,16, 24, 24, 28, 28, 32, 28, 32, 28, 32, 24); break; }
            }
          }
          if (t.arg2.type == 'adrs') {
            if (t.getArgAdrsSize(t.arg2.value) < 32)
                                    { cycles = t.getArgCycles(t.arg1,  20,20, 28, 28, 32, 32, 36, 32, 36, 32, 36, 28); break; }
            else
                                    { cycles = t.getArgCycles(t.arg1,  20,20, 28, 28, 32, 32, 36, 32, 36, 32, 36, 28); break; }
          }
          if (t.arg2.type == 'labl') {
            if (!isNaN(t.arg2.isLabelIndex)) { // label (memory address)
              const l = CODERPARSER_SINGLETON.labels[t.arg2.isLabelIndex];
              let adrs = l.dcData;
              if (adrs == null) { // no data: it's a code label
                  adrs = l.codeSectionOfs;
              }
              if (t.getArgAdrsSize(adrs) < 32)
                { cycles = t.getArgCycles(t.arg1,  20,20, 28, 28, 32, 32, 36, 32, 36, 32, 36, 28); break; }
              else
                { cycles = t.getArgCycles(t.arg1,  20,20, 28, 28, 32, 32, 36, 32, 36, 32, 36, 28); break; }
            }
          }
          // Name                : Dn   An  (A)  (A)+ -(A) $(A) I(A)  .W   .L  $(P) I(P)  #
          // move.l *,d0            4    4   12   12   16   16   20   16   20   16   20   12
          // move.l *,a1            4    4   12   12   16   16   20   16   20   16   20   12
          // move.l *,-(a1)+       12   12   20   20   24   24   28   24   28   24   28   20
          // move.l *,24(a1)       16   16   24   24   28   28   32   28   32   28   32   24
          // move.l *,20(a1,d0.l)  20   20   28   28   32   32   36   32   36   32   36   28
          // move.l *,$200.l       20   20   28   28   32   32   36   32   36   32   36   28
          // move.l *,scratchpad   20   20   28   28   32   32   36   32   36   32   36   28
        }
      }
      break;
      
      case "MOVEM": {
        if (l.arg1.movem && l.arg1.movem.length > 0) { // regs to mem
          let n = l.arg1.movem.length;
          if (t.instrSize < 4) {
          cycles = t.getArgCycles(t.arg2,  -1,  -1, 8+4*n, -1, 8+4*n, 12+4*n, 14+4*n, 12+4*n, 16+4*n, -1, -1, -1);
            break;
          } else {
            cycles = t.getArgCycles(t.arg2,  -1,-1, 8+8*n, -1, 8+8*n, 12+8*n, 14+8*n, 12+8*n, 16+8*n, -1, -1, -1);
            break;
          }
        } else { // mem to regs
          let n = l.arg2.movem.length;
          if (t.instrSize < 4) {
            cycles = t.getArgCycles(t.arg1,  -1,-1, 12+4*n, -1, 12+4*n, 16+4*n, 18+4*n, 16+4*n, 20+4*n, -1, -1, -1);
            break;
          } else {
            cycles = t.getArgCycles(t.arg1,  -1,-1, 12+8*n, -1, 12+8*n, 16+8*n, 18+8*n, 16+8*n, 20+8*n, -1, -1, -1);
            break;            
          }
        }
      }
      break;
      case 'MOVEP':
        if (t.instrSize < 4) cycles = 16;
        else cycles = 24;
      break;

      case 'NEG':
      case 'NEGX':
        if (t.instrSize < 4) {
          cycles = t.getArgCycles(t.arg1,  4, -1, 12, 12, 16, 16, 20, 16, 20, -1, -1, -1);
          // Name                : Dn   An  (A)  (A)+ -(A) $(A) I(A)  .W   .L  $(P) I(P)  #
          // neg.w *                4   -1   12   12   16   16   20   16   20
          // negx.w *               4   -1   12   12   16   16   20   16   20
        } else { 
          cycles = t.getArgCycles(t.arg1,  8, -1, 20, 20, 24, 24, 28, 24, 28, -1, -1, -1);
          // Name                : Dn   An  (A)  (A)+ -(A) $(A) I(A)  .W   .L  $(P) I(P)  #
          // neg.l *                8   -1   20   20   24   24   28   24   28
          // negx.l *               8   -1   20   20   24   24   28   24   28
                  }
      break;

      case 'NOT':
        if (t.instrSize < 4) {
          cycles = t.getArgCycles(t.arg1,  4, -1, 12, 12, 16, 16, 20, 16, 20, -1, -1, -1);
          // Name                : Dn   An  (A)  (A)+ -(A) $(A) I(A)  .W   .L  $(P) I(P)  #
          // not.w *                4   -1   12   12   16   16   20   16   20
        } else { 
          cycles = t.getArgCycles(t.arg1,  8, -1, 20, 20, 24, 24, 28, 24, 28, -1, -1, -1);
          // Name                : Dn   An  (A)  (A)+ -(A) $(A) I(A)  .W   .L  $(P) I(P)  #
          // not.l *                8   -1   20   20   24   24   28   24   28
        }
      break;

      case 'OR':
      case 'ORI':
          if (t.instrSize < 4) {
            if (t.isDReg(t.arg2))     { cycles = t.getArgCycles(t.arg1,  4, -1,  8,  8, 12, 12, 16, 12, 16, 12, 16,  8); break; }
            if (t.isDReg(t.arg1))     { cycles = t.getArgCycles(t.arg2,  4, -1, 12, 12, 16, 16, 20, 16, 20, -1, -1, -1); break; }
            if (t.arg1.type == 'imm') { cycles = t.getArgCycles(t.arg2,  8, -1, 16, 16, 20, 20, 24, 20, 24, -1, -1, -1); break; }
            // Name                : Dn   An  (A)  (A)+ -(A) $(A) I(A)  .W   .L  $(P) I(P)  #
            // or.w *,d0              4   -1   8    8   12   12   16   12   16   12   16    8
            // or.w d0,*              4   -1   12   12   16   16   20   16   20
            // or.w #1,*              8   -1   16   16   20   20   24   20   24
          } else { 
            if (t.isDReg(t.arg2))     { cycles = t.getArgCycles(t.arg1,  8, -1, 16, 16, 20, 20, 24, 20, 24, 20, 24, 16); break; }
            if (t.isDReg(t.arg1))     { cycles = t.getArgCycles(t.arg2,  8, -1, 20, 20, 24, 24, 28, 24, 28, -1, -1, -1); break; }
            if (t.arg1.type == 'imm') { cycles = t.getArgCycles(t.arg2,  16,-1, 28, 28, 32, 32, 36, 32, 36, -1, -1, -1); break; }
            // Name                : Dn   An  (A)  (A)+ -(A) $(A) I(A)  .W   .L  $(P) I(P)  #
            // or.l *,d0              8   -1   16   16   20   20   24   20   24   20   24   16
            // or.l d0,*              8   -1   20   20   24   24   28   24   28
            // or.l #1,*             16   -1   28   28   32   32   36   32   36
          }        
        break;

        case 'SUB':
        case 'SUBI':
        case 'SUBA':
            if (t.instrSize < 4) {
              if (t.isDReg(t.arg2))       { cycles = t.getArgCycles(t.arg1,  4,  4,  8,  8, 12, 12, 16, 12, 16, 12, 16,  8); break; }
              if (t.isDReg(t.arg1))       { cycles = t.getArgCycles(t.arg2,  4,  8, 12, 12, 16, 16, 20, 16, 20, -1, -1, -1); break; }
              if (t.isAReg(t.arg2))       { cycles = t.getArgCycles(t.arg1,  8,  8, 12, 12, 16, 16, 20, 16, 20, 16, 20, 12); break; }
              if (t.arg1.type == 'imm')   { cycles = t.getArgCycles(t.arg2,  8,  8, 16, 16, 20, 20, 24, 20, 24, -1, -1, -1); break; }
              // Name                : Dn   An  (A)  (A)+ -(A) $(A) I(A)  .W   .L  $(P) I(P)  #
              // sub.w *,d0             4    4    8    8   12   12   16   12   16   12   16    8
              // sub.w d0,*             4    8   12   12   16   16   20   16   20
              // suba.w *,a1            8    8   12   12   16   16   20   16   20   16   20   12
              // sub.w #1,*             8    8   16   16   20   20   24   20   24
              
            } else {
              if (t.isDReg(t.arg2))       { cycles = t.getArgCycles(t.arg1,  8,  8, 16, 16, 20, 20, 24, 20, 24, 20, 24, 16); break; }
              if (t.isDReg(t.arg1))       { cycles = t.getArgCycles(t.arg2,  8,  8, 20, 20, 24, 24, 28, 24, 28, -1, -1, -1); break; }
              if (t.isAReg(t.arg2))       { cycles = t.getArgCycles(t.arg1,  8,  8, 16, 16, 20, 20, 24, 20, 24, 20, 24, 16); break; }
              if (t.arg1.type == 'imm')   { cycles = t.getArgCycles(t.arg2, 16, 16, 28, 28, 32, 32, 36, 32, 36, -1, -1, -1); break; }
              // Name                : Dn   An  (A)  (A)+ -(A) $(A) I(A)  .W   .L  $(P) I(P)  #
              // sub.l *,d0             8    8   16   16   20   20   24   20   24   20   24   16
              // sub.l d0,*             8    8   20   20   24   24   28   24   28
              // suba.l *,a1            8    8   16   16   20   20   24   20   24   20   24   16
              // sub.l #1,*            16    16  28   28   32   32   36   32   36                          }
            }
        break;
        case 'SUBQ':
          if (t.instrSize < 4)      { cycles = t.getArgCycles(t.arg2,  4,  8, 12, 12, 16, 16, 20, 16, 20, -1, -1, -1); break; }
          else                      { cycles = t.getArgCycles(t.arg2,  8,  8, 20, 20, 24, 24, 28, 24, 28, -1, -1, -1); break; }
          // Name                : Dn   An  (A)  (A)+ -(A) $(A) I(A)  .W   .L  $(P) I(P)  #
          // subq.w #1,*            4    8   12   12   16   16   20   16   20
          // subq.l #1,*            8    8   20   20   24   24   28   24   28
        case 'SUBX':
          if (t.instrSize < 4)      { cycles = t.getArgCycles(t.arg1,  4, -1, -1, -1, 20, -1, -1, -1, -1, -1, -1, -1); break; }
          else                      { cycles = t.getArgCycles(t.arg1,  8, -1, -1, -1, 32, -1, -1, -1, -1, -1, -1, -1); break; }
          // Name                : Dn   An  (A)  (A)+ -(A) $(A) I(A)  .W   .L  $(P) I(P)  #
          // subx.w *,*             4                  20
          // subx.l *,*             8                  32
        
          case 'TST':
            if (t.instrSize < 4)      { cycles = t.getArgCycles(t.arg1,  4, -1,  8,  8, 12, 12, 16, 12, 16, -1, -1, -1); break; }
            else                      { cycles = t.getArgCycles(t.arg1,  4, -1, 12, 12, 16, 16, 20, 16, 20, -1, -1, -1); break; }
            // Name                : Dn   An  (A)  (A)+ -(A) $(A) I(A)  .W   .L  $(P) I(P)  #
            // tst.w *                4   -1    8    8   12   12   16   12   16
            // tst.l *                4   -1   12   12   16   16   20   16   20

          case 'BCHG':
            if (t.isDReg(t.arg1))       { cycles = t.getArgCycles(t.arg2,  8, -1, 12, 12, 16, 16, 20, 16, 20, -1, -1, -1); break; }
            if (t.arg1.type == 'imm')   { cycles = t.getArgCycles(t.arg2,  12,-1, 16, 16, 20, 20, 24, 20, 24, -1, -1, -1); break; }
            // Name                : Dn   An  (A)  (A)+ -(A) $(A) I(A)  .W   .L  $(P) I(P)  #
            // bchg d0,*              8    -1  12   12   16   16   20   16   20
            // bchg #1,*             12    -1  16   16   20   20   24   20   24
          break;
          
          case 'BSET':
            if (t.isDReg(t.arg1))       { cycles = t.getArgCycles(t.arg2,  8, -1, 12, 12, 16, 16, 20, 16, 20, -1, -1, -1); break; }
            if (t.arg1.type == 'imm')   { cycles = t.getArgCycles(t.arg2,  12,-1, 16, 16, 20, 20, 24, 20, 24, -1, -1, -1); break; }
            // Name                : Dn   An  (A)  (A)+ -(A) $(A) I(A)  .W   .L  $(P) I(P)  #
            // bset d0,*              8   -1   12   12   16   16   20   16   20
            // bset #1,*             12   -1   16   16   20   20   24   20   24
          break;

          case 'BCLR':
            if (t.isDReg(t.arg1))       { cycles = t.getArgCycles(t.arg2,  8, -1, 12, 12, 16, 16, 20, 16, 20, -1, -1, -1); break; }
            if (t.arg1.type == 'imm')   { cycles = t.getArgCycles(t.arg2,  12,-1, 16, 16, 20, 20, 24, 20, 24, -1, -1, -1); break; }
            // Name                : Dn   An  (A)  (A)+ -(A) $(A) I(A)  .W   .L  $(P) I(P)  #
            // bclr d0,*              8   -1   12   12   16   16   20   16   20
            // bclr #1,*             12   -1   16   16   20   20   24   20   24
          break;

          case 'BTST':
            if (t.isDReg(t.arg1))       { cycles = t.getArgCycles(t.arg2,  8, -1,  8,  8, 12, 12, 16, 12, 16, -1, -1, -1); break; }
            if (t.arg1.type == 'imm')   { cycles = t.getArgCycles(t.arg2,  12,-1, 12, 12, 16, 16, 20, 16, 20, -1, -1, -1); break; }
            // Name                : Dn   An  (A)  (A)+ -(A) $(A) I(A)  .W   .L  $(P) I(P)  #
            // btst d0,*              8   -1    8    8   12   12   16   12   16
            // btst #1,*             12   -1   12   12   16   16   20   16   20
          break;

          case 'LEA':
            cycles = t.getArgCycles(t.arg1,  -1,-1,  4, -1, -1,  8, 16,  8, 12,  8, 16, -1);
            // Name                : Dn   An  (A)  (A)+ -(A) $(A) I(A)  .W   .L  $(P) I(P)  #
            // lea *,a1              -1   -1   4    -1   -1    8   16    8   12    8   16
          break;

          case 'PEA':
            cycles = t.getArgCycles(t.arg1,  -1,-1, 12, -1, -1, 16, 24, 16, 20, 16, 24, -1);
            // Name                : Dn   An  (A)  (A)+ -(A) $(A) I(A)  .W   .L  $(P) I(P)  #
            // pea *                 -1   -1  12    -1   -1   16   24   16   20   16   24
          break;

          case 'JMP':
            cycles = t.getArgCycles(t.arg1,  -1,-1,  8, -1, -1, 12, 16, 12, 12, 12, -1,-1);
            // Name                : Dn   An  (A)  (A)+ -(A) $(A) I(A)  .W   .L  $(P) I(P)  #
            // jmp                   -1   -1    8   -1   -1   12   16   12   12   12   -1  -1
          break;

          case 'JSR':
            cycles = t.getArgCycles(t.arg1,  -1,-1,  16, -1, -1, 20, 24, 20, 20, 20, -1,-1);
            // Name                : Dn   An  (A)  (A)+ -(A) $(A) I(A)  .W   .L  $(P) I(P)  #
            // jsr                             16             20   24   20   20   20
          break;

          case 'ST':
            cycles = t.getArgCycles(t.arg1,  8,-1, 12, 12, 16, 16, 20, 16, 20, -1, -1,-1);
            // Name                : Dn   An  (A)  (A)+ -(A) $(A) I(A)  .W   .L  $(P) I(P)  #
            // st *                   8   -1   12   12   16   16   20   16   20
          break;

          case 'TAS':
            cycles = t.getArgCycles(t.arg1,  4,-1, 16, 16, 20, 20, 24, 20, 24, -1, -1,-1);
            // Name                : Dn   An  (A)  (A)+ -(A) $(A) I(A)  .W   .L  $(P) I(P)  #
            // tas *                  4   -1   16   16   20   20   24   20   24
          break;

          case 'ASL':
          case 'ASR':
          case 'LSL':
          case 'LSR':
          case 'ROL':
          case 'ROR':
          case 'ROXL':
          case 'ROXR':
            t.updateShiftCycles(-1);
            cycles = t.cycles;
          break;

          case 'SWAP':
          case 'EXT':
          case 'NOP':
          case 'MOVEQ':
              cycles = 4;
          break;
      
          case 'EXG': cycles = 8; break;
          case 'BRA': 
          case 'BHI':
          case 'BLS':
          case 'BCS':
          case 'BCC':
          case 'BNE':
          case 'BEQ':
          case 'BVC':
          case 'BVS':
          case 'BPL':
          case 'BMI':
          case 'BGE':
          case 'BLT':
          case 'BGT':
          case 'BLE':
              cycles = 12;
          break;
          case 'RTS': cycles = 16; break;    
          case 'BSR':
          case 'RTE':
              cycles = 20;
          break;    
          case 'TRAP': cycles = 36; break;
          case 'ILLEGAL':
            if (t.jsString) t.cycles = 0;
            cycles = 36;
          break;
        } // end of switch

    if (cycles > 0) t.cycles = cycles;
}  
  
}

  function eval_ifeq(ln) {
    const v = ln.readNextWord();
    const r = ln.parseJSNumber(v, 0, true);
    if (r == 0) contitionCode = 1; else contitionCode = 2;
    return contitionCode;
  }

  function eval_ifne(ln) {
    const v = ln.readNextWord();
    const r = ln.parseJSNumber(v, 0, true);
    if (r != 0) contitionCode = 1; else contitionCode = 2;
    return contitionCode;
  }

  function eval_ifd(ln) {
    const v = ln.readNextWord();
    const r = ln.parseJSNumber(v, 0, true);
    if (!isNaN(r)) contitionCode = 1; else contitionCode = 2;
    return contitionCode;
  }

  function eval_ifnd(ln) {
    const v = ln.readNextWord();
    const r = ln.parseJSNumber(v, 0, true);
    if (isNaN(r)) contitionCode = 1; else contitionCode = 2;
    return contitionCode;
  }

  function eval_ifnc(ln) {
    const v1 = ln.readNextWord();
    const v2 = ln.readNextWord();
    if (v1 != v2) contitionCode = 1; else contitionCode = 2;
    return contitionCode;
  }

  function eval_ifge(ln) {
    const v = ln.readNextWord();
    const r = ln.parseJSNumber(v, 0, true);
    if (r >= 0) contitionCode = 1; else contitionCode = 2;
    return contitionCode;
  }

  function eval_ifgt(ln) {
    const v = ln.readNextWord();
    const r = ln.parseJSNumber(v, 0, true);
    if (r > 0) contitionCode = 1; else contitionCode = 2;
    return contitionCode;
  }

  function eval_ifle(ln) {
    const v = ln.readNextWord();
    const r = ln.parseJSNumber(v, 0, true);
    if (r <= 0) contitionCode = 1; else contitionCode = 2;
    return contitionCode;
  }

  function eval_iflt(ln) {
    const v = ln.readNextWord();
    const r = ln.parseJSNumber(v, 0, true);
    if (r < 0) contitionCode = 1; else contitionCode = 2;
    return contitionCode;
  }
