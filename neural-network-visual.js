// Main Model Parameters =====================================================================
//============================================================================================
//============================================================================================
//============================================================================================

var neuronsPerLayer = [5,7,5,3], // from left to right, indicate the number of neurons in each layer | each array entry indicates an individual layer | the first entry indicates the number of inputs
	minumumNumberNeuronsForVerticalSpacing = 8, // Set a minimum number of vertical placeholders for neuron positions to help with whitespace when layers do not have many neurons
	numberNeuronsForVerticalSpacing = d3.max([d3.max(neuronsPerLayer),minumumNumberNeuronsForVerticalSpacing]), // Set the actual number of neuron positions needed, with a lower bound set by minumumNumberNeuronsForVerticalSpacing
	numberColumns = neuronsPerLayer.length-1, // number of vertical columns (layers to plan for in the image)
	margin = { right: 75, left: 75, top: 25, bottom: 25 }, //set margins around the whole image
	labelPadding = { lower: 25, lowerTextYPosition: 20, upper: 25, upperYPosition: 20 };

var colorscheme = ["rgb(245, 243, 239)","rgb(249, 235, 242)","rgb(250, 221, 237)","rgb(240, 179, 214)","rgb(221, 114, 173)","rgb(192, 38, 126)","rgb(142, 1, 82)"];
var grays = ["rgb(119,119,119)","rgb(193,193,193)"]

// Set up frame ==============================================================================
//============================================================================================
//============================================================================================
//============================================================================================


// Get reference to container div
var div = d3.select("#div-basic-layout");

// Determine container and content size
var divWidth = getDivWidth(div),
	divHeight = getDivHeight(),
	mainContentWidth = divWidth - margin.left - margin.right,
	mainContentHeight = divHeight - margin.top - labelPadding.upper - labelPadding.lower - margin.bottom;

// Helper functions to get container size - reused when resizing
function getDivWidth(div) { return divWidth = div.node().getBoundingClientRect().width; }
function getDivHeight() { return divHeight = divWidth * .5; }


// Generate Neuron and Link Data =============================================================
//============================================================================================
//============================================================================================
//============================================================================================


var elementPositions = [], // Basic raw coordinates [layer #, neuron #] for each neuron | Each layer gets its own nested array of coordinates
	// elementPositions: [[[1,1],[1,2],..],[[2,1],[2,2],..]]
	neuronData = [], // Flat list of neurons to display
	// neuronData: {neuron:"l1n2", x:1, y:2, classes:"neuron l1 "}
	linkData = []; // Flat list of links to display

// Create map of raw coordinates for each neuron
neuronsPerLayer.forEach((d,i) => {
	elementPositions.push([]); // Create nested array for each layer, 
	for (n = 0; n < d; n++) { // Iterate through the number of neurons
		elementPositions[i].push([i + 1, n + 1]); // Add relative coordinates to each layer's child array
	}
});

// Create identifiers, coordinates, classes, and links between neurons
function generateNeuronAndLinkData() {

	// For each layer...
	elementPositions.forEach((d,i,a) => { 
		// For each neuron within a layer...
		d.forEach((dd,ii,aa) => { 
			// Give each neuron an object with its associated data
			let layer = dd[0];
			let neuron = dd[1];
			let sourceNeuron = "l" + layer + "n" + neuron;
			let neuronClasses = "neuron l" + layer;
			neuronData.push({ neuron: sourceNeuron, x: layer, y: neuron, classes: neuronClasses }); // Add a new neuron to the array, arrays maintain order

			// Give each link an object with its associated data
			let targetNeuron = "";
			let linkClasses = "";
			if ( layer != a.length ) { // If not the last layer
				connectedLayerNeurons = a[layer]; // Because arrays are 0-based and "layer" is not, a[layer] produces the next connected layer
				connectedLayerNeurons.forEach((ddd, iii, aaa) => { // Cycle through each connected layer's neurons to create a formal link and class relationship
					targetNeuron = "l"+ddd[0]+"n"+ddd[1];
					linkClasses = "link " + sourceNeuron + " " + targetNeuron + " l" + layer;
					linkData.push({ sourceNeuron: sourceNeuron, source: dd, targetNeuron: targetNeuron, target: ddd, classes: linkClasses, zIndex: 0 }) // Add a new link to the list
				})
			}
		})	
	})
}	
generateNeuronAndLinkData();


// Set Up Spacing ============================================================================
//============================================================================================
//============================================================================================
//============================================================================================


// Set scale for horizontal positioning
var x_Spacing = d3.scaleLinear()
	.domain([0,numberColumns])
	.range([0,mainContentWidth])
	.clamp(true);

