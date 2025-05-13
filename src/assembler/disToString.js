const OpString = [
    "INVALID",
    "ANDITOCCR",
    "ANDITOSR",
    "EORITOCCR",
    "EORITOSR",
    "ORITOCCR",
    "ORITOSR",
    "MOVEP",
    "BTST",
    "BCHG",
    "BCLR",
    "BSET",
    "RTM",
    "CALLM",
    "ADDI",
    "SUBI",
    "ANDI",
    "ORI",
    "CMP2",
    "CHK2",
    "EORI",
    "CMPI",
    "MOVES",
    "MOVE",
    "MOVEA",
    "BGND",
    "ILLEGAL",
    "NOP",
    "RESET",
    "RTD",
    "RTE",
    "RTR",
    "RTS",
    "STOP",
    "TRAPV",
    "MOVEC",
    "SWAP",
    "BKPT",
    "EXTW",
    "EXTL",
    "EXTBL",
    "LEA",
    "LINK",
    "UNLK",
    "TRAP",
    "DIVSL",
    "DIVSLL",
    "DIVUL",
    "DIVULL",
    "JMP",
    "JSR",
    "MULS",
    "MULU",
    "NBCD",
    "MOVEFROMSR",
    "MOVETOSR",
    "MOVETOUSP",
    "MOVEFROMUSP",
    "MOVEFROMCCR",
    "MOVETOCCR",
    "PEA",
    "TAS",
    "MOVEM",
    "CLR",
    "NEG",
    "NEGX",
    "NOT",
    "TST",
    "CHK",
    "DBCC",
    "ADDQ",
    "SUBQ",
    "TRAPCC",
    "SCC",
    "BRA",
    "BSR",
    "BCC",
    "MOVEQ",
    "PACK",
    "UNPK",
    "SBCD",
    "DIVS",
    "DIVU",
    "OR",
    "SUBX",
    "SUB",
    "SUBA",
    "CMPA",
    "CMPM",
    "CMP",
    "EOR",
    "ABCD",
    "EXG",
    "AND",
    "ADDX",
    "ADD",
    "ADDA",
    "BFCHG",
    "BFCLR",
    "BFEXTS",
    "BFEXTU",
    "BFFFO",
    "BFINS",
    "BFSET",
    "BFTST",
    "ASL",
    "ASR",
    "LSL",
    "LSR",
    "ROXL",
    "ROXR",
    "ROL",
    "ROR",
    "FMOVECR",
    "FABS",
    "FSABS",
    "FDABS",
    "FACOS",
    "FADD",
    "FSADD",
    "FDADD",
    "FASIN",
    "FATAN",
    "FATANH",
    "FNOP",
    "FBCC",
    "FCMP",
    "FCOS",
    "FCOSH",
    "FDBCC",
    "FDIV",
    "FSDIV",
    "FDDIV",
    "FETOX",
    "FETOXM1",
    "FGETEXP",
    "FGETMAN",
    "FINT",
    "FINTRZ",
    "FLOG10",
    "FLOG2",
    "FLOGN",
    "FLOGNP1",
    "FMOD",
    "FMOVE",
    "FSMOVE",
    "FDMOVE",
    "FMOVEM",
    "FMUL",
    "FSMUL",
    "FDMUL",
    "FNEG",
    "FSNEG",
    "FDNEG",
    "FREM",
    "FSCALE",
    "FTRAPCC",
    "FSCC",
    "FSGLDIV",
    "FSGLMUL",
    "FSIN",
    "FSINCOS",
    "FSINH",
    "FSQRT",
    "FSSQRT",
    "FDSQRT",
    "FSUB",
    "FSSUB",
    "FDSUB",
    "FTAN",
    "FTANH",
    "FTENTOX",
    "FTST",
    "FTWOTOX",
];

// https://www.nxp.com/docs/en/reference-manual/M68000PRM.pdf from page 557
// http://goldencrystal.free.fr/M68kOpcodes.pdf




