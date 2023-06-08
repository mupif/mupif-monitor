<template>
  <div class="custom-border">
    <q-table
      flat
      bordered
      dense
      title="Last Executions"
      :rows="executions"
      :columns="executionColumns"
      row-key="name"
    />
  </div>
</template>

<script>
import { defineComponent } from "vue";

export default defineComponent({
  name: "SchedulerLastExecutions",

  data() {
    return {
      executionColumns: [
        {
          name: "weid",
          required: true,
          label: "WEid",
          align: "left",
          field: (row) => row.weid,
          format: (val) => `${val}`,
          sortable: true,
        },
        {
          name: "wid",
          align: "left",
          label: "Wid",
          field: (row) => row.wid,
          sortable: true,
        },
        {
          name: "status",
          label: "Status",
          field: (row) => row.status,
          align: "left",
        },
        {
          name: "started",
          label: "Started",
          field: (row) => row.started,
          align: "left",
        },
        {
          name: "finished",
          label: "Finished",
          field: (row) => row.finished,
          align: "left",
        },
      ],
      executions: [],
    };
  },
  methods: {
    poolData() {
      this.pooling = setInterval(async () => {
        //console.log("Getting ...");
        const response = await fetch(
          process.env.MUPIF_API_URL + "/scheduler-status2/"
        );
        if (response.status == 200) {
          const answer = await response.json();
          if (answer[0].lastExecutions) {
            var newRows = [];
            var i;
            for (i in answer[0].lastExecutions) {
              const val = answer[0].lastExecutions[i];
              newRows.push({
                weid: val.weid,
                wid: val.wid,
                status: val.status,
                started: val.started,
                finished: val.finished,
              });
            }
            this.executions = newRows;
          }
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
});
</script>

<style>
.custom-border {
  border: 1px solid;
}
</style>
