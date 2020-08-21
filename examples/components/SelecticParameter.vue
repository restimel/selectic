
<template>
<div>
    <fieldset>
        <legend>
            parameters
        </legend>
        <br>
        <label>
            options
            <Selectic
                :value="optionType"
                :options="optionList"
                @change="(val) => optionType = val"
            />
        </label>
        <br>
        <label>
            Dynamics options
            <span class="info" title="only apply at component creation">(at creation)</span>
            <Selectic
                :value="dynOptionsVal"
                :options="dynOptions"
                @change="(val) => dynOptionsVal = val"
            />
        </label>
        <br>
        <label>
            title <input type="text" v-model="optionTitle">
        </label>
        <label>
            placeholder <input type="text" v-model="optionPlaceholder">
        </label>
        <label>
            <input type="checkbox" v-model="disabled"> disabled
        </label>
        <label>
            <input type="checkbox" v-model="multiple"> multiple
            <span class="info" title="only apply at component creation">(at creation)</span>
        </label>
        <br>
        <details>
            <summary>
                params
            </summary>
            <label>
                hideFilter
                <span class="info" title="only apply at component creation">(at creation)</span>
                <Selectic
                    :value="optionParams.hideFilter"
                    :options="[{
                        id: 'auto',
                        text: 'auto',
                    }, {
                        id: true,
                        text: 'true',
                    }, {
                        id: false,
                        text: 'false',
                    }]"
                    :params="{
                        allowClearSelection: true,
                    }"
                    @change="(val) => optionParams.hideFilter = val"
                />
            </label>
            <label>
                allowClearSelection
                <span class="info" title="only apply at component creation">(at creation)</span>
                <Selectic
                    :value="optionParams.allowClearSelection"
                    :options="[{
                        id: true,
                        text: 'true',
                    }, {
                        id: false,
                        text: 'false',
                    }]"
                    :params="{
                        allowClearSelection: true,
                    }"
                    @change="(val) => optionParams.allowClearSelection = val"
                />
            </label>
            <label>
                autoSelect
                <span class="info" title="only apply at component creation">(at creation)</span>
                <Selectic
                    :value="optionParams.autoSelect"
                    :options="[{
                        id: true,
                        text: 'true',
                    }, {
                        id: false,
                        text: 'false',
                    }]"
                    :params="{
                        allowClearSelection: true,
                    }"
                    @change="(val) => optionParams.autoSelect = val"
                />
            </label>
            <label>
                autoDisabled
                <span class="info" title="only apply at component creation">(at creation)</span>
                <Selectic
                    :value="optionParams.autoDisabled"
                    :options="[{
                        id: true,
                        text: 'true',
                    }, {
                        id: false,
                        text: 'false',
                    }]"
                    :params="{
                        allowClearSelection: true,
                    }"
                    @change="(val) => optionParams.autoDisabled = val"
                />
            </label>
            <label>
                strictValue
                <span class="info" title="only apply at component creation">(at creation)</span>
                <Selectic
                    :value="optionParams.strictValue"
                    :options="[{
                        id: true,
                        text: 'true',
                    }, {
                        id: false,
                        text: 'false',
                    }]"
                    :params="{
                        allowClearSelection: true,
                    }"
                    @change="(val) => optionParams.strictValue = val"
                />
            </label>
            <label>
                selectionOverflow
                <span class="info" title="only apply at component creation">(at creation)</span>
                <Selectic
                    :value="optionParams.selectionOverflow"
                    :options="[{
                        id: 'multiline',
                        text: 'multiline',
                    }, {
                        id: 'collapsed',
                        text: 'collapsed',
                    }]"
                    :params="{
                        allowClearSelection: true,
                    }"
                    @change="(val) => optionParams.selectionOverflow = val"
                />
            </label>
             <label>
                emptyValue
                <span class="info" title="only apply at component creation">(at creation)</span>
                <input
                    type="text"
                    :value="selectionOverflow"
                    :class="{'has-error': !!errorSelectionOverflow}"
                    :title="errorSelectionOverflow"
                    placeholder="Enter value in JSON format"
                    @change="(evt) => selectionOverflow = evt.currentTarget.value"
                /><br>
            </label>
            <label>
                allowRevert
                <span class="info" title="only apply at component creation">(at creation)</span>
                <Selectic
                    :value="optionParams.allowRevert"
                    :options="[{
                        id: true,
                        text: 'true',
                    }, {
                        id: false,
                        text: 'false',
                    }]"
                    :params="{
                        allowClearSelection: true,
                    }"
                    @change="(val) => optionParams.allowRevert = val"
                />
            </label>
            <label>
                listPosition
                <span class="info" title="only apply at component creation">(at creation)</span>
                <Selectic
                    :value="optionParams.listPosition"
                    :options="[{
                        id: 'auto',
                        text: 'auto',
                    }, {
                        id: 'bottom',
                        text: 'bottom',
                    }, {
                        id: 'top',
                        text: 'top',
                    }]"
                    :params="{
                        allowClearSelection: true,
                    }"
                    @change="(val) => optionParams.listPosition = val"
                />
            </label>
            <label>
                optionBehavior
                <span class="info" title="only apply at component creation">(at creation)</span>
                <div class="half">
                    <Selectic
                        :value="optionBehaviorOperation"
                        :options="[{
                            id: 'sort',
                            text: 'sort',
                        }, {
                            id: 'force',
                            text: 'force',
                        }]"
                        :params="{
                            allowClearSelection: true,
                        }"
                        @change="(val) => optionBehaviorOperation = val"
                    />
                    <Selectic
                        :value="optionBehaviorOrder"
                        :options="[{
                            id: 'ODE',
                            text: 'ODE',
                        }, {
                            id: 'OED',
                            text: 'OED',
                        }, {
                            id: 'DOE',
                            text: 'DOE',
                        }, {
                            id: 'DEO',
                            text: 'DEO',
                        }, {
                            id: 'EOD',
                            text: 'EOD',
                        }, {
                            id: 'EDO',
                            text: 'EDO',
                        }]"
                        :params="{
                            allowClearSelection: true,
                        }"
                        @change="(val) => optionBehaviorOrder = val"
                    />
                </div>
            </label>
        </details>
        <hr>
        <button @click="redraw">
            Redraw Selectic component
        </button>
    </fieldset>
    <fieldset>
        <legend>
            Example
        </legend>
        <Selectic v-if="draw"
            class="example"
            :options="options"
            :value="optionValue"
            :placeholder="optionPlaceholder"
            :title="optionTitle"
            :multiple="multiple"
            :disabled="disabled"
            :params="optionParams"

            @change="(val) => optionValue = val"
        />
        <label>Selected value: <output>{{JSON.stringify(optionValue)}}</output></label>
    </fieldset>
    <fieldset>
        <legend>
            HTML
        </legend>
        <pre>{{htmlSelectic}}</pre>
    </fieldset>
