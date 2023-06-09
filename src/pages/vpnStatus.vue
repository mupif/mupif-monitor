<template>
  <div>VPN Status</div>
  <div class="q-pa-md">
    <q-table
      flat
      bordered
      dense
      title="VPN Peers"
      :rows="rows"
      :columns="columns"
      row-key="name"
    />
  </div>

  <div style="height: 400px; width: 800px">
    <l-map ref="map" v-model:zoom="zoom" :center="[50.1, 14.35]">
      <l-tile-layer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        layer-type="base"
        name="OpenStreetMap"
      ></l-tile-layer>
      <l-marker v-for="marker in markers" :key="marker.id" :lat-lng="marker.coordinates" >
        <l-tooltip> "marker.id" </l-tooltip>
      </l-marker>
    </l-map>
  </div>
</template>

<script>
import "leaflet/dist/leaflet.css";
import { LMap, LMarker, LTileLayer, LTooltip } from "@vue-leaflet/vue-leaflet";

const columns = [
  {
    name: "remoteIP",
    required: true,
    label: "RemoteIP",
    align: "left",
    field: (row) => row.remote.host,
    format: (val) => `${val}`,
    sortable: true,
  },
  {
    name: "vpnIP",
    align: "left",
    label: "VPN IP",
    field: "vpnAddr",
    sortable: true,
  },
  {
    name: "bytesrx",
    label: "Bytes.rx",
    field: (row) => row.bytes.rx,
    align: "left",
  },
  {
    name: "bytestx",
    label: "Bytes tx",
    field: (row) => row.bytes.tx,
    align: "left",
  },
    { name: "lastHandshake", label: "LastHandShake", field: "lastHandshake", align:"left", },
];

export default {
  setup() {
    return {
      columns,
    };
  },
  components: {
    LMap,
    LTileLayer,
    LMarker,
    LTooltip,
  },
  data() {
    return {
      pooling:null,
      zoom: 4,
      markers: [],
      rows: [],
    };
  },
  methods: {
  poolData() {
  this.pooling = setInterval(async () => {
      const response = await fetch(process.env.MUPIF_API_URL+"/vpn-status2/");
      if (response.status == 200) {
          var answer = await response.json();
          const vpn=Object.keys(answer)[0];
          var newmarkers=[];
          if (answer[vpn].peers) {
              this.rows = answer[vpn].peers;
          } else {
          }

          for (var i of answer[vpn].peers) {
              const remote = i.remote.host;
              const response = await fetch("https://get.geojs.io/v1/ip/geo/"+remote+".json");
              var answer = await response.json();
              //console.log(answer.latitude, answer.longitude);
              if (answer.latitude != "nil") {
                  newmarkers.push({id:remote, coordinates:[answer.latitude, answer.longitude]});
              }
          }
          this.markers = newmarkers;

      } else {
          console.log("fetch vpn data failed");
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
};
</script>
