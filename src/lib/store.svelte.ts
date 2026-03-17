import type { Wave, Attractor, Particle, WaveState } from './types.ts';

const MAX_WAVES = 100;

function createGhostTarget(): WaveState[] {
    const states: WaveState[] = [];
    const DF = 0.1;
    for(let i=1; i<=10; i++) {
        states.push({ mul: 1.0, detune: i * DF, vol: 1.0, pan: 0.0, inverted: false, activeWeight: 1.0 });
        for(let j=2; j<=10; j++) {
            states.push({ mul: j, detune: i * DF * j, vol: 1.0 / j, pan: (j % 2 === 0) ? 0.3 : -0.3, inverted: false, activeWeight: 1.0 });
        }
    }
    while(states.length < MAX_WAVES) states.push({ mul: 1, detune: 0, vol: 0, pan: 0, inverted: false, activeWeight: 0 });
    return states;
}

function createFractalTarget(): WaveState[] {
    const states: WaveState[] = [];
    states.push({ mul: 1.0, detune: 0, vol: 1.0, pan: 0.0, inverted: false, activeWeight: 1.0 });
    let detuneStep = 0.1;
    let currentDetune = 0;
    for(let i=1; i<=9; i++) {
        currentDetune += detuneStep * i;
        states.push({ mul: 1.0, detune: currentDetune, vol: 0.8, pan: (i % 2 === 0) ? 0.5 : -0.5, inverted: false, activeWeight: 1.0 });
    }
    while(states.length < MAX_WAVES) states.push({ mul: 1, detune: 0, vol: 0, pan: 0, inverted: false, activeWeight: 0 });
    return states;
}

function createMetallicTarget(): WaveState[] {
    const states: WaveState[] = [];
    for(let i=0; i<MAX_WAVES; i++) {
        states.push({
            mul: 1 + Math.random() * 20,
            detune: Math.random() * 100 - 50,
            vol: Math.random() * 0.3,
            pan: Math.random() * 2 - 1,
            inverted: Math.random() > 0.5,
            activeWeight: Math.random() > 0.5 ? 1.0 : 0.0
        });
    }
    return states;
}

function createOrganTarget(): WaveState[] {
    const states: WaveState[] = [];
    for(let i=0; i<MAX_WAVES; i++) {
        const mul = i + 1;
        states.push({
            mul,
            detune: 0,
            vol: i < 16 ? 1 / mul : 0,
            pan: 0,
            inverted: false,
            activeWeight: i < 16 ? 1.0 : 0.0
        });
    }
    return states;
}

function getInitialWaves(): Wave[] {
    const target = createGhostTarget();
    return target.map((ts, i) => ({
        id: i,
        parentId: (i % 10 === 0) ? null : i - (i % 10),
        type: 'sine',
        mul: ts.mul,
        detune: ts.detune,
        vol: ts.vol * ts.activeWeight,
        pan: ts.pan,
        inverted: ts.inverted,
        active: ts.activeWeight > 0
    }));
}

export const synthState = $state({
    waves: getInitialWaves(),
    baseFreq: 50,
    zoom: 1.5,
    isPlaying: false,
    viewMode: 'compact' as 'full' | 'compact',
    graphMode: 'separate' as 'separate' | 'combined',
    isCompact: true,
    hoveredWaveId: null as number | null,
    soloWaveId: null as number | null,
    uiMode: 'view' as 'view' | 'admin',
    
    // Gravity System State
    attractors: [
        {
            id: 'ghost',
            name: 'CSP 1',
            x: 0, y: 0, z: 0,
            mass: 1,
            active: true,
            targetBaseFreq: 50,
            targetWaves: createGhostTarget()
        },
        {
            id: 'fractal',
            name: 'Фрактал',
            x: 200, y: 150, z: -100,
            mass: 1,
            active: true,
            targetBaseFreq: 60,
            targetWaves: createFractalTarget()
        },
        {
            id: 'metallic',
            name: 'Metallic',
            x: -200, y: 150, z: 100,
            mass: 1.0,
            active: true,
            targetBaseFreq: 40,
            targetWaves: createMetallicTarget()
        },
    ] as Attractor[],
    particle: {
        x: 0, y: 0, z: 0,
        vx: 0, vy: 0, vz: 0
    } as Particle,
    gravityEnabled: true,
    gravitySpeed: 5.0,
    gravityForce: 120000,
    gravityNoise: 5.0,
    gravityFriction: 0.97, 
    gravitySoftening: 1000, 
    gravityFatigueRate: 0.05,
    gravityRecoveryRate: 0.05,
    gravityFatigueRadius: 70
    });



