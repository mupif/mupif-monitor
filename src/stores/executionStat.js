import { defineStore } from "pinia";

/*
 * Numbers of workflow executions by status (GET <api>/execution-status2/), for the overview.
 *
 * Answer (ExecutionStatistics_Model in mupifDB/models.py): aggregate counts only,
 *   {totalExecutions, createdExecutions, pendingExecutions, scheduledExecutions,
 *    runningExecutions, finishedExecutions, failedExecutions}
 *
 * The endpoint exists in mupifDB versions with the scheduler load statistics; with an older API
 * `available` stays false and the overview says the counts are not available.
 */
export const useExecutionStatStore = defineStore("executionStat", {
  state: () => ({
    /** counts by status (null until the first successful update) */
    counts: null,
    /** whether the API provides the counts (false: not yet known, older API or failure) */
    available: false,
    /** why the last update failed (null if it succeeded) */
    error: null,
    updating: false,
  }),

  getters: {
    /** Executions waiting to run: in the queue (Pending) + taken by a scheduler (Scheduled). */
    waiting(state) {
      return state.counts
        ? state.counts.pendingExecutions + state.counts.scheduledExecutions
        : null;
    },
  },

  actions: {
    /** Fetch the counts; never throws. */
    async update() {
      if (this.updating) return;
      this.updating = true;
      try {
        const response = await fetch(
          process.env.MUPIF_API_URL + "/execution-status2/"
        );
        if (response.status != 200) {
          this.available = false;
          this.error = `execution-status2: HTTP ${response.status}`;
          return;
        }
        this.counts = await response.json();
        this.available = true;
        this.error = null;
      } catch (e) {
        this.available = false;
        this.error = `execution-status2: ${e}`;
      } finally {
        this.updating = false;
      }
    },
  },
});
