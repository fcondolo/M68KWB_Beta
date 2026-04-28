var BENCHMARKS = null;

class M68K_Benchmark {
    constructor(_jsOnly = false)
    {
        let t               = this;
        t.entries           = [];
        t.hasFocus          = false;
        t.box               = document.getElementById("draggable");
        t.elm               = document.getElementById("tbox_bench");
        BENCHMARKS          = t;
    }

    findEntry(_name) {
        const e = this.entries;
        const l = e.length;
        for (let i = 0; i < l; i++) {
            if (e[i].name == _name)
                return e[i];
        }
        return null;
    }

    start(_name) {
        let t = this;
        let e = t.findEntry(_name);
        if (e) {
            if (!e.error) {
                if (e.in_progress) {
                    e.error = "benchmark '" + _name + "'" + " is re-started without being stopped";
                } else {
                    e.enter_cylces = M68K_CYCLES;
                }
            }
        } else {
            t.entries.push ({
                name: _name,
                enter_cylces:M68K_CYCLES,
                exit_cycles:M68K_CYCLES,
                last_measured:0,
                min_cycles:-1,
                max_cycles:-1,
                in_progress:true,
                error:null
            });
        }
    }

    stop(_name) {        
        let t = this;
        let e = t.findEntry(_name);
        if (e) {
            e.in_progress = false;
            if (!e.error) {
                e.exit_cycles = M68K_CYCLES;
                e.last_measured = M68K_CYCLES-e.enter_cylces;
                if (e.min_cycles == -1)
                    e.min_cycles = e.last_measured;
                else
                    e.min_cycles = Math.min(e.min_cycles,e.last_measured);
                if (e.max_cycles == -1) 
                    e.max_cycles = e.last_measured;
                else
                    e.max_cycles = Math.max(e.max_cycles,e.last_measured);
            }
        } else {
            t.entries.push({
                name: _name,
                in_progress:false,
                error:"benchmark '" + _name + "'" + " is stopped but not started"
            });
        }
    }

    update() {
//        if (BENCHMARKS.hasFocus) return;
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
            let input = "";
            if (e.error)
                input += "error:" + e.error;
            else
                input += "cycles:" + e.last_measured.toString();
            if (e.min_cycles != e.max_cycles)
                input += " (min:" + e.min_cycles + ", max:" + e.max_cycles + ")";
            s += "<tr><td>" + "<b>"+e.name+"</b>" + "</td><td>" + input + "</td></tr>";
        }
        s += "</table>";
        t.elm.innerHTML = s;
    }

    setFocus(_f) {
        BENCHMARKS.hasFocus = _f;
    }
}
  