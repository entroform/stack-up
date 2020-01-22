import {
  promiseEach,
} from '@nekobird/piko';

import {
  getBoxSizing,
  getElementOffsetFromAnotherElement,
  getTotalHorizontalBorderWidths,
  getTotalHorizontalPaddings,
  getTotalVerticalBorderWidths,
  getTotalVerticalPaddings,
  isHTMLElement,
  toHTMLElementArray,
  Viewport,
} from '@nekobird/doko';

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

  public containerElement: HTMLElement | null = null;
  public itemElements: HTMLElement[] | null = null;

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
    this.config = {...STACKUP_DEFAULT_CONFIG};

    this.setConfig(config);

    this.layout = new StackUpLayout(this, this.config.layout);

    return this;
  }

  public setConfig(config?: Partial<StackUpConfig>): this {
    if (typeof config === 'object') {
      Object.assign(this.config, config);
    }

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
      .catch(() =>
        Promise.reject(new Error('@nekobird/stack-up: StackUp.config.beforeInitialize promise reject.'))
      );
  }

  private getElements(): this {
    this.getContainerElement();

    this.getItemElements();

    return this;
  }

  private getContainerElement(): this {
    const containerElement = this.config.getContainerElement();

    if (isHTMLElement(containerElement)) {
      this.containerElement = containerElement;
    } else {
      throw new Error('@nekobird/stack-up: StackUp.getContainerElement: Fail to get container element.');
    }

    return this;
  }

  private getItemElements(): this {
    const itemElements = this.config.getItemElements();

    if (!itemElements) {
      throw new Error('@nekobird/stack-up: StackUp.getItemElements: Fail to get item elements.');
    } else {
      this.itemElements = toHTMLElementArray(itemElements);
    }

    return this;
  }

  private boundaryUpdate(): this {
    if (
      this.config.boundary !== window
      && isHTMLElement(this.config.boundary)
    ) {
      const boundary = this.config.boundary as HTMLElement;

      let horizontal = 0;
      let vertical = 0;

      if (getBoxSizing(boundary) === 'border-box') {
        const horizontalBorderWidths = getTotalHorizontalBorderWidths(boundary);
        const horizontalPaddings = getTotalHorizontalPaddings(boundary);

        const verticalBorderWidths = getTotalVerticalBorderWidths(boundary);
        const verticalPaddings = getTotalVerticalPaddings(boundary);

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
  };

  private eventHandlerResizeComplete = (): void => {
    if (
      this.calculateNumberOfColumns() !== this.numberOfColumns
      && this.config.isFluid
    ) {
      this.restack();
    }
  };

  private eventHandlerResize = (event: Event): void => {
    const { resizeDebounceDelayInSeconds } = this.config;

    this.boundaryUpdate();

    this.resizeDebounce(this.eventHandlerResizeComplete, resizeDebounceDelayInSeconds * 1000);
  };

  // Update grid selectors. (1) - reset
  // Required stack-up.initialize to be called first.

  public updatePreviousContainerSize(): this {
    if (isHTMLElement(this.containerElement)) {
      const containerElement = this.containerElement as HTMLElement;

      this.previousContainerWidth = containerElement.offsetWidth;
      this.previousContainerHeight = containerElement.offsetHeight;
    }

    return this;
  }

  // This only updates this.items, it does not update the selectors

  private appendItem(item: HTMLElement): boolean {
    if (isHTMLElement(this.containerElement)) {
      const containerElement = this.containerElement as HTMLElement;

      const offset = getElementOffsetFromAnotherElement(item, containerElement);

      const { left, top } = offset;

      this.items.push({
        item,
        left,
        top,
        height: item.offsetHeight,
        currentLeft: left,
        currentTop: top,
        requireMove: false,
      });

      return true;
    }

    return false;
  }

  // Populate grid items (2) - reset
  private populateItems(): this {
    // Clear items before populating.
    this.items = [];

    if (Array.isArray(this.itemElements)) {
      const itemElements = this.itemElements as HTMLElement[];

      itemElements.forEach(item => this.appendItem(item));
    }

    return this;
  }

  private calculateNumberOfColumns(): number {
    const { columnWidth, gutter, isFluid, numberOfColumns } = this.config;

    let calculatedNumberOfColumns: number;

    if (isFluid === true) {
      calculatedNumberOfColumns = Math.floor(
        (this.boundaryWidth - gutter) / (columnWidth + gutter),
      );
    } else {
      calculatedNumberOfColumns = numberOfColumns;
    }

    if (calculatedNumberOfColumns > this.items.length) {
      calculatedNumberOfColumns = this.items.length;
    }

    if (this.items.length === 0 || calculatedNumberOfColumns <= 0) {
      calculatedNumberOfColumns = 1;
    }

    return calculatedNumberOfColumns;
  }

  // Update numberOfColumns (3) - stack
  private updateNumberOfColumns(): this {
    this.numberOfColumns = this.calculateNumberOfColumns();

    return this;
  }

  // Scale container and move items (5) - stack
  public async draw(): Promise<void> {
    if (
      !this.isTransitioning
      && isHTMLElement(this.containerElement)
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

        return Promise.reject(
          new Error('@nekobird/stack-up: StackUp.draw: Fail to transition items and container.'),
        );
      }
    }

    return Promise.resolve();
  }

  private moveItems(): Promise<void> {
    const { moveInSequence } = this.config;

    const moveItem: (item: StackUpItem) => Promise<void> = item => (
      this.config.moveItem(item, this)
    );

    if (moveInSequence) {
      return promiseEach<StackUpItem>(this.items, moveItem);
    } else {
      const moveItems: Promise<void>[] = [];

      this.items.forEach(item => moveItems.push(moveItem(item)));

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

  private composeContainerScaleData(width: number, height: number): StackUpContainerScaleData {
    const maxWidth = Math.max(this.previousContainerWidth, width);
    const maxHeight = Math.max(this.previousContainerHeight, height);

    const requireScale = this.previousContainerWidth !== width || this.previousContainerHeight !== height;

    return {
      width,
      height,

      currentWidth: this.previousContainerWidth,
      currentHeight: this.previousContainerHeight,

      maxWidth,
      maxHeight,

      requireScale,
    };
  }

  private prepareItemsBeforeMove(): this {
    this.items.forEach(item => {
      item.requireMove = item.currentLeft !== item.left || item.currentTop !== item.top;
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

    if (this.items.length) {
      this.layout.loop();
    }

    return this;
  }

  private resetLayout(): this {
    this.containerHeight = 0;

    this.layout.columnPointer = 0;

    return this;
  }

  public append(items: HTMLElement | HTMLElement[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const append = () => {
        if (Array.isArray(items) === true) {
          items = items as HTMLElement[];

          items.forEach(item => {
            if (isHTMLElement(item) === true) {
              const itemIndex = this.items.length;

              if (this.appendItem(item) === true) {
                this.layout.plot(itemIndex);
              } else {
                reject(new Error('@nekobird/stack-up: StackUp.append: container element is undefined or not HTMLElement.'));
              }
            } else {
              reject(new Error('@nekobird/stack-up: StackUp.append: item is undefined or not HTMLElement.'));
            }
          });
        } else {
          if (isHTMLElement(items)) {
            const itemIndex = this.items.length;

            if (this.appendItem(items as HTMLElement)) {
              this.layout.plot(itemIndex);
            } else {
              reject(new Error('@nekobird/stack-up: StackUp.append: container element is undefined or not HTMLElement.'));
            }
          } else {
            reject(new Error('@nekobird/stack-up: StackUp.append: item is undefined or not HTMLElement.'));
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

  // This should be called if any item(s)
  // is modified, added, or removed.
  public reset(): Promise<void> {
    return new Promise(resolve => {
      const reset = () => {
        this.containerWidth  = 0;
        this.containerHeight = 0;

        this.items = [];

        this
          .getElements()
          .populateItems()
          .resetLayout()
          .restack();

        resolve();
      };

      if (this.isTransitioning === true) {
        this.doneTransitioning = reset;
      } else {
        reset();
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

  public updateElements(): this {
    this.getElements();

    return this;
  }

  public destroy(): this {
    window.removeEventListener('resize', this.eventHandlerResize);

    return this;
  }
}
