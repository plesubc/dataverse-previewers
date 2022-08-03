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
    var gdata = JSON.parse(data);

    // initialize the map
    var map = L.map('map').fitWorld();

    // load a tile layer
	const base = L.tileLayer('https://stamen-tiles.a.ssl.fastly.net/toner-lite/{z}/{x}/{y}.png', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, under <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a>. Data by <a href="http://openstreetmap.org">OpenStreetMap</a>, under <a href="http://www.openstreetmap.org/copyright">ODbL</a>.',
    maxZoom: 20,
    })
	base.addTo(map);

	//Open index map text visibility flag
	var visflag = false;

    //Creates a tabular attribute table and
    //strips out null values to make it shorter
    //although I'm not sure that's the most desirable
    function collate(lay){
    const jdict = lay.feature.properties;
    var out = '';
    out += '<table><th>Attribute Name</th><th>Value</th>'
    for (const property in jdict){
    	if (jdict[property]!== null){
    			out += '<tr><td class="attr">';
    			out += `${property} </td><td class="value"> ${jdict[property]}`;
    			out += '</td></tr>';}
    	};
    return out}


    function collateNoHead(lay){
	//As collate above, but without table info so that 
	//multilayer geojsons data can be collated without
	//separate table headings
    var out = '';
    const jdict = lay.feature.properties;
    for (const property in jdict){
    	if (jdict[property]!== null){
    			out += '<tr><td class="attr">';
    			out += `${property} </td><td class="value"> ${jdict[property]}`;
    			out += '</td></tr>';}
    	};
    return out}

	function customSizer(){
    //Sets popup to a reasonable size to accommodate the
    //attribute table. What constitutes this is debatable.
    customOptions  = { 'className' : 'mapOptions',
					   'maxWidth' : Math.floor(map.getSize()['x']/2),
    				   'minWidth' :400,
					   'maxHeight':map.getSize()['y']-150,
					   'keepInView': true,
					   'autoPan' : true};
    return customOptions}

    //Check if geojson is an Open Index Map
    function is_oim(lay){
    	//Open index map has no real standard for required fields. 
		//However, these 3 attributes are required for Geoblacklight, so. . .
		//This is not really ideal, but what can you do
    	const oim_def=['available','physHold', 'digHold'];
    	var count=0;
    	jdict = lay.properties;
    	oim_def.forEach(function(prop){
    		if (jdict.hasOwnProperty(prop) && jdict[prop]!== null){
    		count +=1;}
         })
		 //if it finds at least one of these then it is flagged
		 //as an Open Index Map
    	 if (count !=0 ){return true}
    	 else {return false}
       }

    //And open index map styling
    function style_oim(lay){
    	//Styles any open index map layer a different colour if "available" == true
    	 //return {fillColor: '#4E9C68'},//green is for "GO"
    	if (is_oim(lay)==true)
           { visflag = true;
             return {fillColor: 'orange',
     		        fillOpacity: 0.4,
    		  		color: 'orange',
    		  		opacity: 1.0}
           }
		}

    //And open index map styling *per feature*
    function style_oim_feat(feature){
		//previously I used all 3 properties below to determine
	    //if these were open index maps.
    	//const oim_def=['available','physHold', 'digHold']
		//let count = 0;
    	//oim_def.forEach(function(prop){
    	//	if (jdict.hasOwnProperty(prop) && jdict[prop]!== null){
    	//	count +=1;}
        // })
    	jdict = feature.properties;
    	//Styles any open index map feature a different colour if any
		//of the above attributes aren't null
		if (jdict.hasOwnProperty("available") &&
			jdict.available.toLowerCase() == 'true'){
				visflag = true;
	            return {fillColor: 'orange',
	   	        	    fillOpacity: 0.4,
	   	        	    color: 'orange',
	   	        	    opacity: 1.0}}
	    else {  return {fillColor: 'CornflowerBlue',
	    		        fillOpacity: 0.4,
	    		        color: 'CornflowerBlue',
	    		        opacity: 1.0}
		}
		}

	//Add the GeoJSON to the page
	//yes, it's probably bad form to define the variable and use it in the
	//function below.
    //var geoJson = L.geoJSON(gdata, {style:style_oim});
    var geoJson = L.geoJSON(gdata, {style:style_oim_feat});

	geoJson.addTo(map);
    map.fitBounds(geoJson.getBounds());
	
    function onMapClick(e) {
		//Creates a popup attributes from *all* layers
		//interpret coordiates as [lat, long]. See leaflet-pip docs
    	leafletPip.bassackwards = true;
    	var lng = e.latlng.lng;
       	var lat = e.latlng.lat;
    	featureList = leafletPip.pointInLayer(e.latlng, geoJson, false);
    	var concat = ['<table><th>Attribute Name</th><th>Value</th>'];
    	for (var i=0; i < featureList.length; i++ ){
    		concat.push(collateNoHead(featureList[i]));
			//Add a separator between detected layers for ease of reading
			if (i!= featureList.length -1){
;					concat.push('<tr><td colspan=2 style="background-color:white"><hr /></td></tr>');
			}
         }

    	concat.push('</table>');
		//This section enables a popup on the areas with geometry, otherwise
		//the popup is empty
		if (concat.join('') != '<table><th>Attribute Name</th><th>Value</th></table>'){
	    	geoJson.bindPopup(concat.join(''), customSizer());
    		geoJson.openPopup(e.latlng);
		}
    	geoJson.unbindPopup() //removes popup on clicking on non-attribute space
    	return concat.join('');
		//returns this in case you need it somewhere else
    }

    //Produces a popup concatenating multiple detected overlapping items 
    //The popup itself is instantiated inside onMapClick
    map.on('click', onMapClick);

    //Open Index map hidden text reveal. Otherwise the GeoJSON is treated
    //as a normal GeoJSON and the <id="oim"> material is not displayed
	//on the preview page
    if (visflag == true){
    	document.getElementById("oim").style.visibility = "visible";}

    if (visflag == true){
    	document.getElementById("oim").style.display = "block";}
}
