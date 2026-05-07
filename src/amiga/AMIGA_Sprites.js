/*
# Amiga Sprite DMA and SPRxPOS Timing
Sprite DMA on the Amiga is tightly coupled to the raster beam. Each of the 8 sprite DMA channels gets a fixed slot in the horizontal scanline, and the timing of writes to SPRxPOS depends on whether the sprite is currently "active" (being displayed) or "waiting" for its VSTART line.

## The two-phase lifecycle
For each scanline, sprite DMA does one of two things per sprite:

**1. Control-word fetch (sprite is idle / waiting)**
When a sprite is not currently being displayed — either before its first line or after VSTOP has been reached — the DMA fetches **two words** from the sprite's data pointer (SPRxPT) and writes them into **SPRxPOS** and **SPRxCTL**. This is how the sprite gets re-armed: the copper or CPU has updated the pointer to the next sprite "image block," whose first two words are a fresh POS/CTL pair, and the hardware loads them automatically.
This happens once per scanline, in that sprite's DMA slot, as long as the sprite is in the "stopped" state.

**2. Data fetch (sprite is active)**
Once the vertical beam position matches VSTART, the comparator fires and the sprite enters the "armed/active" state. From that line until VSTOP, the DMA slot is used to fetch **two words of bitplane data** into **SPRxDATA** and **SPRxDATB** instead — those are what actually get shifted out to the screen. SPRxPOS and SPRxCTL are *not* rewritten during this phase.
When the beam reaches VSTOP, the sprite stops, and on the *next* scanline the DMA channel goes back to fetching POS/CTL words from the (now hopefully updated) pointer.

## So, concretely

SPRxPOS gets written by DMA:
- On the scanline immediately after the sprite finishes (VSTOP reached), assuming the pointer has been advanced to a new control block — this is the typical "reuse the same sprite multiple times down the screen" trick.
- On every scanline before the sprite's first VSTART, if the pointer hasn't been set up yet or points to a control block whose VSTART is still in the future.
- It is *not* written while the sprite is actively being displayed (between VSTART and VSTOP).

The DMA slot itself sits in the horizontal blanking region of the scanline — sprites 0 and 1 use slots around hpos $15–$18, sprites 2 and 3 around $19–$1C, and so on, with all 8 sprites consuming 16 DMA slots total per line. The CPU can also write SPRxPOS directly at any time, which is how you do sprite multiplexing without DMA, but that's a separate path from what the DMA controller is doing.

The terminator that ends a sprite's reuse chain is a control block with both POS and CTL words equal to zero — when DMA loads that, VSTART/VSTOP are both 0, the comparator never fires, and the sprite stays silent for the rest of the frame.

 MOVE.W #$0024,BPLCON2(a0)        ; Sprites have priority over playfields
*/
class AMIGA_Sprites {
    constructor() {
        let t = this;
        t.MAX_SPRT = 8;
        t.sprites = [];
        for (let i = 0; i < t.MAX_SPRT; i++) {
            t.sprites[i] = {active:false};
        }
    }

    /**
     * @param {number} sprpos - SPRxPOS control word (16 bits)
     * @param {number} sprctl - SPRxCTL control word (16 bits)
     * @returns {{x: number, y: number, height: number}}
     */
    decode(sprpos, sprctl) {
        // Mask to 16 bits just in case
        sprpos &= 0xFFFF;
        sprctl &= 0xFFFF;

        // --- Horizontal start (X) ---
        // High 8 bits come from SPRxPOS bits 7-0 (these are HSTART bits 8-1)
        // Low bit comes from SPRxCTL bit 0 (HSTART bit 0)
        const hstartHigh = sprpos & 0x00FF;          // bits 8-1 of HSTART
        const hstartLow  = sprctl & 0x0001;          // bit 0 of HSTART
        const x = (hstartHigh << 1) | hstartLow;     // 9-bit value, 0..511

        // --- Vertical start (Y) ---
        // Low 8 bits from SPRxPOS bits 15-8, high bit from SPRxCTL bit 2
        const vstartLow  = (sprpos >> 8) & 0xFF;
        const vstartHigh = (sprctl >> 2) & 0x01;
        const y = (vstartHigh << 8) | vstartLow;     // 9-bit value, 0..511

        // --- Vertical stop ---
        // Low 8 bits from SPRxCTL bits 15-8, high bit from SPRxCTL bit 1
        const vstopLow  = (sprctl >> 8) & 0xFF;
        const vstopHigh = (sprctl >> 1) & 0x01;
        const vstop = (vstopHigh << 8) | vstopLow;

        // Height is VSTOP - VSTART (sprite is displayed on lines VSTART up to but not including VSTOP)
        const height = vstop - y;

        return { x:x, y:y, h:height };
    }

    onNewLine(bplY) {
        const DMACONVal = AMIGA_customregs[DMACONR/2]; // don't use AMIGA_getCustom(DMACONR), it will make the system believe the user waited for blitter
        if (((DMACONVal >>> 5) & 1) == 0)
            return; // Sprite DMA not enabled

        let t = this;
        let regAdrs = SPR0PTH;
        for (let i = 0; i < t.MAX_SPRT; i++, regAdrs += 4) {
            const adrs = AMIGA_getCustom_L(regAdrs);
            t.sprites[i].curData = MACHINE.getRAMValue(adrs, 4, false);
            AMIGA_setCustom_L(regAdrs,adrs+4);
            if (t.sprites[i].active) {
            
            } else {
                const pos = t.sprites[i].curData>>>16;
                const ctl = t.sprites[i].curData&0xffff;
                const decoded = t.decode(pos,ctl);
                t.sprites[i].x = decoded.x;
                t.sprites[i].y = decoded.y;
                t.sprites[i].h = decoded.h;
            }
        }
    }

    onNewRasterPos(x,y) {
        const DMACONVal = AMIGA_customregs[DMACONR/2]; // don't use AMIGA_getCustom(DMACONR), it will make the system believe the user waited for blitter
        if (((DMACONVal >>> 5) & 1) == 0)
            return; // Sprite DMA not enabled

        let t = this;
        let regAdrs = SPR0PTH;
        for (let i = 0; i < t.MAX_SPRT; i++, regAdrs += 4) {
            const adrs = AMIGA_getCustom_L(regAdrs);
            if (t.sprites[i].active) {
                //if ()
            } else {
                const pos = MACHINE.getRAMValue(regAdrs, 2, false);
                const ctl = MACHINE.getRAMValue(regAdrs+2, 2, false);
                const decoded = t.decode(pos,ctl);
            }
        }
   }

}