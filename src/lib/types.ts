export type WaveType = 'sine' | 'sawtooth' | 'square' | 'triangle';

export interface Wave {
    id: number;
    parentId: number | null;
    type: WaveType;
    mul: number;
    detune: number;
    vol: number;
    pan: number;
    inverted: boolean;
    active: boolean;
}

export interface WaveState {
    mul: number;
    detune: number;
    vol: number;
    pan: number;
    inverted: boolean;
    activeWeight: number; 
}

export interface Attractor {
    id: string;
    name: string;
    x: number;
    y: number;
    z: number;
    mass: number;
    active: boolean;
    targetBaseFreq: number;
    targetWaves: WaveState[];
}

export interface Particle {
    x: number;
    y: number;
    z: number;
    vx: number;
    vy: number;
    vz: number;
}
