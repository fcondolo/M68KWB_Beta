// https://www.thedigitalcatonline.com/blog/2019/03/04/motorola-68000-addressing-modes/

// LARGE PARTS TAKEN AND ADAPTED FROM A RUST IMPLEMENTATION:
// https://github.com/deplinenoise/m68kdecode/tree/master by Andreas Fredriksson

var DISASSEMBLY_OPS = [];

const REGISTER_D0         = 0b0000;
const REGISTER_D1         = 0b0001;
const REGISTER_D2         = 0b0010;
const REGISTER_D3         = 0b0011;
const REGISTER_D4         = 0b0100;
const REGISTER_D5         = 0b0101;
const REGISTER_D6         = 0b0110;
const REGISTER_D7         = 0b0111;

function disassemble(_mem, _ofs) {
    const word1 = MACHINE.getRAMValue(_mem[_ofs]);
    return DISASSEMBLY_OPS[word1]();
}

function disam_getRegName(_code) {
    switch(_code) {
        case REGISTER_D0 : return"0";
        case REGISTER_D1 : return"1";
        case REGISTER_D2 : return"2";
        case REGISTER_D3 : return"3";
        case REGISTER_D4 : return"4";
        case REGISTER_D5 : return"5";
        case REGISTER_D6 : return"6";
        case REGISTER_D7 : return"7";
        default:
        runtimeError68k("assembler error: can't determine used data register");
        debugger; 
        break;
    }
  
}

const Operation = {
    ANDITOCCR : 1,
    ANDITOSR : 2,
    EORITOCCR : 3,
    EORITOSR : 4,
    ORITOCCR : 5,
    ORITOSR: 6,
    MOVEP : 7,
    BTST : 8,
    BCHG : 9,
    BCLR : 10,
    BSET : 11,
    RTM : 12,
    CALLM : 13,
    ADDI : 14,
    SUBI : 15,
    ANDI : 16,
    ORI : 17,
    CMP2 : 18,
    CHK2 : 19,
    EORI : 20,
    CMPI : 21,
    MOVES : 22,
    MOVE : 23,
    MOVEA : 24,
    BGND : 25,
    ILLEGAL : 26,
    NOP : 27,
    RESET : 28,
    RTD : 29,
    RTE : 30,
    RTR : 31,
    RTS : 32,
    STOP : 33,
    TRAPV : 34,
    MOVEC : 35,
    SWAP : 36,
    BKPT : 37,
    EXTW : 38,
    EXTL : 39,
    EXTBL : 40,
    LEA : 41,
    LINK : 42,
    UNLK : 43,
    TRAP : 44,
    DIVSL : 45,
    DIVSLL : 46,
    DIVUL : 47,
    DIVULL : 48,
    JMP : 49,
    JSR : 50,
    MULS : 51,
    MULU : 52,
    NBCD : 53,
    MOVEFROMSR : 54,
    MOVETOSR : 55,
    MOVETOUSP : 56,
    MOVEFROMUSP : 57,
    MOVEFROMCCR : 58,
    MOVETOCCR : 59,
    PEA : 60,
    TAS : 61,
    MOVEM : 62,
    CLR : 63,
    NEG : 64,
    NEGX : 65,
    NOT : 66,
    TST : 67,
    CHK : 68,
    DBCC : 69,
    ADDQ : 70,
    SUBQ : 71,
    TRAPCC : 72,
    SCC : 73,
    BRA : 74,
    BSR : 75,
    BCC : 76,
    MOVEQ : 77,
    PACK : 78,
    UNPK : 79,
    SBCD : 80,
    DIVS : 81,
    DIVU : 82,
    OR : 83,
    SUBX : 84,
    SUB : 85,
    SUBA : 86,
    CMPA : 87,
    CMPM : 88,
    CMP : 89,
    EOR : 90,
    ABCD : 91,
    EXG : 92,
    AND : 93,
    ADDX : 94,
    ADD : 95,
    ADDA : 96,
    BFCHG : 97,
    BFCLR : 98,
    BFEXTS : 99,
    BFEXTU : 100,
    BFFFO : 101,
    BFINS : 102,
    BFSET : 103,
    BFTST : 104,
    ASL : 105,
    ASR : 106,
    LSL : 107,
    LSR : 108,
    ROXL : 109,
    ROXR : 110,
    ROL : 111,
    ROR : 112,
    FMOVECR : 113,
    FABS : 114,
    FSABS : 115,
    FDABS : 116,
    FACOS : 117,
    FADD : 118,
    FSADD : 119,
    FDADD : 120,
    FASIN : 121,
    FATAN : 122,
    FATANH : 123,
    FNOP : 124,
    FBCC : 125,
    FCMP : 126,
    FCOS : 127,
    FCOSH : 128,
    FDBCC : 129,
    FDIV : 130,
    FSDIV : 131,
    FDDIV : 132,
    FETOX : 133,
    FETOXM1 : 134,
    FGETEXP : 135,
    FGETMAN : 136,
    FINT : 137,
    FINTRZ : 138,
    FLOG10 : 139,
    FLOG2 : 140,
    FLOGN : 141,
    FLOGNP1 : 142,
    FMOD : 143,
    FMOVE : 144,
    FSMOVE : 145,
    FDMOVE : 146,
    FMOVEM : 147,
    FMUL : 148,
    FSMUL : 149,
    FDMUL : 150,
    FNEG : 151,
    FSNEG : 152,
    FDNEG : 153,
    FREM : 154,
    FSCALE : 155,
    FTRAPCC : 156,
    FSCC : 157,
    FSGLDIV : 158,
    FSGLMUL : 159,
    FSIN : 160,
    FSINCOS : 161,
    FSINH : 162,
    FSQRT : 163,
    FSSQRT : 164,
    FDSQRT : 165,
    FSUB : 166,
    FSSUB : 167,
    FDSUB : 168,
    FTAN : 169,
    FTANH : 170,
    FTENTOX : 171,
    FTST : 172,
    FTWOTOX : 173,
};

