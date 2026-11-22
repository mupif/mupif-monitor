<template>
  <!--
    Load of one scheduler over time: how many executions were running and how many were waiting
    to run (database queue + taken by the scheduler, not started yet).

    Two charts of the same two series: the last 2 hours by minutes (detail of the current load) and
    the last 48 hours by hours. Every point is the PEAK level in its period (minute / hour), drawn
    as steps, so a short burst is not lost between samples. The dashed line is the capacity of the
    scheduler (executions it can run at once): running cannot exceed it, waiting above it means
    the scheduler is the bottleneck.

    Schedulers of older versions do not report the running/waiting history; for them only the load
    in percent (48 h) is shown.
  -->
  <div class="custom-border q-pa-sm">
    <div class="text-subtitle1">Scheduler load</div>
    <div v-if="!scheduler || !scheduler.history" class="text-grey-7">
      No data: the scheduler did not answer.
    </div>
    <template v-else-if="hasGauges">
      <div class="text-caption text-grey-8">Last 2 hours (peak per minute)</div>
      <apexchart
        width="100%"
        height="220"
        type="area"
        :series="series120m"
        :options="options120m"
      />
      <div class="text-caption text-grey-8">Last 48 hours (peak per hour)</div>
      <apexchart
        width="100%"
        height="220"
        type="area"
        :series="series48"
        :options="options48"
      />
    </template>
    <template v-else>
      <div class="text-caption text-grey-8">
        Load in % of the capacity, last 48 hours (this scheduler version does
        not report running and waiting executions)
      </div>
      <apexchart
        width="100%"
        height="220"
        type="bar"
        :series="seriesLoad48"
        :options="optionsLoad48"
      />
    </template>
  </div>
</template>

<script>
import { defineComponent } from "vue";
import VueApexCharts from "vue3-apexcharts";

/*
 * Colors of the two series (categorical slots 1 and 2 of a palette validated for color-vision
 * deficiencies: protan ΔE 24.7, both >= 3:1 on white). Identity is not by color alone: the legend
 * names both series and the shared tooltip lists them by name.
 */
const COLOR_RUNNING = "#2a78d6";
const COLOR_WAITING = "#eb6834";
/** Recessive gray of the capacity line. */
const COLOR_MUTED = "#8a8a86";

/**
 * Points [time in ms, value] of a history list whose last element is the period starting at
 * `periodStart` (s) and whose periods are `periodLength` (s) long (ApexCharts datetime axis).
 */
function timeSeries(values, periodStart, periodLength) {
  const n = values.length;
  return values.map((v, i) => [
    (periodStart - (n - 1 - i) * periodLength) * 1000,
    v,
  ]);
}

/**
 * Options of a running/waiting chart.
 *
 * @param capacity  executions the scheduler can run at once (dashed line), or null if unknown
 * @param axisFormat  format of the time labels (local time)
 * @param tooltipFormat  format of the period in the tooltip
 */
function gaugeOptions(capacity, axisFormat, tooltipFormat) {
  return {
    chart: {
      animations: { enabled: false }, // redrawn every 10 s, animation would only distract
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    colors: [COLOR_RUNNING, COLOR_WAITING],
    stroke: { curve: "stepline", width: 2 },
    fill: { type: "solid", opacity: 0.12 },
    dataLabels: { enabled: false },
    markers: { size: 0, hover: { size: 5 } },
    xaxis: {
      type: "datetime",
      labels: { datetimeUTC: false, format: axisFormat },
      tooltip: { enabled: false },
    },
    yaxis: {
      min: 0,
      // at least up to the capacity, so that the capacity line is always in the chart
      max: (max) => Math.max(max, capacity || 0, 1),
      forceNiceScale: true,
      labels: { formatter: (val) => Math.round(val) },
      title: { text: "executions" },
    },
    grid: { borderColor: "#e6e6e3" },
    tooltip: { shared: true, x: { format: tooltipFormat } },
    legend: { show: true, position: "top", horizontalAlign: "left" },
    annotations: capacity
      ? {
          yaxis: [
            {
              y: capacity,
              borderColor: COLOR_MUTED,
              strokeDashArray: 4,
              label: {
                text: `capacity ${capacity}`,
                borderColor: "transparent",
                style: { color: "#555", background: "transparent" },
              },
            },
          ],
        }
      : {},
  };
}

export default defineComponent({
  name: "SchedulerStatHistory",
  components: {
    apexchart: VueApexCharts,
  },
  props: {
    /** the scheduler shown (normalised entry of the schedulerStat store), or null */
    scheduler: { type: Object, default: null },
  },
  computed: {
    hist() {
      return this.scheduler.history;
    },
    /** whether the scheduler reports the running/waiting history (newer mupifDB versions) */
    hasGauges() {
      return this.hist.running48.length > 0;
    },
    capacity() {
      return this.scheduler.stat ? this.scheduler.stat.capacity : null;
    },
    series120m() {
      const h = this.hist;
      return [
        {
          name: "Running",
          data: timeSeries(
            h.running120m,
            h.periodStart120m,
            h.periodLength120m
          ),
        },
        {
          name: "Waiting",
          data: timeSeries(
            h.waiting120m,
            h.periodStart120m,
            h.periodLength120m
          ),
        },
      ];
    },
    series48() {
      const h = this.hist;
      return [
        {
          name: "Running",
          data: timeSeries(h.running48, h.periodStart48, h.periodLength48),
        },
        {
          name: "Waiting",
          data: timeSeries(h.waiting48, h.periodStart48, h.periodLength48),
        },
      ];
    },
    options120m() {
      return gaugeOptions(this.capacity, "HH:mm", "HH:mm");
    },
    options48() {
      return gaugeOptions(this.capacity, "dd MMM HH:mm", "dd MMM HH:00");
    },
    // fallback for older schedulers: load in % by hours
    seriesLoad48() {
      const h = this.hist;
      return [
        {
          name: "Load %",
          data: timeSeries(h.load48, h.periodStart48, h.periodLength48),
        },
      ];
    },
    optionsLoad48() {
      return {
        chart: {
          animations: { enabled: false },
          toolbar: { show: false },
          zoom: { enabled: false },
        },
        colors: [COLOR_RUNNING],
        plotOptions: { bar: { borderRadius: 2, columnWidth: "70%" } },
        dataLabels: { enabled: false },
        xaxis: {
          type: "datetime",
          labels: { datetimeUTC: false, format: "dd MMM HH:mm" },
        },
        yaxis: {
          min: 0,
          max: 100,
          labels: { formatter: (val) => `${Math.round(val)} %` },
        },
        tooltip: { x: { format: "dd MMM HH:00" } },
      };
    },
  },
});
</script>

<style>
.custom-border {
  border: 1px solid;
}
</style>
