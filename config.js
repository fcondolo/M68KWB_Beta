// -----------------------------------------------------------------------
// ------------------ ASSEMBLER / DISASSEMBLER SETTINGS ------------------
// -----------------------------------------------------------------------
const ASSEMBLER_CONFIG = {
    // --------------------------------------------------
    // CORE SETTINGS
    // --------------------------------------------------

    // bytes reserved to assemble the code in memory
    CPU_CODE_SECTION_BYTES : 64*1024,


    // --------------------------------------------------
    // ASSEMBLER COMPATIBILITY SETTINGS
    // --------------------------------------------------
    // This section lists issues I had trying to compile with different options using vasm. Especially, "-devpac" mode on vasm to generate Atari executables is less permissive than vasm for Amiga for example.
    // So the below flags allow additional checks to ensure real assembler compatibility.

    // forbid things like "move.w #3* 2,d0" and forces no spaces after an operator.
    no_space_after_operator : true,

    // forbid things like "move.w #42, d0" and forces no spaces after the coma separating source and dest args.
    no_space_after_coma : true,

    // when defining constants using "EQU" or "=", vasm (at least in devpac mode) needs to have the constant (label) name start at the beginning of the line (1st column).
    // otherwise, you'll get a "unknown mnemonic" error.
    no_space_before_EQU : true,

    // Throw a blocking error if a word or long is declared at an odd address using dc.x, e.g:
    // dc.b v1  ; next address will be odd
    // dc.w v2  ; declaring a word at an odd address ==> throw error!
    check_dc_align : true,

    // If true, logs in your browser's console all the evaluations of conditional expressions.
    // It will also log constants that are registered as the assembly goes on (EQU, =)
    // Can be used to understand what is assembed and what isn't
    // e.g. IFD,IFND,IFEQ, etc.
    log_conditional_blocks : false,

    // --------------------------------------------------
    // MISC SETTINGS
    // --------------------------------------------------
    
    // the below array lists constants that will be automatically defined when assembling code.
    // this can be useful to have specific code assembled only on the real emulator/machine and vice-versa.
    // e.g. IFD M68KWB .... ELSE ... ENDC
    defines : [
        {name: "M68KWB", value: 1}, // DO NOT REMOVE THIS ONE!!!!! same as "M68KWB EQU 1" in a .asm file
        //... add your own defines here
    ],

    overrideIncludes : [
        {override: "ldos_atari.inc", with: null}    // ignore inclusions of LDOS
    ],

    // verify that the destination address is within range when using short branches (e.g. bcc.s, bcc.b)
    check_branch_size : true,

    // number of instructions that can be rewound
    time_machine : 128,

    // Allow ds.x 0, e.g: "ds.l 0". Not allowed by default, avoids stupid mistakes when wanting to tyoe "dc.l 0" and typing "ds.l 0" instead 
    allow_ds_0 : false,

    // if true (recommended), for a given macro, the MACRO and ENDM keywords will need to be in the same file. This avoids declaring MACRO and forgetting the ENDM
    foce_same_file_macro : true
};


// -----------------------------------------------------------------------
// -------------------------- DEBUGGER SETTINGS --------------------------
// -----------------------------------------------------------------------
const DEBUGGER_CONFIG = {
    // Maximum hardware breakpoints count (set from the command line). The more, the slower ;)
    MAX_HW_BPT: 4,

    // Tells whether the debugger should show DC.B/W/L lines or not
    SHOW_DC: true,

    // --------------------------------------------------
    // SYNTAX COLORING SETTINGS
    // HTML web colors (#rrggbb, check on the web if you don't know what HTML colors are)
    // Why is it not in the .css file? Because.
    // if you want to change the lne highlight color when tracing or placing a break point, look for .highlight_row in soundy.css
    // --------------------------------------------------
    sytax_coloring: {
        defaultCol      : '#389edb',
        InstrSizeCol    : '#187ebb',
        LabelCol        : '#78cfdb',
        JSCol           : '#d8cfdb',
        CommentCol      : '#489fab',
        arg_imm_col     : '#00c5ff',
        arg_abs_col     : '#c500ff',
        arg_reg_col     : '#889efb',
        arg_ind_col     : '#dda500'
    }
};


// -----------------------------------------------------------------------
// ---------------------------- CPU SETTINGS -----------------------------
// -----------------------------------------------------------------------
let CPU_CONFIG = {
    // infers a breakpoint at runtime if there's a division overflow
    check_div_overflow : true,

    // This setting is used to detect infinite loops
    // If a frame executes more than watchdog_maxInstr CPU instructions, the execution pauses (the system enters the debugger in step mode).
    // Note that you can change this value at runtime (for example when you need to precalc huge tables at init):
    // From ASM code:
    // ;>JS CPU_CONFIG.watchdog_maxInstr = 0
    // From JS code:
    // CPU_CONFIG.watchdog_maxInstr = 0;
    // Setting this param to 0 disables the watchdog feature
    watchdog_maxInstr : 400000
}

// -----------------------------------------------------------------------
// ------------------------- AMIGA OCS SETTINGS --------------------------
// -----------------------------------------------------------------------
const OCS_CONFIG = {
    RAMSIZE                 : 512 * 1024,
    STACKSIZE               : 4 * 1024,
    // ticks per second is used to trigger VBL interrupts
    M68K_TICKS_PER_SECOND   : 7140000,
    // Copper X coordinate of the first visible bitplane pixel (leftmost pixel) for low resolution, without overscan.
    COPPER_SCREEN_LEFT_X    : 0x2d,
    // Avoid drawing insanely long lines and freeze your browser 8below value is max dx or dy in pixels)
    AMIGA_line_maxLen       : 1000,
    // Tries to force you to wait for blitter before any write to BLTSIZE.
    // Blitter operations are executed immediately and entierely, so in M68KWB, there is no need to wait for Blitter.
    // Still, to help avoid issues on the real Amiga, a flag is set when the blitter starts. 
    // This flag is cleared whenever an instruction reads DMACONR (not even bit 6, just any bus read access to DMACONR).
    // When the blitter starts, it checks if the flag is cleared, and raises a breakpoint otherwise.
    force_blitter_wait      : true
}

// -----------------------------------------------------------------------
// -------------------------- ATARI ST SETTINGS --------------------------
// -----------------------------------------------------------------------
const ST_CONFIG = {
    RAMSIZE                 : 512 * 1024,
    STACKSIZE               : 4 * 1024,
    // ticks per second is used to trigger VBL interrupts
    M68K_TICKS_PER_SECOND   : 8000000
}

// -----------------------------------------------------------------------
// ------------------------- ATARI STe SETTINGS --------------------------
// -----------------------------------------------------------------------
const STE_CONFIG = {
    CHECK_VIDEO_BASE_ADRS   : true,         // make sure that video base address is even (low bit is ignored by the hardware, having this option to true makes sure the lowet bit is no used)
    RAMSIZE                 : 2048 * 1024,
    STACKSIZE               : 4 * 1024,
    // ticks per second is used to trigger VBL interrupts
    M68K_TICKS_PER_SECOND   : 8000000
}
