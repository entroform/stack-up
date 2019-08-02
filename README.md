# stack-up

🏗 An efficient and optimized way of stacking fixed width, variable height elements.

## Install

Install via npm:
```
$ npm install @nekobird/stack-up
```

## Usage

```typescript

// Import StackUp.
import { StackUp } from '@nekobird/stack-up';

const boundaryElement = document.getElementById('boundary');

// StackUp takes in a config object.
const stackup = new StackUp({

  // Boundary defines the area in which StackUp will flow the elements into.
  // If isFluid is set to true, StackUp will calculate the number of columns
  // based on the width of this element.
  // By default it is set to window.
  boundary: boundaryElement;

  // StackUp will use this function to update container and item elements.
  getContainerElement: () => document.getElementById('container'),
  getItemElements: () => document.querySelectorAll('#container > .item'),

  // Fixed width StackUp will use to define the column and all items.
  columnWidth: 320,

  // If isFluid is set to false, StackUp will use this to determine the number of columns.
  numberOfColumns: 3;

  // Spacing between items and inside of container.
  gutter: 20;

  // There are, currently, two options for layout: 'ordinal' and 'optimized'.
  // ordinal: StackUp will stack the items in order of how it is in the DOM.
  // optimized: StackUp will try to stack the items in such a way that the columns height will
  // even out. This is the default option.
  layout: 'optimized',

  // If this is set to true, StackUp will use the boundary width to determine the number of columns.
  // StackUp will automatically restack items when the window is resized.
  // You can adjust the resize debounce time below.
  isFluid: false,
  
  // This debounce wait time is in ms.
  debounceResizeWait: 250;


  moveInSequence: boolean;

  beforeInitialize: (stackup: StackUp) => Promise<void>;

  beforeTransition: (container: StackUpContainerScaleData, items: StackUpItem[], stackup: StackUp) => Promise<void>;
  afterTransition: () => void;

  scaleContainerInitial: (container: HTMLElement, data: StackUpContainerScaleData, stackup: StackUp) => Promise<void>;
  scaleContainerFinal: (container: HTMLElement, data: StackUpContainerScaleData, stackup: StackUp) => Promise<void>;

  beforeMove: (items: StackUpItem[], stackup: StackUp) => Promise<void>;
  moveItem: (item: StackUpItem, stackup: StackUp) => Promise<void>;
  afterMove: (items: StackUpItem[], stackup: StackUp) => Promise<void>;
});
```

## Append

## Reset

## Restack