function decode_group_0000(w0, cs, _adrs) {
    if ((w0 & 0b1111111111111111) == 0b0000001000111100) {
        let sz = 1;
        let src = cs.imm8();
        let dst = OperandType.Implied;
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ANDITOCCR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111111111) == 0b0000001001111100) {
        let sz = 2;
        let src = cs.imm16();
        let dst = OperandType.Implied;
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ANDITOSR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111111111) == 0b0000101000111100) {
        let sz = 1;
        let src = cs.imm8();
        let dst = OperandType.Implied;
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.EORITOCCR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111111111) == 0b0000101001111100) {
        let sz = 2;
        let src = cs.imm16();
        let dst = OperandType.Implied;
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.EORITOSR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111111111) == 0b0000000000111100) {
        let sz = 1;
        let src = cs.imm8();
        let dst = OperandType.Implied;
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ORITOCCR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111111111) == 0b0000000001111100) {
        let sz = 2;
        let src = cs.imm16();
        let dst = OperandType.Implied;
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ORITOSR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000110111000) == 0b0000000100001000) {
        let d = get_bits(w0, 9, 3);
        let s = get_bits(w0, 6, 1);
        let a = get_bits(w0, 0, 3);
        let sz = 1 << (s + 1);
        let src = cs.ea(a, 0b101, s);
        let dst = cs.data_reg_op(d);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.MOVEP,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000110111000) == 0b0000000110001000) {
        let d = get_bits(w0, 9, 3);
        let s = get_bits(w0, 6, 1);
        let a = get_bits(w0, 0, 3);
        let sz = 1 << (s + 1);
        let src = new Operand(OperandType.DR, cs.data_reg(d));
        let dst = cs.ea(a, 0b101, s);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.MOVEP,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b0000000100000000) {
        let d = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 1;    
        let src = cs.data_reg_op(d);
        let dst = cs.ea(r, m, 2);
        if (dst.type == OperandType.DR) sz = 4;
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.BTST,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b0000000101000000) {
        let d = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 1;
        let src = cs.data_reg_op(d);
        let dst = cs.ea(r, m, 4);
        if (dst.type == OperandType.DR) sz = 4;
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.BCHG,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b0000000110000000) {
        let d = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 1;
        let src = cs.data_reg_op(d);
        let dst = cs.ea(r, m, 4);
        if (dst.type == OperandType.DR) sz = 4;
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.BCLR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b0000000111000000) {
        let d = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 1;
        let src = cs.data_reg_op(d);
        let dst = cs.ea(r, m, 4);
        if (dst.type == OperandType.DR) sz = 4;
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.BSET,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b0000100000000000 && cs.has_words(1)) {
        let w1 = cs.peek_word(0);
        if ((w1 & 0b1111111000000000) == 0b0000000000000000) {
            let m = get_bits(w0, 3, 3);
            let r = get_bits(w0, 0, 3);
            let n = get_bits(w1, 0, 9);
            cs.skip_words(1);
            let sz = 1;
            let src = new Operand(OperandType.IMM16, n);
            let dst = cs.ea(r, m, 1);
            if (dst.type == OperandType.DR) sz = 4;
            let extra = NoExtra;
            return cs.check_overflow(new Instruction (
                sz,
                Operation.BTST,
                [src, dst],
                extra
            ));
        }
    }
    if ((w0 & 0b1111111111000000) == 0b0000100001000000 && cs.has_words(1)) {
        let w1 = cs.peek_word(0);
        if ((w1 & 0b1111111000000000) == 0b0000000000000000) {
            let m = get_bits(w0, 3, 3);
            let r = get_bits(w0, 0, 3);
            let n = get_bits(w1, 0, 9);
            cs.skip_words(1);
            let sz = 1;
            let src = new Operand(OperandType.IMM16, n);
            let dst = cs.ea(r, m, 1);
            if (dst.type == OperandType.DR) sz = 4;
            let extra = NoExtra;
            return cs.check_overflow(new Instruction (
                sz,
                Operation.BCHG,
                [src, dst],
                extra
            ));
        }
    }
    if ((w0 & 0b1111111111000000) == 0b0000100010000000 && cs.has_words(1)) {
        let w1 = cs.peek_word(0);
        if ((w1 & 0b1111111000000000) == 0b0000000000000000) {
            let m = get_bits(w0, 3, 3);
            let r = get_bits(w0, 0, 3);
            let n = get_bits(w1, 0, 9);
            cs.skip_words(1);
            let sz = 1;
            let src = new Operand(OperandType.IMM16, n);
            let dst = cs.ea(r, m, 1);
            if (dst.type == OperandType.DR) sz = 4;
            let extra = NoExtra;
            return cs.check_overflow(new Instruction (
                sz,
                Operation.BCLR,
                [src, dst],
                extra
            ));
        }
    }
    if ((w0 & 0b1111111111000000) == 0b0000100011000000 && cs.has_words(1)) {
        let w1 = cs.peek_word(0);
        if ((w1 & 0b1111111000000000) == 0b0000000000000000) {
            let m = get_bits(w0, 3, 3);
            let r = get_bits(w0, 0, 3);
            let n = get_bits(w1, 0, 9);
            cs.skip_words(1);
            let sz = 1;
            let src = new Operand(OperandType.IMM16, n);
            let dst = cs.ea(r, m, 1);
            if (dst.type == OperandType.DR) sz = 4;
            let extra = NoExtra;
            return cs.check_overflow(new Instruction (
                sz,
                Operation.BSET,
                [src, dst],
                extra
            ));
        }
    }
    if ((w0 & 0b1111111111110000) == 0b0000011011000000) {
        let d = get_bits(w0, 3, 1);
        let r = get_bits(w0, 0, 3);
        let sz = 0;
        let src = cs.dar(d, r);
        let dst = OperandType.NoOperand;
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.RTM,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b0000011011000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 0;
        let src = cs.imm8();
        let dst = cs.ea(r, m, 0);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.CALLM,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b0000011000000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 1;
        let src = cs.imm8();
        let dst = cs.ea(r, m, 1);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ADDI,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b0000011001000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = cs.imm16();
        let dst = cs.ea(r, m, 2);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ADDI,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b0000011010000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = cs.imm32();
        let dst = cs.ea(r, m, 4);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ADDI,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b0000010000000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 1;
        let src = cs.imm8();
        let dst = cs.ea(r, m, 1);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.SUBI,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b0000010001000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = cs.imm16();
        let dst = cs.ea(r, m, 2);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.SUBI,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b0000010010000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = cs.imm32();
        let dst = cs.ea(r, m, 4);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.SUBI,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b0000001000000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 1;
        let src = cs.imm8();
        let dst = cs.ea(r, m, 1);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ANDI,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b0000001001000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = cs.imm16();
        let dst = cs.ea(r, m, 2);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ANDI,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b0000001010000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = cs.imm32();
        let dst = cs.ea(r, m, 4);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ANDI,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b0000000000000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 1;
        let src = cs.imm8();
        let dst = cs.ea(r, m, 1);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ORI,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b0000000001000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = cs.imm16();
        let dst = cs.ea(r, m, 2);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ORI,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b0000000010000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = cs.imm32();
        let dst = cs.ea(r, m, 4);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ORI,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111100111000000) == 0b0000000011000000 && cs.has_words(1)) {
        let w1 = cs.peek_word(0);
        if ((w1 & 0b0000111111111111) == 0b0000000000000000) {
            let s = get_bits(w0, 9, 2);
            let m = get_bits(w0, 3, 3);
            let r = get_bits(w0, 0, 3);
            let a = get_bits(w1, 15, 1);
            let d = get_bits(w1, 12, 3);
            cs.skip_words(1);
            let sz = 1 << s;
            let src = cs.ea(r, m, sz);
            let dst = cs.dar(a, d);
            let extra = NoExtra;
            return cs.check_overflow(new Instruction (
                sz,
                Operation.CMP2,
                [src, dst],
                extra
            ));
        }
    }
    if ((w0 & 0b1111100111000000) == 0b0000000011000000 && cs.has_words(1)) {
        let w1 = cs.peek_word(0);
        if ((w1 & 0b0000111111111111) == 0b0000100000000000) {
            let s = get_bits(w0, 9, 2);
            let m = get_bits(w0, 3, 3);
            let r = get_bits(w0, 0, 3);
            let a = get_bits(w1, 15, 1);
            let d = get_bits(w1, 12, 3);
            cs.skip_words(1);
            let sz = 1 << s;
            let src = cs.ea(r, m, sz);
            let dst = cs.dar(a, d);
            let extra = NoExtra;
            return cs.check_overflow(new Instruction (
                sz,
                Operation.CHK2,
                [src, dst],
                extra
            ));
        }
    }
    if ((w0 & 0b1111111111000000) == 0b0000101000000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 1;
        let src = cs.imm8();
        let dst = cs.ea(r, m, 1);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.EORI,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b0000101001000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = cs.imm16();
        let dst = cs.ea(r, m, 2);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.EORI,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b0000101010000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = cs.imm32();
        let dst = cs.ea(r, m, 4);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.EORI,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b0000110000000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 1;
        let src = cs.imm8();
        let dst = cs.ea(r, m, 1);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.CMPI,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b0000110001000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = cs.imm16();
        let dst = cs.ea(r, m, 2);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.CMPI,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b0000110010000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = cs.imm32();
        let dst = cs.ea(r, m, 4);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.CMPI,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b0000111000000000 && cs.has_words(1)) {
        let w1 = cs.peek_word(0);
        if ((w1 & 0b0000111111111111) == 0b0000000000000000) {
            let m = get_bits(w0, 3, 3);
            let r = get_bits(w0, 0, 3);
            let a = get_bits(w1, 15, 1);
            let d = get_bits(w1, 12, 3);
            cs.skip_words(1);
            let sz = 1;
            let dst = cs.dar(a, d);
            let src = cs.ea(r, m, 1);
            let extra = NoExtra;
            return cs.check_overflow(new Instruction (
                sz,
                Operation.MOVES,
                [src, dst],
                extra
            ));
        }
    }
    if ((w0 & 0b1111111111000000) == 0b0000111001000000 && cs.has_words(1)) {
        let w1 = cs.peek_word(0);
        if ((w1 & 0b0000111111111111) == 0b0000000000000000) {
            let m = get_bits(w0, 3, 3);
            let r = get_bits(w0, 0, 3);
            let a = get_bits(w1, 15, 1);
            let d = get_bits(w1, 12, 3);
            cs.skip_words(1);
            let sz = 2;
            let dst = cs.dar(a, d);
            let src = cs.ea(r, m, 2);
            let extra = NoExtra;
            return cs.check_overflow(new Instruction (
                sz,
                Operation.MOVES,
                [src, dst],
                extra
            ));
        }
    }
    if ((w0 & 0b1111111111000000) == 0b0000111010000000 && cs.has_words(1)) {
        let w1 = cs.peek_word(0);
        if ((w1 & 0b0000111111111111) == 0b0000000000000000) {
            let m = get_bits(w0, 3, 3);
            let r = get_bits(w0, 0, 3);
            let a = get_bits(w1, 15, 1);
            let d = get_bits(w1, 12, 3);
            cs.skip_words(1);
            let sz = 4;
            let dst = cs.dar(a, d);
            let src = cs.ea(r, m, 4);
            let extra = NoExtra;
            return cs.check_overflow(new Instruction (
                sz,
                Operation.MOVES,
                [src, dst],
                extra
            ));
        }
    }
    if ((w0 & 0b1111111111000000) == 0b0000111000000000 && cs.has_words(1)) {
        let w1 = cs.peek_word(0);
        if ((w1 & 0b0000111111111111) == 0b0000100000000000) {
            let m = get_bits(w0, 3, 3);
            let r = get_bits(w0, 0, 3);
            let a = get_bits(w1, 15, 1);
            let d = get_bits(w1, 12, 3);
            cs.skip_words(1);
            let sz = 1;
            let src = cs.dar(a, d);
            let dst = cs.ea(r, m, 1);
            let extra = NoExtra;
            return cs.check_overflow(new Instruction (
                sz,
                Operation.MOVES,
                [src, dst],
                extra
            ));
        }
    }
    if ((w0 & 0b1111111111000000) == 0b0000111001000000 && cs.has_words(1)) {
        let w1 = cs.peek_word(0);
        if ((w1 & 0b0000111111111111) == 0b0000100000000000) {
            let m = get_bits(w0, 3, 3);
            let r = get_bits(w0, 0, 3);
            let a = get_bits(w1, 15, 1);
            let d = get_bits(w1, 12, 3);
            cs.skip_words(1);
            let sz = 2;
            let src = cs.dar(a, d);
            let dst = cs.ea(r, m, 2);
            let extra = NoExtra;
            return cs.check_overflow(new Instruction (
                sz,
                Operation.MOVES,
                [src, dst],
                extra
            ));
        }
    }
    if ((w0 & 0b1111111111000000) == 0b0000111010000000 && cs.has_words(1)) {
        let w1 = cs.peek_word(0);
        if ((w1 & 0b0000111111111111) == 0b0000100000000000) {
            let m = get_bits(w0, 3, 3);
            let r = get_bits(w0, 0, 3);
            let a = get_bits(w1, 15, 1);
            let d = get_bits(w1, 12, 3);
            cs.skip_words(1);
            let sz = 4;
            let src = cs.dar(a, d);
            let dst = cs.ea(r, m, 4);
            let extra = NoExtra;
            return cs.check_overflow(new Instruction (
                sz,
                Operation.MOVES,
                [src, dst],
                extra
            ));
        }
    }
    if ((w0 & 0b1111111111110000) == 0b0000011011000000) {
        let a = get_bits(w0, 3, 1);
        let r = get_bits(w0, 0, 3);
        let sz = 0;
        let src = cs.dar(a, r);
        let dst = OperandType.NoOperand;
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.RTM,
            [src, dst],
            extra
        ));
    }
    debugger;
    console.error("DecodingError::NotImplemented");
    runtimeError68k("assembler error: wrong opcode at ofs " + _adrs);
}

