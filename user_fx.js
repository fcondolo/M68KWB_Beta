var user_fx = [
    /*
        FIELD           TYPE    OPTIONAL?   DESCRIPTION
        fxName:         String  No          Name of the FX as it wil appear in the FX list 
        platform:       String  No          Target platform ("ST", "STE", "OCS")
        js:             String  Yes         Path to the javascript file to load if any.
        classname:      String  Yes         Name of the javascript class to instanciate, that holds methods FX_Init() and FX_Update()
        rootPath:       String  Yes         Root path for asm include and incbin.
        source:         String  Yes         Path to the main asm source file if any (relative to rootPath).
        asmInit:        String  Yes         Name of the asm label to call at init (if not specified here, call manually your asm init in your javascript's FX_Init() function)
        asmUpdate:      String  Yes         Name of the asm label to call at update (if not specified here, call manually your asm update in your javascript's FX_Update() function)
        watchdog:       Integer Yes         Override default watchdog value (useful for very long precalc, see Watchdog in the documentation)
        clickToStart:   Boolean Yes         Will display a "start" dialog box before the fx starts. Useful when sound is needed (as browsers do not allow sound if the user did not click something)
        startPaused:    Boolean Yes         Always nice to have time to place breakpoints before it’s too late. Use the ‘p’ key to unpause.
        zoom:           Integer Yes         Influences the zoom slider if you want to see a bigger rendering for your fx (values in [100..200] range).
        hasAudio:       Boolean Yes         Set to true if the fx outputs sound (STe only)
    */

    // ************************************* ATARI FX
    {   // TEST ATARI
        fxName:     "Test Atari",
        classname:  "FX_testAtari", 
        js:         'fx/atari/MISC/testAtari.js',
        platform:   "STE", 
        rootPath:   "fx/atari/MISC",
        source:     "testAtari.asm"
    },
    {   // TEST CYCLES
        fxName:     "Test Cycles",
        platform:   "STE",
        rootPath:   "fx/atari/MISC",
        source:     "TestCycles.asm",
        watchdog:   0,
        asmInit:    "init",
        asmUpdate:  "update"
    },

    // ************************************* AMIGA FX
    {
        fxName:     "Revision Logo V1",
        classname:  "RevisionLogo_v1", 
        platform:   "OCS", 
        rootPath:   "fx/amiga/RevisionLogo/V1",
        source:     "RevisionLogo_v1.asm",
        js:         'fx/amiga/RevisionLogo/V1/RevisionLogo_v1.js'
    },
    {
        fxName:     "Revision Logo V2",
        classname:  "RevisionLogo_v2",
        platform:   "OCS", 
        rootPath:   "fx/amiga/RevisionLogo/V2",
        source:     "RevisionLogo_v2.asm",
        js:         'fx/amiga/RevisionLogo/V2/RevisionLogo_v2.js'
    },
    {
        fxName:     "Heroes",
        classname:  "FX_Heroes", 
        platform:   "OCS", 
        source:     "fx/amiga/heroes.asm",
        js:         'fx/amiga/heroes.js'
    },
    {
        fxName:     "Draw2Buffer",
        classname:  "Draw2Buffer",
        platform:   "OCS", 
        source:     "fx/amiga/Draw2Buffer/Draw2Buffer.asm",
        js:         'fx/amiga/Draw2Buffer/Draw2Buffer.js'
    },
    {
        fxName:     "Disk V1",
        classname:  "FX_Spherev1", 
        platform:   "OCS", 
        rootPath:   "fx/amiga/Sphere/v1",
        source:     "sphv1.asm",
        js:         'fx/amiga/Sphere/v1/sphv1.js'
    },
    {
        fxName:     "Disk V2",
        classname:  "FX_Spherev2", 
        platform:   "OCS", 
        rootPath:   "fx/amiga/Sphere/v2",
        source:     "sphv2.asm",
        js:         'fx/amiga/Sphere/v2/sphv2.js'
    },
    {
        fxName:     "Disk V3",
        classname:  "FX_Spherev3", 
        platform:   "OCS", 
        rootPath:   "fx/amiga/Sphere/v3",
        source:     "sphv3.asm",
        js:         'fx/amiga/Sphere/v3/sphv3.js'
    },
    {
        fxName:     "Disk V4",
        classname:  "FX_Spherev4", 
        platform:   "OCS", 
        rootPath:   "fx/amiga/Sphere/v4",
        source:     "sphv4.asm",
        js:         'fx/amiga/Sphere/v4/sphv4.js'
    },
    {
        fxName:     "Starfield V1",
        classname:  "FX_StarFieldv1", 
        platform:   "OCS", 
        rootPath:   "fx/amiga/StarField/v1",
        source:     "strfldv1.asm",
        js:         'fx/amiga/StarField/v1/strfldv1.js'
    },
    {
        fxName:     "Starfield V2",
        classname:  "FX_StarFieldv2", 
        platform:   "OCS", 
        rootPath:   "fx/amiga/StarField/v2",
        source:     "strfldv2.asm",
        js:         'fx/amiga/StarField/v2/strfldv2.js'
    },
    {
        fxName:     "Test Copper",
        classname:  "TestCopper", 
        platform:   "OCS", 
        rootPath:   "fx/amiga",
        source:     "TestCopper.asm",
        js:         'fx/amiga/TestCopper.js'
    },
    {
        fxName:     "Blitter Tornado",
        classname:  "BlitterTornado", 
        platform:   "OCS", 
        rootPath:   "fx/amiga/BlitterTornado",
        source:     "blitter_tornado.asm",
        js:         'fx/amiga/BlitterTornado/blitter_tornado.js'
    },
    {   // COPPER JELLY
        fxName:     "Copper Jelly",
        classname:  "CopperJelly", 
        platform:   "OCS", 
        rootPath:   "fx/amiga/CopperJelly",
        source:     "CopperJelly.s",
        js:         'fx/amiga/CopperJelly/CopperJelly.js'
    },

    // ************************************* TUTORIALS
    {
        fxName:     "Tut2: invoke asm",
        classname:  "FX_tut2", 
        platform:   "OCS", 
        rootPath:   "fx/tutorials",
        source:     "tut2.asm",
        js:         'fx/tutorials/tut2_invokeAsm.js'
    },
    {
        fxName:     "Tut3: debugger",
        classname:  "FX_tut3", 
        platform:   "OCS", 
        rootPath:   "fx/tutorials",
        source:     "tut3.asm",
        js:         'fx/tutorials/tut3_debugger.js'
    },
    {
        fxName:     "Tut4: self-modified",
        classname:  "tut4_automodified", 
        platform:   "STE", 
        rootPath:   "fx/tutorials",
        source:     "tut4_automodified.asm",
        js:         'fx/tutorials/tut4_automodified.js'
    },
    {
        fxName:     "Tut5: OCS image",
        classname:  "tut5_AmigaImage", 
        platform:   "OCS", 
        rootPath:   "fx/tutorials",
        source:     "tut5.asm",
        js:         'fx/tutorials/tut5_AmigaImage.js'
    },
    {
        fxName:     "HAM6 image",
        platform:   "OCS",
        rootPath:   "fx/tutorials",
        source:     "HAMImage.asm",
        asmInit:    "init",
        asmUpdate:  "update"
    },
    {
        fxName:     "Tut6: STE image",
        platform:   "STE", 
        rootPath:   "fx/tutorials",
        source:     "tut6.asm",
        asmInit:    "setPalette",
        asmUpdate:  "update"
    },
    {
        fxName:     "Tut: Atari1",
        platform:   "STE",
        rootPath:   "fx/tutorials",
        source:     "Atari_1.asm",
        asmInit:    "start"
    },
    {
        fxName:     "Tut: Atari HBL",
        platform:   "STE",
        rootPath:   "fx/tutorials",
        source:     "tut_Atari_HBL.asm",
        asmInit:    "start",
        asmUpdate:  "update"
    },
    {
        fxName:     "STE Blitter",
        platform:   "STE",
        rootPath:   "fx/tutorials",
        source:     "testSTEBlitter.asm",
        asmInit:    "setPalette",
        asmUpdate:  "update"
    },
    {
        fxName:     "OCS Blitter",
        classname:  "testAmigaBlitter", 
        platform:   "OCS",
        rootPath:   "fx/tutorials",
        source:     "testAmigaBlitter.asm",
        js:         'fx/tutorials/testAmigaBlitter.js'
    },
    {
        fxName:     "STE Blitter Fill",
        classname:  "AtariSTe_BlitterFill", 
        platform:   "STE", 
        source:     "AtariSTe_BlitterFill.asm",
        rootPath:   "fx/tutorials",
        js:         'fx/tutorials/AtariSTe_BlitterFill.js'
    },
    {
        fxName:     "Atari VBL",
        platform:   "STE",
        rootPath:   "fx/tutorials",
        source:     "AtariVBL.asm",
        asmInit:    "DEFAULT_ENTRY_POINT",
        asmUpdate:  "DEFAULT_MAIN_LOOP"
    },
];
