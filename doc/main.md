# Selectic Documentation

## Configuration

* Build a select from a list [(detail)](./list.md)
* Support DOM attributes [(detail)](./domProperties.md)
  * value
  * disabled
  * multiple
  * placeholder
* Extended attributes [(detail)](./extendedProperties.md)
* Dynamic list [(detail)](./dynamic.md)
  * multiple
  * optgroup
* Advanced configuration [(detail)](./params.md)
* Change texts [(detail)](./changeText.md)

## Events

* input
* change

## Methods

* clearCache(forceReset?: boolean): void;
* changeTexts(texts: PartialMessages): void;
* getValue(): SelectedValue;
* getSelectedItems(): OptionValue | OptionValue[];
* isEmpty(): boolean;
