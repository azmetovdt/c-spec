import { synthState } from '../store.svelte.ts';

function getWaveValue(type: string, phase: number) {
    let p = phase % (2 * Math.PI);
    if (p < 0) p += 2 * Math.PI;
    if (type === 'sine') return Math.sin(phase);
    if (type === 'square') return Math.sin(phase) >= 0 ? 0.7 : -0.7;
    if (type === 'sawtooth') return -1 * (((p / Math.PI) + 1) % 2 - 1); 
    if (type === 'triangle') return (2 / Math.PI) * Math.asin(Math.sin(phase));
    return 0;
}

function getColor(type: string, alpha: number = 1) {
    if(type==='sine') return `rgba(79, 255, 153, ${alpha})`;
    if(type==='sawtooth') return `rgba(255, 153, 68, ${alpha})`;
    if(type==='square') return `rgba(68, 153, 255, ${alpha})`;
    if(type==='triangle') return `rgba(221, 68, 255, ${alpha})`;
    return `rgba(255, 255, 255, ${alpha})`;
}

export class Visualizer {
    cvsLayers: HTMLCanvasElement | undefined;
    cvsSum: HTMLCanvasElement | undefined;
    cvsSpec: HTMLCanvasElement | undefined;
    cvsGrav: HTMLCanvasElement | undefined;
    
    private contexts = new Map<HTMLCanvasElement, CanvasRenderingContext2D>();
    globalTime: number = 0;
    animId: number | null = null;

    constructor() {}

    updateCanvases(layers?: HTMLCanvasElement, sum?: HTMLCanvasElement, spec?: HTMLCanvasElement, grav?: HTMLCanvasElement) {
        this.contexts.clear();
        this.cvsLayers = layers;
        this.cvsSum = sum;
        this.cvsSpec = spec;
        this.cvsGrav = grav;
        this.resize();
    }

    private getCtx(cvs: HTMLCanvasElement | undefined): CanvasRenderingContext2D | null {
        if (!cvs) return null;
        if (!this.contexts.has(cvs)) {
            const ctx = cvs.getContext('2d');
            if (ctx) this.contexts.set(cvs, ctx);
        }
        return this.contexts.get(cvs) || null;
    }

    resize() {
        [this.cvsLayers, this.cvsSum, this.cvsSpec, this.cvsGrav].forEach(cvs => {
            if (cvs && cvs.parentElement) {
                const rect = cvs.getBoundingClientRect();
                cvs.width = rect.width;
                cvs.height = rect.height;
            }
        });
    }

    start() {
        if (!this.animId) this.draw();
    }

    stop() {
        if (this.animId) cancelAnimationFrame(this.animId);
        this.animId = null;
    }

