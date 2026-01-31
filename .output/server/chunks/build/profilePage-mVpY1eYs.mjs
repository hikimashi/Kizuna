import { defineComponent, ref, toRaw, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderComponent, ssrRenderAttrs, ssrRenderAttr, ssrInterpolate, ssrIncludeBooleanAttr } from 'vue/server-renderer';
import { b as useUserStore, c as useThemeStore, d as useAlertStore, e as useToastStore, f as useMyAuthStore, g as useDrawersStore, h as useAnilistAuth } from './server.mjs';
import { onBeforeRouteLeave } from 'vue-router';
import { storeToRefs } from 'pinia';
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
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'pocketbase';

const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "profile",
  __ssrInlineRender: true,
  setup(__props) {
    const userStore = useUserStore();
    const themeStore = useThemeStore();
    const alertStore = useAlertStore();
    useToastStore();
    useMyAuthStore();
    useDrawersStore();
    const { userData } = storeToRefs(userStore);
    userData.value.password = "";
    userData.value.passwordConfirm = "";
    userData.value.oldPassword = "";
    userData.value.avatarFile = null;
    const duplicateData = ref(structuredClone(toRaw(userData.value)));
    const previewUrl = ref("");
    useAnilistAuth();
    const passwordMisMatch = () => {
      if (duplicateData.value.passwordConfirm.length >= 7)
        return duplicateData.value.password !== duplicateData.value.passwordConfirm;
    };
    onBeforeRouteLeave(async () => {
      const editedProfile = await userStore.userDataHasEdited(duplicateData.value);
      if (editedProfile) {
        const response = await alertStore.openAlert({
          type: "success",
          message: "Data profile was edited do you wanna leave?"
        });
        if (!response) {
          return false;
        }
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "w-full h-full px-4 py-16 mt-20" }, _attrs))}><div class="grid grid-cols-1 lg:grid-cols-3 gap-6"><div class="col-span-1"><div class="h-full flex flex-col bg-base-100 rounded-xl shadow-xl border border-base-300"><div class="flex flex-col h-auto items-center p-6 border-b border-base-300"><div class="avatar online mb-4"><div class="w-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 relative"><img${ssrRenderAttr("src", previewUrl.value || unref(userData)?.avatar || "/img/user.png")}>`);
      if (duplicateData.value.avatarFile) {
        _push(`<div class="absolute -top-1 -right-1 badge badge-warning badge-sm"></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div><p class="text-base-content/70">${ssrInterpolate(unref(userData)?.email)}</p><div class="mt-4 w-full"><label class="btn btn-outline w-full btn-sm gap-2"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"></path></svg> Change photo <input type="file" class="hidden" accept="image/*"></label></div></div><div class="p-4"><div class="stats stats-vertical w-full shadow"><div class="stat"><div class="stat-title">Created</div><div class="stat-desc text-lg">${ssrInterpolate(unref(userData)?.created)}</div></div></div></div></div></div><div class="w-full col-span-2 shadow-xl rounded-xl border border-base-300"><div class="tabs tabs-lift"><input type="radio" name="tabsProfile" class="tab" aria-label="Profile" checked><div class="tab-content bg-base-100 p-6 rounded-b-xs border border-base-300"><div><h2 class="text-xl font-bold mb-4">Profile</h2><div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"><div class="form-control w-full"><label class="fieldset-legend" for="name"> Name</label><p class="validator-hint">Required Field!</p></div><div class="form-control w-full"><label class="fieldset-legend" for="email"> Email</label><input id="email"${ssrRenderAttr("value", duplicateData.value.email)} type="email" placeholder="email@example.com" class="input w-full validator"><p class="validator-hint">Required Field!</p></div></div></div><div class="divider"></div><h2 class="text-xl font-bold mb-4">Theme preference</h2><label class="swap-rotate swap btn btn-ghost"><input type="checkbox"${ssrIncludeBooleanAttr(unref(themeStore).activeTheme === "winter") ? " checked" : ""} data-toggle-theme="forest,winter"><svg class="swap-off w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z"></path></svg><svg class="swap-on w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"></path></svg></label></div><input type="radio" name="tabsProfile" class="tab" aria-label="Security"><div class="tab-content p-6 rounded-b-xs border border-base-300"><div><h2 class="text-xl font-bold mb-4">Security</h2><div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6"><div class="form-control w-full"><label class="fieldset-legend" for="email1"> Email</label><input id="email1"${ssrRenderAttr("value", duplicateData.value.email)} type="email" placeholder="email@example.com" disabled class="input w-full validator"></div><div class="form-control"><label class="fieldset-legend" for="pasword">Current password</label><input${ssrRenderAttr("value", duplicateData.value.oldPassword)} type="password" id="pasword" class="input validator w-full" placeholder="Current password" minlength="8" pattern="(?=.*\\d)(?=.*[a-z])(?=.*[A-Z]).{8,}" title="You password"><p class="validator-hint">Required Field!</p></div><div class="form-control"><label class="fieldset-legend" for="newPassword">New password</label><input${ssrRenderAttr("value", duplicateData.value.password)} type="password" id="newPassword" class="input validator w-full" placeholder="New password" minlength="8" pattern="(?=.*\\d)(?=.*[a-z])(?=.*[A-Z]).{8,}" title="Must contain 8 characters with uppercase, lowercase, numbers, and symbols"><p class="validator-hint"> Minimum 8 characters with uppercase, lowercase, numbers, and symbols. </p></div><div class="form-control"><label class="fieldset-legend" for="confirmPassword">Confirm new password</label><input${ssrRenderAttr("value", duplicateData.value.passwordConfirm)} type="password" id="confirmPassword" class="input validator w-full" placeholder="Confirm new password" minlength="8" pattern="(?=.*\\d)(?=.*[a-z])(?=.*[A-Z]).{8,}" title="Must contain 8 characters with uppercase, lowercase, numbers, and symbols">`);
      if (passwordMisMatch()) {
        _push(`<p class="text-error">Passwords do not match!</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div></div><div class="flex justify-center"><button class="btn btn-outline btn-error w-1/2"> Delete Account </button></div></div><input type="radio" name="tabsProfile" class="tab" aria-label="AniList"><div class="tab-content p-6 rounded-b-xs border border-base-300"><div><h2 class="text-xl font-bold mb-4">AniList Integration</h2><div class="mb-6"><div class="flex items-center justify-between mb-4"><div><h3 class="font-semibold">Connect to AniList</h3><p class="text-sm text-gray-500">Connect your AniList account to enhance your profile with anime and manga information.</p></div>`);
      if (unref(userData)?.anilist_token) {
        _push(`<div><div class="flex items-center gap-2"><div class="avatar"><div class="w-10 rounded-full"><img${ssrRenderAttr("src", unref(userData)?.anilist_avatar_url || "/img/anilist-icon.png")} alt="AniList Avatar"></div></div><span class="font-medium">${ssrInterpolate(unref(userData)?.anilist_username || "Connected")}</span></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><div class="flex gap-2">`);
      if (!unref(userData)?.anilist_token) {
        _push(`<button class="btn btn-primary"> Connect to AniList </button>`);
      } else {
        _push(`<button class="btn btn-outline btn-error"> Disconnect from AniList </button>`);
      }
      _push(`</div></div>`);
      if (unref(userData)?.anilist_token) {
        _push(`<div class="mt-6"><h3 class="font-semibold mb-2">AniList Information</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-4"><div class="bg-base-200 p-4 rounded-lg"><p class="text-sm text-gray-500">AniList Username</p><p class="font-medium">${ssrInterpolate(unref(userData)?.anilist_username)}</p></div><div class="bg-base-200 p-4 rounded-lg"><p class="text-sm text-gray-500">AniList User ID</p><p class="font-medium">${ssrInterpolate(unref(userData)?.anilist_user_id)}</p></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div></div><div class="flex w-full justify-end gap-2 p-4"><button class="btn btn-outline btn-error"> Cancel </button><button class="btn btn-outline btn-success"> Save Changes </button></div></div></div></div>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/profile.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const Profile = Object.assign(_sfc_main$1, { __name: "Profile" });
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "profilePage",
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(Profile, _attrs, null, _parent));
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/profilePage.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=profilePage-mVpY1eYs.mjs.map