function asciiToBinary(_line, _codeSectionOfs) {
    let l = new LineParser("", 0, _line, 0);
    l.codeSectionOfs = _codeSectionOfs;
    if (CODERPARSER_SINGLETON == null) CODERPARSER_SINGLETON = new CodeParser();
    CODERPARSER_SINGLETON.process_oneLineInstr(l);
    if (CODERPARSER_SINGLETON.stopGlobalCompilation) return null;
    let out = { tab: new Uint8Array(16), ofs: 0 };
    asmbl_go(l, out);
    if (out.ofs > 0) {
        return out;
    }
    return null;
}


function byteToHexString(_b) {
    return (((_b >> 4) & 15).toString(16) + (_b & 15).toString(16)).toUpperCase();
}

function wordToHexString(_w) {
    return byteToHexString((_w >> 8) & 0xff) + byteToHexString(_w & 0xff);
}

function longToHexString(_l, _dot = true) {
    let ret = wordToHexString((_l >> 16) & 0xffff);
    if (_dot)
        ret += '.';
    return ret + wordToHexString(_l & 0xffff);
}



function dis_byteToHexString(_b, _splice = true) {
    let ret = (((_b >> 4) & 15).toString(16) + (_b & 15).toString(16)).toUpperCase();
    if (_splice) {
        while (ret[0] == '0' && ret.length > 1)
            ret = ret.slice(1);
    }
    return ret;
}

function dis_wordToHexString(_w, _splice = true) {
    let ret = byteToHexString((_w >> 8) & 0xff, false) + byteToHexString(_w & 0xff, false);
    if (_splice) {
        while (ret[0] == '0' && ret.length > 1)
            ret = ret.slice(1);
    }
    return ret;
}

function dis_longToHexString(_l) {
    let ret = wordToHexString((_l >> 16) & 0xffff, false);
    ret += wordToHexString(_l & 0xffff, false);
    while (ret[0] == '0' && ret.length > 1)
        ret = ret.slice(1);
    return ret;
}

function writeMoveMRegList(table) {
    let ret = "";
    let prevRegIndex = -2;
    let firstRegDone = false;
    let writeme = null;
    for (let iReg = 0; iReg < 8; iReg++) {
        if (table[iReg]) {
            if (!firstRegDone) {
                firstRegDone = true;
                ret += table[iReg];
                startRange = iReg;
            } else {
                if (prevRegIndex != iReg - 1) {
                    if (writeme)
                        ret += "-" + writeme;
                    ret += '/' + table[iReg];
                    prevRegIndex = -2;
                    writeme = null;
                } else writeme = table[iReg];
            }
            prevRegIndex = iReg;
        }
    }
    if (writeme) {
        ret += "-" + writeme;
    }
    return ret;
}


