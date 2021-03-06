# DOM properties

[Back to documentation index](main.md)

`<select>` has several properties which can be used in the same way in `selectic`.

## id

It defines a unique identifier (ID) which must be unique in the whole document. It is applied on an `<input>` element which contains the current state.

```html
<selectic
    options={['item1', 'item2']}
    value="item2"
    id="example"
/>
```
```javascript
document.getElementById('example').value; // 'item2'
```


## value

The selected value.  This is the initial value, and it can be altered to change the current selection.

This is the id of the selected option or an array of id (if `multiple` is set).

```html
<selectic
    options={['item1', 'item2']}
    value="item2"
/>
```

## disabled

When disabled is set, `selectic` cannot be open nor changed.

```html
<selectic
    options={['item1', 'item2']}
    disabled
/>
```

## multiple

If set then several options can be selected.

The `value` will be an array.

```html
<selectic
    options={['item1', 'item2', 'item3']}
    multiple
/>
```

## placeholder

`placeholder` is not really a DOM attribute as it doesn't exist on `<select>` element. But it behaves like placeholder on `<input>`.

It displays the given text if no option is selected.

```html
<selectic
    options={['item1', 'item2', 'item3']}
    placeholder="choose an item"
/>
```

## title

It is added to th emain element, and it behaves like `title` attribute of any HTML element when mouse is over the selected area.

```html
<selectic
    options={['item1', 'item2', 'item3']}
    title="An information about this component"
/>
```

## className

Type: `string`

This is an alias of `class` for usage where it is not possible to use this reserved keyword.

```html
<selectic
    options={['item1', 'item2']}
    value="item2"
    className="my-custom-class another-class"
/>
```

# Not supported attributes

These attributes are currently not supported:

* autocomplete
* autofocus
* form
* name
* required
* size
* readonly
