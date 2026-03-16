import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  // vitePreprocess позволяет использовать <script lang="ts">
  preprocess: vitePreprocess()
};