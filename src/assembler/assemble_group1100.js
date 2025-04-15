ASMBL_INSTRGRP["EXG"] = assemble_group_1100;
ASMBL_INSTRGRP["AND"] = assemble_group_1100;
ASMBL_INSTRGRP["OR"] = assemble_group_1100;


function assemble_group_1100(_l, w0, _out) {
    w0 = asmbl_setSize(_l, w0);
    switch (_l.instr){
        case "EXG": {
            _l.instrSize = 4;
            w0 = 0b11000001<<8; // intentionally erases size.
            if (asmbl_argIsDataReg(_l.arg1) && asmbl_argIsDataReg(_l.arg2)) w0 |= 0b01000<<3;
            else if (asmbl_argIsAdrsReg(_l.arg1) && asmbl_argIsAdrsReg(_l.arg2)) w0 |= 0b01001<<3;
            else if (asmbl_argIsDataReg(_l.arg1) && asmbl_argIsAdrsReg(_l.arg2)) w0 |= 0b10001<<3;
            else {asmbl_syntaxError(_l,"EXG: invalid arguments", ["EXG Dn,Dn","EXG An,An","EXG Dn,An"]); return null;}
            let _ret = {op : w0, byteData:[]};
            _ret = wireByType03(_l.arg2, _ret, _l);
            _ret = wireByType93(_l.arg1, _ret, _l);
            asmbl_buildArray(_ret, _out);
        }
        return _out;

        case "AND": {
            if (_l.arg1.type=='imm') {
                _l.instr = "ANDI";
                return assemble_group_0000(_l, w0, _out);
            }
            w0 = 0b11<<14; // intentionally erases size.
            let _ret = {op : w0, byteData:[]};
            if (asmbl_argIsDataReg(_l.arg2)) {
                _ret.op = asmbl_setDataReg93(_l.arg2, _ret.op);
                _ret = wireByType03(_l.arg1, _ret, _l);
                _ret = asmbl_setMode(_l.arg1, _ret.op, 3, 3, _ret);
                if (_l.instrSize == 2) _ret.op |= 0b1<<6;
                else _ret.op |= 0b10<<6;
            } else {
                _ret.op = asmbl_setDataReg93(_l.arg1, _ret.op);
                _ret = wireByType03(_l.arg2, _ret, _l);
              _ret = asmbl_setMode(_l.arg2, _ret.op, 3, 3, _ret);
                if (_l.instrSize == 1) _ret.op |= 0b100<<6;
                else if (_l.instrSize == 2) _ret.op |= 0b101<<6;
                else _ret.op |= 0b110<<6;
            }
            asmbl_buildArray(_ret, _out);
        }
        return _out;
 
        case "OR": {
            if (_l.arg1.type=='imm') {
                _l.instr = "ORI";
                return assemble_group_0000(_l, w0, _out);
            }
            w0 = 1<<15; // intentionally erases size.
            let _ret = {op : w0, byteData:[]};
            if (asmbl_argIsDataReg(_l.arg2)) {
                _ret.op = asmbl_setDataReg93(_l.arg2, _ret.op);
                _ret = wireByType03(_l.arg1, _ret, _l);
                _ret = asmbl_setMode(_l.arg1, _ret.op, 3, 3, _ret);
                if (_l.instrSize == 2) _ret.op |= 0b1<<6;
                else _ret.op |= 0b10<<6;
            } else {
                _ret.op = asmbl_setDataReg93(_l.arg1, _ret.op);
                _ret = wireByType03(_l.arg2, _ret, _l);
              _ret = asmbl_setMode(_l.arg2, _ret.op, 3, 3, _ret);
                if (_l.instrSize == 1) _ret.op |= 0b100<<6;
                else if (_l.instrSize == 2) _ret.op |= 0b101<<6;
                else _ret.op |= 0b110<<6;
            }
            asmbl_buildArray(_ret, _out);
        }
        return _out;
        default:
            _l.Failed("instruction '" + _l.instr + "' is not handled by assemble_group_1100");
            debugger;
        return _out;        
    }
}