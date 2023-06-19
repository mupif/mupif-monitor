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
            this.peers = answer[vpn].peers;
          }
          for (var i of this.peers) {
            const remote = i.remote.host;
            // geo geolocation data
            const response = await fetch(
              "https://get.geojs.io/v1/ip/geo/" + remote + ".json"
            );
            var ans = await response.json();
            //console.log(answer.latitude, answer.longitude);
            i["coords"] = [ans.latitude, ans.longitude];
            i["country"] = ans.country;
            i["city"] = ans.city;
            i["organization_name"] = ans.organization_name;
          }
        } else {
          console.log("fetch vpn data failed");
        }
      } else {
        console.log("failed with code", response.status);
      }
    },
  },
});