function decode_group_0001(w0, cs, _adrs) {
    if ((w0 & 0b1111000000000000) == 0b0001000000000000) {
        let R = get_bits(w0, 9, 3);
        let M = get_bits(w0, 6, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 1;
        let src = cs.ea(r, m, 1);
        let dst = cs.ea(R, M, 1);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.MOVE,
            [src, dst],
            extra
        ));
    }
    debugger;
    console.error("DecodingError::NotImplemented");
    runtimeError68k("assembler error: wrong opcode at ofs " + _adrs);
}

function decode_group_0010(w0, cs, _adrs) {
    if ((w0 & 0b1111000111000000) == 0b0010000001000000) {
        let R = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = cs.ea(r, m, 4);
        let dst = cs.ea(R, 0b001, 4);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.MOVEA,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000000000000) == 0b0010000000000000) {
        let R = get_bits(w0, 9, 3);
        let M = get_bits(w0, 6, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = cs.ea(r, m, 4);
        let dst = cs.ea(R, M, 4);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.MOVE,
            [src, dst],
            extra
        ));
    }
    debugger;
    console.error("DecodingError::NotImplemented");
    runtimeError68k("assembler error: wrong opcode at ofs " + _adrs);
}


function decode_group_0011(w0, cs, _adrs) {
    if ((w0 & 0b1111000111000000) == 0b0011000001000000) {
        let R = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = cs.ea(r, m, 2);
        let dst = cs.ea(R, 0b001, 2);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.MOVEA,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000000000000) == 0b0011000000000000) {
        let R = get_bits(w0, 9, 3);
        let M = get_bits(w0, 6, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = cs.ea(r, m, 2);
        let dst = cs.ea(R, M, 2);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.MOVE,
            [src, dst],
            extra
        ));
    }
    debugger;
    runtimeError68k("assembler error: wrong opcode at ofs " + _adrs);
}



