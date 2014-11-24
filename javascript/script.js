var margin = {top: 10, left: 10, bottom: 10, right: 10}
	, width = parseInt(d3.select('#map').style('width'))
	, width = width - margin.left - margin.right
	, mapRatio = .5
	, height = document.getElementById("map").clientHeight;

var projection = d3.geo.albersUsa()
   .scale(width)
    .translate([width / 2, height / 2]);

var path = d3.geo.path()
	.projection(projection);

var svgEcoregions = d3.select("#map")//Problem #map
			.append("svg")
			.attr("width", width)
			.attr("height", height);

var colors = ["#FFD6A3", "#FFFFD4", "#B9E8A2", "#7DC9A9", "#2F5E99", "#51468F"]

var color = d3.scale.linear()
		.domain([6, 10, 12, 14, 20, 30])
		.range([colors[0], colors[1], colors[2], colors[3], colors[4], colors[5]])
		.interpolate(d3.interpolateHcl);

queue()
	.defer(d3.csv, "ecoregionMeans.csv")
	.defer(d3.json, "ecoregionBoundaries.json")
	.await(ready);

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
		var g = svgEcoregions
					.append("g");
		
		g.selectAll("path")
		    .data(topojson.feature(ecoregionBoundaries, ecoregions).features)
		.enter()
		    .append("path")
		    .attr("class", "ecoregionPolygons")
		       .attr("d", path)
		    .style("fill", function(d) {
								var value = d.properties.value; // PROBLEM SPOT
								if (value) {
									return color(value);
								} else {
									return "#ccc";
								};
							});
	};
	
	d3.select(window).on('resize', resize);
	function resize() {
		// adjust things when the window size changes
		width = parseInt(d3.select('#map').style('width'));
		width = width - margin.left - margin.right;
		height = width * mapRatio;
		
		// update projection
		projection
			.translate([width / 2, height / 2])
			.scale(width);
		
		svgEcoregions.selectAll("g").remove();
		drawMap();
	}
	
	
	var ecoregionPaths = svgEcoregions.select("g").selectAll("path")
	
	ecoregionPaths.on("mouseover", function(d,i) {
		ecoregionPaths.classed("top", false);
    	d3.select(this.parentNode.appendChild(this))
			.classed("top", true);
		var selectedEcoregionElement = document.getElementsByClassName("selected");
		selectedEcoregionElement[0].parentNode.appendChild(selectedEcoregionElement[0]);
	});
	
	var keydown = false;
	d3.select(document).on("keydown", function() {var keydown = true; console.log(keydown);});
	d3.select(document).on("keyup", function() {var keydown = false; console.log(keydown);});
	
	ecoregionPaths.on("click", function() {
		if (keydown == false) {ecoregionPaths.classed("selected", false); d3.select(this).classed("selected", true);}
		else {d3.select(this).classed("selected", true);};
		d3.select(this.parentNode.appendChild(this))
			.classed("top", true);
		var selectedEcoregionElement = document.getElementsByClassName("selected");
		selectedEcoregionElement[0].parentNode.appendChild(selectedEcoregionElement[0]);
	}); // select multiple on keydown not working yet...

};

/*
function bindData(error, ecoregionMeans, ecoregionBoundaries) {
	var min = 10;
	var max = 50;
	
	// Looping through each ecoregion...
	for(var j = 0; j < topojson.feature(ecoregionBoundaries, ecoregionBoundaries.objects.level3ecoregions).features.length; j++) {
				
		// Pick out the ecoregion we're working with
		var jsonEcoregion = topojson.feature(ecoregionBoundaries, ecoregionBoundaries.objects.level3-ecoregions).features[j].properties.NA_L3NAME;
		
		// Declare variables to tally sum and number of noDataDates
		var sum = 0;
		var noDataDates = 0;
				
		// For each date...
		for(var i = min; i <= max; i++) {
		
			// Do the following for each ecoregion...
			if (ecoregionMeans[i][jsonEcoregion] == "NA") { // If there's no data, add 1 to noDataDates
				noDataDates += 1;
			} else { // Else, sum it
				sum += parseFloat(data[i][jsonEcoregion]);
			};
			
		}; // END looping through each day in rangeSlider bounds
		
		// Our new mean is the sum divided by the range of dates (minus the dates with no data not used in sum)
		var mean = sum / ((max - min) - noDataDates);
		
		// Assign a new value for each ecoregion
		topojson.feature(ecoregionBoundaries, ecoregionBoundaries.objects.level3-ecoregions).features[j].properties.value = mean;
		
	}; // END looping through each ecoregion
};

function drawMap(error, ecoregionBoundaries) {
	var ecoregionPolygons = svgEcoregions
					.append("g")
					    .attr("class", "ecoregionPolygons")
					.selectAll("path")
					    .data(topojson.feature(ecoregionBoundaries, ecoregionBoundaries.objects.level3-ecoregions).features)
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
					});
}; */