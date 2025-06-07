// Import necessary modules and classes for coordinate transformation, projection, and map functionalities
import proj4 from "proj4";
import { register } from "ol/proj/proj4";
import Projection from "ol/proj/Projection";
import { useGeographic, transform, transformExtent } from "ol/proj";
import { format, toStringHDMS } from "ol/coordinate";
import Point from 'ol/geom/Point.js';
import { LineString } from "ol/geom";
import { GeoJSON } from 'ol/format';
import { View } from "ol";
import Feature from 'ol/Feature';

// Export functions and constants for use in other modules
export {
  SetView,
  SetCenterWgsPoint,
  UpdateStatusStyle,
  El,
  GPStracking,
  UpdateMap
};

// Initialize constants for geographic coordinates and map settings
const centerWgs = [0, 0];
const lastWgs = [0, 0];
const secondLastWgs = [0, 0];
const centerUtm = [0, 0];
let Wgs84FormatIsDecimal = true;
let GPSon = false;

// Set the geographic coordinate system as default
useGeographic();

// Define UTM projections using proj4 library
proj4.defs("EPSG:25832", "+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs");
proj4.defs("EPSG:25833", "+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs");

// Register projections with OpenLayers
register(proj4);

// Create projection objects for EPSG:25832 and EPSG:25833
const proj25832 = new Projection({
  code: "EPSG:25832",
  extent: [-1877994.66, 3932281.56, 804418.76, 9494203.2]
});

const proj25833 = new Projection({
  code: "EPSG:25833",
  extent: [-2465144.8, 4102893.55, 750106.63, 9465228.24]
});

// Function to get an HTML element by its ID
function El(id) {
  return document.getElementById(id);
}

// Function to set the map view instance directly
function SetView(view) {
  if (view) {
    view.setCenter(centerWgs);
    view.setZoom(10); // Example zoom level
  }
}

// Function to set the center point in WGS84 format and update input fields
function SetCenterWgsPoint(wgsPoint) {
  centerWgs[0] = Number(wgsPoint[0]);
  centerWgs[1] = Number(wgsPoint[1]);

  // Update input fields based on WGS84 format
  let lon = El("Lon");
  let lat = El("Lat");

  if (lon && lat) {
    if (Wgs84FormatIsDecimal) {
      lon.value = centerWgs[0].toFixed(6);
      lat.value = centerWgs[1].toFixed(6);
    } else {
      UpdateLatLonTxt(); // Make sure UpdateLatLonTxt is handling the non-decimal case
    }
  }
}

// Function to toggle GPS tracking and update the image source based on GPS status
function GPStracking(id, geoloc) {
  let posImg = El(id);

  if (posImg) {
    posImg.addEventListener("click", function () {
      GPSon = !GPSon;
      console.log(`GPS-${GPSon ? 'ON' : 'OFF'} : ${GPSon}`);
      posImg.src = `resources/icons8-gps-96-${GPSon ? 'on' : 'off'}.png`;
      geoloc.setTracking(GPSon);
    });
  } else {
    console.error(`Element with ID ${id} not found.`);
  }
}

// Function to update latitude and longitude input fields based on selected format
// Function to update latitude and longitude input fields based on selected format
function UpdateLatLonTxt() {
  let lon = El("Lon");
  let lat = El("Lat");

  if (lon && lat) {
    if (Wgs84FormatIsDecimal) {
      lon.value = centerWgs[0].toFixed(6);
      lat.value = centerWgs[1].toFixed(6);
    } else {
      // Assuming you need to convert to GMS format
      let out = toStringHDMS(centerWgs);
      let stringFunc = Array.from(out);

      if (El("GGG").style.color === "rgb(33, 150, 243)") {
        lon.value = centerWgs[0].toFixed(7);
        lat.value = centerWgs[1].toFixed(7);
      }

      if (El("GMS").style.color === "red") {
        lat.value = stringFunc.slice(0, 11).join("");
        lon.value = stringFunc.slice(14, 25).join("");
      }
    }
  }
}
// Function to convert latitude and longitude from HDMS (hours, degrees, minutes, seconds) format to decimal degrees
function fromHDMS(lat, lon) {
  let latText = lat.replace(/[°′″]/g, "");
  let latArray = latText.split(" ");

  let lonText = lon.replace(/[°′″]/g, "");
  let lonArray = lonText.split(" ");

  centerWgs[0] = Number(lonArray[0]) + Number(lonArray[1]) / 60 + Number(lonArray[2]) / 3600;
  centerWgs[1] = Number(latArray[0]) + Number(latArray[1]) / 60 + Number(latArray[2]) / 3600;
}

// Function to update the status style of an element based on GPS accuracy
function UpdateStatusStyle(id, accuracy) {
  let mypos = El(id);

  if (mypos) {
    if (accuracy < 5) {
      mypos.style.background = "green";
    } else if (accuracy < 10) {
      mypos.style.background = "yellow";
    } else {
      mypos.style.background = "red";
    }
  }
}

// Exported function to update the map (currently just logs a message)
function UpdateMap() {
  console.log('UpdateMap');
}

// Function to check and update the last GPS position
function setLastWgs(position) {
  secondLastWgs[0] = lastWgs[0];
  secondLastWgs[1] = lastWgs[1];
  
  lastWgs[0] = centerWgs[0];
  lastWgs[1] = centerWgs[1];
  
  centerWgs[0] = position.coords.longitude;
  centerWgs[1] = position.coords.latitude;
}
