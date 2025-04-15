ASMBL_INSTRGRP["MOVEP"] = assemble_group_0000;
ASMBL_INSTRGRP["BTST"] = assemble_group_0000;
ASMBL_INSTRGRP["BCHG"] = assemble_group_0000;
ASMBL_INSTRGRP["BCLR"] = assemble_group_0000;
ASMBL_INSTRGRP["BSET"] = assemble_group_0000;
ASMBL_INSTRGRP["ADDI"] = assemble_group_0000;
ASMBL_INSTRGRP["SUBI"] = assemble_group_0000;
ASMBL_INSTRGRP["ANDI"] = assemble_group_0000;
ASMBL_INSTRGRP["ORI"] = assemble_group_0000;
ASMBL_INSTRGRP["EORI"] = assemble_group_0000;
ASMBL_INSTRGRP["CMPI"] = assemble_group_0000;
ASMBL_INSTRGRP["MOVE"] = assemble_group_0000;
ASMBL_INSTRGRP["MOVEA"] = assemble_group_0000;

ASMBL_INSTRGRP["EXT"] = assemble_group_0100;
ASMBL_INSTRGRP["ILLEGAL"] = assemble_group_0100;
ASMBL_INSTRGRP["NOP"] = assemble_group_0100;
ASMBL_INSTRGRP["BKPT"] = assemble_group_0100;
ASMBL_INSTRGRP["RESET"] = assemble_group_0100;
ASMBL_INSTRGRP["TRAP"] = assemble_group_0100;
ASMBL_INSTRGRP["LEA"] = assemble_group_0100;
ASMBL_INSTRGRP["DIVS"] = assemble_group_0100;
ASMBL_INSTRGRP["DIVU"] = assemble_group_0100;
ASMBL_INSTRGRP["MULS"] = assemble_group_0100;
ASMBL_INSTRGRP["MULU"] = assemble_group_0100;
ASMBL_INSTRGRP["PEA"] = assemble_group_0100;
ASMBL_INSTRGRP["RTS"] = assemble_group_0100;
ASMBL_INSTRGRP["RTE"] = assemble_group_0100;
ASMBL_INSTRGRP["SWAP"] = assemble_group_0100;
ASMBL_INSTRGRP["JMP"] = assemble_group_0100;
ASMBL_INSTRGRP["JSR"] = assemble_group_0100;
ASMBL_INSTRGRP["MOVEM"] = assemble_group_0100;
ASMBL_INSTRGRP["CLR"] = assemble_group_0100;
ASMBL_INSTRGRP["NEG"] = assemble_group_0100;
ASMBL_INSTRGRP["NEGX"] = assemble_group_0100;
ASMBL_INSTRGRP["NOT"] = assemble_group_0100;
ASMBL_INSTRGRP["TST"] = assemble_group_0100;


function wireByType03(_arg, ret, _l) {
    if (asmbl_argIsDataReg(_arg)) {
        ret.op = asmbl_setDataReg03(_arg, ret.op);
        return ret;
    }
    if (asmbl_argIsAdrsReg(_arg)) {
        ret.op = asmbl_setAdrsReg03(_arg, ret.op);
        return ret;
    }
    if (asmbl_isEffectiveAddress(_arg)) {
        ret.op = asmbl_setAdrsReg03(_arg, ret.op);
        return ret;
    }
    if (_arg.type == 'imm') {
        switch (_l.instrSize) {
            case 1:
                ret.byteData.push(0);
                ret.byteData.push(_arg.value & 0xff);
            break;
            case 2:
                ret.byteData.push((_arg.value >> 8) & 0xff);
                ret.byteData.push(_arg.value & 0xff);
            break;
            case 4:
                ret.byteData.push((_arg.value >> 24) & 0xff);
                ret.byteData.push((_arg.value >> 16) & 0xff);
                ret.byteData.push((_arg.value >> 8) & 0xff);
                ret.byteData.push(_arg.value & 0xff);
            break;
        } 
    }
    return ret;
}

