import type { Wave } from './types.ts';

// Типизируем глобальный стор
export const synthState = $state({
    waves: [] as Wave[], // Говорим TS, что тут будет массив Wave
    baseFreq: 50,
    zoom: 1.0,
    isPlaying: false,
    viewMode: 'full' as 'full' | 'compact',
    graphMode: 'separate' as 'separate' | 'combined',
    isCompact: false,
    hoveredWaveId: null as number | null,
    soloWaveId: null as number | null
});

// Пример того, как теперь выглядит функция добавления с TS:
export function addWave() {
    // Если ты забудешь тут написать pan или inverted, TS выдаст ошибку!
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
        synthState.soloWaveId = null; // Отключить соло
    } else {
        synthState.soloWaveId = id; // Включить соло для этой волны
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

// Presets are now managed in src/lib/presets/index.ts