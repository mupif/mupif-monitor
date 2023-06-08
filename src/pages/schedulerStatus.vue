<template>
  <div>
    <div>
      Current Status: RunningTasks: {{ runningTasks }}, ScheduledTasks:
      {{ scheduledTasks }}
    </div>
  </div>
  <div>
    Overall Statistics: ProcessedTasks: {{ processedTasks }}, FinishedTasks:
    {{ finishedTasks }}, FailedTasks: {{ failedTasks }}
  </div>

  <SchedulerStatHistory />
  <SchedulerLastExecutions />
</template>

<script>
import SchedulerStatHistory from "../components/SchedulerStatHistory.vue";
import SchedulerLastExecutions from "../components/SchedulerLastExecutions.vue";

export default {
  components: {
    SchedulerStatHistory,
    SchedulerLastExecutions,
  },
  data() {
    return {
      runningTasks: 0,
      scheduledTasks: 0,
      processedTasks: 0,
      finishedTasks: 0,
      failedTasks: 0,
    };
  },
};
</script>
