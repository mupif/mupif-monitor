    <template>
        <div>NameServer: {{ nsIP }}:{{ nsPort }}</div>
        
        <q-table
            flat
            bordered
            dense
            title="Registered services/components"
            :rows="rows2"
            :columns="jobmancolumns"
            v-model:pagination="pagination"
            row-key="name"
        >
        <template v-slot:body-cell-name="props">
            <q-td :props="props" >
                <div>
                    <q-badge v-if="props.row.status =='OK'"
                        color='green'
                        :label="props.value"
                    />
                    <q-badge v-else-if="props.row.status =='ERR'"
                        color='red'
                        :label="props.value"
                    />
                    <q-badge v-else
                        :label="props.value"
                    />
                </div>
                <div class="my-table-details">
                    {{ props.row.details }}
                </div>
            </q-td>
        </template>
        </q-table>
</template>

<script>
    
import { ref } from 'vue'
import { computed } from "vue";
import { useNSStatStore } from "stores/nsStat";
import { useJobmansStatStore } from "stores/jobmansStat";
import { useSchedulerStatStore } from "stores/schedulerStat";
import { storeToRefs } from "pinia";



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
        label: "Info",
        field: "info",
        align: "left",
    },
];

export default {
    setup() {
        const store = useNSStatStore();
        const storeModelServers = useJobmansStatStore();
        const storeScheduler = useSchedulerStatStore();
        store.update();
        storeModelServers.update();
        storeScheduler.update();
        return {
            jobmancolumns,
            store,
            storeModelServers,
            storeScheduler,
        };
    },
    data() {
        return {
            nsIP: "",
            nsPort: "",
            pooling: null,
            pagination: { rowsPerPage: 15 },
        };
    },
    computed: {
        rows() {
            return this.store.rows;
        },
        rows2() {  
            var ans = []
            //console.log("Computing rows2 ....");
            //console.log("Rows:", this.store.rows)
            //console.log("ModelServers:", this.storeModelServers.jobmanData)
            for (var i of this.store.rows) {
                //console.log(i)
                var status = '-';
                var load = 0;
                var info = '';
                if (i.type == 'modelServer') {
                    const found = this.storeModelServers.jobmanData.find(e=>e.name == i.name);
                    if (found) {
                        //console.log("Status of ModelServer:", i.name+":"+found.status)
                        status = found.status;
                        load = found.jobStat.load;
                        info = "load:"+load+"%";
                    }
                } else if  (i.type == 'scheduler') {
                    info = "load:"+this.storeScheduler.stat.currentLoad+"%";                    
                }
                    
                ans.push({name:i.name,pyroid:i.pyroid,type:i.type,status:status,info:info})
            };
            //console.log("Markers:", ans)
            return ans;
        },
    },
    methods: {
        created () {
            console.log("created");
            this.poolData();
        },
        beforeUnmount() {
            clearInterval(this.pooling);
        },
        poolData() {
            this.pooling = setInterval(async () => {
                this.store.update();
                this.storeModelServers.update();
            }, 3000);
        },
        onRowClick (evt, row) {
             console.log('clicked on', row)
        },
    },
};
</script>