    drawGravity = () => {
        const ctx = this.getCtx(this.cvsGrav);
        if (!ctx || !this.cvsGrav) return;

        const w = this.cvsGrav.width;
        const h = this.cvsGrav.height;
        const cx = w / 2;
        const cy = h / 2;
        
        const isView = synthState.uiMode === 'view';
        const scale = Math.min(w, h) / 700; 
        
        ctx.clearRect(0, 0, w, h);
        
        // 1. Grid
        ctx.strokeStyle = isView ? '#111' : '#1a1a1a';
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        for(let i=-300; i<=300; i+=100) {
            ctx.moveTo(cx + i * scale, cy - 300 * scale); ctx.lineTo(cx + i * scale, cy + 300 * scale);
            ctx.moveTo(cx - 300 * scale, cy + i * scale); ctx.lineTo(cx + 300 * scale, cy + i * scale);
        }
        ctx.stroke();

        ctx.strokeStyle = isView ? '#222' : '#333';
        ctx.strokeRect(cx - 300 * scale, cy - 300 * scale, 600 * scale, 600 * scale);

        const p = synthState.particle;
        const attractors = synthState.attractors;

        // 2. Draw connections
        attractors.filter(a => a.active).forEach(a => {
            const dist = Math.sqrt((a.x - p.x)**2 + (a.y - p.y)**2 + (a.z - p.z)**2);
            const alpha = Math.max(0.05, 1 - dist / 600);
            
            ctx.strokeStyle = isView ? `rgba(255, 255, 255, ${alpha * 0.2})` : `rgba(255, 255, 255, ${alpha * 0.3})`;
            ctx.lineWidth = isView ? 0.5 : alpha * 3 * scale;
            ctx.beginPath();
            ctx.moveTo(cx + a.x * scale, cy + a.y * scale);
            ctx.lineTo(cx + p.x * scale, cy + p.y * scale);
            ctx.stroke();
        });

        // 3. Draw attractors
        attractors.forEach(a => {
            const opacity = a.active ? 1.0 : 0.2;
            const size = a.mass * 15 * scale;

            if (isView) {
                ctx.strokeStyle = `rgba(255, 255, 255, ${opacity})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(cx + a.x * scale, cy + a.y * scale, a.active ? 4 : 2, 0, Math.PI * 2);
                ctx.stroke();
                
                if (a.active) {
                    ctx.fillStyle = '#fff';
                    ctx.font = `${Math.floor(9 * scale)}px monospace`;
                    ctx.fillText(a.name.toUpperCase(), cx + a.x * scale + 10 * scale, cy + a.y * scale + 3 * scale);
                }
            } else {
                const gradient = ctx.createRadialGradient(cx + a.x * scale, cy + a.y * scale, 0, cx + a.x * scale, cy + a.y * scale, size * 2);
                let color = '#fff';
                if (a.id === 'ghost') color = `rgba(255, 255, 255, ${opacity})`;
                if (a.id === 'fractal') color = `rgba(68, 153, 255, ${opacity})`;
                if (a.id === 'metallic') color = `rgba(255, 153, 68, ${opacity})`;
                if (a.id === 'organ') color = `rgba(221, 68, 255, ${opacity})`;
                
                gradient.addColorStop(0, color);
                gradient.addColorStop(1, 'transparent');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(cx + a.x * scale, cy + a.y * scale, size * 2, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = a.active ? '#fff' : '#444';
                ctx.beginPath();
                ctx.arc(cx + a.x * scale, cy + a.y * scale, 4 * scale, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = a.active ? '#aaa' : '#444';
                ctx.font = `${Math.floor(10 * scale)}px monospace`;
                ctx.fillText(a.name, cx + a.x * scale + 10 * scale, cy + a.y * scale + 5 * scale);
            }
        });

        // 4. Draw particle
        ctx.fillStyle = '#fff';
        if (!isView) {
            ctx.shadowBlur = 15 * scale;
            ctx.shadowColor = '#fff';
        }
        ctx.beginPath();
        ctx.arc(cx + p.x * scale, cy + p.y * scale, isView ? 3 : 5 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    draw = () => {
        const isView = synthState.uiMode === 'view';
        const activeWaves = synthState.waves.filter(w => {
            if (synthState.soloWaveId !== null) {
                return w.id === synthState.soloWaveId || w.parentId === synthState.soloWaveId;
            }
            return w.active;
        });
        
        const viewScale = 0.005 / synthState.zoom; 

        // 1. LAYERS
        const ctxL = this.getCtx(this.cvsLayers);
        if (ctxL && this.cvsLayers) {
            const lh = this.cvsLayers.height;
            const lw = this.cvsLayers.width;
            ctxL.clearRect(0,0,lw,lh);
            
            if (synthState.graphMode === 'combined') {
                const cy = lh / 2;
                ctxL.strokeStyle = '#222';
                ctxL.beginPath(); ctxL.moveTo(0, cy); ctxL.lineTo(lw, cy); ctxL.stroke();
                
                activeWaves.forEach((w) => {
                    const isHovered = synthState.hoveredWaveId === w.id;
                    const alpha = synthState.hoveredWaveId === null ? 0.4 : (isHovered ? 1.0 : 0.1);
                    ctxL.strokeStyle = getColor(w.type, alpha);
                    ctxL.lineWidth = isHovered ? 2 : 1;
                    ctxL.beginPath();
                    for(let x=0; x<lw; x+=4) { 
                        let freq = (synthState.baseFreq * w.mul) + w.detune;
                        let t = (x * viewScale) - (this.globalTime * 0.005);
                        let val = getWaveValue(w.type, t * freq);
                        if(w.inverted) val *= -1; 
                        let y = cy + (val * w.vol * (lh * 0.4)); 
                        if(x===0) ctxL.moveTo(x, y); else ctxL.lineTo(x, y);
                    }
                    ctxL.stroke();
                });
            } else {
                const renderLimit = Math.min(activeWaves.length, 15);
                if (renderLimit > 0) {
                    const rowHeight = lh / renderLimit;
                    activeWaves.slice(0, renderLimit).forEach((w, i) => {
                        const isHovered = synthState.hoveredWaveId === w.id;
                        const centerY = i * rowHeight + (rowHeight / 2);
                        const alpha = synthState.hoveredWaveId === null ? 0.8 : (isHovered ? 1.0 : 0.2);
                        ctxL.strokeStyle = '#111';
                        ctxL.beginPath(); ctxL.moveTo(0, centerY); ctxL.lineTo(lw, centerY); ctxL.stroke();
                        ctxL.strokeStyle = getColor(w.type, alpha);
                        ctxL.lineWidth = isHovered ? 2 : 1.5;
                        ctxL.beginPath();
                        for(let x=0; x<lw; x+=3) { 
                            let freq = (synthState.baseFreq * w.mul) + w.detune;
                            let t = (x * viewScale) - (this.globalTime * 0.005);
                            let val = getWaveValue(w.type, t * freq);
                            if(w.inverted) val *= -1;
                            let y = centerY + (val * w.vol * (rowHeight * 0.45));
                            if(x===0) ctxL.moveTo(x, y); else ctxL.lineTo(x, y);
                        }
                        ctxL.stroke();
                    });
                }
            }
        }

        // 2. SUM
        const ctxS = this.getCtx(this.cvsSum);
        if (ctxS && this.cvsSum) {
            const sh = this.cvsSum.height;
            const sw = this.cvsSum.width;
            const sCy = sh / 2;
            ctxS.clearRect(0,0,sw,sh);
            if (!isView) {
                ctxS.shadowBlur = 10;
                ctxS.shadowColor = 'rgba(255,255,255,0.2)';
            }
            ctxS.strokeStyle = '#222'; 
            ctxS.beginPath(); ctxS.moveTo(0, sCy); ctxS.lineTo(sw, sCy); ctxS.stroke();
            ctxS.strokeStyle = '#fff';
            ctxS.lineWidth = isView ? 1 : 2;
            ctxS.beginPath();
            for(let x=0; x<sw; x+=2) {
                let sum = 0;
                let t = (x * viewScale) - (this.globalTime * 0.005);
                activeWaves.forEach(w => {
                    let freq = (synthState.baseFreq * w.mul) + w.detune;
                    let val = getWaveValue(w.type, t * freq) * w.vol;
                    if(w.inverted) val *= -1;
                    sum += val;
                });
                let norm = Math.max(activeWaves.length, 1);
                let y = sCy + (sum / Math.sqrt(norm)) * (sh * 0.4); 
                if(x===0) ctxS.moveTo(x, y); else ctxS.lineTo(x, y);
            }
            ctxS.stroke();
            ctxS.shadowBlur = 0;
        }

        // 3. SPECTRUM
        const ctxSpec = this.getCtx(this.cvsSpec);
        if (ctxSpec && this.cvsSpec) {
            const sph = this.cvsSpec.height;
            const spw = this.cvsSpec.width;
            ctxSpec.clearRect(0,0,spw,sph);
            if (!isView) ctxSpec.globalCompositeOperation = 'screen';
            const maxFreq = synthState.baseFreq * 15; 
            activeWaves.forEach(w => {
                const isHovered = synthState.hoveredWaveId === w.id;
                const alpha = isView ? (w.vol * 0.8) : (synthState.hoveredWaveId === null ? 0.6 : (isHovered ? 1.0 : 0.1));
                ctxSpec.fillStyle = isView ? `rgba(255,255,255,${alpha})` : getColor(w.type, alpha);
                const baseF = (synthState.baseFreq * w.mul) + w.detune;
                let harms = (w.type === 'sine') ? 1 : 12;
                for(let k=1; k<=harms; k++) {
                    if((w.type==='square' || w.type==='triangle') && k%2===0) continue;
                    let f = baseF * k;
                    let x = (f / maxFreq) * spw;
                    if(x > spw) break;
                    let amp = 1/k;
                    if(w.type==='triangle') amp = 1/(k*k);
                    amp *= w.vol;
                    let h = amp * sph * 0.8;
                    ctxSpec.fillRect(x, sph - h, isView ? 1 : (isHovered ? 3 : 2), h);
                }
            });
            ctxSpec.globalCompositeOperation = 'source-over';
        }

        this.drawGravity();
        this.globalTime += 1;
        this.animId = requestAnimationFrame(this.draw);
    }
}
