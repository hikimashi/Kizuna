import { j as defineNuxtRouteMiddleware, b as useUserStore, k as usePocketbaseStore, n as navigateTo } from './server.mjs';
import 'vue';
import '../_/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'vue/server-renderer';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'pinia';
import 'vue-router';
import 'pocketbase';

const auth = defineNuxtRouteMiddleware(() => {
  const userStore = useUserStore();
  const pocketbaseStore = usePocketbaseStore();
  if (!pocketbaseStore.pb.authStore.isValid || !userStore.userData) {
    return navigateTo("/");
  }
});

export { auth as default };
//# sourceMappingURL=auth-D2OvBM7x.mjs.map
