// /assets/js/SVGmorph.js

class SVGmorph {
  /**
   * @param {SVGElement} svgEl
   * @param {Array} params [{
   *   path_id: string,
   *   path_stages: string[],
   *   path_keytimes_ms: number[], // extra ignored; missing -> 0ms
   *   loop?: boolean,
   *   boomerang?: boolean
   * }]
   */
  constructor(svgEl, params) {
    if (!svgEl || !(svgEl instanceof SVGElement)) {
      throw new Error("SVGmorph: first argument must be an SVGElement.");
    }
    this.svg = svgEl;
    this.items = [];
    this._raf = null;
    this._running = false;
    this._lastTs = 0;

    for (const cfg of params) {
      const path = this.svg.querySelector(`#${CSS.escape(cfg.path_id)}`);
      if (!path) {
        console.warn(`SVGmorph: path "#${cfg.path_id}" not found; skipping.`);
        continue;
      }
      const originalD = path.getAttribute("d") || "";
      const stages = Array.isArray(cfg.path_stages) ? cfg.path_stages.slice() : [];
      const keytimes = Array.isArray(cfg.path_keytimes_ms) ? cfg.path_keytimes_ms.slice() : [];

      if (stages.length === 0) {
        console.warn(`SVGmorph: "${cfg.path_id}" has no path_stages; skipping.`);
        continue;
      }

      const parsedOriginal = SVGmorph._parsePath(originalD);
      const parsedStages = stages.map(SVGmorph._parsePath);
      for (let i = 0; i < parsedStages.length; i++) {
        SVGmorph._assertSameCommands(parsedOriginal, parsedStages[i], cfg.path_id, i);
      }

      let times = keytimes.slice(0, stages.length);
      if (times.length < stages.length) {
        times = times.concat(Array(stages.length - times.length).fill(0));
      }

      this.items.push({
        path,
        pathId: cfg.path_id,
        originalD,
        parsedOriginal,
        stages,
        parsedStages,
        keytimes: times,
        loop: !!cfg.loop,
        boomerang: !!cfg.boomerang,

        // Playback state
        playing: false,
        direction: 1, // 1 forward, -1 backward
        stageIndex: -1, // -1 = at original; next forward target is 0
        fromParsed: null,
        toParsed: null,
        stageDuration: 0,
        stageElapsed: 0
      });
    }
  }

  // ---------- Public API ----------
  start() {
    if (this._running) {
      this.items.forEach(c => {
        c.playing = true;
      });
      return;
    }
    this._running = true;
    // Initialize timestamp now so first frame doesn't zero out dt and stop
    this._lastTs = (typeof performance !== "undefined" && performance.now) ? performance.now() : 0;

    this.items.forEach(c => {
      if (c.stageIndex === -1 && !c.fromParsed) {
        this._prepareNextStage(c, /*forward=*/ true);
      }
      c.playing = true;
    });

    this._tick = this._tick.bind(this);
    this._raf = requestAnimationFrame(this._tick);
  }

  pause() {
    this.items.forEach(c => {
      c.playing = false;
    });
    if (this._raf) {
      cancelAnimationFrame(this._raf);
      this._raf = null;
    }
    this._running = false;
    this._lastTs = 0;
  }

  /**
   * Reset all paths.
   * @param {number} [stageIndex] Set exact 'd' to that stage; otherwise restore original.
   */
  reset(stageIndex) {
    this.pause();
    this.items.forEach(c => {
      if (typeof stageIndex === "number" && stageIndex >= 0 && stageIndex < c.stages.length) {
        c.path.setAttribute("d", c.stages[stageIndex]);
        c.stageIndex = stageIndex;
        c.fromParsed = c.parsedStages[stageIndex];
      } else {
        c.path.setAttribute("d", c.originalD);
        c.stageIndex = -1;
        c.fromParsed = c.parsedOriginal;
      }
      c.toParsed = null;
      c.stageDuration = 0;
      c.stageElapsed = 0;
      c.direction = 1;
      c.playing = false;
    });
  }

