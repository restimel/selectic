<template>
<div>
    <h1>Selectic example</h1>
    <SelecticParameter />
</div>
</template>
<script>
import Selectic from '../dist/selectic.esm.js';
import SelecticParameter from './components/SelecticParameter.vue';

export default {
    name: 'Example',
    data() {
        return {
        };
    },
    computed: {
        options() {
            var list = [];
            for (let i = 0; i < 1000; i++) {
                list.push({
                    id: i,
                    text: 'Item number ' + i,
                });
            }
            return list;
        },
    },
    components: {
        Selectic,
        SelecticParameter,
    },
}
</script>
<style>
.example {
    max-width: 500px;
}
</style>
