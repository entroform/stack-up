import {
  DOMOffset,
  DOMStyle,
  DOMUtil,
  Util,
  Viewport,
} from '@nekobird/rocket';

import {
  STACKUP_DEFAULT_CONFIG,
  StackUpConfig,
  StackUpContainerScaleData,
} from './stack-up-config';

import {
  StackUpLayout,
} from './stack-up-layout';

export interface StackUpItem {
  item: HTMLElement;

  left: number;
  top: number;
  height: number;

  currentLeft: number;
  currentTop: number;

  requireMove: boolean;
}

export class StackUp {

  public config: StackUpConfig;
  public layout: StackUpLayout;

  public containerElement?: HTMLElement;
  public itemElements?: HTMLElement[];

  public boundaryHeight: number = 0;
  public boundaryWidth: number = 0;

  public containerWidth: number = 0;
  public containerHeight: number = 0;
  
  public previousContainerWidth: number = 0;
  public previousContainerHeight: number = 0;

  public numberOfColumns: number = 0;
  public items: StackUpItem[] = [];

  public resizeDebounceTimeout?: number;

  public isTransitioning: boolean = false;

  private doneTransitioning?: Function;

  constructor(config?: Partial<StackUpConfig>) {
    this.config = Object.assign({}, STACKUP_DEFAULT_CONFIG);
    this.setConfig(config);
    this.layout = new StackUpLayout(this, this.config.layout);
    return this;
  }

  public setConfig(config?: Partial<StackUpConfig>): this {
    if (typeof config === 'object') Object.assign(this.config, config);
    return this;
  }

  public initialize(): Promise<void> {
    return this.config
      .beforeInitialize(this)
      .then(() => {
        window.removeEventListener('resize', this.eventHandlerResize);
        window.addEventListener('resize', this.eventHandlerResize);
    
        this.boundaryUpdate();

        // Get container and item elements and set them up.
        this.getElements();
        this.populateItems();

        // Update layout and stack.
        this.updateNumberOfColumns();
        this.applyLayout();
        return this.draw();
      })
      .catch(() => Promise.reject(new Error('StackUp: config.beforeInitialize promise reject.')));
  }

  private getElements(): this {
    this.getContainerElement();
    this.getItemElements();
    return this;
  }

  private getContainerElement(): this {
    const containerElement = this.config.getContainerElement();
    if (containerElement === null) {
      throw new Error('StackUp: Fail to get container element.');
    } else {
      this.containerElement = containerElement;
    }
    return this;
  }

  private getItemElements(): this {
    const itemElements = this.config.getItemElements();
    if (itemElements === null) {
      throw new Error('StackUp: Fail to get item elements.');
    } else {
      if (Array.isArray(itemElements) === true) {
        this.itemElements = itemElements as HTMLElement[];
      } else {
        this.itemElements = Array.from(itemElements);
      }
    }
    return this;
  }

  private boundaryUpdate(): this {
    if (
      this.config.boundary !== window
      && DOMUtil.isHTMLElement(this.config.boundary) === true
    ) {
      const boundary = this.config.boundary as HTMLElement;
      let horizontal = 0, vertical = 0;
      if (DOMStyle.getStyleValue(boundary, 'boxSizing') === 'border-box') {
        const horizontalBorderWidths = DOMStyle.getHorizontalBorderWidths(boundary);
        const horizontalPaddings = DOMStyle.getHorizontalPaddings(boundary);
        const verticalBorderWidths = DOMStyle.getVerticalBorderWidths(boundary);
        const verticalPaddings = DOMStyle.getVerticalPaddings(boundary);
        horizontal = horizontalBorderWidths + horizontalPaddings;
        vertical = verticalBorderWidths + verticalPaddings;
      }
      this.boundaryWidth = boundary.offsetWidth - horizontal;
      this.boundaryHeight = boundary.offsetHeight - vertical;
    } else {
      this.boundaryWidth = Viewport.width;
      this.boundaryHeight = Viewport.height;
    }
    return this;
  }

