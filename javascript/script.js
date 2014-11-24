// Set up margin and widths of map container
var margin = {top: 10, left: 10, bottom: 10, right: 10}
	, width = document.getElementById("map").clientWidth
	, width = width - margin.left - margin.right
	, mapRatio = .6
	, height = document.getElementById("map").clientHeight;

// Function for determining limitting dimension, height or width
function getsmaller() {
	if (width > (height * 1.6)) {
		return height *1.6;
	} else {
		return width;
	}
};

// Getting value of smaller dimension
var smaller = getsmaller();

// Update projection
var projection = d3.geo.albersUsa()
	.translate([width / 2, height / 2 - 10])
	.scale(smaller * 1.3);

// Path
var path = d3.geo.path()
	.projection(projection);

// Define svg element
var svgEcoregions = d3.select("#map")
			.append("svg")
			.attr("width", width)
			.attr("height", height);

// Colors for ramp
var colors = ["#FFD6A3", "#FFFFD4", "#B9E8A2", "#7DC9A9", "#2F5E99", "#51468F"]

// Creating color scale
var color = d3.scale.linear()
		.domain([6, 10, 12, 14, 20, 30])
		.range([colors[0], colors[1], colors[2], colors[3], colors[4], colors[5]])
		.interpolate(d3.interpolateHcl);

// Load in data
queue()
	.defer(d3.csv, "ecoregionMeans.csv")
	.defer(d3.json, "ecoregionBoundaries.json")
	.await(ready);

// Call function to continue after loading data
function ready(error, ecoregionMeans, ecoregionBoundaries) {
	
	// Take a look at our data and topology
	console.log(ecoregionMeans);
	console.log(ecoregionBoundaries);
	
	// Can you say, "geometry collection?"
	var ecoregions = ecoregionBoundaries.objects.level3ecoregions;
	console.log(ecoregions.geometries.length);
	
	// Going strong. Lets bind some data
	bindData();
	function bindData() {
		
		// Min and max indexes of dates
		var min = 10;
		var max = 50;
		
		// Looping through each ecoregion...
		for(var j = 0; j < ecoregions.geometries.length; j++) {
			
			// Pick out the ecoregion we're working with
			var jsonEcoregion = ecoregions.geometries[j].properties.NA_L3NAME;
			
			// Declare variables to tally sum and number of noDataDates
			var sum = 0;
			var noDataDates = 0;
			
			// For each date...
			for(var i = min; i <= max; i++) {
			
				// Do the following for each ecoregion...
				if (ecoregionMeans[i][jsonEcoregion] == "NA") { // If there's no data, add 1 to noDataDates
					noDataDates += 1;
				} else { // Else, sum it
					sum += parseFloat(ecoregionMeans[i][jsonEcoregion]);
				};
				
			}; // END looping through each day in rangeSlider bounds
			
			// Our new mean is the sum divided by the range of dates (minus the dates with no data not used in sum)
			var mean = sum / ((max - min) - noDataDates);
			
			// Assign a new value for each ecoregion
			ecoregions.geometries[j].properties.value = mean;
			
		}; // END looping through each ecoregion
	};
	
	// Awesome! I smell a map coming...
	drawMap();
	function drawMap() {
		// Ecoregions svg group
		var g = svgEcoregions
					.append("g");
		
		// Draw choropleth
		g.selectAll("path")
		    .data(topojson.feature(ecoregionBoundaries, ecoregions).features)
		.enter()
		    .append("path")
		    .attr("class", "ecoregionPolygons")
		       .attr("d", path)
		    .style("fill", function(d) {
								var value = d.properties.value;
								if (value) {
									return color(value);
								} else {
									return "#ccc";
								};
							});
	};
	
	// Resize map when window resizes
	d3.select(window).on('resize', resize);
	function resize() {
		// Adjust things when the window size changes
		width = document.getElementById("map").clientWidth;
		width = width - margin.left - margin.right;
		height = document.getElementById("map").clientHeight;
		
		// Find the smaller dimension, considering the map ratio
		var smaller = getsmaller();
		
		// Update projection
		projection
			.translate([width / 2, height / 2 - 10])
			.scale(smaller * 1.3);
		
		// Update SVG dimensions
		svgEcoregions.attr("width", width).attr("height", height);
		
		// Redrawing the paths
		ecoregionPaths.attr("d", path);
	};
	
	// Ecoregion polygons
	var ecoregionPaths = svgEcoregions.select("g").selectAll("path");
	
	// Highlight hovered ecoregion and move it to top of drawing order, classed as .top
	ecoregionPaths.on("mouseover", function(d,i) {
		ecoregionPaths.classed("top", false);
    	d3.select(this.parentNode.appendChild(this))
			.classed("top", true);
		var selectedEcoregionElement = document.getElementsByClassName("selected");
		selectedEcoregionElement[0].parentNode.appendChild(selectedEcoregionElement[0]);
	});
	
	// Remove highlight when mouse moves out
	ecoregionPaths.on("mouseout", function(d,i) {
		ecoregionPaths.classed("top", false);
	});
	
	// STILL A PROBLEM SPOT
	var keydown = false;
	d3.select(document).on("keydown", function() {var keydown = true; console.log(keydown);});
	d3.select(document).on("keyup", function() {var keydown = false; console.log(keydown);});
	
	// On click, class the clicked on ecoregion as .selected, highlight it, move it to the top
	ecoregionPaths.on("click", function() {
		
		if (keydown == false) {
			ecoregionPaths.classed("selected", false);
			d3.select(this).classed("selected", true);
		} else {
			d3.select(this).classed("selected", true);
		};
		
		d3.select(this.parentNode.appendChild(this))
			.classed("top", true);
		var selectedEcoregionElement = document.getElementsByClassName("selected");
		selectedEcoregionElement[0].parentNode.appendChild(selectedEcoregionElement[0]);
		
	}); // select multiple on keydown not working yet...
	
	fillTable();
	function fillTable() {
			
		d3.select("tbody").remove();
			
		var matrix = [];
			
		for(var j = 0; j < ecoregions.geometries.length; j++) {
			matrix.push([ecoregions.geometries[j].properties.NA_L3NAME, ecoregions.geometries[j].properties.value]);
		};
			
		var tr = d3.select("table").append("tbody").selectAll("tr")
			.data(matrix)
			.enter().append("tr");
		
		var td = tr.selectAll("td")
				.data(function(d) { return d; })
				.enter().append("td")
				.text(function(d) { return d; });
		};
};