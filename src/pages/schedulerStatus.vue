<template>
  <!--
    Scheduler tab: details of one workflow scheduler (counters, load history, last executions).

    Several schedulers may be registered in the nameserver; a selector appears when there is more
    than one (mupifDB supports one per deployment at the moment). Data: schedulerStat store
    (GET scheduler-status2), refreshed every 10 s.
  -->
  <div class="q-gutter-y-sm">
    <q-banner v-if="store.error" dense class="bg-red-1 text-red-10">
      <template v-slot:avatar><q-icon name="error" color="red-8" /></template>
      Scheduler statistics are not available: {{ store.error }}
    </q-banner>

    <div v-if="store.totalCount > 1" class="row items-center q-gutter-sm">
      <span>Scheduler:</span>
      <q-btn-toggle
        v-model="selectedName"
        no-caps
        dense
        unelevated
        toggle-color="primary"
        :options="schedulerOptions"
      />
    </div>

    <div v-if="!current && !store.error" class="text-grey-7">
      No scheduler is registered in the nameserver.
    </div>

    <template v-if="current">
      <div class="text-caption text-grey-8">
        {{ current.name }}
        <span v-if="current.uri"> ({{ current.uri }})</span>
        <span v-if="store.lastUpdate">
          &middot; updated {{ store.lastUpdate.toLocaleTimeString() }}</span
        >
      </div>

      <q-banner v-if="!current.available" dense class="bg-red-1 text-red-10">
        <template v-slot:avatar
          ><q-icon name="cloud_off" color="red-8"
        /></template>
        The scheduler is registered but does not answer: {{ current.error }}
      </q-banner>

      <template v-else>
        <!-- current state -->
        <div class="row q-col-gutter-sm">
          <div class="col-6 col-sm-4 col-md-2">
            <q-card flat bordered class="stat-card">
              <div class="stat-label">Running</div>
              <div class="stat-value">
                {{ stat.running
                }}<span v-if="stat.capacity" class="stat-sub">
                  / {{ stat.capacity }}</span
                >
              </div>
              <div class="stat-sub">workflow processes</div>
            </q-card>
          </div>
          <div class="col-6 col-sm-4 col-md-2">
            <q-card flat bordered class="stat-card">
              <div class="stat-label">Waiting</div>
              <div class="stat-value">
                {{ stat.waiting !== null ? stat.waiting : "?" }}
              </div>
              <div class="stat-sub" v-if="stat.pending !== null">
                {{ stat.pending }} in queue + {{ stat.scheduled }} taken
              </div>
              <div class="stat-sub" v-else>
                {{ stat.scheduled }} taken (queue not reported)
              </div>
            </q-card>
          </div>
          <div class="col-6 col-sm-4 col-md-2">
            <q-card flat bordered class="stat-card">
              <div class="stat-label">Load</div>
              <q-circular-progress
                show-value
                :value="stat.currentLoad"
                size="44px"
                :thickness="0.2"
                color="teal"
                track-color="grey-3"
                class="q-mt-xs"
              >
                {{ Math.round(stat.currentLoad) }}%
              </q-circular-progress>
            </q-card>
          </div>
          <div class="col-6 col-sm-4 col-md-2">
            <q-card flat bordered class="stat-card">
              <div class="stat-label">State</div>
              <div class="q-mt-sm">
                <q-badge
                  v-if="stat.draining"
                  color="orange-9"
                  class="q-pa-xs"
                  title="Drain mode: no new executions are taken, running ones finish"
                >
                  <q-icon name="pause_circle" class="q-mr-xs" />draining
                </q-badge>
                <q-badge v-else color="green-8" class="q-pa-xs">
                  <q-icon name="play_circle" class="q-mr-xs" />taking executions
                </q-badge>
              </div>
            </q-card>
          </div>
          <div class="col-12 col-sm-8 col-md-4">
            <q-card flat bordered class="stat-card">
              <div class="stat-label">Processed in total</div>
              <div class="stat-value">{{ stat.processed }}</div>
              <div class="stat-sub">
                {{ stat.finished }} finished &middot; {{ stat.failed }} failed
              </div>
            </q-card>
          </div>
        </div>

        <!--
          The database may list more Running executions than the schedulers run: executions whose
          workflow outlived a previous scheduler run (left alone at startup) or records left Running
          after a crash. The database count is shared by all schedulers, so it is compared with the
          sum over all of them.
        -->
        <q-banner v-if="runningMismatch" dense class="bg-amber-1 text-brown-10">
          <template v-slot:avatar
            ><q-icon name="warning" color="amber-9"
          /></template>
          The database lists {{ store.summary.dbRunning }} Running execution(s),
          the scheduler{{ store.availableCount > 1 ? "s run" : " runs" }}
          {{ store.summary.running }}.
          <span v-if="store.summary.dbRunning > store.summary.running">
            The others are not processes of the scheduler: e.g. workflows which
            outlived a previous scheduler run, or records left Running after a
            crash.
          </span>
          <span v-else>
            The database has not been told about some started workflows (a
            status update is delayed or failed), or the counts were sampled at
            different moments.
          </span>
        </q-banner>

        <SchedulerStatHistory :scheduler="current" />
        <SchedulerLastExecutions />
      </template>
    </template>
  </div>
</template>

<script>
import { useSchedulerStatStore } from "stores/schedulerStat";

import SchedulerStatHistory from "../components/SchedulerStatHistory.vue";
import SchedulerLastExecutions from "../components/SchedulerLastExecutions.vue";

/** Refresh interval of the statistics (ms). */
const POLL_INTERVAL = 10000;

export default {
  components: {
    SchedulerStatHistory,
    SchedulerLastExecutions,
  },
  setup() {
    const store = useSchedulerStatStore();
    store.update();
    return { store };
  },
  data() {
    return {
      pooling: null,
    };
  },
  computed: {
    /** the scheduler shown (see the store's "current" getter) */
    current() {
      return this.store.current;
    },
    stat() {
      return this.current.stat;
    },
    /** selector value: name of the scheduler shown */
    selectedName: {
      get() {
        return this.current ? this.current.name : null;
      },
      set(name) {
        this.store.select(name);
      },
    },
    /** one button per scheduler; unreachable ones are marked */
    schedulerOptions() {
      return this.store.schedulers.map((s) => ({
        label: s.available ? s.name : `${s.name} (unreachable)`,
        value: s.name,
      }));
    },
    /** whether the database lists another number of Running executions than the schedulers run */
    runningMismatch() {
      const s = this.store.summary;
      return s !== null && s.dbRunning !== null && s.dbRunning !== s.running;
    },
  },
  methods: {
    poolData() {
      // the store skips a request while the previous one is still running
      this.pooling = setInterval(() => this.store.update(), POLL_INTERVAL);
    },
  },
  created() {
    this.poolData();
  },
  beforeUnmount() {
    clearInterval(this.pooling);
  },
};
</script>

<style scoped>
.stat-card {
  padding: 8px 12px;
  height: 100%;
}
.stat-label {
  font-size: 0.8rem;
  color: #616161;
}
.stat-value {
  font-size: 1.6rem;
  font-weight: 500;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}
.stat-sub {
  font-size: 0.75rem;
  color: #757575;
  font-weight: normal;
}
</style>
