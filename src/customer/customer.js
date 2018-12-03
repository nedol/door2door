'use strict'
export {Customer};

let utils = require('../utils/utils');
var isJSON = require('is-json');

import {OfferEditor} from '../offer/offer.editor';
import {Dict} from '../dict/dict.js';
import {Network} from "../../network";
//import {RTCOperator} from "../rtc/rtc_operator"

import {Map} from '../map/map'
import {DB} from "../map/storage/db"
import proj from 'ol/proj';


import {Overlay} from "../map/overlay/overlay";
import {OfferOrder} from "../offer/offer.order";

var urlencode = require('urlencode');

var ColorHash = require('color-hash');

require('bootstrap');
require('bootstrap-select');
var moment = require('moment/moment');

require('bootstrap/js/modal.js');


class Customer{

    constructor(uObj) {

        this.date = $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD');

        this.viewer = new OfferOrder();

        if(uObj[this.date]){
            this.uid = uObj[this.date].uid;
            this.email = uObj[this.date].email;
            this.viewer.offer = uObj[this.date].offer;
            this.viewer.location = uObj[this.date].location;
        }else if(last && uObj[last]){
            this.uid = uObj[last].uid;
            this.email = uObj[last].email;
            this.viewer.offer = uObj[last].offer;
            this.viewer.location = uObj[last].location;
            uObj[this.date] = uObj[last];
            localStorage.setItem("customer", JSON.stringify(uObj));
        }

        this.db = new DB(function () {
            
        });

        this.map = new Map(this);
        // this.map.MoveToLocation(this.offer.location);
        //
        // let sup = JSON.parse(localStorage.getItem('customer'));
        // if(!sup[this.date]) {
        //     sup[this.date]= {uid:this.uid,email:this.email};
        //     localStorage.setItem('customer', JSON.stringify(sup));
        // }

    }

