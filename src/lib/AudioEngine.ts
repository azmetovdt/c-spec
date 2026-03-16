import type { Wave, WaveType } from './types.ts';

interface AudioNodeGroup {
    osc: OscillatorNode;
    gain: GainNode;
    panner: StereoPannerNode;
    waveId: number;
}

class Engine {
    ctx: AudioContext | null = null;
    masterGain: GainNode | null = null;
    nodes: AudioNodeGroup[] = [];

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.connect(this.ctx.destination);
        }
    }

    stopAll() {
        this.nodes.forEach(node => {
            try { node.osc.stop(); node.osc.disconnect(); } catch(e){}
        });
        this.nodes = [];
    }

    rebuild(waves: Wave[], baseFreq: number, soloWaveId: number | null) {
        if (!this.ctx || !this.masterGain) return;
        this.stopAll();

        const activeWaves = waves.filter((w: Wave) => {
            if (!w.active) return false;
            if (soloWaveId !== null) {
                return w.id === soloWaveId || w.parentId === soloWaveId;
            }
            return true;
        });

        const activeCount = activeWaves.length || 1;
        
        let masterVol = 0.5;
        if (activeCount > 10) masterVol = 0.5 / Math.sqrt(activeCount);
        this.masterGain.gain.value = masterVol;

        activeWaves.forEach((w: Wave) => {
            if (!this.ctx || !this.masterGain) return;
            
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            const panner = this.ctx.createStereoPanner();

            osc.type = w.type;
            osc.frequency.value = (baseFreq * w.mul) + w.detune;
            
            let finalVol = w.vol * (w.inverted ? -1 : 1);
            gain.gain.value = finalVol;
            panner.pan.value = w.pan;

            osc.connect(gain);
            gain.connect(panner);
            panner.connect(this.masterGain);
            
            osc.start();
            this.nodes.push({ osc, gain, panner, waveId: w.id });
        });
    }

    updateParams(waves: Wave[], baseFreq: number) {
        if (!this.ctx) return;
        this.nodes.forEach(node => {
            const w = waves.find((x: Wave) => x.id === node.waveId);
            if (w && w.active) {
                node.osc.frequency.setTargetAtTime((baseFreq * w.mul) + w.detune, this.ctx!.currentTime, 0.05);
                node.osc.type = w.type;
                let finalVol = w.vol * (w.inverted ? -1 : 1);
                node.gain.gain.setTargetAtTime(finalVol, this.ctx!.currentTime, 0.05);
                node.panner.pan.setTargetAtTime(w.pan, this.ctx!.currentTime, 0.05);
            }
        });
    }
}

export const AudioEngine = new Engine();