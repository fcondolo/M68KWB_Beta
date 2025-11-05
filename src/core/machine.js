/*
    MEMORY MAPPING:

    FROM                    TO                      USAGE
    
    0                       M68K_VECTORS_ZONE_SIZE  Interrupt vectors addresses (bus error, vbl interrupt on ST, etc.)
    M68K_VECTORS_ZONE_SIZE  maxCodeAdrs             code section
    maxCodeAdrs             ramIndex                data & bss sections (note: on OCS, all RAM is considered as CHIP)
    ram.length-stackSize    ram.length+stackSize/2  User Stack
    ram.length-stackSize/2  ram.length+stackSize    Super Stack
*/
var MACHINE = null;

/**
 * @class M68K_Machine
 * @classdesc Holds RAM, read/write to RAM and to custom registers
 */
class M68K_Machine {
    constructor(
        _ramSize        = 1024*1024,    // bytes to alloc for RAM
        _stackSize      = 4096,         // bytes for stack within allocated RAM
        _customUpdate   = null,         // callback to a platform-specific function to update chipset
        _constants      = null          // array of platform specific constants
    ) {
        let t           = this;        
        MACHINE         = t;      
        t.ramIndex      = 0;    // max data address allocated when assembling code (data and bss sections).
        t.maxCodeAdrs   = 0;    // max CODE address allocated when assembling code.
        t.ram           = new Uint8Array(_ramSize); // the RAM array
        t.ramIndex      = 0;
        t.stackSize     = _stackSize / 2;
        t.startUserStack= _ramSize - _stackSize;
        t.endUserStack  = t.startUserStack +  _stackSize / 2;
        t.startSuperStack = t.endUserStack;
        t.endSuperStack = t.endUserStack +  _stackSize / 2;
        t.customUpdate  = _customUpdate;
        t.constants     = _constants;
        t.super         = false;
        t.userIP        = 0;
        t.stop          = false;
        t.errorContext  = {cpu:null, ram:null, blitter:null, custom:null, file:null, line:null, script:null, user:null};
        t.lastBlitContext = null;   // debug info that persists after vlit is over
        t.bitplaneWeight = [1, 1, 1, 1, 1, 1]; // for debug purposes only. Used to switch on/off bitplanes
        DEBUGGER_AllocsList.push({ label: "Total RAM size", adrs: 0, size: _ramSize });
        t.ramIndex      = ASSEMBLER_CONFIG.CPU_CODE_SECTION_BYTES; // current alloc pointer (below = already allocated mem, above = free ram)
        CPU_CODE_SECTION= t.ram;
        t.allowBlitter = true;
        t.allowBlitterClearOnly = false;
    
    
        // put garbage in registers, having them all cleared is too easy...
        for (let i = 0; i < 8; i++) {
            regs.d[i] = NaN;
            regs.a[i] = NaN;
            DEBUGGER_saveReg[i * 2] = NaN;
            DEBUGGER_saveReg[i * 2 + 1] = NaN;
        }

        for (let i = 0; i < DEBUGGER_CONFIG.MAX_HW_BPT * 2; i++) {
            DEBUGGER_HWBpts[i] = -1;
        }
        

        // set default stack pointer
        regs.a[7] = t.endUserStack;
        t.superStack = t.endSuperStack;
    }


    getBitplaneWeight(_index) {
        let t = this;
        return t.bitplaneWeight[_index]
    }

    setBitplaneWeight(_index, _value = 0) {
        let t = this;
        if (_value) _value = 1; else _value = 0;
        t.bitplaneWeight[_index] = _value;
        t.customUpdate();
        imgDataToScreen();
    }

    enterSuper(_callback, _return) {
        let t = this;
        if (t.super) {
            return;
      //      debug(M68K_CURLINE.getFailString("already in supervisor mode"));
        }
        t.user_s = regs.s;
        t.user_m = regs.m;
        t.user_x = regs.x;
        t.user_n = regs.n;
        t.user_z = regs.z;
        t.user_v = regs.v;
        t.user_c = regs.c;
        t.user_sr = regs.sr;
        t.userIP = _return;
        t.super = true;
        t.userStack = regs.a[7];
        regs.a[7] = t.superStack;
        M68K_IP = _callback;
        M68K_NEXTIP = _callback;
    }
 
