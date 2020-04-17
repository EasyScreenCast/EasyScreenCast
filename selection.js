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
const St = imports.gi.St;
const Layout = imports.ui.layout;

const Main = imports.ui.main;

const Gettext = imports.gettext.domain(
    "EasyScreenCast@iacopodeenosee.gmail.com"
);
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Lib = Me.imports.convenience;
const Settings = Me.imports.settings;
const Ext = Me.imports.extension;
const UtilNotify = Me.imports.utilnotify;
const display_api = Me.imports.display_module.display_api;

/**
 * @type {Lang.Class}
 */
const Capture = new Lang.Class({
    Name: "EasyScreenCast.Capture",

    /**
     * @private
     */
    _init: function () {
        Lib.TalkativeLog("-£-capture selection init");

        this._mouseDown = false;

        this.monitor = Main.layoutManager.focusMonitor;

        this._areaSelection = new St.Widget({
            name: "area-selection",
            style_class: "area-selection",
            visible: "true",
            reactive: "true",
            x: -10,
            y: -10,
        });

        Main.uiGroup.add_actor(this._areaSelection);

        this._areaResolution = new St.Label({
            style_class: "area-resolution",
            text: "",
        });
        this._areaResolution.opacity = 255;
        this._areaResolution.set_position(0, 0);

        Main.uiGroup.add_actor(this._areaResolution);

        if (Main.pushModal(this._areaSelection)) {
            this._signalCapturedEvent = global.stage.connect(
                "captured-event",
                this._onCaptureEvent.bind(this)
            );

            this._setCaptureCursor();
        } else {
            Lib.TalkativeLog("-£-Main.pushModal() === false");
        }

        Main.sessionMode.connect("updated", () => this._updateDraw());
    },

    /**
     * @private
     */
    _updateDraw: function () {
        Lib.TalkativeLog("-£-update draw capture");
    },

    /**
     * @private
     */
    _setDefaultCursor: function () {
        display_api.set_cursor(Meta.Cursor.DEFAULT);
    },

    /**
     * @private
     */
    _setCaptureCursor: function () {
        display_api.set_cursor(Meta.Cursor.CROSSHAIR);
    },

    /**
     * @param actor
     * @param event
     * @private
     */
    _onCaptureEvent: function (actor, event) {
        if (event.type() === Clutter.EventType.KEY_PRESS) {
            if (event.get_key_symbol() === Clutter.Escape) {
                this._stop();
            }
        }

        this.emit("captured-event", event);
    },

    /**
     * @param {Number} x
     * @param {Number} y
     * @param {Number} w
     * @param {Number} h
     * @param {boolean} showResolution
     */
    drawSelection: function ({ x, y, w, h }, showResolution) {
        this._areaSelection.set_position(x, y);
        this._areaSelection.set_size(w, h);

        if (showResolution && w > 100 && h > 50) {
            this._areaResolution.set_text(w + " X " + h);
            this._areaResolution.set_position(
                x + (w / 2 - this._areaResolution.width / 2),
                y + (h / 2 - this._areaResolution.height / 2)
            );
        } else {
            this._areaResolution.set_position(0, 0);
            this._areaResolution.set_text("");
        }
    },

    /**
     * Clear drawing selection
     */
    clearSelection: function () {
        this.drawSelection(
            {
                x: -10,
                y: -10,
                w: 0,
                h: 0,
            },
            false
        );
    },

    /**
     * @private
     */
    _stop: function () {
        Lib.TalkativeLog("-£-capture selection stop");

        global.stage.disconnect(this._signalCapturedEvent);
        this._setDefaultCursor();
        Main.uiGroup.remove_actor(this._areaSelection);
        Main.popModal(this._areaSelection);
        Main.uiGroup.remove_actor(this._areaResolution);
        this._areaSelection.destroy();
        this.emit("stop");
        this.disconnectAll();
    },

    _saveRect: function (x, y, h, w) {
        Lib.TalkativeLog(
            "-£-selection x:" + x + " y:" + y + " height:" + h + " width:" + w
        );

        Settings.setOption(Settings.X_POS_SETTING_KEY, x);
        Settings.setOption(Settings.Y_POS_SETTING_KEY, y);
        Settings.setOption(Settings.HEIGHT_SETTING_KEY, h);
        Settings.setOption(Settings.WIDTH_SETTING_KEY, w);

        Ext.Indicator._doDelayAction();
    },
});

Signals.addSignalMethods(Capture.prototype);