function decode_group_0100(w0, cs, _adrs) {
    if ((w0 & 0b1111111111111111) == 0b0100101011111010) {
        let sz = 0;
        let src = OperandType.NoOperand;
        let dst = OperandType.NoOperand;
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.BGND,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111111111) == 0b0100101011111100) {
        let sz = 0;
        let src = OperandType.NoOperand;
        let dst = OperandType.NoOperand;
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ILLEGAL,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111111111) == 0b0100111001110001) {
        let sz = 0;
        let src = OperandType.NoOperand;
        let dst = OperandType.NoOperand;
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.NOP,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111111111) == 0b0100111001110000) {
        let sz = 0;
        let src = OperandType.NoOperand;
        let dst = OperandType.NoOperand;
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.RESET,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111111111) == 0b0100111001110100) {
        let sz = 0;
        let src = cs.imm16();
        let dst = OperandType.NoOperand;
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.RTD,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111111111) == 0b0100111001110011) {
        let sz = 0;
        let src = OperandType.NoOperand;
        let dst = OperandType.NoOperand;
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.RTE,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111111111) == 0b0100111001110111) {
        let sz = 0;
        let src = OperandType.NoOperand;
        let dst = OperandType.NoOperand;
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.RTR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111111111) == 0b0100111001110101) {
        let sz = 0;
        let src = OperandType.NoOperand;
        let dst = OperandType.NoOperand;
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.RTS,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111111111) == 0b0100111001110010) {
        let sz = 0;
        let src = cs.imm16();
        let dst = OperandType.NoOperand;
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.STOP,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111111111) == 0b0100111001110110) {
        let sz = 0;
        let src = OperandType.NoOperand;
        let dst = OperandType.NoOperand;
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.TRAPV,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111111111) == 0b0100111001111010 && cs.has_words(1)) {
        let w1 = cs.peek_word(0);
        if ((w1 & 0b0000000000000000) == 0b0000000000000000) {
            let a = get_bits(w1, 15, 1);
            let r = get_bits(w1, 12, 3);
            let c = get_bits(w1, 0, 12);
            cs.skip_words(1);
            let sz = 4;
            let src = CONTROLREG(c);
            let dst = cs.dar(a, r);
            let extra = NoExtra;
            return cs.check_overflow(new Instruction (
                sz,
                Operation.MOVEC,
                [src, dst],
                extra
            ));
        }
    }
    if ((w0 & 0b1111111111111111) == 0b0100111001111011 && cs.has_words(1)) {
        let w1 = cs.peek_word(0);
        if ((w1 & 0b0000000000000000) == 0b0000000000000000) {
            let a = get_bits(w1, 15, 1);
            let r = get_bits(w1, 12, 3);
            let c = get_bits(w1, 0, 12);
            cs.skip_words(1);
            let sz = 4;
            let src = cs.dar(a, r);
            let dst = CONTROLREG(c);
            let extra = NoExtra;
            return cs.check_overflow(new Instruction (
                sz,
                Operation.MOVEC,
                [src, dst],
                extra
            ));
        }
    }
    if ((w0 & 0b1111111111111000) == 0b0100100001000000) {
        let r = get_bits(w0, 0, 3);
        let sz = 0;
        let src = cs.data_reg_op(r);
        let dst = OperandType.NoOperand;
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.SWAP,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111111000) == 0b0100100001001000) {
        let n = get_bits(w0, 0, 3);
        let sz = 0;
        let src = new Operand(OperandType.IMM8, n);
        let dst = OperandType.NoOperand;
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.BKPT,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111111000) == 0b0100100010000000) {
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = cs.data_reg_op(r);
        let dst = OperandType.NoOperand;
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.EXTW,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111111000) == 0b0100100011000000) {
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = cs.data_reg_op(r);
        let dst = OperandType.NoOperand;
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.EXTL,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111111000) == 0b0100100111000000) {
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = cs.data_reg_op(r);
        let dst = OperandType.NoOperand;
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.EXTBL,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b0100000111000000) {
        let n = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = cs.ea(r, m, 4);
        let dst = cs.address_reg_op(n);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.LEA,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111111000) == 0b0100111001010000) {
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = cs.address_reg_op(r);
        let dst = cs.imm16();
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.LINK,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111111000) == 0b0100100000001000) {
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = cs.address_reg_op(r);
        let dst = cs.imm32();
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.LINK,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111111000) == 0b0100111001011000) {
        let r = get_bits(w0, 0, 3);
        let sz = 0;
        let src = cs.address_reg_op(r);
        let dst = OperandType.NoOperand;
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.UNLK,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111110000) == 0b0100111001000000) {
        let v = get_bits(w0, 0, 4);
        let sz = 0;
        let src = new Operand(OperandType.IMM8, v);
        let dst = OperandType.NoOperand;
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.TRAP,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b0100110001000000 && cs.has_words(1)) {
        let w1 = cs.peek_word(0);
        if ((w1 & 0b1000111111111000) == 0b0000110000000000) {
            let m = get_bits(w0, 3, 3);
            let r = get_bits(w0, 0, 3);
            let q = get_bits(w1, 12, 3);
            let R = get_bits(w1, 0, 3);
            if (R != q) {
                cs.skip_words(1);
                let sz = 4;
                let src = cs.ea(r, m, 4);
                let dst = new Operand(OperandType.DPAIR, [cs.data_reg(q), cs.data_reg(R)]);
                let extra = NoExtra;
                return cs.check_overflow(new Instruction (
                    sz,
                    Operation.DIVSL,
                    [src, dst],
                    extra
                ));
            }
        }
    }
    if ((w0 & 0b1111111111000000) == 0b0100110001000000 && cs.has_words(1)) {
        let w1 = cs.peek_word(0);
        if ((w1 & 0b1000111111111000) == 0b0000110000000000) {
            let m = get_bits(w0, 3, 3);
            let r = get_bits(w0, 0, 3);
            let q = get_bits(w1, 12, 3);
            let R = get_bits(w1, 0, 3);
            cs.skip_words(1);
            let sz = 4;
            let src = cs.ea(r, m, 4);
            let dst = new Operand(OperandType.DPAIR, [cs.data_reg(q), cs.data_reg(R)]);
            let extra = NoExtra;
            return cs.check_overflow(new Instruction (
                sz,
                Operation.DIVSL,
                [src, dst],
                extra
            ));
        }
    }
    if ((w0 & 0b1111111111000000) == 0b0100110001000000 && cs.has_words(1)) {
        let w1 = cs.peek_word(0);
        if ((w1 & 0b1000111111111000) == 0b0000100000000000) {
            let m = get_bits(w0, 3, 3);
            let r = get_bits(w0, 0, 3);
            let q = get_bits(w1, 12, 3);
            let R = get_bits(w1, 0, 3);
            if (R != q) {
                cs.skip_words(1);
                let sz = 4;
                let src = cs.ea(r, m, 4);
                let dst =new Operand(OperandType.DPAIR, [cs.data_reg(q), cs.data_reg(R)]);
                let extra = NoExtra;
                return cs.check_overflow(new Instruction (
                    sz,
                    Operation.DIVSLL,
                    [src, dst],
                    extra
                ));
            }
        }
    }
    if ((w0 & 0b1111111111000000) == 0b0100110001000000 && cs.has_words(1)) {
        let w1 = cs.peek_word(0);
        if ((w1 & 0b1000111111111000) == 0b0000100000000000) {
            let m = get_bits(w0, 3, 3);
            let r = get_bits(w0, 0, 3);
            let q = get_bits(w1, 12, 3);
            cs.skip_words(1);
            let sz = 4;
            let src = cs.ea(r, m, 4);
            let dst = cs.data_reg_op(q);
            let extra = NoExtra;
            return cs.check_overflow(new Instruction (
                sz,
                Operation.DIVSL,
                [src, dst],
                extra
            ));
        }
    }
    if ((w0 & 0b1111111111000000) == 0b0100110001000000 && cs.has_words(1)) {
        let w1 = cs.peek_word(0);
        if ((w1 & 0b1000111111111000) == 0b0000010000000000) {
            let m = get_bits(w0, 3, 3);
            let r = get_bits(w0, 0, 3);
            let q = get_bits(w1, 12, 3);
            let R = get_bits(w1, 0, 3);
            if (R != q) {
                cs.skip_words(1);
                let sz = 4;
                let src = cs.ea(r, m, 4);
                let dst =new Operand(OperandType.DPAIR, [cs.data_reg(q), cs.data_reg(R)]);
                let extra = NoExtra;
                return cs.check_overflow(new Instruction (
                    sz,
                    Operation.DIVUL,
                    [src, dst],
                    extra
                ));
            }
        }
    }
    if ((w0 & 0b1111111111000000) == 0b0100110001000000 && cs.has_words(1)) {
        let w1 = cs.peek_word(0);
        if ((w1 & 0b1000111111111000) == 0b0000010000000000) {
            let m = get_bits(w0, 3, 3);
            let r = get_bits(w0, 0, 3);
            let q = get_bits(w1, 12, 3);
            let R = get_bits(w1, 0, 3);
            cs.skip_words(1);
            let sz = 4;
            let src = cs.ea(r, m, 4);
            let dst =new Operand(OperandType.DPAIR, [cs.data_reg(q), cs.data_reg(R)]);
            let extra = NoExtra;
            return cs.check_overflow(new Instruction (
                sz,
                Operation.DIVUL,
                [src, dst],
                extra
            ));
        }
    }
    if ((w0 & 0b1111111111000000) == 0b0100110001000000 && cs.has_words(1)) {
        let w1 = cs.peek_word(0);
        if ((w1 & 0b1000111111111000) == 0b0000000000000000) {
            let m = get_bits(w0, 3, 3);
            let r = get_bits(w0, 0, 3);
            let q = get_bits(w1, 12, 3);
            let R = get_bits(w1, 0, 3);
            if (R != q) {
                cs.skip_words(1);
                let sz = 4;
                let src = cs.ea(r, m, 4);
                let dst =new Operand(OperandType.DPAIR, [cs.data_reg(q), cs.data_reg(R)]);
                let extra = NoExtra;
                return cs.check_overflow(new Instruction (
                    sz,
                    Operation.DIVULL,
                    [src, dst],
                    extra
                ));
            }
        }
    }
    if ((w0 & 0b1111111111000000) == 0b0100110001000000 && cs.has_words(1)) {
        let w1 = cs.peek_word(0);
        if ((w1 & 0b1000111111111000) == 0b0000000000000000) {
            let m = get_bits(w0, 3, 3);
            let r = get_bits(w0, 0, 3);
            let q = get_bits(w1, 12, 3);
            cs.skip_words(1);
            let sz = 4;
            let src = cs.ea(r, m, 4);
            let dst = cs.data_reg_op(q);
            let extra = NoExtra;
            return cs.check_overflow(new Instruction (
                sz,
                Operation.DIVUL,
                [src, dst],
                extra
            ));
        }
    }
    if ((w0 & 0b1111111111000000) == 0b0100111011000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 0;
        let src = cs.ea(r, m, 0);
        let dst = OperandType.NoOperand;
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.JMP,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b0100111010000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 0;
        let src = cs.ea(r, m, 0);
        let dst = OperandType.NoOperand;
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.JSR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b0100110000000000 && cs.has_words(1)) {
        let w1 = cs.peek_word(0);
        if ((w1 & 0b1000111111111000) == 0b0000100000000000) {
            let m = get_bits(w0, 3, 3);
            let r = get_bits(w0, 0, 3);
            let l = get_bits(w1, 12, 3);
            cs.skip_words(1);
            let sz = 4;
            let src = cs.ea(r, m, 4);
            let dst = cs.data_reg_op(l);
            let extra = NoExtra;
            return cs.check_overflow(new Instruction (
                sz,
                Operation.MULS,
                [src, dst],
                extra
            ));
        }
    }
    if ((w0 & 0b1111111111000000) == 0b0100110000000000 && cs.has_words(1)) {
        let w1 = cs.peek_word(0);
        if ((w1 & 0b1000111111111000) == 0b0000110000000000) {
            let m = get_bits(w0, 3, 3);
            let r = get_bits(w0, 0, 3);
            let l = get_bits(w1, 12, 3);
            let h = get_bits(w1, 0, 3);
            cs.skip_words(1);
            let sz = 4;
            let src = cs.ea(r, m, 4);
            let dst = new Operand(OperandType.DPAIR, [cs.data_reg(l), cs.data_reg(h)]);
            let extra = NoExtra;
            return cs.check_overflow(new Instruction (
                sz,
                Operation.MULS,
                [src, dst],
                extra
            ));
        }
    }
    if ((w0 & 0b1111111111000000) == 0b0100110000000000 && cs.has_words(1)) {
        let w1 = cs.peek_word(0);
        if ((w1 & 0b1000111111111000) == 0b0000000000000000) {
            let m = get_bits(w0, 3, 3);
            let r = get_bits(w0, 0, 3);
            let l = get_bits(w1, 12, 3);
            cs.skip_words(1);
            let sz = 4;
            let src = cs.ea(r, m, 4);
            let dst = cs.data_reg_op(l);
            let extra = NoExtra;
            return cs.check_overflow(new Instruction (
                sz,
                Operation.MULU,
                [src, dst],
                extra
            ));
        }
    }
    if ((w0 & 0b1111111111000000) == 0b0100110000000000 && cs.has_words(1)) {
        let w1 = cs.peek_word(0);
        if ((w1 & 0b1000111111111000) == 0b0000010000000000) {
            let m = get_bits(w0, 3, 3);
            let r = get_bits(w0, 0, 3);
            let l = get_bits(w1, 12, 3);
            let h = get_bits(w1, 0, 3);
            cs.skip_words(1);
            let sz = 4;
            let src = cs.ea(r, m, 4);
            let dst = new Operand(OperandType.DPAIR, [cs.data_reg(l), cs.data_reg(h)]);
            let extra = NoExtra;
            return cs.check_overflow(new Instruction (
                sz,
                Operation.MULU,
                [src, dst],
                extra
            ));
        }
    }
    if ((w0 & 0b1111111111000000) == 0b0100100000000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 1;
        let src = cs.ea(r, m, 1);
        let dst = OperandType.NoOperand;
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.NBCD,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b0100000011000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = OperandType.Implied;
        let dst = cs.ea(r, m, 2);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.MOVEFROMSR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b0100011011000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = cs.ea(r, m, 2);
        let dst = OperandType.Implied;
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.MOVETOSR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111111000) == 0b0100111001100000) {
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = cs.address_reg_op(r);
        let dst = OperandType.Implied;
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.MOVETOUSP,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111111000) == 0b0100111001101000) {
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = OperandType.Implied;
        let dst = cs.address_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.MOVEFROMUSP,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b0100001011000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = OperandType.Implied;
        let dst = cs.ea(r, m, 2);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.MOVEFROMCCR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b0100010011000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = cs.ea(r, m, 2);
        let dst = OperandType.Implied;
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.MOVETOCCR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b0100100001000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = cs.ea(r, m, 4);
        let dst = OperandType.Implied;
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.PEA,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b0100101011000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 1;
        let src = cs.ea(r, m, 1);
        let dst = OperandType.NoOperand;
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.TAS,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111110000000) == 0b0100100010000000) {
        let s = get_bits(w0, 6, 1);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2 << s;
        let src = new Operand(OperandType.REGLIST, cs.pull16());
        let dst = cs.ea(r, m, sz);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.MOVEM,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111110000000) == 0b0100110010000000) {
        let s = get_bits(w0, 6, 1);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2 << s;
        let dst = new Operand(OperandType.REGLIST, cs.pull16());
        let src = cs.ea(r, m, sz);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.MOVEM,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b0100001000000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 1;
        let src = OperandType.Implied;
        let dst = cs.ea(r, m, sz);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.CLR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b0100001001000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = OperandType.Implied;
        let dst = cs.ea(r, m, sz);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.CLR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b0100001010000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = OperandType.Implied;
        let dst = cs.ea(r, m, sz);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.CLR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b0100010000000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 1;
        let src = OperandType.Implied;
        let dst = cs.ea(r, m, sz);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.NEG,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b0100010001000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = OperandType.Implied;
        let dst = cs.ea(r, m, sz);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.NEG,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b0100010010000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = OperandType.Implied;
        let dst = cs.ea(r, m, sz);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.NEG,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b0100000000000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 1;
        let src = OperandType.Implied;
        let dst = cs.ea(r, m, sz);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.NEGX,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b0100000001000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = OperandType.Implied;
        let dst = cs.ea(r, m, sz);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.NEGX,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b0100000010000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = OperandType.Implied;
        let dst = cs.ea(r, m, sz);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.NEGX,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b0100011000000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 1;
        let src = OperandType.Implied;
        let dst = cs.ea(r, m, sz);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.NOT,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b0100011001000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = OperandType.Implied;
        let dst = cs.ea(r, m, sz);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.NOT,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b0100011010000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = OperandType.Implied;
        let dst = cs.ea(r, m, sz);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.NOT,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b0100101000000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 1;
        let src = OperandType.Implied;
        let dst = cs.ea(r, m, sz);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.TST,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b0100101001000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = OperandType.Implied;
        let dst = cs.ea(r, m, sz);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.TST,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b0100101010000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = OperandType.Implied;
        let dst = cs.ea(r, m, sz);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.TST,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b0100000110000000) {
        let d = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = cs.ea(r, m, sz);
        let dst = cs.data_reg_op(d);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.CHK,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b0100000100000000) {
        let d = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = cs.ea(r, m, sz);
        let dst = cs.data_reg_op(d);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.CHK,
            [src, dst],
            extra
        ));
    }
    debugger;
    runtimeError68k("assembler error: wrong opcode at ofs " + _adrs);
}

