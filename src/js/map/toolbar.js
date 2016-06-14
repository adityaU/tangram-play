/*

import LocalStorage from '../storage/localstorage';
import { map } from './map';
import search from './search';
import { initGeolocator } from './geolocator';
import bookmarks from './bookmarks';

const STORAGE_DISPLAY_KEY = 'map-toolbar-display';
const MAP_UPDATE_DELTA = 0.002;

let el;
let menuButtonEl;
let currentLocation;

export function initMapToolbar () {
    el = document.body.querySelector('.map-toolbar-bar');
    menuButtonEl = document.body.querySelector('.map-toolbar-collapsed');

    search.init();
    initGeolocator();
    bookmarks.init();

    setupEventListeners();
    setInitialDisplayState();
    setZoomLabel();

    currentLocation = map.getCenter();
    search.setCurrentLatLng(currentLocation);
    search.reverseGeocode(currentLocation);

    menuButtonEl.addEventListener('click', e => {
        toggleMapToolbar();
    });
}

function setupEventListeners () {
    el.querySelector('#zoom-in').addEventListener('click', e => {
        map.zoomIn(1, { animate: true });
        setZoomLabel();
    }, false);
    el.querySelector('#zoom-out').addEventListener('click', e => {
        map.zoomOut(1, { animate: true });
        setZoomLabel();
    }, false);

    // Close
    el.querySelector('.map-toolbar-toggle').addEventListener('click', e => {
        console.log("clicking hide toolbar") ;
        hideToolbar();
    });

    // Make sure that map zoom label changes when the map is done zooming
    map.on('zoomend', function (e) {
        setZoomLabel();
    });
    map.on('moveend', function (e) {
        // Only update location if the map center has moved more than a given delta
        // This is actually really necessary because EVERY update in the editor reloads
        // the map, which fires moveend events despite not actually moving the map
        // But we also have the bonus of not needing to make a reverse geocode request
        // for small changes of the map center.
        let center = map.getCenter();
        search.setCurrentLatLng(center);
        if (getMapChangeDelta(currentLocation, center) > MAP_UPDATE_DELTA) {
            search.reverseGeocode(center);

            // Reset save icon
            // TODO: Be smarter about when this happens
            search.resetSaveIcon();

            // Reset currentLocation after geocoding - don't reset after every
            // moveend because this basically allows the reverse geocode to never
            // happen if you just scoot the viewport tiny amounts each time.
            currentLocation = center;
        }
    });
}

function toggleMapToolbar () {
    console.log("toggletoolbar") ;
    if (el.getBoundingClientRect().top > 0) {
        hideToolbar();
    }
    else {
        showToolbar();
    }
}

function showToolbar () {
    el.style.top = '0';
    //menuButtonEl.style.top = '-40px';
    saveDisplayState('true');
}

function hideToolbar () {
    el.style.top = '-50px';
    //menuButtonEl.style.top = '0';
    saveDisplayState('false');
}

function saveDisplayState (isShown = 'true') {
    LocalStorage.setItem(STORAGE_DISPLAY_KEY, isShown);
}

function setInitialDisplayState () {
    let storedPosition = LocalStorage.getItem(STORAGE_DISPLAY_KEY);
    // LocalStorage saves a string rather than actual boolean value
    if (storedPosition && storedPosition === 'false') {
        hideToolbar();
    }
    // show toolbar by default
    else {
        showToolbar();
    }
}

function setZoomLabel () {
    let label = el.querySelector('.map-zoom-quantity');
    let currentZoom = map.getZoom();
    let fractionalNumber = Math.floor(currentZoom * 10) / 10;
    label.textContent = fractionalNumber.toFixed(1);
}

function getMapChangeDelta (startLatLng, endLatLng) {
    let startX = startLatLng.lat;
    let startY = startLatLng.lng;
    let endX = endLatLng.lat;
    let endY = endLatLng.lng;
    return Math.sqrt(Math.pow(startX - endX, 2) + Math.pow(startY - endY, 2));
}
*/
