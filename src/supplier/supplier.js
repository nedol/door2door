'use strict'
export {Supplier};

let utils = require('../utils/utils');
var isJSON = require('is-json');

import {OfferEditor} from '../offer/offer.editor';
import {Dict} from '../dict/dict.js';
import {Network} from "../../network";

//import {RTCOperator} from "../rtc/rtc_operator"

import {Map} from '../map/map'
import {DB} from "../map/storage/db"

import proj from 'ol/proj';
import Point from 'ol/geom/point';
import Feature from 'ol/feature';

import {Overlay} from "../map/overlay/overlay";


let md5 = require('md5');

var urlencode = require('urlencode');

var ColorHash = require('color-hash');

require('bootstrap');
require('bootstrap-select');
var moment = require('moment/moment');

require('bootstrap/js/modal.js');


class Supplier{

    constructor(uObj) {

        this.date = $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD');

        this.my_truck_ovl;

        this.editor = new OfferEditor();
        this.viewer;

        this.store = uObj;
        //this.offer = uObj[this.date].data;

        this.uid = uObj.uid;
        this.email = uObj.email;

        window.db = new DB(this.constructor.name, function () {});

        this.map = new Map();

        this.isShare_loc = false;

    }

    IsAuth_test(cb){

        this.map.Init();

        this.network = new Network(host_port);
        this.network.InitSSE(this,function () {

        });

        $.getJSON('../dict/sys.dict.json', function (data) {
            let dict = JSON.parse(localStorage.getItem('dict'));
            dict = Object.assign((dict?dict:{}), data);
            if(dict) {
                window.dict = new Dict(dict);

            }else{
                localStorage.setItem("dict",'{}');
                window.dict = new Dict({});
            }
            window.dict.set_lang(window.sets.lang, $('body'));
            window.dict.set_lang(window.sets.lang, $('#categories'));
            localStorage.setItem("lang", window.sets.lang);

            cb();
        });

        //class_obj.menu.menuObj = JSON.parse(data.menu);
        //this.rtc_operator = new RTCOperator(this.uid, this.email,"browser", this.network);

        $('#main_menu').on('click touch', this, this.OpenOfferEditor);

        this.DateTimePickerEvents();
    }

    IsAuth(cb) {

        try {

            this.network = new Network(host_port);
            this.network.InitSSE(this,function () {

            });
            $('.dt_val').val(this.date);

            let that =this;

            var data_obj ={
                proj:"d2d",
                func:"auth",
                lang: window.sets.lang,
                uid: this.uid,
                email:this.email,
                date:this.date
            }

            this.network.postRequest(data_obj, function (data) {
                if(typeof data =='string')
                    data = JSON.parse(data);
                if(data) {
                    if (data.reg =='OK') {
                        var uObj = {
                            "email": that.email,
                            "uid": that.uid
                        };
                        localStorage.setItem("admin", JSON.stringify(uObj));

                        window.dict = new Dict(JSON.parse(JSON.parse(data.data).dict));
                        window.dict.set_lang(window.sets.lang, $('#main_window'));

                        localStorage.setItem("lang", window.sets.lang);

                        cb(data);

                    }else if (data.auth){//TODO: =='OK') {
                        localStorage.setItem("dict", JSON.stringify(data.data));
                        if(data.data) {
                            let dict = data.data;//JSON.parse(localStorage.getItem('dict'));//
                            window.dict = new Dict(JSON.parse(data.data).dict);
                            window.dict.set_lang(window.sets.lang, $('#main_window'));

                            localStorage.setItem("lang", window.sets.lang);

                            //class_obj.menu.menuObj = JSON.parse(data.menu);
                        }

                        //that.rtc_operator = new RTCOperator(that.uid, that.email,"browser",that.network);

                        cb();
                        that.DocReady();

                    }else if(data.data){
                        let str = data.data;
                        let dict = JSON.parse(str).dict;
                        window.dict = new Dict(dict);
                        window.dict.set_lang(window.sets.lang, $('#main_window'));
                        that.editor.menuObj = JSON.parse(data.data);
                        that.DocReady();
                    }else{
                        let err = data.err;
                    }
                }
            });
            
        }catch(ex){
            console.log(ex);
        }
    }

