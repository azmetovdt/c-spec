<script lang="ts">
    import { synthState, clearAll } from '../store.svelte.js';
    import { presets } from '../presets/index.ts';
    import { AudioEngine } from '../AudioEngine.js';
import { artEngine } from '../ArtEngine.svelte.js';

let { togglePlay } = $props();

function onGlobalChange() {
    if (synthState.isPlaying) AudioEngine.updateParams(synthState.waves, synthState.baseFreq);
}

function toggleArt() {
    artEngine.settings.active = !artEngine.settings.active;
    if (artEngine.settings.active) artEngine.start();
}
</script>

<div class="global-controls">
<div class="art-panel">
    <button class="btn-art {artEngine.settings.active ? 'active' : ''}" onclick={toggleArt}>
        🎨 GENERATIVE {artEngine.settings.active ? 'ON' : 'OFF'}
    </button>
    <div class="art-params">
        <label>Speed</label>
        <input type="range" min="0" max="1" step="0.01" bind:value={artEngine.settings.speed}>
        <label>Power</label>
        <input type="range" min="0" max="2" step="0.1" bind:value={artEngine.settings.intensity}>
    </div>
</div>

<div class="divider"></div>

<select id="presetBtn" onchange={(e) => { 
        if (e.currentTarget.value) {
            const presetId = e.currentTarget.value;
            const preset = presets.find(p => p.id === presetId);
            if (preset) preset.apply();
            if (synthState.isPlaying) AudioEngine.rebuild(synthState.waves, synthState.baseFreq, synthState.soloWaveId);
            e.currentTarget.value = "";
        }
    }}>
        <option value="" disabled selected>⚡ ПРИМЕРЫ</option>
        {#each presets as preset}
            <option value={preset.id}>{preset.name}</option>
        {/each}
    </select>
    <button id="clearBtn" onclick={() => { clearAll(); if(synthState.isPlaying) AudioEngine.rebuild(synthState.waves, synthState.baseFreq, synthState.soloWaveId); }}>🗑 Очистить</button>

    <button id="playBtn" class="{synthState.isPlaying ? 'active' : ''}" onclick={togglePlay}>
        {synthState.isPlaying ? 'СТОП' : 'ВКЛЮЧИТЬ ЗВУК'}
    </button>
    
    <div class="control-group">
        <label>Базовая частота <span>{synthState.baseFreq} Hz</span></label>
        <input type="range" min="20" max="300" step="1" bind:value={synthState.baseFreq} oninput={onGlobalChange}>
    </div>
    
    <div class="control-group">
            <label>Zoom</label>
            <input type="range" min="0.1" max="5.0" step="0.1" bind:value={synthState.zoom}>
    </div>

    <div class="control-group">
        <label>Вид списка</label>
        <select class="settings-select" bind:value={synthState.viewMode}>
            <option value="full">Полный</option>
            <option value="compact">Компактный</option>
        </select>
    </div>

    <div class="control-group">
        <label>График слоев</label>
        <select class="settings-select" bind:value={synthState.graphMode}>
            <option value="separate">Раздельно</option>
            <option value="combined">Наложение</option>
        </select>
    </div>
</div>

<style>
    .global-controls { background: #1a1a1a; padding: 15px; border-radius: 12px; border: 1px solid #333; margin-bottom: 20px; display: flex; align-items: center; gap: 20px; flex-wrap: wrap; box-shadow: 0 4px 20px rgba(0,0,0,0.4); }
    .art-panel { display: flex; align-items: center; gap: 15px; background: #222; padding: 10px; border-radius: 8px; border: 1px solid #444; }
    .art-params { display: flex; flex-direction: column; gap: 2px; font-size: 0.7em; color: #888; width: 80px; }
    .btn-art { background: #333; color: #aaa; border: 1px solid #444; padding: 10px; font-size: 0.8em; }
    .btn-art.active { background: #6200ea; color: #fff; border-color: #7c4dff; box-shadow: 0 0 15px rgba(98,0,234,0.4); }
    .divider { width: 1px; height: 40px; background: #333; }
    .global-controls { background: #1e1e1e; padding: 15px; border-radius: 8px; border: 1px solid #333; margin-bottom: 20px; display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
    .control-group { display: flex; flex-direction: column; min-width: 130px; }
    .control-group label { font-size: 0.8em; color: #aaa; margin-bottom: 5px; font-weight: bold; }
    .control-group span { float: right; color: #4f9; font-family: monospace; }
    select.settings-select { padding: 5px; background: #333; color: #fff; border: 1px solid #555; border-radius: 4px; }
    button { cursor: pointer; border: none; font-weight: bold; border-radius: 6px; transition: 0.2s; }
    #playBtn { padding: 15px 30px; background: #222; border: 2px solid #4f9; color: #4f9; font-size: 1.1em; text-transform: uppercase; }
    #playBtn:hover { background: #4f9; color: #000; }
    #playBtn.active { background: #f55; border-color: #f55; color: #fff; }
    #presetBtn { padding: 10px 15px; background: #6200ea; color: #fff; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; appearance: none; text-align: center; }
    #presetBtn:hover { background: #7c4dff; }
    #clearBtn { padding: 10px 15px; background: #333; color: #f55; border: 1px solid #500; margin-right: auto; }
    #clearBtn:hover { background: #500; color: #fff; }
    input[type=range] { width: 100%; cursor: pointer; background: #333; height: 4px; appearance: none; border-radius: 2px; }
    input[type=range]::-webkit-slider-thumb { appearance: none; width: 12px; height: 12px; background: #fff; border-radius: 50%; }
</style>