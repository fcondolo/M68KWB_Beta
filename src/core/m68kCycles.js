// ==> IMPLEMENTED IN FUNCTION SetInstrCycle() in file LineParser.js

// Cycles table stolen from Dio https://www.atari-forum.com/viewtopic.php?t=16240

/*
// the first is the cycle count for each 68000 instruction when the previous and next instructions don't do anything odd with phasing, and all memory operations are to main RAM (the shifter domain, subject to waitstates).
// - The second describes the phasing effects for each instruction. An 'L' indicates that the instruction finishes on the odd phase ('leaves' odd phase); an 'A' indicates the instruction pairs with a preceding instruction if it starts on the odd phase ('accepts' odd phase). The simple rule is that if an A instruction follows an L instruction in your instruction stream you save 4 cycles.
const m68kcyclesdata = "\n
Name                : Dn   An  (A)  (A)+ -(A) $(A) I(A)  .W   .L  $(P) I(P)  #\n
add.w *,d0             4    4    8    8   12   12   16   12   16   12   16    8\n
add.w d0,*                      12   12   16   16   20   16   20\n
adda.w *,a1            8    8   12   12   16   16   20   16   20   16   20   12\n
add.w #1,*             8        16   16   20   20   24   20   24\n
addq.w #1,*            4    8   12   12   16   16   20   16   20\n
addx.w *,*             4                  20\n
and.w *,d0             4         8    8   12   12   16   12   16   12   16    8\n
and.w d0,*                      12   12   16   16   20   16   20\n
and.w #1,*             8        16   16   20   20   24   20   24\n
asl.w #7,d0           20\n
asl.w d0,d0           16\n
asr.w #7,d0           20\n
asr.w d0,d0           16\n
clr.w *                4        12   12   16   16   20   16   20\n
cmp.w *,d0             4    4    8    8   12   12   16   12   16   12   16    8\n
cmpa.w *,a1            8    8   12   12   16   16   20   16   20   16   20   12\n
cmp.w #1,*             8        12   12   16   16   20   16   20\n
eor.w d0,*             4        12   12   16   16   20   16   20\n
eor.w #1,*             8        16   16   20   20   24   20   24\n
lsl.w #7,d0           20\n
lsl.w d0,d0           16\n
lsr.w #7,d0           20\n
lsr.w d0,d0           16\n
move.w *,d0            4    4    8    8   12   12   16   12   16   12   16    8\n
move.w *,a1            4    4    8    8   12   12   16   12   16   12   16    8\n
move.w *,(a1)          8    8   12   12   16   16   20   16   20   16   20   12\n
move.w *,(a1)+         8    8   12   12   16   16   20   16   20   16   20   12\n
move.w *,-(a1)         8    8   12   12   16   16   20   16   20   16   20   12\n
move.w *,24(a1)       12   12   16   16   20   20   24   20   24   20   24   16\n
move.w *,20(a1,d0.w)  16   16   20   20   24   24   28   24   28   24   28   20\n
move.w *,$200.w       12   12   16   16   20   20   24   20   24   20   24   16\n
move.w *,scratchpad   16   16   20   20   24   24   28   24   28   24   28   20\n
movem.w *,d0-d3                 28   28        32   36   32   36\n
movem.w d0-d3,*                 24        24   28   32   28   32\n
movep.w d0,4(a1)      16\n
movep.w 4(a0),d0      16\n
neg.w *                4        12   12   16   16   20   16   20\n
negx.w *               4        12   12   16   16   20   16   20\n
not.w *                4        12   12   16   16   20   16   20\n
or.w *,d0              4         8    8   12   12   16   12   16   12   16    8\n
or.w d0,*                       12   12   16   16   20   16   20\n
or.w #1,*              8        16   16   20   20   24   20   24\n
rol.w #7,d0           20\n
rol.w d0,d0           16\n
ror.w #7,d0           20\n
ror.w d0,d0           16\n
roxl.w #7,d0          20\n
roxl.w d0,d0          16\n
roxr.w #7,d0          20\n
roxr.w d0,d0          16\n
sub.w *,d0             4    4    8    8   12   12   16   12   16   12   16    8\n
sub.w d0,*                      12   12   16   16   20   16   20\n
suba.w *,a1            8    8   12   12   16   16   20   16   20   16   20   12\n
sub.w #1,*             8        16   16   20   20   24   20   24\n
subq.w #1,*            4    8   12   12   16   16   20   16   20\n
subx.w *,*             4                  20\n
tst.w *                4         8    8   12   12   16   12   16\n
add.l *,d0             8    8   16   16   20   20   24   20   24   20   24   16\n
add.l d0,*                      20   20   24   24   28   24   28\n
adda.l *,a1            8    8   16   16   20   20   24   20   24   20   24   16\n
add.l #1,*            16        28   28   32   32   36   32   36\n
addq.l #1,*            8    8   20   20   24   24   28   24   28\n
addx.l *,*             8                  32\n
and.l *,d0             8        16   16   20   20   24   20   24   20   24   16\n
and.l d0,*                      20   20   24   24   28   24   28\n
and.l #1,*            16        28   28   32   32   36   32   36\n
asl.l #7,d0           24\n
asl.l d0,d0           16\n
asr.l #7,d0           24\n
asr.l d0,d0           16\n
clr.l *                8        20   20   24   24   28   24   28\n
cmp.l *,d0             8    8   16   16   20   20   24   20   24   20   24   16\n
cmpa.l *,a1            8    8   16   16   20   20   24   20   24   20   24   16\n
cmp.l #1,*            16        20   20   24   24   28   24   28\n
eor.l d0,*             8        20   20   24   24   28   24   28\n
eor.l #1,*            16        28   28   32   32   36   32   36\n
lsl.l #7,d0           24\n
lsl.l d0,d0           16\n
lsr.l #7,d0           24\n
lsr.l d0,d0           16\n
move.l *,d0            4    4   12   12   16   16   20   16   20   16   20   12\n
move.l *,a1            4    4   12   12   16   16   20   16   20   16   20   12\n
move.l *,(a1)         12   12   20   20   24   24   28   24   28   24   28   20\n
move.l *,(a1)+        12   12   20   20   24   24   28   24   28   24   28   20\n
move.l *,-(a1)        12   12   20   20   24   24   28   24   28   24   28   20\n
move.l *,24(a1)       16   16   24   24   28   28   32   28   32   28   32   24\n
move.l *,20(a1,d0.l)  20   20   28   28   32   32   36   32   36   32   36   28\n
move.l *,$200.l       20   20   28   28   32   32   36   32   36   32   36   28\n
move.l *,scratchpad   20   20   28   28   32   32   36   32   36   32   36   28\n
movem.l *,d0-d3                 44   44        48   52   48   52\n
movem.l d0-d3,*                 40        40   44   48   44   48\n
movep.l d0,4(a1)      24\n
movep.l 4(a0),d0      24\n
neg.l *                8        20   20   24   24   28   24   28\n
negx.l *               8        20   20   24   24   28   24   28\n
not.l *                8        20   20   24   24   28   24   28\n
or.l *,d0              8        16   16   20   20   24   20   24   20   24   16\n
or.l d0,*                       20   20   24   24   28   24   28\n
or.l #1,*             16        28   28   32   32   36   32   36\n
rol.l #7,d0           24\n
rol.l d0,d0           16\n
ror.l #7,d0           24\n
ror.l d0,d0           16\n
roxl.l #7,d0          24\n
roxl.l d0,d0          16\n
roxr.l #7,d0          24\n
roxr.l d0,d0          16\n
sub.l *,d0             8    8   16   16   20   20   24   20   24   20   24   16\n
sub.l d0,*                      20   20   24   24   28   24   28\n
suba.l *,a1            8    8   16   16   20   20   24   20   24   20   24   16\n
sub.l #1,*            16        28   28   32   32   36   32   36\n
subq.l #1,*            8    8   20   20   24   24   28   24   28\n
subx.l *,*             8                  32\n
tst.l *                4        12   12   16   16   20   16   20\n
asl.w #1,*             8        12   12   16   16   20   16   20\n
asr.w #1,*             8        12   12   16   16   20   16   20\n
lsl.w #1,*             8        12   12   16   16   20   16   20\n
lsr.w #1,*             8        12   12   16   16   20   16   20\n
rol.w #1,*             8        12   12   16   16   20   16   20\n
ror.w #1,*             8        12   12   16   16   20   16   20\n
roxl.w #1,*            8        12   12   16   16   20   16   20\n
roxr.w #1,*            8        12   12   16   16   20   16   20\n
bchg #1,*             12        16   16   20   20   24   20   24\n
bchg d0,*              8        12   12   16   16   20   16   20\n
bset #1,*             12        16   16   20   20   24   20   24\n
bset d0,*              8        12   12   16   16   20   16   20\n
bclr #1,*             12        16   16   20   20   24   20   24\n
bclr d0,*              8        12   12   16   16   20   16   20\n
btst #1,*             12        12   12   16   16   20   16   20\n
btst d0,*              8         8    8   12   12   16   12   16\n
pea *                           12             16   24   16   20   16   24\n
lea *,a1                         4              8   16    8   12    8   16\n
link a0,#4            16\n
unlk a0               12\n
mulu *,d0             40        64   64   48   68   76   72   72   48   52   44\n
muls *,d0             44        52   52   48   68   64   60   60   48   52   48\n
abcd *,*               8                  20\n
nbcd *                 8        12   12   16   16   20   16   20\n
sbcd *,*               8                  20\n
st *                   8        12   12   16   16   20   16   20\n
tas *                  4        16   16   20   20   24   20   24\n
moveq #0,d0            4\n
exg d0,d1              8\n
ext.w d0               4\n
ext.l d0               4\n
swap d0                4\n
nop                    4\n
move.w sr,*            8        12   12   16   16   20   16   20\n
move.w *,ccr          12        16   16   20   20   24   20   24   20   24   16\n
move.w #$2200,sr      16\n
andi #$2700,sr        20\n
ori #$2200,sr         20\n
eori #$0100,sr        20\n
\n
unlk a0               12\n
bra.l/.s              12   12\n
bcc.l/.s taken        12   12\n
bcs.l/.s not          12    8\n
bsr.l/.s              20   20\n
dbcc cc true,nz,z     12   12   16\n
jmp                              8             12   16   12   12   12\n
jsr                             16             20   24   20   20   20\n
rts/rte               16   20\n
trap/illegal          36   36\n
";

const m68kcyclespairing = "\n
add.w *,d0            --   --   --   --   A-   --   A-   --   --   --   A-   --\n
add.w d0,*                      --   --   A-   --   A-   --   --\n
adda.w *,a1           --   --   --   --   A-   --   A-   --   --   --   A-   --\n
add.w #1,*            --        --   --   --   --   --   --   --\n
addq.w #1,*           --   --   --   --   A-   --   A-   --   --\n
addx.w *,*            --                  A-\n
and.w *,d0            --        --   --   A-   --   A-   --   --   --   A-   --\n
and.w d0,*                      --   --   A-   --   A-   --   --\n
and.w #1,*            --        --   --   --   --   --   --   --\n
asl.w #7,d0           --\n
asl.w d0,d0           -L\n
asr.w #7,d0           --\n
asr.w d0,d0           -L\n
clr.w *               --        --   --   A-   --   A-   --   --\n
cmp.w *,d0            --   --   --   --   A-   --   A-   --   --   --   A-   --\n
cmpa.w *,a1           -L   -L   -L   -L   AL   -L   AL   -L   -L   -L   AL   -L\n
cmp.w #1,*            --        --   --   --   --   --   --   --\n
eor.w d0,*            --        --   --   A-   --   A-   --   --\n
eor.w #1,*            --        --   --   --   --   --   --   --\n
lsl.w #7,d0           --\n
lsl.w d0,d0           -L\n
lsr.w #7,d0           --\n
lsr.w d0,d0           -L\n
move.w *,d0           --   --   --   --   A-   --   A-   --   --   --   A-   --\n
move.w *,a1           --   --   --   --   A-   --   A-   --   --   --   A-   --\n
move.w *,(a1)         --   --   --   --   A-   --   A-   --   --   --   A-   --\n
move.w *,(a1)+        --   --   --   --   A-   --   A-   --   --   --   A-   --\n
move.w *,-(a1)        --   --   --   --   A-   --   A-   --   --   --   A-   --\n
move.w *,24(a1)       --   --   --   --   A-   --   A-   --   --   --   A-   --\n
move.w *,20(a1,d0.w)  A-   A-   --   --   A-   --   A-   --   --   --   A-   --\n
move.w *,$200.w       --   --   --   --   A-   --   A-   --   --   --   A-   --\n
move.w *,scratchpad   --   --   --   --   A-   --   A-   --   --   --   A-   --\n
movem.w *,d0-d3                 --   --        --   --   --   --\n
movem.w d0-d3,*                 --        --   --   --   --   --\n
movep.w d0,4(a1)      --\n
movep.w 4(a0),d0      --\n
neg.w *               --        --   --   A-   --   A-   --   --\n
negx.w *              --        --   --   A-   --   A-   --   --\n
not.w *               --        --   --   A-   --   A-   --   --\n
or.w *,d0             --        --   --   A-   --   A-   --   --   --   A-   --\n
or.w d0,*                       --   --   A-   --   A-   --   --\n
or.w #1,*             --        --   --   --   --   --   --   --\n
rol.w #7,d0           --\n
rol.w d0,d0           -L\n
ror.w #7,d0           --\n
ror.w d0,d0           -L\n
roxl.w #7,d0          --\n
roxl.w d0,d0          -L\n
roxr.w #7,d0          --\n
roxr.w d0,d0          -L\n
sub.w *,d0            --   --   --   --   A-   --   A-   --   --   --   A-   --\n
sub.w d0,*                      --   --   A-   --   A-   --   --\n
suba.w *,a1           --   --   --   --   A-   --   A-   --   --   --   A-   --\n
sub.w #1,*            --        --   --   --   --   --   --   --\n
subq.w #1,*           --   --   --   --   A-   --   A-   --   --\n
subx.w *,*            --                  A-\n
tst.w *               --        --   --   A-   --   A-   --   --\n
add.l *,d0            --   --   -L   -L   AL   -L   AL   -L   -L   -L   AL   --\n
add.l d0,*                      --   --   A-   --   A-   --   --\n
adda.l *,a1           --   --   -L   -L   AL   -L   AL   -L   -L   -L   AL   --\n
add.l #1,*            --        --   --   --   --   --   --   --\n
addq.l #1,*           --   --   --   --   A-   --   A-   --   --\n
addx.l *,*            --                  A-\n
and.l *,d0            --        -L   -L   AL   -L   AL   -L   -L   -L   AL   --\n
and.l d0,*                      --   --   A-   --   A-   --   --\n
and.l #1,*            --        --   --   --   --   --   --   --\n
asl.l #7,d0           -L\n
asl.l d0,d0           --\n
asr.l #7,d0           -L\n
asr.l d0,d0           --\n
clr.l *               -L        --   --   A-   --   A-   --   --\n
cmp.l *,d0            -L   -L   -L   -L   AL   -L   AL   -L   -L   -L   AL   -L\n
cmpa.l *,a1           -L   -L   -L   -L   AL   -L   AL   -L   -L   -L   AL   -L\n
cmp.l #1,*            -L        --   --   --   --   --   --   --\n
eor.l d0,*            --        --   --   A-   --   A-   --   --\n
eor.l #1,*            --        --   --   --   --   --   --   --\n
lsl.l #7,d0           -L\n
lsl.l d0,d0           --\n
lsr.l #7,d0           -L\n
lsr.l d0,d0           --\n
move.l *,d0           --   --   --   --   A-   --   A-   --   --   --   A-   --\n
move.l *,a1           --   --   --   --   A-   --   A-   --   --   --   A-   --\n
move.l *,(a1)         --   --   --   --   A-   --   A-   --   --   --   A-   --\n
move.l *,(a1)+        --   --   --   --   A-   --   A-   --   --   --   A-   --\n
move.l *,-(a1)        --   --   --   --   A-   --   A-   --   --   --   A-   --\n
move.l *,24(a1)       --   --   --   --   A-   --   A-   --   --   --   A-   --\n
move.l *,20(a1,d0.l)  A-   A-   --   --   A-   --   A-   --   --   --   A-   --\n
move.l *,$200.l       --   --   --   --   A-   --   A-   --   --   --   A-   --\n
move.l *,scratchpad   --   --   --   --   A-   --   A-   --   --   --   A-   --\n
movem.l *,d0-d3                 --   --        --   --   --   --\n
movem.l d0-d3,*                 --        --   --   --   --   --\n
movep.l d0,4(a1)      --\n
movep.l 4(a0),d0      --\n
neg.l *               -L        --   --   A-   --   A-   --   --\n
negx.l *              -L        --   --   A-   --   A-   --   --\n
not.l *               -L        --   --   A-   --   A-   --   --\n
or.l *,d0             --        -L   -L   AL   -L   AL   -L   -L   -L   AL   --\n
or.l d0,*                       --   --   A-   --   A-   --   --\n
or.l #1,*             --        --   --   --   --   --   --   --\n
rol.l #7,d0           -L\n
rol.l d0,d0           --\n
ror.l #7,d0           -L\n
ror.l d0,d0           --\n
roxl.l #7,d0          -L\n
roxl.l d0,d0          --\n
roxr.l #7,d0          -L\n
roxr.l d0,d0          --\n
sub.l *,d0            --   --   -L   -L   AL   -L   AL   -L   -L   -L   AL   --\n
sub.l d0,*                      --   --   A-   --   A-   --   --\n
suba.l *,a1           --   --   -L   -L   AL   -L   AL   -L   -L   -L   AL   --\n
sub.l #1,*            --        --   --   --   --   --   --   --\n
subq.l #1,*           --   --   --   --   A-   --   A-   --   --\n
subx.l *,*            --                  A-\n
tst.l *               --        --   --   A-   --   A-   --   --\n
asl.w #1,*            --        --   --   A-   --   A-   --   --\n
asr.w #1,*            --        --   --   A-   --   A-   --   --\n
lsl.w #1,*            --        --   --   A-   --   A-   --   --\n
lsr.w #1,*            --        --   --   A-   --   A-   --   --\n
rol.w #1,*            --        --   --   A-   --   A-   --   --\n
ror.w #1,*            --        --   --   A-   --   A-   --   --\n
roxl.w #1,*           --        --   --   A-   --   A-   --   --\n
roxr.w #1,*           --        --   --   A-   --   A-   --   --\n
bchg #1,*             -L        --   --   --   --   --   --   --\n
bchg d0,*             -L        --   --   A-   --   A-   --   --\n
bset #1,*             -L        --   --   --   --   --   --   --\n
bset d0,*             -L        --   --   A-   --   A-   --   --\n
bclr #1,*             --        --   --   --   --   --   --   --\n
bclr d0,*             --        --   --   A-   --   A-   --   --\n
btst #1,*             -L        --   --   --   --   --   --   --\n
btst d0,*             -L        --   --   A-   --   A-   --   --\n
pea *                           --             --   A-   --   --   --   A-\n
lea *,a1                        --             --   A-   --   --   --   A-\n
link a0,#4            --\n
unlk a0               --\n
mulu *,d0             --        -L   -L   AL   --   A-   --   -L   -L   AL   --\n
muls *,d0             -L        -L   -L   AL   -L   AL   -L   -L   -L   AL   -L\n
abcd *,*              -L                  A-\n
nbcd *                -L        --   --   A-   --   A-   --   --\n
sbcd *,*              -L                  A-\n
st *                  -L        --   --   A-   --   A-   --   --\n
tas *                 --        --   --   A-   --   A-   --   --\n
moveq #0,d0           --\n
exg d0,d1             -L\n
ext.w d0              --\n
ext.l d0              --\n
swap d0               --\n
nop                   --\n
move.w sr,*           -L        --   --   A-   --   A-   --   --\n
move.w *,ccr          --        --   --   A-   --   A-   --   --   --   A-   --\n
move.w #$2200,sr      --\n
andi #$2700,sr        --\n
ori #$2200,sr         --\n
eori #$0100,sr        --\n
";
*/