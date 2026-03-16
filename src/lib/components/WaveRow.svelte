<script lang="ts">
    import { synthState, updateWave, toggleMute, toggleInvert, removeWave, addHarmonics, toggleSolo, setHoveredWave } from '../store.svelte.js';
    import type { Wave } from '../types.ts';
    import { AudioEngine } from '../AudioEngine.js';

    let { wave, labelIndex, isHarmonic }: { wave: Wave, labelIndex: number | string, isHarmonic: boolean } = $props();

    let harmCount = $state(3);
    let isExpanded = $state(false);
    
    $effect(() => {
        let _ = synthState.viewMode;
        isExpanded = false;
    });

    let showFull = $derived(synthState.viewMode === 'full' || isExpanded);

    function handleChange(key: string, value: any) {
        updateWave(wave.id, key, value);
        if (synthState.isPlaying) AudioEngine.updateParams(synthState.waves, synthState.baseFreq);
    }

    function handleMute() {
        toggleMute(wave.id);
        if (synthState.isPlaying) AudioEngine.rebuild(synthState.waves, synthState.baseFreq, synthState.soloWaveId);
    }

    function handleSolo() {
        toggleSolo(wave.id);
        if (synthState.isPlaying) AudioEngine.rebuild(synthState.waves, synthState.baseFreq, synthState.soloWaveId);
    }

    function handleRemove() {
        removeWave(wave.id);
        if (synthState.isPlaying) AudioEngine.rebuild(synthState.waves, synthState.baseFreq, synthState.soloWaveId);
    }

    function handleInvert() {
        toggleInvert(wave.id);
        if (synthState.isPlaying) AudioEngine.updateParams(synthState.waves, synthState.baseFreq);
    }

    function resetParam(key: string, defaultValue: number) {
        handleChange(key, defaultValue);
    }
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="wave-row {!showFull ? 'compact-mode' : 'full-mode'} {wave.active ? '' : 'muted'} {isHarmonic ? 'is-harmonic' : ''} {synthState.soloWaveId === wave.id ? 'solo-active' : ''}" 
     data-type="{wave.type}"
     onmouseenter={() => setHoveredWave(wave.id)}
     onmouseleave={() => setHoveredWave(null)}>
    
    {#if !showFull}
        <div style="color:#555;">{isHarmonic ? '' : '#' + labelIndex}</div>
        <div style="color:#4f9; font-size:0.8em">{isHarmonic ? 'HARM' : 'MAIN'}</div>
        <div class="compact-info" style="font-size:0.8em; color:#aaa">
            {isHarmonic ? `x${wave.mul}` : 'Fund'} | Det: {wave.detune.toFixed(2)} | Pan: {wave.pan}
        </div>
        <div class="action-buttons">
            <button class="btn-icon" onclick={() => isExpanded = true} title="Развернуть">⚙️</button>
            <button class="btn-icon {synthState.soloWaveId === wave.id ? 'btn-active' : ''}" onclick={handleSolo} title="Solo">S</button>
            <button class="btn-icon" onclick={handleMute}>{wave.active ? '🔊' : '🔇'}</button>
        </div>

    {:else}
        <div style="color:#555; font-weight:bold;">{isHarmonic ? '↳' : '#' + labelIndex}</div>

        <div class="row-control">
            <label>Type</label>
            <select value={wave.type} onchange={(e) => handleChange('type', e.currentTarget.value)}>
                <option value="sine">Sine</option>
                <option value="sawtooth">Saw</option>
                <option value="square">Square</option>
                <option value="triangle">Triangle</option>
            </select>
        </div>

        <div class="row-control">
            <label>Mult (x{wave.mul})</label>
            <input type="range" min="0.5" max="12.0" step="0.5" value={wave.mul} oninput={(e) => handleChange('mul', parseFloat(e.currentTarget.value))} ondblclick={() => resetParam('mul', 1.0)}>
        </div>

        <div class="row-control">
            <label>Detune ({wave.detune} Hz)</label>
            <input type="range" min="-15.0" max="15.0" step="0.1" value={wave.detune} oninput={(e) => handleChange('detune', parseFloat(e.currentTarget.value))} ondblclick={() => resetParam('detune', 0.0)}>
        </div>

        <div class="row-control">
            <label>Vol</label>
            <input type="range" min="0" max="1" step="0.1" value={wave.vol} oninput={(e) => handleChange('vol', parseFloat(e.currentTarget.value))} ondblclick={() => resetParam('vol', 0.8)}>
        </div>

        <div class="row-control">
            <label>Pan: {wave.pan}</label>
            <input type="range" class="pan-slider" min="-1" max="1" step="0.1" value={wave.pan} oninput={(e) => handleChange('pan', parseFloat(e.currentTarget.value))} ondblclick={() => resetParam('pan', 0.0)}>
        </div>

        <button class="btn-phase {wave.inverted ? 'active' : ''}" onclick={handleInvert} title="Invert Phase">Ø</button>

        {#if !isHarmonic}
            <div class="harm-controls">
                <input type="number" bind:value={harmCount} min="1" max="20" style="width:40px;">
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <div class="btn-small" role="button" tabindex="0" onclick={() => { addHarmonics(wave.id, harmCount); if(synthState.isPlaying) AudioEngine.rebuild(synthState.waves, synthState.baseFreq, synthState.soloWaveId); }}>+ Гарм</div>
            </div>
        {:else}
            <div class="harmonic-hide"></div>
        {/if}

        <div class="action-buttons">
            <button class="btn-icon {synthState.soloWaveId === wave.id ? 'btn-active' : ''}" onclick={handleSolo} title="Solo" style="font-weight:bold; font-size: 1em;">S</button>
            <button class="btn-icon" onclick={handleMute} title="Mute">{wave.active ? '🔊' : '🔇'}</button>
            {#if synthState.viewMode === 'compact' && isExpanded}
                <button class="btn-icon" onclick={() => isExpanded = false} title="Свернуть">▲</button>
            {/if}
            <button class="btn-icon" onclick={handleRemove} style="color:#f55">✕</button>
        </div>
    {/if}
</div>

<style>
    .wave-row { background: #222; border-left: 5px solid #555; padding: 5px 10px; border-radius: 0 4px 4px 0; display: grid; gap: 10px; align-items: center; font-size: 0.9em; margin-bottom: 2px; transition: background-color 0.2s; }
    .wave-row.full-mode { grid-template-columns: 30px 60px 1fr 1fr 1fr 1fr 30px 100px auto; }
    .wave-row.compact-mode { grid-template-columns: 30px 60px 1fr auto; padding: 2px 10px; }
    .wave-row:hover { background: #2a2a2a; }
    .wave-row.muted { opacity: 0.5; }
    .wave-row.solo-active { background: #28281a; border-right: 2px solid #fd0; }
    .wave-row.is-harmonic { margin-left: 30px; background: #1f1f1f; border-left-width: 2px; opacity: 0.9; }
    .wave-row.is-harmonic.solo-active { background: #28281a; }
    .wave-row.is-harmonic .harmonic-hide { visibility: hidden; }
    .wave-row[data-type="sine"] { border-left-color: #4f9; }     
    .wave-row[data-type="sawtooth"] { border-left-color: #f94; } 
    .wave-row[data-type="square"] { border-left-color: #49f; }   
    .wave-row[data-type="triangle"] { border-left-color: #d4f; } 
    .row-control { display: flex; flex-direction: column; }
    .row-control label { font-size: 0.7em; color: #666; margin-bottom: 2px; white-space: nowrap; }
    select, input[type="number"] { background: #111; border: 1px solid #444; color: #fff; padding: 4px; border-radius: 3px; }
    .btn-icon { background: none; border: none; cursor: pointer; color: #777; font-size: 1.2em; padding:0; }
    .btn-icon:hover { color: #fff; }
    .btn-icon.btn-active { color: #fd0; text-shadow: 0 0 5px rgba(255,221,0,0.5); }
    .action-buttons { display: flex; align-items: center; gap: 10px; justify-content: flex-end; }
    .btn-phase { width: 30px; height: 30px; background: #222; border: 1px solid #444; color: #777; display: flex; align-items: center; justify-content: center; font-weight: bold; cursor: pointer; border-radius: 4px;}
    .btn-phase:hover { color: #fff; border-color: #777; }
    .btn-phase.active { background: #f94; color: #000; border-color: #f94; }
    .harm-controls { display: flex; align-items: center; gap: 5px; }
    .btn-small { background: #333; border: 1px solid #555; color: #ccc; font-size: 0.8em; padding: 4px 8px; border-radius: 3px; cursor: pointer; }
    .btn-small:hover { background: #444; color: #fff; }
    input[type=range] { width: 100%; cursor: pointer; background: #333; height: 4px; appearance: none; border-radius: 2px; transition: opacity 0.2s; }
    input[type=range]:hover { opacity: 0.8; }
    input[type=range]::-webkit-slider-thumb { appearance: none; width: 12px; height: 12px; background: #fff; border-radius: 50%; }
    input[type=range].pan-slider::-webkit-slider-thumb { background: #49f; border-radius: 2px; width: 6px; height: 14px; }
</style>