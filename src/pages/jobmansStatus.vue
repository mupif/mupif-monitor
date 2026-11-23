<template>
  <div>Model servers overview</div>

  <q-table
    flat
    bordered
    title="Model servers"
    :rows="rows"
    :columns="columns"
    row-key="name"
  >
    <template v-slot:body="props">
      <q-tr :props="props">
        <q-td auto-width>
          <q-btn
            size="sm"
            color="accent"
            round
            dense
            @click="props.expand = !props.expand"
            :icon="props.expand ? 'remove' : 'add'"
          />
        </q-td>
        <q-td v-for="col in props.cols" :key="col.name" :props="props">
          <q-badge
            v-if="col.name == 'name'"
            :color="col.value ? 'green' : 'red'"
            :label="col.value"
          />
          <q-circular-progress
            show-value
            font-size="12px"
            class="q-ma-ms"
            :value="col.value"
            size="30px"
            color="teal"
            track-color="grey-3"
            v-else-if="col.name == 'load'"
          >
            {{ col.value }}%
          </q-circular-progress>

          <div v-else>{{ col.value }}</div>
        </q-td>
      </q-tr>
      <q-tr v-show="props.expand" :props="props">
        <q-td colspan="100%">
          <div class="text-left">
            This is expand slot for row above. Load is
            {{ props.row.jobStat.load }}.
          </div>
        </q-td>
      </q-tr>
    </template>
  </q-table>
  <br />

  JobMans Tree
  <div>
    <q-splitter v-model="splitterModel" style="height: 400px">
      <template v-slot:before>
        <q-tree
          :nodes="treeData"
          dense
          node-key="label"
          v-model:selected="selected"
        />
        <!--@update:selected="selectnode()"-->
      </template>
      <template v-slot:after>
        <div v-if="selected">
          job: {{ getlog.key }}<br />
          uri: {{ getlog.uri }}<br />
          user: {{ getlog.user }}<br />
          runtime: {{ getlog.running }}[s]<br />
          log_tail:
          <pre>
    {{ getlog.tail }}
    </pre
          >
        </div>
      </template>
    </q-splitter>
  </div>
</template>

<script>
import { ref } from "vue";
import { computed } from "vue";
import { useJobmansStatStore } from "stores/jobmansStat";
import { useSchedulerStatStore } from "stores/schedulerStat";
import { storeToRefs } from "pinia";

const columns = [
  {},
  {
    name: "name",
    required: true,
    label: "Name",
    align: "left",
    field: (row) => row.name,
    format: (val) => `${val}`,
    sortable: true,
  },
  { name: "uri", align: "left", label: "URI", field: "uri", sortable: false },
  {
    name: "status",
    align: "left",
    label: "Status",
    field: "status",
    sortable: false,
  },

  {
    name: "load",
    label: "load",
    align: "left",
    field: (row) => row.jobStat.load,
    sortable: true,
  },
  {
    name: "currJobs",
    label: "Running jobs",
    field: (row) => row.jobStat.current,
  },
  {
    // the model server it is an instance of: instances register as <base>~<instance>
    name: "base",
    label: "Instance of",
    align: "left",
    field: (row) => row.name.split("~")[0],
    sortable: true,
  },
  {
    // executions of the scheduler(s) with a model running on this server; "–" if the
    // scheduler does not report it
    name: "schedulerJobs",
    label: "Scheduler executions",
    field: (row) => row.schedulerJobs,
    format: (val) => (val === null ? "–" : `${val}`),
  },
  {
    name: "totalJobs",
    label: "Processed jobs",
    field: (row) => row.jobStat.total,

},
];

export default {
  setup() {
    const store = useJobmansStatStore();
    // executions of the schedulers per model server (the load the schedulers put on each)
    const schedStore = useSchedulerStatStore();
    var activePoolRequests= 0;

    store.update();
    schedStore.update();
    return {
      splitterModel: ref(50), // start at 50%
      store,
      schedStore,
      activePoolRequests,
    };
  },

  data() {
    return {
      pooling: null,
      columns,
      selected: null,
    };
  },
  computed: {
    rows() {
      const perServer = this.schedStore.modelServerJobs;
      return this.store.jobmanData.map((j) => ({
        ...j,
        schedulerJobs: perServer === null ? null : perServer[j.name] || 0,
      }));
    },
    getlog() {
      for (var j of this.store.jobmanData) {
        for (var job of j.jobs) {
          if (job.key == this.selected) {
            return job;
          }
        }
      }
      return {};
    },
    treeData() {
      var ans = [];
      for (var j of this.store.jobmanData) {
        var children = [];
        for (var job of j.jobs) {
          // j.jobs
          children.push({
            label: "" + job.key, //+ "(" + job.uri + ") by " + job.user + ", running:" + job.running.toFixed()+"[s]",
          });
        }
        ans.push({ label: j.name, selectable: false, children: children });
      }
      return ans;
    },
  },
  methods: {
    poolData() {
      this.pooling = setInterval(async () => {
        if (this.activePoolRequests < 2) {
          this.activePoolRequests++;
          console.log("JobManStat pooling data, active requests = ", this.activePoolRequests);
          var runID = this.activePoolRequests;
          await Promise.all([this.store.update(), this.schedStore.update()]);
          /*
          const date = Date.now();
          let currentDate = null;
          do {
             currentDate = Date.now();
          } while (currentDate - date < 10000);
          */
          console.log("Finished runID ", runID);
          this.activePoolRequests--;
        } else {
          console.log("JobManStat skipping pooling data attempt, active requests = ", this.activePoolRequests);
        }
      }, 3000);
    },
  },
  created() {
    this.poolData();
  },
  beforeUnmount() {
    clearInterval(this.pooling);
  },
  selectnode(v) {
    if (v !== null) {
      this.selected = v;
    }
    return;
  },
};
</script>