const SelectionArea = new Lang.Class({
    Name: "EasyScreenCast.SelectionArea",

    /**
     * @private
     */
    _init: function () {
        Lib.TalkativeLog("-£-area selection init");

        this._mouseDown = false;
        this._capture = new Capture();
        this._capture.connect("captured-event", this._onEvent.bind(this));
        this._capture.connect("stop", this.emit.bind(this, "stop"));

        let CtrlNotify = new UtilNotify.NotifyManager();
        CtrlNotify.createAlert(
            _("Select an area for recording or press [ESC] to abort")
        );
    },

    /**
     * @param capture
     * @param event
     * @private
     */
    _onEvent: function (capture, event) {
        let type = event.type();
        let [x, y, mask] = global.get_pointer();

        if (type === Clutter.EventType.BUTTON_PRESS) {
            [this._startX, this._startY] = [x, y];
            this._mouseDown = true;
        } else if (this._mouseDown) {
            let rect = getRectangle(this._startX, this._startY, x, y);
            if (type === Clutter.EventType.MOTION) {
                this._capture.drawSelection(rect, true);
            } else if (type === Clutter.EventType.BUTTON_RELEASE) {
                this._capture._stop();

                Lib.TalkativeLog(
                    "-£-area x: " +
                        rect.x +
                        " y: " +
                        rect.y +
                        " height: " +
                        rect.h +
                        "width: " +
                        rect.w
                );

                this._capture._saveRect(rect.x, rect.y, rect.h, rect.w);
            }
        }
    },
});

Signals.addSignalMethods(SelectionArea.prototype);

const SelectionWindow = new Lang.Class({
    Name: "EasyScreenCast.SelectionWindow",

    /**
     * @private
     */
    _init: function () {
        Lib.TalkativeLog("-£-window selection init");

        this._windows = global.get_window_actors();
        this._capture = new Capture();
        this._capture.connect("captured-event", this._onEvent.bind(this));
        this._capture.connect("stop", this.emit.bind(this, "stop"));

        let CtrlNotify = new UtilNotify.NotifyManager();
        CtrlNotify.createAlert(
            _("Select a window for recording or press [ESC] to abort")
        );
    },

    /**
     * @param capture
     * @param event
     * @private
     */
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

                var max_height = global.screen_height;
                var max_width = global.screen_width;
                Lib.TalkativeLog(
                    "-£-global screen area H: " +
                        max_height +
                        " W: " +
                        max_width
                );

                var [w, h] = this._selectedWindow.get_size();
                var [wx, wy] = this._selectedWindow.get_position();

                Lib.TalkativeLog(
                    "-£-windows pre wx: " +
                        wx +
                        " wy: " +
                        wy +
                        " height: " +
                        h +
                        "  width: " +
                        w
                );

                if (wx < 0) {
                    wx = 0;
                }

                if (wy < 0) {
                    wy = 0;
                }

                if (wx + w > max_width) {
                    w = max_width - wx;
                }

                if (wy + h > max_height) {
                    h = max_height - wy;
                }

                Lib.TalkativeLog(
                    "-£-windows post wx: " +
                        wx +
                        " wy: " +
                        wy +
                        " height: " +
                        h +
                        " width: " +
                        w
                );

                this._capture._saveRect(wx, wy, h, w);
            }
        }
    },

    /**
     * @param win
     * @private
     */
    _highlightWindow: function (win) {
        let rect = getWindowRectangle(win);
        Lib.TalkativeLog(
            "-£-window highlight on, pos/meas: x:" +
                rect.x +
                " y:" +
                rect.y +
                " w:" +
                rect.w +
                " h:" +
                rect.h
        );
        this._capture.drawSelection(rect, false);
    },

    /**
     * @private
     */
    _clearHighlight: function () {
        Lib.TalkativeLog("-£-window highlight off");
        this._capture.clearSelection();
    },
});

Signals.addSignalMethods(SelectionWindow.prototype);

var SelectionDesktop = new Lang.Class({
    Name: "EasyScreenCast.SelectionDesktop",

    /**
     * @private
     */
    _init: function () {
        Lib.TalkativeLog("-£-desktop selection init");
        const number_displays = display_api.number_displays();
        Lib.TalkativeLog("-£-Number of monitor " + number_displays);

        for (var i = 0; i < number_displays; i++) {
            var tmpM = new Layout.Monitor(
                i,
                display_api.display_geometry_for_index(i)
            );
            Lib.TalkativeLog(
                "-£-monitor geometry x=" +
                    tmpM.x +
                    " y=" +
                    tmpM.y +
                    " w=" +
                    tmpM.width +
                    " h=" +
                    tmpM.height
            );
        }

        this._capture = new Capture();
        this._capture.connect("captured-event", this._onEvent.bind(this));
        this._capture.connect("stop", this.emit.bind(this, "stop"));

        let CtrlNotify = new UtilNotify.NotifyManager();
        CtrlNotify.createAlert(
            _("Select a desktop for recording or press [ESC] to abort")
        );
    },

    /**
     * @param capture
     * @param event
     * @private
     */
    _onEvent: function (capture, event) {
        let type = event.type();

        if (type === Clutter.EventType.BUTTON_PRESS) {
            this._capture._stop();

            let tmpM = Main.layoutManager.currentMonitor;

            var x = tmpM.x;
            var y = tmpM.y;
            var height = tmpM.height;
            var width = tmpM.width;
            Lib.TalkativeLog(
                "-£-desktop x: " +
                    x +
                    " y: " +
                    y +
                    " height: " +
                    height +
                    "width: " +
                    width
            );

            this._capture._saveRect(x, y, height, width);
        }
    },
});

