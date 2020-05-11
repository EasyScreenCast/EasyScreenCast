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
const GLib = imports.gi.GLib;
const Gst = imports.gi.Gst;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Lib = Me.imports.convenience;
const Pref = Me.imports.prefs;

Gst.init(null);

let ListDevices = null;
let ListCaps = null;

const HelperWebcam = new Lang.Class({
    Name: "HelperWebcam",
    /*
     * Create a device monitor inputvideo
     */
    _init: function() {
        Lib.TalkativeLog('-@-init webcam');

        this.deviceMonitor = new Gst.DeviceMonitor({
            show_all: true
        });

        if (this.deviceMonitor !== null && this.deviceMonitor !== undefined) {
            Lib.TalkativeLog('-@-device monitor created');
            this.dmBus = this.deviceMonitor.get_bus();
            if (this.dmBus !== null && this.dmBus !== undefined) {
                Lib.TalkativeLog('-@-dbus created');
                this.dmBus.add_watch(GLib.PRIORITY_DEFAULT, this._getMsg);
                let caps = Gst.Caps.new_empty_simple('video/x-raw', null);
                this.deviceMonitor.add_filter('Video/Source', caps);

                //update device and caps
                this.refreshAllInputVideo();
            } else {
                Lib.TalkativeLog('-@-ERROR dbus creation');
            }
        } else {
            Lib.TalkativeLog('-@-ERROR device monitor creation');
        }
    },
    /*
     * connect to msg bus
     */
    _getMsg: function(bus, message) {
        Lib.TalkativeLog('-@-event getmsg');
        switch (message.type) {
            case Gst.MessageType.DEVICE_ADDED:
                Lib.TalkativeLog('Device added');

                //update device and caps
                this.refreshAllInputVideo();
                break;
            case Gst.MessageType.DEVICE_REMOVED:
                Lib.TalkativeLog('Device removed');

                //update device and caps
                this.refreshAllInputVideo();
                break;
            default:
                Lib.TalkativeLog('Device UNK');
                break;
        }

        return GLib.SOURCE_CONTINUE;
    },
    /*
     * refresh all devices info
     */
    refreshAllInputVideo: function() {
        Lib.TalkativeLog('-@-refresh all video input');

        ListDevices = this.getDevicesIV();

        //compose devices array
        ListCaps = new Array();
        for (var index in ListDevices) {
            ListCaps[index] =
                this.getCapsForIV(ListDevices[index].caps);

            Lib.TalkativeLog('-@-webcam /dev/video' + index + ' name: ' + ListDevices[index].display_name);
            Lib.TalkativeLog('-@-caps avaiable N°: ' + ListCaps[index].length);
            Lib.TalkativeLog('-@-ListCaps[' + index + ']' + ': ' + ListCaps[index]);
        }
    },
    /*
     * get caps from device
     */
    getCapsForIV: function(tmpCaps) {
        Lib.TalkativeLog('-@-get all caps from a input video');
        Lib.TalkativeLog('-@-caps avaiable N°: ' + tmpCaps.get_size());

        var cleanCaps = new Array();
        for (var i = 0; i < tmpCaps.get_size(); i++) {
            //cleaned cap
            cleanCaps[i] = tmpCaps.get_structure(i).to_string()
                .replace(/\(.*?\)|;/gi, '');

            Lib.TalkativeLog('-@-cap : ' + i + ' : ' + cleanCaps[i]);
        }
        return cleanCaps;
    },
    /*
     * get devices IV
     */
    getDevicesIV: function() {
        Lib.TalkativeLog('-@-get devices');

        var list = this.deviceMonitor.get_devices();
        Lib.TalkativeLog('-@-devices number: ' + list.length);

        return list;
    },
    /*
     * get array name devices IV
     */
    getNameDevices: function() {
        Lib.TalkativeLog('-@-get name devices');

        var tmpArray = new Array();
        for (var index in ListDevices) {
            tmpArray.push(ListDevices[index].display_name);
        }

        Lib.TalkativeLog('-@-list devices name: ' + tmpArray);
        return tmpArray;
    },
    /*
     * get array caps
     */
    getListCapsDevice: function(device) {
        var tmpArray = new Array();
        tmpArray = ListCaps[device];
        Lib.TalkativeLog('-@-list caps of device: ' + tmpArray);

        return tmpArray;
    },
    /*
     * start listening
     */
    startMonitor: function() {
        Lib.TalkativeLog('-@-start video devicemonitor');
        this.deviceMonitor.start();
    },
    /*
     * Stop listening
     */
    stopMonitor: function() {
        Lib.TalkativeLog('-@-stop video devicemonitor');
        this.disconnectSourceBus();
        this.deviceMonitor.stop();
    },
    /*
     * disconect bus
     */
    disconnectSourceBus: function() {
        if (this.dmBusId) {
            this.dmBus.disconnect(this.dmBusId);
            this.dmBusId = 0;
        }
    }
});