import { Vector as VectorSource } from 'ol/source.js';

export { AddToVectorSource, GetVectorSource, ClearVectorSource, GetPastVectorSource }

const vectorSource = new VectorSource();

const vectorSourcePastFeatures = new VectorSource();


function AddToVectorSource(features) {
    console.log(`Add Features to vectorSource: ${features}`);
    vectorSource.addFeatures(features);
}

function GetVectorSource() {
    return vectorSource;
}

function GetPastVectorSource() {
    let vs = new VectorSource();
    vs.addFeatures(vectorSourcePastFeatures.getFeatures());
    vectorSourcePastFeatures.clear();
    return vs;
}

function ClearVectorSource() {
    vectorSourcePastFeatures.addFeatures(vectorSource.getFeatures());
    vectorSource.clear();
}


