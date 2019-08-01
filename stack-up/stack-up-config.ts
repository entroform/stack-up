import {
  StackUp,
  StackUpItem,
} from './stack-up';

export type StackUpLayoutOption = 'ordinal' | 'optimized';

export interface StackUpContainerScaleData {
  width: number;
  height: number;
  currentWidth: number;
  currentHeight: number;
  maxWidth: number;
  maxHeight: number;
  requireScale: boolean;
}

export interface StackUpConfig {
  boundary: HTMLElement | Window;

  getContainerElement: () => HTMLElement | null;
  getItemElements: () => NodeListOf<HTMLElement> | HTMLElement[] | null;

  columnWidth: number;
  numberOfColumns: number;
  gutter: number;
  
  layout: StackUpLayoutOption;
  isFluid: boolean;
  
  debounceResizeWait: number;
  moveInSequence: boolean;

  beforeInitialize: (stackup: StackUp) => Promise<void>;

  beforeTransition: (container: StackUpContainerScaleData, items: StackUpItem[], stackup: StackUp) => Promise<void>;
  afterTransition: () => void;

  scaleContainerInitial: (container: HTMLElement, data: StackUpContainerScaleData, stackup: StackUp) => Promise<void>;
  scaleContainerFinal: (container: HTMLElement, data: StackUpContainerScaleData, stackup: StackUp) => Promise<void>;

  beforeMove: (items: StackUpItem[], stackup: StackUp) => Promise<void>;
  moveItem: (item: StackUpItem, stackup: StackUp) => Promise<void>;
  afterMove: (items: StackUpItem[], stackup: StackUp) => Promise<void>;
  
}

export const STACKUP_DEFAULT_CONFIG: StackUpConfig = {
  boundary: window,

  getContainerElement: () => null,
  getItemElements: () => null,

  columnWidth: 320,
  numberOfColumns: 3,
  gutter: 20,

  layout: 'ordinal',
  isFluid: true,

  debounceResizeWait: 350,
  moveInSequence: false,

  beforeInitialize: () => Promise.resolve(),

  beforeTransition: () => Promise.resolve(),
  afterTransition: () => {},

  scaleContainerInitial: (container, { width, height }) => {
    container.style.width = `${width}px`;
    container.style.height = `${height}px`;
    return Promise.resolve();
  },
  scaleContainerFinal: (container, { width, height }) => {
    container.style.width = `${width}px`;
    container.style.height = `${height}px`;
    return Promise.resolve();
  },

  beforeMove: () => Promise.resolve(),
  moveItem: ({ item, left, top }) => {
    item.style.left = `${left}px`;
    item.style.top = `${top}px`;
    return Promise.resolve();
  },
  afterMove: () => Promise.resolve(),
};