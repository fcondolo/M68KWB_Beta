ASMBL_INSTRGRP["ADDX"] = assemble_group_1101;
ASMBL_INSTRGRP["ADD"] = assemble_group_1101;
ASMBL_INSTRGRP["ADDA"] = assemble_group_1101;
ASMBL_INSTRGRP["SUB"] = assemble_group_1101;
ASMBL_INSTRGRP["SUBA"] = assemble_group_1101;
ASMBL_INSTRGRP["SUBX"] = assemble_group_1101;
ASMBL_INSTRGRP["CMP"] = assemble_group_1101;
ASMBL_INSTRGRP["CMPA"] = assemble_group_1101;
ASMBL_INSTRGRP["CMPI"] = assemble_group_1101;
ASMBL_INSTRGRP["CMPM"] = assemble_group_1101;
ASMBL_INSTRGRP["EOR"] = assemble_group_1101;

function decode_group_1101_default2Arg(_l,w0,_out,_opcode) {
    w0 = asmbl_setUniqueBits(w0, _opcode);
    if (asmbl_isEffectiveAddress(_l.arg2))
        w0 = asmbl_setUniqueBits(w0, 1<<8);
    if (asmbl_isEffectiveAddress(_l.arg1) && asmbl_argIsDataReg(_l.arg2)) {
        w0 = asmbl_setAdrsReg03(_l.arg1, w0);
        w0 = asmbl_setDataReg93(_l.arg2, w0);
        let d = asmbl_setMode(_l.arg1, w0, 3, 3);
        asmbl_buildArray(d, _out);
        return _out;
    }
    if (asmbl_argIsDataReg(_l.arg1) && asmbl_isEffectiveAddress(_l.arg2)) {
        w0 = asmbl_setDataReg93(_l.arg1, w0);
        w0 = asmbl_setAdrsReg03(_l.arg2, w0);
        let d = asmbl_setMode(_l.arg2, w0, 3, 3);
        asmbl_buildArray(d, _out);
        return _out;
    }
    if (asmbl_argIsDataReg(_l.arg1) && asmbl_argIsDataReg(_l.arg2)) {
        w0 = asmbl_setDataReg03(_l.arg1, w0);
        w0 = asmbl_setDataReg93(_l.arg2, w0);
        let d = asmbl_setMode(_l.arg1, w0, 3, 3);
        asmbl_buildArray(d, _out);
        return _out;
    }
    if (asmbl_argIsAdrsReg(_l.arg1) && asmbl_argIsDataReg(_l.arg2)) {
        w0 = asmbl_setAdrsReg03(_l.arg1, w0);
        w0 = asmbl_setDataReg93(_l.arg2, w0);
        let d = asmbl_setMode(_l.arg1, w0, 3, 3);
        asmbl_buildArray(d, _out);
        return _out;
    }
    asmbl_syntaxError(_l,"ADD syntax error", ["ea,Dn","Dn,ea"]);
    return null;
}

