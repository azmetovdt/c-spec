import { synthState } from '../store.svelte.js';
import type { Wave, WaveType } from '../types.ts';

export interface Preset {
    id: string;
    name: string;
    apply: () => void;
}

export const presets: Preset[] = [
    {
        id: 'ghost',
        name: 'Призрак',
        apply: () => {
            synthState.waves = [];
            const DF = 0.1; 
            for(let i=1; i<=10; i++) {
                let parentId = Date.now() + i*100;
                synthState.waves.push({
                    id: parentId, parentId: null, type: 'sine',
                    mul: 1.0, detune: i * DF * 1, vol: 1.0, pan: 0.0, inverted: false, active: true
                });
                for(let j=2; j<=10; j++) {
                    synthState.waves.push({
                        id: parentId + j, parentId: parentId, type: 'sine',
                        mul: j, detune: i * DF * j, vol: 1.0 / j, 
                        pan: (j % 2 === 0) ? 0.3 : -0.3, inverted: false, active: true
                    });
                }
            }
            synthState.isCompact = true;
            synthState.viewMode = 'compact';
            synthState.zoom = 1.5;
        }
    },
    {
        id: 'fractal',
        name: 'Фрактальный детюн',
        apply: () => {
            synthState.waves = [];
            
            let parentId = Date.now();
            synthState.waves.push({
                id: parentId, parentId: null, type: 'sine',
                mul: 1.0, detune: 0, vol: 1.0, pan: 0.0, inverted: false, active: true
            });

            let detuneStep = 0.1;
            let currentDetune = 0;
            
            for(let i=1; i<=9; i++) {
                currentDetune += detuneStep * i; 
                synthState.waves.push({
                    id: parentId + i, parentId: parentId, type: 'sine',
                    mul: 1.0, detune: parseFloat(currentDetune.toFixed(2)), vol: 0.8, 
                    pan: (i % 2 === 0) ? 0.5 : -0.5, inverted: false, active: true
                });
            }

            synthState.isCompact = false;
            synthState.viewMode = 'full';
            synthState.zoom = 2.0;
        }
    }
];
