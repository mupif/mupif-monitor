<template>
    <div>{{store.vpn.name}} vpn {IP: {{store.vpn.ip}}, bytes.tx:{{store.vpn.bytes.tx}}, bytes.rx:{{store.vpn.bytes.rx}}}</div>
  <div class="q-pa-md">
    <q-table
      flat
      bordered
      dense
      title="Peers"
      :rows="store.peers"
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
      <l-marker v-for="marker in markers" :key="marker.vpnAddr" :lat-lng="marker.coords" >
        <l-tooltip> "marker.id" </l-tooltip>
      </l-marker>
    </l-map>
  </div>
</template>

<script>
import "leaflet/dist/leaflet.css";
import { LMap, LMarker, LTileLayer, LTooltip } from "@vue-leaflet/vue-leaflet";
import { computed } from 'vue';
import { useVPNStatStore } from 'stores/vpnStat';
import { storeToRefs } from 'pinia';


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
    { name: "name", align: "left", label: "name", field: "name" },
];

export default {
  setup() {
    const store=useVPNStatStore();
    store.update();
    return {
      store,
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
      rows: [],
    };
  },
    computed: {
        markers() {
            var ans = []
            for (var i of this.store.peers) {
                //console.log(i.coords)
                if (i.coords) {
                    if (i.coords[0] =='nil' || i.coords[1]=='nil') {} else {
                        ans.push({coords:i.coords, vpnAddr: i.vpnAddr})
                    }
                }
            }
            //console.log("Markers:", ans)
            return ans
        },
    },
  methods: {
  poolData() {
      this.pooling = setInterval(async () => {
          this.store.update();
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
