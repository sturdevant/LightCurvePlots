var xhr = new XMLHttpRequest();
xhr.open('GET', 'hawc_test_lightcurves_repaired.db', true);
xhr.responseType = 'arraybuffer';

// Given a database file & name of source, returns MJD, on & off data
function fetch(name) {
   // Make sure db is already loaded
   if (typeof db === 'undefined') {
      return;
   }
   
   var on_tbl = db.exec("SELECT "+ name + " FROM lightcurve_on")[0];
   var off_tbl = db.exec("SELECT " + name + " FROM lightcurve_off")[0];
   var mjd_tbl = db.exec("SELECT MJD FROM lightcurve_on")[0];
   
   // Make sure we have arrays of equal length (chop off last elt's)
   var lMjd = mjd_tbl.values.length;
   var lOn = on_tbl.values.length;
   var lOff = off_tbl.values.length;
   var l = d3.min([lMjd, lOn, lOff]);

   // Average on # of days, O(1) data points in # of days instead of O(n)
   // Shouldn't need high resolution when looking at a long timeframe anyway!
   var days = Math.ceil(mjd_tbl.values[l-1] - mjd_tbl.values[0]);

   // Throw out remainder points
   l = l - l % days;
   
   // data will contain json points w/ on, off, diff, rat & mjd values
   var dta = [];
   for (var i = 0; i < l; i += days) {
      var mjd = 0;
      var on = 0;
      var off = 0;
      // Average values to reduce # of data points, 
      // slightly reduces resolution, but vastly improves performance!
      for (var j = 0; j < days; j++) {
         mjd += +mjd_tbl.values[i+j]/days;
         on += +on_tbl.values[i+j]/days;
         off += +off_tbl.values[i+j]/days;
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
   
   return dta;
}

// When db is loaded, store into a var & plot the crab as default
xhr.onload = function(e) {
   // Load database into db
   var uInt8Array = new Uint8Array(this.response);
   db = new SQL.Database(uInt8Array);

   // Plot the Crab!
   var crab = "FGLJ0534_5PP2201_PSRJ0534PP2200";
   data = [];
   data.push(fetch(crab));
   plot();
};

// Send request for sql file
xhr.send();