  // ---------- Core Animation Loop ----------
  _tick(ts) {
    if (!this._running) return;

    let dt;
    if (this._lastTs === 0) {
      // First frame after a pause(): give it a tiny dt so we keep ticking
      dt = 16; // ~1 frame at 60Hz
    } else {
      dt = ts - this._lastTs;
      if (dt < 0) dt = 0; // clock skew safety
    }
    this._lastTs = ts;

    let anyActive = false;
    const anyPlaying = this.items.some(c => c.playing); // keep RAF alive if anything is playing

    for (const c of this.items) {
      if (!c.playing) continue;

      // consume the whole dt for this controller
      let remaining = dt;

      while (remaining > 0 && c.playing) {
        if (!c.fromParsed || !c.toParsed) {
          const ok = this._prepareNextStage(c, c.direction === 1);
          if (!ok) {
            c.playing = false;
            break;
          }
        }

        anyActive = true;

        if (c.stageDuration <= 0) {
          // instantaneous jump
          c.path.setAttribute("d", SVGmorph._stringifyPath(c.toParsed));
          this._advanceToNextStageOrLeg(c);
          continue; // continue with leftover time this frame
        }

        const timeLeft = c.stageDuration - c.stageElapsed;
        const step = Math.min(remaining, timeLeft);
        c.stageElapsed += step;
        remaining -= step;

        let t = c.stageElapsed / c.stageDuration;
        if (t > 1) t = 1;

        // Interpolate all segments simultaneously
        const out = [];
        for (let i = 0; i < c.fromParsed.length; i++) {
          out.push(SVGmorph._lerpSegment(c.fromParsed[i], c.toParsed[i], t));
        }
        c.path.setAttribute("d", SVGmorph._stringifyPath(out));

        if (t >= 1) {
          // Snap to exact target and immediately move to the next stage/leg
          c.path.setAttribute("d", SVGmorph._stringifyPath(c.toParsed));
          this._advanceToNextStageOrLeg(c);
          // loop continues; if boomerang is on, backward leg starts right away
        } else {
          // still mid-stage
          break;
        }
      }
    }

    if (anyActive || anyPlaying) {
      this._raf = requestAnimationFrame(this._tick);
    } else {
      this._raf = null;
      this._running = false;
      this._lastTs = 0;
    }
  }

  _advanceToNextStageOrLeg(c) {
    if (c.direction === 1) {
      // finished forward step to stageIndex+1
      c.fromParsed = c.toParsed;
      c.stageIndex++;
      if (c.stageIndex >= c.parsedStages.length) {
        // reached end of forward run
        if (c.boomerang) {
          c.direction = -1;
          c.stageIndex = c.parsedStages.length - 1; // currently at last stage
        } else if (c.loop) {
          c.direction = 1;
          c.stageIndex = -1;
          c.fromParsed = c.parsedOriginal;
        } else {
          c.playing = false;
          return;
        }
      }
    } else {
      // backward leg
      c.fromParsed = c.toParsed;
      c.stageIndex--; // heading toward -1 (original)

      if (c.stageIndex > -1) {
        // keep going backward to previous stage
        // (nothing else to do here)
      } else if (c.stageIndex === -1) {
        // we've just reached ORIGINAL
        if (c.loop) {
          // immediately flip to forward run; start from original
          c.direction = 1;
          c.fromParsed = c.parsedOriginal;
          // stageIndex remains -1 so next forward target is 0
        } else {
          // finished single boomerang (forward + backward)
          c.playing = false;
          return;
        }
      } else {
        // c.stageIndex < -1 shouldn't happen, but guard anyway
        if (c.loop) {
          c.direction = 1;
          c.stageIndex = -1;
          c.fromParsed = c.parsedOriginal;
        } else {
          c.playing = false;
          return;
        }
      }
    }

    // Prepare next transition immediately (uses current direction)
    this._prepareNextStage(c, c.direction === 1);
  }


  _prepareNextStage(c, forward) {
    let fromParsed, toParsed, stageDuration;

    if (forward) {
      // ---- FORWARD LEG ----
      // If we're at original (stageIndex === -1), go to stage 0
      if (c.stageIndex === -1) {
        fromParsed = c.parsedOriginal;
        const nextIndex = 0;
        if (nextIndex >= c.parsedStages.length) return false; // no stages at all
        toParsed = c.parsedStages[nextIndex];
        stageDuration = c.keytimes[nextIndex];
      } else {
        // We're already at a stage; try to go to the next one
        const nextIndex = c.stageIndex + 1;
        if (nextIndex >= c.parsedStages.length) {
          // We're at the LAST stage. Decide what to do:
          if (c.boomerang) {
            // Flip to BACKWARD immediately: last stage -> previous (or original if only one stage)
            c.direction = -1;
            fromParsed = c.parsedStages[c.stageIndex];
            const prevIndex = c.stageIndex - 1;
            if (prevIndex >= 0) {
              toParsed = c.parsedStages[prevIndex];
              stageDuration = c.keytimes[c.stageIndex]; // mirror duration of the stage we're leaving
            } else {
              toParsed = c.parsedOriginal;
              stageDuration = c.keytimes[0] ?? 0;
            }
          } else if (c.loop) {
            // No boomerang, but loop is on: go back to original then the loop will continue
            c.direction = -1; // go back to original first
            fromParsed = c.parsedStages[c.stageIndex];
            toParsed = c.parsedOriginal;
            stageDuration = c.keytimes[c.stageIndex] ?? 0;
          } else {
            return false; // nothing to do
          }
        } else {
          // Normal forward step: stage i -> stage i+1
          fromParsed = c.parsedStages[c.stageIndex];
          toParsed = c.parsedStages[nextIndex];
          stageDuration = c.keytimes[nextIndex];
        }
      }
    } else {
      // ---- BACKWARD LEG ----
      fromParsed = (c.stageIndex >= 0) ? c.parsedStages[c.stageIndex] : c.parsedOriginal;
      const prevIndex = c.stageIndex - 1;
      if (prevIndex >= 0) {
        toParsed = c.parsedStages[prevIndex];
        stageDuration = c.keytimes[c.stageIndex]; // mirror: use duration of the stage we're leaving
      } else {
        toParsed = c.parsedOriginal;
        stageDuration = c.keytimes[0] ?? 0;
      }
    }

    c.fromParsed = fromParsed;
    c.toParsed = toParsed;
    c.stageDuration = Number.isFinite(stageDuration) ? stageDuration : 0;
    c.stageElapsed = 0;
    return true;
  }


