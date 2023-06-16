<template>
  <div>NameServer: {{ nsIP }}:{{ nsPort }}</div>

  <q-table
    flat
    bordered
    dense
    title="Registered services/components"
    :rows="jobmanrows"
    :columns="jobmancolumns"
    row-key="name"
  />
</template>

<script>
const jobmancolumns = [
  {
    name: "name",
    required: true,
    label: "Name",
    align: "left",
    field: (row) => row.name,
    format: (val) => `${val}`,
    sortable: true,
  },
  {
    name: "ID",
    align: "left",
    label: "PyroID",
    field: (row) => row.pyroid,
    sortable: true,
  },
  {
    name: "Type",
    align: "left",
    label: "type",
    field: "type",
    sortable: true,
  },

  {
    name: "status",
    label: "Status",
    field: "status",
    align: "left",
  },
];

export default {
  setup() {
    return {
      jobmancolumns,
    };
  },
  data() {
    return {
      nsIP: "",
      nsPort: "",
      jobmanrows: [],
    };
  },
  async created() {
    const response = await fetch(process.env.MUPIF_API_URL + "/ns-status2/");
    var answer = await response.json();
    console.log(answer);
    if (answer.loc) {
      this.nsIP = answer.loc.host;
      this.nsPort = answer.loc.port;
    }
    if (answer.names) {
      var d = Array(0);
      for (const [key, value] of Object.entries(answer.names)) {
        // loop over metadata
        for (var m of value[1]) {
          if (m.startsWith("type:") || m.startsWith("class:")) {
            var type = "";
            var up = false;
            if (m.includes("jobmanager")) type = "jobmanager";
            else if (m.includes("scheduler")) type = "scheduler";
            else if (m.includes("nameserver")) type = "nameserver";
            else if (m.includes("appserver")) type = "model instance";
            d.push({ name: key, pyroid: value[0], type: type, status: "-" });
            break;
          }
        }
      }
      // console.log(d);
      this.jobmanrows = d;
    }
  },
};
</script>
