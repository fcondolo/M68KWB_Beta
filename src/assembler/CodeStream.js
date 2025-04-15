const NoExtra = 0;

const DataRegister = { 
    D0 : 0, 
    D1 : 1,
    D2 : 2,
    D3 : 3, 
    D4 : 4, 
    D5 : 5,
    D6 : 6,
    D7 : 7,
    None : 8
};

const AddressRegister = { 
    A0 : 0, 
    A1 : 1,
    A2 : 2,
    A3 : 3, 
    A4 : 4, 
    A5 : 5,
    A6 : 6,
    A7 : 7,
    None : 8
};

const ConditionCode = {
    /// Always True        
    CC_T  : 0b0000,
    /// Always False       
    CC_F  : 0b0001,
    /// High               
    CC_HI : 0b0010,
    /// Low or Same        
    CC_LS : 0b0011,
    /// Carry Clear        
    CC_CC : 0b0100,
    /// Carry Set          
    CC_CS : 0b0101,
    /// Not Equal          
    CC_NE : 0b0110,
    /// Equal              
    CC_EQ : 0b0111,
    /// Overflow Clear     
    CC_VC : 0b1000,
    /// Overflow Set       
    CC_VS : 0b1001,
    /// Plus               
    CC_PL : 0b1010,
    /// Negative           
    CC_MI : 0b1011,
    /// Greater or Equal   
    CC_GE : 0b1100,
    /// Less               
    CC_LT : 0b1101,
    /// Greater            
    CC_GT : 0b1110,
    /// Less or Equal      
    CC_LE : 0b1111
};


const InstructionExtraType = {
    /// No additional attributes available.
    NoExtra : 0,
    /// For 68020+ bitfield instructions, specifies the bitfield offset and width of the EA.
    Bitfield : 1,
    /// For instructions involving a CPU condition code (e.g. `DBcc`), specifies the condition code
    /// tested.
    Condition : 2,
    /// For instructions involving a FPU condition code (e.g. `FDBcc`), specifies the condition code
    /// tested.
    FPCondition : 3,
    /// Specifies the pack adjustment for BCD packing.
    PackAdjustment : 4,
    /// Specifies the float format of a memory operand for FPU instructions that use a memory EA.
    FloatFormat : 5
};

class InstructionExtra {
    constructor(_type, _data) {
        let t = this;
        t.type = _type;
        t.data = _data;
      }    
}

class Instruction {
    constructor(_size = 2, _operation = 0, _operands = [], _extra = null) {
        let t = this;
        /// The size of any data movement (the number of bytes read or written).
        t.size = _size;
        /// The instruction itself.
        t.operation = _operation;
        /// The two operands involved, source and destination.
        t.operands = _operands;
        /// Any additional data required to make sense of the operation.
        t.extra = _extra;
      }    
}


const BitfieldDataType = {
    /// The offset or width is static.
    STATIC : 1,
    /// The offset or width is dynamic and specified via a data register.
    DYNAMIC : 2
};

class BitfieldData {
    constructor(_type, _data) {
        let t = this;
        t.type = _type;
        t.data = _data;
      }    
}

const MemoryIndirection = {
    /// No memory indirection.
    NoIndirection : null,
    /// Regular memory indirection.
    Indirect : 1,
    /// Memory pre-indexed indirection (indexer applies to inner array).
    IndirectPreIndexed : 2,
    /// Memory post-indexed indirection (indexer applies to outer array).
    IndirectPostIndexed : 3
};

/// Indicates how indexing is to be performed.
const IndexerType = {
    /// Indexing suppressed
    NoIndexer : null,
    /// Index using data register
    DR : 1,
    /// Index using address register
    AR : 2
};

class Indexer {
    constructor(_type, _data) {
        let t = this;
        t.type = _type;
        t.data = _data;
      }    
}


class Displacement {
    constructor(_type, _base, _outer, _indexer, _indirection) {
        let t = this;
        t.type = _type;
        t.base_displacement = _base;
        t.outer_displacement = _outer;
        t.indexer = _indexer;
        t.indirection = _indirection;
      }    
}

function simple_disp(disp) {
    return new Displacement(OperandType.DISP, disp, 0, new Indexer(IndexerType.NoIndexer,null), MemoryIndirection.NoIndirection);
}

class Operand {
    constructor(_type, _data) {
        let t = this;
        t.type = _type;
        t.data = _data;
      }    
};