  // ---------- Parsing / Validation / Math ----------
  static _parsePath(d) {
    const tokens = [];
    const re = /([astvzqmhlcqrtyASTVZQMHLCQRTY])|(-?\d*\.?\d+(?:e[-+]?\d+)?)/g;
    let m;
    while ((m = re.exec(d)) !== null) {
      if (m[1]) tokens.push({
        type: "cmd",
        value: m[1]
      });
      else tokens.push({
        type: "num",
        value: parseFloat(m[2])
      });
    }

    const spec = {
      M: 2,
      L: 2,
      H: 1,
      V: 1,
      C: 6,
      S: 4,
      Q: 4,
      T: 2,
      A: 7,
      Z: 0
    };
    const segments = [];
    let i = 0;

    while (i < tokens.length) {
      if (tokens[i].type !== "cmd") {
        throw new Error("SVGmorph: malformed path; expected command letter.");
      }
      const cmd = tokens[i].value;
      i++;
      const upper = cmd.toUpperCase();
      if (upper === 'Z') {
        segments.push({
          cmd: upper,
          vals: []
        });
        continue;
      }
      const count = spec[upper];
      if (!count) {
        throw new Error(`SVGmorph: unsupported command "${cmd}".`);
      }
      while (i < tokens.length) {
        if (tokens[i].type === "cmd") break;
        if (i + count - 1 >= tokens.length) {
          throw new Error("SVGmorph: not enough numbers for command.");
        }
        const vals = tokens.slice(i, i + count).map(t => t.value);
        segments.push({
          cmd: upper,
          vals
        });
        i += count;
      }
    }
    return segments;
  }

  static _assertSameCommands(base, other, pathId, stageIndex) {
    if (base.length !== other.length) {
      throw new Error(`SVGmorph: "${pathId}" stage ${stageIndex} mismatch: command count differs (${base.length} vs ${other.length}).`);
    }
    for (let i = 0; i < base.length; i++) {
      const a = base[i],
        b = other[i];
      if (a.cmd !== b.cmd) {
        throw new Error(`SVGmorph: "${pathId}" stage ${stageIndex} mismatch at segment ${i}: "${a.cmd}" vs "${b.cmd}".`);
      }
      if (a.vals.length !== b.vals.length) {
        throw new Error(`SVGmorph: "${pathId}" stage ${stageIndex} mismatch at segment ${i}: parameter count differs.`);
      }
      if (a.cmd === 'A') {
        const va3 = Math.round(a.vals[3]),
          vb3 = Math.round(b.vals[3]);
        const va4 = Math.round(a.vals[4]),
          vb4 = Math.round(b.vals[4]);
        if (va3 !== vb3 || va4 !== vb4) {
          throw new Error(`SVGmorph: "${pathId}" stage ${stageIndex} arc flags differ at segment ${i}.`);
        }
      }
    }
  }

  static _lerpSegment(a, b, t) {
    if (a.cmd !== b.cmd || a.vals.length !== b.vals.length) {
      throw new Error("SVGmorph: cannot interpolate mismatched segments.");
    }
    const vals = new Array(a.vals.length);
    for (let i = 0; i < a.vals.length; i++) {
      if (a.cmd === 'A' && (i === 3 || i === 4)) {
        vals[i] = Math.round(a.vals[i]); // keep flags constant
      } else {
        vals[i] = a.vals[i] + (b.vals[i] - a.vals[i]) * t;
      }
    }
    return {
      cmd: a.cmd,
      vals
    };
  }

  static _stringifyPath(segments) {
    let out = "";
    for (const seg of segments) {
      out += seg.cmd;
      if (seg.vals.length) out += " " + seg.vals.map(SVGmorph._fmt).join(" ");
      out += " ";
    }
    return out.trim();
  }

  static _fmt(n) {
    const v = Math.abs(n) < 1e-9 ? 0 : n;
    return Number.isInteger(v) ? String(v) : v.toFixed(6).replace(/\.?0+$/, "");
  }
}

export default SVGmorph;