function decode_group_0101(w0, cs, _adrs) {
    if ((w0 & 0b1111000011111000) == 0b0101000011001000) {
        let c = get_bits(w0, 8, 4);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = cs.data_reg_op(r);
        let dst = new Operand(OperandType.PCDISP, {disp:simple_disp(cs.pull16())});
        let extra = cs.cc(c);
        return cs.check_overflow(new Instruction (
            sz,
            Operation.DBCC,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b0101000000000000) {
        let d = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 1;
        let src = cs.quick_const(d);
        let dst = cs.ea(r, m, sz);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ADDQ,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b0101000001000000) {
        let d = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = cs.quick_const(d);
        let dst = cs.ea(r, m, sz);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ADDQ,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b0101000010000000) {
        let d = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = cs.quick_const(d);
        let dst = cs.ea(r, m, sz);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ADDQ,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b0101000100000000) {
        let d = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 1;
        let src = cs.quick_const(d);
        let dst = cs.ea(r, m, sz);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.SUBQ,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b0101000101000000) {
        let d = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = cs.quick_const(d);
        let dst = cs.ea(r, m, sz);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.SUBQ,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b0101000110000000) {
        let d = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = cs.quick_const(d);
        let dst = cs.ea(r, m, sz);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.SUBQ,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000011111111) == 0b0101000011111100) {
        let c = get_bits(w0, 8, 4);
        let sz = 0;
        let src = OperandType.NoOperand;
        let dst = OperandType.NoOperand;
        let extra = cs.cc(c);
        return cs.check_overflow(new Instruction (
            sz,
            Operation.TRAPCC,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000011111111) == 0b0101000011111010) {
        let c = get_bits(w0, 8, 4);
        let sz = 2;
        let src = cs.imm16();
        let dst = OperandType.NoOperand;
        let extra = cs.cc(c);
        return cs.check_overflow(new Instruction (
            sz,
            Operation.TRAPCC,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000011111111) == 0b0101000011111011) {
        let c = get_bits(w0, 8, 4);
        let sz = 4;
        let src = cs.imm32();
        let dst = OperandType.NoOperand;
        let extra = cs.cc(c);
        return cs.check_overflow(new Instruction (
            sz,
            Operation.TRAPCC,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000011000000) == 0b0101000011000000) {
        let c = get_bits(w0, 8, 4);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 1;
        let src = OperandType.Implied;
        let dst = cs.ea(r, m, 1);
        let extra = cs.cc(c);
        return cs.check_overflow(new Instruction (
            sz,
            Operation.SCC,
            [src, dst],
            extra
        ));
    }
    debugger;
    runtimeError68k("assembler error: wrong opcode at ofs " + _adrs);
}



function decode_group_0110(w0, cs, _adrs) {
    if ((w0 & 0b1111111111111111) == 0b0110000000000000) {
        let sz = 2;
        let src = new Operand(OperandType.PCDISP, {disp:simple_disp(cs.pull16())});
        let dst = OperandType.NoOperand;
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.BRA,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111111111) == 0b0110000011111111) {
        let sz = 4;
        let src = new Operand(OperandType.PCDISP, {disp:simple_disp(cs.pull32())});
        let dst = OperandType.NoOperand;
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.BRA,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111100000000) == 0b0110000000000000) {
        let d = get_bits(w0, 0, 8);
        let sz = 1;
        let src = new Operand(OperandType.PCDISP, {disp:simple_disp(d)});
        let dst = OperandType.NoOperand;
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.BRA,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111111111) == 0b0110000100000000) {
        let sz = 2;
        let src = new Operand(OperandType.PCDISP, {disp:simple_disp(cs.pull16())});
        let dst = OperandType.NoOperand;
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.BSR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111111111) == 0b0110000111111111) {
        let sz = 4;
        let src = new Operand(OperandType.PCDISP, {disp:simple_disp(cs.pull32())});
        let dst = OperandType.NoOperand;
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.BSR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111100000000) == 0b0110000100000000) {
        let d = get_bits(w0, 0, 8);
        let sz = 1;
        let src = new Operand(OperandType.PCDISP, {disp:simple_disp(d)});
        let dst = OperandType.NoOperand;
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.BSR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000011111111) == 0b0110000000000000) {
        let c = get_bits(w0, 8, 4);
        let sz = 2;
        let src = new Operand(OperandType.PCDISP, {disp:simple_disp(cs.pull16())});
        let dst = OperandType.NoOperand;
        let extra = cs.cc(c);
        return cs.check_overflow(new Instruction (
            sz,
            Operation.BCC,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000011111111) == 0b0110000011111111) {
        let c = get_bits(w0, 8, 4);
        let sz = 4;
        let src = new Operand(OperandType.PCDISP, {disp:simple_disp(cs.pull32())});
        let dst = OperandType.NoOperand;
        let extra = cs.cc(c);
        return cs.check_overflow(new Instruction (
            sz,
            Operation.BCC,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000000000000) == 0b0110000000000000) {
        let c = get_bits(w0, 8, 4);
        let d = get_bits(w0, 0, 8);
        let sz = 1;
        let src = new Operand(OperandType.PCDISP, {disp:simple_disp(d)});
        let dst = OperandType.NoOperand;
        let extra = cs.cc(c);
        return cs.check_overflow(new Instruction (
            sz,
            Operation.BCC,
            [src, dst],
            extra
        ));
    }
    debugger;
    runtimeError68k("assembler error: wrong opcode at ofs " + _adrs);
}



function decode_group_0111(w0, cs, _adrs) {
    if ((w0 & 0b1111000100000000) == 0b0111000000000000) {
        let r = get_bits(w0, 9, 3);
        let n = get_bits(w0, 0, 8);
        let sz = 4;
        let src = new Operand(OperandType.IMM8, n);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.MOVEQ,
            [src, dst],
            extra
        ));
    }
    debugger;
    runtimeError68k("assembler error: unknown opcode");
}


