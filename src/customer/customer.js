'use strict'
export {Customer};

let utils = require('../utils/utils');
var isJSON = require('is-json');

require('jquery-ui')
require('jquery-ui-touch-punch');
require('jquery.ui.touch');
require('bootstrap');

require('../../lib/bootstrap-rating/bootstrap-rating.min.js')

import {OfferEditor} from '../offer/offer.editor';
import {Dict} from '../dict/dict.js';
import {Network} from "../../network";

//import {RTCOperator} from "../rtc/rtc_operator"

import {OLMap} from '../map/map';
import proj from 'ol/proj';


var urlencode = require('urlencode');

var ColorHash = require('color-hash');



import 'eonasdan-bootstrap-datetimepicker/build/js/bootstrap-datetimepicker.min';
import 'eonasdan-bootstrap-datetimepicker/build/css/bootstrap-datetimepicker.css';
import {Profile} from "../profile/profile";
import {Import} from "../import/import";

var moment = require('moment/moment');

window.TriggerEvent = function (el, ev) {
    $(el).trigger(ev);
}




class Customer{

    constructor(uObj) {

        this.date = $('#datetimepicker').data("DateTimePicker").date().format('YYYY-MM-DD');

        this.uid = uObj.uid;
        this.psw = uObj.psw;
        this.email = '';//!!! no need to registrate
        this.profile = new Profile(uObj.profile);
        this.map = new OLMap();

        this.import = new Import(this.map);

    }

    IsAuth_test(cb){
        let that = this;

        this.map.Init();

        window.network.InitSSE(this,function () {

        });

        $.getJSON('../dict/sys.dict.json', function (data) {
            window.sysdict = new Dict(data);
            window.sysdict.set_lang(window.sets.lang, $('body'));
            window.sysdict.set_lang(window.sets.lang, $('#categories'));

            window.db.GetStorage('dictStore', function (rows) {
                window.dict = new Dict(rows);
            });
            cb();
        });

        $( "#period_list" ).selectable({
            stop: function() {
                var result;
                $( ".ui-selected", this ).each(function(i) {
                    let index = $( "#period_list li" ).index( this );
                    if(i===0)
                    result = $($( "#period_list li")[index]).text().split(' - ')[0];
                    if($( ".ui-selected").length===i+1)
                        result+=" - "+ $($( "#period_list li")[index]).text().split(' - ')[1];
                });
                $('.sel_period').text(result);

                let layers = that.map.ol_map.getLayers();
                layers.forEach(function (layer, i, layers) {
                    if(layer.constructor.name==="_ol_layer_Vector_") {
                        layer.getSource().refresh();
                    }
                });
                //not offer but selected period store
                window.db.SetObject('offerStore',{date:that.date,period:result},function (res) {

                });
            }
        });

        //class_obj.menu.menuObj = JSON.parse(data.menu);
        //this.rtc_operator = new RTCOperator(this.uid, this.email,"browser", window.network);
        window.db.GetOffer(this.date,function (res) {
            if(res){
                $('.sel_period').text(res.period);
            }else{
                let time = $($('.period_list li')[0]).text();
                $('.sel_period').text(time);
            }
        });
        this.DateTimePickerEvents();
    }


    DateTimePickerEvents(){
        let that = this;

        $('#dt_from').on("dp.change",this, function (ev) {

            let date_from =  new moment($('#period_1').find('.from')[0].getAttribute('text').value, 'HH:mm');
            let date = moment($(this).data("DateTimePicker").date().format('HH:mm'), 'HH:mm');
            if(date.isBefore(date_from)) {
                $(this).data("DateTimePicker").toggle();
                return true;
            }
            $('#period_1').find('.from')[0].setAttribute('text', 'value', $(this).data("DateTimePicker").date().format('HH:00'));
            //$('#period_1').find('.to')[0].setAttribute('text', 'value', mom.add(4, 'h').format('HH:00'));

            let time = $('.sel_period').text();

            $(this).data("DateTimePicker").toggle();
        });

        $('.sel_period').on("dp.change",this,function (ev) {
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

            $('.sel_period').find('option').css('visibility','visible');

            $(this).data("DateTimePicker").toggle();

            let source = that.map.layers.circleLayer.getSource();
            source.clear();
            source.changed();

            let layers = that.map.ol_map.getLayers();
            layers.forEach(function (layer, i, layers) {
                if(layer.constructor.name==="_ol_layer_Vector_") {
                    if(layer.getSource()) {
                        layer.getSource().clear();
                        layer.getSource().changed();
                    }
                }
            });
            window.db.GetOffer(that.date ,function (res) {
                if(res){
                    $('.sel_period').text(res.period);
                }else{
                    window.db.SetObject('offerStore',{date:that.date,period:$('.sel_period').text()},function (res) {

                    });
                }
            });
            that.import.GetApprovedCustomer(function () {

            });
        });
    }

    OnClickTimeRange(ev){
        let that = this;
        let from = $(ev).text().split(' - ')[0];
        let to = $(ev).text().split(' - ')[1];
        $('.sel_period').text($(ev).text());
        $('#dt_from').val(from);
        $('#dt_to').val(to);
        let layers = this.map.ol_map.getLayers();
        layers.forEach(function (layer, i, layers) {
            if(layer.constructor.name==="_ol_layer_Vector_") {
                layer.getSource().refresh();
            }
        });
        //not offer but selected period store
        window.db.SetObject('offerStore',{date:that.date,period:$(ev).text()},function (res) {

        });
    }

