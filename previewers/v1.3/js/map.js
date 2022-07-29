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
	base.addTo(map)


	//Open index map text visibility flag
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
    			out += '<tr><td class="attr">';
    			out += `${property} </td><td class="value"> ${jdict[property]}`;
    			out += '</td></tr>';}
    	};
    	//console.log(out);
    return out}


    function collateNoHead(lay){
	//As collate above, but without table info so that 
	//multilayer geojsons data can be collated without
	//separate table headings
    var out = ''
    const jdict = lay.feature.properties
    for (const property in jdict){
    	if (jdict[property]!== null){
    			out += '<tr><td class="attr">';
    			out += `${property} </td><td class="value"> ${jdict[property]}`;
    			out += '</td></tr>';}
    	};
    return out}


    //Sets popup to a reasonable size to accommodate the
    //attribute table. What constitutes this is debatable.
    customOptions  = { 'className' : 'mapOptions',
    				   'maxWidth' :800,
    				   'minWidth' :300,
					   'maxHeight' :600 }

    //Check if geojson is an Open Index Map
    function is_oim(lay){
    	//Open index map has no real standard for required fields. 
		//However, these 3 attributes are required for Geoblacklight, so. . .
		//This is not really ideal, but what can you do
    	const oim_def=['available','physHold', 'digHold']
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

    //And open index map styling per feature
    function style_oim_feat(feature){
    	//const oim_def=['available','physHold', 'digHold']
    	jdict = feature.properties;
		console.log(jdict);
		//let count = 0;
    	//oim_def.forEach(function(prop){
    	//	if (jdict.hasOwnProperty(prop) && jdict[prop]!== null){
    	//	count +=1;}
        // })
    	//Styles any open index map feature a different colour if any
		//of the above attributes aren't null
		if (jdict.available.toLowerCase() == 'true'){
				console.log('true')
				visflag = true;
	            return {fillColor: 'orange',
	   	        	    fillOpacity: 0.4,
	   	        	    color: 'orange',
	   	        	    opacity: 1.0}}
	    else {  console.log('false')
				return {fillColor: 'blue',
	    		        fillOpacity: 0.4,
	    		        color: 'MediumPurple',
	    		        opacity: 1.0}
		}
		}

	//Add the GeoJSON to the page
	//yes, it's probably bad form to define the variable and use it in the
	//function below.
    //var geoJson = L.geoJSON(gdata, {style:style_oim});
    var geoJson = L.geoJSON(gdata, {style:style_oim_feat});

	geoJson.addTo(map)
    map.fitBounds(geoJson.getBounds());
	


//var opacitySlider = new L.Control.opacitySlider();
    //map.addControl(opacitySlider);
    //opacitySlider.setOpacityLayer(geoJson)
	//opacitySlider.addTo(map)

    //Get coordinates
    function onMapClick(e) {
        //console.log("You clicked the map at " + e.latlng);
		//Creates a popup attributes from *all* layers
    	leafletPip.bassackwards = true;
    	var lng = e.latlng.lng;
       	var lat = e.latlng.lat;
    	featureList = leafletPip.pointInLayer(e.latlng, geoJson, false)
    	var concat = ['<table><th>Attribute Name</th><th>Value</th>']	
    	for (var i=0; i < featureList.length; i++ ){
    		concat.push(collateNoHead(featureList[i]));
			//Add a separator between detected layers for ease of reading
			if (i!= featureList.length -1){
;					concat.push('<tr><td colspan=2 style="background-color:white"><hr /></td></tr>');
			}
         }

    	concat.push('</table>')
		//This section enables a popup on the areas with geometry, otherwise
		//the popup is smpty
		if (concat.join('') != '<table><th>Attribute Name</th><th>Value</th></table>'){
	    	geoJson.bindPopup(concat.join(''), customOptions);
    		geoJson.openPopup(e.latlng);
		}
    	geoJson.unbindPopup()
    	return concat.join('');
		//returns this in case you need it somewhere else
    }

    //Produces a popup concatenating multiple detected overlapping items 
    //The popup itself is instantiated inside onMapClick
    map.on('click', onMapClick);


    //Open Index map hidden text reveal. Otherwise the GeoJSON is treated
    //as a normal GeoJSON and the <id="oim"> material is not displayed
    console.log(visflag);
    if (visflag == true){
    	document.getElementById("oim").style.visibility = "visible";}

    if (visflag == true){
    	document.getElementById("oim").style.display = "block";}
}