function decode_group_1000(w0, cs, _adrs) {
    if ((w0 & 0b1111000111111000) == 0b1000000101000000) {
        let y = get_bits(w0, 9, 3);
        let x = get_bits(w0, 0, 3);
        let sz = 0;
        let src = cs.data_reg_op(x);
        let dst = cs.data_reg_op(y);
        let extra = PackAdjustment(cs.pull16());
        return cs.check_overflow(new Instruction (
            sz,
            Operation.PACK,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1000000101001000) {
        let y = get_bits(w0, 9, 3);
        let x = get_bits(w0, 0, 3);
        let sz = 0;
        let src = new Operand(OperandType.ARDEC, cs.address_reg(x));
        let dst = new Operand(OperandType.ARDEC, cs.address_reg(y));
        let extra = PackAdjustment(cs.pull16());
        return cs.check_overflow(new Instruction (
            sz,
            Operation.PACK,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1000000110000000) {
        let y = get_bits(w0, 9, 3);
        let x = get_bits(w0, 0, 3);
        let sz = 0;
        let src = cs.data_reg_op(x);
        let dst = cs.data_reg_op(y);
        let extra = PackAdjustment(cs.pull16());
        return cs.check_overflow(new Instruction (
            sz,
            Operation.UNPK,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1000000110001000) {
        let y = get_bits(w0, 9, 3);
        let x = get_bits(w0, 0, 3);
        let sz = 0;
        let src = new Operand(OperandType.ARDEC, cs.address_reg(x));
        let dst = new Operand(OperandType.ARDEC, cs.address_reg(y));
        let extra = PackAdjustment(cs.pull16());
        return cs.check_overflow(new Instruction (
            sz,
            Operation.UNPK,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1000000100000000) {
        let y = get_bits(w0, 9, 3);
        let x = get_bits(w0, 0, 3);
        let sz = 1;
        let src = cs.data_reg_op(x);
        let dst = cs.data_reg_op(y);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.SBCD,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1000000100001000) {
        let y = get_bits(w0, 9, 3);
        let x = get_bits(w0, 0, 3);
        let sz = 1;
        let src = new Operand(OperandType.ARDEC, cs.address_reg(x));
        let dst = new Operand(OperandType.ARDEC, cs.address_reg(y));
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.SBCD,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b1000000111000000) {
        let d = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = cs.ea(r, m, 2);
        let dst = cs.data_reg_op(d);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.DIVS,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b1000000011000000) {
        let d = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = cs.ea(r, m, 2);
        let dst = cs.data_reg_op(d);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.DIVU,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b1000000000000000) {
        let d = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 1;
        let src = cs.ea(r, m, sz);
        let dst = cs.data_reg_op(d);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.OR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b1000000001000000) {
        let d = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = cs.ea(r, m, sz);
        let dst = cs.data_reg_op(d);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.OR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b1000000010000000) {
        let d = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = cs.ea(r, m, sz);
        let dst = cs.data_reg_op(d);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.OR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b1000000100000000) {
        let d = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 1;
        let src = cs.data_reg_op(d);
        let dst = cs.ea(r, m, sz);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.OR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b1000000101000000) {
        let d = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = cs.data_reg_op(d);
        let dst = cs.ea(r, m, sz);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.OR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b1000000110000000) {
        let d = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = cs.data_reg_op(d);
        let dst = cs.ea(r, m, sz);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.OR,
            [src, dst],
            extra
        ));
    }
    debugger;
    runtimeError68k("assembler error: wrong opcode at ofs " + _adrs);
}



function decode_group_1001(w0, cs, _adrs) {
    if ((w0 & 0b1111000111111000) == 0b1001000100000000) {
        let x = get_bits(w0, 9, 3);
        let y = get_bits(w0, 0, 3);
        let sz = 1;
        let src = cs.data_reg_op(y);
        let dst = cs.data_reg_op(x);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.SUBX,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1001000101000000) {
        let x = get_bits(w0, 9, 3);
        let y = get_bits(w0, 0, 3);
        let sz = 2;
        let src = cs.data_reg_op(y);
        let dst = cs.data_reg_op(x);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.SUBX,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1001000110000000) {
        let x = get_bits(w0, 9, 3);
        let y = get_bits(w0, 0, 3);
        let sz = 4;
        let src = cs.data_reg_op(y);
        let dst = cs.data_reg_op(x);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.SUBX,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1001000100001000) {
        let x = get_bits(w0, 9, 3);
        let y = get_bits(w0, 0, 3);
        let sz = 1;
        let src = new Operand(OperandType.ARDEC, cs.address_reg(y));
        let dst = new Operand(OperandType.ARDEC, cs.address_reg(x));
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.SUBX,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1001000101001000) {
        let x = get_bits(w0, 9, 3);
        let y = get_bits(w0, 0, 3);
        let sz = 2;
        let src = new Operand(OperandType.ARDEC, cs.address_reg(y));
        let dst = new Operand(OperandType.ARDEC, cs.address_reg(x));
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.SUBX,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1001000110001000) {
        let x = get_bits(w0, 9, 3);
        let y = get_bits(w0, 0, 3);
        let sz = 4;
        let src = new Operand(OperandType.ARDEC, cs.address_reg(y));
        let dst = new Operand(OperandType.ARDEC, cs.address_reg(x));
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.SUBX,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b1001000000000000) {
        let d = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 1;
        let src = cs.ea(r, m, sz);
        let dst = cs.data_reg_op(d);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.SUB,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b1001000001000000) {
        let d = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = cs.ea(r, m, sz);
        let dst = cs.data_reg_op(d);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.SUB,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b1001000010000000) {
        let d = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = cs.ea(r, m, sz);
        let dst = cs.data_reg_op(d);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.SUB,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b1001000100000000) {
        let d = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 1;
        let src = cs.data_reg_op(d);
        let dst = cs.ea(r, m, sz);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.SUB,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b1001000101000000) {
        let d = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = cs.data_reg_op(d);
        let dst = cs.ea(r, m, sz);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.SUB,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b1001000110000000) {
        let d = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = cs.data_reg_op(d);
        let dst = cs.ea(r, m, sz);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.SUB,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b1001000011000000) {
        let d = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = cs.ea(r, m, sz);
        let dst = cs.address_reg_op(d);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.SUBA,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b1001000111000000) {
        let d = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = cs.ea(r, m, sz);
        let dst = cs.address_reg_op(d);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.SUBA,
            [src, dst],
            extra
        ));
    }
    debugger;
    runtimeError68k("assembler error: wrong opcode at ofs " + _adrs);
}



function decode_group_1011(w0, cs, _adrs) {
    if ((w0 & 0b1111000111000000) == 0b1011000011000000) {
        let a = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = cs.ea(r, m, sz);
        let dst = cs.address_reg_op(a);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.CMPA,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b1011000111000000) {
        let a = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = cs.ea(r, m, sz);
        let dst = cs.address_reg_op(a);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.CMPA,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1011000100001000) {
        let x = get_bits(w0, 9, 3);
        let y = get_bits(w0, 0, 3);
        let sz = 1;
        let src = new Operand(OperandType.ARINC, cs.address_reg(y));
        let dst = new Operand(OperandType.ARINC, cs.address_reg(x));
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.CMPM,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1011000101001000) {
        let x = get_bits(w0, 9, 3);
        let y = get_bits(w0, 0, 3);
        let sz = 2;
        let src = new Operand(OperandType.ARINC, cs.address_reg(y));
        let dst = new Operand(OperandType.ARINC, cs.address_reg(x));
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.CMPM,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1011000110001000) {
        let x = get_bits(w0, 9, 3);
        let y = get_bits(w0, 0, 3);
        let sz = 4;
        let src = new Operand(OperandType.ARINC, cs.address_reg(y));
        let dst = new Operand(OperandType.ARINC, cs.address_reg(x));
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.CMPM,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b1011000000000000) {
        let d = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 1;
        let src = cs.ea(r, m, sz);
        let dst = cs.data_reg_op(d);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.CMP,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b1011000001000000) {
        let d = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = cs.ea(r, m, sz);
        let dst = cs.data_reg_op(d);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.CMP,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b1011000010000000) {
        let d = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = cs.ea(r, m, sz);
        let dst = cs.data_reg_op(d);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.CMP,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b1011000100000000) {
        let d = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 1;
        let src = cs.data_reg_op(d);
        let dst = cs.ea(r, m, sz);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.EOR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b1011000101000000) {
        let d = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = cs.data_reg_op(d);
        let dst = cs.ea(r, m, sz);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.EOR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b1011000110000000) {
        let d = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = cs.data_reg_op(d);
        let dst = cs.ea(r, m, sz);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.EOR,
            [src, dst],
            extra
        ));
    }
    debugger;
    runtimeError68k("assembler error: wrong opcode at ofs " + _adrs);
}




function decode_group_1100(w0, cs, _adrs) {
    if ((w0 & 0b1111000111111000) == 0b1100000100000000) {
        let y = get_bits(w0, 9, 3);
        let x = get_bits(w0, 0, 3);
        let sz = 1;
        let src = cs.data_reg_op(x);
        let dst = cs.data_reg_op(y);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ABCD,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1100000100001000) {
        let y = get_bits(w0, 9, 3);
        let x = get_bits(w0, 0, 3);
        let sz = 1;
        let src = new Operand(OperandType.ARDEC, cs.address_reg(x));
        let dst = new Operand(OperandType.ARDEC, cs.address_reg(y));
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ABCD,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b1100000011000000) {
        let p = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = cs.ea(r, m, 2);
        let dst = cs.data_reg_op(p);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.MULU,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b1100000111000000) {
        let p = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = cs.ea(r, m, 2);
        let dst = cs.data_reg_op(p);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.MULS,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1100000101000000) {
        let x = get_bits(w0, 9, 3);
        let y = get_bits(w0, 0, 3);
        let sz = 4;
        let src = cs.data_reg_op(x);
        let dst = cs.data_reg_op(y);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.EXG,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1100000101001000) {
        let x = get_bits(w0, 9, 3);
        let y = get_bits(w0, 0, 3);
        let sz = 4;
        let src = cs.address_reg_op(x);
        let dst = cs.address_reg_op(y);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.EXG,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1100000110001000) {
        let x = get_bits(w0, 9, 3);
        let y = get_bits(w0, 0, 3);
        let sz = 4;
        let src = cs.data_reg_op(x);
        let dst = cs.address_reg_op(y);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.EXG,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b1100000000000000) {
        let d = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 1;
        let src = cs.ea(r, m, sz);
        let dst = cs.data_reg_op(d);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.AND,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b1100000001000000) {
        let d = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = cs.ea(r, m, sz);
        let dst = cs.data_reg_op(d);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.AND,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b1100000010000000) {
        let d = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = cs.ea(r, m, sz);
        let dst = cs.data_reg_op(d);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.AND,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b1100000100000000) {
        let d = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 1;
        let src = cs.data_reg_op(d);
        let dst = cs.ea(r, m, sz);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.AND,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b1100000101000000) {
        let d = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = cs.data_reg_op(d);
        let dst = cs.ea(r, m, sz);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.AND,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b1100000110000000) {
        let d = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = cs.data_reg_op(d);
        let dst = cs.ea(r, m, sz);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.AND,
            [src, dst],
            extra
        ));
    }
    debugger;
    runtimeError68k("assembler error: wrong opcode at ofs " + _adrs);
}



