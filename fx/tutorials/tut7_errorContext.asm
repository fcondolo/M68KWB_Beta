test:
    ;>JS DebugCtx_reset("update loop"); // erase previous error context
    ;>JS DBGVAR.yiter = 0;

    move.w  #1,d7
.yloop:
    ;>JS DBGVAR.yiter++;
    ;>JS DebugCtx_enter("y iter: " + DBGVAR.yiter);
    move.w  #1,d6
    ;>JS DBGVAR.xiter = 0;
.xloop:
    ;>JS DBGVAR.xiter++;
    ;>JS DebugCtx_enter("x iter: " + DBGVAR.xiter);
    move.w  d7,d0
    add.w   d0,d0
    add.w   d6,d0
    ;>JS DebugCtx_log("value: " + d0.iw);
    ;>JS if (d0.iw == 1) debug("wrong value for x=" + d6.iw + ", y=" + d7.iw);
    ;>JS DebugCtx_exit();
    dbra    d6,.xloop
    ;>JS DebugCtx_exit();
    dbra    d7,.yloop
    ;>JS DebugCtx_reset();
    rts
    