    PickRegion(){
        alert($('.input_address').text());
    }

    UpdateOrderLocal(obj){
        if(Object.keys(obj.data).length===0) {

            return;
        }
        window.db.SetObject('orderStore',obj,(res)=>{

        });

        this.viewer.order = obj.data;
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

    PublishOrder(obj,cb){
        let that = this;

        obj.proj = "d2d";
        obj.user = window.user.constructor.name.toLowerCase(),
        obj.func = "updateorder";
        obj.psw = that.psw;
        obj.cusuid = that.uid;
        obj.supuid = obj.supuid;

        window.network.postRequest(obj, function (data) {
            if(data.published){
                cb(data);
                obj.proj = '';
                obj.func= '';
                obj.published = data.published;
                that.UpdateOrderLocal(obj)
            }
        });
    }


    OnClickUserProfile(li){

        $('#profile_container').css('display','block');
        $('#profile_container iframe').attr('src',"../src/profile/profile.customer.html");
        $('#profile_container iframe').off();
        $('#profile_container iframe').on('load',function () {
            $('#profile_container iframe')[0].contentWindow.InitProfileUser();

            $('.close_browser',$('#profile_container iframe').contents()).on('touchstart click', function (ev) {
                $('#profile_container iframe')[0].contentWindow.profile_cus.Close();
                $('#profile_container').css('display', 'none');
            });
        });
        this.MakeDraggable($( "#profile_container" ));
        $( "#profile_container" ).resizable({});



        //this.MakeDraggable($('body', $('#profile_container iframe').contents()));

    }

    MakeDraggable(el){
        $(el).draggable({
            start: function (ev) {
                console.log("drag start");

            },
            drag: function (ev) {
                //$(el).attr('drag', true);

            },
            stop: function (ev) {

                // var rel_x = parseInt($(el).position().left / window.innerWidth * 100);
                // $(el).css('right', rel_x + '%');
                // var rel_y = parseInt($(el).position().top / window.innerHeight * 100);
                // $(el).css('bottom', rel_y + '%');
            }
        });
    }

    OnMessage(data){
        if(data.func ==='approved'){
            window.db.GetOrder(data.order.date, data.order.supuid,data.order.cusuid, function (ord) {
                ord.data[data.order.title].approved = data.order.data.approved;
                window.db.SetObject('orderStore', ord, function (res) {
                    if(window.user.viewer){
                        //window.user.viewer.RedrawOrder(ord)
                    }
                });
            });
        }
        if(data.func ==='updateorder'){
            window.db.SetObject('orderStore',data,res=>{

            });
        }
        if(data.func ==='supupdate'){
            window.db.GetObject('supplierStore',data.obj.date,data.obj.email, function (res) {
                let obj = res;
                if(!obj) {
                    obj = data.obj;
                }
                obj.data = JSON.parse(urlencode.decode(data.obj.offer));
                obj.dict = JSON.parse(data.obj.dict);
                let loc = data.obj.location;
                obj.latitude = loc[1];
                obj.longitude = loc[0];
                delete obj.location; delete obj.offer; delete obj.proj; delete obj.func;
                let layers = window.user.map.ol_map.getLayers();
                window.db.SetObject('supplierStore',obj,function (res) {
                    let catAr = JSON.parse(obj.categories);
                    for (let c in catAr) {
                        let l = layers.get(catAr[c])
                        let feature = l.values_.vector.getFeatureById(obj.hash);
                        if (feature) {
                            let point = feature.getGeometry();
                            let loc = proj.fromLonLat([obj.longitude, obj.latitude]);
                            if (point.flatCoordinates[0] !== loc[0] && point.flatCoordinates[1] !== loc[1])
                                window.user.map.SetFeatureGeometry(feature, loc);
                        }
                    }
                });

            });
        }
        if(data.func ==='sharelocation'){
            let loc = data.location;
            window.db.GetObject('supplierStore',window.user.date,data.email, function (obj) {
                if(!obj) {
                    obj = {};
                }
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
                            let loc = proj.fromLonLat([obj.longitude, obj.latitude]);
                            if (point.flatCoordinates[0] !== loc[0] && point.flatCoordinates[1] !== loc[1])
                                window.user.map.SetFeatureGeometry(feature, loc);
                        }
                    }
                });
            });
        }
    }


}


class UserRegistry {
    constructor(){


    }

    OpenRegistry(){

        $("#auth_dialog").modal({
            show: true,
            keyboard:true
        });

        $("#auth_dialog").find(':submit').on('click', function () {
            $('#register').submit(function(e) {
                e.preventDefault(); // avoid to execute the actual submit of the form.

                let email = $(this).find('input[type="email"]').val();

                var data_obj ={
                    proj:"d2d",
                    func:"auth",
                    lang: window.sets.lang,
                    uid: this.uid,
                    email:email
                }

                window.network.postRequest(data_obj, function (data) {
                    let str = JSON.stringify({"email": email});//JSON.stringify()
                    localStorage.setItem('d2d_user',str);//
                });

                return false;
            });
        });
    }

}











