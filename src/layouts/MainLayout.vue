<template>
  <q-layout view="hHh lpR fff">
    <!-- footer not fixed ("fff"): a footer fixed to the window covered the end of the pages (e.g. rows
         of the last executions of the scheduler) until scrolled down, and in full-page captures and
         printouts; now it follows the content (at the bottom of the window on short pages) -->
    <q-header elevated class="bg-primary text-white" height-hint="98">
      <q-toolbar>
        <q-toolbar-title>
          <q-img
            src="~assets/mupif-logo.png"
            width="80px"
            style="background-color: white"
          />
          MuPIF Platform Monitor
        </q-toolbar-title>
        <MuPIFStatus />
      </q-toolbar>
      <q-tabs align="left" v-model="tab" dense>
        <q-route-tab name="overview" label="Overview" :to="'/overview'" />
        <q-route-tab name="ns" label="MuPIF NS" :to="'/ns'" />
        <q-route-tab name="vpn" label="MuPIF VPN" :to="'/vpn'" />

        <q-route-tab
          name="scheduler"
          label="MuPIF Scheduler"
          :to="'/scheduler'"
        />
        <q-route-tab
          name="jobmans"
          label="Model servers"
          :to="'/jobmans'"
        />
      </q-tabs>
    </q-header>

    <q-page-container>
      <q-tab-panels v-model="tab">
        <q-tab-panel name="overview">
          <RouterView />
        </q-tab-panel>

        <q-tab-panel name="ns">
          <RouterView />
        </q-tab-panel>

        <q-tab-panel name="vpn">
          <RouterView />
        </q-tab-panel>

        <q-tab-panel name="scheduler">
          <RouterView />
        </q-tab-panel>

        <q-tab-panel name="jobmans">
          <RouterView />
        </q-tab-panel>
      </q-tab-panels>
    </q-page-container>

    <q-footer class="bg-grey-4 text-black">
      <q-toolbar>
        <q-toolbar-title>
          <a href="http://www.mupif.org">
            <q-img
              src="~assets/mupif-logo.png"
              width="80px"
              style="background-color: grey-4"
          /></a>
        </q-toolbar-title>
        <div align="right">www.mupif.org<br />(C) 2024 CVUT Team</div>
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
      // the tab shown first: the overview of the platform (also the default route)
      tab: ref("overview"),
    };
  },
  components: {
    MuPIFStatus,
  },
};
</script>
