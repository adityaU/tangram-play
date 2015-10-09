/**
 *  A widget is a standalone unit of functionality for a
 *  given matching context in Tangram YAML.
 *
 *  An instance of the widget class stores a reference to
 *  its DOM element (and children) and can be extended
 *  with any additional functionality.
 *
 */
'use strict';

import TangramPlay from 'app/TangramPlay';
import { editor } from 'app/TangramPlay';
import { getPosition } from 'app/core/common';
import { getValueRange } from 'app/core/codemirror/yaml-tangram';

export default class Widget {
    constructor (def, key) {
        this.key = key;
        this.definition = def;
        this.el = this.createEl(key);
        this.el.widget = this;
    }

    /**
     *  Returns a widget element.
     *  This is a simple bare-bones example.
     *  Widgets that extend from this should create
     *  their own DOM and avoid calling super()
     *  @param key in case the element needs to know something about the source
     */
    createEl (key) {
        return document.createDocumentFragment();
    }

    destroy () {
        if (this.bookmark) {
            this.bookmark.clear();
        }
        delete this;
    }

    /**
     *  Returns x, y position of the upper left corner
     *  of the DOM element for the widget, relative to parent
     *  DOM containers. Use this.el.getBoundingClientRect()
     *  as an alternative for positioning relative to the
     *  viewport (for positioning secondary interactive UI
     *  elements, for example).
     */
    getPosition () {
        return getPosition(this.el);
    }

    update () {
        // Update key
        this.key = TangramPlay.getKeyForKey(this.key);
        this.value = this.key.value;

        // Update position
        let pos = getValueRange(this.key).to;
    }

    insert () {
        this.key = TangramPlay.getKeyForKey(this.key);
        let pos = getValueRange(this.key).to;

        // cm.addWidget does not update automatically;
        // whereas cm.doc.setBookmark includes the element in the CM dom.
        let bookmark = editor.doc.setBookmark(pos, {
            widget: this.el,
            insertLeft: true
        });
        bookmark.widget = this;
    }

    /**
     *  Use this property from outside the module (usually by)
     *  the WidgetManager to set a value inside the module.
     *  TODO: Experimental
     */
    get value () {
        return this.key.value;
    }

    set value (val) {
        this.key.value = val;
    }

    /**
     *  Use this method within a module to communicate a value
     *  back to the Tangram Play editor.
     */
    setEditorValue(string) {
        // Send the value to editor
        this.key = TangramPlay.getKeyForKey(this.key);
        TangramPlay.setValue(this.key, string);

        // Change the value attached to this widget instance
        this.key.value = string;
    }
}
