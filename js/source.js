// various functions for a source type object

// Creates a "source" object from name, MJD & lightcurve arrays
var source = function (name, MJD, on, off, ratio) {
   // Grab the canonical and catalog names
   alert("it works!");
   prs = parse_name(name);
   
   // Grab base MJD, shift other arrays to be of same length
   var base = MJD.shift(); 
      on.shift();
      off.shift();
      ratio.shift();
   
   // Return the source object
   return {cat: prs.cat, can: prs.can, base: base, MJD: MJD, on: on, off: off, ratio: ratio};
};

// Returns the catalog and cannonical name from the name in table
var parse_name = function (name) {
   // Split the name by underscore
   var splt = name.split("_");
   // Very last el't is cannonical name, the join of the rest is the cat name
   var can = splt.pop();
   var cat = splt.join("");
   return {cat: cat, can: can};
};

