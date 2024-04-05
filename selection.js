/*
The MIT License (MIT)
Copyright (c) 2013 otto.allmendinger@gmail.com

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

'use strict';

import GObject from 'gi://GObject';
import Meta from 'gi://Meta';
import Clutter from 'gi://Clutter';
import St from 'gi://St';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as Signals from 'resource:///org/gnome/shell/misc/signals.js';

import {gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';

import * as Lib from './convenience.js';
import * as Ext from './extension.js';
import * as UtilNotify from './utilnotify.js';
import {DisplayApi} from './display_module.js';

/**
 * @type {Capture}
 */
class Capture extends Signals.EventEmitter {
    constructor() {
        super();
        Lib.TalkativeLog('-£-capture selection init');

        this._mouseDown = false;

        this.monitor = Main.layoutManager.focusMonitor;

        this._areaSelection = new St.Widget({
            name: 'area-selection',
            style_class: 'area-selection',
            visible: 'true',
            reactive: 'true',
            x: -10,
            y: -10,
        });

        Main.uiGroup.add_child(this._areaSelection);

        this._areaResolution = new St.Label({
            style_class: 'area-resolution',
            text: '',
        });
        this._areaResolution.opacity = 255;
        this._areaResolution.set_position(0, 0);

        Main.uiGroup.add_child(this._areaResolution);

        this._grab = Main.pushModal(this._areaSelection);

        if (this._grab) {
            this._signalCapturedEvent = this._areaSelection.connect(
                'captured-event',
                this._onCaptureEvent.bind(this)
            );

            this._setCaptureCursor();
        } else {
            Lib.TalkativeLog('-£-Main.pushModal() === false');
        }
    }

    /**
     * @private
     */
    _setDefaultCursor() {
        DisplayApi.set_cursor(Meta.Cursor.DEFAULT);
    }

    /**
     * @private
     */
    _setCaptureCursor() {
        DisplayApi.set_cursor(Meta.Cursor.CROSSHAIR);
    }

    /**
     * @param {Clutter.Actor} actor the actor that received the event
     * @param {Clutter.Event} event a Clutter.Event
     * @private
     */
    _onCaptureEvent(actor, event) {
        if (event.type() === Clutter.EventType.KEY_PRESS) {
            if (event.get_key_symbol() === Clutter.KEY_Escape)
                this._stop();
        }

        this.emit('captured-event', event);
    }

    /**
     * Draws a on-screen rectangle showing the area that will be captured by screen cast.
     *
     * @param {object} rect rectangle
     * @param {number} rect.x left position in pixels
     * @param {number} rect.y top position in pixels
     * @param {number} rect.w width in pixels
     * @param {number} rect.h height in pixels
     * @param {boolean} showResolution whether to display the size of the selected area
     */
    drawSelection({x, y, w, h}, showResolution) {
        this._areaSelection.set_position(x, y);
        this._areaSelection.set_size(w, h);

        if (showResolution && w > 100 && h > 50) {
            this._areaResolution.set_text(`${w} X ${h}`);
            this._areaResolution.set_position(
                x + (w / 2 - this._areaResolution.width / 2),
                y + (h / 2 - this._areaResolution.height / 2)
            );
        } else {
            this._areaResolution.set_position(0, 0);
            this._areaResolution.set_text('');
        }
    }

    /**
     * Clear drawing selection
     */
    clearSelection() {
        this.drawSelection(
            {
                x: -10,
                y: -10,
                w: 0,
                h: 0,
            },
            false
        );
    }

    /**
     * @private
     */
    _stop() {
        Lib.TalkativeLog('-£-capture selection stop');

        this._areaSelection.disconnect(this._signalCapturedEvent);
        this._setDefaultCursor();
        Main.uiGroup.remove_child(this._areaSelection);
        Main.popModal(this._grab);
        Main.uiGroup.remove_child(this._areaResolution);
        this._areaSelection.destroy();
        this.emit('stop');
    }

    _saveRect(x, y, h, w) {
        Lib.TalkativeLog(`-£-selection x:${x} y:${y} height:${h} width:${w}`);

        Ext.Indicator.saveSelectedRect(x, y, h, w);
        Ext.Indicator._doDelayAction();
    }

    toString() {
        return this.GTypeName;
    }
}

export class SelectionArea extends Signals.EventEmitter {
    constructor() {
        super();
        Lib.TalkativeLog('-£-area selection init');

        this._mouseDown = false;
        this._capture = new Capture();
        this._capture.connect('captured-event', this._onEvent.bind(this));
        this._capture.connect('stop', () => {
            this._ctrlNotify.resetAlert();
            this.emit('stop');
        });

        this._ctrlNotify = new UtilNotify.NotifyManager();
        this._ctrlNotify.createAlert(
            _('Select an area for recording or press [ESC] to abort')
        );
    }

