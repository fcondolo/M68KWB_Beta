var TIME_MACHINE = null;

class M68K_TimeMachine {
    constructor(
    ) {
        let t = this;

        // check if the time_machine option is present and correct in config.js
        if (
            (!ASSEMBLER_CONFIG.time_machine) ||
            isNaN(ASSEMBLER_CONFIG.time_machine) ||
            (ASSEMBLER_CONFIG.time_machine <= 0) 
        ) {
            return;
        }

        // check for singleton uniqueness
        if (TIME_MACHINE != null) {
            alert("Error: Time Machine already created");
            debugger;
            return;
        }

        t.len               = ASSEMBLER_CONFIG.time_machine;
        t.entries           = new Array(t.len);
        t.paused            = false;
        t.nextWriteIndex    = 0;
        t.curReplayIndex    = 0;
        t.entryType_CPU     = 1;
        t.entryType_MEM     = 2;
        TIME_MACHINE        = t;
    }

    saveRegs(e) {
        e[0] = regs.d[0];
        e[1] = regs.d[1];
        e[2] = regs.d[2];
        e[3] = regs.d[3];
        e[4] = regs.d[4];
        e[5] = regs.d[5];
        e[6] = regs.d[6];
        e[7] = regs.d[7];
        e[8] = regs.a[0];
        e[9] = regs.a[1];
        e[10] = regs.a[2];
        e[11] = regs.a[3];
        e[12] = regs.a[4];
        e[13] = regs.a[5];
        e[14] = regs.a[6];
        e[15] = regs.a[7];
        e[16] = M68K_IP;
        e[17] = regs.x;
        e[18] = regs.n;
        e[19] = regs.z;
        e[20] = regs.v;
        e[21] = regs.c;
    }

    restoreRegs(e) {
        regs.d[0] = e[0];
        regs.d[1] = e[1];
        regs.d[2] = e[2];
        regs.d[3] = e[3];
        regs.d[4] = e[4];
        regs.d[5] = e[5];
        regs.d[6] = e[6];
        regs.d[7] = e[7];
        regs.a[0] = e[8];
        regs.a[1] = e[9];
        regs.a[2] = e[10];
        regs.a[3] = e[11];
        regs.a[4] = e[12];
        regs.a[5] = e[13];
        regs.a[6] = e[14];
        regs.a[7] = e[15];
        M68K_IP = e[16];
        regs.x = e[17];
        regs.n = e[18];
        regs.z = e[19];
        regs.v = e[20];
        regs.c = e[21];
    }

    onCPUInstr() {
        let t = this;
        if (t.paused)
            return;

        let e = new Uint32Array(22);
        t.saveRegs(e);
        t.entries[t.nextWriteIndex] = {type:t.entryType_CPU, val:e};
        t.curReplayIndex = t.nextWriteIndex;
        t.nextWriteIndex = (t.nextWriteIndex + 1) % t.len;
    }

    onMemoryWrite(_adrs, _val, _size) {
        let t = this;
        if (t.paused)
            return;

        let e = new Uint32Array(25);
        e[22] = _adrs;
        e[23] = _val;
        e[24] = _size;
        t.saveRegs(e);
        t.entries[t.nextWriteIndex] = {type:t.entryType_MEM, val:e};
        t.curReplayIndex = t.nextWriteIndex;
        t.nextWriteIndex = (t.nextWriteIndex + 1) % t.len;
    }

    traceForwards() {
        let t = this;
        if (t.isPresent()) {
            alert("Time machine: can't go further in the future");
            return;
        }
        t.curReplayIndex = (t.curReplayIndex + 1) % t.len;
        t.jump(t.curReplayIndex);
    }
    
    traceBackwards() {
        let t = this;
        if (t.curReplayIndex == 0)
            t.curReplayIndex = t.len - 1;
        else
            t.curReplayIndex--;
        t.jump(t.curReplayIndex);
    }

    restorePresent() {
        let t = this;
        let target = t.curReplayIndex;
        while(target != t.nextWriteIndex) {
            t.jump(target);
            target = (target + 1) % t.len;
        }
        t.curReplayIndex = target;
    }

    isPresent() {
        let t = this;
        let pres = t.nextWriteIndex - 1;
        if (pres < 0) pres = t.len-1;
        return (t.curReplayIndex == pres);
    }

    jump(target) {
        let t = this;
        if (target == t.nextWriteIndex) {
            alert("Time machine: can't go there");
            return;
        }
        t.curReplayIndex = target;
        const e = t.entries[t.curReplayIndex];

        switch(e.type) {
            case t.entryType_CPU:
            break;
            case t.entryType_MEM:
            {
                const a = e.val[22];
                const v = e.val[23];
                switch(e.val[24]) {
                    case 1:
                        MACHINE.ram[a] =  v & 0xff;                                
                    break;
                    case 2:
                        MACHINE.ram[a] = (v >> 8) & 0xff;
                        MACHINE.ram[a + 1] = v & 0xff;
                    break;
                    case 4:
                        MACHINE.ram[a] = (v >> 24) & 0xff;
                        MACHINE.ram[a + 1] = (v >> 16) & 0xff;
                        MACHINE.ram[a + 2] = (v >> 8) & 0xff;
                        MACHINE.ram[a + 3] = v & 0xff;
                    break;
                    default:
                        alert("Time machine: inconsistent data");
                    return;
                }
            }
            break;
            default:
                alert("Time machine: reached uninitialized point");
            return;
        }
        t.restoreRegs(e.val);
        DEBUGGER_onTimeMachine();
    }

}
  