function wireByType93(_arg, ret, _l) {
    if (asmbl_argIsDataReg(_arg)) {
        ret.op = asmbl_setDataReg93(_arg, ret.op);
        return ret;
    }
    if (asmbl_argIsAdrsReg(_arg)) {
        ret.op = asmbl_setAdrsReg93(_arg, ret.op);
        return ret;
    }
    if (asmbl_isEffectiveAddress(_arg)) {
        ret.op = asmbl_setAdrsReg93(_arg, ret.op);
        return ret;
    }
    if (_arg.type == 'imm') {
        switch (_l.instrSize) {
            case 1:
                ret.byteData.push(0);
                ret.byteData.push(_arg.value & 0xff);
            break;
            case 2:
                ret.byteData.push((_arg.value >> 8) & 0xff);
                ret.byteData.push(_arg.value & 0xff);
            break;
            case 4:
                ret.byteData.push((_arg.value >> 24) & 0xff);
                ret.byteData.push((_arg.value >> 16) & 0xff);
                ret.byteData.push((_arg.value >> 8) & 0xff);
                ret.byteData.push(_arg.value & 0xff);
            break;
        } 
    }
    return ret;
}

function grp0_bitOp(_l,_out,_immMsk,_regMsk,_name) {
    let _ret = {op : 0, byteData:[]};

    _l.instrSize = 2; // fake size for imm argument storage (always 16 bits)
    if (_l.arg1.type == 'imm')
        _ret.op = asmbl_setUniqueBits(_ret.op, _immMsk);
    else
        _ret.op = asmbl_setUniqueBits(_ret.op, _regMsk);

    if (asmbl_argIsDataReg(_l.arg1)) _ret.op = asmbl_setDataReg93(_l.arg1, _ret.op);
    else {
        if (_l.arg1.type != 'imm') asmbl_syntaxError(_l,_name + " arg1 is either a data register or an immediate value", []);
        _ret = wireByType93(_l.arg1, _ret, _l);
    }
    _ret = wireByType03(_l.arg2, _ret, _l);

    // set actual size
    if (asmbl_argIsDataReg(_l.arg2)) _l.instrSize = 4;
    else if (asmbl_isEffectiveAddress(_l.arg2)) _l.instrSize = 1;
    else asmbl_syntaxError(_l,_name + " arg2 is either a data register or an effective address", []);

    _ret = asmbl_setMode(_l.arg2, _ret.op, 3, 3, _ret);
    asmbl_buildArray(_ret, _out);
    return _out;
}

function grp0_default(_l,_out,_opcode) {
    let ret = {op : 0, byteData:[]};
    ret.op = asmbl_setUniqueBits(ret.op, _opcode);
    ret = wireByType93(_l.arg1, ret, _l);
    ret = wireByType03(_l.arg2, ret, _l);
    ret.op = asmbl_setSize(_l,ret.op);
    ret = asmbl_setMode(_l.arg2, ret.op, 3, 3, ret);
    asmbl_buildArray(ret, _out);
    return _out;
}

function grp100_default(_l,_out,_opcode) {
    if (asmbl_argIsAdrsReg(_l.arg1)) {asmbl_syntaxError(_l,"does not work for address registers.", []); return null;}
    let ret = {op : _opcode, byteData:[]};
    ret.op = asmbl_setSize(_l,ret.op);
    ret = wireByType03(_l.arg1, ret, _l);
    ret = asmbl_setMode(_l.arg1, ret.op, 3, 3, ret);
    asmbl_buildArray(ret, _out);
    return _out;
}

function checkBitOp(_l, _i) {
    if (asmbl_argIsDataReg(_l.arg2)) {
        if (_l.instrSize != 4) {
            asmbl_syntaxError(_l," invalid size: " + _i + " with a data register as destination must be .l", []);
            return false;
        }
    } else if (asmbl_isEffectiveAddress(_l.arg2)) {
        if (_l.instrSize != 1) {
            asmbl_syntaxError(_l," invalid size: " + _i + " with an effective address as destination must be .b", []);
            return false;
        }
    }
    return true;
}