    /**
     * @param {Clutter.actor} capture the actor the captured the event
     * @param {Clutter.Event} event a Clutter.Event
     * @private
     */
    _onEvent(capture, event) {
        let type = event.type();
        let [x, y] = global.get_pointer();

        if (type === Clutter.EventType.BUTTON_PRESS) {
            [this._startX, this._startY] = [x, y];
            this._mouseDown = true;
        } else if (this._mouseDown) {
            let rect = _getRectangle(this._startX, this._startY, x, y);
            if (type === Clutter.EventType.MOTION) {
                this._capture.drawSelection(rect, true);
            } else if (type === Clutter.EventType.BUTTON_RELEASE) {
                this._capture._stop();

                Lib.TalkativeLog(`-£-area x: ${rect.x} y: ${rect.y} height: ${rect.h} width: ${rect.w}`);

                this._capture._saveRect(rect.x, rect.y, rect.h, rect.w);
            }
        }
    }

    toString() {
        return this.GTypeName;
    }
}

export class SelectionWindow extends Signals.EventEmitter {
    constructor() {
        super();
        Lib.TalkativeLog('-£-window selection init');

        this._windows = global.get_window_actors();
        this._capture = new Capture();
        this._capture.connect('captured-event', this._onEvent.bind(this));
        this._capture.connect('stop', () => {
            this._ctrlNotify.resetAlert();
            this.emit('stop');
        });

        this._ctrlNotify = new UtilNotify.NotifyManager();
        this._ctrlNotify.createAlert(
            _('Select a window for recording or press [ESC] to abort')
        );
    }

    /**
     * @param {Clutter.Actor} capture the actor the captured the event
     * @param {Clutter.Event} event a Clutter.Event
     * @private
     */
    _onEvent(capture, event) {
        let type = event.type();
        let [x, y] = global.get_pointer();

        this._selectedWindow = _selectWindow(this._windows, x, y);

        if (this._selectedWindow)
            this._highlightWindow(this._selectedWindow);
        else
            this._clearHighlight();


        if (type === Clutter.EventType.BUTTON_PRESS) {
            if (this._selectedWindow) {
                this._capture._stop();

                let maxHeight = global.screen_height;
                let maxWidth = global.screen_width;
                Lib.TalkativeLog(`-£-global screen area H: ${maxHeight} W: ${maxWidth}`);

                let [w, h] = this._selectedWindow.get_size();
                let [wx, wy] = this._selectedWindow.get_position();

                Lib.TalkativeLog(`-£-windows pre wx: ${wx} wy: ${wy} height: ${h}  width: ${w}`);

                if (wx < 0)
                    wx = 0;
                if (wy < 0)
                    wy = 0;
                if (wx + w > maxWidth)
                    w = maxWidth - wx;
                if (wy + h > maxHeight)
                    h = maxHeight - wy;

                Lib.TalkativeLog(`-£-windows post wx: ${wx} wy: ${wy} height: ${h} width: ${w}`);

                this._capture._saveRect(wx, wy, h, w);
            }
        }
    }

    /**
     * @param {Clutter.Actor} win the window to highlight
     * @private
     */
    _highlightWindow(win) {
        let rect = _getWindowRectangle(win);
        Lib.TalkativeLog(`-£-window highlight on, pos/meas: x:${rect.x} y:${rect.y} w:${rect.w} h:${rect.h}`);
        this._capture.drawSelection(rect, false);
    }

    /**
     * @private
     */
    _clearHighlight() {
        Lib.TalkativeLog('-£-window highlight off');
        this._capture.clearSelection();
    }

    toString() {
        return this.GTypeName;
    }
}

export class SelectionDesktop extends Signals.EventEmitter {
    constructor() {
        super();
        Lib.TalkativeLog('-£-desktop selection init');
        const displayCount = DisplayApi.number_displays();
        Lib.TalkativeLog(`-£-Number of monitor ${displayCount}`);

        for (let i = 0; i < displayCount; i++) {
            let tmpM = DisplayApi.display_geometry_for_index(i);
            Lib.TalkativeLog(`-£-monitor ${i} geometry x=${tmpM.x} y=${tmpM.y} w=${tmpM.width} h=${tmpM.height}`);
        }

        this._capture = new Capture();
        this._capture.connect('captured-event', this._onEvent.bind(this));
        this._capture.connect('stop', () => {
            this._ctrlNotify.resetAlert();
            this.emit('stop');
        });

        this._ctrlNotify = new UtilNotify.NotifyManager();
        this._ctrlNotify.createAlert(
            _('Select a desktop for recording or press [ESC] to abort')
        );
    }