    DateTimePickerEvents(){
        let that = this;

        let time = $('.period_list').find('a')[0].text;
        $('.sel_time').text(time);

        $('.sel_time').on("change",this,function (ev) {
            let from = ev.target[ev.target.selectedIndex].value.split(' ')[0];
            let to = ev.target[ev.target.selectedIndex].value.split(' ')[1];
            $('#dt_from').val(from);
            $('#dt_to').val(to);

        });


        $('#date').on("click touchstart",this,function (ev) {
            $('#datetimepicker').data("DateTimePicker").toggle();
        });

        $('.period').find('.from').on("click touchstart",this,function (ev) {
            if($(ev.delegateTarget.parentEl).attr('id')==='period_1')
                $('#dt_from').data("DateTimePicker").toggle();
        });

        $('.period').find('.to').on("click touchstart", this,function (ev) {
            if($(ev.delegateTarget.parentEl).attr('id')==='period_1')
                $('#dt_to').data("DateTimePicker").toggle();
        });

        $('#datetimepicker').on("dp.change",this, function (ev) {

            that.date = $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD');

            $('.dt_val').val(that.date);

            $('.sel_time').find('option').css('visibility','visible');

            $(this).data("DateTimePicker").toggle();

            let layers = that.map.ol_map.getLayers();
            layers.forEach(function (layer, i, layers) {
                if(layer.constructor.name==="_ol_layer_Vector_") {
                    var features = layer.getSource().getFeatures();
                    features.forEach((feature) => {
                        layer.getSource().removeFeature(feature);
                    });
                }
            });

            $('#my_truck').css('visibility','visible');

            if(that.my_truck_ovl) {
                that.my_truck_ovl.RemoveOverlay();
                that.my_truck_ovl = '';
            }

            if(!that.store[that.date]) {
                let last = Object.keys(that.store)[Object.keys(that.store).length-1];
                that.store[that.date]= {data :that.store[last].data?that.store[last].data:{},location:that.editor.location};
                localStorage.setItem('supplier', JSON.stringify(that.store));

            }else {
                if(that.store[that.date].data)
                    that.store[that.date].data = that.store[that.date].data;
                if(that.store[that.date].location && that.store[that.date].location.length===2) {
                    that.editor.location = that.store[that.date].location;
                }
            }

            that.map.MoveToLocation(that.store[that.date].location);
            let my_truck_2 = $('#my_truck').clone()[0];
            $(my_truck_2).attr('id','my_truck_2');
            let status = that.store[that.date].status;
            if(!that.store[that.date].status)
                status = 'unpublished';
            $(my_truck_2).addClass(status);
            that.my_truck_ovl = new Overlay(that.map,my_truck_2,that.store[that.date].location);
            $('#my_truck').css('visibility','hidden');


            that.map.import.DownloadOrders(function () {

                window.db.GetOrders(window.user.date, window.user.email, function (objs) {
                    if(objs!=-1){
                        let type = 'customer';
                        for(let o in objs) {
                            window.user.map.geo.SearchLocation(objs[o].address, function (bound, lat, lon) {
                                let loc = proj.fromLonLat([parseFloat(lon),parseFloat(lat)]);
                                var markerFeature = new Feature({
                                    geometry: new Point(loc),
                                    labelPoint: new Point(loc),
                                    //name: cursor.value.title ? cursor.value.title : "",
                                    //tooltip: cursor.value.title ? cursor.value.title : "",
                                    type:type,
                                    object: objs[o]
                                });
                                var id_str = md5(window.user.date+objs[o].cusem);
                                markerFeature.setId(id_str);

                                let layer = that.map.ol_map.getLayers().get(type);
                                if (!layer) {
                                    layer = that.map.layers.CreateLayer(type, '1');
                                }
                                let source = layer.values_.vector;

                                if (!source.getFeatureById(markerFeature.getId()) && markerFeature.values_.object.date===window.user.date)
                                    that.map.layers.AddCluster(layer, markerFeature);
                            });
                        }
                    }
                });
            });


        });

        $("#my_truck").on('dragstart',function (ev) {

        });

        $('#map').on('dragover',function (ev) {
            ev.preventDefault();
        });

        $('#map').on('drop',function (ev) {
            ev.preventDefault();
            if(that.my_truck_ovl) {
                that.my_truck_ovl.RemoveOverlay();
                that.my_truck_ovl = '';
            }
            let pixel = [ev.originalEvent.clientX,ev.originalEvent.clientY];
            let coor = that.map.ol_map.getCoordinateFromPixel(pixel);
            window.user.editor.location = coor;

            that.store[window.user.date].location = coor;
            localStorage.setItem('supplier', JSON.stringify(that.store));
            $('#my_truck').css('visibility','visible');
            let my_truck_2 = $('#my_truck').clone()[0];
            $(my_truck_2).attr('id','my_truck_2');
            that.my_truck_ovl  = new Overlay(that.map,my_truck_2,coor);
            $('#my_truck').css('visibility','hidden');
        });
    }

    OnClickTimeRange(ev){
        let from = $(ev).text().split(' - ')[0];
        let to = $(ev).text().split(' - ')[1];
        $('.sel_time').text($(ev).text());
        $('#dt_from').val(from);
        $('#dt_to').val(to);
        let layers = this.map.ol_map.getLayers();
        layers.forEach(function (layer, i, layers) {
            if(layer.constructor.name==="_ol_layer_Vector_") {
                layer.getSource().refresh();
            }
        });
    }

    OpenOfferEditor(ev) {
        ev.data.editor.OpenOffer();
    }

