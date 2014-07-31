var xhr = new XMLHttpRequest();
//xhr.open('GET', 'hawc_test_lightcurves_repaired.db', true);
xhr.open('GET', 'hawc_test_lightcurves_copy.db', true);
xhr.responseType = 'arraybuffer';

// Send request for sql file
xhr.send();

function find_gap(arr) {
   var m_diff = .0014;
   var gaps = [];
   for (var i = 1; i < arr.length; i++) {
      if (arr[i] - arr[i-1] > m_diff) {
         gaps.push(i-1);
         gaps.push(i);
      }
   }

   return gaps;
}   

// Given a database file & name of source, returns MJD, on & off data
function fetch(name) {
   // Make sure db is already loaded
   if (typeof db === 'undefined') {
      return;
   }
  
   // Load arrays within date range
   var range = " WHERE MJD BETWEEN " + start.value + " AND " + end.value;
   var mjd_tbl = db.exec("SELECT MJD FROM lightcurve_on" + range)[0];
   var on_tbl = db.exec("SELECT "+ name + " FROM lightcurve_on" + range)[0];
   var off_tbl = db.exec("SELECT " + name + " FROM lightcurve_off" + range)[0];
   
   // Detect gaps in data
   var gaps = find_gap(mjd_tbl.values);

   // Make sure we have arrays of equal length (chop off last elt's)
   var lMjd = mjd_tbl.values.length;
   var lOn = on_tbl.values.length;
   var lOff = off_tbl.values.length;
   var l = d3.min([lMjd, lOn, lOff]);

   // Set input box values to max & min mjd values (very important since
   // plotter relies on start.value & end.value for domain!)
   start.value = Math.floor(100*mjd_tbl.values[0])/100;
   end.value = Math.ceil(100*mjd_tbl.values[l-1])/100;

   // Average on # of days, O(1) data points in # of days instead of O(n)
   // Shouldn't need high resolution when looking at a long timeframe anyway!
   var days = Math.ceil((mjd_tbl.values[l-1] - mjd_tbl.values[0])/2);
   
   // Throw out remainder points
   l = l - l % days;
   // data will contain json points w/ on, off, diff, rat & mjd values
   var dta = [];
   // number of consecutive zeros encountered
   var z = 0;
   // array to keep track of prev/current/next value was a gap
   var g = [false, false, false];

   for (var i = 0; i < l; i += days) {
      // Average mjd of range
      var mjd = .5*(+mjd_tbl.values[i+days-1] + +mjd_tbl.values[i]);
      var on = 0;
      var off = 0;
      var gn = false;
      var gap = -1000;

      // Average values to reduce # of data points, 
      // slightly reduces resolution, but vastly improves performance!
      for (var j = 0; j < days; j++) {
         on += +on_tbl.values[i+j]/days;
         off += +off_tbl.values[i+j]/days;
         // Check if next point will have a gap
         if (gaps.indexOf(i+j+days) != -1)
            gn = true;
      }
      
      // if prev, curr or next are gaps, don't display this point
      g.shift();
      g.push(gn);
      if (g[0] || g[1] || g[2])
         gap = 1000;

      // Either increment if this is zero or reset zero counter
      on == 0 && off == 0 ? z++ : z = 0;
      // Every eleven zeros, remove the middle (so that we have a padding of 5
      // zero points, makes the interpolation look nicer than no padding!)
      if (z == 11) {
         z = 10;
         dta.splice(dta.length - 6, 1);
      }

      var diff = on - off;
      var rat = off == 0 ? 0 : on/off;
      
      point = {mjd: mjd,
         on: on,
         off: off,
         diff: diff,
         rat: rat,
         gap: gap};
      dta.push(point);
   }
   return dta;
}

// When db is loaded, store into a var & plot the crab as default
xhr.onload = function(e) {
   // Load database into db
   var uInt8Array = new Uint8Array(this.response);
   db = new SQL.Database(uInt8Array);

   // Set Default time range as past 24 hrs
   console.log(get_mjd(new Date()));
   end.value = 56812.89; // to be replaced with get_mjd(new Date())
   start.value = end.value - 1;

   // Plot the Crab!
   var crab = "FGLJ0534_5PP2201_PSRJ0534PP2200";
   fb0_hidden.value = crab;
   data = [];
   data.push(fetch(crab));
   
   // Make data length 2
   data.push(null);
   plot();
};

// for reference, see http://en.wikipedia.org/wiki/Julian_day#Calculation
// verified accuracy w/ http://tycho.usno.navy.mil/cgi-bin/daterdnm.sh
var get_mjd = function(d) {
   var year = d.getUTCFullYear();
   var month = d.getUTCMonth() + 1; // getMonth gives 0 for jan, want 1
   var day = d.getUTCDate();
   var hour = d.getUTCHours();
   var min = d.getUTCMinutes();
   var sec = d.getUTCSeconds(); // don't need this much precision, but why not?

   var a = Math.floor((14-month)/12);
   var y = year + 4800 - a;
   var m = month + 12*a - 3;

   // Using Gregorian calendar
   var jdn = day + Math.floor((153*m+2)/5) + 365*y + Math.floor(y/4);
   jdn += -Math.floor(y/100) + Math.floor(y/400) - 32045;

   var jd = jdn + (hour - 12)/24 + min/1440 + sec/86400;
   return jd - 2400000.5; // want mjd, not jd
}