</div>
</template>
<script>
import Selectic from '../../dist/selectic.esm.js';

const emptyOptions = [];
const oneOptions = [{
    id: 'alone',
    text: 'The only option',
}];

const shortNumOptions = [{
    id: 0,
    text: 'First option',
}, {
    id: 1,
    text: 'Second option',
}, {
    id: 2,
    text: 'Third option',
}, {
    id: 3,
    text: 'Fourth option',
}];

const shortStringOptions = [{
    id: 'first',
    text: 'First option',
}, {
    id: 'second',
    text: 'Second option',
}, {
    id: 'third',
    text: 'Third option',
}, {
    id: 'fourth',
    text: 'Fourth option',
}];

const dynOptions = [{
    id: '',
    text: 'no dynamic options',
}, {
    id: 0,
    text: '0 items (empty list)',
}, {
    id: 10,
    text: '10 items',
}, {
    id: 100,
    text: '100 items',
}, {
    id: 1000,
    text: '1000 items',
}, {
    id: 10000,
    text: '10.000 items',
}];

function sleep(time) {
    return Promise((resolve) => {
        setTimeout(resolve, time);
    });
}

function getDynId(id) {
    const [prefix, val] = id.toString().split('-');

    if (prefix !== 'dyn') {
        return -1;
    }
    return +val;
}

const buildFetchCallback = function(val, delay = 0) {
    return async function(search, offset, pageSize) {
        // simulate a backend computation
        let total = val;
        let result = [];
        let sample;

        if (search) {
            sample = [];
            const rgx = new RegExp(search.replace(/([-+\[\]\(\){}?^$.])/g, '\$1').replace(/[*]/g, '.*'), 'i');
            for (let idx = offset; idx < val; idx++) {
                const text = `Dynamic option: ${idx}`;
                if (rgx.test(text)) {
                    sample.push({
                        id: `dyn-${idx}`,
                        text: text,
                    });
                }
            }
            total = sample.length;
        }

        if (offset < total) {
            for (let idx = offset; idx < total && idx < offset + pageSize; idx++) {
                if (search) {
                    result.push(sample[idx - offset]);
                } else {
                    const text = `Dynamic option: ${idx}`;
                    result.push({
                        id: `dyn-${idx}`,
                        text: text,
                    });
                }
            }
        }

        if (delay) {
            await sleep(delay);
        }
        return {
            total: total,
            result: result,
        };
    };
};

const buildGetItemsCallback = function(val, delay = 0) {
    return async function(ids) {
        let result = ids.reduce((rslt, id) => {
            const dynId = getDynId(id);
            if (dynId >= 0 && dynId < val) {
                rslt.push({
                    id: id,
                    text: `Dynamic option: ${id}`,
                });
            }
            return rslt;
        }, []);

        if (delay) {
            await sleep(delay);
        }

        return result;
    };
};


const longLength = 1500;
const longNumOptions = new Array(longLength);
const longStringOptions = new Array(longLength);
for (let i = 0; i < longLength; i++) {
    longNumOptions[i] = {
        id: i,
        text: `option #${i}`,
    };
    longStringOptions[i] = {
        id: `id-${i}`,
        text: `option "${i}"`,
    };
}

