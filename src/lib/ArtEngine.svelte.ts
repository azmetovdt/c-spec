import { synthState, updateWave } from './store.svelte.js';
import { AudioEngine } from './AudioEngine.js';

class ArtEngine {
    private animId: number | null = null;
    private lastTime: number = 0;

    public settings = $state({
        active: false,
        intensity: 0.5,
        speed: 0.2,
    });

    start() {
        if (this.animId) return;
        this.lastTime = performance.now();
        this.loop();
    }

    stop() {
        if (this.animId) cancelAnimationFrame(this.animId);
        this.animId = null;
    }

    private loop = () => {
        if (!this.settings.active) {
            this.animId = requestAnimationFrame(this.loop);
            return;
        }

        const now = performance.now();
        const dt = (now - this.lastTime) / 1000;
        this.lastTime = now;

        this.applyEvolution(now, dt);

        this.animId = requestAnimationFrame(this.loop);
    };

    private applyEvolution(time: number, dt: number) {
        const { intensity, speed } = this.settings;
        const t = time * 0.001 * speed;

        synthState.waves.forEach((w, index) => {
            const detuneDrift = Math.sin(t + index) * intensity * 5;
            
            const panDrift = Math.cos(t * 0.7 + index * 0.5) * intensity;
            
            const volDrift = 0.8 + Math.sin(t * 1.5 + index) * 0.2 * intensity;

            w.detune = parseFloat((w.detune + detuneDrift * dt).toFixed(3));
            w.pan = parseFloat(Math.max(-1, Math.min(1, w.pan + panDrift * dt)).toFixed(3));
            
            if (Math.abs(w.detune) > 20) w.detune *= 0.95;
        });

        if (synthState.isPlaying) {
            AudioEngine.updateParams(synthState.waves, synthState.baseFreq);
        }
    }
}

export const artEngine = new ArtEngine();
