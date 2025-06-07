// Import necessary modules from OpenLayers
import { Map, View } from 'ol';
import Geolocation from 'ol/Geolocation';
import { Tile as TileLayer } from 'ol/layer';
import OSM from 'ol/source/OSM';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Style from 'ol/style/Style';
import Icon from 'ol/style/Icon';
import Text from 'ol/style/Text';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import { Draw, Modify, Select } from 'ol/interaction';
import { getCenter } from 'ol/extent';

// Import custom functions
import { SetView, SetCenterWgsPoint, UpdateStatusStyle, UpdateMap, GPStracking } from './umrechner';

// Initial coordinates
let wgsPoint = [7.160644, 50.767216];
let wgsPoint2 = [13.560644, 52.567216];

// Create vector source and layer
const vectorSource = new VectorSource();
const vectorLayer = new VectorLayer({
    source: vectorSource,
});

// Create the map with initial center
const map = new Map({
    target: 'map',
    layers: [
        new TileLayer({
            source: new OSM(),
        }),
        vectorLayer, // Add vector layer for features
    ],
    view: new View({
        center: [7.055, 50.756], // Sankt Augustin Coordinates in EPSG:4326
        zoom: 15,
    }),
});

// Initialize tracking points
const points = [];
const maxPoints = 20; // Maximum number of points allowed

// Function to add features to the map
//fehler war: number: points.length + 1, // Add unique number
function addFeature(login, coordinates, timestamp) {
    const feature = new Feature({
        geometry: new Point(coordinates),
        number: points.length , // Add unique number
        login: login,
        timestamp: timestamp
    });

    // Style to show login and timestamp
    const featureStyle = new Style({
        text: new Text({
// falsh:text: Login: ${login}\nTime: ${timestamp},
text: `Login: ${login}\nTime: ${timestamp}`,
font: '12px Arial',
            fill: new Fill({ color: 'black' }),
            stroke: new Stroke({
                color: 'white',
                width: 3,
            }),
            offsetX: 60,
            offsetY: -20,
        }),
        image: new Icon({
            anchor: [0.5, 1],
            src: 'ressources/Checkpoint.png',
            scale: 0.03,
        }),
    });

    feature.setStyle(featureStyle);
    vectorSource.addFeature(feature);
}

// Set up the view
const view = map.getView();
SetView(view);

// Geolocation setup
const geolocation = new Geolocation({
    trackingOptions: {
        enableHighAccuracy: true,
    },
    tracking: true, // Start tracking immediately
});

// Initialize GPS tracking
GPStracking("MyPosition", geolocation);

geolocation.on('change', function() {
    const coordinates = geolocation.getPosition();
    const accuracy = geolocation.getAccuracy();

    // Center the map and zoom
    view.setCenter(coordinates);
    view.setZoom(15);

    UpdateMap(); // Update - new center
    UpdateStatusStyle("MyPosition", accuracy);

    // Update latitude and longitude input fields
    document.getElementById('Lat').value = coordinates[1].toFixed(4);
    document.getElementById('Lon').value = coordinates[0].toFixed(4);

    console.log("GPStracking: GPS-Pos: " + coordinates + " Accuracy: " + accuracy);
});

// Update the map when the view changes
map.on('moveend', function() {
    const center = view.getCenter();
    SetCenterWgsPoint(center);
    UpdateMap(); // Update the map coordinates
});

geolocation.on('error', function(error) {
    console.error('Geolocation error: ', error.message);
    alert('Unable to access geolocation. Please check your permissions.');
});

// Map interactions for dragging features
const select = new Select({
    // Style for selected features
    style: new Style({
        stroke: new Stroke({
            color: 'blue',
            width: 2,
        }),
        fill: new Fill({
            color: 'rgba(0,0,255,0.1)',
        }),
    }),
});
const modify = new Modify({ features: select.getFeatures() });

map.addInteraction(select);
map.addInteraction(modify);

// Update feature location on drag
modify.on('modifyend', function(event) {
    const features = event.features.getArray();
    features.forEach(feature => {
        const coords = feature.getGeometry().getCoordinates();
        points.forEach(point => {
            if (point.number === feature.get('number')) {
                point.coordinates = coords;
            }
        });
    });
});

// Initialize interactions for drawing points
const draw = new Draw({ source: vectorSource, type: 'Point' });
map.addInteraction(draw);

// Unique checkpoint ID tracker
let checkpointId = 1;
let selectedCoordinates = null;

// Function to handle map clicks and set selectedCoordinates
function handleMapClick(event) {
    selectedCoordinates = event.coordinate; // Get the coordinates from the map click event
    console.log('Selected coordinates:', selectedCoordinates);
}