const OperandType = {
    /// No operand present, used for instructions that have fewer than two operands.
    NoOperand : null,
    /// The operand is implied, for example when the CCR is being moved to or from.
    ///
    /// When the operand is implied, the instruction documentation must be consulted to see what
    /// data is being affected.
    Implied : 1,
    /// An immediate 8-bit value.
    ///
    /// Stored as unsigned, but it often needs to be interpreted as signed.
    IMM8 : 2,
    /// An immediate 16-bit value.
    ///
    /// Stored as unsigned, but it often needs to be interpreted as signed.
    IMM16 : 3,
    /// An immediate 32-bit value.
    ///
    /// Stored as unsigned, but it often needs to be interpreted as signed.
    IMM32 : 4,
    /// An absolute address, given as a sign-extended 16-bit value.
    ABS16 : 5,
    /// An absolute address, given as a full 32-bit value.
    ABS32 : 6,
    /// A data register
    DR : 7,
    /// An address register
    AR  : 8,
    /// A vanilla indrection without displacement, e.g. `(a0)`
    ARIND : 9,
    /// Address register indirect with post-increment, e.g. `(a0)+`
    ARINC : 10,
    /// Address register indirect with pre-decrement, e.g. `-(a0)`
    ARDEC : 11,
    /// Address register indirect with displacement, e.g. `123(pc,d0)`
    ARDISP : 12,
    /// Program counter indirect with displacement, e.g. `123(pc,d0)`
    PCDISP : 13,
    /// Just a displacement (skipping the base register), e.g. `123(d0)`
    DISP : 14,
    /// A data register pair, used for 64-bit multiply/divide results.
    DPAIR : 15,
    /// A floating point register pair, used for `FSINCOS`. First register receives the sine, the
    /// other the cosine.
    FPAIR : 16,
    /// A register bitmask for `MOVEM` or `FMOVEM`. The order of registers is reversed depending on
    /// whether the address register is pre-decremented or post-incremented.
    REGLIST : 17,
    /// A control register
    CONTROLRE : 18
};

function get_bits(word, first, length){
    const s = word >> first;
    const mask = (1 << length) - 1;
    return s & mask
}

class DecodedInstruction {
    constructor(_bytes, _i) {
        let t = this;
        t.bytes_used   = _bytes;
        t.instruction  = _i;
        t.error   = null;
      }  
}

class CodeStream {
    constructor(_bytes, _pos = 0) {
      let t = this;
      t.bytes   = _bytes;
      t.pos     = _pos;
      t.error   = null;
    }

    failed(_s) {
        this.error = _s;
        console.error("CodeStream error: " + _s);
        debugger;
    }

    check_overflow(i) {
        let t = this;
        if (t.error == null)
            return new DecodedInstruction(t.pos, i);
        else {
            t.failed(t.error);
            return null;            
        }
    }

    has_words(count) {
        let t = this;
        return t.pos + count * 2 <= t.bytes.length;
    }

    peek_word(offset) {
        let t = this;
        let p = t.pos + offset;
        if (p + 2 <= t.bytes.length) {
            return (t.bytes[p] << 8) | (t.bytes[p + 1]);
        } else {
            t.error = "peek_word: overflow";
        }
    }

    skip_words(count) {
        this.pos += 2 * count;
    }

    pull16() {
        let t = this;
        let result = t.peek_word(0);
        t.pos += 2;
        return result;
    }

    pull32() {
        let t = this;
        const a = t.pull16();
        const b = t.pull16();
        return (a << 16) | b;
    }

    data_reg(r) {
        switch(r) {
            case 0: return DataRegister.D0;
            case 1: return DataRegister.D1;
            case 2: return DataRegister.D2;
            case 3: return DataRegister.D3;
            case 4: return DataRegister.D4;
            case 5: return DataRegister.D5;
            case 6: return DataRegister.D6;
            case 7: return DataRegister.D7;
            default:
                this.failed("bad data register: " + r);
                return AddressRegister.None;
            }
    }

    address_reg(r) {
        switch(r) {
            case 0: return AddressRegister.A0;
            case 1: return AddressRegister.A1;
            case 2: return AddressRegister.A2;
            case 3: return AddressRegister.A3;
            case 4: return AddressRegister.A4;
            case 5: return AddressRegister.A5;
            case 6: return AddressRegister.A6;
            case 7: return AddressRegister.A7;
            default:
                this.failed("bad address register: " + r);
                return AddressRegister.None;
        }
    }
    
    data_reg_op(r) {
        return new Operand(OperandType.DR, this.data_reg(r));
    }

    address_reg_op(r) {
        return new Operand(OperandType.AR, this.address_reg(r));
    }

