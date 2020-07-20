import { Vue, Prop, Watch, Component } from 'vtyx';

/* File Purpose:
 * It keeps and computes all states at a single place.
 * Every inner components of Selectic should comunicate with this file to
 * change or to get states.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/* }}} */
/**
 * Escape search string to consider regexp special characters as they
 * are and not like special characters.
 * Consider * characters as a wildcards characters (meanings 0 or
 * more characters) and convert them to .* (the wildcard characters
 * in Regexp)
 *
 * @param  {String} name the original string to convert
 * @param  {String} [flag] mode to apply for regExp
 * @return {String} the string ready to use for RegExp format
 */
function convertToRegExp(name, flag = 'i') {
    const pattern = name.replace(/[\\^$.+?(){}[\]|]/g, '\\$&')
        .replace(/\*/g, '.*');
    return new RegExp(pattern, flag);
}
let messages = {
    noFetchMethod: 'Fetch callback is missing: it is not possible to retrieve data.',
    searchPlaceholder: 'Search',
    searching: 'Searching',
    cannotSelectAllSearchedItems: 'Cannot select all items: too much items in the search result.',
    cannotSelectAllRevertItems: 'Cannot select all items: some items are not fetched yet.',
    selectAll: 'Select all',
    excludeResult: 'Invert selection',
    reverseSelection: 'The displayed elements are those not selected.',
    noData: 'No data',
    noResult: 'No results',
    clearSelection: 'Clear current selection',
    clearSelections: 'Clear all selections',
    wrongFormattedData: 'The data fetched is not correctly formatted.',
    moreSelectedItem: '+1 other',
    moreSelectedItems: '+%d others',
};
let closePreviousSelectic;
/* {{{ Static */
function changeTexts(texts) {
    messages = Object.assign(messages, texts);
}
/* }}} */
let SelecticStore = class SelecticStore extends Vue {
    constructor() {
        /* {{{ props */
        super(...arguments);
        /* }}} */
        /* {{{ data */
        /* Number of items displayed in a page (before scrolling) */
        this.itemsPerPage = 10;
        /* }}} */
        /* {{{ data */
        this.state = {
            multiple: false,
            disabled: false,
            placeholder: '',
            hideFilter: false,
            allowRevert: undefined,
            allowClearSelection: false,
            autoSelect: true,
            autoDisabled: true,
            strictValue: false,
            selectionOverflow: 'collapsed',
            internalValue: null,
            isOpen: false,
            searchText: '',
            selectionIsExcluded: false,
            allOptions: [],
            filteredOptions: [],
            selectedOptions: null,
            totalAllOptions: Infinity,
            totalFilteredOptions: Infinity,
            groups: new Map(),
            offsetItem: 0,
            activeItemIdx: -1,
            pageSize: 100,
            listPosition: 'auto',
            status: {
                searching: false,
                errorMessage: '',
                areAllSelected: false,
                hasChanged: false,
            },
        };
        this.labels = Object.assign({}, messages);
        /* used to avoid checking and updating table while doing batch stuff */
        this.doNotUpdate = false;
        this.cacheItem = new Map();
        /* }}} */
    }
    /* }}} */
    /* {{{ computed */
    /* Number of item to pre-display */
    get marginSize() {
        return this.state.pageSize / 2;
    }
    /* }}} */
    /* {{{ computed */
    get isPartial() {
        return typeof this.fetchCallback === 'function';
    }
    get hasAllItems() {
        const nbItems = this.state.totalFilteredOptions + this.state.groups.size;
        return this.state.filteredOptions.length >= nbItems;
    }
    get hasFetchedAllItems() {
        const state = this.state;
        return state.allOptions.length === state.totalAllOptions;
    }
    get closeSelectic() {
        return () => this.commit('isOpen', false);
    }
    /* }}} */
    /* {{{ methods */
    /* {{{ public methods */
    commit(name, value) {
        const oldValue = this.state[name];
        if (oldValue === value) {
            return;
        }
        this.state[name] = value;
        switch (name) {
            case 'searchText':
                this.state.offsetItem = 0;
                this.state.activeItemIdx = -1;
                this.state.filteredOptions = [];
                this.state.totalFilteredOptions = Infinity;
                this.buildFilteredOptions();
                break;
            case 'isOpen':
                if (value) {
                    if (this.state.disabled) {
                        this.commit('isOpen', false);
                        return;
                    }
                    this.state.offsetItem = 0;
                    this.state.activeItemIdx = -1;
                    this.resetChange();
                    this.buildFilteredOptions();
                    if (typeof closePreviousSelectic === 'function') {
                        closePreviousSelectic();
                    }
                    closePreviousSelectic = this.closeSelectic;
                }
                else if (closePreviousSelectic === this.closeSelectic) {
                    closePreviousSelectic = undefined;
                }
                break;
            case 'offsetItem':
                this.buildFilteredOptions();
                break;
            case 'internalValue':
                this.assertCorrectValue();
                this.updateFilteredOptions();
                break;
            case 'selectionIsExcluded':
                this.assertCorrectValue();
                this.updateFilteredOptions();
                this.buildSelectedOptions();
                break;
            case 'disabled':
                if (value) {
                    this.commit('isOpen', false);
                }
                break;
        }
    }
    getItem(id) {
        let item;
        if (this.hasItemInStore(id)) {
            item = this.cacheItem.get(id);
        }
        else {
            this.getItems([id]);
            item = {
                id,
                text: String(id),
            };
        }
        return this.buildItems([item])[0];
    }
    async getItems(ids) {
        const itemsToFetch = ids.filter((id) => !this.hasItemInStore(id));
        if (itemsToFetch.length && typeof this.getItemsCallback === 'function') {
            const cacheRequest = this.cacheRequest;
            const requestId = itemsToFetch.toString();
            let promise;
            if (cacheRequest.has(requestId)) {
                promise = cacheRequest.get(requestId);
            }
            else {
                promise = this.getItemsCallback(itemsToFetch);
                cacheRequest.set(requestId, promise);
                promise.then(() => {
                    cacheRequest.delete(requestId);
                });
            }
            const items = await promise;
            for (const item of items) {
                if (item) {
                    this.cacheItem.set(item.id, item);
                }
            }
        }
        return this.buildSelectedItems(ids);
    }
    selectItem(id, selected, keepOpen = false) {
        const state = this.state;
        let hasChanged = false;
        /* Check that item is not disabled */
        if (!this.isPartial) {
            const item = state.allOptions.find((opt) => opt.id === id);
            if (item && item.disabled) {
                return;
            }
        }
        if (state.strictValue && !this.hasValue(id)) {
            /* reject invalid values */
            return;
        }
        if (state.multiple) {
            /* multiple = true */
            const internalValue = state.internalValue;
            const isAlreadySelected = internalValue.includes(id);
            if (selected === undefined) {
                selected = !isAlreadySelected;
            }
            if (id === null) {
                state.internalValue = [];
                hasChanged = internalValue.length > 0;
            }
            else if (selected && !isAlreadySelected) {
                internalValue.push(id);
                hasChanged = true;
            }
            else if (!selected && isAlreadySelected) {
                internalValue.splice(internalValue.indexOf(id), 1);
                hasChanged = true;
            }
            if (hasChanged) {
                this.updateFilteredOptions();
            }
        }
        else {
            /* multiple = false */
            const oldValue = state.internalValue;
            if (!keepOpen) {
                this.commit('isOpen', false);
            }
            if (selected === undefined || id === null) {
                selected = true;
            }
            if (!selected) {
                if (id !== oldValue) {
                    return;
                }
                id = null;
            }
            else if (id === oldValue) {
                return;
            }
            this.commit('internalValue', id);
            hasChanged = true;
        }
        if (hasChanged) {
            state.status.hasChanged = true;
        }
    }
    toggleSelectAll() {
        if (!this.state.multiple) {
            return;
        }
        if (!this.hasAllItems) {
            if (this.state.searchText) {
                this.state.status.errorMessage = this.labels.cannotSelectAllSearchedItems;
                return;
            }
            if (!this.state.allowRevert) {
                this.state.status.errorMessage = this.labels.cannotSelectAllRevertItems;
                return;
            }
            const value = this.state.internalValue;
            const selectionIsExcluded = !!value.length || !this.state.selectionIsExcluded;
            this.state.selectionIsExcluded = selectionIsExcluded;
            this.state.internalValue = [];
            this.state.status.hasChanged = true;
            this.updateFilteredOptions();
            return;
        }
        const selectAll = !this.state.status.areAllSelected;
        this.state.status.areAllSelected = selectAll;
        this.doNotUpdate = true;
        this.state.filteredOptions.forEach((item) => this.selectItem(item.id, selectAll));
        this.doNotUpdate = false;
        this.updateFilteredOptions();
    }
    resetChange() {
        this.state.status.hasChanged = false;
    }
    resetErrorMessage() {
        this.state.status.errorMessage = '';
    }
    clearCache(forceReset = false) {
        const total = this.isPartial ? Infinity : 0;
        this.cacheItem.clear();
        this.state.allOptions = [];
        this.state.totalAllOptions = total;
        this.state.filteredOptions = [];
        this.state.totalFilteredOptions = Infinity;
        this.state.status.errorMessage = '';
        this.state.status.hasChanged = false;
        if (forceReset) {
            this.state.internalValue = null;
            this.state.selectionIsExcluded = false;
            this.state.searchText = '';
        }
        this.assertCorrectValue();
        if (forceReset) {
            this.buildFilteredOptions();
        }
        else {
            this.buildAllOptions();
        }
    }
    changeGroups(groups) {
        this.state.groups.clear();
        this.addGroups(groups);
        this.buildFilteredOptions();
    }
    changeTexts(texts) {
        this.labels = Object.assign({}, this.labels, texts);
    }
    /* }}} */
    /* {{{ private methods */
    hasValue(id) {
        const allOptions = this.state.allOptions;
        return id === null || allOptions.some((option) => option.id === id);
    }
    assertCorrectValue(forceStrict = false) {
        const state = this.state;
        const internalValue = state.internalValue;
        const selectionIsExcluded = state.selectionIsExcluded;
        const isMultiple = state.multiple;
        const checkStrict = state.strictValue;
        let newValue = internalValue;
        const isPartial = this.isPartial;
        if (isMultiple) {
            if (!Array.isArray(internalValue)) {
                newValue = internalValue === null ? [] : [internalValue];
            }
            if (selectionIsExcluded && this.hasFetchedAllItems) {
                newValue = state.allOptions.reduce((values, option) => {
                    const id = option.id;
                    if (!internalValue.includes(id)) {
                        values.push(id);
                    }
                    return values;
                }, []);
                state.selectionIsExcluded = false;
            }
        }
        else {
            if (Array.isArray(internalValue)) {
                const value = internalValue[0];
                newValue = typeof value === 'undefined' ? null : value;
            }
            state.selectionIsExcluded = false;
        }
        if (checkStrict) {
            let isDifferent = false;
            let filteredValue;
            if (isMultiple) {
                filteredValue = newValue
                    .filter((value) => this.hasItemInStore(value));
                isDifferent = filteredValue.length !== newValue.length;
                if (isDifferent && isPartial && !forceStrict) {
                    this.getItems(newValue).then(() => this.assertCorrectValue(true));
                    return;
                }
            }
            else if (!this.hasItemInStore(newValue)) {
                filteredValue = null;
                isDifferent = true;
                if (isPartial && !forceStrict) {
                    this.getItems([newValue]).then(() => this.assertCorrectValue(true));
                    return;
                }
            }
            if (isDifferent) {
                newValue = filteredValue;
            }
        }
        state.internalValue = newValue;
    }
    updateFilteredOptions() {
        if (!this.doNotUpdate) {
            this.state.filteredOptions = this.buildItems(this.state.filteredOptions);
        }
    }
    addGroups(groups) {
        groups.forEach((group) => {
            this.state.groups.set(group.id, group.text);
        });
    }
    buildAllOptions() {
        const allOptions = [];
        if (Array.isArray(this.options)) {
            this.options.forEach((option) => {
                /* manage simple string */
                if (typeof option === 'string') {
                    allOptions.push({
                        id: option,
                        text: option,
                    });
                    return;
                }
                const group = option.group;
                const options = option.options;
                /* check for groups */
                if (group && !this.state.groups.has(group)) {
                    this.state.groups.set(group, String(group));
                }
                /* check for sub options */
                if (options) {
                    const groupId = option.id;
                    this.state.groups.set(groupId, option.text);
                    options.forEach((subOpt) => {
                        subOpt.group = groupId;
                    });
                    allOptions.push(...options);
                    return;
                }
                allOptions.push(option);
            });
        }
        this.state.allOptions = allOptions;
        if (this.isPartial) {
            this.state.totalAllOptions = Infinity;
        }
        else {
            this.state.totalAllOptions = allOptions.length;
        }
        this.state.filteredOptions = [];
        this.state.totalFilteredOptions = Infinity;
        this.buildFilteredOptions();
    }
    async buildFilteredOptions() {
        if (!this.state.isOpen) {
            /* Do not try to fetch anything while the select is not open */
            return;
        }
        const allOptions = this.state.allOptions;
        const search = this.state.searchText;
        const totalAllOptions = this.state.totalAllOptions;
        const allOptionsLength = allOptions.length;
        const filteredOptionsLength = this.state.filteredOptions.length;
        if (this.hasAllItems) {
            /* Everything has already been fetched */
            return;
        }
        /* Check if all options have been fetched */
        if (this.hasFetchedAllItems) {
            if (!search) {
                this.state.filteredOptions = this.buildGroupItems(allOptions);
                this.state.totalFilteredOptions = this.state.filteredOptions.length;
                return;
            }
            /* Filter options on what is search for */
            const rgx = convertToRegExp(search, 'i');
            const options = this.buildGroupItems(allOptions.filter((option) => rgx.test(option.text)));
            this.state.filteredOptions = options;
            this.state.totalFilteredOptions = this.state.filteredOptions.length;
            return;
        }
        /* When we only have partial options */
        const offsetItem = this.state.offsetItem;
        const pageSize = this.state.pageSize;
        const marginSize = this.marginSize;
        const endIndex = offsetItem + marginSize;
        if (endIndex <= filteredOptionsLength) {
            return;
        }
        if (!search && endIndex <= allOptionsLength) {
            this.state.filteredOptions = this.buildGroupItems(allOptions);
            this.state.totalFilteredOptions = totalAllOptions + this.state.groups.size;
            return;
        }
        if (!this.fetchCallback) {
            this.state.status.errorMessage = this.labels.noFetchMethod;
            return;
        }
        /* Run the query */
        this.state.status.searching = true;
        /* Manage cases where offsetItem is not equal to the last item received */
        const offset = filteredOptionsLength - this.nbGroups(this.state.filteredOptions);
        const nbItems = endIndex - offset;
        const limit = Math.ceil(nbItems / pageSize) * pageSize;
        try {
            const requestId = ++this.requestId;
            const { total: rTotal, result } = await this.fetchCallback(search, offset, limit);
            let total = rTotal;
            /* Assert result is correctly formatted */
            if (!Array.isArray(result)) {
                throw new Error(this.labels.wrongFormattedData);
            }
            /* Handle case where total is not returned */
            if (typeof total !== 'number') {
                total = search ? this.state.totalFilteredOptions
                    : this.state.totalAllOptions;
                if (!isFinite(total)) {
                    total = result.length;
                }
            }
            if (!search) {
                /* update cache */
                this.state.totalAllOptions = total;
                this.state.allOptions.splice(offset, limit, ...result);
            }
            /* Check request is not obsolete */
            if (requestId !== this.requestId) {
                return;
            }
            if (!search) {
                this.state.filteredOptions = this.buildGroupItems(this.state.allOptions);
            }
            else {
                const previousItem = this.state.filteredOptions[filteredOptionsLength - 1];
                const options = this.buildGroupItems(result, previousItem);
                const nbGroups1 = this.nbGroups(options);
                this.state.filteredOptions.splice(offset, limit + nbGroups1, ...options);
            }
            let nbGroups = this.state.groups.size;
            if (offset + limit >= total) {
                nbGroups = this.nbGroups(this.state.filteredOptions);
            }
            this.state.totalFilteredOptions = total + nbGroups;
            this.state.status.errorMessage = '';
        }
        catch (e) {
            this.state.status.errorMessage = e.message;
        }
        this.state.status.searching = false;
    }
    async buildSelectedOptions() {
        const internalValue = this.state.internalValue;
        if (this.state.multiple) {
            /* display partial information about selected items */
            this.state.selectedOptions = this.buildSelectedItems(internalValue);
            const items = await this.getItems(internalValue).catch(() => []);
            if (internalValue !== this.state.internalValue) {
                /* Values have been deprecated */
                return;
            }
            if (items.length !== internalValue.length) {
                if (!this.state.strictValue) {
                    const updatedItems = this.state.selectedOptions.map((option) => {
                        const foundItem = items.find((item) => item.id === option.id);
                        return foundItem || option;
                    });
                    this.state.selectedOptions = updatedItems;
                }
                else {
                    const itemIds = items.map((item) => item.id);
                    this.commit('internalValue', itemIds);
                }
                return;
            }
            /* display full information about selected items */
            this.state.selectedOptions = items;
        }
        else if (internalValue === null) {
            this.state.selectedOptions = null;
        }
        else {
            /* display partial information about selected items */
            this.state.selectedOptions = this.buildSelectedItems([internalValue])[0];
            const items = await this.getItems([internalValue]).catch(() => []);
            if (internalValue !== this.state.internalValue) {
                /* Values have been deprecated */
                return;
            }
            if (!items.length) {
                if (this.state.strictValue) {
                    this.commit('internalValue', null);
                }
                return;
            }
            /* display full information about selected items */
            this.state.selectedOptions = items[0];
        }
    }
    buildSelectedItems(ids) {
        return this.buildItems(ids.map((id) => {
            const item = this.cacheItem.get(id);
            return item || {
                id,
                text: String(id),
            };
        }));
    }
    hasItemInStore(id) {
        let item = this.cacheItem.get(id);
        if (!item) {
            item = this.state.filteredOptions.find((option) => option.id === id);
            if (!item) {
                item = this.state.allOptions.find((option) => option.id === id);
            }
            if (item) {
                this.cacheItem.set(item.id, item);
            }
        }
        return !!item;
    }
    buildItems(options) {
        const internalValue = this.state.internalValue;
        const selected = this.state.multiple
            ? internalValue
            : [internalValue];
        const selectionIsExcluded = +this.state.selectionIsExcluded;
        return options.map((option) => {
            const id = option.id;
            return Object.assign({
                disabled: false,
                isGroup: false,
            }, option, {
                // tslint:disable-next-line:no-bitwise
                selected: !!(+selected.includes(id) ^ selectionIsExcluded),
            });
        });
    }
    buildGroupItems(options, previousItem) {
        let previousGroupId = previousItem && previousItem.group;
        const list = this.buildItems(options).reduce((items, item) => {
            if (item.group !== previousGroupId) {
                const groupId = item.group;
                const groupLabel = this.state.groups.get(groupId);
                items.push({
                    id: groupId,
                    text: groupLabel,
                    isGroup: true,
                    disabled: false,
                    selected: false,
                });
                previousGroupId = groupId;
            }
            items.push(item);
            return items;
        }, []);
        return list;
    }
    nbGroups(items) {
        return items.reduce((nb, item) => +item.isGroup + nb, 0);
    }
    checkAutoSelect() {
        const state = this.state;
        const isAutoSelectActive = state.autoSelect && !state.allowClearSelection
            && state.internalValue === null;
        if (!isAutoSelectActive || state.isOpen) {
            return;
        }
        const options = state.allOptions;
        for (const option of options) {
            if (!option.disabled) {
                this.selectItem(option.id, true, true);
                return;
            }
        }
    }
    checkAutoDisabled() {
        const state = this.state;
        const doNotCheck = this.disabled || this.isPartial || !state.autoDisabled;
        if (doNotCheck) {
            return;
        }
        const nb = state.totalAllOptions;
        const value = state.internalValue;
        const hasValue = Array.isArray(value) ? value.length > 0 : value !== null;
        const isEmpty = nb === 0;
        const hasOnlyOneOption = nb === 1 && hasValue && !state.allowClearSelection;
        if (hasOnlyOneOption || isEmpty) {
            this.commit('isOpen', false);
            this.commit('disabled', true);
        }
        else {
            this.commit('disabled', false);
        }
    }
    checkHideFilter() {
        if (this.params && this.params.hideFilter !== 'auto') {
            return;
        }
        const state = this.state;
        if (state.multiple || this.isPartial) {
            state.hideFilter = false;
        }
        else {
            state.hideFilter = state.totalAllOptions <= this.itemsPerPage;
        }
    }
    /* }}} */
    /* }}} */
    /* {{{ watch */
    onOptionsChange() {
        this.cacheItem.clear();
        this.buildAllOptions();
        this.assertCorrectValue();
        this.buildSelectedOptions();
    }
    onValueChange() {
        const value = typeof this.value === 'undefined' ? null : this.value;
        this.commit('internalValue', value);
    }
    onSelectionExcludedChange() {
        this.commit('selectionIsExcluded', this.selectionIsExcluded);
    }
    onDisabledChange() {
        this.commit('disabled', this.disabled);
    }
    onFilteredChange() {
        let areAllSelected = false;
        if (this.hasAllItems) {
            const selectionIsExcluded = +this.state.selectionIsExcluded;
            // tslint:disable-next-line:no-bitwise
            areAllSelected = this.state.filteredOptions.every((item) => !!(+item.selected ^ selectionIsExcluded));
        }
        this.state.status.areAllSelected = areAllSelected;
    }
    onInternalValueChange() {
        this.buildSelectedOptions();
    }
    onAllOptionChange() {
        this.checkAutoSelect();
        this.checkAutoDisabled();
    }
    onTotalAllOptionsChange() {
        this.checkHideFilter();
    }
    /* }}} */
    /* {{{ life cycles methods */
    created() {
        const value = typeof this.value === 'undefined' ? null : this.value;
        /* set initial value for non reactive attribute */
        this.requestId = 0;
        this.cacheRequest = new Map();
        this.state = Object.assign(this.state, this.params, {
            internalValue: value,
            selectionIsExcluded: this.selectionIsExcluded,
            disabled: this.disabled,
        });
        this.checkHideFilter();
        if (this.texts) {
            this.changeTexts(this.texts);
        }
        this.addGroups(this.groups);
        this.buildAllOptions();
        this.assertCorrectValue();
        this.buildSelectedOptions();
    }
};
__decorate([
    Prop()
], SelecticStore.prototype, "value", void 0);
__decorate([
    Prop({ default: false })
], SelecticStore.prototype, "selectionIsExcluded", void 0);
__decorate([
    Prop({ default: false })
], SelecticStore.prototype, "disabled", void 0);
__decorate([
    Prop()
], SelecticStore.prototype, "options", void 0);
__decorate([
    Prop({ default: () => [] })
], SelecticStore.prototype, "groups", void 0);
__decorate([
    Prop()
], SelecticStore.prototype, "texts", void 0);
__decorate([
    Prop()
], SelecticStore.prototype, "params", void 0);
__decorate([
    Prop()
], SelecticStore.prototype, "fetchCallback", void 0);
__decorate([
    Prop()
], SelecticStore.prototype, "getItemsCallback", void 0);
__decorate([
    Watch('options')
], SelecticStore.prototype, "onOptionsChange", null);
__decorate([
    Watch('value')
], SelecticStore.prototype, "onValueChange", null);
__decorate([
    Watch('selectionIsExcluded')
], SelecticStore.prototype, "onSelectionExcludedChange", null);
__decorate([
    Watch('disabled')
], SelecticStore.prototype, "onDisabledChange", null);
__decorate([
    Watch('state.filteredOptions')
], SelecticStore.prototype, "onFilteredChange", null);
__decorate([
    Watch('state.internalValue')
], SelecticStore.prototype, "onInternalValueChange", null);
__decorate([
    Watch('state.allOptions')
], SelecticStore.prototype, "onAllOptionChange", null);
__decorate([
    Watch('state.totalAllOptions')
], SelecticStore.prototype, "onTotalAllOptionsChange", null);
SelecticStore = __decorate([
    Component
], SelecticStore);
var SelecticStore$1 = SelecticStore;

export default SelecticStore$1;
export { changeTexts };
