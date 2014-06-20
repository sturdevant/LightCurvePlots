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

   // data will contain json points w/ on, off & mjd values
   data = [];
   for (var i = 0; i < on_tbl.values.length; i++) {
      point = {MJD: mjd_tbl.values[i],
         on: on_tbl.values[i],
         off: off_tbl.values[i]};
      data.push(point);
   }
   return data;
}

// When db is loaded, store into a var & plot the crab as default
xhr.onload = function(e) {
   // Load database into db
   var uInt8Array = new Uint8Array(this.response);
   db = new SQL.Database(uInt8Array);

   // Plot the Crab!
   var crab = "FGLJ0534_5PP2201_PSRJ0534PP2200";
   fetch(crab);
   plot(0);
};

// Send request for sql file
xhr.send();