    ea(src_reg, src_mod, size) {
        let self = this;
        switch (src_mod) {
            case 0b000: return new Operand(OperandType.DR, self.data_reg(src_reg));
            case 0b001: return new Operand(OperandType.AR, self.address_reg(src_reg));
            case 0b010: return new Operand(OperandType.ARIND, self.address_reg(src_reg));
            case 0b011: return new Operand(OperandType.ARINC, self.address_reg(src_reg));
            case 0b100: return new Operand(OperandType.ARDEC, self.address_reg(src_reg));
            case 0b101: return new Operand(OperandType.ARDISP, {reg:self.address_reg(src_reg), disp:simple_disp(self.pull16())});
            case 0b110: return self.decode_extended_ea(self.address_reg(src_reg));
            case 0b111:
                switch(src_reg) {
                    case 0b000: return new Operand(OperandType.ABS16, self.pull16());
                    case 0b001: return new Operand(OperandType.ABS32, self.pull32());
                    case 0b010: return new Operand(OperandType.PCDISP, {ofs:self.pos, disp:simple_disp(self.pull16())});
                    case 0b011: return self.decode_extended_ea(AddressRegister.None);
                    case 0b100:
                        switch(size) {
                            case 1: return new Operand(OperandType.IMM8, self.pull16());
                            case 2: return new Operand(OperandType.IMM16, self.pull16());
                            case 4: return new Operand(OperandType.IMM32, self.pull32());
                            default: {
                                self.failed("bad size: " + size);
                                return null;
                            }
                        }
                        default:{
                            self.failed("ea: unknown effective address mode");
                            return null;
                        }
                }
            default:{
                self.failed("ea: unknown effective address mode");
                return null;
            }
        }
    }
    
   

    decode_extended_ea(src_reg) {
        let self = this;
        let pc_off = self.pos;
        let ext = self.pull16();
        let scale = get_bits(ext, 9, 2);
        let idx = get_bits(ext, 12, 3);
        let idx_is_a = get_bits(ext, 15, 1) == 1;

        if (0 != (ext & (1 << 8))) {
            // Handle full extension word.
            let bd = get_bits(ext, 4, 2);
            let od = get_bits(ext, 0, 2);
            let disp = null;
            switch(bd) {
                case 0: self.failed("reserved");  disp = 0; break;
                case 1: disp = 0; break;
                case 2: disp = self.pull16(); break;
                case 3: disp = self.pull32(); break;
                default: self.failed("decode_extended_ea failed");  disp = 0; break;
            }
            let odisp = null;
            switch(od) {
                case 0: odisp = 0; break;
                case 1: odisp = 0; break;
                case 2: odisp = self.pull16(); break;
                case 3: odisp = self.pull32(); break;
                default: self.failed("decode_extended_ea failed");  odisp = 0; break;
            }

            let suppress_base = get_bits(ext, 7, 1) == 1;
            let suppress_indexer = get_bits(ext, 6, 1) == 1;

            let indirection_mode = null;
            if(suppress_indexer) {
                switch (get_bits(ext, 0, 3)) {
                    case 0b000: indirection_mode = MemoryIndirection.NoIndirection; break;
                    case 0b001: indirection_mode = MemoryIndirection.Indirect; break;
                    case 0b010: indirection_mode = MemoryIndirection.Indirect; break;
                    case 0b011: indirection_mode = MemoryIndirection.Indirect; break;
                    default: self.failed("reserved"); indirection_mode = MemoryIndirection.NoIndirection; break;
                }
            } else {
                switch(get_bits(ext, 0, 3)) {
                    case 0b000: indirection_mode = MemoryIndirection.NoIndirection; break;
                    case 0b001: indirection_mode = MemoryIndirection.IndirectPreIndexed; break;
                    case 0b010: indirection_mode = MemoryIndirection.IndirectPreIndexed; break;
                    case 0b011: indirection_mode = MemoryIndirection.IndirectPreIndexed; break;
                    case 0b100: self.failed("reserved"); indirection_mode = MemoryIndirection.NoIndirection; break;
                    case 0b101: indirection_mode = MemoryIndirection.IndirectPostIndexed; break;
                    case 0b110: indirection_mode = MemoryIndirection.IndirectPostIndexed; break;
                    case 0b111: indirection_mode = MemoryIndirection.IndirectPostIndexed; break;
                    default: self.failed("reserved"); indirection_mode = MemoryIndirection.NoIndirection; break;
                }
            }
            

            let indexer = null;
            if (suppress_indexer)
                indexer = new Indexer(IndexerType.NoIndexer,null);
            else {
                if (idx_is_a) {
                    indexer = new Indexer(IndexerType.AR, {reg:self.address_reg(idx), scale:scale});
                } else {
                    indexer = new Indexer(IndexerType.DR, {reg:self.data_reg(idx), scale:scale});
                }
            }

            if (suppress_base) {
                return new Operand(OperandType.DISP, {disp:new Displacement(OperandType.DISP, disp, odisp, indexer, indirection_mode)});
            } else {
                if (src_reg == AddressRegister.None) {
                    return new Operand(OperandType.PCDISP, {disp:new Displacement(OperandType.PCDISP, disp, odisp, indexer, indirection_mode)});
                } else {
                    return new Operand(OperandType.ARDISP, {disp:new Displacement(OperandType.ARDISP, disp, odisp, indexer, indirection_mode)});
                }
            }
        } else {
            // Handle brief extension word
            let disp = ext & 0xff;
            let indexer =  null;
            if (idx_is_a) {
                indexer = new Indexer(IndexerType.AR, {reg: self.address_reg(idx), scale: scale});
            } else {
                indexer = new Indexer(IndexerType.DR, {reg: self.data_reg(idx), scale: scale});
            }

            let displacement = new Displacement(OperandType.DISP, disp, 0, indexer, MemoryIndirection.NoIndirection);

            if (src_reg == AddressRegister.None)
                return new Operand(OperandType.PCDISP, {ofs:pc_off, disp:simple_disp(displacement)});
            else
                return new Operand(OperandType.ARDISP, {ofs:src_reg, disp:simple_disp(displacement)});
        }
    }