function assemble_group_0000(_l, w0, _out) {
    let ret = {op : 0, byteData:[]};
    if ((_l.arg1.str == "SR") || (_l.arg2.str == "SR"))
    {
        // SR ==> TRANSFORM TO NOP
        _l.filtered = "NOP";
        _l.instr = "NOP";
        _l.text = "; ! INSTRUCTIONS USING SR ARE REMAPPED TO NOP ! " + _l.text;
        return assemble_group_0100(_l,w0,_out);
    }

    switch (_l.instr){
        case "MOVEP":
            if (asmbl_isEffectiveAddress(_l.arg1) && asmbl_argIsDataReg(_l.arg2)) {
                w0 = asmbl_clearBits(w0,0b111000000);
                w0 = asmbl_setUniqueBits(w0, 0b0000000100000000); // opcode
                if (_l.instrSize == 2) w0 |= 0b100<<6;
                else if (_l.instrSize == 4) w0 |= 0b101<<6;
                else asmbl_syntaxError(_l,"MOVEP is .W or .L only", []);
                w0 = asmbl_setAdrsReg03(_l.arg1, w0);
                w0 = asmbl_setDataReg93(_l.arg2, w0);
                let d = asmbl_setMode(_l.arg1, w0, 3, 3);
                d.op = asmbl_clearBits(d.op,0b110000);
                asmbl_buildArray(d, _out);
            }
            if (asmbl_argIsDataReg(_l.arg1) && asmbl_isEffectiveAddress(_l.arg2)) {
                w0 = asmbl_clearBits(w0,0b111000000);
                w0 = asmbl_setUniqueBits(w0, 0b0000000110000000); // opcode
                if (_l.instrSize == 2) w0 |= 0b110<<6;
                else if (_l.instrSize == 4) w0 |= 0b111<<6;
                else asmbl_syntaxError(_l,"MOVEP is .W or .L only", []);
                w0 = asmbl_setDataReg93(_l.arg1, w0);
                w0 = asmbl_setAdrsReg03(_l.arg2, w0);
                let d = asmbl_setMode(_l.arg2, w0, 3, 3);
                d.op = asmbl_clearBits(d.op,0b110000);
                asmbl_buildArray(d, _out);
                
            }
        return _out;
        case "BTST": {
            if (!checkBitOp(_l,"BTST")) return null;
            return grp0_bitOp(_l, _out, 1<<11, 1<<8, "BTST");
        }
        case "BCHG": {
            if (!checkBitOp(_l,"BCHG")) return null;
            return grp0_bitOp(_l, _out, (1<<6)|(1<<11), (1<<6)|(1<<8), "BCHG");
        }
        case "BCLR": {
            if (!checkBitOp(_l,"BCLR")) return null;
            return grp0_bitOp(_l, _out, (1<<7)|(1<<11), (1<<7)|(1<<8), "BCLR");
        }
        case "BSET": {
            if (!checkBitOp(_l,"BSET")) return null;
            return grp0_bitOp(_l, _out, (1<<6)|(1<<7)|(1<<11), (1<<6)|(1<<7)|(1<<8), "BSET");
        }
        case "ADDI": return grp0_default(_l,_out,0b11<<9);
        case "SUBI": return grp0_default(_l,_out,1<<10);
        case "ANDI": return grp0_default(_l,_out,1<<9);
        case "ORI": return grp0_default(_l,_out,0);
        case "EORI": return grp0_default(_l,_out,0b101<<9);
        case "CMPI": return grp0_default(_l,_out,0b11<<10);
        case "MOVE":
            if (asmbl_argIsAdrsReg(_l.arg2)) {
                _l.instr = "MOVEA";
                return assemble_group_0000(_l, 0, _out);
            } 
            if (_l.arg1.type=='imm' && asmbl_argIsDataReg(_l.arg2)) {
                if (_l.instrSize == 4 && _l.arg1.value >= -128 && _l.arg1.value <= 127) {
                    _l.instr = "MOVEQ";
                    return assemble_group_1110(_l, 0, _out);
                }
            } 
            switch(_l.instrSize) {
                case 1: ret.op |= 0b01<<12; break;
                case 2: ret.op |= 0b11<<12; break;
                case 4: ret.op |= 0b10<<12; break;
            }
            wireByType93(_l.arg2, ret, _l);
            wireByType03(_l.arg1, ret, _l);
            if (_l.arg1.type == 'imm') {
                let failMsg = checkNumberSize(_l.arg1.value, _l.instrSize);
                if (failMsg != null) {
                    asmbl_syntaxError(_l," immediate operand out of range: " + _l.arg1.value + " reason: " + failMsg, []); return null;
                }
            }
            ret = asmbl_setMode(_l.arg1, ret.op, 3, 3, ret);
            ret = asmbl_setMode(_l.arg2, ret.op, 6, 3, ret);
            asmbl_buildArray(ret, _out);
        return _out;
        case "MOVEA":
            if (!asmbl_argIsAdrsReg(_l.arg2)) {asmbl_syntaxError(_l," MOVEA must have an address register as destination", []); return null;}
            switch(_l.instrSize) {
                case 1: asmbl_syntaxError(_l," MOVEA.B is not allowed (.W or .L only)", []); return null;
                case 2: ret.op |= 0b11<<12; break;
                case 4: ret.op |= 0b10<<12; break;
            }
            _l.call = MOVEA_X;
            wireByType93(_l.arg2, ret, _l);
            wireByType03(_l.arg1, ret, _l);
            ret = asmbl_setMode(_l.arg1, ret.op, 3, 3, ret);
            ret.op |= 1<<6;
            asmbl_buildArray(ret, _out);
        return _out;
        default:
            _l.Failed("instruction '" + _l.instr + "' is not handled by assemble_group_0000");
            debugger;
        return _out;        
    }
}
function assemble_group_0100(_l, w0, _out) {    
    let ret = {op : 0, byteData:[]};
    switch (_l.instr){
        case "DIVS":
            if (!asmbl_argIsDataReg(_l.arg2)) {asmbl_syntaxError(_l," DIVS works only for data registers", []); return null;}
            if (_l.instrSize != 2) asmbl_warning(_l, "forcing .w, DIVS is always .w on the 68000");
            _l.instrSize = 2;
            ret.op = 0b1000000111000000;
            ret.op = asmbl_setDataReg93(_l.arg2, ret.op);
            ret = wireByType03(_l.arg1, ret, _l);
            ret = asmbl_setMode(_l.arg1, ret.op, 3, 3, ret);
            asmbl_buildArray(ret, _out);
        return _out;
        case "DIVU":
            if (!asmbl_argIsDataReg(_l.arg2)) {asmbl_syntaxError(_l," DIVU works only for data registers", []); return null;}
            if (_l.instrSize != 2) asmbl_warning(_l, "forcing .w, DIVU is always .w on the 68000");
            _l.instrSize = 2;
            ret.op = 0b1000000011000000;
            ret.op = asmbl_setDataReg93(_l.arg2, ret.op);
            ret = wireByType03(_l.arg1, ret, _l);
            ret = asmbl_setMode(_l.arg1, ret.op, 3, 3, ret);
            asmbl_buildArray(ret, _out);
        return _out;
        case "MULS":
            if (!asmbl_argIsDataReg(_l.arg2)) {asmbl_syntaxError(_l," MULS works only for data registers", []); return null;}
            if (_l.instrSize != 2) asmbl_warning(_l, "forcing .w, MULS is always .w on the 68000");
            _l.instrSize = 2;
            ret.op = 0b1100000111000000;
            ret.op = asmbl_setDataReg93(_l.arg2, ret.op);
            ret = wireByType03(_l.arg1, ret, _l);
            ret = asmbl_setMode(_l.arg1, ret.op, 3, 3, ret);
            asmbl_buildArray(ret, _out);
        return _out;
        case "MULU":
            if (!asmbl_argIsDataReg(_l.arg2)) {asmbl_syntaxError(_l," MULU works only for data registers", []); return null;}
            if (_l.instrSize != 2) asmbl_warning(_l, "forcing .w, MULU is always .w on the 68000");
            _l.instrSize = 2;
            ret.op = 0b1100000011000000;
            ret.op = asmbl_setDataReg93(_l.arg2, ret.op);
            ret = wireByType03(_l.arg1, ret, _l);
            ret = asmbl_setMode(_l.arg1, ret.op, 3, 3, ret);
            asmbl_buildArray(ret, _out);
        return _out;
        case "LEA":
            if (!asmbl_argIsAdrsReg(_l.arg2)) {asmbl_syntaxError(_l," LEA works only for address registers", []); return null;}
            _l.instrSize = 4;
            let isSolved = true;
            switch(_l.arg1.type) {
                case 'imm':
                case 'reg':
                case 'adrs':
                case 'labl':
                case 'ind':
                break;
                default:
                    CODERPARSER_SINGLETON.lateAsmbl.push(_l);
                    isSolved = false;
                break;
            }
            ret.op = 0b0100000111000000;
            ret.op = asmbl_setAdrsReg93(_l.arg2, ret.op);
            if (isSolved) {
                ret = wireByType03(_l.arg1, ret, _l);
                ret = asmbl_setMode(_l.arg1, ret.op, 3, 3, ret);
                _out.solveError = null;
            } else {
                ret.byteData = [0,0,0,1]; // temporary address, odd on purpose to generate error
                _out.solveError = "LEA : can't solve address to load";
            }
            asmbl_buildArray(ret, _out);
        return _out;
        case "PEA":
            if (!asmbl_isEffectiveAddress(_l.arg1)) {asmbl_syntaxError(_l," PEA works only for effective addresses", []); return null;}
            _l.instrSize = 4;
            ret.op = 0b0100100001000000;
            ret = wireByType03(_l.arg1, ret, _l);
            ret = asmbl_setMode(_l.arg1, ret.op, 3, 3, ret);
            asmbl_buildArray(ret, _out);
        return _out;
        case "RTS":
            ret.op = 0b0100111001110101;
            asmbl_buildArray(ret, _out);
        return _out;
        case "RTE":
            ret.op = 0b0100111001110011;
            asmbl_buildArray(ret, _out);
        return _out;
        case "SWAP":
            if (!asmbl_argIsDataReg(_l.arg1)) {asmbl_syntaxError(_l," SWAP works only for data registers", []); return null;}
            _l.instrSize = 2;
            ret.op = 0b0100100001000000;
            ret.op = asmbl_setDataReg03(_l.arg1, ret.op);
            asmbl_buildArray(ret, _out);
        return _out;
        case "JMP":
            if (!asmbl_isEffectiveAddress(_l.arg1)) {asmbl_syntaxError(_l," JUMP works only for effective addresses", []); return null;}
            _l.instrSize = 4;
            ret.op = 0b0100111011000000;
            ret = wireByType03(_l.arg1, ret, _l);
            ret = asmbl_setMode(_l.arg1, ret.op, 3, 3, ret);
            asmbl_buildArray(ret, _out);
        return _out;
        case "JSR":
            if (!asmbl_isEffectiveAddress(_l.arg1)) {asmbl_syntaxError(_l," JSR works only for effective addresses", []); return null;}
            _l.instrSize = 4;
            ret.op = 0b0100111010000000;
            ret = wireByType03(_l.arg1, ret, _l);
            ret = asmbl_setMode(_l.arg1, ret.op, 3, 3, ret);
            asmbl_buildArray(ret, _out);
        return _out;
        case "CLR": return grp100_default(_l,_out,0b0100001000000000);
        case "NEG": return grp100_default(_l,_out,0b0100010000000000);
        case "NEGX": return grp100_default(_l,_out,0b0100000000000000);
        case "NOT": return grp100_default(_l,_out,0b0100011000000000);
        case "TST": return grp100_default(_l,_out,0b0100101000000000);
        case "MOVEM":
            ret.op = 0b0100100010000000;
            let bitData = 0;
            if (_l.arg2.predecrement) {
                for (let bit = 0; bit <= 7; bit++) {
                    const dbit = bit+8;
                    const abit = bit;
                    const dstr = "D"+(7-bit).toString();
                    const astr = "A"+(7-bit).toString();
                    for (let i = 0; i < _l.arg1.movem.length; i++) {
                        if (_l.arg1.movem[i].reg == dstr)
                            bitData |= 1<<dbit;
                        if (_l.arg1.movem[i].reg == astr)
                            bitData |= 1<<abit;
                    }
                }
                ret.byteData.push((bitData >> 8) & 255);
                ret.byteData.push(bitData & 255);
                ret = wireByType03(_l.arg2, ret, _l);
                ret = asmbl_setMode(_l.arg2, ret.op, 3, 3, ret);
            }
            else {
                let regList = _l.arg1;
                let effAdrs = _l.arg2;
                if (_l.arg2.movem) {
                    regList = _l.arg2;
                    effAdrs = _l.arg1;
                    ret.op |= 1<<10;
                }
                for (let bit = 0; bit <= 7; bit++) {
                    const dbit = bit;
                    const abit = bit+8;
                    const dstr = "D"+bit.toString();
                    const astr = "A"+bit.toString();
                    for (let i = 0; i < regList.movem.length; i++) {
                        if (regList.movem[i].reg == dstr)
                            bitData |= 1<<dbit;
                        if (regList.movem[i].reg == astr)
                            bitData |= 1<<abit;
                    }
                }
                ret.byteData.push((bitData >> 8) & 255);
                ret.byteData.push(bitData & 255);
                ret = wireByType03(effAdrs, ret, _l);
                ret = asmbl_setMode(effAdrs, ret.op, 3, 3, ret);
            }
            if (_l.instrSize == 4) ret.op |= 1<<6;
            asmbl_buildArray(ret, _out);
        return _out;
        case "EXT":
            if (!asmbl_argIsDataReg(_l.arg1)) {asmbl_syntaxError(_l," EXT applies only to data registers", []); return null;}
            ret.op = 0b0100100000000000;
            switch(_l.instrSize) {
                case 1: asmbl_syntaxError(_l," EXT.B is not supported. Only EXT.W or EXT.L", []); return null;
                case 2: ret.op |= 0b10<<6; break;
                case 4: ret.op |= 0b11<<6; break;
            }
            ret.op = asmbl_setDataReg03(_l.arg1, ret.op);   
            asmbl_buildArray(ret, _out);
        return _out;
        case "ILLEGAL": // used for JS script. Put the JS code in ret.byteData
            ret.op = 0b0100101011111100;
            asmbl_buildArray(ret, _out);
        return _out;
        case "NOP":
            ret.op = 0b0100111001110001;
            asmbl_buildArray(ret, _out);
        return _out;
        case "BKPT":
            ret.op = 0b0100100001001000;
            ret.op |= _l.arg1.value & 7;
            asmbl_buildArray(ret, _out);
        return _out;
        case "TRAP":
            ret.op = 0b0100111001000000;
            ret.op |= _l.arg1.value & 15;
            asmbl_buildArray(ret, _out);
        return _out;
        case "RESET": // reset external devices
            ret.op = 0b0100111001110000;
            asmbl_buildArray(ret, _out);
        return _out;
        default:
            _l.Failed("instruction '" + _l.instr + "' is not handled by assemble_group_0100");
            debugger;
        return _out;        
    }
}