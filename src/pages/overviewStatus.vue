<template>
  <!--
    Overview tab (default): state of the whole platform at a glance.

    A headline says whether everything works or lists the problems found; below, one card per part
    of the platform with its key numbers and a link to the tab with the details. The data come from
    the same stores as the detail tabs (Pinia stores are shared), refreshed every 10 s:

      services   platformStat   status2: API, nameserver, database (DMS), scheduler
      scheduler  schedulerStat  scheduler-status2: totals over all available schedulers
      executions executionStat  execution-status2: executions by status (newer APIs)
      models     jobmansStat    jobmans-status2: model servers, their jobs and slots
      VPN        platformStat   vpn-status2: peers and traffic (summary only)
      nameserver nsStat         ns-status2: registered services by type
  -->
  <div class="q-gutter-y-md">
    <!-- headline: everything fine, or the list of problems -->
    <q-banner
      dense
      :class="
        problems.length
          ? 'bg-amber-1 text-brown-10'
          : 'bg-green-1 text-green-10'
      "
    >
      <template v-slot:avatar>
        <q-icon
          :name="problems.length ? 'warning' : 'check_circle'"
          :color="problems.length ? 'amber-9' : 'green-8'"
          size="md"
        />
      </template>
      <div class="text-subtitle1">
        {{ platformName ? platformName + ": " : "" }}
        {{
          problems.length
            ? `${problems.length} problem${problems.length > 1 ? "s" : ""}`
            : "all services running"
        }}
      </div>
      <ul v-if="problems.length" class="q-my-none q-pl-md">
        <li v-for="p in problems" :key="p">{{ p }}</li>
      </ul>
    </q-banner>

    <div class="row q-col-gutter-md">
      <!-- services -->
      <div class="col-12 col-md-6 col-lg-4">
        <q-card flat bordered class="full-height">
          <q-card-section class="card-head">
            <div class="text-subtitle1">Services</div>
          </q-card-section>
          <q-card-section class="q-pt-none">
            <div
              v-for="s in services"
              :key="s.label"
              class="row items-center q-py-xs"
            >
              <q-icon
                :name="s.ok === null ? 'help' : s.ok ? 'check_circle' : 'error'"
                :color="s.ok === null ? 'grey-6' : s.ok ? 'green-8' : 'red-8'"
                class="q-mr-sm"
              />
              <span class="col">{{ s.label }}</span>
              <span class="text-grey-8">{{
                s.ok === null ? "unknown" : s.ok ? "running" : "failed"
              }}</span>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <!-- scheduler -->
      <div class="col-12 col-md-6 col-lg-4">
        <q-card flat bordered class="full-height">
          <q-card-section class="card-head row items-center">
            <div class="text-subtitle1 col">Scheduler</div>
            <q-btn
              flat
              dense
              no-caps
              color="primary"
              label="Details"
              to="/scheduler"
            />
          </q-card-section>
          <q-card-section class="q-pt-none">
            <div v-if="!sched" class="text-grey-8">
              {{
                schedStore.totalCount
                  ? "No scheduler answers."
                  : "No scheduler is registered."
              }}
            </div>
            <template v-else>
              <div class="row q-col-gutter-sm">
                <div class="col-4">
                  <div class="stat-label">Running</div>
                  <div class="stat-value">
                    {{ sched.running
                    }}<span v-if="sched.capacity" class="stat-sub">
                      / {{ sched.capacity }}</span
                    >
                  </div>
                </div>
                <div class="col-4">
                  <div class="stat-label">Waiting</div>
                  <div class="stat-value">
                    {{ sched.waiting !== null ? sched.waiting : "?" }}
                  </div>
                </div>
                <div class="col-4">
                  <div class="stat-label">Load</div>
                  <div class="stat-value">{{ sched.load }}%</div>
                </div>
              </div>
              <div class="stat-sub q-mt-xs">
                <span v-if="schedStore.totalCount > 1">
                  {{ schedStore.availableCount }} of
                  {{ schedStore.totalCount }} schedulers answer &middot;
                </span>
                <span v-if="sched.draining" class="text-orange-10">
                  <q-icon name="pause_circle" /> draining &middot;
                </span>
                {{ sched.processed }} processed ({{ sched.failed }} failed)
              </div>
              <!-- last 2 hours, peak per minute; series named by direct labels below -->
              <div v-if="sparkSeries" class="q-mt-sm">
                <apexchart
                  type="area"
                  height="70"
                  :series="sparkSeries"
                  :options="sparkOptions"
                />
                <div class="stat-sub">
                  <span
                    class="legend-swatch"
                    :style="{ background: colors.running }"
                  />
                  Running
                  <span
                    class="legend-swatch q-ml-sm"
                    :style="{ background: colors.waiting }"
                  />
                  Waiting &middot; last 2 hours
                </div>
              </div>
            </template>
          </q-card-section>
        </q-card>
      </div>

      <!-- executions -->
      <div class="col-12 col-md-6 col-lg-4">
        <q-card flat bordered class="full-height">
          <q-card-section class="card-head">
            <div class="text-subtitle1">Workflow executions</div>
          </q-card-section>
          <q-card-section class="q-pt-none">
            <div v-if="!execStore.available" class="text-grey-8">
              Not available from this API version.
            </div>
            <template v-else>
              <div class="stat-label">In total</div>
              <div class="stat-value">{{ exec.totalExecutions }}</div>
              <div
                v-for="row in executionRows"
                :key="row.label"
                class="row q-py-xs"
              >
                <span class="col">{{ row.label }}</span>
                <span class="text-weight-medium tabular">{{ row.value }}</span>
              </div>
            </template>
          </q-card-section>
        </q-card>
      </div>

      <!-- model servers -->
      <div class="col-12 col-md-6 col-lg-4">
        <q-card flat bordered class="full-height">
          <q-card-section class="card-head row items-center">
            <div class="text-subtitle1 col">Model servers</div>
            <q-btn
              flat
              dense
              no-caps
              color="primary"
              label="Details"
              to="/jobmans"
            />
          </q-card-section>
          <q-card-section class="q-pt-none">
            <div v-if="!models.count" class="text-grey-8">
              No model server is registered.
            </div>
            <template v-else>
              <div class="row q-col-gutter-sm">
                <div class="col-4">
                  <div class="stat-label">Servers</div>
                  <div class="stat-value">{{ models.count }}</div>
                </div>
                <div class="col-4">
                  <div class="stat-label">Jobs running</div>
                  <div class="stat-value">
                    {{ models.running
                    }}<span class="stat-sub"> / {{ models.slots }}</span>
                  </div>
                </div>
                <div class="col-4">
                  <div class="stat-label">Load</div>
                  <div class="stat-value">{{ models.load }}%</div>
                </div>
              </div>
              <div class="stat-sub q-mt-xs">
                <q-icon name="check_circle" color="green-8" />
                {{ models.ok }} OK
                <span v-if="models.err">
                  &middot; <q-icon name="error" color="red-8" />
                  {{ models.err }} not working</span
                >
                &middot; {{ models.processed }} jobs processed
              </div>
            </template>
          </q-card-section>
        </q-card>
      </div>

      <!-- VPN -->
      <div class="col-12 col-md-6 col-lg-4">
        <q-card flat bordered class="full-height">
          <q-card-section class="card-head row items-center">
            <div class="text-subtitle1 col">VPN</div>
            <q-btn
              flat
              dense
              no-caps
              color="primary"
              label="Details"
              to="/vpn"
            />
          </q-card-section>
          <q-card-section class="q-pt-none">
            <div v-if="!vpn" class="text-grey-8">
              VPN state is not available.
            </div>
            <template v-else>
              <div class="row q-col-gutter-sm">
                <div class="col-6">
                  <div class="stat-label">Peers connected</div>
                  <div class="stat-value">
                    {{ vpn.activePeers
                    }}<span class="stat-sub"> / {{ vpn.peers }}</span>
                  </div>
                </div>
                <div class="col-6">
                  <div class="stat-label">Traffic sent / received</div>
                  <div class="stat-value-sm">
                    {{ bytes(vpn.tx) }} / {{ bytes(vpn.rx) }}
                  </div>
                </div>
              </div>
              <div class="stat-sub q-mt-xs">
                {{ vpn.iface }} {{ vpn.ip }} &middot; connected: handshake in
                the last 3 minutes
              </div>
            </template>
          </q-card-section>
        </q-card>
      </div>

      <!-- nameserver -->
      <div class="col-12 col-md-6 col-lg-4">
        <q-card flat bordered class="full-height">
          <q-card-section class="card-head row items-center">
            <div class="text-subtitle1 col">Nameserver</div>
            <q-btn
              flat
              dense
              no-caps
              color="primary"
              label="Details"
              to="/ns"
            />
          </q-card-section>
          <q-card-section class="q-pt-none">
            <div class="stat-label">Registered services</div>
            <div class="stat-value">{{ nsStore.rows.length }}</div>
            <div v-for="t in nsTypes" :key="t.label" class="row q-py-xs">
              <span class="col">{{ t.label }}</span>
              <span class="text-weight-medium tabular">{{ t.value }}</span>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script>