// Attach the click handler to the map
map.on('click', handleMapClick);

// Function to add a checkpoint
function addCheckpoint() {
    if (points.length >= maxPoints) {
        alert('Maximale Anzahl von Punkten erreicht.');
        return;
    }

    if (!selectedCoordinates) {
        alert('Bitte klicken Sie auf die Karte, um einen Standort für den Checkpoint auszuwählen.');
        return;
    }

    const login = document.getElementById('login').value.trim();
    if (!login) {
        alert('Anmeldename ist erforderlich.');
        return;
    }

    const pointNumber = checkpointId++;
    const timestamp = new Date().toLocaleString();

    points.push({ number: pointNumber, coordinates: selectedCoordinates, login, timestamp });

    addFeature(login, selectedCoordinates, timestamp);

    console.log(points);

    // Center the view on the last added checkpoint
    view.setCenter(selectedCoordinates);

    // Clear selected coordinates after adding the checkpoint
    selectedCoordinates = null;
}

// Function to delete a checkpoint
function deleteCheckpoint(id) {
    // check id on number 
    const idNumber = parseInt(id, 10);
 // find point mit diese ID
    const featureToDelete = vectorSource.getFeatures().find(feature => feature.get('number') === parseInt(id));
    
    if (featureToDelete) {
        vectorSource.removeFeature(featureToDelete);
    } else {
        console.log(`Checkpoint mit der ID ${id} nicht gefunden.`);
    }
}

// Function to export checkpoints to KML
function exportCheckpoints() {
    // KML file header
   // FALSH : - i string format muss const kmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
    //<kml xmlns="http://www.opengis.net/kml/2.2">
    //  <Document>
    //    <name>Checkpoints</name>`;
    const kmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
    <kml xmlns="http://www.opengis.net/kml/2.2">
      <Document>
        <name>Checkpoints</name>`;
    
    // KML file footer
    const kmlFooter = `</Document>
    </kml>`;

    // KML features for each checkpoint
    const kmlFeatures = points.map(point => {
        const [lon, lat] = point.coordinates;
        return `
      <Placemark>
        <name>Checkpoint ${point.number}</name>
        <Point>
          <coordinates>${lon},${lat},0</coordinates>
        </Point>
      </Placemark>`;
    }).join('\n');

    // Combine header, features, and footer into a complete KML document
    const kmlContent = kmlHeader + kmlFeatures + kmlFooter;

    // Create a Blob from the KML content
    const blob = new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml' });

    // Create a URL for the Blob and trigger a download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'checkpoints.kml';
    a.click();

    // Clean up the URL object
    URL.revokeObjectURL(url);
}

// Function to update checkpoints display
function updateCheckpointsDisplay(login) {
    const checkpointsDiv = document.getElementById('checkpoints');
    const now = new Date();
    const dateTime = now.toLocaleString(); // Format as needed, e.g., '8/22/2024, 12:34:56 PM'
    checkpointsDiv.innerHTML = `
        Checkpoints:<br>
        Login: ${login}<br>
        Datum und Zeit: ${dateTime}
    `;
}
function resetStatus() {
    vectorSource.clear();
    checkpointId = 1;
    points.length = 0;  
    updateCheckpointsDisplay(''); 
     console.log("reset.");
}

// Add event listeners for buttons
document.getElementById('NewBtn').addEventListener('click', addCheckpoint);
document.getElementById('DeleteBtn').addEventListener('click', () => {
    const id = prompt('Geben Sie die ID des zu löschenden Checkpoints ein');
    console.log(vectorSource.getFeatures());
    deleteCheckpoint(id);
});
document.getElementById('ExportBtn').addEventListener('click', exportCheckpoints);

// Handle form submission to update checkpoints
document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const login = document.getElementById('login').value;
    updateCheckpointsDisplay(login);
});

// Ensure the map container exists
const mapContainer = document.getElementById('map');
function updateCenterCross() {
    const center = map.getView().getCenter();
    const pixel = map.getPixelFromCoordinate(center);
    console.log('Center coordinates:', center);
    console.log('Pixel coordinates:', pixel);
    const centerCross = document.getElementById('center-cross');

    if (centerCross && pixel) {
        centerCross.style.left = `${pixel[0]}px`;
        centerCross.style.top = `${pixel[1]}px`;
    }
}

// Initial call
updateCenterCross();

// Update the cross position on map move and geolocation change
map.on('moveend', updateCenterCross);
geolocation.on('change', updateCenterCross);
 

// Call the update function initially
updateCenterCross();


