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
      row-key="vpnAddr"
      _selection="single"
      v-model:selected="selected"
      @row-click="onRowClick"
    />
  </div>

  <div style="height: 400px; width: 800px">
    <l-map ref="map" v-model:zoom="zoom" :center="[50.1, 14.35]">
      <l-tile-layer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        layer-type="base"
        name="OpenStreetMap"
      ></l-tile-layer>
      <div v-for="marker in markers" :key="marker.vpnAddr">
        <div v-if="selected.length" >
          <div v-if="selected[0].vpnAddr == marker.vpnAddr">
            <l-marker :lat-lng="marker.coords" :icon="orangeIcon" :z-index-offset="1000">
              <l-tooltip :content="marker.label" :options={permanent:true}></l-tooltip>
            </l-marker>
          </div>
          <div v-else>
            <l-marker :lat-lng="marker.coords" :icon="blueIcon">
              <l-tooltip :content="marker.label"></l-tooltip>
            </l-marker>
          </div>
        </div>
        <div v-else>
          <l-marker :lat-lng="marker.coords" :icon="blueIcon">
            <l-tooltip :content="marker.label"></l-tooltip>
          </l-marker>
          </div>
      </div>
    </l-map>
  </div>
</template>

<script>
import "leaflet/dist/leaflet.css";
import { ref } from 'vue'
import { LMap, LMarker, LIcon, LTileLayer, LTooltip } from "@vue-leaflet/vue-leaflet";
import { computed } from 'vue';
import { useVPNStatStore } from 'stores/vpnStat';
import { useNSStatStore } from "stores/nsStat";
import { storeToRefs } from 'pinia';
import L from 'leaflet';


const greenIcon = new L.Icon({
  iconUrl: '/icons/marker-icon-green.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
const blueIcon = new L.Icon({
  iconUrl: '/icons/marker-icon-blue.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
const redIcon = new L.Icon({
  iconUrl: '/icons/marker-icon-red.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
const orangeIcon = new L.Icon({
  iconUrl: '/icons/marker-icon-orange.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

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
    const nsStatStore = useNSStatStore();
    store.update();
    nsStatStore.update();
    return {
      selected: ref([]),
      store,
      nsStatStore,
      columns,
      blueIcon,
      greenIcon,
      orangeIcon,
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
                        const ippattern=/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/
                        const recIP = ippattern.exec(i.vpnAddr)[0]
                        var label = recIP; // i.vpnAddr;
                        //console.log("recIP:", recIP)
                        //console.log("nsStatStore:", this.nsStatStore.rows)
                        const found = this.nsStatStore.rows.filter(e=>ippattern.exec(e.pyroid)[0] == recIP);
                        var servers=[];
                        for (var f of found) {
                          if (f.type == 'modelServer') {
                            servers.push(f.name)
                          }
                        }
                        if (servers.length > 0) {
                          label = label + '[' + servers.join(',') + ']';
                        }
                        ans.push({coords:i.coords, vpnAddr: i.vpnAddr, label:label})
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
    onRowClick (evt, row, index) {
              console.log('clicked on', row)
              if (this.selected.length && this.selected[0].vpnAddr == row.vpnAddr) {
                  this.selected = [];
                  
              } else {
                  this.selected = [row];
              };
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
