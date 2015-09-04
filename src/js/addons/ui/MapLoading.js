'use strict';

import { debounce } from 'app/core/common';

const MapLoading = {
    el: document.getElementById('map-loading'),
    show () {
        this.el.classList.add('tp-map-loading-show');
    },
    // Hides are debounced in case several of these are called rapidly in post-update hooks
    hide: debounce(() => {
        // this.el does not work here ¯\_(ツ)_/¯
        document.getElementById('map-loading').classList.remove('tp-map-loading-show');
    }, 50),
    size (width) {
        this.el.style.width = width.toString() + 'px';
    }
};

export default MapLoading;
