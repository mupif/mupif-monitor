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

function getColorByStatus(status) {
  if (status === "OK") {
    return "green";
  } else if (status === "Failed") {
    return "red";
  } else {
    return null;
  }
}

export default defineComponent({
  name: "MuPIFStatus",
  data() {
    return {
      pooling: null,
      data: {
        name: null,
        APIStatus: null,
        NSStatus: null,
        DMSStatus: null,
        SchedulerStatus: null,
      },
    };
  },
  methods: {
    async fetchData() {
      try {
        const response = await fetch(process.env.MUPIF_API_URL + "/status2/");
        if (response.status === 200) {
          const answer = await response.json();
          
          this.data.APIStatus = getColorByStatus("OK");
          this.data.NSStatus = getColorByStatus(answer.nameserver);
          this.data.DMSStatus = getColorByStatus(answer.dms);
          this.data.SchedulerStatus = getColorByStatus(answer.scheduler);
          this.data.name = answer.name;
        } else {
          this.setErrorState();
        }
      } catch (error) {
        this.setErrorState();
      }
    },
    setErrorState() {
      this.data.APIStatus = getColorByStatus("Failed");
      this.data.NSStatus = null;
      this.data.DMSStatus = null;
      this.data.SchedulerStatus = null;
      this.data.name = null;
    }
  },
  created() {
    this.fetchData();
    this.pooling = setInterval(this.fetchData, 10000);
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
