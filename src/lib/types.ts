export type WaveType = 'sine' | 'square' | 'sawtooth' | 'triangle';

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
