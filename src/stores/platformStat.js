import { defineStore } from "pinia";

/*
 * State of the platform services and a summary of the VPN, for the overview.
 *
 *  - GET <api>/status2/: {nameserver, dms, scheduler: "OK"|"Failed", name: platform (VPN) name}
 *  - GET <api>/vpn-status2/: {<interface>: {ipAddr, bytes: {tx, rx}, peers: [{vpnAddr, name,
 *    bytes, lastHandshake (ISO time of the server, epoch 0 = never), remote: {host, port}}]}}
 *
 * The VPN tab has its own store (vpnStat), which also looks up the geographic location of every
 * peer with an external service; the overview needs only the numbers, so it reads the same
 * endpoint here without those lookups.
 */

/** A peer counts as connected if its last WireGuard handshake is at most this old (ms). */
export const PEER_ACTIVE_MS = 3 * 60 * 1000;

export const usePlatformStatStore = defineStore("platformStat", {
  state: () => ({
    /** answer of status2, or null if the API did not answer */
    services: null,
    /** VPN summary: {iface, ip, tx, rx, peers, activePeers}, or null */
    vpn: null,
    /** whether an update has finished (before that, nothing is known) */
    loaded: false,
    /** reasons of failed requests, by endpoint */
    errors: {},
    updating: false,
  }),

  actions: {
    /** Fetch one endpoint; returns the parsed answer or null (reason in `errors`). */
    async fetchJson(endpoint) {
      try {
        const response = await fetch(process.env.MUPIF_API_URL + endpoint);
        if (response.status != 200) {
          this.errors[endpoint] = `HTTP ${response.status}`;
          return null;
        }
        delete this.errors[endpoint];
        return await response.json();
      } catch (e) {
        this.errors[endpoint] = String(e);
        return null;
      }
    },

    /** Fetch the service state and the VPN summary; never throws. */
    async update() {
      if (this.updating) return;
      this.updating = true;
      try {
        const [services, vpn] = await Promise.all([
          this.fetchJson("/status2/"),
          this.fetchJson("/vpn-status2/"),
        ]);
        this.services = services;
        this.vpn = vpn ? summariseVpn(vpn) : null;
        this.loaded = true;
      } finally {
        this.updating = false;
      }
    },
  },
});

/** Summary of the first VPN interface of a vpn-status2 answer (the VPN tab shows the first one too). */
function summariseVpn(answer) {
  const iface = Object.keys(answer)[0];
  if (!iface) return null;
  const v = answer[iface];
  const peers = v.peers || [];
  const now = Date.now();
  const activePeers = peers.filter((p) => {
    const t = Date.parse(p.lastHandshake);
    return !isNaN(t) && t > 0 && now - t <= PEER_ACTIVE_MS;
  }).length;
  return {
    iface,
    ip: v.ipAddr,
    tx: v.bytes ? v.bytes.tx : null,
    rx: v.bytes ? v.bytes.rx : null,
    peers: peers.length,
    activePeers,
  };
}
