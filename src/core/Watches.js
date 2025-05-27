var WATCHES = null;

class M68K_Watches {
    constructor(
    ) {
        let t               = this;
        t.entries           = [];
        t.format            = [
            // b:bytelen, s:signed
            {b:0,s:false},  // 0 : error
            {b:1,s:false},  // 1: WATCH_UBYTE
            {b:1,s:true},   // 2: WATCH_SBYTE
            {b:1,s:true},   // 3: WATCH_BYTE
            {b:2,s:false},  // 4: WATCH_UWORD
            {b:2,s:true},   // 5: WATCH_SWORD
            {b:2,s:true},   // 6: WATCH_WORD
            {b:4,s:false},  // 7: WATCH_ULONG
            {b:4,s:true},   // 8: WATCH_SLONG
            {b:4,s:true}    // 9: WATCH_LONG
        ];
        t.WATCH_UBYTE      = 1;
        t.WATCH_SBYTE      = 2;
        t.WATCH_BYTE       = 3;
        t.WATCH_UWORD      = 4;
        t.WATCH_SWORD      = 5;
        t.WATCH_WORD       = 6;
        t.WATCH_ULONG      = 7;
        t.WATCH_SLONG      = 8;
        t.WATCH_LONG       = 9;
        t.WATCH_BIN        = 2;     // base
        t.WATCH_DEC        = 10;    // base
        t.WATCH_HEX        = 16;    // base
        t.hasFocus          = false;
        t.box               = document.getElementById("draggable");
        t.elm               = document.getElementById("tbox_watches");
        WATCHES             = t;
        if (!CODERPARSER_SINGLETON) alert("Create WATCHES singleton after CODERPARSER_SINGLETON");
        CODERPARSER_SINGLETON.constants.push({ name: "WATCH_UBYTE", value: 1, path: "", line: "" });
        CODERPARSER_SINGLETON.constants.push({ name: "WATCH_SBYTE", value: 2, path: "", line: "" });
        CODERPARSER_SINGLETON.constants.push({ name: "WATCH_BYTE", value: 3, path: "", line: "" });
        CODERPARSER_SINGLETON.constants.push({ name: "WATCH_UWORD", value: 4, path: "", line: "" });
        CODERPARSER_SINGLETON.constants.push({ name: "WATCH_SWORD", value: 5, path: "", line: "" });
        CODERPARSER_SINGLETON.constants.push({ name: "WATCH_WORD", value: 6, path: "", line: "" });
        CODERPARSER_SINGLETON.constants.push({ name: "WATCH_ULONG", value: 7, path: "", line: "" });
        CODERPARSER_SINGLETON.constants.push({ name: "WATCH_SLONG", value: 8, path: "", line: "" });
        CODERPARSER_SINGLETON.constants.push({ name: "WATCH_LONG", value: 9, path: "", line: "" });
        CODERPARSER_SINGLETON.constants.push({ name: "WATCH_BIN", value: 2, path: "", line: "" });
        CODERPARSER_SINGLETON.constants.push({ name: "WATCH_DEC", value: 10, path: "", line: "" });
        CODERPARSER_SINGLETON.constants.push({ name: "WATCH_HEX", value: 16, path: "", line: "" });
    }

    add(_name, _adrs, _dataType, _showType) {
        let t = this;
        let dup = false;
        for (let i = 0; i < t.entries.length; i++) {
            const e = t.entries[i];
            if ((e.adrs == _adrs) && (e.type == _dataType) && (e.show == _showType) && (e.name == _name)) {
                dup = true;
                break;
            }
        }
        if (!dup)
            t.entries.push({name: _name, adrs: _adrs, type: _dataType, show: _showType});
    }

    update() {
        if (WATCHES.hasFocus) return;
        let t = this;
        if (t.entries.length == 0)
            return;
        if (t.box.style.display == "none")
            return;
        if (t.elm.style.display == "none")
            return;

        let s = "<hr><center><b>WATCHES</b></center><br><table>";
        for (let i = 0; i < t.entries.length; i++) {
            const e = t.entries[i];
            const f = t.format[e.type];
            let val = MACHINE.getRAMValue(e.adrs, f.b, false);//f.s);
            const id = "watchval"+i.toString();
            let input = "<input style='max-width:60%' id='" + id + "'";
            input += "value='" + val.toString(e.show) + "'";
            input += "onchange = 'WATCHES.write(" + i + ")'";
            input += "onblur = 'WATCHES.setFocus(false);' onfocus = 'WATCHES.setFocus(true);'";
            input += "/>";
            s += "<tr><td>" + e.name + "</td><td>" + input + "</td></tr>";
        }
        s += "</table>";
        t.elm.innerHTML = s;
    }

    setFocus(_f) {
        WATCHES.hasFocus = _f;
        console.log("WATCHES focus: " + WATCHES.hasFocus);
    }

    write(_index) {
        let t = this;
        const e = t.entries[_index];
        const f = t.format[e.type];
        const v = document.getElementById("watchval"+_index.toString()).value;
        const num = parseInt(v,e.show);
        if (!isNaN(num))
            MACHINE.setRAMValue(num, e.adrs, f.b);
    }
}
  