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
      <l-marker :lat-lng="coordinates" draggable>
        <l-tooltip> Home </l-tooltip>
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
    field: (row) => row.RemoteIP,
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
  //{ name: "lastHandShake", label: "LastHandShake", field: "lastHandShake" },
];

/*

const data = {
  test: {
    bytes: { rx: 75866636, tx: 199596472 },
    ipAddr: "172.24.1.1",
    peers: [
      {
        bytes: { rx: 60739412, tx: 185713228 },
        lastHandshake: datetime.datetime(2023, 5, 29, 9, 26, 58),
        publicKey: "2MQ91K0II2S81V8H7b/y9LLlKkvPO9UmOkrgTwcbDBo=",
        remote: { host: "172.31.0.1", port: 35935 },
        vpnAddr: "172.24.1.2/32",
      },
      {
        bytes: { rx: 1272436, tx: 2025516 },
        lastHandshake: datetime.datetime(2023, 5, 29, 9, 26, 17),
        publicKey: "shG/OCmze8kn6HIYxBbDA2EOzIahd1GIEROJJFX//x8=",
        remote: { host: "78.108.102.144", port: 57206 },
        vpnAddr: "172.24.1.11/32",
      },
      {
        bytes: { rx: 9574756, tx: 5952920 },
        lastHandshake: datetime.datetime(2023, 5, 29, 9, 26, 45),
        publicKey: "Cxkt8L7DaGxl2SbnxEE3+IWqeuWZ40qXLhDz4D09H2c=",
        remote: { host: "172.31.0.1", port: 58491 },
        vpnAddr: "172.24.1.20/32",
      },
      {
        bytes: { rx: 2575492, tx: 637836 },
        lastHandshake: datetime.datetime(2023, 5, 29, 9, 25, 13),
        publicKey: "ojDg5mqc6gWM9ERx1fTO9EdA4lbLdHIZgCglEVEyrm4=",
        remote: { host: "147.32.130.18", port: 46803 },
        vpnAddr: "172.24.1.22/32",
      },
      {
        bytes: { rx: 1704540, tx: 5266972 },
        lastHandshake: datetime.datetime(2023, 5, 23, 23, 7, 33),
        publicKey: "lfLCUVN96AEsn/GFpg9Yvzv4t0cq9F6YI8j0tCE06Bk=",
        remote: { host: "93.89.144.116", port: 46285 },
        vpnAddr: "172.24.1.32/32",
      },
    ],
  },
};
*/
const rows = [
  {
    RemoteIP: "1.1.1.1",
    vpnAddr: "0.0.0.1",
    bytes: { rx: 60739412, tx: 185713228 },
  },
  {
    RemoteIP: "10.12.1.1",
    vpnAddr: "0.0.0.2",
    bytes: { rx: 60739412, tx: 185713228 },
  },
];

export default {
  setup() {
    return {
      columns,
      rows,
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
      zoom: 4,
      coordinates: [0, 0],
    };
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
