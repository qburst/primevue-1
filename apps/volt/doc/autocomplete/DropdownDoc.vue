<template>
    <DocSectionText v-bind="$attrs">
        <p>
            Enabling <i>dropdown</i> property displays a button next to the input field where click behavior of the button is defined using <i>dropdownMode</i> property that takes <strong>blank</strong> or <strong>current</strong> as possible values.
            <i>blank</i> is the default mode to send a query with an empty string whereas <i>current</i> setting sends a query with the current value of the input.
        </p>
    </DocSectionText>
    <div class="card flex justify-center">
        <AutoComplete v-model="value" dropdown :suggestions="items" @complete="search" />
    </div>
    <DocSectionCode :code="code" />
</template>

<script setup lang="ts">
import AutoComplete from '@/volt/AutoComplete.vue';
import { ref } from 'vue';

const value = ref(null);
const items = ref([]);

const search = (event) => {
    let _items = [...Array(10).keys()];

    items.value = event.query ? [...Array(10).keys()].map((item) => event.query + '-' + item) : _items;
};

const code = ref(`
<template>
    <div class="card flex justify-center">
        <AutoComplete v-model="value" dropdown :suggestions="items" @complete="search" />
    </div>
</template>

<script setup lang="ts">
import AutoComplete from '@/volt/AutoComplete.vue';
import { ref } from 'vue';

const value = ref(null);
const items = ref([]);

const search = (event) => {
    let _items = [...Array(10).keys()];

    items.value = event.query ? [...Array(10).keys()].map((item) => event.query + '-' + item) : _items;
}
<\/script>
`);
</script>
