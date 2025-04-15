ASMBL_INSTRGRP["BRA"] = assemble_group_0110;
ASMBL_INSTRGRP["BCC"] = assemble_group_0110;
ASMBL_INSTRGRP["BCS"] = assemble_group_0110;
ASMBL_INSTRGRP["BEQ"] = assemble_group_0110;
ASMBL_INSTRGRP["BGE"] = assemble_group_0110;
ASMBL_INSTRGRP["BGT"] = assemble_group_0110;
ASMBL_INSTRGRP["BHI"] = assemble_group_0110;
ASMBL_INSTRGRP["BLE"] = assemble_group_0110;
ASMBL_INSTRGRP["BLS"] = assemble_group_0110;
ASMBL_INSTRGRP["BLT"] = assemble_group_0110;
ASMBL_INSTRGRP["BMI"] = assemble_group_0110;
ASMBL_INSTRGRP["BNE"] = assemble_group_0110;
ASMBL_INSTRGRP["BPL"] = assemble_group_0110;
ASMBL_INSTRGRP["BVC"] = assemble_group_0110;
ASMBL_INSTRGRP["BVS"] = assemble_group_0110;
ASMBL_INSTRGRP["BSR"] = assemble_group_0110;


function group_0110_base(_l, w0, _out, _opCode, _canBeLong) {
    let ret = {op : w0, byteData:[]};
    ret.op = _opCode;
    CODERPARSER_SINGLETON.labelToAddress.push({l:_l, dataStart:ret.byteData.length, dataLen:_l.instrSize, arg:_l.arg1});

    if (_l.instrSize == 1) {
        ret.op |= 0xDE; // temp dummy value to be replaced later
    } else if (_l.instrSize == 2) {
        ret.byteData.push(0xDE); // temp dummy value to be replaced later
        ret.byteData.push(0xAD);
    } else {
        if(!_canBeLong) {
            asmbl_syntaxError(_l, "Long offsets are not supported. Please use Jxx instead of Bxx", []);
            return null;
        }
        ret.op |= 0xff;
        ret.byteData.push(0xDE); // temp dummy value to be replaced later
        ret.byteData.push(0xAD);
        ret.byteData.push(0xBE);
        ret.byteData.push(0xEF);
    }
    asmbl_buildArray(ret, _out);
    return _out;
}

function ccToCode(_instr) {    
    switch (_instr){
        case "RA": return 0b0000;
        case "SR": return 0b0001;
        case "HI": return 0b0010;
        case "LS": return 0b0011;
        case "CC": return 0b0100;
        case "CS": return 0b0101;
        case "NE": return 0b0110;
        case "EQ": return 0b0111;
        case "VC": return 0b1000;
        case "VS": return 0b1001;
        case "PL": return 0b1010;
        case "MI": return 0b1011;
        case "GE": return 0b1100;
        case "LT": return 0b1101;
        case "GT": return 0b1110;
        case "LE": return 0b1111;
    }
    console.error("Bcc : condition code not recognized: " + _instr);
    return null;
}

function assemble_group_0110(_l, w0, _out) {
    w0 = asmbl_setSize(_l, w0);
    let syntax = [];
    switch (_l.instr){
        case "BRA":
        case "BCC":
        case "BCS":
        case "BEQ":
        case "BGE":
        case "BGT":
        case "BHI":
        case "BLE":
        case "BLS":
        case "BLT":
        case "BMI":
        case "BNE":
        case "BPL":
        case "BVC":
        case "BVS":
        case "BSR":
        return group_0110_base(_l, w0, _out, (0b11<<13) | (ccToCode(_l.instr.substr(1)) << 8), false);
        default:
            _l.Failed("instruction '" + _l.instr + "' is not handled by assemble_group_110");
            debugger;
        return _out;        
    }
}
