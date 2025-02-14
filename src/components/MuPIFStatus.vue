<template>
  <div class="row q-gutter-sm custom-border">
<!--    <div>{{ data.name ? data.name : "Project" }}:</div>-->
    <div>
      <q-badge :color="data ? data.APIStatus : 'none'" rounded> API </q-badge>
    </div>
    <div>
      <q-badge :color="data ? data.NSStatus : 'none'" rounded>
        NameServer
      </q-badge>
    </div>
    <div>
      <q-badge :color="data ? data.DMSStatus : 'none'" rounded> DMS </q-badge>
    </div>
    <div>
      <q-badge :color="data ? data.SchedulerStatus : 'none'" rounded>
        Scheduler
      </q-badge>
    </div>
  </div>
</template>

<script>
import { defineComponent } from "vue";

export default defineComponent({
  name: "MuPIFStatus",
  data() {
    return {
      pooling: null,
      data: {
        name: null,
        APIStatus: null,
        NSStatus: null,
        DMStatus: null,
        SchedulerStatus: null,
      },
    };
  },
  methods: {
    poolData() {
      this.pooling = setInterval(async () => {
        //console.log("Getting ...");
        const response = await fetch(process.env.MUPIF_API_URL + "/status2/");
        if (response.status == 200) {
          const answer = await response.json();
          this.data.APIStatus = "green";
          if ((answer.nameserver = "OK")) this.data.NSStatus = "green";
          else this.data.NSStatus = "red";

          if (answer.dms == "OK") this.data.DMSStatus = "green";
          else this.data.DMSStatus = "red";
          if (answer.scheduler == "OK") this.data.SchedulerStatus = "green";
          else this.data.SchedulerStatus = "red";

          this.data.name = answer.name;
        } else {
          this.data.APIStatus = "red";
          this.data.NSStatus = null;
          this.data.DMSStatus = null;
          this.data.SchedulerStatus = null;
          this.data.name = null;
        }
      }, 10000);
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
