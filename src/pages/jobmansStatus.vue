<template>
  <div>JobMamanager Statuses</div>

  <q-table
    flat
    bordered
    title="JobManagers"
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
  <q-tree
    :nodes="treeData"
    dense
    node-key="label"
    v-model:expanded="expanded"
  />
</template>

<script>
import { computed } from "vue";
import { useJobmansStatStore } from "stores/jobmansStat";
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
    label: "Current jobs",
    field: (row) => row.jobStat.current,
  },
  { name: "totalJobs", label: "Total jobs", field: (row) => row.jobStat.total },
];

export default {
  setup() {
    const store = useJobmansStatStore();
    store.update();
    return {
      store,
    };
  },

  data() {
    return {
      pooling: null,
      columns,
    };
  },
  computed: {
    rows() {
      return this.store.jobmanData;
    },
    treeData() {
      var ans = [];
      for (var j of this.store.jobmanData) {
        var children = [];
        const samplejobs = [
          {
            key: "CVUT_DEMO01_007",
            uri: "172.30.24.1:lkajsdhfiasuai8fy773t6",
            running: "6h:03m:45s",
          },
        ];
        for (var job of samplejobs) {
          // j.jobs
          children.push({
            label: "" + job.key + ":" + job.uri + ",running:" + job.running,
          });
        }
        ans.push({ label: j.name, children: children });
      }
      return ans;
    },
  },
  methods: {
    poolData() {
      this.pooling = setInterval(async () => {
        console.log("Getting ...");
        this.store.update();
      }, 3000);
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
