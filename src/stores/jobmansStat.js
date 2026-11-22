import { defineStore } from "pinia";

export const useJobmansStatStore = defineStore("jobmansStat", {
  state: () => ({
    jobmanData: [],
  }),

  getters: {
    jobmanState(i) {
      return this.jobmanData[i];
    },
  },

  actions: {
    async update() {
      const response = await fetch(
        process.env.MUPIF_API_URL + "/jobmans-status2/"
      );
      console.log("Updating jobmans-status2...");

      if (response.status == 200) {
        const answer = await response.json();
        if (answer) {
          console.log("ok");
          var ans = [];
          for (var j of answer) {
            // loop over individual jobman data; a model server which did not answer in time is
            // null in the answer of older APIs (mupif.monitor.jobmanInfo) and has no data
            if (!j || !j.ns || !j.numJobs) continue;
            var d = {
              name: j.ns.name,
              uri: j.ns.uri,
              signature: j.signature,
              status: ((j.status)?'OK':'ERR'),
              jobStat: {
                current: j.numJobs.curr,
                max: j.numJobs.max,
                total: j.numJobs.total,
                // a server without any job slot (max 0) has no load
                load: j.numJobs.max
                  ? Math.round((j.numJobs.curr / j.numJobs.max) * 100)
                  : 0,
              },
              jobs: j.jobs,
            };
            ans.push(d);
          }
          this.jobmanData = ans;
        }
      }
    },
  },
});
