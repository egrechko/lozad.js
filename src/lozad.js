/**
 * Detect IE browser
 * @const {boolean}
 * @private
 */
const isIE = typeof document !== 'undefined' && document.documentMode

// breakpoints for backgrounds
let breakpoints = [
  {
    src: 'sm',
    width: 576,
  },
  {
    src: 'md',
    width: 768,
  },
  {
    src: 'lg',
    width: 992,
  },
  {
    src: 'xl',
    width: 1200,
  },
  {
    src: 'xx',
    width: 1400,
  },
];

// get screen size
let screen = document.documentElement.clientWidth;

const defaultConfig = {
  rootMargin: '0px',
  threshold: 0,
  load(element) {
    if (element.nodeName.toLowerCase() === 'picture') {
      const img = document.createElement('img')
      if (isIE && element.getAttribute('data-iesrc')) {
        img.src = element.getAttribute('data-iesrc')
      }

      if (element.getAttribute('data-alt')) {
        img.alt = element.getAttribute('data-alt')
      }

      element.append(img)
    }

    if (element.nodeName.toLowerCase() === 'video' && !element.getAttribute('data-src')) {
      if (element.children) {
        const childs = element.children
        let childSrc
        for (let i = 0; i <= childs.length - 1; i++) {
          childSrc = childs[i].getAttribute('data-src')
          if (childSrc) {
            childs[i].src = childSrc
          }
        }

        element.load()
      }
    }

    if (element.getAttribute('data-src')) {
      element.src = element.getAttribute('data-src')
    }

    if (element.getAttribute('data-srcset')) {
      element.setAttribute('srcset', element.getAttribute('data-srcset'))
    }

    if (element.getAttribute('data-background-image')) {
      // return a breakpoint that qualifies
      let breakpoint = breakpoints
        .filter(function(breakpoint) {
          // return if element is larger than screen width
          // return if data-background-image for the breakpoint exists
          if (screen >= breakpoint.width && element.getAttribute(`data-background-image-${breakpoint.src}`)) {
            return (breakpoint.src);
          }
        })
        // get the last element
        .pop();

      // default data-background-image
      let attr = element.getAttribute('data-background-image');

      // if a breakpoint qualified, then change the attr
      if (breakpoint) {
        attr = element.getAttribute(`data-background-image-${breakpoint.src}`);
      }

      // set the background-image css prop
      element.style.backgroundImage = `url(${attr})`;
    }

    if (element.getAttribute('data-toggle-class')) {
      element.classList.toggle(element.getAttribute('data-toggle-class'))
    }
  },
  loaded() {}
}

function markAsLoaded(element) {
  element.setAttribute('data-loaded', true)
}

const isLoaded = element => element.getAttribute('data-loaded') === 'true'

const onIntersection = (load, loaded) => (entries, observer) => {
  entries.forEach(entry => {
    if (entry.intersectionRatio > 0 || entry.isIntersecting) {
      observer.unobserve(entry.target)

      if (!isLoaded(entry.target)) {
        load(entry.target)
        markAsLoaded(entry.target)
        loaded(entry.target)
      }
    }
  })
}

const getElements = (selector, root = document) => {
  if (selector instanceof Element) {
    return [selector]
  }

  if (selector instanceof NodeList) {
    return selector
  }

  return root.querySelectorAll(selector)
}

export default function (selector = '.lozad', options = {}) {
  const {root, rootMargin, threshold, load, loaded} = {...defaultConfig, ...options}
  let observer

  if (typeof window !== 'undefined' && window.IntersectionObserver) {
    observer = new IntersectionObserver(onIntersection(load, loaded), {
      root,
      rootMargin,
      threshold
    })
  }

  return {
    observe() {
      const elements = getElements(selector, root)

      for (let i = 0; i < elements.length; i++) {
        if (isLoaded(elements[i])) {
          continue
        }

        if (observer) {
          observer.observe(elements[i])
          continue
        }

        load(elements[i])
        markAsLoaded(elements[i])
        loaded(elements[i])
      }
    },
    triggerLoad(element) {
      if (isLoaded(element)) {
        return
      }

      load(element)
      markAsLoaded(element)
      loaded(element)
    },
    observer
  }
}