// Set scale for vertical positioning
var y_Spacing = d3.scaleLinear()
	.domain([0,numberNeuronsForVerticalSpacing - 1])
	.range([mainContentHeight,0])
	.clamp(true);

// Determine the number of Y positions needed
// The neurons of a layer with an even number of neurons will be positioned differently than one with an odd number of neurons
// The neurons in the even-neuroned-layer will sit at mid-points between the neurons of the odd-neuroned-layered neurons (and vice versa)
// Thus, the code doubles the number of max neurons in a layer to get the number of positions needed (and then subtracts 1 to center the positions vertically)

var numberOfYPositionsNeeded = (numberNeuronsForVerticalSpacing * 2) - 1, // Why "x - 1"? This number will always be odd because the last neuron in a layer does not need an offset position after it
	yPositionPlaceholders = y_Spacing.ticks(numberOfYPositionsNeeded).reverse(), // Array of where the y positions appear on the domain, reversed to logical display data in the right order
	// yPositionPlaceholders: [0, 0.5, 1, 1.5...] will be input into y scale for pixel
	yPositionIndexes_CenteredOnScale = [], // Stores the indexes of which yPositionsPlaceholder should map to a given neuron
	// yPositionIndexes_CenteredOnScale: [[0,2,4,6,8],[1,3,5,7]] by layer, index value to get from yPositionPlaceholders
	yPositionCoordinates = []; // list of y pixel coordinates for each placeholder
	// yPositionCoordinates: //pixel coordinates based on y_scale
	
// Determine actual yPositionIndexes, starting and moving out from center
neuronsPerLayer.forEach((d,i) => {
	let yMidPositionIndex = Math.floor(numberOfYPositionsNeeded / 2); // Get middle y position; use floor because of 0 based position index
	let yPositions = []; // Create holder for yPositions
	if (d % 2 == 1) { // If number of neurons is odd
		let neuronsAboveOrBelowCenter = (d - 1) / 2;
		for ( i = -neuronsAboveOrBelowCenter; i <= neuronsAboveOrBelowCenter; i++) {
			yPositions.push(yMidPositionIndex + (2 * i));
		}
	} else { // If number of neurons is even
		let neuronsAboveOrBelowCenter = d / 2;
		for ( i = -neuronsAboveOrBelowCenter; i <= neuronsAboveOrBelowCenter; i++) {
			if (i < 0) {yPositions.push((yMidPositionIndex - 1) + (2 * (i + 1)))};
			if (i > 0) {yPositions.push((yMidPositionIndex + 1) + (2 * (i - 1)))};
			// Ignore the case of i == 0 because there is no middle neuron with an even number of neurons
		}
	}
	yPositionIndexes_CenteredOnScale.push(yPositions);	
});


// Initial Setup =============================================================================
//============================================================================================
//============================================================================================
//============================================================================================


// Create SVG, Frame, and Main Groups
var svg = div.append("svg");
var frame = svg.append("rect").attr("class", "frame");
var g_MainContent = svg.append("g").attr("class", "g_MainContent");
var g_Links = g_MainContent.append("g").attr("class","g_links");
var g_Neurons = g_MainContent.append("g").attr("class","g_neurons");
var g_inputsText = g_MainContent.append("g").attr("class","g_inputsText");
var g_outputsText = g_MainContent.append("g").attr("class","g_outputsText");

// Add Links
var links = g_Links.selectAll("line").data(linkData);
links = links.enter().append("line")
	.attr("class", d => {return d.classes;})
	.merge(links);

// Add Neurons (on top of links, aka lower in DOM)
var neurons = g_Neurons.selectAll("circle").data(neuronData);
neurons = neurons.enter().append("circle")
	.attr("id", d => {return d.neuron;} )
	.attr("class", d => {return d.classes;} )
	.merge(neurons)
	.on("mouseover",showConnections) // Add interactivity during hover
	.on("mouseout",removeConnectionFormatting)
	.on("touchstart",highlightNeuronInfluence);

// Setup text to indicate input variables
var inputXs = g_inputsText.selectAll(".inputX").data(neuronData.filter(d => { return +d.x == 1}));
inputXs = inputXs.enter().append("text")
	.attr("id", d => {return "t" + d.neuron;})
	.attr("class", "inputX")
	.merge(inputXs)
	.attr("text-anchor","middle")
	.text("x")
	.on("mouseover",showConnections) // Add interactivity during hover
	.on("mouseout",removeConnectionFormatting)
	.on("touchstart",highlightNeuronInfluence);