export function fullReset() {
    synthState.waves = getInitialWaves();
    synthState.baseFreq = 50;
    synthState.zoom = 1.5;
    synthState.viewMode = 'compact';
    synthState.particle = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 };
    synthState.gravitySpeed = 1.0;
    synthState.gravityForce = 100000;
    synthState.gravityNoise = 2.0;
    synthState.gravityFriction = 0.95;
    synthState.gravitySoftening = 200;
    
    // Reset attractor masses
    synthState.attractors.forEach(a => {
        if (a.id === 'ghost') a.mass = 1.5;
        if (a.id === 'fractal') a.mass = 1.2;
        if (a.id === 'metallic') a.mass = 1.0;
        if (a.id === 'organ') a.mass = 1.3;
        a.active = true;
    });
}

export function softReset() {
    synthState.waves = getInitialWaves();
    synthState.baseFreq = 50;
    synthState.particle = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0 };
}

export function addWave() {
    const newWave: Wave = {
        id: Date.now(), parentId: null, type: 'sine', mul: 1.0, 
        detune: 0.0, vol: 0.8, pan: 0.0, inverted: false, active: true
    };
    synthState.waves.push(newWave);
}

export function addHarmonics(parentId: number, count: number) {
    const parent = synthState.waves.find(w => w.id === parentId);
    if (!parent) return;
    const existingChildren = synthState.waves.filter(w => w.parentId === parentId);
    let startHarmonic = 2;
    if (existingChildren.length > 0) {
        startHarmonic = Math.max(...existingChildren.map(c => c.mul)) + 1;
    }
    for(let k = 0; k < count; k++) {
        let hNum = startHarmonic + k;
        synthState.waves.push({
            id: Date.now() + k + Math.random(),
            parentId: parentId, type: parent.type, mul: hNum,
            detune: parent.detune * hNum, vol: parent.vol / hNum, 
            pan: parent.pan, inverted: parent.inverted, active: true
        });
    }
}

export function updateWave(id: number, key: string, value: any) {
    const wave = synthState.waves.find(w => w.id === id);
    if (wave) {
        (wave as any)[key] = value;
        if (key === 'type' && wave.parentId === null) {
            synthState.waves.filter(child => child.parentId === id).forEach(child => child.type = value);
        }
    }
}

export function toggleMute(id: number) {
    const wave = synthState.waves.find(w => w.id === id);
    if (wave) wave.active = !wave.active;
}

export function toggleSolo(id: number) {
    if (synthState.soloWaveId === id) {
        synthState.soloWaveId = null;
    } else {
        synthState.soloWaveId = id;
    }
}

export function setHoveredWave(id: number | null) {
    synthState.hoveredWaveId = id;
}

export function toggleInvert(id: number) {
    const wave = synthState.waves.find(w => w.id === id);
    if (wave) wave.inverted = !wave.inverted;
}

export function removeWave(id: number) {
    const idsToDelete = [id, ...synthState.waves.filter(w => w.parentId === id).map(c => c.id)];
    synthState.waves = synthState.waves.filter(w => !idsToDelete.includes(w.id));
}

export function clearAll() {
    synthState.waves = [];
}