    imm8() {
        return new Operand(OperandType.IMM8, this.pull16());
    }

    imm16() {
        return new Operand(OperandType.IMM16, this.pull16());
    }

    imm32() {
        return new Operand(OperandType.IMM32, this.pull32());
    }

    dar(d_or_a, regno) {
        let self = this;
        if (d_or_a == 0)
            return new Operand(OperandType.DR, self.data_reg(regno));
        else
            return new Operand(OperandType.AR, self.address_reg(regno));
    }

    bitfield(dyn_off, off, dyn_width, width) {
        let self = this;
        let bf_offset = null;
        if (dyn_off == 0) {
            let dat = null;
            if (off & 31 == 0) dat = 32; else dat =  (off & 31);
            bf_offset = new BitfieldData(BitfieldDataType.STATIC, dat);
        }
        else
            bf_offset = new BitfieldData(BitfieldDataType.DYNAMIC, self.data_reg(off));
            
        let bf_width = null;
        if (dyn_width == 0) {
            let dat = null;
            if (width & 31 == 0) dat = 32; else dat =  (width & 31);
            bf_width = new BitfieldData(BitfieldDataType.STATIC, dat);
        } 
        else
            bf_width = new BitfieldData(BitfieldDataType.DYNAMIC, self.data_reg(width));

        return new InstructionExtra(InstructionExtraType.Bitfield, {ofs:bf_offset, width:bf_width});
    }

    cc(c) {
        let self = this;
        let value = null;
        switch(c) {
            case 0b0000: value = ConditionCode.CC_T; break;         // Always True
            case 0b0001: value = ConditionCode.CC_F; break;         // Always False
            case 0b0010: value = ConditionCode.CC_HI; break;         // High
            case 0b0011: value = ConditionCode.CC_LS; break;         // Low or Same
            case 0b0100: value = ConditionCode.CC_CC; break;         // Carry Clear
            case 0b0101: value = ConditionCode.CC_CS; break;         // Carry Set
            case 0b0110: value = ConditionCode.CC_NE; break;         // Not Equal
            case 0b0111: value = ConditionCode.CC_EQ; break;         // Equal
            case 0b1000: value = ConditionCode.CC_VC; break;         // Overflow Clear
            case 0b1001: value = ConditionCode.CC_VS; break;         // Overflow Set
            case 0b1010: value = ConditionCode.CC_PL; break;         // Plus
            case 0b1011: value = ConditionCode.CC_MI; break;         // Negative
            case 0b1100: value = ConditionCode.CC_GE; break;         // Greater or Equal
            case 0b1101: value = ConditionCode.CC_LT; break;         // Less
            case 0b1110: value = ConditionCode.CC_GT; break;         // Greater
            default: value = ConditionCode.CC_LE; break;         // Less or Equal
        }

        return new InstructionExtra(InstructionExtraType.Condition, value);
    }

    quick_const(i) {
        let self = this;
        let value = null;
        if (i == 0)
            value = 8;
        else
            value = i;
        return new Operand(OperandType.IMM8, value);
    }
}

