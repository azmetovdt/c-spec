<script lang="ts">
    import { onMount } from 'svelte';
    import { synthState, addWave } from './lib/store.svelte.js';
    import type { Wave } from './lib/types.ts';
    import { AudioEngine } from './lib/AudioEngine.js';
    import { Visualizer } from './lib/canvas/Visualizer.js'
    import WaveRow from './lib/components/WaveRow.svelte';
    import GlobalControls from './lib/components/GlobalControls.svelte';

    let cvsLayers: HTMLCanvasElement;
    let cvsSum: HTMLCanvasElement;
    let cvsSpec: HTMLCanvasElement;
    let visualizer: Visualizer;

    onMount(() => {
        visualizer = new Visualizer(cvsLayers, cvsSum, cvsSpec);
        visualizer.start();
        return () => visualizer.stop();
    });

    function togglePlay() {
        if (!synthState.isPlaying) {
            AudioEngine.init();
            AudioEngine.rebuild(synthState.waves, synthState.baseFreq, synthState.soloWaveId);
            synthState.isPlaying = true;
        } else {
            AudioEngine.rebuild(synthState.waves, synthState.baseFreq, synthState.soloWaveId);
            AudioEngine.stopAll();
            synthState.isPlaying = false;
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e.code === 'Space' && e.target === document.body) {
            e.preventDefault(); // Предотвращаем скроллинг страницы
            togglePlay();
        }
    }
    
    // Получаем структурированный список волн (родители -> дети)
    let structuredWaves = $derived.by(() => {
        let list: { wave: Wave; labelIndex: number | string; isHarmonic: boolean }[] = [];
        const parents = synthState.waves.filter(w => w.parentId === null);
        parents.forEach((parent, index) => {
            list.push({ wave: parent, labelIndex: index + 1, isHarmonic: false });
            const children = synthState.waves.filter(w => w.parentId === parent.id).sort((a,b) => a.id - b.id);
            children.forEach(child => list.push({ wave: child, labelIndex: "", isHarmonic: true }));
        });
        return list;
    });

</script>

<svelte:window onkeydown={handleKeydown} />

<div class="container">
    <h4>1. Слои <span style="font-size:0.7em; color:#666">({synthState.graphMode === 'combined' ? 'Наложение' : 'Раздельно'})</span></h4>
    <canvas bind:this={cvsLayers} height="200"></canvas>

    <h4>2. Сумма</h4>
    <canvas bind:this={cvsSum} height="150"></canvas>

    <h4>3. Спектр</h4>
    <canvas bind:this={cvsSpec} height="100"></canvas>

    <GlobalControls {togglePlay} />

    <div class="wave-list">
        {#each structuredWaves as item (item.wave.id)}
            <WaveRow wave={item.wave} labelIndex={item.labelIndex} isHarmonic={item.isHarmonic} />
        {/each}
    </div>

    <div class="add-btn" onclick={() => { addWave(); if(synthState.isPlaying) AudioEngine.rebuild(synthState.waves, synthState.baseFreq, synthState.soloWaveId); }}>+ ДОБАВИТЬ ОСНОВНУЮ ВОЛНУ</div>
</div>

<style>
    /* Глобальные стили для макета (Svelte оборачивает их в скоуп, но для :global можно вынести) */
    :global(body) { font-family: 'Segoe UI', sans-serif; background: #121212; color: #eee; padding: 20px; display: flex; flex-direction: column; align-items: center; margin: 0; }
    .container { width: 100%; max-width: 1100px; }
    h4 { margin: 15px 0 5px 0; color: #888; font-weight: normal; font-size: 0.9em; text-transform: uppercase; letter-spacing: 1px; }
    canvas { background: #080808; border: 1px solid #333; width: 100%; border-radius: 4px; display: block; margin-bottom: 5px; }
    .wave-list { display: flex; flex-direction: column; gap: 2px; max-height: 500px; overflow-y: auto; padding: 5px; border: 1px solid #222; background: #181818; }
    .add-btn { background: #222; border: 1px dashed #444; color: #888; padding: 12px; text-align: center; cursor: pointer; border-radius: 6px; margin-top: 15px; font-weight: bold; }
    .add-btn:hover { background: #2a2a2a; color: #ddd; }
</style>