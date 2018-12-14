export {Feature};

import Pointer from "ol/interaction/pointer";
import ol from "ol";

import Extent from 'ol/extent';

class Feature{

    constructor(map) {

        this.map = map;
        this.feature = window.feature = {};
        this.sel_feature;
        this.startTime;
        this.endTime;
        this.startPixel;
        this.endPixel;
        this.dragged;


        this.feature.Drag = function () {

            Pointer.call(this, {
                handleDownEvent: feature.Drag.prototype.handleDownEvent,
                handleDragEvent: feature.Drag.prototype.handleDragEvent,
                handleMoveEvent: feature.Drag.prototype.handleMoveEvent,
                handleUpEvent: feature.Drag.prototype.handleUpEvent
            });

            this.coordinate_ = null;

            this.cursor_ = 'pointer';

            this.feature_ = null;

            this.previousCursor_ = undefined;

        };

        ol.inherits(this.feature.Drag, Pointer);

        this.longpress = false;

        this.feature.Drag.prototype.handleDownEvent = function (evt) {

            let map = evt.map;

            this.startTime = new Date().getTime();
            this.startPixel = evt.pixel;
            this.dragged = false;

            let feature = map.forEachFeatureAtPixel(evt.pixel,
                function (feature, layer) {
                    return feature;
                });

            if (feature) {
                this.coordinate_ = evt.coordinate;
                this.feature_ = feature;
            }
            else
                $('#browser_container').css('display', 'none');

            return !!feature;
        };


        this.feature.Drag.prototype.handleDragEvent = function (evt) {

            if (!$("[drag]").prop('checked'))
                return;
            let map = evt.map;

            let feature = map.forEachFeatureAtPixel(evt.pixel,
                function (feature, layer) {
                    return feature;
                });

            this.sel_feature = feature;

            var deltaX = evt.coordinate[0] - this.coordinate_[0];
            var deltaY = evt.coordinate[1] - this.coordinate_[1];

            var geometry = /** @type {ol.geom.SimpleGeometry} */
                (this.feature_.getGeometry());
            geometry.translate(deltaX, deltaY);

            this.coordinate_[0] = evt.coordinate[0];
            this.coordinate_[1] = evt.coordinate[1];
        };


        /**
         * @param {ol.MapBrowserEvent} evt Event.
         */
        this.feature.Drag.prototype.handleMoveEvent = function (evt) {
            if (!$("[drag]").prop('checked'))
                return;

            if (this.cursor_) {

                var map = evt.map;
                var feature = map.forEachFeatureAtPixel(evt.pixel,
                    function (feature, layer) {
                        return feature;
                    });
                var element = evt.map.getTargetElement();

                if (feature) {
                    if (element.style.cursor != this.cursor_) {
                        this.previousCursor_ = element.style.cursor;
                        element.style.cursor = this.cursor_;
                    }
                } else if (this.previousCursor_ !== undefined) {
                    element.style.cursor = this.previousCursor_;
                    this.previousCursor_ = undefined;
                }
            }
        };


        /**
         * @param {ol.MapBrowserEvent} evt Map browser event.
         * @return {boolean} `false` to stop the drag sequence.
         */
        this.feature.Drag.prototype.handleUpEvent = function (evt) {

            evt.preventDefault();

            this.endTime = new Date().getTime();
            this.longpress = (this.endTime - this.startTime < 300) ? false : true;

            this.endPixel = evt.pixel;

            if (Math.abs((this.endPixel[0] - this.startPixel[0]) / this.endPixel[0]) > .02 &&
                Math.abs((this.endPixel[1] - this.startPixel[1]) / this.endPixel[1]) > .02)
                this.dragged = true;

            if (this.dragged) {
                if (!$("[drag]").prop('checked'))
                    return false;
                this.ChangeFeatureGeometry(this.feature_, this.coordinate_);
                //alert('CheckDeleteFeature');
                this.map.domEvents.CheckDeleteFeature(this.feature_, this.coordinate_);

                this.dragged = false;

            } else {
                if (this.feature_) {

                    this.OnClickFeature(this.feature_);

                }
            }
            this.coordinate_ = null;
            this.feature_ = null;

            return false;
        };
    }

    ChangeFeatureGeometry(feature, coords) {

        var hash = feature.values_.features["0"].a;
        var obj = JSON.parse(localStorage.getItem(hash));

        var layer = ol_map.getLayers().get(obj.category);
        var featureToUpdate = layer.getSource().getFeatureById(hash);

        obj.status = '1';

        var latlon = ol.proj.toLonLat(coords);
        obj.lat = latlon[1];
        obj.lon = latlon[0];
        localStorage.setItem(hash, JSON.stringify(obj));
        //
        // layer.cluster.removeFeature(featureToUpdate);
        //layer.getSource().removeFeature(feature);
        //layer.getSource().getSource().removeFeature(featureToUpdate);

        layer.getSource().refresh();

        feature.setProperties({
            geometry: new ol.geom.Point(coords),
            labelPoint: new ol.geom.Point(coords)
        }, true);
        featureToUpdate.setProperties({
            geometry: new ol.geom.Point(coords),
            labelPoint: new ol.geom.Point(coords)
        }, true);

        feature.changed();
        featureToUpdate.changed();

        //obj[0].obj.hash = latlon[1].toString()+"_"+latlon[0].toString();

        //var layer = Map.getLayers().get(obj.category);
        // var feature = $.grep(layer.getSource().getFeatures(), function (el,i) {
        //     return el.id = hash;
        // });

        //feature[0].id = obj[0].obj.hash;
    }

    OnClickFeature(feature) {

        try {

            var fAr = feature.values_.features;

            if (feature.values_.features.length > 1) {
                var coordinates = [];
                $.each(feature.values_.features, function (key, feature) {
                    coordinates.push(feature.getGeometry().flatCoordinates);
                });

                var extent = Extent.boundingExtent(coordinates);
                var buf_extent = Extent.buffer(extent, 5);
                //ol.extent.applyTransform(extent, transformFn, opt_extent)
                this.map.getView().fit(buf_extent, {
                    duration: window.sets.animate_duration
                });

                this.map.getView().animate(
                    {center: feature.getGeometry().flatCoordinates, duration: window.sets.animate_duration},
                    function () {

                    });

                // setTimeout(function () {
                //     if(Map.getView().getZoom()>19){
                //         Map.getView().animate(
                //             {zoom: Map.getView().getZoom()-.4,duration: animate_duration}
                //         );
                //     }
                // },animate_duration+100);

            } else {
                var near = [];
                for (var f in feature.values_.features) {

                    var id_str = fAr[f].getId();
                    db.GetObject(id_str, function (obj) {
                        if (obj.overlay) {

                        }
                        else {
                            if (obj.status == 1 || obj.status == 3 || (obj.category === '12' && !loc_mode)) { //status==3 SAMEORIGIN
                                if (near.length > 5)
                                    return;
                                near.push(obj);
                                if (buckList.indexOf(obj.hash) === -1) {

                                    db.SetObjectAttr(id_str, 'status', '2');
                                    //var event = new ol.events.Event('propertychange');
                                    feature.dispatchEvent('propertychange');
                                }
                                if (near.length > 0) {
                                    $('#browser_container').css('display', 'inline-block');
                                    $('#browser')[0].contentWindow.InsertElements(near);

                                } else {
                                    $('#browser_container').css('display', 'none');
                                }
                            }
                        }
                    });
                }
            }


        } catch (ex) {
            console.log('OnClickFeature ' + ex);
        }
    }
}

