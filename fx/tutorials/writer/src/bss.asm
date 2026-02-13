; bss allocs

fxStruct:
    ds.b    structLen

backBuf:
    ds.b    SCR_W_BYTES*SCR_H
screen1:
    ds.b    SCR_W_BYTES*SCR_H+PTS_MAXCOUNT*2
screen2:
    ds.b    SCR_W_BYTES*SCR_H+PTS_MAXCOUNT*2

xofsmsk:
    ds.l    SCR_W