var inputSubscripts = inputXs.append("tspan")
	.text(function(d){return d.y})
	.attr("class","subscript")
	.style("baseline-shift","sub");

// Setup text to indicate output variables
var outputYs = g_outputsText.selectAll(".outputY").data(neuronData.filter((d,i,a) => { return +d.x == neuronsPerLayer.length}));
outputYs = outputYs.enter().append("text")
	.attr("id", d => {return "t" + d.neuron;})
	.attr("class", "outputY")
	.merge(outputYs)
	.attr("text-anchor","middle")
	.text("\u0177")
	.on("mouseover",showConnections) // Add interactivity during hover
	.on("mouseout",removeConnectionFormatting)
	.on("touchstart",highlightNeuronInfluence);
var outputSubscripts = outputYs.append("tspan")
	.text(function(d){return d.y})
	.attr("class","subscript")
	.style("baseline-shift","sub");


// Upper & Lower Labels ======================================================================
//============================================================================================
//============================================================================================
//============================================================================================
//============================================================================================


var labelPositions = [];

// Determine positions
for (let index = 0; index <= numberColumns; index++) {
	labelPositions.push(index);
}

// Setup Lower Group
var g_Labels = svg.append("g").attr("class","g-lower-labels")
	.attr("transform","translate(" + margin.left + "," + (margin.top) + ")");

// Setup Lower Labels
var labels = g_Labels.selectAll("text").data(labelPositions);
labels = labels.enter().append("text")
	.attr("class","layer-label")
	.merge(labels)
	.attr("text-anchor","middle")
	//.style("font-size",getLabelFontSize)
	.text(generateLowerLabelText);

function generateLowerLabelText(d) {
	switch (d) {
		case 0:
			return "Input";
			break;
		case (numberColumns): // aka output
			return "Prediction";
			break;
		default:
			return "Hidden Layer " + d;
			break;
	}
}

// Define arrowheads
var marker = svg.append("defs").append("marker");
marker.attr("id","arrowhead")
	.attr("markerWidth",10)
	.attr("markerHeight",10)
	.attr("orient","auto")
	.attr("markerUnits","strokeWidth")
	.attr("refX","6")
	.attr("refY","3")
	.attr("viewBox","0 0 20 20");
var arrowHead = marker.append("path")
	.attr("class","arrowhead")
	.attr("d","M0,0 L0,6 L9,3 z");

// Setup arrows
arrowStartEnd = [[0.5,numberColumns-0.5]];
var g_flow_arrow = svg.append("g").attr("class","flow-area-group")
	.attr("transform","translate(" + margin.left + "," + (margin.top + labelPadding.upper + mainContentHeight + (labelPadding.lower/2)) + ")");
var flow_arrow = g_flow_arrow.selectAll("line").data(arrowStartEnd);
flow_arrow = flow_arrow.enter().append("line")
	.attr("class","flow-arrow")
	.merge(flow_arrow)
	.attr("marker-end","url(#arrowhead)");


// Update Sizes ==============================================================================
//============================================================================================
//============================================================================================
//============================================================================================
//============================================================================================


console.log("elementPositions", elementPositions); // [[[1,1],[1,2],..],[[2,1],[2,2],..]]
console.log("neuronData",neuronData); //{neuron:"l1n2", x:1, y:2, classes:"neuron l1 "}
console.log("yPositionPlaceholders",yPositionPlaceholders); //[0, 0.5, 1, 1.5...] will be input into y scale for pixel
console.log("yPositionIndexes_CenteredOnScale",yPositionIndexes_CenteredOnScale); //[[0,2,4,6,8],[1,3,5,7]] by layer, index value to get from yPositionPlaceholders
console.log("yPositionCoordinates",yPositionCoordinates); //pixel coordinates based on y_scale