    exitSuper(_line) {
        let t = this;
        if (!t.super) {
            debug(_line.getFailString("RTE met while not in supervisor mode"));
        }
        if (regs.a[7] != t.endSuperStack) {
            debug(_line.getFailString("RTE met while supervisor stack is not empty"));
        }
        t.super = false;
        regs.s = t.user_s;
        regs.m = t.user_m;
        regs.x = t.user_x;
        regs.n = t.user_n;
        regs.z = t.user_z;
        regs.v = t.user_v;
        regs.c = t.user_c;
        regs.sr = t.user_sr;
        regs.a[7] = t.userStack;
        M68K_IP = t.userIP;
        M68K_NEXTIP = t.userIP;
        if (!t.userIP) {
            DBG_ExitASMBackToJS();
        }
    }

    allocRAM(_bytes, _align = 2, _label = null) {
        if ((_bytes <= 0) || isNaN(_bytes) || (_bytes == undefined)) {
            main_Alert("MACHINE.allocRAM: wrong '_bytes' param: " + _bytes);
            return 0;
        }
        let t = this;
        while (t.ramIndex % _align !== 0)
            t.ramIndex++;
        let ret = t.ramIndex;
        t.ramIndex += _bytes;
        if (t.ramIndex >= t.ram.length) {
            main_Alert("No more RAM! Can't allocate " + _bytes + " bytes.");
            debugger;
            return 0;
        }
        DEBUGGER_AllocsList.push({ label: _label, adrs: ret, size: _bytes });
        return ret;
    }

    makeDataEven() {
        let t = this;
        while ((t.ramIndex % 2) !== 0)
            t.ramIndex++;
    }
    

    getOutsideBoundaryDebugString(_v, _s, _f, _min, _max) {
        let t = this;
        let s = "";
        if (_v < _min) {
            s += "memory access below limit $" + _min.toString(16) + " ($" + (_min-_v).toString(16) + " bytes underflow)\n";
        } else if (_v + _s > _max) {
            s += "memory access beyond limit $" + _max.toString(16) + " ($" + (_v + _s - _max).toString(16) + " bytes overflow)\n";
        }
        s += t.getchkMemDebugString(_v, _s, _f);
        return s;
    }

    getUserStackDebugString() {
        let t = this;
        let s = "start stack: $" + t.startUserStack.toString(16);
        s += "<br>end stack: $" + t.endUserStack.toString(16);
        return s;
    }

    getSuperStackDebugString() {
        let t = this;
        let s = "start stack: $" + t.startSuperStack.toString(16);
        s += "<br>end stack: $" + t.endSuperStack.toString(16);
        return s;
    }

    getchkMemDebugString(_v,_s,_f) {
        let t = this;
        let s = "";
        if (_f == ALLOW_READ) s += "<br>reading ";
        else if (_f == ALLOW_WRITE) s += "<br>writing ";
        s += "$" + _s.toString(16) + " bytes at address $" + _v.toString(16);
        return s;
    }


    getErrorContexts(_reset = false) {
        let t = this;
        let r = "";
        if (t.errorContext.cpu) r += "CPU: " + t.errorContext.cpu + "\n";
        if (t.errorContext.ram) r += "RAM: " + t.errorContext.ram + "\n";
        if (t.errorContext.blitter) r += "Blitter: " + t.errorContext.blitter + "\n";
        if (t.errorContext.custom) r += "custom: " + t.errorContext.custom + "\n";
        if (t.errorContext.script) r += "script: " + t.errorContext.script + "\n";
        if (t.errorContext.user) r += "user: " + t.errorContext.user + "\n";

        if (_reset)
            t.resetErrorContexts();

        return r;
    }

    resetErrorContexts() {
        let t = this;
        t.errorContext.cpu = null;
        t.errorContext.ram = null;
        t.errorContext.blitter = null;
        t.errorContext.custom = null;
        t.errorContext.file = null;
        t.errorContext.line = null;
        t.errorContext.script = null;
        t.errorContext.user = null;
    }