    /**
     * @param {Clutter.Actor} capture the actor that captured the event
     * @param {Clutter.Event} event a Clutter.Event
     * @private
     */
    _onEvent(capture, event) {
        let type = event.type();

        if (type === Clutter.EventType.BUTTON_PRESS) {
            this._capture._stop();

            let tmpM = Main.layoutManager.currentMonitor;

            let x = tmpM.x;
            let y = tmpM.y;
            let height = tmpM.height;
            let width = tmpM.width;
            Lib.TalkativeLog(`-£-desktop x: ${x} y: ${y} height: ${height} width: ${width}`);

            this._capture._saveRect(x, y, height, width);
        }
    }

    toString() {
        return this.GTypeName;
    }
}

export class AreaRecording extends GObject.Object {
    constructor() {
        super();
        Lib.TalkativeLog('-£-area recording init');

        this._areaRecording = new St.Widget({
            name: 'area-recording',
            style_class: 'area-recording',
            visible: 'true',
            reactive: 'false',
            x: -10,
            y: -10,
        });

        let [recX, recY, recW, recH] = Ext.Indicator.getSelectedRect();
        let tmpH = Main.layoutManager.currentMonitor.height;
        let tmpW = Main.layoutManager.currentMonitor.width;

        Main.uiGroup.add_child(this._areaRecording);

        Main.overview.connect('showing', () => {
            Lib.TalkativeLog('-£-overview opening');

            Main.uiGroup.remove_child(this._areaRecording);
        });

        Main.overview.connect('hidden', () => {
            Lib.TalkativeLog('-£-overview closed');

            Main.uiGroup.add_child(this._areaRecording);
        });

        if (recX + recW <= tmpW - 5 && recY + recH <= tmpH - 5)
            this.drawArea(recX - 2, recY - 2, recW + 4, recH + 4);
    }

    /**
     * @param {number} x left position
     * @param {number} y top position
     * @param {number} w width
     * @param {number} h height
     */
    drawArea(x, y, w, h) {
        Lib.TalkativeLog('-£-draw area recording');

        this._visible = true;
        this._areaRecording.set_position(x, y);
        this._areaRecording.set_size(w, h);
    }

    /**
     * Clears the drawing area
     */
    clearArea() {
        Lib.TalkativeLog('-£-hide area recording');

        this._visible = false;
        this.drawArea(-10, -10, 0, 0);
    }

    /**
     * @returns {boolean}
     */
    isVisible() {
        return this._visible;
    }

    toString() {
        return this.GTypeName;
    }
}

/**
 * @param {number} x1 left position
 * @param {number} y1 top position
 * @param {number} x2 right position
 * @param {number} y2 bottom position
 * @returns {{x: number, y: number, w: number, h: number}}
 */
function _getRectangle(x1, y1, x2, y2) {
    return {
        x: Math.min(x1, x2),
        y: Math.min(y1, y2),
        w: Math.abs(x1 - x2),
        h: Math.abs(y1 - y2),
    };
}

/**
 * @param {Clutter.Actor} win a Clutter.Actor
 * @returns {{x: number, y: number, w: number, h: number}}
 */
function _getWindowRectangle(win) {
    let [tw, th] = win.get_size();
    let [tx, ty] = win.get_position();

    return {
        x: tx,
        y: ty,
        w: tw,
        h: th,
    };
}

/**
 * @param {Array(Clutter.Actor)} windows all windows on the display
 * @param {number} x left position
 * @param {number} y top position
 * @returns {Clutter.Actor}
 */
function _selectWindow(windows, x, y) {
    let filtered = windows.filter(win => {
        if (
            win !== undefined &&
            win.visible &&
            typeof win.get_meta_window === 'function'
        ) {
            Lib.TalkativeLog(`-£-selectWin x:${x} y:${y}`);

            let [w, h] = win.get_size();
            let [wx, wy] = win.get_position();
            Lib.TalkativeLog(`-£-selectWin w:${w} h:${h} wx:${wx} wy:${wy}`);

            return wx <= x && wy <= y && wx + w >= x && wy + h >= y;
        } else {
            return false;
        }
    });

    filtered.sort((a, b) => {
        return (
            a.get_meta_window().get_layer() <= b.get_meta_window().get_layer()
        );
    });

    return filtered[0];
}
