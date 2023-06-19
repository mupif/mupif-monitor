import { defineStore } from "pinia";

export const useSchedulerStatStore = defineStore("schedulerStat", {
  state: () => ({
    stat: {
      running: 0,
      scheduled: 0,
      processed: 0,
      finished: 0,
      failed: 0,
      currentLoad: 0,
    },
    history: {
      pooledTasks48: [],
      processedTasks48: [],
      finishedTasks48: [],
      failedTasks48: [],
      load48: [],
    },
    lastExecutions: [],
  }),

  getters: {
    getStat(state) {
      return state.stat;
    },
    getHistory(state) {
      return state.history;
    },
    getLastExecutions(state) {
      return state.lastExecutions;
    },
  },

  actions: {
    async update() {
      console.log("Updating scheduler-status2...");
      const response = await fetch(
        process.env.MUPIF_API_URL + "/scheduler-status2/"
      );
      if (response.status == 200) {
        const answer = await response.json();
        if (answer) {
          console.log("ok");
          if (answer[0].numTasks) {
            const v = answer[0].numTasks;
            this.stat.running = v.running;
            this.stat.scheduled = v.scheduled;
            this.stat.processed = v.processed;
            this.stat.finished = v.finished;
            this.stat.failed = v.failed;
            this.stat.currentLoad = v.currentLoad;
          }
          if (answer[0].history) {
            const v = answer[0].history;
            this.history.pooledTasks48 = v.pooledTasks48;
            this.history.processedTasks48 = v.processedTasks48;
            this.history.load48 = v.load48;
            this.history.finishedTasks48 = v.finishedTasks48;
            this.history.failedTasks48 = v.failedTasks48;
          }
          if (answer[0].lastExecutions) {
            this.lastExecutions = answer[0].lastExecutions;
          }
          return;
        }
      }
      console.log("failed, response status:", response.status);
    },
  },
});
