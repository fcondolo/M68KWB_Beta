var ATARI_Constants = [
    {name:"SCREEN_HI" ,value: 0xFFFF8201},
    {name:"SCREEN_MID" ,value: 0xFFFF8203},
    {name:"SCREEN_LOW" ,value: 0xFFFF820d},
    {name:"STE_LINEOFFSET" ,value: 0xFFFF820F},
    {name:"STE_PIXOFFSET" ,value: 0xFFFF8265},
    {name:"BLT_SRC_XINCR" ,value: 0xFF8A20}, // Source X Increment (15 Bit - Bit 0 is unused) - signed
    {name:"BLT_SRC_YINCR" ,value: 0xFF8A22}, // Source Y Increment (15 Bit - Bit 0 is unused) - signed
    {name:"BLT_SRC_ADRS" ,value: 0xFF8A24}, // Source Address (23 Bit - Bit 31..24, Bit 0 unused)
    {name:"BLT_ENDMASK_1" ,value: 0xFF8A28}, // ENDMASK 1 (16 Bits)
    {name:"BLT_ENDMASK_2" ,value: 0xFF8A2A}, // ENDMASK 2 (16 Bits)
    {name:"BLT_ENDMASK_3" ,value: 0xFF8A2C}, // ENDMASK 3 (16 Bits)
    {name:"BLT_DST_XINCR" ,value: 0xFF8A2E}, // Destination X Increment (15 Bit - Bit 0 is unused)
    {name:"BLT_DST_YINCR" ,value: 0xFF8A30}, // Destination Y Increment (15 Bit - Bit 0 is unused)
    {name:"BLT_DST_ADRS" ,value: 0xFF8A32}, // Destination Address (23 Bit - Bit 31..24, Bit 0 unused)
    {name:"BLT_COUNT_X" ,value: 0xFF8A36}, // X Count (16 Bits)
    {name:"BLT_COUNT_Y" ,value: 0xFF8A38}, // Y Count (16 Bits)
    {name:"BLT_HOP" ,value: 0xFF8A3A}, // HOP (8 Bits)
    {name:"BLT_OP" ,value: 0xFF8A3B}, // OP (8 Bits)
    {name:"BLT_MISC_1" ,value: 0xFF8A3C}, // (8 Bits)
    {name:"BLT_MISC_2" ,value: 0xFF8A3D}, // (8 Bits)
    {name:"COLOR0" ,value: 0xFFFF8240},
    {name:"COLOR1" ,value: 0xFFFF8242},
    {name:"COLOR2" ,value: 0xFFFF8244},
    {name:"COLOR3" ,value: 0xFFFF8246},
    {name:"COLOR4" ,value: 0xFFFF8248},
    {name:"COLOR5" ,value: 0xFFFF824a},
    {name:"COLOR6" ,value: 0xFFFF824c},
    {name:"COLOR7" ,value: 0xFFFF824e},
    {name:"COLOR8" ,value: 0xFFFF8250},
    {name:"COLOR9" ,value: 0xFFFF8252},
    {name:"COLOR10" ,value: 0xFFFF8254},
    {name:"COLOR11" ,value: 0xFFFF8256},
    {name:"COLOR12" ,value: 0xFFFF8258},
    {name:"COLOR13" ,value: 0xFFFF825a},
    {name:"COLOR14" ,value: 0xFFFF825c},
    {name:"COLOR15" ,value: 0xFFFF825e},
    {name:"SND_DMACTRL" ,value: 0xFFFF8900},
    {name:"SND_FRMBASEADRS_HI" ,value: 0xFFFF8902},
    {name:"SND_FRMBASEADRS_MID" ,value: 0xFFFF8904},
    {name:"SND_FRMBASEADRS_LOW" ,value: 0xFFFF8906},
    {name:"SND_FRMADRSCNT_HI" ,value: 0xFFFF8908},
    {name:"SND_FRMADRSCNT_MID" ,value: 0xFFFF890A},
    {name:"SND_FRMADRSCNT_LOW" ,value: 0xFFFF890C},
    {name:"SND_FRMENDADRS_HI" ,value: 0xFFFF890E},
    {name:"SND_FRMENDADRS_MID" ,value: 0xFFFF8910},
    {name:"SND_FRMENDADRS_LOW" ,value: 0xFFFF8912},
    {name:"SND_MODECTRL" ,value: 0xFFFF8920},
];