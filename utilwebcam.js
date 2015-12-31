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

Gst.init(null);

const HelperWebcam = new Lang.Class({
    Name: "HelperWebcam",
    /*
     * Create a device monitor inputvideo
     */
    _init: function () {
        Lib.TalkativeLog('-@@@-init webcam');

        //this.deviceMonitor = Gst.DeviceMonitor.new(); COREDUMP ???
        this.deviceMonitor = new Gst.DeviceMonitor({
            show_all: true
        });

        if (this.deviceMonitor !== null && this.deviceMonitor !== undefined) {
            Lib.TalkativeLog('-@@@-device monitor created');
            this.dmBus = this.deviceMonitor.get_bus();
            if (this.dmBus !== null && this.dmBus !== undefined) {
                Lib.TalkativeLog('-@@@-dbus created');
                this.dmBus.add_watch(GLib.PRIORITY_DEFAULT, this._getMsg);
                let caps = Gst.Caps.new_empty_simple('video/x-raw');
                this.deviceMonitor.add_filter('Video/Source', caps);
                this.getAllInputVideo();
            } else {
                Lib.TalkativeLog('-@@@-ERROR dbus creation');
            }
        } else {
            Lib.TalkativeLog('-@@@-ERROR device monitor creation');
        }
    },
    /*
     * connect to msg bus
     */
    _getMsg: function (bus, message) {
        Lib.TalkativeLog('-@@@-event getmsg');
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
        Lib.TalkativeLog('-@@@-get all video input');

        var list = this.deviceMonitor.get_devices();
        Lib.TalkativeLog('device number: ' + list.length);

        for (var index in list) {
            Lib.TalkativeLog('device N°: ' + index + ' class: ' + list[index].device_class + ' name:  ' + list[index].display_name);
            this.getCapsForIV(list[index].caps);
            Lib.TalkativeLog('proprieties N°: ' + list[index].properties);
            for (var jndex in list[index].properties) {
                Lib.TalkativeLog('proprieties : ' + list[index].properties[jndex]);
            }
        }
    },
    /*
     * get caps from device
     */
    getCapsForIV: function (tmpCaps) {
        Lib.TalkativeLog('-@@@-get all caps from a input video');
        Lib.TalkativeLog('caps avaiable N°: ' + tmpCaps.get_size());

        for (var i = 0; i < tmpCaps.get_size(); i++) {
            //cleaned cap
            var cleanCap =
                tmpCaps.get_structure(i).to_string().replace(/\(.*?\)/gi, '');
            Lib.TalkativeLog('cap : ' + i + ' : ' + cleanCap);

        }
    },
    /*
     * start listening
     */
    startMonitor: function () {
        Lib.TalkativeLog('-@@@-start video devicemonitor');
        this.deviceMonitor.start();
    },
    /*
     * Stop listening
     */
    stopMonitor: function () {
        Lib.TalkativeLog('-@@@-stop video devicemonitor');
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
