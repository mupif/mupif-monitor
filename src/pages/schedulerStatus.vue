<template>
  <div>
    <div>
      Current Status: RunningTasks: {{ stat.running }}, ScheduledTasks:
      {{ stat.scheduled }}, CurrentLoad:
      <q-circular-progress
        show-value
        class="q-ma-ms"
        :value="stat.currentLoad"
        size="30px"
        color="teal"
        track-color="grey-3"
      >
        {{ stat.currentLoad }}%
      </q-circular-progress>
    </div>
  </div>
  <div>
    Overall Statistics: ProcessedTasks: {{ stat.processed }},
    FinishedTasks: {{ stat.finished }}, FailedTasks:
    {{ stat.failed }}
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
  computed: {
    // counters of the scheduler shown in detail (zeros if it did not answer)
    stat() {
      const c = this.store.current;
      return c && c.stat ? c.stat : { running: 0, scheduled: 0, processed: 0, finished: 0, failed: 0, currentLoad: 0 };
    },
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
      //console.log(this.stat.currentLoad);
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
