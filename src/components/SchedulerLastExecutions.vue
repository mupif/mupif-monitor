<template>
  <div class="custom-border">
    Last Executions
    <q-table
      flat
      bordered
      dense
      title=""
      :rows="executions"
      :columns="executionColumns"
      row-key="name"
    />
  </div>
</template>

<script>
import { defineComponent } from "vue";
import { computed } from "vue";
import { useSchedulerStatStore } from "stores/schedulerStat";
import { storeToRefs } from "pinia";

export default defineComponent({
  name: "SchedulerLastExecutions",
  setup() {
    const store = useSchedulerStatStore();
    //console.log(store);
    return {
      store,
    };
  },

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
        {
          // model -> model server (registered name) chosen by the workflow; shown once the
          // execution has stored it, "–" for schedulers which do not report it
          name: "modelServers",
          label: "Model servers",
          field: (row) => row.modelServers,
          format: (val) =>
            val === null || val === undefined
              ? "–"
              : Object.keys(val).length
              ? Object.entries(val)
                  .map(([model, server]) => `${model} → ${server}`)
                  .join(", ")
              : "not known yet",
          align: "left",
        },
      ],
      //      executions: [],
    };
  },
  computed: {
    // last executions of the scheduler shown in detail (see the store's "current" getter)
    executions() {
      return this.store.current ? this.store.current.lastExecutions : [];
    },
  },
});
</script>

<style>
.custom-border {
  border: 1px solid;
}
</style>
