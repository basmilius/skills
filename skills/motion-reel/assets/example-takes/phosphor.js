Reel.add({
    id: 'phosphor',
    title: 'Phosphor',
    line: 'A beam traces waves, a circle, and a five-petal bloom.',
    principles: ['Arcs', 'Timing'],
    tech: 'Canvas 2D, beam persistence with speed-weighted brightness',
    hint: 'Move to turn the two frequency knobs',
    poster: 15.6,
    create(env) {
        const { R, W, H } = env;
        const ctx = env.ctx;
        const CX = W / 2;
        const CY = H / 2;
        const TAU = R.TAU;

        // One pass of the beam over a whole figure takes TRACE seconds; the phosphor fades with GLOW.
        const TRACE = 0.6;
        const GLOW = 0.36;
        // Drawing one pass, scaled by the sum of every earlier pass, is the steady glow of a repeating trace.
        const REPEAT = 1 / (1 - Math.exp(-TRACE / GLOW));
        const POINTS = 720;
        const PER_TRACE = Math.round(460 + 260 * env.quality);
        const STEP = TRACE / PER_TRACE;
        const SAMPLES = PER_TRACE + 1;
        const LEVELS = 18;
        const MAX_INTENSITY = 1.8;
        // Brightness is energy per length: a beam this many px per sample reads as full strength.
        const REFERENCE = 1.9;

        const CYCLE = 20;
        // [time, shape]: equal neighbors hold a figure, different ones morph between them.
        const KEYS = [
            [0, 0],
            [3.2, 0],
            [4.8, 1],
            [7.4, 1],
            [9.0, 2],
            [11.8, 2],
            [13.4, 3],
            [17.4, 3],
            [19.0, 0],
            [20, 0]
        ];

        const figure = (radiusAt) => {
            const points = new Float64Array(POINTS * 3);
            for (let i = 0; i < POINTS; i++) {
                const angle = i / POINTS * TAU;
                const radius = radiusAt(angle);
                points[i * 3] = CX + Math.cos(angle) * radius;
                points[i * 3 + 1] = CY + Math.sin(angle) * radius;
                points[i * 3 + 2] = 1;
            }
            return points;
        };
        const sampled = [null, null, figure(() => 150), figure((angle) => 125 + 38 * Math.cos(5 * angle))];

        // The knobs detune the two channels; their phase is integrated so a turn never makes the figure jump.
        let detuneX = 0;
        let detuneY = 0;
        let driftX = 0;
        let driftY = 0;

        const lissajousWeight = (time) => {
            const local = R.mod(time, CYCLE);
            return local < 9 ? 1 - R.smoothstep(7.4, 9.0, local) : R.smoothstep(17.4, 19.0, local);
        };

        const pos = { x: 0, y: 0, lit: 0 };
        const shapeAt = (shape, time, age) => {
            const beam = time / TRACE;
            if (shape <= 1) {
                const fx = shape === 0 ? 3 : 5;
                const fy = shape === 0 ? 2 : 4;
                const turn = (TAU * time) / (shape === 0 ? 10 : 20);
                const px = driftX - (TAU * detuneX * age) / TRACE;
                const py = driftY - (TAU * detuneY * age) / TRACE;
                pos.x = CX + 158 * Math.sin(TAU * fx * beam + turn + px);
                pos.y = CY - 128 * Math.sin(TAU * fy * beam + py);
                pos.lit = 1;
                return;
            }
            const data = sampled[shape];
            const index = R.fract(beam) * POINTS;
            const i0 = Math.floor(index) % POINTS;
            const i1 = (i0 + 1) % POINTS;
            const blend = index - Math.floor(index);
            pos.x = data[i0 * 3] + (data[i1 * 3] - data[i0 * 3]) * blend;
            pos.y = data[i0 * 3 + 1] + (data[i1 * 3 + 1] - data[i0 * 3 + 1]) * blend;
            pos.lit = blend < 0.5 ? data[i0 * 3 + 2] : data[i1 * 3 + 2];
        };

        const beamAt = (time, age) => {
            const local = R.mod(time, CYCLE);
            let k = 0;
            while (k < KEYS.length - 2 && KEYS[k + 1][0] <= local) {
                k++;
            }
            const from = KEYS[k][1];
            const to = KEYS[k + 1][1];
            if (from === to) {
                shapeAt(from, time, age);
                return;
            }
            const raw = (local - KEYS[k][0]) / (KEYS[k + 1][0] - KEYS[k][0]);
            const eased = R.ease.inOutCubic(raw);
            shapeAt(from, time, age);
            const ax = pos.x;
            const ay = pos.y;
            const al = pos.lit;
            shapeAt(to, time, age);
            // The Y gain dips as the figures trade places, the way a scope flattens when the signal changes,
            // so one figure squashes into a bright line and the next one grows out of it.
            const gain = 1 - 0.9 * Math.pow(Math.sin(Math.PI * raw), 1.6);
            pos.x = ax + (pos.x - ax) * eased;
            pos.y = CY + (ay - CY + (pos.y - ay) * eased) * gain;
            pos.lit = al + (pos.lit - al) * eased;
        };

        const sx = new Float32Array(SAMPLES);
        const sy = new Float32Array(SAMPLES);
        const sl = new Float32Array(SAMPLES);
        const level = new Uint8Array(SAMPLES);
        const bucketStart = new Int32Array(LEVELS + 2);
        const bucketFill = new Int32Array(LEVELS + 2);
        const sorted = new Int32Array(SAMPLES);

        const head = (() => {
            const size = 64;
            const canvas = document.createElement('canvas');
            canvas.width = size;
            canvas.height = size;
            const paint = canvas.getContext('2d');
            const grad = paint.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
            grad.addColorStop(0, 'rgba(235,242,255,1)');
            grad.addColorStop(0.12, 'rgba(160,195,255,0.7)');
            grad.addColorStop(0.4, 'rgba(50,110,255,0.18)');
            grad.addColorStop(1, 'rgba(30,80,255,0)');
            paint.fillStyle = grad;
            paint.fillRect(0, 0, size, size);
            return canvas;
        })();

        const PASSES = R.theme === 'light' ? [
            [11, R.pal.accent, 0.06],
            [3.8, R.pal.accent, 0.25],
            [1.3, R.pal.accent, 1]
        ] : [
            [11, 'rgb(24,80,255)', 0.13],
            [3.8, 'rgb(60,128,255)', 0.42],
            [1.3, 'rgb(226,237,255)', 1]
        ];

        const drawGraticule = () => {
            const left = 80;
            const top = 90;
            const div = 40;
            ctx.lineWidth = 1;
            ctx.strokeStyle = R.rgba(R.pal.text, 0.055);
            ctx.beginPath();
            for (let i = 0; i <= 10; i++) {
                ctx.moveTo(left + i * div, top);
                ctx.lineTo(left + i * div, top + 8 * div);
            }
            for (let i = 0; i <= 8; i++) {
                ctx.moveTo(left, top + i * div);
                ctx.lineTo(left + 10 * div, top + i * div);
            }
            ctx.stroke();
            ctx.strokeStyle = R.rgba(R.pal.text, 0.1);
            ctx.beginPath();
            for (let i = 0; i <= 50; i++) {
                const x = left + i * (div / 5);
                ctx.moveTo(x, CY - 3);
                ctx.lineTo(x, CY + 3);
            }
            for (let i = 0; i <= 40; i++) {
                const y = top + i * (div / 5);
                ctx.moveTo(CX - 3, y);
                ctx.lineTo(CX + 3, y);
            }
            ctx.stroke();
        };

        return {
            update(t, dt) {
                const pointer = env.pointer;
                const weight = lissajousWeight(t) * pointer.active;
                detuneX = pointer.nx * 0.45 * weight;
                detuneY = -pointer.ny * 0.45 * weight;
                driftX = R.mod(driftX + (TAU * detuneX * dt) / TRACE, TAU);
                driftY = R.mod(driftY + (TAU * detuneY * dt) / TRACE, TAU);
            },
            draw(t) {
                env.clear();
                drawGraticule();

                for (let j = 0; j < SAMPLES; j++) {
                    const age = j * STEP;
                    beamAt(t - age, age);
                    sx[j] = pos.x;
                    sy[j] = pos.y;
                    sl[j] = pos.lit;
                }
                // Energy per length: where the beam slows down it writes brighter, as on a real tube.
                bucketFill.fill(0);
                for (let j = 0; j < SAMPLES - 1; j++) {
                    const len = Math.max(0.25, Math.hypot(sx[j] - sx[j + 1], sy[j] - sy[j + 1]));
                    const decay = Math.exp(-(j * STEP) / GLOW) * REPEAT;
                    const intensity = Math.min(MAX_INTENSITY, (REFERENCE / len) * decay * Math.min(sl[j], sl[j + 1]));
                    const lv = Math.round((intensity / MAX_INTENSITY) * LEVELS);
                    level[j] = lv;
                    bucketFill[lv]++;
                }
                let run = 0;
                for (let lv = 0; lv <= LEVELS; lv++) {
                    bucketStart[lv] = run;
                    run += bucketFill[lv];
                    bucketFill[lv] = bucketStart[lv];
                }
                for (let j = 0; j < SAMPLES - 1; j++) {
                    sorted[bucketFill[level[j]]++] = j;
                }

                ctx.globalCompositeOperation = R.theme === 'light' ? 'source-over' : 'lighter';
                ctx.lineCap = 'butt';
                ctx.lineJoin = 'round';
                for (let pass = 0; pass < PASSES.length; pass++) {
                    const spec = PASSES[pass];
                    ctx.lineWidth = spec[0];
                    ctx.strokeStyle = spec[1];
                    for (let lv = 1; lv <= LEVELS; lv++) {
                        const start = bucketStart[lv];
                        const end = lv < LEVELS ? bucketStart[lv + 1] : SAMPLES - 1;
                        if (end <= start) {
                            continue;
                        }
                        ctx.globalAlpha = Math.min(1, spec[2] * (lv / LEVELS) * MAX_INTENSITY);
                        ctx.beginPath();
                        for (let slot = start; slot < end; slot++) {
                            const j = sorted[slot];
                            ctx.moveTo(sx[j + 1], sy[j + 1]);
                            ctx.lineTo(sx[j], sy[j]);
                        }
                        ctx.stroke();
                    }
                }
                if (sl[0] > 0.5) {
                    ctx.globalAlpha = 0.9;
                    ctx.drawImage(head, sx[0] - 18, sy[0] - 18, 36, 36);
                }
                ctx.globalAlpha = 1;
                ctx.globalCompositeOperation = 'source-over';

                env.fadeEdges(0.6, 0.97);

                const knobs = lissajousWeight(t);
                ctx.font = '500 10px ' + R.fonts.mono;
                ctx.textBaseline = 'alphabetic';
                ctx.fillStyle = R.pal.muted;
                ctx.fillText('CH1  0.5 V/div', 96, 402);
                ctx.textAlign = 'right';
                ctx.fillText('2 ms/div', 464, 402);
                if (knobs > 0.02) {
                    const local = R.mod(t, CYCLE);
                    const big = local >= 3.2 && local < 9;
                    const fx = (big ? 5 : 3) + detuneX;
                    const fy = (big ? 4 : 2) + detuneY;
                    ctx.fillStyle = R.rgba(R.pal.muted, 0.5 * knobs);
                    ctx.fillText('X ' + fx.toFixed(2) + '  Y ' + fy.toFixed(2), 464, 112);
                }
                ctx.textAlign = 'left';
            }
        };
    }
});