    IsAuth_test(cb){

        this.network = new Network(host_port);
        this.network.InitSSE(this,function () {

        });

        $.getJSON('../dict/sys.dict.json', function (data) {
            let dict = JSON.parse(localStorage.getItem('dict'));
            dict = Object.assign(dict, data);
            if(dict) {
                window.dict = new Dict(dict);

            }else{
                localStorage.setItem("dict",'{}');
                window.dict = new Dict({});
            }
            window.dict.set_lang(window.sets.lang, $('#main_window'));
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
                        if(data.offer) {
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
                        that.offer.menuObj = JSON.parse(data.offer);
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

        $('#dt_from').on("dp.change",this, function (ev) {

            let date_from =  new moment($('#period_1').find('.from')[0].getAttribute('text').value, 'HH:mm');
            let date = moment($(this).data("DateTimePicker").date().format('HH:mm'), 'HH:mm');
            if(date.isBefore(date_from)) {
                $(this).data("DateTimePicker").toggle();
                return true;
            }
            $('#period_1').find('.from')[0].setAttribute('text', 'value', $(this).data("DateTimePicker").date().format('HH:00'));
            //$('#period_1').find('.to')[0].setAttribute('text', 'value', mom.add(4, 'h').format('HH:00'));

            let time = $('.sel_time').text();

            $(this).data("DateTimePicker").toggle();
        });

        $('.sel_time').on("change",this,function (ev) {
            let from = ev.target[ev.target.selectedIndex].value.split(' ')[0];
            let to = ev.target[ev.target.selectedIndex].value.split(' ')[1];
            $('#dt_from').val(from);
            $('#dt_to').val(to);

        });

        $('#dt_to').on("dp.change",this, function (ev) {

            let date_to = new moment($('#period_1').find('.to')[0].getAttribute('text').value, 'HH:mm');//;
            let date_from = new moment($('#period_1').find('.from')[0].getAttribute('text').value, 'HH:mm');
            if(date_to.isBefore(date_from)) {
                $(this).data("DateTimePicker").toggle();
                return true;
            }
            $('#period_1').find('.to')[0].setAttribute('text', 'value', date_to.format('HH:00'));

            $(this).data("DateTimePicker").toggle();
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

            let cust = JSON.parse(localStorage.getItem('customer'));

            $('#my_truck').css('visibility','visible');

            if(that.my_truck_ovl) {
                that.my_truck_ovl.RemoveOverlay();
                that.my_truck_ovl = '';
            }

            if(!cust[that.date]) {
                let uObj = JSON.parse(localStorage.getItem('customer'));
                let last = Object.keys(uObj)[Object.keys(uObj).length-1]
                that.viewer.offer = uObj[last].offer?uObj[last].offer:{};
                cust[that.date]= {uid:that.uid,email:that.email, offer: that.viewer.offer,location:that.viewer.location};
                localStorage.setItem('customer', JSON.stringify(cust));

            }else {
                if(cust[that.date].offer)
                    that.viewer.offer = cust[that.date].offer;
                if(cust[that.date].location.length===2) {
                    that.viewer.location = cust[that.date].location;
                    that.map.MoveToLocation(cust[that.date].location);
                    let my_truck_2 = $('#my_truck').clone()[0];
                    $(my_truck_2).attr('id','my_truck_2');
                    that.my_truck_ovl = new Overlay(that.map,my_truck_2,cust[that.date].location);
                    $('#my_truck').css('visibility','hidden');
                }

            }

            //this.GetReserved();
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
            that.map.customer.offer.location = coor;

            let cust = JSON.parse(localStorage.getItem('customer'));
            cust[that.map.customer.date].location = coor;
            localStorage.setItem('customer', JSON.stringify(cust));
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

    }

    OpenOfferEditor(ev) {
        ev.data.offer.OpenOffer(ev.data.offer.offer, this);
    }

    UpdateOfferLocal(offer, location, dict, date){

        if(window.demoMode) {
            this.offer.offer = offer;
            let cust = JSON.parse(localStorage.getItem('customer'));
            if (!isJSON(cust)) {
                cust[date] = {
                    "email": this.email,
                    "uid": this.uid,
                    "location":location,
                    "offer": offer
                };
                localStorage.setItem('customer', JSON.stringify(cust));
                localStorage.setItem('dict',JSON.stringify(dict));
            }else{
                cust[date] = {
                    "email": this.email,
                    "uid": this.uid,
                    "location":location,
                    "offer": offer
                };

                localStorage.setItem('customer', JSON.stringify(cust));
                localStorage.setItem('dict',JSON.stringify(dict));
            }

        }

    }


    PickRegion(){
        alert($('#choose_region').text());
    }

    GetReserved(ev) {

        if(ev.stopPropagation)
            ev.stopPropagation();
        if(ev.preventDefault)
            ev.preventDefault();

        var dateTimeAr = $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD');

        try {

            var url = host_port + '?' + //
                "proj=d2d"+
                "&admin="+ ev.data.uid +
                "&func=getreserved" +
                "&date=" + dateTimeAr +
                "&lang=" + window.sets.lang;

            console.log(url);

            $.ajax({
                url: url,
                method: "GET",
                dataType: 'json',
                processData: false,
                async: true,   // asynchronous request? (synchronous requests are discouraged...)
                cache: false,
                crossDomain: true,
                success: function (resp, msg) {


                },
                error: function (xhr, status, error) {
                    //var err = eval("(" + xhr.responseText + ")");

                    console.log(error.Message);
                    console.log(xhr.responseText);

                },
                complete: function (data) {
                    //alert(data.responseText);
                },
            });

        } catch (ex) {
            console.log(ex);
        }
    }



    UpdateReservation(event, table_id, data_obj,cb) {

        let time = $('.sel_time').text();
        if(!this.viewer[time])
            this.viewer[time]={};
        if (!this.viewer[time][this.uid])
            this.viewer[time][this.uid] = {};
        if (!this.viewer[time][this.uid][table_id])
            this.viewer[time][this.uid][table_id] = data_obj?data_obj[this.uid][table_id]:
                {'menu_1':{'viewer':{}},'menu_2':{'viewer':{}}};

        if(window.demoMode) {
            this.ClearTableReserve();
            this.SetTables(this.viewer,this);
            return;
        }
        let url = host_port;
        let data =
            "proj=d2d"+
            "&func=updatereservation"+
            "&user="+localStorage.getItem('user')+
            "&time="+time+
            "&date="+event.data.date+
            "&table="+table_id+
            "&menus="+urlencode.encode(JSON.stringify(this.viewer[time][this.uid][table_id]))+
            "&lang="+window.sets.lang;
//'{"'+res[0].id + '":{"viewer": {},"from":"'+$('#period_1').find('.from')[0].getAttribute('text').value+'","to":"'+$('#period_1').find('.to')[0].getAttribute('text').value+'"}}';

        $.ajax({
            url: url,
            method: "POST",
            dataType: 'json',
            data: data,
            class_obj:event.data,
            cb:cb,
            success: function (resp) {
                let arr = resp;
                if(isJSON(resp))
                    arr = JSON.parse(resp);
                if(resp.user) {
                    localStorage.setItem("user", resp.user);//
                }
                if(!arr) {
                    new TWEEN.Tween($('#target')[0].object3D.position).to({
                        y: 0,
                        x: 0,//_x * visible_width,
                        z: 0 //_y * visible_height
                    }, 1000)
                        .repeat(0)//Infinity)
                        .onUpdate(function () { // Called after tween.js updates
                            //document.querySelector('#camera').setAttribute('camera', 'fov', '60');
                        })
                        .easing(TWEEN.Easing.Quadratic.In).start();
                } else {

                }
            },
            error: function(xhr, status, error){
                //let err = eval("(" + xhr.responseText + ")");
                localStorage.removeItem("user");//
                console.log(error.Message);
                //alert(xhr.responseText);
            },
            complete: function (data) {
                //alert(data.responseText);
                if(this.cb)
                    this.cb();
            },
        });
    }

    UpdateOrder(viewer, date) {

        let time = $('.sel_time').text();
        this.viewer[time] = viewer;

        if(window.demoMode){

            this.ClearTableReserve();
            this.SetTables(this.viewer,this);

            return;
        }

        let url = host_port
        let data =
            "proj=bm"+
            "&func=updateorder"+
            "&admin="+localStorage.getItem('admin')+
            "&lat="+this.lat_param+
            "&lon="+this.lon_param+
            "&date="+date+
            "&viewer="+JSON.stringify(this.viewer).replace(/'/g,'%27').replace(/\n/g,'%0D').replace(/\n/g,'%0D').replace(/"/g,'\"')+
            "&lang="+window.sets.lang;

        $.ajax({
            url: url,
            method: "POST",
            dataType: 'json',
            data: data,
            class_obj:this,
            success: function (resp) {
                let arr = resp;
                if(isJSON(resp))
                    arr = JSON.parse(resp);
                if(!arr) {

                } else {

                    if(arr.msg)
                        console.log(arr.msg);

                }
            },
            error: function(xhr, status, error){
                //let err = eval("(" + xhr.responseText + ")");
                console.log(error.Message);
                alert(xhr.responseText);
            },
            complete: function (data) {
                //alert(data.responseText);
            },
        });
    }

    UpdateDict(dict, cb){

        if(window.demoMode){
            window.dict.dict = dict;
            cb();
            return;
        }

        let data_obj = {
            "proj":"d2d",
            "func": "updatedict",
            "admin": JSON.stringify({uid:this.uid,lon:this.lon_param,lat:this.lat_param}),
            "dict": JSON.stringify(dict).replace(/'/g,'%27').replace(/\n/g,'%0D').replace(/\n/g,'%0D').replace(/"/g,'\"')
        }
        $.ajax({
            url: host_port,
            method: "POST",
            dataType: 'json',
            data: data_obj,
            async: true,   // asynchronous request? (synchronous requests are discouraged...)
            success: function (resp) {
                //$("[data-translate='" + this.key + "']").parent().val(resp);
                cb();
            },
            error: function (xhr, status, error) {
                //let err = eval("(" + xhr.responseText + ")");
                console.log(error.Message);
                //alert(xhr.responseText);
            },

            complete: function (data) {

            },
        });
    }

}













