////////// Initialize Slider //////////

$(document).ready(function() {
	$('#slider').slider({value: 1000}).width(600).height(10);
});


////////// Map Properties //////////

//Define date format
var format = d3.time.format("%b%d%Y");

//Width and height
var w = 960;
var h = 600;

//Define projection
var projection = d3.geo.azimuthalEqualArea()
		.scale(w)
		.translate([33.5, 262.5])
		.rotate([100, -45])
		.center([-17.6076, -4.7913]) // rotated [-122.4183, 37.7750]
		.scale(1297);


//Define default path generator
var path = d3.geo.path()
	.projection(projection);


////////// Ecoregion Thematic Data Color Scale //////////

//Colors for high and low
var dryColor = "#FFD6A3";
var stepColorOne = "#FFFFD4";
var stepColorTwo = "#B9E8A2";
var stepColorThree = "#7DC9A9";
var stepColorFour = "#2F5E99";
var wetColor = "#51468F";

//Scale takes data values as input and returns color
var color = d3.scale.linear().domain([6, 10, 12, 14, 20, 30])
.range([dryColor, stepColorOne, stepColorTwo, stepColorThree, stepColorFour, wetColor])
.interpolate(d3.interpolateHcl);


////////// SVG Elements ////////////

//Create SVG element for ecoregions data
var svgEcoregions = d3.select("#ecoregions")
			.append("svg")
			.attr("class", "map")
			.attr("width", w)
			.attr("height", h);

 
 ////////// Soil Moisture CSV //////////

 // Read in ecoregion daily means as var data
 data = d3.csv("level3-mean.csv", function(data) {

	 // Show the data in the console
	console.log(data);
	
	
	////////// Ecoregion Thematic Data //////////
	
	// Read in level 3 ecoregion boundaries as var json
	d3.json("level3-ecoregions.json", function(json) {
	
			// Initialize a slider value
			sliderValue = 100;
			
			// Initialize range slider
			$("#rangeSlider").rangeSlider({
				bounds: {min: 0, max: data.length},
				defaultValues:{min: 365, max: 455},
				range: {min: 7, max: data.length},
				step: 1,
				valueLabels: "change",
				durationIn: 150,
				durationOut: 150
			});
			
			// Put slider date into paragraph with id='sliderDate'
			d3.select("#sliderDate").text("Date: " + data[sliderValue].date);
		
			// Find corresponding ecoregion within GeoJSON
			for (var j = 0; j < json.features.length; j++) {
				var jsonEcoregion = json.features[j].properties.NA_L3NAME;
				json.features[j].properties.value = parseFloat(data[sliderValue][jsonEcoregion]);
			};
			
			// Bind data and create one path per GeoJSON feature
			svgEcoregions.selectAll("path")
				.data(json.features)
				.enter()
				.append("path")
				.attr("d", path)
				.style("fill", function(d) {
					var value = d.properties.value;
							if (value) {
								return color(value);
							} else {
								return "#ccc";
							}
				})
				.style("stroke", "white")
				.style("stroke-width", "1");
			
			// Define function to redraw ecoregion thematic data and update date based on parameter sliderValue
			function refreshMap(sliderValue) {
				
				// Find corresponding ecoregion within GeoJSON
				for (var j = 0; j < json.features.length; j++) {
					var jsonEcoregion = json.features[j].properties.NA_L3NAME;
					json.features[j].properties.value = parseFloat(data[sliderValue][jsonEcoregion]);
				};
				
				// Change fill color of path based on new json.features.properties.value
				svgEcoregions.selectAll("path")
					.data(json.features)
					.transition()
					.duration(30)
					.style("fill", function(d) {
						var value = d.properties.value;
						if (value) {
							return color(value);
							} else {
								return "#ccc";
							}
						});
				
				// Update #sliderDate paragraph text based on sliderValue
				d3.select("#sliderDate").text("Date: " + data[sliderValue].date);
			};
		
		// Call refreshMap function with new sliderValue as parameter on slide
		$(function() {
			$('#slider').slider({ 	min: 0,
						max: data.length,
						slide: function( event, ui ) {
							var sliderValue = ui.value;
							refreshMap(sliderValue);
						} 
			});
		});
		
		// Utilize rangeSlider to dynamically calculate averages and then recolor map
		
		function calculateMeans() {
			
			var rangeValues = $("#rangeSlider").rangeSlider("values");
			
			console.log(rangeValues);
			
			var min = rangeValues.min;
			var max = rangeValues.max;
				
			// Looping through each ecoregion...
			for(var j = 0; j < json.features.length; j++) {
				
				// Pick out the ecoregion we're working with
				var jsonEcoregion = json.features[j].properties.NA_L3NAME;
				
				// Declare variables to tally sum and number of noDataDates
				var sum = 0;
				var noDataDates = 0;
				
				// For each date...
				for(var i = min; i <= max; i++) {
				
					// Do the following for each ecoregion...
					if (data[i][jsonEcoregion] == "NA") { // If there's no data, add 1 to noDataDates
						noDataDates += 1;
					} else { // Else, sum it
						sum += parseFloat(data[i][jsonEcoregion]);
					};
					
				}; // END looping through each day in rangeSlider bounds
				
				// Our new mean is the sum divided by the range of dates (minus the dates with no data not used in sum)
				var mean = sum / ((max - min) - noDataDates);
				
				// Assign a new value for each ecoregion
				json.features[j].properties.value = mean;
				
			}; // END looping through each ecoregion
			
		}; // END calculate calculateMeans function
		
		// Define function to recolor ecoregions based on json.features.properties.value
		function recolorMap () {
			svgEcoregions.selectAll("path")
					.data(json.features)
					.transition()
					.duration(30)
					.style("fill", function(d) {
						var value = d.properties.value;
						if (value) {
							return color(value);
							} else {
								return "#ccc";
							}
						});
		}; // END recolorMap function
		
		$("#rangeSlider").bind("valuesChanging", function(e){
  			calculateMeans();
			recolorMap();
		});
	
		
		
	//////Land that basemap and bring the terrain//////////
	d3.json("land.json", function(error, land) {
	
		var defs = svgEcoregions.append("defs");

	//Bring in the land
	defs.append("path")
		.datum(topojson.feature(land, land.objects.land))
		.attr("id", "land")
		.attr("d", path);
	
	// Applying a multiply filter TODO
	
	var filter = defs.append("filter")
		.attr("id", "Multiply");
	
	filter.append("feBlend")
	.attr("mode", "multiply")
	//.attr("in2", "BackgroundImage")
	//.attr("in", "SourceGraphic")
	;

	//Identify a clipping path
	svgEcoregions.append("clipPath")
		.attr("id", "clip")
		.append("use")
		.attr("xlink:href", "#land");

	//Overlay terrain
	svgEcoregions.append("image")
		.attr("clip-path", "url(#clip)")
		.attr("xlink:href", "hillshade.png")
		.attr("width", w)
		.attr("height", h)
		.attr("opacity", 0.4).attr("comp-op","multiply");

	svgEcoregions.append("use")
		.attr("xlink:href", "#land");
		}); // END base map
	
	}); // END level 3 ecoregion boundaries
	
}); // END ecoregion daily means data