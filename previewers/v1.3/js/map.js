$(document).ready(function() {
    startPreview(true);
});
    
function translateBaseHtmlPage() {
    var mapPreviewText = $.i18n( "mapPreviewText" );
    $( '.mapPreviewText' ).text( mapPreviewText );
}

function writeContentAndData(data, fileUrl, file, title, authors) {
    addStandardPreviewHeader(file, title, authors);

    // convert string data to json
    var geoJsonData = JSON.parse(data);

    // initialize the map
    var map = L.map('map').fitWorld();

    // load a tile layer
    //L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    //    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    //}).addTo(map);


	L.tileLayer('https://stamen-tiles.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
    maxZoom: 20,
	}).addTo(map);

	//Attribute table parser
	function collate(lay){
	const jdict = lay.feature.properties 
	var out = '';
	out += '<table><th>Attribute Name</th><th>Value</th>'
	console.log(out);
	for (const property in jdict){
		out += '<tr><td>'
		out += `${property} </td><td> ${jdict[property]}`
		out += '</td></tr>'
		};
		//console.log(out);					  
	return out}

	//Custom CSS class plus making sure everything fits
	customOptions  = { 'className' : 'mapOptions',
				       'maxWidth' :800,
				       'minWidth' :250}

    // add data to map and zoom to added features
	var geoJson = L.geoJSON(data)
	geoJson.bindPopup(collate, customOptions)
	geoJson.addTo(map)
	map.fitBounds(geoJson.getBounds());

}
