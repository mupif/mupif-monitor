import { defineStore } from "pinia";

export const useVPNStatStore = defineStore("vpnStat", {
  state: () => ({
    vpn: {
      name: "",
      ip: 0,
      bytes: {
        tx: 0,
        rx: 0,
      },
    },
    peers: [],
    remoteIPGeoCache: {},
  }),

  getters: {
    getVPN(state) {
      return state.vpn;
    },
    getPeers(state) {
      return state.peers;
    },
  },

  actions: {
    async getGeoLocation(host) {
      if (host in this.remoteIPGeoCache) {
        return this.remoteIPGeoCache[host];
      } else {
        // geo geolocation data query
        console.log("fetching geolocation data for", host);
        const response = await fetch(
          "https://get.geojs.io/v1/ip/geo/" + host + ".json"
        );
        var ans = await response.json();
        // cache result
        this.remoteIPGeoCache[host] = {
          coords: [ans.latitude, ans.longitude],
          country: ans.country,
          city: ans.city,
          organization_name: ans.organization_name,
        };
        //console.log(this.remoteIPGeoCache[host]);
        return this.remoteIPGeoCache[host];
      }
    },
    async update() {
      const response = await fetch(process.env.MUPIF_API_URL + "/vpn-status2/");
      console.log("Updating vpn-status2...");
      if (response.status == 200) {
        const answer = await response.json();
        if (answer) {
          console.log("ok");
          const vpn = Object.keys(answer)[0];
          //console.log(vpn)
          //console.log(answer[vpn])
          this.vpn.name = vpn;
          this.vpn.ip = answer[vpn].ipAddr;
          this.vpn.bytes.tx = answer[vpn].bytes.tx;
          this.vpn.bytes.rx = answer[vpn].bytes.rx;
          // process vpn peers
          if (answer[vpn].peers) {
            // check if entry already exists
            for (var i of answer[vpn].peers) {
              var found = false;
              var j;
              for (j of this.peers) { // cache geolocation data
                if (i.vpnAddr == j.vpnAddr) {
                  found = true;
                  j.bytes = i.bytes;
                  j.lastHandshake = i.lastHandshake;
                  if (j.remote.host != i.remote.host) {
                    const gl = await this.getGeoLocation(i.remote.host);
                    j.coords = gl.coords;
                    j.country = gl.country;
                    j.city = gl.city;
                    j.organization_name = gl.organization_name;
                  }
                  break;
                }
              }
              if (!found) {
                const gl = await this.getGeoLocation(i.remote.host);
                //console.log("new peer location", gl);
                i.coords = gl.coords;
                i.country = gl.country;
                i.city = gl.city;
                i.organization_name = gl.organization_name;
                //console.log("new peer", i);
                this.peers.push(i);
              }
            }
            //console.log(this.peers)
          } else {
            console.log("fetch vpn data failed");
          }
        } else {
          console.log("failed with code", response.status);
        }
      }
    },
  },
});