    UpdateOfferLocal(tab, offer, location, dict, status){

        if(window.demoMode) {
            let uObj = JSON.parse(localStorage.getItem('supplier'));
            if (uObj) {
                if(tab){
                    for(let i in offer[tab]){
                        if(uObj[window.user.date].data[tab][i] && !offer[tab][i].img_left)
                            offer[tab][i].img_left = uObj[window.user.date].data[tab][i].img_left;
                        if(uObj[window.user.date].data[tab][i] && !offer[tab][i].img_top)
                            offer[tab][i].img_top = uObj[window.user.date].data[tab][i].img_top;
                    }
                    uObj[window.user.date].data[tab] = offer[tab];
                    this.store[this.date].data[tab] = offer[tab];
                }else {
                    uObj[window.user.date] = {
                        "period": $('.sel_time').text(),
                        "location": location,
                        "data": offer,
                        "status": status
                    };
                }
                this.store[this.date].data = offer;
                localStorage.setItem('supplier', JSON.stringify(uObj));
                localStorage.setItem('dict',JSON.stringify(dict));
            }else{
                uObj['email'] = this.email;
                uObj['uid'] = this.uid;
                uObj[date] = {
                    "period": $('.sel_time').text(),
                    "location":location,
                    "data": offer,
                    "status": status
                };

                localStorage.setItem('supplier', JSON.stringify(uObj));
                localStorage.setItem('dict',JSON.stringify(dict));
            }
        }
    }

    ValidateOffer(data){
        for(let tab in data) {
            if(data[tab].length===0)
                return false;
            for(let i in data[tab])
            if (!data[tab][i].checked || !parseInt(data[tab][i].price) || !data[tab][i].title){
                return false;
            }

        }

        return true;
    }


    PublishOffer(data, date, location, cb){
        let that = this;
        if(!location || location.length===0){
            this.PickRegion();
            return;
        }

        let data_obj = {
            "proj": "d2d",
            "func": "updateoffer",
            "uid": that.uid,
            "categories": that.editor.arCat,
            "date": date,
            "period": $('.sel_time').text(),
            "location": proj.toLonLat(location),
            "offer": urlencode.encode(JSON.stringify(data)),
            "dict": JSON.stringify(window.dict)
        };

        this.network.postRequest(data_obj, function (data) {
            if(data.result.affectedRows===1){
                let obj = JSON.parse(localStorage.getItem('supplier'));
                obj[window.user.date].status = 'published';
                localStorage.setItem('supplier',JSON.stringify(obj));
                $("#my_truck").addClass('published');
                cb(obj);
            }
        });
    }

    PickRegion(){
        alert($('#choose_region').text());
    }

    UpdateOrderStatus(date, supem, cusem){
        window.db.GetOrder(date, supem, cusem,function (obj) {
            obj.status = 'approved';
            window.db.SetObject('orderStore', obj, function (res) {
                let data_obj = {
                    "proj": "d2d",
                    "func": "updateorderstatus",
                    "uid": window.user.uid,
                    "cusem": cusem,
                    "supem": supem,
                    "date": date,
                    "status":  'approved',
                    "lang": window.sets.lang
                };

                window.user.network.postRequest(data_obj, function (data) {
                    console.log(data);
                });
            });
        });
    }

    SendLocation(loc){

        if (this.isShare_loc) {
                let location = proj.toLonLat(loc);
               location[0] = parseFloat(location[0].toFixed(6));
               location[1] = parseFloat(location[1].toFixed(6));
                let data_obj = {
                    "proj": "d2d",
                    "func": "sharelocation",
                    "uid": window.user.uid,
                    "supem": this.email,
                    "date": this.date,
                    "location": location
                };

                window.user.network.postRequest(data_obj, function (data) {
                    console.log(data);
                });

            if(window.user.my_truck_ovl ) {
                window.user.my_truck_ovl.overlay.setPosition(loc);
            }
        }
    }

    DeleteOffer(){

    }

    OnMessage(data){
        if(data.func ==='updateorder'){
            window.db.SetObject('orderStore',data.order,res=>{

            });
        }
        if(data.func ==='sharelocation'){
            let loc = data.location;
            window.db.GetObject('supplierStore',window.user.date,data.email, function (obj) {
                if(obj!=-1) {
                    obj.latitude = loc[1];
                    obj.longitude = loc[0];
                    let layers = window.user.map.ol_map.getLayers();
                    window.db.SetObject('supplierStore', obj, function (res) {
                        let catAr = JSON.parse(obj.categories);
                        for (let c in catAr) {
                            let l = layers.get(catAr[c])
                            let feature = l.values_.vector.getFeatureById(obj.hash);
                            if (feature) {
                                let point = feature.getGeometry();
                                let loc =  proj.fromLonLat([obj.longitude, obj.latitude]);
                                if(point.flatCoordinates[0]!==loc[0] && point.flatCoordinates[1]!==loc[1])
                                    window.user.map.SetFeatureGeometry(feature,loc);
                            }
                        }

                    });
                }
            });
        }
    }


}