function decode_group_1101(w0, cs, _adrs) {
    if ((w0 & 0b1111000111111000) == 0b1101000100000000) {
        let x = get_bits(w0, 9, 3);
        let y = get_bits(w0, 0, 3);
        let sz = 1;
        let src = cs.data_reg_op(y);
        let dst = cs.data_reg_op(x);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ADDX,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1101000101000000) {
        let x = get_bits(w0, 9, 3);
        let y = get_bits(w0, 0, 3);
        let sz = 2;
        let src = cs.data_reg_op(y);
        let dst = cs.data_reg_op(x);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ADDX,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1101000110000000) {
        let x = get_bits(w0, 9, 3);
        let y = get_bits(w0, 0, 3);
        let sz = 4;
        let src = cs.data_reg_op(y);
        let dst = cs.data_reg_op(x);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ADDX,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1101000100001000) {
        let x = get_bits(w0, 9, 3);
        let y = get_bits(w0, 0, 3);
        let sz = 1;
        let src = new Operand(OperandType.ARDEC, cs.address_reg(y));
        let dst = new Operand(OperandType.ARDEC, cs.address_reg(x));
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ADDX,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1101000101001000) {
        let x = get_bits(w0, 9, 3);
        let y = get_bits(w0, 0, 3);
        let sz = 2;
        let src = new Operand(OperandType.ARDEC, cs.address_reg(y));
        let dst = new Operand(OperandType.ARDEC, cs.address_reg(x));
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ADDX,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1101000110001000) {
        let x = get_bits(w0, 9, 3);
        let y = get_bits(w0, 0, 3);
        let sz = 4;
        let src = new Operand(OperandType.ARDEC, cs.address_reg(y));
        let dst = new Operand(OperandType.ARDEC, cs.address_reg(x));
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ADDX,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b1101000000000000) {
        let d = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 1;
        let src = cs.ea(r, m, sz);
        let dst = cs.data_reg_op(d);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ADD,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b1101000001000000) {
        let d = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = cs.ea(r, m, sz);
        let dst = cs.data_reg_op(d);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ADD,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b1101000010000000) {
        let d = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = cs.ea(r, m, sz);
        let dst = cs.data_reg_op(d);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ADD,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b1101000100000000) {
        let d = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 1;
        let src = cs.data_reg_op(d);
        let dst = cs.ea(r, m, sz);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ADD,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b1101000101000000) {
        let d = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = cs.data_reg_op(d);
        let dst = cs.ea(r, m, sz);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ADD,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b1101000110000000) {
        let d = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = cs.data_reg_op(d);
        let dst = cs.ea(r, m, sz);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ADD,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b1101000011000000) {
        let a = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = cs.ea(r, m, sz);
        let dst = cs.address_reg_op(a);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ADDA,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111000000) == 0b1101000111000000) {
        let a = get_bits(w0, 9, 3);
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = cs.ea(r, m, sz);
        let dst = cs.address_reg_op(a);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ADDA,
            [src, dst],
            extra
        ));
    }
    debugger;
    runtimeError68k("assembler error: wrong opcode at ofs " + _adrs);
}


