import { synthState } from '../store.svelte.js';

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
    cvsLayers: HTMLCanvasElement;
    cvsSum: HTMLCanvasElement;
    cvsSpec: HTMLCanvasElement;
    ctxLayers: CanvasRenderingContext2D;
    ctxSum: CanvasRenderingContext2D;
    ctxSpec: CanvasRenderingContext2D;
    globalTime: number = 0;
    animId: number | null = null;

    constructor(cvsLayers: HTMLCanvasElement, cvsSum: HTMLCanvasElement, cvsSpec: HTMLCanvasElement) {
        this.cvsLayers = cvsLayers;
        this.cvsSum = cvsSum;
        this.cvsSpec = cvsSpec;
        this.ctxLayers = cvsLayers.getContext('2d')!;
        this.ctxSum = cvsSum.getContext('2d')!;
        this.ctxSpec = cvsSpec.getContext('2d')!;
        
        this.resize();
        window.addEventListener('resize', this.resize.bind(this));
    }

    resize() {
        [this.cvsLayers, this.cvsSum, this.cvsSpec].forEach(cvs => {
            cvs.width = cvs.parentElement?.offsetWidth || 800;
        });
    }

    start() {
        if (!this.animId) this.draw();
    }

    stop() {
        if (this.animId) cancelAnimationFrame(this.animId);
        this.animId = null;
    }

    draw = () => {
        const activeWaves = synthState.waves.filter(w => {
            if (synthState.soloWaveId !== null) {
                return w.id === synthState.soloWaveId || w.parentId === synthState.soloWaveId;
            }
            return w.active;
        });
        
        const viewScale = 0.005 / synthState.zoom; 
        
        // 1. LAYERS
        const lh = this.cvsLayers.height;
        const lw = this.cvsLayers.width;
        this.ctxLayers.clearRect(0,0,lw,lh);
        
        if (synthState.graphMode === 'combined') {
            const cy = lh / 2;
            this.ctxLayers.strokeStyle = '#222';
            this.ctxLayers.beginPath(); this.ctxLayers.moveTo(0, cy); this.ctxLayers.lineTo(lw, cy); this.ctxLayers.stroke();
            
            activeWaves.forEach((w) => {
                const isHovered = synthState.hoveredWaveId === w.id;
                const alpha = synthState.hoveredWaveId === null ? 0.4 : (isHovered ? 1.0 : 0.1);
                
                this.ctxLayers.strokeStyle = getColor(w.type, alpha);
                this.ctxLayers.lineWidth = isHovered ? 2 : 1;
                this.ctxLayers.beginPath();
                for(let x=0; x<lw; x+=4) { 
                    let freq = (synthState.baseFreq * w.mul) + w.detune;
                    let t = (x * viewScale) - (this.globalTime * 0.005);
                    let val = getWaveValue(w.type, t * freq);
                    if(w.inverted) val *= -1; 
                    let y = cy + (val * w.vol * (lh * 0.4)); 
                    if(x===0) this.ctxLayers.moveTo(x, y); else this.ctxLayers.lineTo(x, y);
                }
                this.ctxLayers.stroke();
            });
        } else {
            const renderLimit = Math.min(activeWaves.length, 15);
            if (renderLimit > 0) {
                const rowHeight = lh / renderLimit;
                activeWaves.slice(0, renderLimit).forEach((w, i) => {
                    const isHovered = synthState.hoveredWaveId === w.id;
                    const centerY = i * rowHeight + (rowHeight / 2);
                    const alpha = synthState.hoveredWaveId === null ? 0.8 : (isHovered ? 1.0 : 0.2);
                    
                    this.ctxLayers.strokeStyle = '#111';
                    this.ctxLayers.beginPath(); this.ctxLayers.moveTo(0, centerY); this.ctxLayers.lineTo(lw, centerY); this.ctxLayers.stroke();

                    this.ctxLayers.strokeStyle = getColor(w.type, alpha);
                    this.ctxLayers.lineWidth = isHovered ? 2 : 1.5;
                    this.ctxLayers.beginPath();
                    for(let x=0; x<lw; x+=3) { 
                        let freq = (synthState.baseFreq * w.mul) + w.detune;
                        let t = (x * viewScale) - (this.globalTime * 0.005);
                        let val = getWaveValue(w.type, t * freq);
                        if(w.inverted) val *= -1;
                        let y = centerY + (val * w.vol * (rowHeight * 0.45));
                        if(x===0) this.ctxLayers.moveTo(x, y); else this.ctxLayers.lineTo(x, y);
                    }
                    this.ctxLayers.stroke();
                });
            }
        }

        // 2. SUM
        const sh = this.cvsSum.height;
        const sw = this.cvsSum.width;
        const sCy = sh / 2;
        this.ctxSum.clearRect(0,0,sw,sh);
        
        // Эффект свечения для суммы
        this.ctxSum.shadowBlur = 10;
        this.ctxSum.shadowColor = 'rgba(255,255,255,0.2)';
        
        this.ctxSum.strokeStyle = '#222'; 
        this.ctxSum.beginPath(); this.ctxSum.moveTo(0, sCy); this.ctxSum.lineTo(sw, sCy); this.ctxSum.stroke();
        this.ctxSum.strokeStyle = '#fff';
        this.ctxSum.lineWidth = 2;
        this.ctxSum.beginPath();

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
            let y = sCy + (sum / Math.sqrt(norm)) * (sh * 0.3); 
            if(x===0) this.ctxSum.moveTo(x, y); else this.ctxSum.lineTo(x, y);
        }
        this.ctxSum.stroke();
        this.ctxSum.shadowBlur = 0;

        // 3. SPECTRUM
        const sph = this.cvsSpec.height;
        const spw = this.cvsSpec.width;
        this.ctxSpec.clearRect(0,0,spw,sph);
        this.ctxSpec.globalCompositeOperation = 'screen';
        const maxFreq = synthState.baseFreq * 15; 

        activeWaves.forEach(w => {
            const isHovered = synthState.hoveredWaveId === w.id;
            const alpha = synthState.hoveredWaveId === null ? 0.6 : (isHovered ? 1.0 : 0.1);
            
            this.ctxSpec.fillStyle = getColor(w.type, alpha);
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
                this.ctxSpec.fillRect(x, sph - h, isHovered ? 3 : 2, h);
            }
        });
        this.ctxSpec.globalCompositeOperation = 'source-over';

        this.globalTime += 1;
        this.animId = requestAnimationFrame(this.draw);
    }
}
