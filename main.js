// Prints statement in parentheses in console command line
console.log('hello world!');

// set up height and width of map based on window
var width = Math.max(960, window.innerWidth), // set width based on window width
    height = Math.max(500, window.innerHeight); // set height based on widow height

// Set Default math variables with predefined values
var pi = Math.PI, // set pi
    tau = 2 * pi; // set tau as pi * 2

// create a spherical Mercator projection
// see https://github.com/d3/d3-geo#geoMercator for an image of the projection
var projection = d3.geoMercator()
  .scale(1 / tau) // Set projection scale to 1 / (2 * pi)
  .translate([0, 0]); // Set the projection translation offset to (0,0)

// create a new geographic path generator
var path = d3.geoPath()
  .projection(projection); // set projection to the one specifiec earlier

// create quadtree tile and specify size
var tile = d3.tile() // construct a layout for determining which quadtree tiles to display
  .size([width, height]); // set size of layout to predefined (width, height)

// set up zooming behavior
var zoom = d3.zoom() // create a a new zooming behavior
  .scaleExtent([
    1 << 11, // minimum allowed scale factor
    1 << 24 // maximum allowed scale factor
  ]) // specify zoom scale
  .on('zoom', zoomed); // sets the event zoomed for the specified 'zoom'

// set up scale and range for radius of circles 
var radius = d3.scaleSqrt().range([0, 10]);

// create a new SVG and set attributes
var svg = d3.select('body')
  .append('svg') // create a new SVG element
  .attr('width', width) // set width
  .attr('height', height); // set height

// create a raster
var raster = svg.append('g');

// to render to a single path:
// var vector = svg.append('path');
// to render to multiple paths:
var vector = svg.selectAll('path'); // renders to multiple paths

// asynchronously load in earthquakes_4326_cali.geojson, d3.json() specifies that the data is in .json format
// uses process similar to the error response call back function from node.js,
// and after a successful network request, invokes the specified function 
d3.json('data/earthquakes_4326_cali.geojson', function(error, geojson) {
  if (error) throw error; // if error throw error
  
  // Prints statement in parentheses in console command line
  console.log(geojson);
  
  // set up domain of radius of circles as using the magnitude of the earthquake
  radius.domain([0, d3.max(geojson.features, function(d) { return d.properties.mag; })]);
  
  // use the magnitude to display Point & MultiPoint geometries with specified number
  path.pointRadius(function(d) {
    return radius(d.properties.mag); // gets radius of circle & creates circle based on magnitude
  });
  
  // to render to a single path:
  // vector = vector.datum(geojson);
  // to render to multiple paths:
  vector = vector
    .data(geojson.features)
    .enter().append('path') // create a new path
    .attr('d', path) // sets GeoJSON Feature as path
    .on('mouseover', function(d) { console.log(d); }); // upon mouseover on point log the data point to the console
  
  // set up the center of the projection
  var center = projection([-119.665, 37.414]);
  
  // add in zoom functionality
  svg.call(zoom) // calls in zooming functionality
    .call(
      zoom.transform,
      d3.zoomIdentity
        .translate(width / 2, height / 2) // translates the view by (width / 2, height / 2)
        .scale(1 << 14) // sets lower minimum allowed scale factor
        .translate(-center[0], -center[1]) // translates the center 
    ); // set up view upon zooming in
}); // d3.json() end

// zoomed function that is called to adjust the zooming view
function zoomed() {
  var transform = d3.event.transform; // set up zoom tranformation
  
  // set up scale for quadtree tile
  var tiles = tile
    .scale(transform.k) // scale the quadtree tile
    .translate([transform.x, transform.y]) // translate quadtree tile to [transform.x, transform.y]
    ();
  
  // Prints statement in parentheses in console command line
  console.log(transform.x, transform.y, transform.k);
  
  // create a scale and translation for projection
  projection
    .scale(transform.k / tau) // scale the projection by transform.k / (2 * pi)
    .translate([transform.x, transform.y]); // translate projection to [transform.x, transform.y]
  
  // sets GeoJSON Feature as path 
  vector.attr('d', path);
  
  // create raster image tiles
  var image = raster
    .attr('transform', stringify(tiles.scale, tiles.translate)) // translate to the points returned by stringify function
    .selectAll('image') // select all existing svg groups with the class name "image" if no groups exist, this is an empty selection
    .data(tiles, function(d) { return d; }); // get data
  
  // update screen, by removing image tile that is not on screen
  image.exit().remove();
  
  // create and display image tiles
  image.enter().append('image') // create a new image tile
    .attr('xlink:href', function(d) {
      return 'http://' + 'abc'[d[1] % 3] + '.basemaps.cartocdn.com/rastertiles/voyager/' +
        d[2] + "/" + d[0] + "/" + d[1] + ".png";
    }) // set xlink:href object
    .attr('x', function(d) { return d[0] * 256; }) // set x-value attribute
    .attr('y', function(d) { return d[1] * 256; }) // set y-value attribute
    .attr('width', 256) // set width
    .attr('height', 256); // set height
} // zoomed end

// create stringify function to set up the translation
function stringify(scale, translate) {
  // set up factors based on scale
  var k = scale / 256, 
      r = scale % 1 ? Number : Math.round;
  return "translate(" + r(translate[0] * scale) + "," + r(translate[1] * scale) + ") scale(" + k + ")"; // return stringified translate 
} // stringify end
