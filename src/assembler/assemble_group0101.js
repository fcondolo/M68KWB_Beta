ASMBL_INSTRGRP["DBF"] = assemble_group_0101;
ASMBL_INSTRGRP["DBRA"] = assemble_group_0101;
ASMBL_INSTRGRP["DBCC"] = assemble_group_0101;
ASMBL_INSTRGRP["DBCS"] = assemble_group_0101;
ASMBL_INSTRGRP["DBEQ"] = assemble_group_0101;
ASMBL_INSTRGRP["DBGE"] = assemble_group_0101;
ASMBL_INSTRGRP["DBGT"] = assemble_group_0101;
ASMBL_INSTRGRP["DBHI"] = assemble_group_0101;
ASMBL_INSTRGRP["DBLE"] = assemble_group_0101;
ASMBL_INSTRGRP["DBLS"] = assemble_group_0101;
ASMBL_INSTRGRP["DBLT"] = assemble_group_0101;
ASMBL_INSTRGRP["DBMI"] = assemble_group_0101;
ASMBL_INSTRGRP["DBNE"] = assemble_group_0101;
ASMBL_INSTRGRP["DBPL"] = assemble_group_0101;
ASMBL_INSTRGRP["DBVC"] = assemble_group_0101;
ASMBL_INSTRGRP["DBVS"] = assemble_group_0101;

ASMBL_INSTRGRP["SCC"] = assemble_group_0101_2;
ASMBL_INSTRGRP["SCS"] = assemble_group_0101_2;
ASMBL_INSTRGRP["SEQ"] = assemble_group_0101_2;
ASMBL_INSTRGRP["SGE"] = assemble_group_0101_2;
ASMBL_INSTRGRP["SGT"] = assemble_group_0101_2;
ASMBL_INSTRGRP["SHI"] = assemble_group_0101_2;
ASMBL_INSTRGRP["SLE"] = assemble_group_0101_2;
ASMBL_INSTRGRP["SLS"] = assemble_group_0101_2;
ASMBL_INSTRGRP["SLT"] = assemble_group_0101_2;
ASMBL_INSTRGRP["SMI"] = assemble_group_0101_2;
ASMBL_INSTRGRP["SNE"] = assemble_group_0101_2;
ASMBL_INSTRGRP["SPL"] = assemble_group_0101_2;
ASMBL_INSTRGRP["SVC"] = assemble_group_0101_2;
ASMBL_INSTRGRP["SVS"] = assemble_group_0101_2;


function group_0101_base(_l, w0, _out, _opCode, _canBeLong) {
    let ret = {op : w0, byteData:[]};
    ret.op = _opCode;
    ret.op = asmbl_setDataReg03(_l.arg1, ret.op);    
    let offset = NaN;
    if (_l.arg2.type == 'labl') {
        if (_l.instrSize == 1) offset = 0xDE;
        else if (_l.instrSize == 2) offset = 0xDEAD;
        else if (_l.instrSize == 4) offset = 0xDEADBEEF;
        CODERPARSER_SINGLETON.labelToAddress.push({l:_l, dataStart:ret.byteData.length, dataLen:_l.instrSize, arg:_l.arg2});
    } else offset = _l.arg2.value;
    if ((offset != 0) && (offset < 256) && (offset >= -256)) {
        ret.op |= offset;
        if (_l.instrSize != 1) asmbl_warning(_l, "switching branch to .b as offset is byte-sized");
        _l.instrSize = 1;
    } else if ((offset < 65536) && (offset >= -65536)) {
        ret.byteData.push(offset >> 8);
        ret.byteData.push(offset & 255);
        if (_l.instrSize != 2) asmbl_warning(_l, "switching branch to .w as offset is word-sized");
        _l.instrSize = 2;
    } else {
        if(!_canBeLong) {
            asmbl_syntaxError(_l, "Long offsets are not supported. Please use Jxx instead of Bxx", []);
            return null;
        }
        ret.op |= 0xff;
        ret.byteData.push((offset >> 24) & 255);
        ret.byteData.push((offset >> 16) & 255);
        ret.byteData.push((offset >> 8) & 255);
        ret.byteData.push(offset & 255);
        if (_l.instrSize != 4) asmbl_warning(_l, "switching branch to .l as offset is long-sized");
        _l.instrSize = 4;
    }
    asmbl_buildArray(ret, _out);
    return _out;
}


function assemble_group_0101(_l, w0, _out) {
    w0 = asmbl_setSize(_l, w0);
    switch (_l.instr){
        case "DBF":
            _l.instr = "DBRA";
        case "DBRA":
            return group_0101_base(_l, w0, _out, (0b101<<12) | (1 << 8) | (0b11001 << 3));
        case "DBCC":
        case "DBCS":
        case "DBEQ":
        case "DBGE":
        case "DBGT":
        case "DBHI":
        case "DBLE":
        case "DBLS":
        case "DBLT":
        case "DBMI":
        case "DBNE":
        case "DBPL":
        case "DBVC":
        case "DBVS":
        return group_0101_base(_l, w0, _out, (0b101<<12) | (ccToCode(_l.instr.substr(2)) << 8) | (0b11001 << 3));
        default:
            _l.Failed("instruction '" + _l.instr + "' is not handled by assemble_group_0101");
            debugger;
        return _out;        
    }
}

function assemble_group_0101_2(_l, w0, _out) {
    w0 = asmbl_setSize(_l, w0);
    switch (_l.instr){
        case "SCC":
        case "SCS":
        case "SEQ":
        case "SGE":
        case "SGT":
        case "SHI":
        case "SLE":
        case "SLS":
        case "SLT":
        case "SMI":
        case "SNE":
        case "SPL":
        case "SVC":
        case "SVS":
            let ret = {op : 0, byteData:[]};
            ret.op = (0b101 << 12) | (0b11 << 6);
            ret.op |= ccToCode(_l.instr.substr(1)) << 8;
            ret = wireByType03(_l.arg1, ret, _l);
            ret = asmbl_setMode(_l.arg1, ret.op, 3, 3, ret);        
            asmbl_buildArray(ret, _out);
        return _out;
        default:
            _l.Failed("instruction '" + _l.instr + "' is not handled by assemble_group_0101_2");
            debugger;
        return _out;        
    }
    return null;
}
