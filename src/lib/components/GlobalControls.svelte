<script lang="ts">
    import { synthState, clearAll, fullReset, softReset } from '../store.svelte.js';
    import { presets } from '../presets/index.ts';
    import { AudioEngine } from '../AudioEngine.js';
import { artEngine } from '../ArtEngine.svelte.js';

let { togglePlay } = $props();

function onGlobalChange() {
    if (synthState.isPlaying) AudioEngine.updateParams(synthState.waves, synthState.baseFreq);
}

function toggleArt() {
    artEngine.settings.active = !artEngine.settings.active;
    if (artEngine.settings.active) {
        synthState.gravityEnabled = false;
        artEngine.start();
    }
}

function toggleGravity() {
    synthState.gravityEnabled = !synthState.gravityEnabled;
    if (synthState.gravityEnabled) {
        artEngine.settings.active = false;
    }
}
</script>

<div class="global-controls">
<div class="art-panel">
    <button class="btn-art {artEngine.settings.active ? 'active' : ''}" onclick={toggleArt}>
        🎨 GENERATIVE {artEngine.settings.active ? 'ON' : 'OFF'}
    </button>
    <button class="btn-art {synthState.gravityEnabled ? 'active-grav' : ''}" onclick={toggleGravity} style="margin-left: 10px;">
        🪐 GRAVITY {synthState.gravityEnabled ? 'ON' : 'OFF'}
    </button>
    
    {#if synthState.gravityEnabled}
        <div class="attractor-selector">
            {#each synthState.attractors as attractor}
                <div class="attractor-item">
                    <button 
                        class="attractor-btn {attractor.active ? 'active' : ''}" 
                        style="--color: {attractor.id === 'ghost' ? '#fff' : attractor.id === 'fractal' ? '#49f' : attractor.id === 'metallic' ? '#f94' : '#d4f'}"
                        onclick={() => attractor.active = !attractor.active}
                    >
                        {attractor.name}
                    </button>
                    {#if attractor.active}
                        <div class="mass-control">
                            <label>Mass: {attractor.mass.toFixed(1)}</label>
                            <input type="range" min="0.1" max="5.0" step="0.1" bind:value={attractor.mass}>
                        </div>
                    {/if}
                </div>
            {/each}
        </div>
    {/if}
    <div class="art-params {synthState.gravityEnabled ? 'grav-mode' : ''}">
        {#if synthState.gravityEnabled}
            <div class="grav-scroll">
                <label>Speed: {synthState.gravitySpeed.toFixed(1)}</label>
                <input type="range" min="0" max="5" step="0.1" bind:value={synthState.gravitySpeed}>
                
                <label>Force: {(synthState.gravityForce/1000).toFixed(0)}k</label>
                <input type="range" min="1000" max="500000" step="1000" bind:value={synthState.gravityForce}>
                
                <label>Noise: {synthState.gravityNoise.toFixed(1)}</label>
                <input type="range" min="0" max="50" step="0.5" bind:value={synthState.gravityNoise}>
                
                <label>Friction: {synthState.gravityFriction.toFixed(2)}</label>
                <input type="range" min="0.5" max="0.99" step="0.01" bind:value={synthState.gravityFriction}>

                <label>Soft: {synthState.gravitySoftening}</label>
                <input type="range" min="10" max="5000" step="10" bind:value={synthState.gravitySoftening}>

                <label>Fatigue Rate: {synthState.gravityFatigueRate.toFixed(2)}</label>
                <input type="range" min="0" max="2" step="0.05" bind:value={synthState.gravityFatigueRate}>

                <label>Recover: {synthState.gravityRecoveryRate.toFixed(2)}</label>
                <input type="range" min="0" max="1" step="0.01" bind:value={synthState.gravityRecoveryRate}>

                <label>F-Radius: {synthState.gravityFatigueRadius}</label>
                <input type="range" min="10" max="200" step="5" bind:value={synthState.gravityFatigueRadius}>
            </div>
        {:else}
            <label>Speed</label>
            <input type="range" min="0" max="1" step="0.01" bind:value={artEngine.settings.speed}>
            <label>Power</label>
            <input type="range" min="0" max="2" step="0.1" bind:value={artEngine.settings.intensity}>
        {/if}
    </div>
</div>

<div class="divider"></div>

    <button id="playBtn" class="{synthState.isPlaying ? 'active' : ''}" onclick={togglePlay}>
        {synthState.isPlaying ? 'СТОП' : 'ВКЛЮЧИТЬ ЗВУК'}
    </button>

    <div class="reset-group">
        <button class="btn-reset soft" onclick={() => { softReset(); if(synthState.isPlaying) AudioEngine.rebuild(synthState.waves, synthState.baseFreq, synthState.soloWaveId); }}>Сброс звука</button>
        <button class="btn-reset full" onclick={() => { fullReset(); if(synthState.isPlaying) AudioEngine.rebuild(synthState.waves, synthState.baseFreq, synthState.soloWaveId); }}>Полный сброс</button>
    </div>
    
    <div class="control-group">
        <label>Базовая частота <span>{synthState.baseFreq.toFixed(2)} Hz</span></label>
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
    .art-params.grav-mode { width: 120px; }
    .grav-scroll { max-height: 80px; overflow-y: auto; padding-right: 5px; scrollbar-width: thin; scrollbar-color: #444 #222; }
    .grav-scroll label { font-size: 0.85em; display: block; margin-top: 4px; color: #aaa; }
    .btn-art { background: #333; color: #aaa; border: 1px solid #444; padding: 10px; font-size: 0.8em; }
    .btn-art.active { background: #6200ea; color: #fff; border-color: #7c4dff; box-shadow: 0 0 15px rgba(98,0,234,0.4); }
    .btn-art.active-grav { background: #00897b; color: #fff; border-color: #26a69a; box-shadow: 0 0 15px rgba(0,137,123,0.4); }
    
    .attractor-selector { display: flex; gap: 5px; background: #111; padding: 5px; border-radius: 6px; border: 1px solid #333; }
    .attractor-item { display: flex; flex-direction: column; gap: 3px; align-items: center; }
    .mass-control { display: flex; flex-direction: column; gap: 1px; width: 60px; }
    .mass-control label { font-size: 0.55em; color: #666; text-align: center; }
    .attractor-btn { padding: 5px 8px; font-size: 0.65em; background: #222; color: #666; border: 1px solid #333; text-transform: uppercase; width: 100%; }
    .attractor-btn.active { color: var(--color); border-color: var(--color); box-shadow: inset 0 0 8px var(--color); }
    
    .reset-group { display: flex; flex-direction: column; gap: 5px; }
    .btn-reset { padding: 5px 10px; font-size: 0.7em; background: #333; color: #ccc; border: 1px solid #444; border-radius: 4px; cursor: pointer; }
    .btn-reset:hover { background: #444; color: #fff; }
    .btn-reset.full { border-color: #f55; color: #fcc; }
    .btn-reset.full:hover { background: #522; }
    
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