'use strict'
export {Events};

import {MapEvents} from './map.events'
import {DOMEvents} from './dom.events';


class Events {

    constructor(map){
        this.map = map;
        this.domEvents = new DOMEvents(map);
        this.mapEvents = new MapEvents(map);
    }
}