  private resizeDebounce = (fn: Function, delay: number): void => {
    clearTimeout(this.resizeDebounceTimeout);
    this.resizeDebounceTimeout = window.setTimeout(fn, delay);
  }

  private eventHandlerResizeComplete = (): void => {
    if (
      this.calculateNumberOfColumns() !== this.numberOfColumns
      && this.config.isFluid === true
    ) this.restack();
  }

  private eventHandlerResize = (event: Event): void => {
    this.boundaryUpdate();
    this.resizeDebounce(
      this.eventHandlerResizeComplete,
      this.config.debounceResizeWait
    );
  }

  // Update grid selectors. (1) - reset
  // Required stack-up.initialize to be called first.

  public updatePreviousContainerSize(): this {
    if (DOMUtil.isHTMLElement(this.containerElement) === true) {
      const containerElement = this.containerElement as HTMLElement;
      this.previousContainerWidth = containerElement.offsetWidth;
      this.previousContainerHeight = containerElement.offsetHeight;
    }
    return this;
  }

  // This only updates this.items, it does not update the selectors

  private appendItem(item: HTMLElement): boolean {
    if (DOMUtil.isHTMLElement(this.containerElement) === true) {
      const { x: left, y: top } = DOMOffset.getElementOffsetFrom(item, this.containerElement as HTMLElement);
      this.items.push(
        {
          item,

          left, top,
          height: item.offsetHeight,

          currentLeft: left,
          currentTop: top,

          requireMove: false,
        }
      );
      return true;
    }
    return false;
  }

  // Populate grid items (2) - reset
  private populateItems(): this {
    // Clear items before populating
    this.items = [];
    if (Array.isArray(this.itemElements) === true) {
      const itemElements = this.itemElements as HTMLElement[];
      itemElements.forEach(item => {
        if (DOMUtil.isHTMLElement(item) === true)
          this.appendItem(item);
      });
    }
    return this;
  }

  private calculateNumberOfColumns(): number {
    let numberOfColumns: number;

    if (this.config.isFluid === true) {
      numberOfColumns = Math.floor(
        (this.boundaryWidth - this.config.gutter) /
        (this.config.columnWidth + this.config.gutter)
      );
    } else {
      numberOfColumns = this.config.numberOfColumns;
    }

    if (numberOfColumns > this.items.length)
      numberOfColumns = this.items.length;

    if (
      this.items.length === 0
      || numberOfColumns <= 0
    ) numberOfColumns = 1;
    
    return numberOfColumns;
  }

  // Update numberOfColumns (3) - stack
  private updateNumberOfColumns(): this {
    this.numberOfColumns = this.calculateNumberOfColumns();
    return this;
  }

  // Scale container and move items (5) - stack
  public async draw(): Promise<void> {
    if (
      this.isTransitioning === false &&
      DOMUtil.isHTMLElement(this.containerElement) === true
    ) {
      const containerElement = this.containerElement as HTMLElement;

      this.isTransitioning = true;

      this.containerWidth = (this.config.columnWidth + this.config.gutter) * this.numberOfColumns;

      const finalHeight = this.containerHeight + this.config.gutter;
      const finalWidth = this.containerWidth + this.config.gutter;

      let containerScaleData = this.composeContainerScaleData(finalWidth, finalHeight);
      this.prepareItemsBeforeMove();
      try {
        await this.config.beforeTransition(containerScaleData, this.items, this);
        await this.config.scaleContainerInitial(containerElement, containerScaleData, this);
        await this.config.beforeMove(this.items, this);
        await this.moveItems();
        await this.config.afterMove(this.items, this);
        this.updatePreviousContainerSize();
        containerScaleData = this.composeContainerScaleData(finalWidth, finalHeight);
        await this.config.scaleContainerFinal(containerElement, containerScaleData, this);
        this.endTransition();
        return Promise.resolve();
      } catch {
        this.endTransition();
        return Promise.reject(new Error('StackUp.draw: Fail to transition items and container.'));
      }
    }
    return Promise.resolve();
  }

