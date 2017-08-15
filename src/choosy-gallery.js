const $ = jQuery;

function desiredHeight (element) {
  const desired = $(element).data('desired-height');

  if (!isNaN(desired)) {
    return desired;
  } else {
    return 300;
  }
}

class Row {
  constructor (elements, width) {
    this.elements = elements;
    this.width = width;

    //this.freeze();
  }

  aspects () {
    return this.elements.map((idx, e) => $(e).width() / $(e).height()).get();
  }

  height () {
    return this.width / this.aspects().reduce((a, b) => a + b);
  }

  widths () {
    return this.aspects().map((a) => (a * this.height() / this.width * 100) + '%');
  }
}


class Partition {
  constructor (...rows) {
    this.rows = rows;
  }

  concat (other) {
    return new Partition(...this.rows.concat(other.rows));
  }

  errors () {
    return this.rows.map((row) => {
      let rowError = row.elements.map((idx, e) => { return desiredHeight(e) - row.height(); }).get();
      return rowError;
    }).reduce((a, b) => a.concat(b));
  }

  score () {
    // lower is better
    return this.errors().map((e) => Math.pow(e, 2)).reduce((a, b) => a + b);
  }
}

class Partitioner {
  constructor (gallery) {
    this.targetWidth = gallery.selector.width();
    this.cache = {};
  }
}


class OptimalPartitioner extends Partitioner {
  solve (elements) {
    let signature = elements.map((idx, e) => e.outerHTML).get();

    if (!this.cache[signature]) {
      if (elements.length == 1) {
        // base case: only one element
        let element = elements.first();
        this.cache[signature] = new Partition(new Row(element, this.targetWidth));
      } else {

        let best = new Partition(new Row(elements, this.targetWidth));

        for (let i = 1; i < elements.length; ++i) {

          let left = this.solve(elements.slice(0, i));
          let right = this.solve(elements.slice(i));

          let candidate = left.concat(right);

          if (candidate.score() < best.score()) {
            best = candidate;
          }
        }

        this.cache[signature] = best;
      }
    }

    return this.cache[signature];
  }
}

class PrettyGoodPartitioner extends Partitioner {
  solve (elements) {
    let signature = elements.map((idx, e) => e.outerHTML).get();

    if (!this.cache[signature]) {
      if (elements.length == 1) {
        // base case: only one element
        let element = elements.first();
        this.cache[signature] = new Partition(new Row(element, this.targetWidth));
      } else if (elements.length < 8) {

        let best = new Partition(new Row(elements, this.targetWidth));

        for (let i = 1; i < elements.length; ++i) {

          let left = this.solve(elements.slice(0, i));
          let right = this.solve(elements.slice(i));

          let candidate = left.concat(right);

          if (candidate.score() < best.score()) {
            best = candidate;
          }
        }

        this.cache[signature] = best;
      } else {
        let half = Math.floor(elements.length / 2);

        let left = this.solve(elements.slice(0, half));
        let right = this.solve(elements.slice(half));

        this.cache[signature] = left.concat(right);
      }
    }

    return this.cache[signature];
  }
}

class Gallery {
  constructor (element, options = {}) {
    this.options = Object.assign({
      renderFrequency: 50, // re-render every 10 pixels
      debug: false,
    }, options);

    this.selector = $(element);

    if (this.options.debug) {
      $(element).children().append("<div class='debug'>PHOOEY</div>");
      $(element).find('.debug')
        .css('font-size', '20px')
        .css('position', 'absolute')
        .css('top', '60%')
        .css('left', '50%')
        .css('transform', 'translateX(-50%)');
    }

    $(document).ready(() => {
      // as soon as the DOM is ready, hide the gallery. this prevents images
      // from showing on the screen before we've had time to set their sizes
      this.unmount();

      setTimeout(() => {
        // in case onload never fires, set a timer to mount the component.
        // FIXME this is a hack; ideally we'd detect whether images were loaded
        // some other way.
        this.render();
        this.mount();
      }, 2000);
    });

    $(window).on('load', () => {
      // once the window (including all resources) has loaded, we'll be able
      // to query the dimensions of each image, so we can begin rendering.
      this.render();
      // once the render is complete, unhide the gallery.
      this.mount();
    });

    $(window).on('resize', () => {
      // when the window is resized, check if the current gallery size differs
      // from the size at last render time by at least the configured render
      // frequency.
      if (Math.abs(this.selector.width() - this.lastRenderWidth) > this.options.renderFrequency) {
        // if it does, re-render the gallery.
        this.render();
      }
    });
  }

  unmount () {
    // make the gallery invisible, but keep it in the document flow so its
    // width doesn't change.
    this.selector.css('visibility', 'hidden');
    this.selector.css('height', 0);
  }

  mount () {
    // make the gallery visible again
    this.selector.css('visibility', 'visible');
    this.selector.css('height', 'auto');
  }

  render () {
    // get the width of the container; this works even when gallery is
    // unmounted because we don't remove it from the document flow
    var targetWidth = this.selector.width();

    // fetch the items from the gallery
    var elements = this.selector.children();

    if (elements.length == 0) {
      // if there are no items in the gallery, no need to render
      return;
    }

    let partitioner = new PrettyGoodPartitioner(this);
    let solution = partitioner.solve(elements);

    var gallery = this;

    var widths = solution.rows.map((row) => row.widths()).reduce((a, b) => a.concat(b));
    var errors = solution.errors();

    elements.each(function (index) {
      // and apply that partition's dictated percent-widths to each element
      $(this).width(widths[index]);
      $(this).height('auto');

      if (gallery.options.debug) {
        // add title text to each item in the gallery indicating whether it
        // wants to be bigger or smaller than it ended up, and by how much.
        var err = Math.round(errors[index]);

        if (err > 20) {
          $(this).attr('title', 'wants to be ' + err + ' px bigger');
          $(this).find('.debug').text('+' + err).css('color', 'green').css('font-size', (12 + err / 6) + 'px');

        } else if (err < -20) {
          $(this).attr('title', 'wants to be ' + Math.abs(err) + ' px smaller');
          $(this).find('.debug').text(err).css('color', 'red').css('font-size', (12 + Math.abs(err) / 6) + 'px');
        } else {
          $(this).attr('title', 'wow, just about the right size! (' + err + ')');

          $(this).find('.debug').text('--');
        }

      }
    });

    this.lastRenderWidth = targetWidth;
  }
}

if (typeof jQuery !== undefined) {
  jQuery.fn.choosyGallery = function (options) {
    return this.each(function () {
      // $(selector).data('gallery') can be used to access the Gallery instance,
      // which may be useful e.g. for forcing it to render() after modification.
      $(this).data('gallery', new Gallery(this, options));
    });
  };
}
