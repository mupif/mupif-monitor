<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-primary text-white" height-hint="98">
      <q-toolbar>
        <q-toolbar-title>
          <q-img src="~assets/mupif-logo-2-light.png" width="80px" />
          MuPIF Platform Monitor
        </q-toolbar-title>
        <MuPIFStatus />
      </q-toolbar>
      <q-tabs align="left" v-model="tab" dense>
        <q-route-tab name="ns" label="MuPIF NS" :to="'/ns'" />
        <q-route-tab name="vpn" label="MuPIF VPN" :to="'/vpn'" />

        <q-route-tab
          name="scheduler"
          label="MuPIF Scheduler"
          :to="'/scheduler'"
        />
      </q-tabs>
    </q-header>

    <q-page-container>
      <q-tab-panels v-model="tab" keep-alive>
        <q-tab-panel name="ns">
          <RouterView />
        </q-tab-panel>

        <q-tab-panel name="vpn">
          <RouterView />
        </q-tab-panel>

        <q-tab-panel name="scheduler">
          <RouterView />
        </q-tab-panel>
      </q-tab-panels>
    </q-page-container>

    <q-footer elevated class="bg-grey-8 text-white">
      <q-toolbar>
        <q-toolbar-title>
          <q-avatar>
            <img src="https://cdn.quasar.dev/logo-v2/svg/logo-mono-white.svg" />
          </q-avatar>
          <div>Title</div>
        </q-toolbar-title>
      </q-toolbar>
    </q-footer>
  </q-layout>
</template>

<script>
import { ref } from "vue";
import MuPIFStatus from "../components/MuPIFStatus.vue";

export default {
  setup() {
    return {
      tab: ref("vpn"),
    };
  },
  components: {
    MuPIFStatus,
  },
};
</script>
