class MorphPath {
    constructor(obj) {
        this.path = obj.path;
        this.arrayd = obj.arrayd;
        // this.arrayd.splice(0, 0, this.path.getAttribute("d"));
        this.dur = obj.dur;
        this.keytimes = (obj.keytimes == undefined) ? [1] : obj.keytimes;  //  0.2, 0.5, 0.7, 1
        // this.keytimes.splice(0, 0, 0);
        this.repeatcount = (obj.repeatcount == undefined) ? Infinity : obj.repeatcount;

        this.boolanimate = false;
        this.idx = 1;
        this.starttime;
        this.countforrepeatcount = 0;

        this.start = this.start.bind(this);
        this.animate = this.animate.bind(this);
        this.stop = this.stop.bind(this);

    }
    pause() {
        this.boolanimate = false;
        // this.idx = 1;
        this.starttime = undefined;
        // this.countforrepeatcount = 0;
        window.requestAnimationFrame(this.animate);
    }
    start(step = 1) {
        this.boolanimate = true;
        this.idx = step;
        this.starttime = undefined;
        window.requestAnimationFrame(this.animate);
    }
    stop(step = 1) {
        this.boolanimate = false;
        this.idx = step;
        this.starttime = undefined;
        this.countforrepeatcount = 0;
        this.path.setAttribute("d", this.arrayd[step]);
        window.requestAnimationFrame(this.animate);
    }
    animate(keyframes) {
        if (this.boolanimate == false) return;
        if (!this.starttime) this.starttime = keyframes;
        let progress = Math.min((keyframes - this.starttime) / this.dur, 1);
        if (progress > this.keytimes[this.idx]) {
            this.idx++;
        }
        const d1 = this.arrayd[this.idx - 1].match(/[a-z]|\d+/gi);
        const d2 = this.arrayd[this.idx].match(/[a-z]|\d+/gi);
        const times = this.keytimes[this.idx];
        const partialprogress = (progress - this.keytimes[this.idx - 1]) / (times - this.keytimes[this.idx - 1]);
        let interpolated = structuredClone(d1);
        for (let j = 0; j < interpolated.length; j++) {
            if (interpolated[j].match(/[a-z]/i)) continue;
            const p1 = Number(d1[j]);
            const p2 = Number(d2[j]);
            interpolated[j] = p1 + (p2 - p1) * partialprogress;
        }
        this.path.setAttribute("d", interpolated.join(" "));
        if (progress == 1) {
            this.countforrepeatcount++;
            if (this.countforrepeatcount < this.repeatcount) {
                this.start();
            } else {
                this.stop();
            }
        }
        window.requestAnimationFrame(this.animate);
    }
}