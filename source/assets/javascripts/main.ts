import { DOMImage } from '@nekobird/rocket';

import { StackUp } from '../../../stack-up/stack-up';

const containerElement = document.getElementById('container');

const images = [
  'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1268&q=80',
  'https://images.unsplash.com/photo-1545249390-6bdfa286032f?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1197&q=80',
  'https://images.unsplash.com/photo-1548247416-ec66f4900b2e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=60',
  'https://images.unsplash.com/photo-1507984211203-76701d7bb120?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=60',
];

const loadImages = stackup => {
  images.forEach(source => {
    DOMImage.loadImage(source).then(payload => {
      const item = document.createElement('DIV');
      item.classList.add('item');
      item.appendChild(payload.image);
      containerElement.appendChild(item);
      stackup.append(item).catch(error => console.error(error));
    });
  });
};

const stackup: StackUp = new StackUp({
  beforeInitialize: () => {
    const images = containerElement.querySelectorAll('img');
    const promises = [];
    images.forEach(img => {
      promises.push(DOMImage.loadImage(img.src));
    });
    return Promise.all(promises).then(() => Promise.resolve());
  },
  getContainerElement: () => {
    return document.getElementById('container');
  },
  getItemElements: () => {
    return document.querySelectorAll('.item');
  },

  layout: 'optimized',
  moveInSequence: false,
  columnWidth: 200,
  numberOfColumns: 3,
  isFluid: true,
  boundary: window,

  scaleContainerInitial: (container, data) => {
    console.log(data);
    if (data.requireScale === true) {
      container.style.width = `${data.width}px`;
      container.style.height = `${data.height}px`;
    }
    return Promise.resolve();
  },
  moveItem: data => {
    if (data.requireMove === true) {
      data.item.style.left = `${data.left}px`;
      data.item.style.top = `${data.top}px`;
    }
    return Promise.resolve();
  },
});

stackup.initialize().then(() => {
  loadImages(stackup);
  stackup.config.gutter = 10;
  stackup.restack();
});
