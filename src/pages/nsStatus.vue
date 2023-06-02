<template>
  <div>NameServer: {{ nsIP }}:{{ nsPort }}</div>

  <q-table
    flat
    bordered
    dense
    title="Model JobManagers"
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
    field: (row) => row.RemoteIP,
    format: (val) => `${val}`,
    sortable: true,
  },
  {
    name: "ID",
    align: "left",
    label: "ID",
    field: "vpnAddr",
    sortable: true,
  },
  {
    name: "status",
    label: "Status",
    field: (row) => row.bytes.rx,
    align: "left",
  },
];
const nsdata = {
  "CVUT.demo01": {
    pyroid: "PYRO:obj_2d5c8ee73088420eaf4c0df5d7f0761a@172.24.1.1:44015",
    type: "jobmanager",
  },
  MUPIF_NETWORK_SERVICES: {
    pyroid: "PYRO:Pyro.NameServer@172.24.1.1:10000",
    type: "",
  },
  "Pyro.NameServer": {
    pyroid: "PYRO:Pyro.NameServer@0.0.0.0:10000",
    type: "class:Pyro5.nameserver.NameServer",
  },
  "mupif.scheduler": {
    pyroid: "PYRO:obj_64961ed067ad455e815d65de0da680d3@172.24.1.1:44911",
    type: "scheduler",
  },
};

const nsIP = "172.24.1.1";
const nsPort = "9000";
export default {
  setup() {
    return {
      jobmancolumns,
      nsIP,
      nsPort,
    };
  },
  data() {
    return {};
  },
  async created() {
    const response = await fetch(
      "https://get.geojs.io/v1/ip/geo.json" // ?ip=147.23.234.34
    );
    var answer = await response.json();
    console.log(answer);
    this.coordinates = [answer.latitude, answer.longitude];
    console.log(this.coordinates);
  },
};
</script>
