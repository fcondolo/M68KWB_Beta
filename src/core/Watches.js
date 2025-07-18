var WATCHES = null;

class M68K_Watches {
    constructor(_jsOnly = false)
    {
        let t               = this;
        t.entries           = [];
        t.format            = [];
        t.WATCH_BYTE        = 1;
        t.WATCH_WORD        = 2;
        t.WATCH_LONG        = 3;
        t.WATCH_BIN         = 2;     // base
        t.WATCH_DEC         = 10;    // base
        t.WATCH_HEX         = 16;    // base
        t.hasFocus          = false;
        t.box               = document.getElementById("draggable");
        t.elm               = document.getElementById("tbox_watches");
        WATCHES             = t;

        t.format[0]             = {b:0,s:false}, // b:bytelen, s:signed
        t.format[t.WATCH_BYTE]  = {b:1,s:false};
        t.format[t.WATCH_WORD]  = {b:2,s:false};
        t.format[t.WATCH_LONG]  = {b:4,s:false};
        
        if (!_jsOnly) {
            if (!CODERPARSER_SINGLETON) alert("Create WATCHES singleton after CODERPARSER_SINGLETON");
            CODERPARSER_SINGLETON.constants.push({ name: "WATCH_BYTE", value: t.WATCH_BYTE, path: "", line: "" });
            CODERPARSER_SINGLETON.constants.push({ name: "WATCH_WORD", value: t.WATCH_WORD, path: "", line: "" });
            CODERPARSER_SINGLETON.constants.push({ name: "WATCH_LONG", value: t.WATCH_LONG, path: "", line: "" });
            CODERPARSER_SINGLETON.constants.push({ name: "WATCH_BIN", value: t.WATCH_BIN, path: "", line: "" });
            CODERPARSER_SINGLETON.constants.push({ name: "WATCH_DEC", value: t.WATCH_DEC, path: "", line: "" });
            CODERPARSER_SINGLETON.constants.push({ name: "WATCH_HEX", value: t.WATCH_HEX, path: "", line: "" });
        }
    }

    add(_name, _adrs, _dataType, _base) {
        let t = this;
        let dup = false;
        for (let i = 0; i < t.entries.length; i++) {
            const e = t.entries[i];
            if ((e.adrs == _adrs) && (e.type == _dataType) && (e.base == _base) && (e.name == _name)) {
                dup = true;
                break;
            }
        }
        if (!dup)
            t.entries.push({name: _name, adrs: _adrs, type: _dataType, base: _base});
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

        let s = "<table>";
        for (let i = 0; i < t.entries.length; i++) {
            const e = t.entries[i];
            const f = t.format[e.type];
            let val = MACHINE.getRAMValue(e.adrs, f.b, f.s);
            const id = "watchval"+i.toString();
            let input = "<input style='max-width:60%' id='" + id + "'";
            input += "value='" + val.toString(e.base) + "'";
            input += "onchange = 'WATCHES.write(" + i + ")'";
            input += "onblur = 'WATCHES.setFocus(false);' onfocus = 'WATCHES.setFocus(true);'";
            input += "/>";
            let typeStr;
            switch (e.base) {
                case t.WATCH_BIN: typeStr = " (bin) "; break;
                case t.WATCH_DEC: typeStr = " (dec) "; break;
                case t.WATCH_HEX: typeStr = " (hex) "; break;
            }
            s += "<tr><td>" + e.name + typeStr + "</td><td>" + input + "</td></tr>";
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
        const num = parseInt(v,e.base);
        if (!isNaN(num))
            MACHINE.setRAMValue(num, e.adrs, f.b);
    }
}
  