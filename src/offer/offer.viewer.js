'use strict'
export {OfferViewer}

var urlencode = require('urlencode');
require('bootstrap/js/modal.js');
require('bootstrap/js/tooltip.js');
require('bootstrap/js/tab.js');
// require('bootstrap/dist/css/bootstrap.css');
// require('font-awesome/css/font-awesome.css');

import {Dict} from '../dict/dict.js';
const langs = require("../dict/languages");

var moment = require('moment');

var md5 = require('md5');
var isJSON = require('is-json');

import {utils} from "../utils/utils";

class OfferViewer {

    constructor(dict){
        this.changed = false;
        this.offer ;
        this.dict = new Dict(dict);

        this.arCat = [];

        this.location = [];

        this.active_class = 'w3-border w3-border-grey w3-round-large';

        this.ovc = $("#offer_viewer").clone();
        $(this.ovc).attr('id','offer_viewer_clone');
        $(this.ovc).insertAfter($("#offer_viewer"));

        this.ovc.modal({
            show: true,
            keyboard:true
        });

        this.ovc.find('.modal-title').text("Offer for ");
        this.ovc.find('.modal-title').attr('data-translate', md5('Menu for'));
        this.ovc.find('.modal-title-date').text($('.dt_val')[0].value.split(' ')[0]);
        this.ovc.off('hide.bs.modal');
        this.ovc.on('hide.bs.modal', this,this.CloseMenu);

        this.ovc.find('.toolbar').css('display', 'block');

    }


    OpenOffer(offer) {

        this.email = offer.email;
        this.offer = JSON.parse(offer.data);


        this.period = $('.sel_time').text();

        $('.dropdown').css('visibility','hidden');
        $('#add_tab_li').css('visibility','hidden');
        $('#add_item').css('visibility','hidden');

        localStorage.setItem('dict',JSON.stringify(window.dict.dict));

        for (let tab in this.offer) {
            if(!tab || this.offer[tab].length===0)
                continue;
            if($('[href="#'+tab+'"]').length===0) {
                $('<li class="tab_inserted"><a data-toggle="tab"  contenteditable="false" data-translate="'+md5(tab)+'"  href="#'+tab+'">'+tab+'</a>' +
                    '</li>').insertBefore(this.ovc.find('.add_tab_li'));
                $('<div id="'+tab+'" class="tab-pane fade div_tab_inserted dropdown" style="border: none">' +
                    '</div>').insertBefore(this.ovc.find('.add_tab_div'));
            }

            for (let i in this.offer[tab]) {

                let tmplt = $('#menu_item_tmplt').clone();
                $('#menu_item_tmplt').attr('id', tab + '_' + i);
                let menu_item = $('#' + tab + '_' + i)[0];
                $(menu_item).attr("class", 'menu_item');
                $(menu_item).css('display', 'block');
                $('#add_item').css('visibility','hidden');

                $(menu_item).find('.item_title').attr('contenteditable', 'false');
                $(menu_item).find('.item_price').attr('contenteditable', 'false');

                $(menu_item).find('.item_content').attr('id', 'content_' + tab + '_' + i);
                $(menu_item).find('.item_title').attr('data-target','#content_' + tab + '_' + i);


                if(this.offer[tab][i].title){
                    try {
                        $(menu_item).find('.item_title').text(window.dict.dict[this.offer[tab][i].title][window.sets.lang]);
                    }catch(ex){
                        ;
                    }
                    $(menu_item).find('.item_title').attr('data-translate', this.offer[tab][i].title);
                }
                $(menu_item).find('.item_price').text(this.offer[tab][i].price);

                //$(menu_item).find('.content_text').text(urlencode.decode(window.dict.dict[this.menu[tab][i].content][window.sets.lang]));
                $(menu_item).find('.content_text').attr('contenteditable', 'false');
                $(menu_item).find('.content_text').attr('data-translate', this.offer[tab][i].content);
                if(this.offer[tab][i].content)
                    $(menu_item).find('.content_text').css('visibility','visible');
                if(this.offer[tab][i].width)
                    $(menu_item).find('.content_text').css('width',(this.offer[tab][i].width));

                // if(this.offer[tab][i].height)
                //     $(menu_item).find('.content_text').css('height',(this.offer[tab][i].height));


                if(this.offer[tab][i].img) {
                    $(menu_item).find('.img-fluid').css('visibility', 'visible');
                    $(menu_item).find('.img-fluid').attr('src', this.offer[tab][i].img);
                    if(this.offer[tab][i].img_left)
                        $(menu_item).find('.img-fluid').css('left',this.offer[tab][i].img_left);
                    if(this.offer[tab][i].img_top)
                        $(menu_item).find('.img-fluid').css('left',this.offer[tab][i].img_top);
                }

                $(menu_item).find('.img-fluid').attr('id', 'img_' + tab + '_' + i);

                this.ovc.find('#' + tab).append(menu_item);

                $(tmplt).insertAfter('#offer_viewer');

                if ($(menu_item).find('.item_content').css('display') == 'block'
                    && $(menu_item).find('.img-fluid').attr('src')===''
                    && $(menu_item).find('.content_text').text()===""){
                    $(menu_item).find('.item_content').slideToggle("fast");
                }
            }
        }

        // let sp = $('.sp_dlg');
        // $(sp).selectpicker();
        // let evnts = $._data($(sp).get(0), "events");
        //
        this.lang = window.sets.lang;
        this.dict.set_lang(window.sets.lang,this.ovc);
        // $($(sp).find('[lang='+window.sets.lang+']')[0]).prop("selected", true).trigger('change');

        // if(!evnts['changed.bs.select']) {
        //     $(sp).on('changed.bs.select', this, this.OnChangeLang);
        // }

    }

    OnChangeLang(ev) {
        ev.preventDefault(); // avoid to execute the actual submit of the form.
        ev.stopPropagation();
        let menu = ev.data;
        menu.SaveOffer(ev,window.user.menu.lang);

        let sel_lang = $('.sp_dlg option:selected').val().toLowerCase().substring(0, 2);

        window.dict.Translate('en',sel_lang, function () {
            window.dict.set_lang(sel_lang, $("#offer_viewer"));
            window.user.menu.lang = sel_lang;
        });
    }


    CloseMenu(ev) {
        ev.data.offer = '';
        $('#offer_viewer_clone').remove();
    }
}


