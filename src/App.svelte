<script lang="ts">
    import { onMount } from 'svelte';
    import { synthState, addWave } from './lib/store.svelte.js';
    import type { Wave } from './lib/types.ts';
    import { AudioEngine } from './lib/AudioEngine.js';
    import { Visualizer } from './lib/canvas/Visualizer.js'
    import { GravityEngine } from './lib/GravityEngine.ts';
    import WaveRow from './lib/components/WaveRow.svelte';
    import GlobalControls from './lib/components/GlobalControls.svelte';

    let cvsLayers = $state<HTMLCanvasElement>();
    let cvsSum = $state<HTMLCanvasElement>();
    let cvsSpec = $state<HTMLCanvasElement>();
    let cvsGrav = $state<HTMLCanvasElement>();
    let visualizer: Visualizer;

    onMount(() => {
        visualizer = new Visualizer();
        visualizer.start();
        return () => {
            visualizer.stop();
            GravityEngine.stop();
        };
    });

    $effect(() => {
        const mode = synthState.uiMode;
        if (visualizer) {
            setTimeout(() => {
                visualizer.updateCanvases(cvsLayers, cvsSum, cvsSpec, cvsGrav);
            }, 0);
        }
    });

    function togglePlay() {
        if (!synthState.isPlaying) {
            AudioEngine.init();
            AudioEngine.rebuild(synthState.waves, synthState.baseFreq, synthState.soloWaveId);
            synthState.isPlaying = true;
            GravityEngine.start();
        } else {
            AudioEngine.rebuild(synthState.waves, synthState.baseFreq, synthState.soloWaveId);
            AudioEngine.stopAll();
            synthState.isPlaying = false;
            GravityEngine.stop();
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

<div class="app-wrapper {synthState.uiMode}">
    {#if synthState.uiMode === 'view'}
        <div class="view-mode">
            <div class="view-header">
                <div class="logo">C-SPEC / INTERFERENCE</div>
                <button class="admin-toggle" onclick={() => synthState.uiMode = 'admin'}>EDIT</button>
            </div>

            <div class="main-visual">
                <div class="canvas-box grav-box">
                    <canvas bind:this={cvsGrav}></canvas>
                </div>

                <div class="visual-footer">
                    <div class="canvas-box spec-box">
                        <canvas bind:this={cvsSpec}></canvas>
                    </div>
                    <div class="canvas-box sum-box">
                        <canvas bind:this={cvsSum}></canvas>
                    </div>
                </div>
            </div>

            <div class="view-controls">
                <button class="btn-minimal {synthState.isPlaying ? 'active' : ''}" onclick={togglePlay}>
                    {synthState.isPlaying ? 'STOP' : 'START SOUND'}
                </button>
            </div>
        </div>
    {:else}
        <div class="container admin-mode">
            <div class="admin-header">
                <h4>ADMIN PANEL</h4>
                <button class="view-toggle" onclick={() => synthState.uiMode = 'view'}>BACK TO VIEW</button>
            </div>

            <h4>1. Слои <span style="font-size:0.7em; color:#666">({synthState.graphMode === 'combined' ? 'Наложение' : 'Раздельно'})</span></h4>
            <canvas bind:this={cvsLayers} height="200"></canvas>

            <h4>2. Сумма</h4>
            <canvas bind:this={cvsSum} height="150"></canvas>

            <h4>3. Спектр</h4>
            <canvas bind:this={cvsSpec} height="100"></canvas>

            <h4>4. Гравитационное пространство</h4>
            <canvas bind:this={cvsGrav} height="500"></canvas>

            <GlobalControls {togglePlay} />

            <div class="wave-list">
                {#each structuredWaves as item (item.wave.id)}
                    <WaveRow wave={item.wave} labelIndex={item.labelIndex} isHarmonic={item.isHarmonic} />
                {/each}
            </div>

            <div class="add-btn" onclick={() => { addWave(); if(synthState.isPlaying) AudioEngine.rebuild(synthState.waves, synthState.baseFreq, synthState.soloWaveId); }}>+ ДОБАВИТЬ ОСНОВНУЮ ВОЛНУ</div>
        </div>
    {/if}
</div>

<style>
    :global(body) { margin: 0; padding: 0; background: #000; font-family: 'Inter', sans-serif; overflow-x: hidden; }

    .app-wrapper { width: 100%; min-height: 100vh; color: #fff; display: flex; flex-direction: column; align-items: center; }
    
    /* VIEW MODE */
    .view-mode { display: flex; flex-direction: column; width: 100%; max-width: 1200px; height: 100vh; padding: 40px; box-sizing: border-box; background: #000; }
    .view-header { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
    .logo { font-size: 1.2em; font-weight: 200; letter-spacing: 4px; }
    .admin-toggle { background: none; border: none; color: #444; cursor: pointer; font-size: 0.7em; letter-spacing: 2px; }
    .admin-toggle:hover { color: #fff; }

    .main-visual { flex: 1; display: flex; flex-direction: column; gap: 20px; }
    .visual-footer { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; height: 120px; }

    .canvas-box { border: 1px solid #111; position: relative; }
    .canvas-box canvas { background: #000; width: 100%; height: 100%; display: block; border: none; }

    .view-controls { margin-top: 40px; display: flex; justify-content: center; }
    .btn-minimal { background: none; border: 1px solid #fff; color: #fff; padding: 20px 60px; font-size: 0.9em; letter-spacing: 5px; cursor: pointer; transition: 0.3s; font-weight: 200; }
    .btn-minimal:hover { background: #fff; color: #000; }
    .btn-minimal.active { background: #fff; color: #000; }

    /* ADMIN MODE */
    .admin-mode { width: 100%; max-width: 1100px; margin: 0 auto; padding: 20px; color: #eee; }
    .admin-mode h4 { margin: 10px 0 5px 0; color: #888; font-size: 0.8em; }
    .admin-mode canvas { background: #080808; border: 1px solid #333; width: 100%; border-radius: 4px; display: block; margin-bottom: 5px; height: 120px; }
    .admin-mode .grav-canvas { height: 350px; } /* Slightly larger for gravity but not full screen */

    .admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 1px solid #333; padding-bottom: 10px; }
    .view-toggle { background: #333; border: 1px solid #444; color: #fff; padding: 5px 15px; border-radius: 4px; cursor: pointer; font-size: 0.7em; letter-spacing: 1px; }

    .wave-list { display: flex; flex-direction: column; gap: 2px; max-height: 350px; overflow-y: auto; padding: 5px; border: 1px solid #222; background: #181818; }
    .add-btn { background: #222; border: 1px dashed #444; color: #888; padding: 10px; text-align: center; cursor: pointer; border-radius: 6px; margin-top: 10px; font-weight: bold; font-size: 0.8em; }
    .add-btn:hover { background: #2a2a2a; color: #ddd; }
    </style>