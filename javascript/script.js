////////// MAP SETUP //////////

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



////////// GRAPH SETUP //////////

var marginGraph = {top: 10, right: 10, bottom: 30, left: 40},
	widthGraph = document.getElementById("graph").clientWidth - marginGraph.left - marginGraph.right,
	heightGraph = document.getElementById("graph").clientHeight - marginGraph.top - marginGraph.bottom;

var parseDate = d3.time.format("%b%d%Y").parse;

var xGraph = d3.time.scale().range([0, widthGraph]),
	yGraph = d3.scale.linear().range([heightGraph, 0]);

var xAxis = d3.svg.axis().scale(xGraph).orient("bottom"),
	yAxis = d3.svg.axis().scale(yGraph).orient("left");

var lineGraph = d3.svg.line()
		.x(function(d) { return xGraph(d.date); })
		.y(heightGraph);

var svgGraph = d3.select("#graph").append("svg")
				.attr("width", widthGraph + marginGraph.left + marginGraph.right)
				.attr("height", heightGraph + marginGraph.top + marginGraph.bottom)
				.append("g")
				.attr("transform", "translate(" + marginGraph.left + "," + marginGraph.right + ")");

var brush = d3.svg.brush().x(xGraph);

////////// DATA SETUP //////////

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
	
	// Min and max indexes of dates for calculations
	var min = 0;
	var max = ecoregionMeans.length - 1;
	
	// Going strong. Lets bind some data
	bindData();
	function bindData() {
		
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
				}
				
			} // END looping through each day in rangeSlider bounds
			
			// Our new mean is the sum divided by the range of dates (minus the dates with no data not used in sum), rounded to two decimal places
			var mean = Math.round((sum / ((max - min) - noDataDates)) * 100) / 100;
			
			// Assign a new value for each ecoregion
			ecoregions.geometries[j].properties.value = mean;
			
		} // END looping through each ecoregion
	}
	
	function bindSingleDayData() {
		// Looping through each ecoregion...
		for(var j = 0; j < ecoregions.geometries.length; j++) {
			
			// Pick out the ecoregion we're working with
			var jsonEcoregion = ecoregions.geometries[j].properties.NA_L3NAME;
			
			level += parseFloat(ecoregionMeans[min][jsonEcoregion]);
			
			// Our new mean is the sum divided by the range of dates (minus the dates with no data not used in sum), rounded to two decimal places
			var level = Math.round(level * 100) / 100;
			
			// Assign a new value for each ecoregion
			ecoregions.geometries[j].properties.value = level;
			}
	}
	
	
	
	////////// MAP //////////
	
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
			.attr("id", function(d) { return d.properties.NA_L3NAME})
			.style("fill", function(d) {
								var value = d.properties.value;
								if (value) {
									return color(value);
								} else {
									return "#ccc";
								};
							});
	};
	
	
	
	////////// TABLE //////////
	
	// Fill a table with our data
	fillTable();
	function fillTable() {
			
		d3.select("tbody").remove();
			
		var array = [];
		
		// For the first object, add it to table. Check if object is in table before adding after that
		for(var j = 0; j < ecoregions.geometries.length; j++) {
			array.push([ecoregions.geometries[j].properties.NA_L3NAME, ecoregions.geometries[j].properties.value]);
		};
		
		// Append table row for each array in multidimensional array
		var tr = d3.select("table").append("tbody").selectAll("tr")
			.data(array)
			.enter().append("tr")
			.attr("id", function(d, i) {return array[i][0];}); // Assigning ecoregion name to id of <tr> 
		
		// Append table data for each value in sub-arrays
		var td = tr.selectAll("td")
				.data(function(d) { return d; })
				.enter().append("td")
				.text(function(d) { return d; });
	};
	
	
	
	////////// GRAPH //////////
	ecoregionMeans.forEach(function(d) {
		d.date = parseDate(d.date);
	});
	
	xGraph.domain(d3.extent(ecoregionMeans, function(d) { return d.date; }));
	yGraph.domain([5, 35]);
	
	svgGraph.append("g")
		.attr("class", "y axis")
		.call(yAxis);
	
	svgGraph.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + heightGraph + ")")
		.call(xAxis);
	
	svgGraph.append("path")
		.datum(ecoregionMeans)
		.attr("class", "line")
		.attr("d", lineGraph);
	
	console.log(ecoregionMeans[3].date)
	
	svgGraph.append("g")
		.attr("class", "x brush")
		.call(brush)
		.selectAll("rect")
		.attr("y", -6)
		.attr("height", heightGraph);
	
	
	
	////////// INTERACTIVITY //////////
	
	// Ecoregion polygons
	var ecoregionPaths = svgEcoregions.select("g").selectAll("path");
	
	// Brush for coloring map by calculated averages
	var xGraphIndex = d3.scale.linear().range([0, ecoregionMeans.length - 1]);
	brush.on("brush", brushed);
	
	function getBound(end) {
		for(var i = 0; i < ecoregionMeans.length; i++) {
			if(ecoregionMeans[i].date.toString() == d3.time.day.floor(brush.extent()[end]).toString()) {
				console.log("found");
				return i;
				break;
			}
		}
	}
	
	function brushed() {
		min = getBound(0);
		max = getBound(1);
		console.log(brush.extent()[0], brush.extent()[1]);
		console.log(d3.time.day.floor(brush.extent()[0]), d3.time.day.floor(brush.extent()[1]));
		console.log(min, max);
		
		if (min == max) {
			bindSingleDayData();
		} else {
			bindData();
		}
		
		recolorMap();
		fillTable();
	}
	
	function recolorMap () {
			ecoregionPaths
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
		
		// Get name of clicked on ecoregion
		var selectedEcoregion = this.id;
		d3.select("#ecoregionName").select("h2").text(selectedEcoregion);
		console.log(selectedEcoregion);
		
		lineGraph.y(function(d) { return yGraph(d[selectedEcoregion]); });
		
		svgGraph.select(".line")
			.transition()
			.duration(600)
			.attr("d", lineGraph);
		
	}); // select multiple on keydown not working yet...
	
	
	
	////////// RESPONSIVENESS //////////
	
	// Resize map when window resizes
	d3.select(window).on('resize', resizeElements);
	function resizeElements() {
		// Adjust map when the window size changes
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
		
		// Adjust graph when the window size changes
		widthGraph = document.getElementById("graph").clientWidth - marginGraph.left - marginGraph.right;
		heightGraph = document.getElementById("graph").clientHeight - marginGraph.top - marginGraph.bottom;
		
		xGraph.range([0, widthGraph]);
		yGraph.range([heightGraph, 0]);
		
		xAxis.scale(xGraph).orient("bottom");
		yAxis.scale(yGraph).orient("left");

		lineGraph
			.x(function(d) { return xGraph(d.date); })
			.y(heightGraph);

		svgGraph
			.attr("width", widthGraph + marginGraph.left + marginGraph.right)
			.attr("height", heightGraph + marginGraph.top + marginGraph.bottom)
			.append("g")
			.attr("transform", "translate(" + marginGraph.left + "," + marginGraph.right + ")");
		
		svgGraph
			.select(".y axis")
			.call(yAxis);
	
		svgGraph
			.select( ".x axis")
			.attr("transform", "translate(0," + heightGraph + ")")
			.call(xAxis);
	
		svgGraph
			.select(".line")
			.attr("d", lineGraph);
	
		svgGraph.select(".x brush")
			.call(brush)
			.selectAll("rect")
			.attr("height", heightGraph);
	};
};