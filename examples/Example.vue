<template>
<div>
    <h1>Selectic example</h1>
    <Selectic
        class="example"
        :options="options"
        :value="2"
        :params="{
            autoDisabled: false,
        }"
    />
    <Selectic
        class="example"
        :options="options"
        :value="[5, 4]"
        :multiple="true"
        :params="{
            autoDisabled: false,
        }"
    />
</div>
</template>
<script>
import Selectic from '../dist/selectic.esm.js';

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
    },
}
</script>
<style>
.example {
    max-width: 500px;
}
</style>