function OperandToString(_operands, _index) {
    const _o = _operands[_index];
    if (!_o) return;
    let ret = "";
    switch (_o.type) {
        case OperandType.NoOperand: break;
        case OperandType.Implied: break;
        case OperandType.IMM8: ret += "#$" + dis_byteToHexString(_o.data); break;
        case OperandType.IMM16: ret += "#$" + dis_wordToHexString(_o.data); break;
        case OperandType.IMM32: ret += "#$" + dis_longToHexString(_o.data, false); break;
        /// An absolute address, given as a sign-extended 16-bit value.
        case OperandType.ABS16: ret += "$" + dis_wordToHexString(_o.data); break;
        /// An absolute address, given as a full 32-bit value.
        case OperandType.ABS32: ret += "$" + dis_longToHexString(_o.data, false); break;
        /// A data register
        case OperandType.DR: ret += "D" + _o.data; break;
        /// An address register
        case OperandType.AR: ret += "A" + _o.data; break;
        /// A vanilla indrection without displacement, e.g. `(a0)`
        case OperandType.ARIND: ret += "(A" + _o.data + ")"; break;
        /// Address register indirect with post-increment, e.g. `(a0)+`
        case OperandType.ARINC: ret += "(A" + _o.data + ")+"; break;
        /// Address register indirect with pre-decrement, e.g. `-(a0)`
        case OperandType.ARDEC: ret += "-(A" + _o.data + ")"; break;
        /// Address register indirect with displacement, e.g. `123(pc,d0)`
        // data: {reg:self.address_reg(src_reg), disp:simple_disp(self.pull16())}
        // data: {ofs:r, disp:simple_disp(displacement)}
        case OperandType.ARDISP:
            if (Number.isInteger(_o.data.disp.base_displacement)) {
                ret += "$" + dis_wordToHexString(_o.data.disp.base_displacement);
                ret += "(A" + _o.data.reg + ")";
            } else {
                if (_o.data.disp.base_displacement instanceof Displacement) {
                    if (_o.data.disp.base_displacement.base_displacement)
                        ret += "$" + dis_wordToHexString(_o.data.disp.base_displacement.base_displacement);
                    ret += "(A" + _o.data.ofs;
                    if (_o.data.disp.base_displacement.indexer instanceof Indexer) {
                        switch (_o.data.disp.base_displacement.indexer.type) {
                            case IndexerType.DR: ret += ",D" + _o.data.disp.base_displacement.indexer.data.reg + ".W"; break;
                            case IndexerType.AR: ret += ",A" + _o.data.disp.base_displacement.indexer.data.reg + ".W"; break;
                            default: debugger; console.error("case not covered");
                        }
                    }
                    ret += ")";
                } else {
                    ret += "(A" + _o.data.reg + ")";
                }
            }
            break;
        /// Program counter indirect with displacement, e.g. `123(pc,d0)`
        case OperandType.PCDISP:
            if (Number.isInteger(_o.data.disp.base_displacement)) {
                ret += "$" + dis_wordToHexString(_o.data.disp.base_displacement);
            }
            break;
        /// Just a displacement (skipping the base register), e.g. `123(d0)`
        case OperandType.DISP: debugger; alert("OperandToString - DISP not yet implemented"); break;
        /// A data register pair, used for 64-bit multiply/divide results.
        case OperandType.DPAIR: debugger; alert("OperandToString - DPAIR not yet implemented"); break;
        /// A floating point register pair, used for `FSINCOS`. First register receives the sine, the
        /// other the cosine.
        case OperandType.FPAIR: debugger; alert("OperandToString - FPAIR not yet implemented"); break;
        /// A register bitmask for `MOVEM` or `FMOVEM`. The order of registers is reversed depending on
        /// whether the address register is pre-decremented or post-incremented.
        case OperandType.REGLIST:
            let dataReg = [];
            let adrsReg = [];
            const otherArg = _operands[_index ^ 1];
            if (otherArg.type != OperandType.ARDEC) {
                for (let bit = 0; bit <= 7; bit++) {
                    const abit = bit + 8;
                    const amsk = 1 << abit;
                    const ares = _o.data & amsk;
                    if (ares == 0)
                        adrsReg[bit] = null;
                    else
                        adrsReg[bit] = "A" + bit.toString();

                    const dbit = bit;
                    const dmsk = 1 << dbit;
                    const dres = _o.data & dmsk;
                    if (dres == 0)
                        dataReg[bit] = null;
                    else
                        dataReg[bit] = "D" + bit.toString();
                }
            }
            else {
                for (let bit = 0; bit <= 7; bit++) {
                    const abit = bit;
                    const amsk = 1 << abit;
                    const ares = _o.data & amsk;
                    if (ares == 0)
                        adrsReg[7 - bit] = null;
                    else
                        adrsReg[7 - bit] = "A" + (7 - bit).toString();

                    const dbit = bit + 8;
                    const dmsk = 1 << dbit;
                    const dres = _o.data & dmsk;
                    if (dres == 0)
                        dataReg[7 - bit] = null;
                    else
                        dataReg[7 - bit] = "D" + (7 - bit).toString();
                }
            }
            const dRet = writeMoveMRegList(dataReg);
            const aRet = writeMoveMRegList(adrsReg);
            if (dRet.length > 0)
                ret += dRet;
            if ((dRet.length > 0) && (aRet.length > 0))
                ret += "/";
            if (aRet.length > 0)
                ret += aRet;
            break;
        /// A control register
        case OperandType.CONTROLRE: debugger; alert("OperandToString - CONTROLRE not yet implemented");
            break;
    }
    return ret;
}


