'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var vtyx = require('vtyx');

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
    unknownPropertyValue: 'property "%s" has incorrect values.',
};
let closePreviousSelectic;
/* {{{ Static */
function changeTexts(texts) {
    messages = Object.assign(messages, texts);
}
/* }}} */
let SelecticStore = class SelecticStore extends vtyx.Vue {
    constructor() {
        /* {{{ props */
        super(...arguments);
        /* }}} */
        /* {{{ data */
        /* Number of items displayed in a page (before scrolling) */
        this.itemsPerPage = 10;
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
            dynOptions: [],
            filteredOptions: [],
            selectedOptions: null,
            totalAllOptions: Infinity,
            totalDynOptions: Infinity,
            totalFilteredOptions: Infinity,
            groups: new Map(),
            offsetItem: 0,
            activeItemIdx: -1,
            pageSize: 100,
            listPosition: 'auto',
            optionBehaviorOperation: 'sort',
            optionBehaviorOrder: ['O', 'D', 'E'],
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
        this.activeOrder = 'D';
        this.dynOffset = 0;
        /* }}} */
    }
    /* }}} */
    /* {{{ computed */
    /* Number of item to pre-display */
    get marginSize() {
        return this.state.pageSize / 2;
    }
    get isPartial() {
        const state = this.state;
        let isPartial = typeof this.fetchCallback === 'function';
        if (isPartial && state.optionBehaviorOperation === 'force' && this.activeOrder !== 'D') {
            isPartial = false;
        }
        return isPartial;
    }
    get hasAllItems() {
        const nbItems = this.state.totalFilteredOptions + this.state.groups.size;
        return this.state.filteredOptions.length >= nbItems;
    }
    get hasFetchedAllItems() {
        const state = this.state;
        if (!this.isPartial) {
            return true;
        }
        return state.dynOptions.length === state.totalDynOptions;
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
                if (value) {
                    this.buildFilteredOptions();
                }
                else {
                    this.buildAllOptions(true);
                }
                break;
            case 'isOpen':
                if (closePreviousSelectic === this.closeSelectic) {
                    closePreviousSelectic = undefined;
                }
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
                    if (!this.keepOpenWithOtherSelectic) {
                        closePreviousSelectic = this.closeSelectic;
                    }
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
        this.state.totalDynOptions = total;
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
        if (id === null) {
            return true;
        }
        return !!this.getValue(id);
    }
    getValue(id) {
        function findId(option) {
            return option.id === id;
        }
        return this.state.filteredOptions.find(findId) ||
            this.state.dynOptions.find(findId) ||
            this.getListOptions().find(findId) ||
            this.getElementOptions().find(findId);
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
    /* XXX: This is not a computed property to avoid consuming more memory */
    getListOptions() {
        const options = this.options;
        const listOptions = [];
        if (!Array.isArray(options)) {
            return listOptions;
        }
        options.forEach((option) => {
            /* manage simple string */
            if (typeof option === 'string') {
                listOptions.push({
                    id: option,
                    text: option,
                });
                return;
            }
            const group = option.group;
            const subOptions = option.options;
            /* check for groups */
            if (group && !this.state.groups.has(group)) {
                this.state.groups.set(group, String(group));
            }
            /* check for sub options */
            if (subOptions) {
                const groupId = option.id;
                this.state.groups.set(groupId, option.text);
                subOptions.forEach((subOpt) => {
                    subOpt.group = groupId;
                });
                listOptions.push(...subOptions);
                return;
            }
            listOptions.push(option);
        });
        return listOptions;
    }
    /* XXX: This is not a computed property to avoid consuming more memory */
    getElementOptions() {
        const options = this.childOptions;
        const childOptions = [];
        if (!Array.isArray(options)) {
            return childOptions;
        }
        options.forEach((option) => {
            const group = option.group;
            const subOptions = option.options;
            /* check for groups */
            if (group && !this.state.groups.has(group)) {
                this.state.groups.set(group, String(group));
            }
            /* check for sub options */
            if (subOptions) {
                const groupId = option.id;
                this.state.groups.set(groupId, option.text);
                subOptions.forEach((subOpt) => {
                    subOpt.group = groupId;
                });
                childOptions.push(...subOptions);
                return;
            }
            childOptions.push(option);
        });
        return childOptions;
    }
    buildAllOptions(keepFetched = false) {
        const allOptions = [];
        let listOptions = [];
        let elementOptions = [];
        const optionBehaviorOrder = this.state.optionBehaviorOrder;
        let length = Infinity;
        const arrayFromOrder = (orderValue) => {
            switch (orderValue) {
                case 'O': return listOptions;
                case 'D': return this.state.dynOptions;
                case 'E': return elementOptions;
            }
            return [];
        };
        const lengthFromOrder = (orderValue) => {
            switch (orderValue) {
                case 'O': return listOptions.length;
                case 'D': return this.state.totalDynOptions;
                case 'E': return elementOptions.length;
            }
            return 0;
        };
        if (!keepFetched) {
            if (this.isPartial) {
                this.state.totalAllOptions = Infinity;
                this.state.totalDynOptions = Infinity;
            }
            else {
                this.state.totalDynOptions = 0;
            }
        }
        listOptions = this.getListOptions();
        elementOptions = this.getElementOptions();
        if (this.state.optionBehaviorOperation === 'force') {
            const orderValue = optionBehaviorOrder.find((value) => lengthFromOrder(value) > 0);
            allOptions.push(...arrayFromOrder(orderValue));
            length = lengthFromOrder(orderValue);
            this.activeOrder = orderValue;
            this.dynOffset = 0;
        }
        else {
            /* sort */
            let offset = 0;
            for (const orderValue of optionBehaviorOrder) {
                const list = arrayFromOrder(orderValue);
                const lngth = lengthFromOrder(orderValue);
                if (orderValue === 'D') {
                    this.dynOffset = offset;
                }
                else {
                    offset += lngth;
                }
                allOptions.push(...list);
                if (list.length < lngth) {
                    /* All dynamic options are not fetched yet */
                    break;
                }
            }
            this.activeOrder = 'D';
            length = optionBehaviorOrder.reduce((total, orderValue) => total + lengthFromOrder(orderValue), 0);
        }
        this.state.allOptions = allOptions;
        if (keepFetched) {
            this.state.totalAllOptions = length;
        }
        else {
            if (!this.isPartial) {
                this.state.totalAllOptions = allOptions.length;
            }
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
        let filteredOptionsLength = this.state.filteredOptions.length;
        if (this.hasAllItems) {
            /* Everything has already been fetched and stored in filteredOptions */
            return;
        }
        /* Check if all options have been fetched */
        if (this.hasFetchedAllItems) {
            if (!search) {
                this.state.filteredOptions = this.buildGroupItems(allOptions);
                this.state.totalFilteredOptions = this.state.filteredOptions.length;
                return;
            }
            const options = this.filterOptions(allOptions, search);
            this.state.filteredOptions = options;
            this.state.totalFilteredOptions = this.state.filteredOptions.length;
            return;
        }
        /* When we only have partial options */
        const offsetItem = this.state.offsetItem;
        const marginSize = this.marginSize;
        const endIndex = offsetItem + marginSize;
        if (endIndex <= filteredOptionsLength) {
            return;
        }
        if (!search && endIndex <= allOptionsLength) {
            this.state.filteredOptions = this.buildGroupItems(allOptions);
            this.state.totalFilteredOptions = totalAllOptions + this.state.groups.size;
            if (this.isPartial && this.state.totalDynOptions === Infinity) {
                this.fetchData();
            }
            return;
        }
        if (filteredOptionsLength === 0 && this.state.optionBehaviorOperation === 'sort') {
            this.addStaticFilteredOptions();
            filteredOptionsLength = this.state.filteredOptions.length;
            this.dynOffset = filteredOptionsLength;
            if (endIndex <= filteredOptionsLength) {
                return;
            }
        }
        await this.fetchData();
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
    async fetchData() {
        const state = this.state;
        if (!this.fetchCallback) {
            state.status.errorMessage = this.labels.noFetchMethod;
            return;
        }
        const search = state.searchText;
        const filteredOptionsLength = state.filteredOptions.length;
        const offsetItem = state.offsetItem;
        const pageSize = state.pageSize;
        const marginSize = this.marginSize;
        const endIndex = offsetItem + marginSize;
        /* Run the query */
        this.state.status.searching = true;
        /* Manage cases where offsetItem is not equal to the last item received */
        const offset = filteredOptionsLength - this.nbGroups(state.filteredOptions) - this.dynOffset;
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
                total = search ? state.totalFilteredOptions
                    : state.totalDynOptions;
                if (!isFinite(total)) {
                    total = result.length;
                }
            }
            if (!search) {
                /* update cache */
                state.totalDynOptions = total;
                state.dynOptions.splice(offset, limit, ...result);
                this.$nextTick(() => this.buildAllOptions(true));
            }
            /* Check request is not obsolete */
            if (requestId !== this.requestId) {
                return;
            }
            if (!search) {
                state.filteredOptions = this.buildGroupItems(state.allOptions);
            }
            else {
                const previousItem = state.filteredOptions[filteredOptionsLength - 1];
                const options = this.buildGroupItems(result, previousItem);
                const nbGroups1 = this.nbGroups(options);
                state.filteredOptions.splice(offset + this.dynOffset, limit + nbGroups1, ...options);
            }
            let nbGroups = state.groups.size;
            if (offset + limit >= total) {
                nbGroups = this.nbGroups(state.filteredOptions);
            }
            state.totalFilteredOptions = total + nbGroups + this.dynOffset;
            if (search && state.totalFilteredOptions <= state.filteredOptions.length) {
                this.addStaticFilteredOptions(true);
            }
            state.status.errorMessage = '';
        }
        catch (e) {
            state.status.errorMessage = e.message;
            if (!search) {
                state.totalDynOptions = 0;
                this.buildAllOptions(true);
            }
        }
        this.state.status.searching = false;
    }
    filterOptions(options, search) {
        if (!search) {
            return this.buildGroupItems(options);
        }
        /* Filter options on what is search for */
        const rgx = convertToRegExp(search, 'i');
        return this.buildGroupItems(options.filter((option) => rgx.test(option.text)));
    }
    addStaticFilteredOptions(fromDynamic = false) {
        const search = this.state.searchText;
        let continueLoop = fromDynamic;
        if (this.state.optionBehaviorOperation !== 'sort') {
            return;
        }
        for (const order of this.state.optionBehaviorOrder) {
            let options = [];
            if (order === 'D') {
                if (!continueLoop) {
                    return;
                }
                continueLoop = false;
                continue;
            }
            else if (continueLoop) {
                continue;
            }
            switch (order) {
                case 'O':
                    options = this.filterOptions(this.getListOptions(), search);
                    break;
                case 'E':
                    options = this.filterOptions(this.getElementOptions(), search);
                    break;
            }
            this.state.filteredOptions.push(...options);
            this.state.totalFilteredOptions += options.length;
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
            item = this.getValue(id);
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
    buildOptionBehavior(optionBehavior, state) {
        let [operation, order] = optionBehavior.split('-');
        let isValid = true;
        let orderArray;
        isValid = isValid && ['sort', 'force'].includes(operation);
        isValid = isValid && /^[ODE]+$/.test(order);
        if (!isValid) {
            this.state.status.errorMessage = this.labels.unknownPropertyValue.replace(/%s/, 'optionBehavior');
            operation = 'sort';
            orderArray = ['O', 'D', 'E'];
        }
        else {
            order += 'ODE';
            orderArray = order.split('');
            /* Keep only one letter for each of them */
            orderArray = Array.from(new Set(orderArray));
        }
        state.optionBehaviorOperation = operation;
        state.optionBehaviorOrder = orderArray;
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
        if (doNotCheck || !this.hasFetchedAllItems) {
            return;
        }
        const enabledOptions = state.allOptions.filter((opt) => !opt.disabled);
        const nb = enabledOptions.length;
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
    onChildOptionsChange() {
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
        const stateParam = Object.assign({}, this.params);
        if (stateParam.optionBehavior) {
            this.buildOptionBehavior(stateParam.optionBehavior, stateParam);
            delete stateParam.optionBehavior;
        }
        this.state = Object.assign(this.state, stateParam, {
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
    vtyx.Prop()
], SelecticStore.prototype, "value", void 0);
__decorate([
    vtyx.Prop({ default: false })
], SelecticStore.prototype, "selectionIsExcluded", void 0);
__decorate([
    vtyx.Prop({ default: false })
], SelecticStore.prototype, "disabled", void 0);
__decorate([
    vtyx.Prop()
], SelecticStore.prototype, "options", void 0);
__decorate([
    vtyx.Prop()
], SelecticStore.prototype, "childOptions", void 0);
__decorate([
    vtyx.Prop({ default: () => [] })
], SelecticStore.prototype, "groups", void 0);
__decorate([
    vtyx.Prop()
], SelecticStore.prototype, "texts", void 0);
__decorate([
    vtyx.Prop()
], SelecticStore.prototype, "params", void 0);
__decorate([
    vtyx.Prop()
], SelecticStore.prototype, "fetchCallback", void 0);
__decorate([
    vtyx.Prop()
], SelecticStore.prototype, "getItemsCallback", void 0);
__decorate([
    vtyx.Prop({ default: false })
], SelecticStore.prototype, "keepOpenWithOtherSelectic", void 0);
__decorate([
    vtyx.Watch('options')
], SelecticStore.prototype, "onOptionsChange", null);
__decorate([
    vtyx.Watch('childOptions')
], SelecticStore.prototype, "onChildOptionsChange", null);
__decorate([
    vtyx.Watch('value')
], SelecticStore.prototype, "onValueChange", null);
__decorate([
    vtyx.Watch('selectionIsExcluded')
], SelecticStore.prototype, "onSelectionExcludedChange", null);
__decorate([
    vtyx.Watch('disabled')
], SelecticStore.prototype, "onDisabledChange", null);
__decorate([
    vtyx.Watch('state.filteredOptions')
], SelecticStore.prototype, "onFilteredChange", null);
__decorate([
    vtyx.Watch('state.internalValue')
], SelecticStore.prototype, "onInternalValueChange", null);
__decorate([
    vtyx.Watch('state.allOptions')
], SelecticStore.prototype, "onAllOptionChange", null);
__decorate([
    vtyx.Watch('state.totalAllOptions')
], SelecticStore.prototype, "onTotalAllOptionsChange", null);
SelecticStore = __decorate([
    vtyx.Component
], SelecticStore);
var SelecticStore$1 = SelecticStore;

exports.changeTexts = changeTexts;
exports.default = SelecticStore$1;
