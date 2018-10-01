# ChangeDetection_GEE
How to perform change detection by using Google Earth Engine

//Filter study area and dates
//And control cloud cover.
var images = allavailable 
  .filterDate('2017-4-01', '2017-4-30')
  .filterBounds(aoi)
  .filter(ee.Filter.lt('CLOUD_COVER', 7));
// Output the summary of the All Available images
// to the console so that it can be refer to.
print(images);

// Create a list of visualization parameters, including
// the bands to use for visualization and the maximum data value
// Under image collection and properties.
var visParams = {bands: ['B4', 'B3', 'B2'], max: 30000};

// Add the collection to the map and visualize it using the
// visualization parameters.
Map.addLayer(images, visParams, 'Before Composite');

// Create a composite image of the medians 
// of all images and add it to the map.
var composite = images.median();
Map.addLayer(composite, visParams, 'composite');
print(composite);

// Clip the composite image to your study area.
var clip_composite = composite.clip(aoi);
Map.addLayer(clip_composite, visParams, 'clipped');

// This is a variable that makes a list of 
// all of your features that you created.
var features = [
  SnowIce, 
  EvergreenForest,
  DegradedForest,
  BareSoil,
  Water,
  SnowIceShades
];

// Use that list of features to combine them all into a feature collection and print this
// to inspect it as necessary
var trainingareas = ee.FeatureCollection(features);
print(trainingareas);

//Add a layer in the map that shows training areas in all white.
Map.addLayer(trainingareas, {color: 'FFFFFF'}, 'Training Areas');

//Overlay the polygons on the imagery to train the computer.
var training = clip_composite.sampleRegions({
  collection: trainingareas,
  properties: ['class'],
  scale: 300
});

//Tell the computer which bands of the composite should use.
var bands = ['B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10', 'B11', 'BQA'];

//Train a CART classifier with default parameters.
var trained = ee.Classifier.cart().train(training, 'class', bands);

//Create the image with the same bands used for training
var classified = clip_composite.select(bands).classify(trained);
print(classified);

// Create the visualization parameters for this classified image. 
// Need to find the hex codes for your colors chosen earlier.
var palette = ['ffffff', '3ab443', 'c6b439',
               'b38848', '5856ff', 'cbd0d6'];
               
Map.addLayer(classified, {min:0, max:5, palette: palette}, 'Classified');

Export.image.toDrive({
  image: classified,
  description: 'imageToDriveExample',
  scale: 30,
  region: aoi
});