function assemble_group_1101(_l, w0, _out) {
    w0 = asmbl_setSize(_l, w0);
    let syntax = [];
    switch (_l.instr){
        case "ADDX":
            if (asmbl_argIsDataReg(_l.arg1) && asmbl_argIsDataReg(_l.arg2)) {
                syntax.push("Dn,Dn");
                w0 = asmbl_setUniqueBits(w0, 0b1101000100000000); // opcode
                w0 = asmbl_setDataReg03(_l.arg1, w0);
                w0 = asmbl_setDataReg93(_l.arg2, w0);
                let d = asmbl_setMode(_l.arg1, w0, 3, 3);
                d.op = asmbl_clearBits(d.op,0b10000000111000);
                asmbl_buildArray(d, _out);
                return _out;
            }
            if (_l.arg1.predecrement && _l.arg2.predecrement) {
                syntax.push("-(An),-(An)");
                w0 = asmbl_setUniqueBits(w0, 0b1101000100000000); // opcode
                w0 = asmbl_setAdrsReg03(_l.arg1, w0);
                w0 = asmbl_setAdrsReg93(_l.arg2, w0);
                let d = asmbl_setMode(_l.arg1, w0, 3, 3);
                d.op = asmbl_clearBits(d.op,0b10000000110000);
                d.op = asmbl_setBits(d.op,0b1000);
                asmbl_buildArray(d, _out);
                return _out;
            }
            syntax = ["Dn,Dn","-(An),-(An)"];
            asmbl_syntaxError(_l,"ADDX syntax error", syntax);            
        break;
        case "ADD":
            if (asmbl_argIsAdrsReg(_l.arg2)) {
                _l.instr = "ADDA";
                return assemble_group_1101(_l, 0, _out);
            } 
            if (_l.arg1.type=='imm') {
                if (_l.arg1.value >= 1 && _l.arg1.value <= 8) {
                    _l.instr = "ADDQ";
                    return assemble_group_1110(_l, 0, _out);
                }
                else {
                    _l.instr = "ADDI";
                    return assemble_group_0000(_l, 0, _out);
                }
            }
        return decode_group_1101_default2Arg(_l, w0, _out, 0b1101000000000000); 
        case "ADDA":
            if (asmbl_isEffectiveAddress(_l.arg1) && asmbl_argIsAdrsReg(_l.arg2)) {
                w0 = asmbl_setUniqueBits(w0, 0b1101000000000000); // opcode
                if (_l.instrSize == 2) w0 |= 0b11<<6;
                else if (_l.instrSize == 4) w0 |= 0b111<<6;
                else asmbl_syntaxError(_l,"ADDA.B is forbidden", syntax);
                w0 = asmbl_setAdrsReg03(_l.arg1, w0);
                w0 = asmbl_setAdrsReg93(_l.arg2, w0);
                let d = asmbl_setMode(_l.arg1, w0, 3, 3);
                asmbl_buildArray(d, _out);
                return _out;
            }
            if (asmbl_argIsDataReg(_l.arg1) && asmbl_argIsAdrsReg(_l.arg2)) {
                w0 = asmbl_setUniqueBits(w0, 0b1101000000000000); // opcode
                if (_l.instrSize == 2) w0 |= 0b11<<6;
                else if (_l.instrSize == 4) w0 |= 0b111<<6;
                else asmbl_syntaxError(_l,"ADDA.B is forbidden", syntax);
                w0 = asmbl_setDataReg03(_l.arg1, w0);
                w0 = asmbl_setAdrsReg93(_l.arg2, w0);
                let d = asmbl_setMode(_l.arg1, w0, 3, 3);
                asmbl_buildArray(d, _out);
                return _out;
            }
            if (asmbl_argIsAdrsReg(_l.arg1) && asmbl_argIsAdrsReg(_l.arg2)) {
                w0 = asmbl_setUniqueBits(w0, 0b1101000000000000); // opcode
                if (_l.instrSize == 2) w0 |= 0b11<<6;
                else if (_l.instrSize == 4) w0 |= 0b111<<6;
                else asmbl_syntaxError(_l,"ADDA.B is forbidden", syntax);
                w0 = asmbl_setAdrsReg03(_l.arg1, w0);
                w0 = asmbl_setAdrsReg93(_l.arg2, w0);
                let d = asmbl_setMode(_l.arg1, w0, 3, 3);
                asmbl_buildArray(d, _out);
                return _out;
            }
            if (_l.arg1.type == 'imm' && asmbl_argIsAdrsReg(_l.arg2)) {
                w0 = asmbl_setUniqueBits(w0, 0b1101<<12); // opcode
                if (_l.instrSize == 2) w0 |= 0b11<<6;
                else if (_l.instrSize == 4) w0 |= 0b111<<6;
                else asmbl_syntaxError(_l,"ADDA.B is forbidden", syntax);
                w0 |= 0b111100;    // #imm
                w0 = asmbl_setAdrsReg93(_l.arg2, w0);
                let d = {op : w0, byteData:[]};
                if (_l.instrSize == 4) {
                    d.byteData.push((_l.arg1.value >> 24) & 0xff);
                    d.byteData.push((_l.arg1.value >> 16) & 0xff);
                }
                d.byteData.push((_l.arg1.value >> 8) & 0xff);
                d.byteData.push(_l.arg1.value & 0xff);
                asmbl_buildArray(d, _out);
                return _out;
            }
           asmbl_syntaxError(_l,"ADDA: bad arguments types", ["ea,An","Dn,An","An,An","#imm,An"]);
        break;

        case "SUB":            
            if (asmbl_argIsAdrsReg(_l.arg2)) {
                _l.instr = "SUBA";
                return assemble_group_1101(_l, 0, _out);
            } 
            if (_l.arg1.type=='imm') {
                if (_l.arg1.value >= 1 && _l.arg1.value <= 8) {
                    _l.instr = "SUBQ";
                    return assemble_group_1110(_l, 0, _out);
                }
                else {
                    _l.instr = "SUBI";
                    return assemble_group_0000(_l, 0, _out);
                } 
            }
        return decode_group_1101_default2Arg(_l, w0, _out, 0b1001<<12);
       case "SUBA":
            _l.instr = "ADDA";
            assemble_group_1101(_l, 0, _out);
            _l.instr = "SUBA";
            _out.tab[0] &= 0b10111111;
      return _out;
       case "SUBX":
            _l.instr = "ADDX";
            assemble_group_1101(_l, 0, _out);
            _l.instr = "SUBX";
            _out.tab[0] &= 0b10111111;
       return _out;
       
       case "CMP":
            if (asmbl_argIsAdrsReg(_l.arg2)) {
                _l.instr = "CMPA";
                return assemble_group_1101(_l, 0, _out);
            } 
            if (_l.arg1.type=='imm') {
                _l.instr = "CMPI";
                return assemble_group_1101(_l, 0, _out);
            } 
            if (_l.arg1.postincrement && _l.arg2.postincrement) {
                _l.instr = "CMPM";
                return assemble_group_1101(_l, 0, _out);
            }
        return decode_group_1101_default2Arg(_l, w0, _out, 0b1011000000000000);
        case "CMPI":
        return grp0_default(_l,_out,0b11<<10);
        case "CMPA": {
            w0 |= 0b1011<<12;
            if (_l.instrSize == 2) w0 |= 0b11<<6;
            else if (_l.instrSize == 4) w0 |= 0b111<<6;
            else asmbl_syntaxError(_l,"CMPA syntax error: size should be .W or .L", ["CMPA.W ea,An","CMPA.L ea,An"]);
            w0 = asmbl_setAdrsReg93(_l.arg2, w0);
            let _ret = {op : w0, byteData:[]};
            _ret = wireByType03(_l.arg1, _ret, _l);
            _ret = asmbl_setMode(_l.arg1, _ret.op, 3, 3, _ret);
            asmbl_buildArray(_ret, _out);
        }
        return _out;
        case "CMPM":
            w0 |= 0b1011000100001000;
            w0 |= _l.arg1.ind;
            w0 |= _l.arg2.ind<<9;
            asmbl_buildArray({op : w0, byteData:[]}, _out);
       return _out;
       case "EOR": {
        if (!asmbl_argIsDataReg(_l.arg1)) {
            if (_l.arg1.type == 'imm') {
                _l.instr = "EORI";
                return assemble_group_0000(_l, w0, _out);
            }
            asmbl_syntaxError(_l,"EOR: arg1 must be a data register", ["EOR Dn,ea"]);
            return null;
        }
        w0 |= 0b1011<<12;
        w0 = asmbl_setDataReg93(_l.arg1, w0);
        if (_l.instrSize == 1) w0 |= 0b100<<6;
        else if (_l.instrSize == 2) w0 |= 0b101<<6;
        else w0 |= 0b110<<6
        let _ret = {op : w0, byteData:[]};
        _ret = wireByType03(_l.arg2, _ret, _l);
        _ret = asmbl_setMode(_l.arg2, _ret.op, 3, 3, _ret);
        asmbl_buildArray(_ret, _out);
       }
       return _out;
       default:
        _l.Failed("instruction '" + _l.instr + "' is not handled by assemble_group_1101");
        debugger;
        return _out;        
}
}