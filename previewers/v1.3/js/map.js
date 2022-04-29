$(document).ready(function() {
    startPreview(true);
});
    
function translateBaseHtmlPage() {
    var mapPreviewText = $.i18n( "mapPreviewText" );
    $( '.mapPreviewText' ).text( mapPreviewText );
}

function writeContentAndData(data, fileUrl, file, title, authors) {
    addStandardPreviewHeader(file, title, authors);

	// initialize the map
    var map = L.map('map').fitWorld();

    // load a tile layer
	L.tileLayer('https://stamen-tiles.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
    maxZoom: 20,
	}).addTo(map);


    // convert string data to json
    var gdata = JSON.parse(data);

	//Open index map visibility flag
    var visflag = false;

	//Creates a tabular attribute table and
	//strips out null values to make it shorter
	//although I'm not sure that's the most desirable

	function collate(lay){
	const jdict = lay.feature.properties
	var out = '';
	out += '<table><th>Attribute Name</th><th>Value</th>'
	for (const property in jdict){
		if (jdict[property]!== null){
				out += '<tr><td>';
				out += `${property} </td><td> ${jdict[property]}`;
				out += '</td></tr>';}
		};
		return out}

	//Sets popup to a reasonable size to accommodate //attribute table
	customOptions  = { 'className' : 'mapOptions',
					   'maxWidth' :800,
					   'minWidth' :250}

	//Check if geojson is an Open Index Map
	function is_oim(lay){
		//Open index map has no real standard. However, these 3 
	    //attributes are required for Geoblacklight, so. . .
		const oim_def=['available','physHold', 'digHold']
		var count=0;
		jdict = lay.properties;
		oim_def.forEach(function(prop){
			if (jdict.hasOwnProperty(prop) && jdict[prop]!== null){
			count +=1;}
	     })
		if (count == 3){return true}
		else {return false}
	   }
	
	//And open index map styling
	function style_oim(lay){
		//Styles any open index map layer a different colour if "available" == true
		 //return {fillColor: '#4E9C68'},//green is for "GO"
		if (is_oim(lay)==true)
	       {visflag = true;
	        return {fillColor: 'orange',
	 		        fillOpacity: 0.4,
					color: 'orange',
					opacity: 1.0}
	       }
	    }
	

	//Add data to it to the map and zoom to the features
	geoJson = L.geoJSON(gdata, {style:style_oim})
	geoJson.bindPopup(collate, customOptions)
	geoJson.addTo(map)
	map.fitBounds(geoJson.getBounds());

	//Open Index map text reveal
	console.log(visflag);
	if (visflag == true){
		document.getElementById("oim").style.visibility = "visible";}
	console.log(geoJson);
	console.log(gdata);
}
