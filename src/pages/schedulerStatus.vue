<template>
  <div>
    <div>
      Current Status: RunningTasks: {{ store.stat.running }}, ScheduledTasks:
      {{ store.stat.scheduled }}, CurrentLoad:
      <q-circular-progress
        show-value
        class="q-ma-ms"
        :value="store.stat.currentLoad"
        size="30px"
        color="teal"
        track-color="grey-3"
      >
        {{ store.stat.currentLoad }}%
      </q-circular-progress>
    </div>
  </div>
  <div>
    Overall Statistics: ProcessedTasks: {{ store.stat.processed }},
    FinishedTasks: {{ store.stat.finished }}, FailedTasks:
    {{ store.stat.failed }}
  </div>

  <SchedulerStatHistory />
  <SchedulerLastExecutions />
</template>

<script>
import { computed } from "vue";
import { useSchedulerStatStore } from "stores/schedulerStat";
import { storeToRefs } from "pinia";

import SchedulerStatHistory from "../components/SchedulerStatHistory.vue";
import SchedulerLastExecutions from "../components/SchedulerLastExecutions.vue";

export default {
  components: {
    SchedulerStatHistory,
    SchedulerLastExecutions,
  },
  setup() {
    const store = useSchedulerStatStore();
    var activePoolRequests= 0;

    store.update();
    return {
      store,
      activePoolRequests,
    };
  },
  data() {
    return {
      pooling: null,
    };
  },
  methods: {
    poolData() {
      this.pooling = setInterval(async () => {
        if (this.activePoolRequests < 2) {
          this.activePoolRequests++;
          this.store.update();
          this.activePoolRequests--;
        }
      }, 10000);
      //console.log(this.store.stat.currentLoad);
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
