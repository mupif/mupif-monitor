<template>
  <div>
    <div>
      Current Status: RunningTasks: {{ store.stat.running }}, ScheduledTasks:
      {{ store.stat.scheduled }}
    </div>
  </div>
  <div>
    Overall Statistics: ProcessedTasks: {{ store.stat.processed }}, FinishedTasks:
    {{ store.stat.finished }}, FailedTasks: {{ store.stat.failed }}
  </div>

  <SchedulerStatHistory />
  <SchedulerLastExecutions />
</template>

<script>
import { computed } from 'vue';
import { useSchedulerStatStore } from 'stores/schedulerStat';
import { storeToRefs } from 'pinia';


import SchedulerStatHistory from "../components/SchedulerStatHistory.vue";
import SchedulerLastExecutions from "../components/SchedulerLastExecutions.vue";

export default {
  components: {
    SchedulerStatHistory,
    SchedulerLastExecutions,
  },
  setup () {
        const store = useSchedulerStatStore();
        store.update();
        return {
               store,
        }      
  },
  data() {
    return {
           pooling:null,
    };     
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