export default {
    name: 'Example',
    data() {
        return {
            draw: true,

            multiple: false,
            disabled: false,
            optionValue: null,
            optionPlaceholder: '',
            optionTitle: '',
            selectionOverflow: '',
            errorSelectionOverflow: '',
            optionParams: {
                hideFilter: undefined,
                allowClearSelection: undefined,
                autoSelect: undefined,
                autoDisabled: undefined,
                strictValue: undefined,
                selectionOverflow: undefined,
                allowRevert: undefined,
                emptyValue: undefined,
                listPosition: undefined,
                fetchCallback: undefined,
                getItemsCallback: undefined,
                optionBehavior: undefined,
            },
            optionType: 'longNumOptions',
            optionList: [{
                id: 'emptyOptions',
                text: `empty option (${emptyOptions.length} items)`,
                values: emptyOptions,
            }, {
                id: 'oneOptions',
                text: `only one option (${oneOptions.length} items)`,
                values: oneOptions,
            }, {
                id: 'shortNumOptions',
                text: `short with numerical id (${shortNumOptions.length} items)`,
                values: shortNumOptions,
            }, {
                id: 'shortStringOptions',
                text: `short with string id (${shortStringOptions.length} items)`,
                values: shortStringOptions,
            }, {
                id: 'longNumOptions',
                text: `long with numerical id (${longNumOptions.length} items)`,
                values: longNumOptions,
            }],
            dynOptionsVal: '',
            dynOptions: dynOptions,
            optionBehaviorOperation: '',
            optionBehaviorOrder: '',
        };
    },
    computed: {
        options() {
            const optionType = this.optionType;
            const optionInfo = this.optionList.find((o) => o.id === optionType);
            return optionInfo && optionInfo.values || [];
        },
        htmlSelectic() {
            const options = [
                `:value="${JSON.stringify(this.optionValue).replace(/"/g, '\'')}"`,
                `:options="${this.optionType}"`,
            ];
            if (this.optionPlaceholder) {
                options.push(`:placeholder="${this.optionPlaceholder}"`);
            }
            if (this.optionTitle) {
                options.push(`:title="${this.optionTitle}"`);
            }
            if (this.disabled) {
                options.push('disabled');
            }
            if (this.multiple) {
                options.push('multiple');
            }

            const paramList = Object.keys(this.optionParams).reduce((list, key) => {
                const param = this.optionParams[key];

                if (param !== void 0 && param !== null) {
                    let val = param;

                    if (typeof param === 'string') {
                        val = `'${param}'`;
                    }

                    if (key === 'fetchCallback') {
                        val = 'fetchOptionsCb';
                    }
                    if (key === 'getItemsCallback') {
                        val = 'fetchIdsCb';
                    }

                    list.push(`    ${key}: ${val},`)
                }

                return list;
            }, []);
            if (paramList.length) {
                options.push('', ':params="{', ...paramList, '}"');
            }

            const html = [
                '<Selectic',
                ...options.map(o => `    ${o}`),
                '/>',
            ];
            return html.join('\n');
        },
    },
    methods: {
        redraw() {
            this.draw = false;
            setTimeout(() => {
                this.draw = true;
            }, 10);
        },
        buildOptionBehavior() {
            const optionBehaviorOrder = this.optionBehaviorOrder;
            const optionBehaviorOperation = this.optionBehaviorOperation;

            if (!optionBehaviorOrder || !optionBehaviorOperation) {
                this.optionBehaviorOrder = '';
                this.optionBehaviorOperation = '';
                this.optionParams.optionBehavior = undefined;
            } else {
                this.optionParams.optionBehavior = `${optionBehaviorOperation}-${optionBehaviorOrder}`;
            }
        },
    },
    watch: {
        'optionParams.selectionOverflow'() {
            this.selectionOverflow = JSON.stringify(this.optionParams.selectionOverflow);
        },
        selectionOverflow() {
            try {
                this.optionParams.selectionOverflow = JSON.parse(this.selectionOverflow);
            } catch(e) {
                this.errorSelectionOverflow = e.message;
                return;
            }
            this.errorSelectionOverflow = '';
        },
        dynOptionsVal() {
            const val = this.dynOptionsVal;
            if (val === '') {
                this.optionParams.fetchCallback = undefined;
                this.optionParams.getItemsCallback = undefined;
            } else {
                this.optionParams.fetchCallback = buildFetchCallback(val);
                this.optionParams.getItemsCallback = buildGetItemsCallback(val);
            }
        },
        optionBehaviorOrder() {
            if (!this.optionBehaviorOperation) {
                this.optionBehaviorOperation = 'sort';
            }
            this.buildOptionBehavior();
        },
        optionBehaviorOperation() {
            if (!this.optionBehaviorOrder) {
                this.optionBehaviorOrder = 'ODE';
            }
            this.buildOptionBehavior();
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
.info {
    font-size: 0.8em;
    font-style: italic;
    cursor: help;
}
.has-error {
    border-color: red;
}
.half {
    display: grid;
    grid-template: max-content / 1fr 1fr;
    grid-column-gap: 15px;
}
</style>
