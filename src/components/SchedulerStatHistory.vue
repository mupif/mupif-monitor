<template>
  <div class="custom-border">
    <div>Scheduler history</div>
    <apexchart
      width="700"
      height="150"
      type="bar"
      :series="series"
      :options="chartOptions"
    />
    <apexchart
      width="700"
      height="150"
      type="bar"
      :series="loadseries"
      :options="loadchartOptions"
    />
  </div>
</template>

<script>
import { defineComponent } from "vue";
import VueApexCharts from "vue3-apexcharts";
import { computed } from "vue";
import { useSchedulerStatStore } from "stores/schedulerStat";
import { storeToRefs } from "pinia";

export default defineComponent({
  name: "SchedulerStatHistory",
  components: {
    apexchart: VueApexCharts,
  },
  setup() {
    const store = useSchedulerStatStore();
    //console.log(store);
    return {
      store,
    };
  },
  data() {
    return {
      pooling: null,
      chartOptions: {
        chart: {
          type: "bar",
          height: 100,
        },
        xaxis: {
          categories: Array(48).fill(""),
        },
        dataLabels: {
          enabled: false,
          position: "bottom",
        },
        stroke: {
          show: true,
          colors: ["transparent"],
        },
        fill: {
          opacity: 1,
        },
        legend: {
          show: true,
          floating: false,
          width: 150,
          showForSingleSeries: true,
          position: "right",
        },
      },
      loadchartOptions: {
        chart: {
          type: "bar",
          height: 100,
        },
        dataLabels: {
          enabled: false,
          position: "bottom",
        },
        xaxis: {
          categories: Array(48).fill(""),
          /*(function (a, b) {
                        while (a--) b[a] = a;
                        return b;
                    })(48, []),*/
        },
        legend: {
          show: true,
          floating: false,
          width: 150,
          showForSingleSeries: true,
          position: "right",
        },
      },
    };
  },
  computed: {
    series() {
      return [
        {
          name: "pooledTasks",
          data: this.store.history.pooledTasks48.map((x) => x),
        },
        {
          name: "processedTasks",
          data: this.store.history.processedTasks48.map((x) => x), //Array(48).fill(0),
        },
      ];
    },
    loadseries() {
      return [
        {
          name: "load",
          data: this.store.history.load48.map((x) => x),
        },
      ];
    },
  },
  /*methods: {
    poolData() {
      this.pooling = setInterval(async () => {
        //console.log("Getting ...");
        const response = await fetch(
          process.env.MUPIF_API_URL + "/scheduler-status2/"
        );
        if (response.status == 200) {
          const answer = await response.json();

          if (answer[0].history.pooledTasks48) {
            var newdata = this.series[1].data.map(function (el, index) {
              return answer[0].history.pooledTasks48[index];
            });

            this.series[0] = {
              data: newdata,
            };
          }

          if (answer[0].history.processedTasks48) {
            var newdata = this.series[1].data.map(function (el, index) {
              return answer[0].history.processedTasks48[index];
            });

            this.series[1] = {
              data: newdata,
            };
          }

          if (answer[0].history.load48) {
            var newdata = this.series[1].data.map(function (el, index) {
              return answer[0].history.load48[index];
            });

            this.loadseries[0] = {
              data: newdata,
            };
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
  },*/
});
</script>

<style>
.custom-border {
  border: 1px solid;
}
</style>
