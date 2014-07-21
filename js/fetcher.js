var xhr = new XMLHttpRequest();
//xhr.open('GET', 'hawc_test_lightcurves_repaired.db', true);
xhr.open('GET', 'hawc_test_lightcurves_copy.db', true);
// timing info
var t0 = new Date().getTime();
xhr.responseType = 'arraybuffer';

m_diff = .0014
function find_gap(arr) {
   var t0 = new Date().getTime();
   var mjd = [];
   var gaps = [];
   for (var i = 1; i < arr.length; i++)
      if (arr[i] - arr[i-1] > m_diff) {
         // push 3 points to the left of gap w/ value -1000
         for (var j = 0; j < 3; j++) {
            point = {mjd: arr[i-1] - j*m_diff/3,
                     gap: -1000};
            gaps.push(point);
         }
         // push 3 points within the gap w/ value 1000
         for (var j = 0; j < 3; j++) {
            point = {mjd: +arr[i-1]+j*(arr[i]-arr[i-1])/3,
                     gap: 10000};
            gaps.push(point);
         }
         // push 3 points to the right of gap w/ value -1000
         for (var j = 0; j < 3; j++) {
            point = {mjd: +arr[i] + j*m_diff/3,
                     gap: 0};
            gaps.push(point);
         }
      }
   var t1 = new Date().getTime();
   console.log("time to find gaps");
   console.log(t1-t0);
   console.log(gaps);
   return gaps;
}   

// Given a database file & name of source, returns MJD, on & off data
function fetch(name) {
   // Make sure db is already loaded
   if (typeof db === 'undefined') {
      return;
   }
  
   // timing info
   var t0 = new Date().getTime();
   // Load arrays within date range
   var range = " WHERE MJD BETWEEN " + start.value + " AND " + end.value;
   var mjd_tbl = db.exec("SELECT MJD FROM lightcurve_on" + range)[0];
   var on_tbl = db.exec("SELECT "+ name + " FROM lightcurve_on" + range)[0];
   var off_tbl = db.exec("SELECT " + name + " FROM lightcurve_off" + range)[0];
   
   var t1 = new Date().getTime();
   console.log("time to query db (ms)");
   console.log(t1 - t0);
   

   // testing for gap detection!
   gap_arr = find_gap(mjd_tbl.values);


   t0 = new Date().getTime();
   
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
   var z = 0;
   for (var i = 0; i < l; i += days) {
      // Average mjd of range
      var mjd = .5*(+mjd_tbl.values[i+days-1] + +mjd_tbl.values[i]);
      var on = 0;
      var off = 0;
      // Average values to reduce # of data points, 
      // slightly reduces resolution, but vastly improves performance!
      for (var j = 0; j < days; j++) {
         on += +on_tbl.values[i+j]/days;
         off += +off_tbl.values[i+j]/days;
      }
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
         rat: rat};
      dta.push(point);
   }
   t1 = new Date().getTime();
   console.log("time to process all datapoints (ms)");
   console.log(t1 - t0);
   return dta;
}

// When db is loaded, store into a var & plot the crab as default
xhr.onload = function(e) {
   // timing info
   var t1 = new Date().getTime();
   console.log("time to load db file (ms)");
   console.log(t1-t0);
   // Load database into db
   var uInt8Array = new Uint8Array(this.response);
   db = new SQL.Database(uInt8Array);

   // Set Default time range
   end.value = 56812.89;
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

// Send request for sql file
xhr.send();
