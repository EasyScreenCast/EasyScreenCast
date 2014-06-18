/* -*- mode: js; js-basic-offset: 4; indent-tabs-mode: nil -*- */

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


const Lang = imports.lang;
const Signals = imports.signals;
const Mainloop = imports.mainloop;

const GLib = imports.gi.GLib;
const Shell = imports.gi.Shell;
const Meta = imports.gi.Meta;
const Clutter = imports.gi.Clutter;
const Tweener = imports.ui.tweener;
const St = imports.gi.St;
const Layout = imports.ui.layout;

const Main = imports.ui.main;

const Gettext = imports.gettext.domain('EasyScreenCast@iacopodeenosee.gmail.com');
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Lib = Me.imports.convenience;
const Pref = Me.imports.prefs;
const Ext = Me.imports.extension;


const Capture = new Lang.Class({
    Name: "EasyScreenCast.Capture",

    _init: function () {
        Lib.TalkativeLog('ESC > capture selection init');

        this._mouseDown = false;

        this._areaSelection = new Shell.GenericContainer({
            name: 'area-selection',
            style_class: 'area-selection',
            visible: 'true',
            reactive: 'true',
            x: -10,
            y: -10
        });

        Main.uiGroup.add_actor(this._areaSelection);

        if (Main.pushModal(this._areaSelection)) {
            this._signalCapturedEvent = global.stage.connect(
                'captured-event', this._onCaptureEvent.bind(this)
            );

            this._setCaptureCursor();
        } else {
            log("Main.pushModal() === false");
        }
    },

    _setDefaultCursor: function () {
        global.screen.set_cursor(Meta.Cursor.DEFAULT);
    },

    _setCaptureCursor: function () {
        global.screen.set_cursor(Meta.Cursor.CROSSHAIR);
    },

    _onCaptureEvent: function (actor, event) {
        if (event.type() === Clutter.EventType.KEY_PRESS) {
            if (event.get_key_symbol() === Clutter.Escape) {
                this._stop();
            }
        }

        this.emit("captured-event", event);
    },

    drawSelection: function ({
        x, y, w, h
    }) {
        this._areaSelection.set_position(x, y);
        this._areaSelection.set_size(w, h);
    },

    clearSelection: function () {
        this.drawSelection({
            x: -10,
            y: -10,
            w: 0,
            h: 0
        });
    },

    _stop: function () {
        Lib.TalkativeLog('ESC > capture selection stop');

        global.stage.disconnect(this._signalCapturedEvent);
        this._setDefaultCursor();
        Main.uiGroup.remove_actor(this._areaSelection);
        Main.popModal(this._areaSelection);
        this._areaSelection.destroy();
        this.emit("stop");
        this.disconnectAll();
    },

    _saveRect: function (x, y, h, w) {
        Lib.TalkativeLog('ESC > selection x:' + x + ' y:' + y +
            ' height:' + h + ' width:' + w);

        Pref.setOption(Pref.X_POS_SETTING_KEY, x);
        Pref.setOption(Pref.Y_POS_SETTING_KEY, y);
        Pref.setOption(Pref.HEIGHT_SETTING_KEY, h);
        Pref.setOption(Pref.WIDTH_SETTING_KEY, w);

        Ext.Indicator._doDelayAction();
    },

    _showAlert: function (msg) {
        var text = new St.Label({
            style_class: 'alert-msg',
            text: msg
        });
        text.opacity = 255;
        Main.uiGroup.add_actor(text);

        let monitor = Main.layoutManager.focusMonitor;
        text.set_position(Math.floor(monitor.width / 2 - text.width / 2),
            Math.floor(monitor.height / 2 - text.height / 2));

        Tweener.addTween(text, {
            opacity: 0,
            time: 4,
            transition: 'easeOutQuad',
            onComplete: Lang.bind(this, function () {
                Main.uiGroup.remove_actor(text);
                text = null;
            })
        });
    }
});

Signals.addSignalMethods(Capture.prototype);





const SelectionArea = new Lang.Class({
    Name: "EasyScreenCast.SelectionArea",

    _init: function () {
        Lib.TalkativeLog('ESC > area selection init');

        this._mouseDown = false;
        this._capture = new Capture();
        this._capture.connect('captured-event', this._onEvent.bind(this));
        this._capture.connect('stop', this.emit.bind(this, 'stop'));

        this._capture._showAlert(_('Select a area for recording or press [ESC] to abort'));
    },

    _onEvent: function (capture, event) {
        let type = event.type();
        let [x, y, mask] = global.get_pointer();

        if (type === Clutter.EventType.BUTTON_PRESS) {
            [this._startX, this._startY] = [x, y];
            this._mouseDown = true;
        } else if (this._mouseDown) {
            let rect = getRectangle(this._startX, this._startY, x, y);
            if (type === Clutter.EventType.MOTION) {
                this._capture.drawSelection(rect);
            } else if (type === Clutter.EventType.BUTTON_RELEASE) {
                this._capture._stop();

                this._capture._saveRect(rect.x, rect.y, rect.h, rect.w);
            }
        }
    }
});

