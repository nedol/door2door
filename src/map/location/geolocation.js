export {Geo};
import Geolocation from 'ol/geolocation';
import proj from 'ol/proj';


import {Feature} from "../events/feature.events";


class Geo {

    constructor(map) {
        this.map = map;
        this.period;
        this.init();
    }

    init() {

        let that = this;

        var options = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        };
// //standart geolocation
        if ("geolocation" in navigator) {
            /* geolocation is available */
            navigator.geolocation.getCurrentPosition(function (position) {
                //console.log("position:"+JSON.stringify(position));
                var time = new Date().getTime();
                var coordinates = proj.fromLonLat([position.coords.longitude, position.coords.latitude]);
                //coords.gps_coord = coordinates;
                //SetCurPosition(coordinates);
                // localStorage.setItem("cur_loc","{\"lon\":"+coordinates[0]+","+
                //     "\"lat\":"+coordinates[1]+", \"time\":"+time+"}");
                if (coordinates)
                    window.postMessage(coordinates, '*');//http://nedol.ru');

            }, function (positionError) {
                console.log("Error: " + positionError);
            });
        } else {
            /* geolocation IS NOT available */
            console.log(positionError);
        }

        function geo_success(position) {
            var time = new Date().getTime();
            //do_something(position.coords.latitude, position.coords.longitude);
            var coordinates = proj.fromLonLat([position.coords.longitude, position.coords.latitude]);
            //coords.gps_coord = coordinates;
            // localStorage.setItem("cur_loc","{\"lon\":"+coordinates[0]+","+
            //     "\"lat\":"+coordinates[1]+", \"time\":"+time+"}");
            if (coordinates)
                window.postMessage(coordinates, '*');//http://nedol.ru');
        }

        function geo_error() {
            console.log("Sorry, no position available.");
        }

        //var watchID = navigator.geolocation.watchPosition(geo_success, geo_error, options);

        let geolocation = new Geolocation({
            projection: 'EPSG:3857',//'EPSG:4326',//3857
            tracking: true,
            trackingOptions: options
        });

        var request = function () {

             if(that.period===1000){
                clearInterval(loc_interval);
                that.period=5000;
                loc_interval = setInterval(request, that.period);
             }


            geolocation.on('error', function (error) {
                console.log(error.toString());
                //            var info = document.getElementById('info');
                //            info.innerHTML = error.message;
                //            info.style.display = '';
            });

            var accuracyFeature = new Feature(this.map);
            geolocation.on('change:accuracyGeometry', function (ev) {
                //TODO: accuracyFeature.feature.setGeometry(geolocation.getAccuracyGeometry());
            });


            // geolocation.on('change:position', function() {
            //     var coords = geolocation.getPosition();
            //
            //     var time = new Date().getTime();
            //     localStorage.setItem("cur_loc","{\"lon\":"+coords[0]+","+
            //         "\"lat\":"+coords[1]+", \"time\":"+time+"}");
            //     if(coords) {
            //         window.postMessage(coords, '*');//http://nedol.ru');
            //     }
            //
            //     return;
            // });

            geolocation.on('change:speed', function () {
                var speed = geolocation.getSpeed();

            });

            var coords = geolocation.getPosition();
            var time = new Date().getTime();

            if (coords) {
                that.ChangeGPSPosition(that,coords);

            }
        }

