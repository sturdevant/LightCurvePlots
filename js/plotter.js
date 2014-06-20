// Set margins
var margin = {top: 10, right: 10, bottom: 100, left: 40},
    margin2 = {top: 430, right: 10, bottom: 20, left: 40},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom,
    height2 = 500 - margin2.top - margin2.bottom;

// Set scales
var x = d3.scale.linear().range([0, width]),
    x2 = d3.scale.linear().range([0, width]),
    y = d3.scale.linear().range([height, 0]),
    y2 = d3.scale.linear().range([height2, 0]);

// Set axes
var xAxis = d3.svg.axis().scale(x).orient("bottom"),
    xAxis2 = d3.svg.axis().scale(x2).orient("bottom"),
    yAxis = d3.svg.axis().scale(y).orient("left");

// Set brush
var brush = d3.svg.brush()
   .x(x2)
   .on("brush", brushed);

function add_plot() {
// Set width & height
 svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)

// Clip path to not go beyond width & height
svg.append("defs").append("clipPath")
    .attr("id", "clip")
    .append("rect")
    .attr("width", width)
    .attr("height", height);

// Translate focus & context to proper location
 focus = svg.append("g")
    .attr("class", "focus")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

 context = svg.append("g")
    .attr("class", "context")
    .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");
}

function brushed() {
  var e = document.getElementById("pltype");
  var tp = e.options[e.selectedIndex].value;

  x.domain(brush.empty() ? x2.domain() : brush.extent());

  // Depending on plot type, redraw graph in focus
  if (tp == "sep") {
     focus.select(".area").attr("d", foc_off);
     focus.select(".area3").attr("d", foc_on);
  } else if (tp == "rat") {
     focus.select(".area").attr("d", foc_rat);
  } else if (tp == "diff") {
     focus.select(".area").attr("d", foc_diff);
  }

  focus.select(".x.axis").call(xAxis);
}
