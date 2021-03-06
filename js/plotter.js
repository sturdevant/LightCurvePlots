// A few convenient functions
var mjd = function(d) { return d.mjd; };
var on = function(d) { return d.on; };
var off = function(d) { return d.off; };
var diff = function(d) { return d.diff; };
var cd = function(d) { return d.cd; };
var rat = function(d) { return d.rat; };
var gap = function(d) { return d.gap; };

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

// Set gap interpolations
var gap_f = d3.svg.area()
         .interpolate("step")
         .x(function(d) { return x(mjd(d)); })
         .y0(height)
         .y1(function(d) { return y(gap(d))});

var gap_c = d3.svg.area()
         .interpolate("step")
         .x(function(d) { return x2(mjd(d)); })
         .y0(height2)
         .y1(function(d) { return y2(gap(d))});

// Set brush
var brush = d3.svg.brush()
   .x(x2)
   .on("brush", brushed);

// Set plot type
function set_type(t) {
   foc = [];
   con = [];
   var f;
   if (t == "sep") {
      var on_int = d3.svg.area()
         .interpolate("basis")
         .x(function(d) { return x(mjd(d)); })
         .y0(height)
         .y1(function(d) { return y(on(d))});
      
      foc.push({f:on, i: on_int});
      
      f = off;
   } else if (t == "rat") {
      f = rat;
   } else if (t == "diff") {
      f = diff;
   } else if (t == "cd") {
      f = cd;
   }
   
   var foc_int = d3.svg.area()
      .interpolate("basis")
      .x(function(d) { return x(mjd(d)); })
      .y0(height)
      .y1(function(d) { return y(f(d))});
   
   var con_int = d3.svg.area()
      .interpolate("basis")
      .x(function(d) { return x2(mjd(d)); })
      .y0(height2)
      .y1(function(d) { return y2(f(d))});
   
   foc.push({f: f, i: foc_int});
   con.push({f: f, i: con_int});
   
   // Rescale domains based on new functions
   set_domains();
}

// Set x & y domains according to smallest & largest values
function set_domains() {
   var min = 0;
   var max = 0;
   for (var i = 0; i < foc.length; i++) {
      for (var j = 0; j < data.length; j++) {
         if (data[j] != null) {
            min = Math.min(min, d3.min(data[j].map(foc[i].f)));
            max = Math.max(max, d3.max(data[j].map(foc[i].f)));
         }
      }
   }
   
   x.domain([start.value, end.value]);
   y.domain([min, max]);
   x2.domain(x.domain());
   y2.domain(y.domain());
}

function add_plot() {
   // Set width & height
   svg = d3.select("div#pltcont").append("svg")
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

// Clear prev graph
function clear() {
   focus.selectAll("path").remove();
   context.selectAll("path").remove();
   focus.selectAll("g").remove();
   context.selectAll("g").remove();
}

function plot(tp) {
   // Clear prev graph, set type
   clear();
   set_type(tp);
   var set_gaps = false;
   for (var j = 0; j < data.length; j++) {
      if (data[j] != null){
         var dta = data[j];
         for (var i = 0; i < foc.length; i++) {
            focus.append("path")
               .datum(dta)
               .attr("class", "area"+i+""+j)
               .attr("d", foc[i].i)
               .on("mouseover",function(){
                  // Cool effect to bring hovered el't to front
                  d3.select(this).moveToFront();
                  d3.select(".gap").moveToFront();
                  d3.selectAll(".axis").moveToFront(); 
               });
         }
         
         for (var i = 0; i < con.length; i++) {
            context.append("path")
               .datum(dta)
               .attr("class", "area"+i+""+j)
               .attr("d", con[i].i);
         }
          
         // If not already done, put gaps in, else, move gaps to front
         if (!set_gaps) {
            focus.append("path")
               .datum(dta)
               .attr("class", "gap")
               .attr("d", gap_f);
            
            context.append("path")
               .datum(dta)
               .attr("class", "gap")
               .attr("d", gap_c);
            
            set_gaps = true;
         } else {
            d3.selectAll(".gap").moveToFront();
         }
      }
   }
   
   add_axes();
   brushed();
};

function add_axes() {
   // x & y for focus
   focus.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis);
   
   focus.append("g")
      .attr("class", "y axis")
      .call(yAxis);
   
   // x & brush for context
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

// Moves selection to front
d3.selection.prototype.moveToFront = function() {
   return this.each(function(){
      this.parentNode.appendChild(this);
   });
};


function brushed() {
   x.domain(brush.empty() ? x2.domain() : brush.extent());
   // Redraw plots
   for (var i = 0; i < foc.length; i++) 
      for (var j = 0; j < data.length; j++)
         focus.select(".area"+i+""+j).attr("d", foc[i].i);
   
   // Redraw gaps & x axis
   focus.selectAll(".gap").attr("d", gap_f);
   focus.select(".x.axis").call(xAxis);
}
