var DEBUGPRIM = null;

class DebugPrimitives {
    constructor(
    ) {
        if (DEBUGPRIM != null) {
            alert("Error: DebugPrimitives already created");
            debugger;
            return;
        }
        let t           = this;        
        DEBUGPRIM       = t;      
        t.points        = [];
        t.lines         = [];
        t.startScreenX  = 0;
        t.startScreenY  = 0;
    }

    addPoint(_x = 0, _y = 0, _color = 0xffffff, _rad = 1) {
        let t = this;
        t.points.push({x:_x, y:_y, col:_color, rad: _rad});
    }

    addLine(_x1 = 0, _y1 = 0, _x2 = 0, _y2 = 0, _color = 0xffffff) {
        let t = this;
        if (_x1 == _x2 && _y1 == _y2) {
            return t.addPoint(_x1,_y1,_r,_g,_b,1);
        }
        t.lines.push({x1:_x1, y1:_y1, x2:_x2, y2:_y2, col:_color});
    }
    
    draw(_ctx) {
        let t = this;
        for (let i = 0; i < t.lines.length; i++) {
            const v = t.lines[i];
            let s = v.col.toString(16);
            while (s.length < 6) s = "0"+s;
            s = '#'+s;
            _ctx.strokeStyle = s;
            _ctx.beginPath();
            _ctx.moveTo(t.startScreenX + v.x1, t.startScreenY + v.y1);
            _ctx.lineTo(t.startScreenX + v.x2, t.startScreenY + v.y2);
            _ctx.stroke();
        }
        t.lines = [];

        for (let i = 0; i < t.points.length; i++) {
            const v = t.points[i];
            const h  = v.rad/2;
            let s = v.col.toString(16);
            while (s.length < 6) s = "0"+s;
            s = '#'+s;
            _ctx.beginPath();
            _ctx.fillStyle = s;
            _ctx.arc(t.startScreenX + v.x-h, t.startScreenY + v.y-h, v.rad, 0, Math.PI*2, false);
            _ctx.fill();
        }
        t.points = [];
    }
}
  