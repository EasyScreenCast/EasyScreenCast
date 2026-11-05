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
        this._areaSelection.set_cursor_type(Clutter.CursorType.DEFAULT);
    }

    /**
     * @private
     */
    _setCaptureCursor() {
        this._areaSelection.set_cursor_type(Clutter.CursorType.CROSSHAIR);
    }

    /**
     * @param {Clutter.Actor} actor the actor that received the event
     * @param {Clutter.Event} event a Clutter.Event
     * @private
     */
    _onCaptureEvent(actor, event) {
        if (event.type() === Clutter.EventType.KEY_PRESS && event.get_key_symbol() === Clutter.KEY_Escape)
            this._stop();

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

        if (this._signalCapturedEvent) {
            this._areaSelection.disconnect(this._signalCapturedEvent);
            this._signalCapturedEvent = null;
        }
        this._setDefaultCursor();
        Main.uiGroup.remove_child(this._areaSelection);
        Main.popModal(this._grab);
        Main.uiGroup.remove_child(this._areaResolution);
        this._areaSelection.destroy();
        this._areaSelection = null;
        this._areaResolution.destroy();
        this._areaResolution = null;
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

/**
 * Lifecycle shared by the area, window and desktop selections: the Capture
 * (highlight rectangle, modal grab and captured-event signal) and the alert
 * label telling the user what to do.
 *
 * The subclasses only pass their log tag and gettext alert message here, and
 * keep the fields and the event handling that differ between them.
 */
class SelectionBase extends Signals.EventEmitter {
    /**
     * @param {string} kind short tag used in the debug log
     * @param {string} alert message shown to the user while selecting
     */
    constructor(kind, alert) {
        super();
        Lib.TalkativeLog(`-£-${kind} selection init`);

        this._kind = kind;
        this._capture = new Capture();
        this._capture.connect('captured-event', this._onEvent.bind(this));
        this._capture.connect('stop', () => {
            this._ctrlNotify?.resetAlert();
            this.emit('stop');
        });

        this._ctrlNotify = new UtilNotify.NotifyManager();
        this._ctrlNotify.createAlert(alert);
    }
}

class SelectionArea extends SelectionBase {
    constructor() {
        super('area', _('Select an area for recording or press [ESC] to abort'));

        this._mouseDown = false;
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

class SelectionWindow extends SelectionBase {
    constructor() {
        super('window', _('Select a window for recording or press [ESC] to abort'));

        this._windows = global.get_window_actors();
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

class SelectionDesktop extends SelectionBase {
    constructor() {
        super('desktop', _('Select a desktop for recording or press [ESC] to abort'));

        const displayCount = DisplayApi.number_displays();
        Lib.TalkativeLog(`-£-Number of monitor ${displayCount}`);

        for (let i = 0; i < displayCount; i++) {
            let tmpM = DisplayApi.display_geometry_for_index(i);
            Lib.TalkativeLog(`-£-monitor ${i} geometry x=${tmpM.x} y=${tmpM.y} w=${tmpM.width} h=${tmpM.height}`);
        }
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

const AreaRecording = GObject.registerClass({
}, class AreaRecording extends GObject.Object {
    constructor() {
        super();
        Lib.TalkativeLog('-£-area recording init');

        // The recording-area indicator is drawn as a hollow frame made of four
        // thin edge strips (top/bottom/left/right) rather than a single widget
        // covering the whole recorded rectangle. A single widget would swallow
        // all events (including focus, pointer events), so nothing inside the
        // recorded area could be clicked (see also issues #24, #293).
        // Four edge strips leave the interior free of any actor, so clicks
        // inside behave as if no indicator were present.
        this._borderThickness = 2;
        this._edges = [];
        for (let edgeIndex = 0; edgeIndex < 4; edgeIndex++) {
            const edge = new St.Widget({
                name: 'area-recording',
                style_class: 'area-recording-edge',
                visible: true,
                reactive: false,
                x: -10,
                y: -10,
            });
            Main.uiGroup.add_child(edge);
            this._edges.push(edge);
        }

        let [recX, recY, recW, recH] = Ext.Indicator.getSelectedRect();
        let tmpH = Main.layoutManager.currentMonitor.height;
        let tmpW = Main.layoutManager.currentMonitor.width;

        Main.overview.connect('showing', () => {
            Lib.TalkativeLog('-£-overview opening');

            this._edges.forEach(edge => Main.uiGroup.remove_child(edge));
        });

        Main.overview.connect('hidden', () => {
            Lib.TalkativeLog('-£-overview closed');

            this._edges.forEach(edge => Main.uiGroup.add_child(edge));
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

        // clearArea() passes w/h = 0 to hide the frame: collapse all strips.
        if (w <= 0 || h <= 0) {
            this._edges.forEach(edge => {
                edge.set_position(-10, -10);
                edge.set_size(0, 0);
            });
            return;
        }

        const t = this._borderThickness;
        const [top, bottom, left, right] = this._edges;

        top.set_position(x, y);
        top.set_size(w, t);

        bottom.set_position(x, y + h - t);
        bottom.set_size(w, t);

        left.set_position(x, y);
        left.set_size(t, h);

        right.set_position(x + w - t, y);
        right.set_size(t, h);
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
});

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

export {
    SelectionArea,
    SelectionWindow,
    SelectionDesktop,
    AreaRecording
};