    setFileLineContext() {
        let t = this;
        if (M68K_CURLINE) {
            t.errorContext.file = M68K_CURLINE.path;
            t.errorContext.line = M68K_CURLINE.line;
        } else {
            t.errorContext.file = null;
            t.errorContext.line = null;
        }
    }

    // _v : address
    // _s : size
    // _f : mode (read /write)
    // _w : written value
    // _o : allow write to odd address (for movep)
    // returns true if everything ok, false otherwise
    chkMem(_v, _s, _f, _w, _o = false) {
        if (!DEBUGGER_isParanoid()) 
            return true;
        _v &= 0xffffff; // 24 bit addressing
        let t = this;
        if (_s > 1 && _v & 1) { // word or long size on an odd address
            if (!_o) {
                let mess = "ODD address error<br>";
                mess += t.getchkMemDebugString(_v,_s,_f);
                t.errorContext.ram = mess;
                debug(null,true);
                MACHINE.stop = true;
                return false;
            }
        }
        if (_f == ALLOW_WRITE) {
            if (!CPU_isCustomAdrs(_v)) {
                let msg = null;
                if ((_v + _s) > CPU_DBG_WRITE_FORBID_START && _v < CPU_DBG_WRITE_FORBID_END) {
                    msg = "Writing in forbidden zone [CPU_DBG_WRITE_FORBID_START..CPU_DBG_WRITE_FORBID_END]\n";
                    msg += t.getOutsideBoundaryDebugString(_v, _s, _f, CPU_DBG_WRITE_FORBID_START, CPU_DBG_WRITE_FORBID_END);                    
                }
                if (_v < ASSEMBLER_CONFIG.CPU_CODE_SECTION_BYTES && _v >= M68K_VECTORS_ZONE_SIZE) {
                    msg = "Overwriting code section at $" + _v.toString(16);
                }
                if (t.super) {
                    if (_v >= t.endSuperStack) {
                        msg = "writing beyond allocated memory (from interrupt) at $" + _v.toString(16); + "\n";
                    }
                    else if (_v > t.ramIndex && _v < t.startSuperStack) {
                        msg = "writing beyond allocated memory (from interrupt) at $" + _v.toString(16); + "\n";
                    }
                } else {
                    if (_v >= t.endUserStack) {
                        msg = "writing beyond allocated memory at $" + _v.toString(16); + "\n";
                    }
                    else if (_v > t.ramIndex && _v < t.startUserStack) {
                        msg = "writing beyond allocated memory at $" + _v.toString(16); + "\n";
                    }
                }
                if (_v < CPU_DBG_WRITE_ALLOW_START || (_v + _s) > CPU_DBG_WRITE_ALLOW_END) {
                    // write to stack is allowed for branches (to push return address on stack) and move #x,-(sp)
                    let allowed = false;
                    if (_v == regs.a[7]) {
                        if (M68K_CURLINE.isBranchInstr) allowed = true; // branch instructions push return address on stack
                        else if (M68K_CURLINE.intentionallyWritingToStack) allowed = true;
                    }
                    if (!allowed) {
                        msg = "writing outside of [CPU_DBG_WRITE_ALLOW_START..CPU_DBG_WRITE_ALLOW_END]\n";
                        msg += t.getOutsideBoundaryDebugString(_v, _s, _f, CPU_DBG_WRITE_ALLOW_START, CPU_DBG_WRITE_ALLOW_END);
                    }
                }
                if (msg != null) {
                    debug(msg, true);
                    MACHINE.stop = true;
                    return false;
                }
            }

            
            if (DEBUGGER_VBpt[0] == _v) {
                const _at = _v;
                let r = NaN;
                switch (DEBUGGER_VBpt[2]) {
                    case 1: r = _w&0xff; break;
                    case 2: r = _w&0xffff; break;
                    case 4: r = _w; break;
                    default: break;
                }
                if (r == DEBUGGER_VBpt[1])
                    DEBUGGER_onValueBreakpointReached();
            }
        
            const min1 = _v;
            const max1 = _v + _s - 1;
            for (let i = 0; i < DEBUGGER_CONFIG.MAX_HW_BPT; i++) {
                const min2 = DEBUGGER_HWBpts[i*2];
                if (min2 >= 0) {
                    const max2 = min2 + DEBUGGER_HWBpts[i*2+1]-1;
                    if (min2 >= min1 && min2 <= max1) DEBUGGER_onHWBreakpointReached(i);
                    else if (min1 >= min2 && min1 <= max2) DEBUGGER_onHWBreakpointReached(i);    
                }
            }
        } else {
            if (CPU_DBG_READ_ALLOW_END > 0) {
                if (_v < CPU_DBG_READ_ALLOW_START || (_v + _s) > CPU_DBG_READ_ALLOW_END) {
                    // write to stack is allowed for branches (to push return address on stack ;))
                    if (_v == regs.a[7] && M68K_CURLINE.isBranchInstr) {
                        // allowed
                    } else if (_v != regs.a[7]) { // movem to stack
                        let msg = "reading  outside of CPU_DBG_READ_ALLOW_START and CPU_DBG_READ_ALLOW_END ";
                        msg += t.getOutsideBoundaryDebugString(_v, _s, _f, CPU_DBG_READ_ALLOW_START, CPU_DBG_READ_ALLOW_END);
                        debug(msg, true);
                        t.stop = true;
                        return false;
                    }
                }    
            }
        }
        return true;
    }   

