// A few convenient functions
var mjd = function(d) { return d.MJD; };
var on = function(d) { return d.on; };
var off = function(d) { return d.off; };
var diff = function(d) { return d.on - d.off; };
var rat = function(d) { if (d.off == 0) { return 0; } return d.on / d.off; };

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

// Set interpolations
// Interpolations for focus & context
var foc_off = d3.svg.area()
    .interpolate("basis")
    .x(function(d) { return x(mjd(d)); })
    .y0(height)
    .y1(function(d) { return y(off(d)); });

var foc_on = d3.svg.area()
    .interpolate("basis")
    .x(function(d) { return x(mjd(d)); })
    .y0(height)
    .y1(function(d) { return y(on(d)); });

var foc_diff = d3.svg.area()
    .interpolate("basis")
    .x(function(d) { return x(mjd(d)); })
    .y0(height)
    .y1(function(d) { return y(diff(d)); });

var foc_rat = d3.svg.area()
    .interpolate("basis")
    .x(function(d) { return x(mjd(d)); })
    .y0(height)
    .y1(function(d) { return y(rat(d)); });

var con_off = d3.svg.area()
   .interpolate("basis")
   .x(function(d) { return x2(mjd(d)); })
   .y0(height2)
   .y1(function(d) { return y2(off(d)); });

var con_rat = d3.svg.area()
   .interpolate("basis")
   .x(function(d) { return x2(mjd(d)); })
   .y0(height2)
   .y1(function(d) { return y2(rat(d)); });

var con_diff = d3.svg.area()
   .interpolate("basis")
   .x(function(d) { return x2(mjd(d)); })
   .y0(height2)
   .y1(function(d) { return y2(diff(d)); });

function set_interpolations(foc, con) {
   for (var i = 0; i < foc.length; i++) {
      foc[i].i = d3.svg.area()
         .interpolate("basis")
         .x(function(d) { return x(mjd(d)); })
         .y0(height)
         .y1(function(d) { return y(foc[i].f)});
   }
   
   for (var i = 0; i < con.length; i++) {
      con[i].i = d3.svg.area()
         .interpolate("basis")
         .x(function(d) { return x2(mjd(d)); })
         .y0(height2)
         .y1(function(d) { return y2(con[i].f)});
   }
}

// Set plot type
function set_type(t) {
   foc = [];
   con = [];
   if (t == "sep") {
      foc.push({f:on});
      foc.push({f:off});
      con.push({f:off});
   } else if (t == "rat") {
      foc.push({f:rat});
      con.push({f:rat});
   } else if (t == "diff") {
      foc.push({f:diff});
      con.push({f:diff});
   }

   set_domains(foc, con);
   set_interpolations(foc, con);
}

// Set x & y domains according to smallest & largest values
function set_domains(foc, con) {
   min = 0,
   max = 0;
   for (var i = 0; i < foc.length; i++) {
     min = Math.min(min, d3.min(data.map(foc[i].f)));
     max = Math.max(max, d3.max(data.map(foc[i].f)));
   }
   x.domain(d3.extent(data, mjd));
   y.domain([min, max]);
   x2.domain(x.domain());
   y2.domain(y.domain());
}

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

function plot() {
  var tp = e.options[e.selectedIndex].value;

  set_type(tp);
  // Decides which graph to draw depending on selected plot type
  if (tp == "sep") {
     // Append foc_on & foc_off to focus (on & off graphs)
     focus.append("path")
         .datum(data)
         .attr("class", "area")
         .attr("d", foc_off);

     focus.append("path")
         .datum(data)
         .attr("class", "area3")
         .attr("d", foc_on);

     // Append con_off to context (off graph since it's a bit smoother!)
     context.append("path")
         .datum(data)
         .attr("class", "area")
         .attr("d", con_off);

  } else if (tp == "rat") {
     // Append ratio graph to focus and context
     focus.append("path")
         .datum(data)
         .attr("class", "area")
         .attr("d", foc_rat);
     context.append("path")
         .datum(data)
         .attr("class", "area")
         .attr("d", con_rat);

  } else if (tp == "diff") {
     // Append difference graph to focus & context
     focus.append("path")
         .datum(data)
         .attr("class", "area")
         .attr("d", foc_diff);

     context.append("path")
         .datum(data)
         .attr("class", "area")
         .attr("d", con_diff);
  }


  focus.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);

  focus.append("g")
      .attr("class", "y axis")
      .call(yAxis);

  context.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height2 + ")")
      .call(xAxis2);

  context.append("g")
      .attr("class", "x brush")
      .call(brush)
    .selectAll("rect")
      .attr("y", -6)
      .attr("height", height2 + 7);
};
function brushed() {
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
