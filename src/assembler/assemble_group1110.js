ASMBL_INSTRGRP["ASL"] = assemble_group_1110;
ASMBL_INSTRGRP["ASR"] = assemble_group_1110;
ASMBL_INSTRGRP["LSL"] = assemble_group_1110;
ASMBL_INSTRGRP["LSR"] = assemble_group_1110;
ASMBL_INSTRGRP["ROL"] = assemble_group_1110;
ASMBL_INSTRGRP["ROR"] = assemble_group_1110;
ASMBL_INSTRGRP["ROXL"] = assemble_group_1110;
ASMBL_INSTRGRP["ROXR"] = assemble_group_1110;

ASMBL_INSTRGRP["ADDQ"] = assemble_group_1110;
ASMBL_INSTRGRP["SUBQ"] = assemble_group_1110;
ASMBL_INSTRGRP["MOVEQ"] = assemble_group_1110;

function group_1110_base(_l, w0, _out, _opCode) {
    let ret = {op : w0, byteData:[]};
    if (asmbl_isEffectiveAddress(_l.arg1)) {
        if (_l.arg2) {
            asmbl_syntaxError(_l,"ea should have a single argument");
            return null;    
        }
        if (_l.instrSize != 2) {
            asmbl_syntaxError(_l,"ea is word only (.W)");
            return null;    
        }
        ret.op = _opCode[1];
        if (_l.instr[_l.instr.length-1] == 'L') ret.op |= 1<<8; // direction
        ret = wireByType03(_l.arg1, ret, _l);
        ret = asmbl_setMode(_l.arg1, ret.op, 3, 3, ret);    
    } else {
        ret.op = _opCode[0];
        if (asmbl_argIsDataReg(_l.arg1)) {
            ret.op = asmbl_setDataReg93(_l.arg1, ret.op); // register
            ret.op |= 1<<5; // i/r
        } else if (_l.arg1.type == 'imm') {
            // check needed at least for shifts
            if ((_l.arg1.value < 0) || (_l.arg1.value > 8)) {
                asmbl_syntaxError(_l,"syntax error: argument #1 must be between 1 and 8 (found: " + _l.arg1.value + ")", []);
                return null;
            }
            ret.op |= (_l.arg1.value & 7) << 9; // count
        } else {
            asmbl_syntaxError(_l,"syntax error", ["Dn,Dn","#<data>,Dn","ea"]);
            return null;
        }
        if (_l.instr[_l.instr.length-1] == 'L') ret.op |= 1<<8; // direction
        if (_l.instrSize == 2)  ret.op |= 0b01<<6; // size
        else if (_l.instrSize == 4)  ret.op |= 0b10<<6;
        ret.op = asmbl_setDataReg03(_l.arg2, ret.op, _l);
    }
    asmbl_buildArray(ret, _out);
    return _out;
}

function assemble_group_1110(_l, w0, _out) {
    w0 = asmbl_setSize(_l, w0);
    let ret = {op : w0, byteData:[]};
    switch (_l.instr){
        case "ASL":
        case "ASR":
        return group_1110_base(_l, w0, _out, [0b111<<13, 0b1110000011 << 6]);
        case "LSL":
        case "LSR": 
        return group_1110_base(_l, w0, _out, [(0b111<<13) | (1<<3), 0b1110001011 << 6]);
        case "ROL":
        case "ROR": 
        return group_1110_base(_l, w0, _out, [(0b111<<13) | (0b11<<3), 0b1110011011 << 6]);
        case "ROXL":
        case "ROXR": 
        return group_1110_base(_l, w0, _out, [(0b111<<13) | (1<<4), 0b1110010011 << 6]);
        case "ADDQ":
            ret.op |=  0b101 << 12;
            ret.op |= ((_l.arg1.value) & 0b111) << 9;
            ret = wireByType03(_l.arg2, ret, _l);
            ret = asmbl_setMode(_l.arg2, ret.op, 3, 3, ret);        
            asmbl_buildArray(ret, _out);
        return _out;
        case "SUBQ":
            ret.op |=  (0b101 << 12) | (1 << 8);
            ret.op |= ((_l.arg1.value) & 0b111) << 9;
            ret = wireByType03(_l.arg2, ret, _l);
            ret = asmbl_setMode(_l.arg2, ret.op, 3, 3, ret);        
            asmbl_buildArray(ret, _out);
        return _out;                
        case "MOVEQ":
            if (!asmbl_argIsDataReg(_l.arg2)) {asmbl_syntaxError(_l,"arg2 must be a data register", []); return null;}
            ret.op =  0b111 << 12;
            ret.op = asmbl_setDataReg93(_l.arg2, ret.op);
            ret.op |= _l.arg1.value & 0xff;
            asmbl_buildArray(ret, _out);
        return _out;                
        default:
            _l.Failed("instruction '" + _l.instr + "' is not handled by assemble_group_1110");
            debugger;
        return _out;        
   }
}