    /**
    getRAMValue fetches a byte, word or long from a given address
    @param      {number} _at     -   'address' to read
    @param      {number} _size   -   bytes to read (1, 2 or 4).
    @param      {boolean}_signed :   true or false. Tells weather the read value should be signed or not
    @return     the value. Will return NaN if _size is not 1,2 or 4 (no exception or error thrown though)
    @throws     error if the address is invalid
    @throws     breakpoint if address infringes the CPU_DBG_READ_ALLOW_START/CPU_DBG_READ_ALLOW_END policy
    */
    getRAMValue(_at, _size, _signed) {
        let t = this;
        let r;
        let r32 = new Uint32Array(1); // avoid having negative numbers when grabbing 32 bits value with highet bit set
        _at &= 0xffffff; // 24 bit addressing
        if (!M68K_CURLINE || !M68K_CURLINE.isErrorImmune) {
            if (!t.chkMem(_at, _size, ALLOW_READ)) {
                if (!DEBUGGER_insideInvoke) {
                    if (CODERPARSER_SINGLETON)
                        CODERPARSER_SINGLETON.stopGlobalCompilation = true;                    
                    const msg = "Error seems to come from Javascript, or while assembling code, not asm execution. ";
                    alert(msg);
                    debugger;
                    throw new Error(msg);
                }
            }
        }
        DEBUGGER_lastReadAdrs = _at;
        if (CPU_isCustomAdrs(_at)) {
            switch (_size) {
                case 1: r32[0] = CPU_getCustom_B(_at - CPU_CUSTOM_START, _at & 0xff); break;
                case 2: r32[0] = CPU_getCustom_W(_at - CPU_CUSTOM_START, _at & 0xffff); break;
                case 4: r32[0] = CPU_getCustom_L(_at - CPU_CUSTOM_START, _at); break;
            }
        }
        else switch (_size) {
            case 1: r32[0] = t.ram[_at]; break;
            case 2: r32[0] = (t.ram[_at] << 8) + (t.ram[_at + 1]); break;
            case 4: r32[0] = (t.ram[_at] << 24) + (t.ram[_at + 1] << 16) + (t.ram[_at + 2] << 8) + (t.ram[_at + 3]); break;
            default: debugger; return NaN;
        }
        r = r32[0]; 
        if (_signed) {
            switch (_size) {
                case 1: if (r >= 128) r = r - 256; break;
                case 2: if (r >= 32768) r = r - 65536; break;
                case 4: if (r >= (1 << 31)) r = r - (1 << 32); break;
                default: debugger; return NaN;
            }
        }
        return r;
    }