function resize() {
	// Resize SVG, Frame, and Main Groups
	svg.attr("width", getDivWidth(div)).attr("height", getDivHeight());
	frame.attr("x", "0").attr("y", "0").attr("width", divWidth).attr("height", divHeight);
	g_MainContent.attr("transform", "translate(" + margin.left + "," + (margin.top + labelPadding.upper) + ")");

	// Resize Other Reference Frames
	mainContentWidth = divWidth - margin.left - margin.right;
	mainContentHeight = divHeight - margin.top - labelPadding.upper - labelPadding.lower - margin.bottom;
	x_Spacing.range([0, mainContentWidth]);
	y_Spacing.range([mainContentHeight,0]);

	// get actual pixel coordinates of y position placeholders (which were in terms of domain intervals)
	yPositionCoordinates = [];
	yPositionPlaceholders.forEach(d => yPositionCoordinates.push(y_Spacing(d)));
	//console.log(yPositionCoordinates);

	// Calculate neuron radius based on total vertical height available
	let neuronRadius = d3.max([(mainContentHeight/numberNeuronsForVerticalSpacing)/2 - 3,2]);
	let fntSize = d3.min([neuronRadius * 1, 16]);
	let subFntSize = fntSize * .7;
	let fntDyOffset = neuronRadius/5;

	// Set position of neurons
	neurons.attr("r", neuronRadius)
		.attr("cx", (d) => { return x_Spacing(d.x - 1)})
		.attr("cy", (d) => { return yPositionCoordinates[yPositionIndexes_CenteredOnScale[d.x-1][d.y-1]] });//{ return y_Spacing(d.y)});

	// Set position of links
	links = g_Links.selectAll('.link')
		.attr("x1", (d) => { return x_Spacing(d.source[0] - 1)})
		.attr("x2", (d) => { return x_Spacing(d.target[0] - 1)})
		.attr("y1", (d) => { return yPositionCoordinates[yPositionIndexes_CenteredOnScale[d.source[0]-1][d.source[1]-1]] }) //{ return y_Spacing(d.source[1])})
		.attr("y2", (d) => { return yPositionCoordinates[yPositionIndexes_CenteredOnScale[d.target[0]-1][d.target[1]-1]] });

	// Position input text
	inputXs
		.attr("x", d => { return x_Spacing(d.x-1)})
		.attr("y", d => { return yPositionCoordinates[yPositionIndexes_CenteredOnScale[d.x-1][d.y-1]]})
		.attr("dy",fntDyOffset)
		.style("font-size",fntSize);;
	inputSubscripts.attr("font-size", subFntSize);

	// Position output text
	outputYs
		.attr("x", d => { return x_Spacing(d.x-1)})
		.attr("y", d => { return yPositionCoordinates[yPositionIndexes_CenteredOnScale[d.x-1][d.y-1]]})
		.attr("dy",fntDyOffset)
		.style("font-size",fntSize);
	outputSubscripts.attr("font-size", subFntSize);
	
	// Position lower labels
	g_Labels.attr("transform","translate(" + margin.left + "," + (margin.top) + ")");
	labels.attr("x", (d) => { return x_Spacing(d) })
		.attr("y",labelPadding.lowerTextYPosition);

	// Position flow arrows
	g_flow_arrow.attr("transform","translate(" + margin.left + "," + (margin.top + labelPadding.upper + mainContentHeight + (labelPadding.lower/2)) + ")");
	flow_arrow.attr("x1", (d) => { console.log(d); return x_Spacing(d[0])} )
	.attr("y1", 0)
	.attr("x2", (d) => { console.log(d); return x_Spacing(d[1])} )
	.attr("y2", 0);

	//if (!svg.empty()){svg.remove();};
	//div.selectAll("*").remove();
}
resize();
window.addEventListener("resize", resize);


// Interactivity =============================================================================
//============================================================================================
//============================================================================================
//============================================================================================


function showConnections(d) {
	// Style the neuron that is hovered over
	d3.select("#" + d.neuron).style("fill",colorscheme[3]);

	// Style connected neurons
	neurons.filter(function(dd){ 
			if (dd.neuron.slice(0,3) != d.neuron.slice(0,3) && dd.neuron.slice(0,3) != d.neuron.slice(0,3)) {
				return this
			} else { return null}
		})
		.style("fill",colorscheme[3]);

	// Style related links
	links.filter(function(dd){ 
			if (d.neuron == dd.targetNeuron || d.neuron == dd.sourceNeuron) {
				return this
			} else if (d.x < dd.source[0] || (d.x-1) > dd.source[0]){ 
				return this
			} else {
				return null
			}
		})
		.datum(function(d) { d.zIndex = 2; return d; })
		.style("stroke",colorscheme[4]);

	// Ensure related links appear on top of non-related links
	links.sort(function(a,b) {
		return a.zIndex - b.zIndex;
	}); 
}

// Restore original display states
function removeConnectionFormatting() {
	let links = g_Links.selectAll(".link")
		links.datum(function(d) { d.zIndex = 0; return d; })
		.style("stroke",grays[1]);
	
	g_Neurons.selectAll(".neuron")
		.style("fill","white");
}

// Provide functionality for touch events on mobile devices
function highlightNeuronInfluence(d){
	console.log("touch called");
	showConnections(d);
	setTimeout(removeConnectionFormatting, 700);
}
