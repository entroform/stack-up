# 🏗 stack-up

A simple, yet powerful, layout library to help you neatly stack fixed width and variable height elements.

## Install

Add **stack-up** to your project.

```
npm i @nekobird/stack-up
```

## Usage

Import it into your project.

```typescript
import { StackUp } from '@nekobird/stack-up';
```

## Example HTML and CSS setup

Basic HTML setup.

```html
<div id="js-stackup-container" class="grid__container">
  <div class="grid__item">...</div>
  <div class="grid__item">...</div>
  <div class="grid__item">...</div>
</div>
```

Some basic CSS setup.

```css
.grid__container {
  position: relative
}

.grid__item {
  position: absolute;
}

.grid__item img {
  width: 100%;
}
```

## Config

```typescript
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
  debounceResizeWait: 250,

  // This works 
  moveInSequence: false,

  // This function takes in a StackUp object.
  // This returns a Promise object.
  beforeInitialize: stackup => Promise.resolve(),

  // beforeTransition
  // scaleContainerInitial
  // beforeMove
  // moveItem
  // afterMove
  // scaleContainerFinal
  // afterTransition

  // containerInstruction
  // StackUpContainerScaleData
  // currentWidth
  // currentHeight
  // maxWidth
  // maxHeight
  // width
  // height
  // requireScale

  // StackUpItem
  // This is an array of 
  // item: HTMLElement;
  // left: number;
  // top: number;
  // height: number;
  // currentLeft: number;
  // currentTop: number;
  // requireMove: boolean;

  beforeTransition: (containerInstruction: StackUpContainerScaleData, items: StackUpItem[], stackup: StackUp) => Promise<void>;

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
