    <template>
    <div>NameServer: {{ nsIP }}:{{ nsPort }}</div>
    
  <q-table
    flat
    bordered
    dense
    title="Registered services/components"
    :rows="rows"
    :columns="jobmancolumns"
    row-key="name"
  />
</template>

<script>
    
import { ref } from 'vue'
import { computed } from "vue";
import { useNSStatStore } from "stores/nsStat";
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
        label: "Status",
        field: "status",
        align: "left",
    },
];

export default {
    setup() {
        const store = useNSStatStore();
        store.update();
        return {
            jobmancolumns,
            store,
        };
    },
    data() {
        return {
            nsIP: "",
            nsPort: "",
            pooling: null,
        };
    },
    computed: {
        rows() {
            return this.store.rows;
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
            }, 3000);
        },
    },
};
</script>