Signals.addSignalMethods(SelectionArea.prototype);





const SelectionWindow = new Lang.Class({
    Name: "EasyScreenCast.SelectionWindow",

    _init: function () {
        Lib.TalkativeLog('ESC > window selection init');

        this._windows = global.get_window_actors();
        this._capture = new Capture();
        this._capture.connect('captured-event', this._onEvent.bind(this));
        this._capture.connect('stop', this.emit.bind(this, 'stop'));

        this._capture._showAlert(_('Select a window for recording or press [ESC] to abort'));
    },

    _onEvent: function (capture, event) {
        let type = event.type();
        let [x, y, mask] = global.get_pointer();

        this._selectedWindow = selectWindow(this._windows, x, y);

        if (this._selectedWindow) {
            this._highlightWindow(this._selectedWindow);
        } else {
            this._clearHighlight();
        }

        if (type === Clutter.EventType.BUTTON_PRESS) {
            if (this._selectedWindow) {
                this._capture._stop();

                var [w, h] = this._selectedWindow.get_size();
                var [wx, wy] = this._selectedWindow.get_position();

                this._capture._saveRect(wx, wy, h, w);
            }
        }
    },

    _highlightWindow: function (win) {
        this._capture.drawSelection(getWindowRectangle(win));
    },

    _clearHighlight: function () {
        this._capture.clearSelection();
    }
});

Signals.addSignalMethods(SelectionWindow.prototype);





const SelectionDesktop = new Lang.Class({
    Name: "EasyScreenCast.SelectionDesktop",

    _init: function () {
        Lib.TalkativeLog('ESC > desktop selection init');

        this._windows = global.get_window_actors();
        this._capture = new Capture();
        this._capture.connect('captured-event', this._onEvent.bind(this));
        this._capture.connect('stop', this.emit.bind(this, 'stop'));

        this._capture._showAlert(_('Select a desktop for recording or press [ESC] to abort'));
    },

    _onEvent: function (capture, event) {
        let type = event.type();

        if (type === Clutter.EventType.BUTTON_PRESS) {
            this._capture._stop();

            //let monitor = new Layout.LayoutManager().currentMonitor()

            var monitor = Main.layoutManager.focusMonitor;
            this._capture._saveRect(monitor.x, monitor.y, monitor.height, monitor.width);
        }
    }
});

Signals.addSignalMethods(SelectionDesktop.prototype);


const AreaRecording = new Lang.Class({
    Name: "EasyScreenCast.AreaRecording",

    _init: function () {
        Lib.TalkativeLog('ESC > area recording init');

        this._areaRecording = new Shell.GenericContainer({
            name: 'area-recording',
            style_class: 'area-recording',
            visible: 'true',
            reactive: 'true',
            x: -10,
            y: -10
        });

        Main.uiGroup.add_actor(this._areaRecording);

        this.drawArea(Pref.getOption('i', Pref.X_POS_SETTING_KEY) - 2,
            Pref.getOption('i', Pref.Y_POS_SETTING_KEY) - 2,
            Pref.getOption('i', Pref.WIDTH_SETTING_KEY) + 4,
            Pref.getOption('i', Pref.HEIGHT_SETTING_KEY) + 4);
    },

    drawArea: function (x, y, w, h) {
        Lib.TalkativeLog('ESC > draw area recording');

        this._visible = true;
        this._areaRecording.set_position(x, y);
        this._areaRecording.set_size(w, h);
    },

    clearArea: function () {
        Lib.TalkativeLog('ESC > hide area recording');

        this._visible = false;
        this.drawArea(-10, -10, 0, 0);
    },

    isVisible: function () {
        return this._visible;
    }
});


const getRectangle = function (x1, y1, x2, y2) {
    return {
        x: Math.min(x1, x2),
        y: Math.min(y1, y2),
        w: Math.abs(x1 - x2),
        h: Math.abs(y1 - y2)
    };
};


const getWindowRectangle = function (win) {
    let rect = win.get_meta_window().get_outer_rect();

    return {
        x: rect.x,
        y: rect.y,
        w: rect.width,
        h: rect.height
    };
};


const selectWindow = function (windows, x, y) {
    let filtered = windows.filter(function (win) {
        if ((win !== undefined) && win.visible && (typeof win.get_meta_window === 'function')) {

            let [w, h] = win.get_size();
            let [wx, wy] = win.get_position();

            return (
                (wx <= x) && (wy <= y) && ((wx + w) >= x) && ((wy + h) >= y)
            );
        } else {
            return false;
        }
    });

    filtered.sort(function (a, b)
        (a.get_meta_window().get_layer() <= b.get_meta_window().get_layer())
    );

    return filtered[0];
};