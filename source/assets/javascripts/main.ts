import {
  DOMImage,
} from '@nekobird/rocket';

import {
  StackUp,
} from '../../../stack-up/stack-up';


const containerElement = document.getElementById('container');

const stackup: StackUp = new StackUp({
  beforeInitialize: () => {
    const images = containerElement.querySelectorAll('img');
    const promises = [];
    images.forEach(img => {
      promises.push(DOMImage.onImageLoad(img.src));
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
  isFluid: false,
  boundary: window,

  scaleContainerInitial: (container, data) => {
    if (data.requireScale === true) {
      console.log(data);
      container.style.width = `${data.width}px`;
      container.style.height = `${data.height}px`;
    }
    return Promise.resolve()
  },
  moveItem: (data) => {
    if (data.requireMove === true) {
      data.item.style.left = `${data.left}px`;
      data.item.style.top = `${data.top}px`;
    }
    return Promise.resolve()
  },
});
stackup.initialize();


const images = [
  'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1268&q=80',
  'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=60',
  'https://images.unsplash.com/photo-1548247416-ec66f4900b2e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=60',
  'https://images.unsplash.com/photo-1507984211203-76701d7bb120?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=800&q=60',
];

images.forEach(image => {
  DOMImage
    .onImageLoad(image)
    .then(() => {
      const img = document.createElement('IMG');
      img.setAttribute('src', image);
      const item = document.createElement('DIV');
      item.classList.add('item')
      item.appendChild(img)
      containerElement.appendChild(item);
      stackup.append(item)
        .then(() => stackup.reset())
        .catch((error) => alert(error));
    });
});