  private moveItems(): Promise<void> {
    const moveItem: (item: StackUpItem) => Promise<void> = item => {
      return this.config.moveItem(item, this);
    };
    if (this.config.moveInSequence === true) {
      return Util.promiseEach<StackUpItem>(this.items, moveItem);
    } else {
      const moveItems: Promise<void>[] = [];
      this.items.forEach(item => {
        moveItems.push(moveItem(item));
      });
      return Promise
        .all(moveItems)
        .then(() => Promise.resolve());
    }
  }

  private endTransition(): this {
    this.updateItemsCurrentOffset();
    this.isTransitioning = false;
    this.config.afterTransition();
    if (typeof this.doneTransitioning === 'function') {
      this.doneTransitioning();
      this.doneTransitioning = undefined;
    }
    return this;
  }

  private composeContainerScaleData(width: number, height: number): StackUpContainerScaleData  {
    const maxWidth = Math.max(this.previousContainerWidth, width);
    const maxHeight = Math.max(this.previousContainerHeight, height);
    const requireScale = (
      this.previousContainerWidth !== width
      || this.previousContainerHeight !== height
    );
    return {
      width, height,
      currentWidth: this.previousContainerWidth,
      currentHeight: this.previousContainerHeight,
      maxWidth, maxHeight,
      requireScale,
    };
  }

  private prepareItemsBeforeMove(): this {
    this.items.forEach(item => {
      const requireMove: boolean = (
        item.currentLeft !== item.left
        || item.currentTop !== item.top
      );
      item.requireMove = requireMove;
    });
    return this;
  }

  private updateItemsCurrentOffset(): this {
    this.items.forEach(item => {
      item.currentLeft = item.left;
      item.currentTop = item.top;
    });
    return this;
  }

  //stack (4)
  //layout updates the containerHeight and updates items

  private applyLayout(): this {
    this.layout.setup();
    if (this.items.length) this.layout.loop();
    return this;
  }

  private resetLayout(): this {
    this.containerHeight = 0;
    this.layout.columnPointer = 0;
    return this;
  }

  // This should be called if any item(s)
  // is modified, added, or removed.
  public reset(): Promise<void> {
    return new Promise(resolve => {
      const reset = () => {
        this.containerWidth = 0;
        this.containerHeight = 0;
        this.items = [];
        this
          .getElements()
          .populateItems()
          .resetLayout()
          .restack()
        resolve();
      };
      if (this.isTransitioning === true) {
        this.doneTransitioning = reset;
      } else {
        reset();
      }
    });
  }

  public append(items: HTMLElement | HTMLElement[]): Promise<void> {
    return new Promise((resolve, reject) => {

      const append = () => {
        if (Array.isArray(items) === true) {
          items = items as HTMLElement[];
          items.forEach(item => {
            if (DOMUtil.isHTMLElement(item) === true) {
              const itemIndex = this.items.length;
              if (this.appendItem(item) === true) {
                this.layout.plot(itemIndex);
              } else {
                reject(new Error('StackUp.append: container element is undefined or not HTMLElement.'));
              }
            } else {
              reject(new Error('StackUp.append: item is undefined or not HTMLElement.'));
            }
          });
        } else {
          if (DOMUtil.isHTMLElement(items) === true) {
            const itemIndex = this.items.length;
            if (this.appendItem(items as HTMLElement) === true) {
              this.layout.plot(itemIndex);
            } else {
              reject(new Error('StackUp.append: container element is undefined or not HTMLElement.'));
            }
          } else {
            reject(new Error('StackUp.append: item is undefined or not HTMLElement.'));
          }
        }
        this
          .draw()
          .then(() => resolve())
          .catch(() => reject());
      };

      if (this.isTransitioning === true) {
        this.doneTransitioning = append;
      } else {
        append();
      }
    });
  }

  public restack(): Promise<void> {
    return new Promise(resolve => {
      const restack = () => {
        this
          .updateNumberOfColumns()
          .resetLayout()
          .applyLayout()
          .draw();
        resolve();
      };
      if (this.isTransitioning === true) {
        this.doneTransitioning = restack;
      } else {
        restack();
      }
    });
  }
}