function decode_group_1110(w0, cs, _adrs) {
    if ((w0 & 0b1111111111000000) == 0b1110101011000000 && cs.has_words(1)) {
        let w1 = cs.peek_word(0);
        if ((w1 & 0b1111000000000000) == 0b0000000000000000) {
            let m = get_bits(w0, 3, 3);
            let r = get_bits(w0, 0, 3);
            let O = get_bits(w1, 11, 1);
            let o = get_bits(w1, 6, 5);
            let W = get_bits(w1, 5, 1);
            let w = get_bits(w1, 0, 5);
            cs.skip_words(1);
            let extra = cs.bitfield(O, o, W, w);
            let sz = 0;
            let src = OperandType.NoOperand;
            let dst = cs.ea(r, m, 0);
            return cs.check_overflow(new Instruction (
                sz,
                Operation.BFCHG,
                [src, dst],
                extra
            ));
        }
    }
    if ((w0 & 0b1111111111000000) == 0b1110110011000000 && cs.has_words(1)) {
        let w1 = cs.peek_word(0);
        if ((w1 & 0b1111000000000000) == 0b0000000000000000) {
            let m = get_bits(w0, 3, 3);
            let r = get_bits(w0, 0, 3);
            let O = get_bits(w1, 11, 1);
            let o = get_bits(w1, 6, 5);
            let W = get_bits(w1, 5, 1);
            let w = get_bits(w1, 0, 5);
            cs.skip_words(1);
            let extra = cs.bitfield(O, o, W, w);
            let sz = 0;
            let src = OperandType.NoOperand;
            let dst = cs.ea(r, m, 0);
            return cs.check_overflow(new Instruction (
                sz,
                Operation.BFCLR,
                [src, dst],
                extra
            ));
        }
    }
    if ((w0 & 0b1111111111000000) == 0b1110101111000000 && cs.has_words(1)) {
        let w1 = cs.peek_word(0);
        if ((w1 & 0b1000000000000000) == 0b0000000000000000) {
            let m = get_bits(w0, 3, 3);
            let r = get_bits(w0, 0, 3);
            let d = get_bits(w1, 12, 3);
            let O = get_bits(w1, 11, 1);
            let o = get_bits(w1, 6, 5);
            let W = get_bits(w1, 5, 1);
            let w = get_bits(w1, 0, 5);
            cs.skip_words(1);
            let extra = cs.bitfield(O, o, W, w);
            let sz = 0;
            let src = cs.ea(r, m, 0);
            let dst = cs.data_reg_op(d);
            return cs.check_overflow(new Instruction (
                sz,
                Operation.BFEXTS,
                [src, dst],
                extra
            ));
        }
    }
    if ((w0 & 0b1111111111000000) == 0b1110100111000000 && cs.has_words(1)) {
        let w1 = cs.peek_word(0);
        if ((w1 & 0b1000000000000000) == 0b0000000000000000) {
            let m = get_bits(w0, 3, 3);
            let r = get_bits(w0, 0, 3);
            let d = get_bits(w1, 12, 3);
            let O = get_bits(w1, 11, 1);
            let o = get_bits(w1, 6, 5);
            let W = get_bits(w1, 5, 1);
            let w = get_bits(w1, 0, 5);
            cs.skip_words(1);
            let extra = cs.bitfield(O, o, W, w);
            let sz = 0;
            let src = cs.ea(r, m, 0);
            let dst = cs.data_reg_op(d);
            return cs.check_overflow(new Instruction (
                sz,
                Operation.BFEXTU,
                [src, dst],
                extra
            ));
        }
    }
    if ((w0 & 0b1111111111000000) == 0b1110110111000000 && cs.has_words(1)) {
        let w1 = cs.peek_word(0);
        if ((w1 & 0b1000000000000000) == 0b0000000000000000) {
            let m = get_bits(w0, 3, 3);
            let r = get_bits(w0, 0, 3);
            let d = get_bits(w1, 12, 3);
            let O = get_bits(w1, 11, 1);
            let o = get_bits(w1, 6, 5);
            let W = get_bits(w1, 5, 1);
            let w = get_bits(w1, 0, 5);
            cs.skip_words(1);
            let extra = cs.bitfield(O, o, W, w);
            let sz = 0;
            let src = cs.ea(r, m, 0);
            let dst = cs.data_reg_op(d);
            return cs.check_overflow(new Instruction (
                sz,
                Operation.BFFFO,
                [src, dst],
                extra
            ));
        }
    }
    if ((w0 & 0b1111111111000000) == 0b1110111111000000 && cs.has_words(1)) {
        let w1 = cs.peek_word(0);
        if ((w1 & 0b1000000000000000) == 0b0000000000000000) {
            let m = get_bits(w0, 3, 3);
            let r = get_bits(w0, 0, 3);
            let d = get_bits(w1, 12, 3);
            let O = get_bits(w1, 11, 1);
            let o = get_bits(w1, 6, 5);
            let W = get_bits(w1, 5, 1);
            let w = get_bits(w1, 0, 5);
            cs.skip_words(1);
            let extra = cs.bitfield(O, o, W, w);
            let sz = 0;
            let src = cs.data_reg_op(d);
            let dst = cs.ea(r, m, 0);
            return cs.check_overflow(new Instruction (
                sz,
                Operation.BFINS,
                [src, dst],
                extra
            ));
        }
    }
    if ((w0 & 0b1111111111000000) == 0b1110111011000000 && cs.has_words(1)) {
        let w1 = cs.peek_word(0);
        if ((w1 & 0b1111000000000000) == 0b0000000000000000) {
            let m = get_bits(w0, 3, 3);
            let r = get_bits(w0, 0, 3);
            let O = get_bits(w1, 11, 1);
            let o = get_bits(w1, 6, 5);
            let W = get_bits(w1, 5, 1);
            let w = get_bits(w1, 0, 5);
            cs.skip_words(1);
            let extra = cs.bitfield(O, o, W, w);
            let sz = 0;
            let src = OperandType.NoOperand;
            let dst = cs.ea(r, m, 0);
            return cs.check_overflow(new Instruction (
                sz,
                Operation.BFSET,
                [src, dst],
                extra
            ));
        }
    }
    if ((w0 & 0b1111111111000000) == 0b1110100011000000 && cs.has_words(1)) {
        let w1 = cs.peek_word(0);
        if ((w1 & 0b1111000000000000) == 0b0000000000000000) {
            let m = get_bits(w0, 3, 3);
            let r = get_bits(w0, 0, 3);
            let O = get_bits(w1, 11, 1);
            let o = get_bits(w1, 6, 5);
            let W = get_bits(w1, 5, 1);
            let w = get_bits(w1, 0, 5);
            cs.skip_words(1);
            let extra = cs.bitfield(O, o, W, w);
            let sz = 0;
            let src = OperandType.NoOperand;
            let dst = cs.ea(r, m, 0);
            return cs.check_overflow(new Instruction (
                sz,
                Operation.BFTST,
                [src, dst],
                extra
            ));
        }
    }
    if ((w0 & 0b1111000111111000) == 0b1110000100000000) {
        let c = get_bits(w0, 9, 3);
        if (c == 0) c = 8;
        let r = get_bits(w0, 0, 3);
        let sz = 1;
        let src = new Operand(OperandType.IMM8, c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ASL,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000101000000) {
        let c = get_bits(w0, 9, 3);
        if (c == 0) c = 8;
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = new Operand(OperandType.IMM8, c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ASL,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000110000000) {
        let c = get_bits(w0, 9, 3);
        if (c == 0) c = 8;
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = new Operand(OperandType.IMM8, c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ASL,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000000000000) {
        let c = get_bits(w0, 9, 3);
        if (c == 0) c = 8;
        let r = get_bits(w0, 0, 3);
        let sz = 1;
        let src = new Operand(OperandType.IMM8, c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ASR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000001000000) {
        let c = get_bits(w0, 9, 3);
        if (c == 0) c = 8;
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = new Operand(OperandType.IMM8, c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ASR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000010000000) {
        let c = get_bits(w0, 9, 3);
        if (c == 0) c = 8;
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = new Operand(OperandType.IMM8, c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ASR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000100100000) {
        let c = get_bits(w0, 9, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 1;
        let src = cs.data_reg_op(c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ASL,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000101100000) {
        let c = get_bits(w0, 9, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = cs.data_reg_op(c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ASL,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000110100000) {
        let c = get_bits(w0, 9, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = cs.data_reg_op(c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ASL,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000000100000) {
        let c = get_bits(w0, 9, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 1;
        let src = cs.data_reg_op(c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ASR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000001100000) {
        let c = get_bits(w0, 9, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = cs.data_reg_op(c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ASR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000010100000) {
        let c = get_bits(w0, 9, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = cs.data_reg_op(c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ASR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000100001000) {
        let c = get_bits(w0, 9, 3);
        if (c == 0) c = 8;
        let r = get_bits(w0, 0, 3);
        let sz = 1;
        let src = new Operand(OperandType.IMM8, c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.LSL,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000101001000) {
        let c = get_bits(w0, 9, 3);
        if (c == 0) c = 8;
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = new Operand(OperandType.IMM8, c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.LSL,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000110001000) {
        let c = get_bits(w0, 9, 3);
        if (c == 0) c = 8;
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = new Operand(OperandType.IMM8, c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.LSL,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000000001000) {
        let c = get_bits(w0, 9, 3);
        if (c == 0) c = 8;
        let r = get_bits(w0, 0, 3);
        let sz = 1;
        let src = new Operand(OperandType.IMM8, c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.LSR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000001001000) {
        let c = get_bits(w0, 9, 3);
        if (c == 0) c = 8;
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = new Operand(OperandType.IMM8, c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.LSR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000010001000) {
        let c = get_bits(w0, 9, 3);
        if (c == 0) c = 8;
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = new Operand(OperandType.IMM8, c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.LSR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000100101000) {
        let c = get_bits(w0, 9, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 1;
        let src = cs.data_reg_op(c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.LSL,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000101101000) {
        let c = get_bits(w0, 9, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = cs.data_reg_op(c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.LSL,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000110101000) {
        let c = get_bits(w0, 9, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = cs.data_reg_op(c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.LSL,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000000101000) {
        let c = get_bits(w0, 9, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 1;
        let src = cs.data_reg_op(c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.LSR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000001101000) {
        let c = get_bits(w0, 9, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = cs.data_reg_op(c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.LSR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000010101000) {
        let c = get_bits(w0, 9, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = cs.data_reg_op(c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.LSR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000100010000) {
        let c = get_bits(w0, 9, 3);
        if (c == 0) c = 8;
        let r = get_bits(w0, 0, 3);
        let sz = 1;
        let src = new Operand(OperandType.IMM8, c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ROXL,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000101010000) {
        let c = get_bits(w0, 9, 3);
        if (c == 0) c = 8;
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = new Operand(OperandType.IMM8, c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ROXL,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000110010000) {
        let c = get_bits(w0, 9, 3);
        if (c == 0) c = 8;
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = new Operand(OperandType.IMM8, c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ROXL,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000000010000) {
        let c = get_bits(w0, 9, 3);
        if (c == 0) c = 8;
        let r = get_bits(w0, 0, 3);
        let sz = 1;
        let src = new Operand(OperandType.IMM8, c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ROXR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000001010000) {
        let c = get_bits(w0, 9, 3);
        if (c == 0) c = 8;
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = new Operand(OperandType.IMM8, c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ROXR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000010010000) {
        let c = get_bits(w0, 9, 3);
        if (c == 0) c = 8;
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = new Operand(OperandType.IMM8, c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ROXR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000100110000) {
        let c = get_bits(w0, 9, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 1;
        let src = cs.data_reg_op(c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ROXL,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000101110000) {
        let c = get_bits(w0, 9, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = cs.data_reg_op(c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ROXL,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000110110000) {
        let c = get_bits(w0, 9, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = cs.data_reg_op(c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ROXL,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000000110000) {
        let c = get_bits(w0, 9, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 1;
        let src = cs.data_reg_op(c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ROXR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000001110000) {
        let c = get_bits(w0, 9, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = cs.data_reg_op(c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ROXR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000010110000) {
        let c = get_bits(w0, 9, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = cs.data_reg_op(c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ROXR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000100011000) {
        let c = get_bits(w0, 9, 3);
        if (c == 0) c = 8;
        let r = get_bits(w0, 0, 3);
        let sz = 1;
        let src = new Operand(OperandType.IMM8, c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ROL,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000101011000) {
        let c = get_bits(w0, 9, 3);
        if (c == 0) c = 8;
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = new Operand(OperandType.IMM8, c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ROL,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000110011000) {
        let c = get_bits(w0, 9, 3);
        if (c == 0) c = 8;
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = new Operand(OperandType.IMM8, c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ROL,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000000011000) {
        let c = get_bits(w0, 9, 3);
        if (c == 0) c = 8;
        let r = get_bits(w0, 0, 3);
        let sz = 1;
        let src = new Operand(OperandType.IMM8, c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ROR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000001011000) {
        let c = get_bits(w0, 9, 3);
        if (c == 0) c = 8;
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = new Operand(OperandType.IMM8, c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ROR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000010011000) {
        let c = get_bits(w0, 9, 3);
        if (c == 0) c = 8;
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = new Operand(OperandType.IMM8, c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ROR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000100111000) {
        let c = get_bits(w0, 9, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 1;
        let src = cs.data_reg_op(c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ROL,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000101111000) {
        let c = get_bits(w0, 9, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = cs.data_reg_op(c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ROL,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000110111000) {
        let c = get_bits(w0, 9, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = cs.data_reg_op(c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ROL,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000000111000) {
        let c = get_bits(w0, 9, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 1;
        let src = cs.data_reg_op(c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ROR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000001111000) {
        let c = get_bits(w0, 9, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = cs.data_reg_op(c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ROR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111000111111000) == 0b1110000010111000) {
        let c = get_bits(w0, 9, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 4;
        let src = cs.data_reg_op(c);
        let dst = cs.data_reg_op(r);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ROR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b1110000111000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = OperandType.Implied;
        let dst = cs.ea(r, m, sz);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ASL,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b1110000011000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = OperandType.Implied;
        let dst = cs.ea(r, m, sz);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ASR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b1110001111000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = OperandType.Implied;
        let dst = cs.ea(r, m, sz);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.LSL,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b1110001011000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = OperandType.Implied;
        let dst = cs.ea(r, m, sz);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.LSR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b1110010111000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = OperandType.Implied;
        let dst = cs.ea(r, m, sz);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ROXL,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b1110010011000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = OperandType.Implied;
        let dst = cs.ea(r, m, sz);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ROXR,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b1110011111000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = OperandType.Implied;
        let dst = cs.ea(r, m, sz);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ROL,
            [src, dst],
            extra
        ));
    }
    if ((w0 & 0b1111111111000000) == 0b1110011011000000) {
        let m = get_bits(w0, 3, 3);
        let r = get_bits(w0, 0, 3);
        let sz = 2;
        let src = OperandType.Implied;
        let dst = cs.ea(r, m, sz);
        let extra = NoExtra;
        return cs.check_overflow(new Instruction (
            sz,
            Operation.ROR,
            [src, dst],
            extra
        ));
    }
    debugger;
    runtimeError68k("assembler error: wrong opcode at ofs " + _adrs);
}

function decode_group_1111(w0, cs, _adrs) {
    debugger;
    let opcode = "";
    for (let oi =0; oi < 2; oi++) {
        let newByte = cs.bytes[oi].toString(16);
        while (newByte.length < 2) newByte = "0" + newByte; 
        opcode += newByte;
      }  

    runtimeError68k("Disassembler can't proceed: Looks like a FPU instruction (not supported). At ofs: " + _adrs + ", Opcode starts with: $" + opcode);
}

// code : u8 array
function decode_instruction_generated(code, _adrs) {
    _adrs = "$" + _adrs.toString(16);
    let cs = new CodeStream(code);
    let w0 = cs.pull16();
    let group = w0>>12;
    switch (group) {
        case 0b0000: return decode_group_0000(w0, cs, _adrs);
        case 0b0001: return decode_group_0001(w0, cs, _adrs);
        case 0b0010: return decode_group_0010(w0, cs, _adrs);
        case 0b0011: return decode_group_0011(w0, cs, _adrs);
        case 0b0100: return decode_group_0100(w0, cs, _adrs);
        case 0b0101: return decode_group_0101(w0, cs, _adrs);
        case 0b0110: return decode_group_0110(w0, cs, _adrs);
        case 0b0111: return decode_group_0111(w0, cs, _adrs);
        case 0b1000: return decode_group_1000(w0, cs, _adrs);
        case 0b1001: return decode_group_1001(w0, cs, _adrs);
        case 0b1011: return decode_group_1011(w0, cs, _adrs);
        case 0b1100: return decode_group_1100(w0, cs, _adrs);
        case 0b1101: return decode_group_1101(w0, cs, _adrs);
        case 0b1110: return decode_group_1110(w0, cs, _adrs);
        case 0b1111: return decode_group_1111(w0, cs, _adrs);
        default:
            runtimeError68k("assembler error: unknown opcode");
            debugger;
        break;
    }
    return null;
}