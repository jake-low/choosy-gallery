# ChoosyGallery

_This project is in alpha. The API may change before v1.0.0._

ChoosyGallery is a jQuery plugin that tiles collections of images in a justified grid (so they fill their container wall-to-wall).

![example of ChoosyGallery tiling some images](example-1.png)

_Example images served courtesy of [placeimg.com](http://placeimg.com)_

What makes ChoosyGallery different from other photo gallery plugins is that **you can specify a different desired display size for each image in the gallery**. ChoosyGallery's tiling algorithm tries to minimize the error between each photo's desired size and the actual size it ends up rendered at as result of its placement in the gallery.

![another example showing images with different desired heights being tiled together](example-2.png)

In this example, the dog image has a larger `data-desired-height` attribute than the cat image, so the dog gets its own row.

## How to use

```html
<div class='gallery'>
  <img src='500x300.jpg' data-desired-height=300 />
  <img src='380x460.jpg' data-desired-height=450 />
  <img src='475x175.jpg' data-desired-height=400 />
  <img src='300x300.jpg' data-desired-height=225 />
  <img src='450x250.jpg' data-desired-height=280 />
</div>

<script>
  $('.gallery').choosyGallery();
</script>
```

ChoosyGallery automatically hides the gallery while it works, preventing any kind of flickering during page load, and redraws the gallery whenever the page is resized.

## More than just images

ChoosyGallery will happily tile the children of any container, as long as the container has a `width` that is independent of its contents, and the children each have a `width` and `height` that is independent of the size of their parent and are styled so that they're willing to sit next to one another in a line (e.g. with `float: left` or `display: inline-block`).

This means you can tile `<figure>`, `<a>` or `<div>` elements with images inside of them, or presumably other content like embedded videos.

## Troubleshooting

Beware of whitespace. If you make the gallery items `display: inline-block`, the browser may display whitespace between them, which throws off the calculations ChoosyGallery does to size the elements. Set `font-size: 0` or try using `float` instead.
