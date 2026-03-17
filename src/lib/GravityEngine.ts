import { synthState } from './store.svelte.ts';
import { AudioEngine } from './AudioEngine.ts';

class GravityEngineInstance {
    private lastTime = 0;
    private running = false;
    
    private noiseOffset = { x: Math.random() * 1000, y: Math.random() * 1000, z: Math.random() * 1000 };
    
    // Per-attractor fatigue (0.0 to 1.5)
    private fatigueMap = new Map<string, number>();

    start() {
        if (this.running) return;
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this.loop.bind(this));
    }

    stop() {
        this.running = false;
    }

    private loop(time: number) {
        if (!this.running) return;
        
        const rawDt = (time - this.lastTime) / 1000;
        const dt = rawDt * synthState.gravitySpeed;
        this.lastTime = time;

        if (synthState.gravityEnabled) {
            this.updatePhysics(dt);
            this.updateAudioMapping();
        }

        requestAnimationFrame(this.loop.bind(this));
    }

    private updatePhysics(dt: number) {
        const p = synthState.particle;
        const attractors = synthState.attractors.filter(a => a.active);

        let ax = 0, ay = 0, az = 0;

        // 1. Gravity with Fatigue
        for (const attractor of attractors) {
            const dx = attractor.x - p.x;
            const dy = attractor.y - p.y;
            const dz = attractor.z - p.z;
            const distSq = dx * dx + dy * dy + dz * dz + 10; 
            const dist = Math.sqrt(distSq);
            
            // Manage fatigue
            let fatigue = this.fatigueMap.get(attractor.id) || 0;
            if (dist < synthState.gravityFatigueRadius) {
                fatigue += dt * synthState.gravityFatigueRate; 
            } else {
                fatigue -= dt * synthState.gravityRecoveryRate; 
            }
            fatigue = Math.max(0, Math.min(1.5, fatigue));
            this.fatigueMap.set(attractor.id, fatigue);

            // Effective mass multiplier: 1.0 (fresh) -> 0.0 (tired) -> -0.5 (repulsive)
            const effectiveMass = attractor.mass * (1.0 - fatigue);
            const force = (effectiveMass * synthState.gravityForce) / (distSq + synthState.gravitySoftening);

            ax += (dx / dist) * force;
            ay += (dy / dist) * force;
            az += (dz / dist) * force;
        }

        // 2. Decorrelated Noise (fix diagonals)
        this.noiseOffset.x += dt * 0.23;
        this.noiseOffset.y += dt * 0.17;
        this.noiseOffset.z += dt * 0.31;
        
        ax += Math.sin(this.noiseOffset.x) * synthState.gravityNoise;
        ay += Math.cos(this.noiseOffset.y) * synthState.gravityNoise;
        az += Math.sin(this.noiseOffset.z * 0.7) * synthState.gravityNoise;

        // 3. Friction and Velocity clamping
        const friction = synthState.gravityFriction;
        p.vx = (p.vx + ax * dt) * friction;
        p.vy = (p.vy + ay * dt) * friction;
        p.vz = (p.vz + az * dt) * friction;


        const maxV = 400; 
        const v = Math.sqrt(p.vx**2 + p.vy**2 + p.vz**2);
        if (v > maxV) {
            p.vx = (p.vx / v) * maxV;
            p.vy = (p.vy / v) * maxV;
            p.vz = (p.vz / v) * maxV;
        }

        // 4. Update coordinates
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.z += p.vz * dt;
        
        // Boundaries (bounce)
        const limit = 300;
        if (Math.abs(p.x) > limit) { p.x = Math.sign(p.x) * limit; p.vx *= -0.5; }
        if (Math.abs(p.y) > limit) { p.y = Math.sign(p.y) * limit; p.vy *= -0.5; }
        if (Math.abs(p.z) > limit) { p.z = Math.sign(p.z) * limit; p.vz *= -0.5; }
    }

    private updateAudioMapping() {
        const p = synthState.particle;
        const attractors = synthState.attractors.filter(a => a.active);
        
        if (attractors.length === 0) return;

        // 1. Calculate IDW weights
        let totalWeight = 0;
        const weights = attractors.map(a => {
            const dist = Math.sqrt((a.x - p.x)**2 + (a.y - p.y)**2 + (a.z - p.z)**2) + 0.1;
            const w = 1 / (dist * dist);
            totalWeight += w;
            return w;
        });

        const normalizedWeights = weights.map(w => w / totalWeight);

        // 2. Interpolate Global Parameters
        let targetBaseFreq = 0;
        normalizedWeights.forEach((w, i) => {
            targetBaseFreq += attractors[i].targetBaseFreq * w;
        });
        synthState.baseFreq = targetBaseFreq;

        // 3. Interpolate wave parameters
        synthState.waves.forEach((wave, waveIdx) => {
            let targetDetune = 0;
            let targetVol = 0;
            let targetPan = 0;
            let targetMul = 0;
            let targetPresence = 0;

            normalizedWeights.forEach((w, attractorIdx) => {
                const attractor = attractors[attractorIdx];
                const state = attractor.targetWaves[waveIdx % attractor.targetWaves.length];
                
                targetDetune += state.detune * w;
                targetVol += state.vol * w;
                targetPan += state.pan * w;
                targetMul += state.mul * w;
                targetPresence += (state.activeWeight ?? 1.0) * w;
            });

            wave.detune = targetDetune;
            wave.vol = targetVol * targetPresence; // Apply presence mask
            wave.mul = targetMul;
            wave.pan = targetPan;
            
            // Auto-deactivate if volume is too low to save CPU
            wave.active = wave.vol > 0.001;
        });

        // 4. Update AudioEngine
        AudioEngine.updateParams(synthState.waves, synthState.baseFreq);
    }

    getCoordinates() {
        return { x: synthState.particle.x, y: synthState.particle.y, z: synthState.particle.z };
    }
}

export const GravityEngine = new GravityEngineInstance();