    /**
    setRAMValue writes a byte, word or long to a given address
    @param      {number} _v      -   value to write
    @param      {number} _at     -   'address' to write to
    @param      {number} _size   -   bytes to write (1, 2 or 4).
    @return     _at + _size (so pointer incremented by size)
    @throws     error if the address is invalid
    @throws     breakpoint if address infringes the CPU_DBG_WRITE_ALLOW_START/CPU_DBG_WRITE_ALLOW_END policy
    @throws     breakpoint if address infringes the CPU_DBG_WRITE_FORBID_START/CPU_DBG_WRITE_FORBID_END policy
    */
    setRAMValue(_v, _at, _size) {
        let t = this;
    //    if ((_at <= DBGVAR.breakme) && (_at+_size > DBGVAR.breakme))
    //        debugger;
        _at &= 0xffffff; // 24 bit addressing
        if (DEBUGGER_isParanoid()) {
            if (_v % 1 !== 0) {
                let msg = "setRAMValue : Given value should be integer (found: " + _v + "). Please use Math.floor()";
                console.error(msg);
                main_Alert(msg);
                debugger;
            }
        }
        if (!M68K_CURLINE || !M68K_CURLINE.isErrorImmune) {
            if (!t.chkMem(_at, _size, ALLOW_WRITE, _v)) {
                if (!DEBUGGER_insideInvoke) {
                    if (CODERPARSER_SINGLETON)
                        CODERPARSER_SINGLETON.stopGlobalCompilation = true;
                    const msg = "Error seems to come from Javascript, or while assembling code, not asm execution. ";
                    debugger;
                    alert(msg);
                    throw new Error(msg);
                }
            }
        }
        if (TIME_MACHINE) {
            switch (_size) {
                case 1: TIME_MACHINE.onMemoryWrite(_at, t.ram[_at], 1); break;
                case 2: TIME_MACHINE.onMemoryWrite(_at, (t.ram[_at]<<8)|t.ram[_at+1], 2); break;
                case 4: TIME_MACHINE.onMemoryWrite(_at, (t.ram[_at]<<24)|(t.ram[_at+1]<<16)|(t.ram[_at+2]<<8)|t.ram[_at+3], 4); t.ram[_at] = (_v >>> 24) & 0xff; t.ram[_at + 1] = (_v >>> 16) & 0xff; break;
            }        
        }
        DEBUGGER_lastWrittenAdrs = _at;
        if (CPU_isCustomAdrs(_at)) {
            switch (_size) {
                case 1: CPU_setCustom_B(_at - CPU_CUSTOM_START, _v & 0xff); break;
                case 2: CPU_setCustom_W(_at - CPU_CUSTOM_START, _v & 0xffff); break;
                case 4: CPU_setCustom_L(_at - CPU_CUSTOM_START, _v); break;
            }
        }
        else {            
            switch (_size) {
                case 1: t.ram[_at] =  _v & 0xff; break;
                case 2: t.ram[_at] = (_v >>> 8) & 0xff; t.ram[_at + 1] = _v & 0xff; break;
                case 4: t.ram[_at] = (_v >>> 24) & 0xff; t.ram[_at + 1] = (_v >>> 16) & 0xff; t.ram[_at + 2] = (_v >>> 8) & 0xff; t.ram[_at + 3] = _v & 0xff; break;
            }    
            if (_at < M68K_VECTORS_ZONE_SIZE) {
                this.OnVectorWritten(_v, _at, _size);
            }
        }
        return _at + _size;
    }

    isStackOver(_includeStart) {
        let t = this;
        if (t.super) {
            if (_includeStart) return regs.a[7] > t.endSuperStack;
            return regs.a[7] >= t.endSuperStack;
        } else {
            if (_includeStart) return regs.a[7] > t.endUserStack;
            return regs.a[7] >= t.endUserStack;
        }
    }

    isVBLAllowed() {
        switch (FX_INFO.platform) {
            case "OCS" : return true;
            case "ST" : return regs.sr != $2700;
            case "STE" : return regs.sr != $2700;
        }
        return true;
    }
    
    getResolution() {
        let w,h;
        switch (FX_INFO.platform) {
            case "OCS" : w=320; h=PLAYFIELD_LINES_COUNT; break;
            case "ST" : w=320; h=200; break;
            case "STE" : w=320; h=200; break;
        }
        return {w:w, h:h};
    }

    allowBlt(_blitter) {
        let t = this;
        t.allowBlitter = _blitter;
    }

    allowBltClr(_blitter) {
        let t = this;
        t.allowBlitterClearOnly = _blitter;
    }
}
  