import VueApexCharts from "vue3-apexcharts";
import { useSchedulerStatStore } from "stores/schedulerStat";
import { useExecutionStatStore } from "stores/executionStat";
import { useJobmansStatStore } from "stores/jobmansStat";
import { useNSStatStore } from "stores/nsStat";
import { usePlatformStatStore } from "stores/platformStat";

/** Refresh interval (ms). */
const POLL_INTERVAL = 10000;

/** Series colors, the same as in the scheduler charts (SchedulerStatHistory.vue). */
const COLORS = { running: "#2a78d6", waiting: "#eb6834" };

/** Labels of the service types in the nameserver (see the nsStat store). */
const NS_TYPES = [
  ["modelServer", "Model servers"],
  ["modelInstance", "Model instances"],
  ["scheduler", "Schedulers"],
  ["nameserver", "Nameservers"],
];

export default {
  components: { apexchart: VueApexCharts },
  setup() {
    const stores = {
      schedStore: useSchedulerStatStore(),
      execStore: useExecutionStatStore(),
      jobmansStore: useJobmansStatStore(),
      nsStore: useNSStatStore(),
      platformStore: usePlatformStatStore(),
    };
    return { ...stores, colors: COLORS };
  },
  data() {
    return { pooling: null };
  },
  computed: {
    platformName() {
      const s = this.platformStore.services;
      return s ? s.name : null;
    },
    /** state of the services: ok true/false, null = unknown (API did not answer) */
    services() {
      const s = this.platformStore.services;
      const st = (v) => (s ? v === "OK" : null);
      return [
        // the API works if it answered; unknown until the first update has finished
        { label: "API", ok: this.platformStore.loaded ? s !== null : null },
        { label: "Nameserver", ok: st(s && s.nameserver) },
        { label: "Database (DMS)", ok: st(s && s.dms) },
        { label: "Scheduler", ok: st(s && s.scheduler) },
      ];
    },
    /** scheduler totals over all available schedulers (null if none answers) */
    sched() {
      return this.schedStore.summary;
    },
    sparkSeries() {
      const h = this.sched && this.sched.history;
      if (!h || !h.running120m.length) return null; // older scheduler: no history
      const t = (values) =>
        values.map((v, i) => [
          (h.periodStart120m - (values.length - 1 - i) * h.periodLength120m) *
            1000,
          v,
        ]);
      return [
        { name: "Running", data: t(h.running120m) },
        { name: "Waiting", data: t(h.waiting120m) },
      ];
    },
    sparkOptions() {
      return {
        chart: { sparkline: { enabled: true }, animations: { enabled: false } },
        colors: [COLORS.running, COLORS.waiting],
        stroke: { curve: "stepline", width: 2 },
        fill: { type: "solid", opacity: 0.12 },
        xaxis: { type: "datetime" },
        yaxis: { min: 0 },
        tooltip: {
          shared: true,
          x: { format: "HH:mm" },
          y: { formatter: (v) => Math.round(v) },
        },
      };
    },
    exec() {
      return this.execStore.counts;
    },
    executionRows() {
      const c = this.exec;
      return [
        { label: "Waiting (queued or taken)", value: this.execStore.waiting },
        { label: "Running", value: c.runningExecutions },
        { label: "Finished", value: c.finishedExecutions },
        { label: "Failed", value: c.failedExecutions },
        { label: "Created, not submitted", value: c.createdExecutions },
      ];
    },
    /** model servers: counts, jobs and slots (load = running jobs / all slots) */
    models() {
      const d = this.jobmansStore.jobmanData;
      const running = d.reduce((a, j) => a + j.jobStat.current, 0);
      const slots = d.reduce((a, j) => a + j.jobStat.max, 0);
      return {
        count: d.length,
        ok: d.filter((j) => j.status === "OK").length,
        err: d.filter((j) => j.status !== "OK").length,
        running,
        slots,
        load: slots ? Math.round((100 * running) / slots) : 0,
        processed: d.reduce((a, j) => a + j.jobStat.total, 0),
      };
    },
    vpn() {
      return this.platformStore.vpn;
    },
    nsTypes() {
      const rows = this.nsStore.rows;
      return NS_TYPES.map(([type, label]) => ({
        label,
        value: rows.filter((r) => r.type === type).length,
      }));
    },
    /** problems found, as sentences for the headline (empty: everything works) */
    problems() {
      const p = [];
      const ss = this.schedStore;
      const down = ss.schedulers.filter((s) => !s.available);
      for (const s of this.services) {
        // a scheduler problem is described below in more detail (which scheduler)
        if (s.label === "Scheduler" && (down.length || ss.totalCount === 0))
          continue;
        if (s.ok === false) p.push(`${s.label} is not working.`);
      }
      if (ss.lastUpdate && ss.totalCount === 0)
        p.push("No scheduler is registered.");
      if (down.length) {
        p.push(
          `Scheduler${down.length > 1 ? "s" : ""} not answering: ${down
            .map((s) => s.name)
            .join(", ")}.`
        );
      }
      if (this.sched && this.sched.draining) {
        p.push("A scheduler is in drain mode: no new executions are started.");
      }
      const errs = this.jobmansStore.jobmanData.filter(
        (j) => j.status !== "OK"
      );
      if (errs.length) {
        p.push(
          `Model server${errs.length > 1 ? "s" : ""} not working: ${errs
            .map((j) => j.name)
            .join(", ")}.`
        );
      }
      return p;
    },
  },
  methods: {
    /** Human-readable number of bytes. */
    bytes(n) {
      if (n === null || n === undefined) return "?";
      const units = ["B", "kB", "MB", "GB", "TB"];
      let i = 0;
      while (n >= 1000 && i < units.length - 1) {
        n /= 1000;
        i++;
      }
      return `${n.toFixed(i ? 1 : 0)} ${units[i]}`;
    },
    /** Refresh all stores (each skips the request if its previous one is still running). */
    updateAll() {
      this.schedStore.update();
      this.execStore.update();
      this.jobmansStore.update();
      this.nsStore.update();
      this.platformStore.update();
    },
  },
  created() {
    this.updateAll();
    this.pooling = setInterval(this.updateAll, POLL_INTERVAL);
  },
  beforeUnmount() {
    clearInterval(this.pooling);
  },
};
</script>

<style scoped>
.card-head {
  padding-bottom: 4px;
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
.stat-value-sm {
  font-size: 1.1rem;
  font-weight: 500;
  line-height: 1.6;
  font-variant-numeric: tabular-nums;
}
.stat-sub {
  font-size: 0.75rem;
  color: #757575;
  font-weight: normal;
}
.tabular {
  font-variant-numeric: tabular-nums;
}
.legend-swatch {
  display: inline-block;
  width: 10px;
  height: 3px;
  border-radius: 2px;
  vertical-align: middle;
}
</style>
