import { defineStore } from 'pinia';

export const useNSStatStore = defineStore('nsStat', {
    state: () => ({
        rows: [],
    }),
    
    getters: {
        getRows (state) {
            return state.rows;
        }
    },

    actions: {
        async update() {
            const response = await fetch(process.env.MUPIF_API_URL + "/ns-status2/");
            if (response.status == 200) {
                console.log("receiving ns-status2");
                const answer = await response.json();
                if (answer) {
                    console.log("ok");
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
                                    if (m.includes("jobmanager")) type = "modelServer";
                                    else if (m.includes("scheduler")) type = "scheduler";
                                    else if (m.includes("nameserver")) type = "nameserver";
                                    else if (m.includes("appserver")) type = "modelInstance";
                                    d.push({ name: key, pyroid: value[0], type: type, status: "-" });
                                    break;
                                }
                            }
                        }
                        
                        // console.log(d);
                        this.rows = d;
                        return;
                    }
                } else {
                    conslole.log("received no data");
                }
            } else {
                console.log("ns-status2 failed with code", response.status);
            }
        },
  
    },
});
