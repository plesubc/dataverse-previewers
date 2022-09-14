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

	function whatkind(testme){
		//Determines the type of geojson
		return testme['features'][0]['geometry']['type']}

    function collate(lay){
		//Creates a tabular attribute table and
		//strips out null values to make it shorter
		//although I'm not sure that's the most desirable
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

    function is_oim(lay){
   	 	//Check if geojson is an Open Index Map
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

    function style_oim(lay){
    	//And open index map styling
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

    function style_oim_feat(feature){
    	//And open index map styling *per feature*
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
		//Also, not everyone read the spec, so some of required
		//'available' values are a string reading 'true' (ie, 'TRUE')
		if ((jdict.hasOwnProperty("available") 
		     && jdict.available !==null) &&
		     jdict.available == true || 
			(typeof(jdict.available)=='string' && jdict.available.toLowerCase() == 'true'))
		//	jdict.available == true
		//if (jdict.hasOwnProperty("available"))
				{
						console.log(jdict.available);
				visflag = true;
	            return {fillColor: 'orange',
	   	        	    fillOpacity: 0.4,
	   	        	    color: 'orange',
	   	        	    opacity: 1.0,
						radius: 5.0}}
	    else {  console.log('I should have gotten here'); return {fillColor: 'CornFlowerBlue',
	    		        fillOpacity: 0.4,
	    		        color: 'CornflowerBlue',
	    		        opacity: 1.0,
						radius: 5.0}
		}
		}

	//Add the GeoJSON to the page
	//yes, it's probably bad form to define the variable and use it in the
	//function below. And probably worse to make it conditional.
	if (whatkind(gdata) != 'Point')
		{
		var geoJson = L.geoJSON(gdata, {style:style_oim_feat});
		}
	else
		{
		geoJson = L.geoJSON(gdata, 
			              {pointToLayer: function (feature, latlng) 
							  { return L.circleMarker(latlng, 
								                      style_oim_feat(feature));} 
						  });
		}

	geoJson.addTo(map);
    map.fitBounds(geoJson.getBounds());
	
    function onMapClick(e) {
		//Creates a popup attributes from *all* layers
		//interpret coordiates as [lat, long]. See leaflet-pip docs
    	leafletPip.bassackwards = true;
    	var lng = e.latlng.lng;
       	var lat = e.latlng.lat;
		if (['MultiPolygon', 'Polygon'].includes(whatkind(gdata)))
				{
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
		
		else{
			 geoJson.eachLayer(function(layer){layer.bindPopup(collate(layer), customSizer()   )});
            }	
		}


		
    //Produces a popup concatenating multiple detected overlapping items 
    //The popup itself is instantiated inside onMapClick
    map.on('click', onMapClick);

    //Open Index map hidden text reveal. Otherwise the GeoJSON is treated
    //as a normal GeoJSON and the <id="oim"> material is not displayed
	//on the preview page
    if (visflag == true){
    	document.getElementById("oim").style.visibility = "visible";
		document.getElementById("oim").style.display = "block";

        var legend = L.control({position: 'bottomleft'});
		legend.onAdd = function (map) {
        
            var div = L.DomUtil.create('div', 'legend');
            var cats = [ '<strong>Legend</strong>',
					     '<span class="dot" id="hilite"></span><span id="entry">Available</span>', 
                         '<span class="dot" id="unavailable"></span><span id="entry">Not available</span>',
			             '<span><i>Note:</i> Areas may show a mixture of colours if multiple years/holdings are available or index areas overlap.</span>'];
        	div.innerHTML = cats.join('<br />');
        	return div;
            };
        legend.addTo(map);}
	
}