Signals.addSignalMethods(SelectionDesktop.prototype);

const AreaRecording = new Lang.Class({
    Name: "EasyScreenCast.AreaRecording",

    /**
     * @private
     */
    _init: function () {
        Lib.TalkativeLog("-£-area recording init");

        this._areaRecording = new St.Widget({
            name: "area-recording",
            style_class: "area-recording",
            visible: "true",
            reactive: "false",
            x: -10,
            y: -10,
        });

        var recX = Settings.getOption("i", Settings.X_POS_SETTING_KEY);
        var recY = Settings.getOption("i", Settings.Y_POS_SETTING_KEY);
        var recW = Settings.getOption("i", Settings.WIDTH_SETTING_KEY);
        var recH = Settings.getOption("i", Settings.HEIGHT_SETTING_KEY);

        var tmpH = Main.layoutManager.currentMonitor.height;
        var tmpW = Main.layoutManager.currentMonitor.width;

        Main.uiGroup.add_actor(this._areaRecording);

        Main.overview.connect("showing", () => {
            Lib.TalkativeLog("-£-overview opening");

            Main.uiGroup.remove_actor(this._areaRecording);
        });

        Main.overview.connect("hidden", () => {
            Lib.TalkativeLog("-£-overview closed");

            Main.uiGroup.add_actor(this._areaRecording);
        });

        if (recX + recW <= tmpW - 5 && recY + recH <= tmpH - 5) {
            this.drawArea(recX - 2, recY - 2, recW + 4, recH + 4);
        }
    },

    /**
     * @param {Number} x
     * @param {Number} y
     * @param {Number} w
     * @param {Number} h
     */
    drawArea: function (x, y, w, h) {
        Lib.TalkativeLog("-£-draw area recording");

        this._visible = true;
        this._areaRecording.set_position(x, y);
        this._areaRecording.set_size(w, h);
    },

    /**
     * Clears the drawing area
     */
    clearArea: function () {
        Lib.TalkativeLog("-£-hide area recording");

        this._visible = false;
        this.drawArea(-10, -10, 0, 0);
    },

    /**
     * @return {boolean}
     */
    isVisible: function () {
        return this._visible;
    },
});

Signals.addSignalMethods(AreaRecording.prototype);

/**
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 * @return {{x: number, y: number, w: number, h: number}}
 */
const getRectangle = function (x1, y1, x2, y2) {
    return {
        x: Math.min(x1, x2),
        y: Math.min(y1, y2),
        w: Math.abs(x1 - x2),
        h: Math.abs(y1 - y2),
    };
};

/**
 * @param win
 * @return {{x: *, y: *, w: *, h: *}}
 */
const getWindowRectangle = function (win) {
    let [tw, th] = win.get_size();
    let [tx, ty] = win.get_position();

    return {
        x: tx,
        y: ty,
        w: tw,
        h: th,
    };
};

/**
 * @param windows
 * @param {number} x
 * @param {number} y
 * @return {*}
 */
const selectWindow = function (windows, x, y) {
    let filtered = windows.filter(function (win) {
        if (
            win !== undefined &&
            win.visible &&
            typeof win.get_meta_window === "function"
        ) {
            Lib.TalkativeLog("-£-selectWin x:" + x + " y:" + y);

            let [w, h] = win.get_size();
            let [wx, wy] = win.get_position();
            Lib.TalkativeLog(
                "-£-selectWin w:" + w + " h:" + h + "wx:" + wx + " wy:" + wy
            );

            return wx <= x && wy <= y && wx + w >= x && wy + h >= y;
        } else {
            return false;
        }
    });

    filtered.sort(function (a, b) {
        return (
            a.get_meta_window().get_layer() <= b.get_meta_window().get_layer()
        );
    });

    return filtered[0];
};
