<template>
  <div class="container mx-auto p-4">
    <h1 class="text-2xl font-bold mb-4">Test AniList Token Exchange</h1>
    <div class="mb-4">
      <input 
        v-model="code" 
        type="text" 
        placeholder="Enter authorization code" 
        class="input input-bordered w-full max-w-xs"
      />
    </div>
    <button 
      @click="testExchange" 
      :disabled="!code" 
      class="btn btn-primary"
    >
      Test Token Exchange
    </button>
    
    <div v-if="result" class="mt-4 p-4 bg-gray-100 rounded">
      <h2 class="text-xl font-semibold mb-2">Result:</h2>
      <pre>{{ JSON.stringify(result, null, 2) }}</pre>
    </div>
    
    <div v-if="error" class="mt-4 p-4 bg-red-100 text-red-700 rounded">
      <h2 class="text-xl font-semibold mb-2">Error:</h2>
      <pre>{{ JSON.stringify(error, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const code = ref('');
const result = ref(null);
const error = ref(null);

const testExchange = async () => {
  result.value = null;
  error.value = null;
  
  try {
    const response = await $fetch('/api/anilist/exchange-token', {
      method: 'POST',
      body: { code: code.value }
    });
    
    result.value = response;
  } catch (err: any) {
    console.error('Test exchange error:', err);
    error.value = err;
  }
};
</script>