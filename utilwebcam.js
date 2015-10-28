/* -*- mode: js; js-basic-offset: 4; indent-tabs-mode: nil -*- */

/*
    Copyright (C) 2015  Borsato Ivano

    The JavaScript code in this page is free software: you can
    redistribute it and/or modify it under the terms of the GNU
    General Public License (GNU GPL) as published by the Free Software
    Foundation, either version 3 of the License, or (at your option)
    any later version.  The code is distributed WITHOUT ANY WARRANTY;
    without even the implied warranty of MERCHANTABILITY or FITNESS
    FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.
*/

const Lang = imports.lang;
const Shell = imports.gi.Shell;
const Main = imports.ui.main;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Gst = imports.gi.Gst;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Lib = Me.imports.convenience;
const Pref = Me.imports.prefs;


const HelperWebcam = new Lang.Class({
    Name: "HelperWebcam",
    /*
     * Create a device monitor inputvideo
     */
    _init: function () {
        Lib.TalkativeLog('init webcam');
        this.deviceMonitor = Gst.DeviceMonitor.new();

        if (this.deviceMonitor !== null && this.deviceMonitor !== undefined) {
            Lib.TalkativeLog('device monitor created');
            this.dmBus = this.deviceMonitor.get_bus();
            if (this.dmBus !== null && this.dmBus !== undefined) {
                Lib.TalkativeLog('dbus created');
                dmBus.add_watch(GLib.PRIORITY_DEFAULT, this._getMsg);
                let caps = Gst.Caps.new_empty_simple('video/x-raw');
                this.deviceMonitor.add_filter('Video/Source', caps);
            } else {
                Lib.TalkativeLog('ERROR dbus creation');
            }
        } else {
            Lib.TalkativeLog('ERROR device monitor creation');
        }
    },
    /*
     * connect to msg bus
     */
    _getMsg: function (bus, message) {

        switch (message.type) {
        case Gst.MessageType.DEVICE_ADDED:
            Lib.TalkativeLog('Device added');
            this.getAllInputVideo();
            break;
        case Gst.MessageType.DEVICE_REMOVED:
            Lib.TalkativeLog('Device removed');

            break;
        default:
            Lib.TalkativeLog('Device UNK');
            break;
        }

        return GLib.SOURCE_CONTINUE;
    },
    /*
     * get all device
     */
    getAllInputVideo: function () {
        Lib.TalkativeLog('get all video input');

        var list = this.deviceMonitor.get_devices();
        Lib.TalkativeLog('list: ' + list);
    },
    /*
     * get caps from device
     */
    getCapsForIV: function () {
        Lib.TalkativeLog('get alla caps from a input video');

    },
    /*
     * start listening
     */
    startMonitor: function () {
        Lib.TalkativeLog('start video devicemonitor');
        this.deviceMonitor.start();
    },
    /*
     * Stop listening
     */
    stopMonitor: function () {
        Lib.TalkativeLog('stop video devicemonitor');
        this.disconnectSourceBus();
        this.deviceMonitor.stop();
    },
    /*
     * disconect bus
     */
    disconnectSourceBus: function () {
        if (this.dmBusId) {
            this.dmBus.disconnect(this.dmBusId);
            this.dmBusId = 0;
        }
    }
});