        var loc_interval = setInterval(request, 1000);

    }

    ChangeGPSPosition(that,coor) {

        $("#location_img").css("visibility", 'visible');
        var time = new Date().getTime();
        window.sets.coords.gps = coor;

        var latlon = proj.toLonLat(window.sets.coords.gps);

        // ReverseGeocoding(latlon, 15, function (res) {
        //     var adr = res;
        // });

        if (window.sets.loc_mode) {
            this.SetCurPosition(that,window.sets.coords.gps);
            localStorage.setItem("cur_loc", "{\"lon\":" + window.sets.coords.cur[0] + "," +
                "\"lat\":" + window.sets.coords.cur[1] + ", \"time\":" + time + "}");
        }
    }
    SetCurPosition(that,coordinate) {

        try {
            var size = that.map.ol_map.getSize();// @type {ol.Size}
            //alert(loc.toString());

            if(that.map.ol_map.getView().getCenter()[0]!==coordinate[0] ||
                that.map.ol_map.getView().getCenter()[1]!==coordinate[1])
                that.map.MoveToLocation(coordinate);

            var latlon = proj.toLonLat(coordinate);
            window.sets.coords.gps = coordinate;

            that.map.ol_map.dispatchEvent({'type': 'click', 'coordinate': coordinate, 'loc_mode': true});

            var pixel = that.map.ol_map.getPixelFromCoordinate(coordinate);

            var feature = that.map.ol_map.forEachFeatureAtPixel(pixel, function (feature, layer) {
                return feature;
            });
            if (feature)
                feature.OnClickFeature(feature);

        } catch (ex) {
            console.log(ex);
        }

        $('#locText').text(latlon[1].toFixed(6) + " " + latlon[0].toFixed(6));

    }

    StartLocation() {

        if ($("#loc_ctrl").attr('drag') === 'true') {
            $("#loc_ctrl").attr('drag', false);
            return;
        }
        try {
            window.sets.loc_mode = !window.sets.loc_mode;
            if (window.sets.loc_mode) {
                if (window.sets.coords.gps[0] !== 0 && window.sets.coords.gps[1] !== 0) {

                    $('#pin').css('display', 'block');

                    //$('#marker>img').attr("src", "./marker/images/kolobot_walking.gif");
                }
            } else {
                this.StopLocation();
            }

        } catch (ex) {
            alert(ex);
        }
    }

    StopLocation() {

        window.sets.loc_mode = false;

        $('#marker').trigger('stop_location');
        $('#pin').css('display', 'none');
        //$('#loc_img').removeAttr( "style" );
    }

    SearchLocation(ev) {

        let that = ev.data;
        if ($("#search_but").attr('drag') === 'true') {
            $("#search_but").attr('drag', false);
            return;
        }
        let text = "Input location name";
        let hint = "London, Trafalgar Square";
        if (window.window.sets.lang === 'ru') {
            text = "Введите название местоположения";
            hint = "Москва, Красная площадь";
        }
        let place = prompt(text, hint);
        let nominatim =
            "https://nominatim.openstreetmap.org";///reverse";
        let query =
            "https://nominatim.openstreetmap.org/reverse?format=json&lat=52.5487429714954&lon=-1.81602098644987&zoom=18&addressdetails=1";
        let mapques =
            "https://open.mapquestapi.com/geocoding/v1/reverse?key=KEY&location=30.333472,-81.470448&includeRoadMetadata=true&includeNearestIntersection=true";
        let locationiq =
            "https://locationiq.org/v1/search.php";

        $.ajax({
            url: locationiq,// nominatim,
            data: {
                key: 'f6b910f0af894f1746b1',//locationiq
                format: "json",
                q: place,
                "accept-language": "en"
            },
            method: "GET",
            dataType: "json",
            success: function (data) {
                let resp = JSON.stringify(data, null, 4);
                if (!data[0].boundingbox)
                    return;
                let bound = data[0].boundingbox;
                let lat = data[0].lat;
                let lon = data[0].lon;

                that.map.SetBounds({sw_lat: bound[0], sw_lng: bound[2], ne_lat: bound[1], ne_lng: bound[3]});

                //$("#marker").trigger("change:cur_pos", [proj.fromLonLat([parseFloat(lon), parseFloat(lat)]), "Event"]);
                //Marker.overlay.setPosition(proj.fromLonLat([parseFloat(lon), parseFloat(lat)]), '*');//http://nedol.ru');

                // for (let i = 0; i < localStorage.length; i++) {
                //     let key = localStorage.key(i);
                //     if(key==='ObjectsAr')
                //        localStorage.removeItem(key);
                //     console.log(key + ' = ' + localStorage[key]);
                // }

            },
            error: function (data) {
                console.log(data);
            }
        });
    }

    SearchPlace(latlon, zoom, cb) {

        let reverse =
            "https://nominatim.openstreetmap.org/reverse?format=json&lat="+latlon[0]+"&lon="+latlon[1]+"&zoom="+zoom+"&addressdetails=2";
        let mapques =
            "https://open.mapquestapi.com/geocoding/v1/reverse?key=KEY&location=30.333472,-81.470448&includeRoadMetadata=true&includeNearestIntersection=true";
        let locationiq =
            "https://locationiq.org/v1/search.php";
        let here =
            "https://geocoder.cit.api.here.com/6.2/geocode.json?searchtext=200%20S%20Mathilda%20Sunnyvale%20CA&app_ id=DemoAppId01082013GAL&app_code=AJKnXv84fjrb0KIHawS0Tg&gen=8";

        $.ajax({
            url: reverse,
            method: "GET",
            dataType: "json",
            success: function (data) {
                let resp = JSON.stringify(data, null, 4);
                let obj = {city:data.address.city,street: data.address.road,house:data.address.house_number};
                cb(obj);
            },
            error: function (data) {
                console.log(data);
                cb();
            }
        });
    }
}