function ConditionCodeToString(_cc) {
    switch (_cc) {
        case ConditionCode.CC_T: return 'T'; break;         // Always True
        case ConditionCode.CC_F: return 'F'; break;         // Always False
        case ConditionCode.CC_HI: return 'HI'; break;         // High
        case ConditionCode.CC_LS: return 'LS'; break;         // Low or Same
        case ConditionCode.CC_CC: return 'CC'; break;         // Carry Clear
        case ConditionCode.CC_CS: return 'CS'; break;         // Carry Set
        case ConditionCode.CC_NE: return 'NE'; break;         // Not Equal
        case ConditionCode.CC_EQ: return 'EQ'; break;         // Equal
        case ConditionCode.CC_VC: return 'VC'; break;         // Overflow Clear
        case ConditionCode.CC_VS: return 'VS'; break;         // Overflow Set
        case ConditionCode.CC_PL: return 'PL'; break;         // Plus
        case ConditionCode.CC_MI: return 'MI'; break;         // Negative
        case ConditionCode.CC_GE: return 'GE'; break;         // Greater or Equal
        case ConditionCode.CC_LT: return 'LT'; break;         // Less
        case ConditionCode.CC_GT: return 'GT'; break;         // Greater
        case ConditionCode.CC_LE: return 'LE'; break;         // Less or Equal
    }
}

function InstructionToString(_i) {
    let hasExt = true;
    let hasArg = true;
    let ret = { instr: OpString[_i.operation], ext: null, size:2, arg1: null, arg2: null, fullString: "" };

    switch (ret.instr) {
        // convert "cc" to actual condition
        case "BCC": ret.instr = "B" + ConditionCodeToString(_i.extra.data); break;
        case "DBCC": ret.instr = "DB" + ConditionCodeToString(_i.extra.data); break;
        case "SCC": hasExt = false; ret.instr = "S" + ConditionCodeToString(_i.extra.data); break;

        case "EXTW":
        case "EXTL":
            ret.instr = "EXT";
            break;

        // instructions with no arguments and no size
        case "ILLEGAL":
        case "NOP":
        case "RTS":
        case "RTR":
        case "RTE":
        case "RESET":
        case "BKPT":
            hasArg = false;
            hasExt = false;
            break;

        // instructions with no size
        case "LEA":
        case "PEA":
        case "JMP":
        case "JSR":
        case "MOVEQ":
        case "MULS":
        case "MULU":
        case "DIVS":
        case "DIVU":
        case "TRAP":
        case "SWAP":
        case "EXG":
            hasExt = false;
            break;
    }

    if (hasExt) {
        if (_i.size == 1) {
            ret.ext = 'B';
            ret.size = 1;
        }
        else if (_i.size == 2) {
            ret.ext = 'W';
            ret.size = 2;
        }
        else if (_i.size == 4) {
            ret.ext = 'L';
            ret.size = 4;
        }
    }

    if (hasArg) {
        if (_i.operands.length > 0) {
            const arg1 = OperandToString(_i.operands, 0);
            if (arg1 && arg1.length > 0)
                ret.arg1 = { str: arg1, type: _i.operands[0].type };
            if (_i.operands.length > 1 && _i.operands[1]) {
                const arg2 = OperandToString(_i.operands, 1);
                if (arg2 && arg2.length > 0) {
                    ret.arg2 = { str: arg2, type: _i.operands[1].type };
                }
            }
        }
    }
    ret.fullString = ret.instr;
    if (ret.ext)
        ret.fullString += '.' + ret.ext;
    if (ret.arg1)
        ret.fullString += ' ' + ret.arg1.str;
    if (ret.arg2) {
        if (ret.arg1)
            ret.fullString += ',';
        else ret.fullString += ' ';
        ret.fullString += ret.arg2.str;
    }
    return ret;
}