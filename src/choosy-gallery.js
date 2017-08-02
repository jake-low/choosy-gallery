const $ = jQuery;

function desiredHeight (element) {
  const desired = parseInt($(element).attr('data-desired-height'));

  if (!isNaN(desired)) {
    return desired;
  } else {
    return 300;
  }
}

function absTotal (array) {
  return array.map((e) => Math.abs(e)).reduce((a, b) => a + b);
}

class Gallery {

  constructor (element, options = {}) {
    this.options = Object.assign({
      renderFrequency: 50, // re-render every 10 pixels
      debug: false,
    }, options);

    this.selector = $(element);

    $(document).ready(() => {
      // as soon as the DOM is ready, hide the gallery. this prevents images
      // from showing on the screen before we've had time to set their sizes
      this.unmount();
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

  bestPartition (elements) {
    if (elements.length == 1) {
      // base case: only one element; we only have one option for how to
      // render this case (make the element's width 100% of the container)
      // so we just compute the error of that case and return.
      var element = elements.first();
      var requiredHeight = this.targetWidth / (element.width() / element.height());
      var error = desiredHeight(element) - requiredHeight;

      return {
        errors: [error],
        widths: ['100%'],
      }
    } else {
      // compute the aspect ratio of each item in the set of elements
      var aspects = elements.map((idx, e) => $(e).width() / $(e).height()).get();
      // and then use that to compute what the row height must be if we decide
      // to put all these elements together in one row
      var rowHeight = this.targetWidth / aspects.reduce((a, b) => a + b);

      // we'll treat this case (putting all elements in one row) as the best
      // option so far, and then compare it to various partitions (where we
      // break the elements up into two rows) later
      var best = {
        // for each element, compute a (signed) error value: how far from its
        // desired height is the row height we computed?
        errors: elements.map((idx, e) => desiredHeight(e) - rowHeight).get(),
        // and save the percent-widths required for this arrangement, in case
        // we end up using it.
        widths: aspects.map((a) => (a * rowHeight / this.targetWidth * 100) + '%'),
      };

      // for each possible partition of these elements into two groups...
      for (var i = 1; i < elements.length; ++i) {
        // recursively compute the best possible partitioning of those groups
        var left = this.bestPartition(elements.slice(0, i))
        var right = this.bestPartition(elements.slice(i));

        // if that partition has lower total error than the best we've seen so far
        if (absTotal(left.errors) + absTotal(right.errors) < absTotal(best.errors)) {
          // update the best to be the current partition
          best = {
            errors: left.errors.concat(right.errors),
            widths: left.widths.concat(right.widths),
          };
        }
      }

      return best;
    }
  }

  render () {
    // get the width of the container; this works even when gallery is
    // unmounted because we don't remove it from the document flow
    this.targetWidth = this.selector.width();

    // fetch the items from the gallery
    var elements = this.selector.children();

    if (elements.length == 0) {
      // if there are no items in the gallery, no need to render
      return;
    }

    // find the best partition ...
    var best = this.bestPartition(elements);

    var gallery = this;

    elements.each(function (index) {
      // and apply that partition's dictated percent-widths to each element
      $(this).width(best.widths[index]);
      $(this).height('auto');

      if (gallery.options.debug) {
        // add title text to each item in the gallery indicating whether it
        // wants to be bigger or smaller than it ended up, and by how much.
        var err = Math.round(best.errors[index]);

        if (err > 0) {
          $(this).attr('title', 'wants to be ' + err + ' px bigger');
        } else if (err < 0) {
          $(this).attr('title', 'wants to be ' + Math.abs(err) + ' px smaller');
        } else {
          $(this).attr('title', 'wow, just the right size!');
        }
      }
    });

    this.lastRenderWidth = this.targetWidth;
  }
}

if (typeof jQuery !== undefined) {
  jQuery.fn.choosyGallery = function (options) {
    return this.each(function () {
      new Gallery(this, options);
    });
  };
}
