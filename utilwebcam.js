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
imports.gi.versions.Gst = "1.0";
const Gst = imports.gi.Gst;

const Gettext = imports.gettext.domain(
    "EasyScreenCast@iacopodeenosee.gmail.com"
);
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Lib = Me.imports.convenience;

let ListDevices = null;
let ListCaps = null;

var HelperWebcam = new Lang.Class({
    Name: "HelperWebcam",

    /**
     * Create a device monitor inputvideo
     */
    _init: function () {
        Lib.TalkativeLog("-@-init webcam");

        Gst.init(null);

        //get gstreamer lib version
        var [M, m, micro, nano] = Gst.version();
        Lib.TalkativeLog(
            "-@-gstreamer version: " + M + "." + m + "." + micro + "." + nano
        );
        if (M === 1 && m >= 8) {
            //gstreamer version equal or higher 1.8
            this.deviceMonitor = new Gst.DeviceMonitor({
                show_all: true,
            });
        } else {
            //gstreamer version lower 1.8
            this.deviceMonitor = new Gst.DeviceMonitor();
        }

        //get gstreamer plugin avaiable
        let registry = new Gst.Registry();
        let listPI = registry.get_plugin_list();
        Lib.TalkativeLog("-@-plugin list: " + listPI.length);
        for (var ind in listPI) {
            Lib.TalkativeLog(
                "-@-plugin name: " +
                    listPI[ind].get_name() +
                    " Pfilename: " +
                    listPI[ind].get_filename() +
                    " Pdesc:  " +
                    listPI[ind].get_description() +
                    " Pversion: " +
                    listPI[ind].get_version() +
                    " Pload: " +
                    listPI[ind].is_loaded()
            );
        }

        //create device monitor
        if (this.deviceMonitor !== null && this.deviceMonitor !== undefined) {
            Lib.TalkativeLog("-@-device monitor created");
            this.dmBus = this.deviceMonitor.get_bus();
            if (this.dmBus !== null && this.dmBus !== undefined) {
                Lib.TalkativeLog("-@-dbus created");
                this.dmBus.add_watch(GLib.PRIORITY_DEFAULT, this._getMsg);
                let caps = Gst.Caps.new_empty_simple("video/x-raw");
                this.deviceMonitor.add_filter("Video/Source", caps);
                this.startMonitor();
                //update device and caps
                this.refreshAllInputVideo();
            } else {
                Lib.TalkativeLog("-@-ERROR dbus creation");
            }
        } else {
            Lib.TalkativeLog("-@-ERROR device monitor creation");
        }
    },

    /**
     * connect to msg bus
     *
     * @return {string}
     */
    _getMsg: function (bus, message) {
        Lib.TalkativeLog("-@-event getmsg");
        switch (message.type) {
            case Gst.MessageType.DEVICE_ADDED:
                Lib.TalkativeLog("Device added");

                //update device and caps
                this.refreshAllInputVideo();
                break;
            case Gst.MessageType.DEVICE_REMOVED:
                Lib.TalkativeLog("Device removed");

                //update device and caps
                this.refreshAllInputVideo();
                break;
            default:
                Lib.TalkativeLog("Device UNK");
                break;
        }

        return GLib.SOURCE_CONTINUE;
    },

    /**
     * refresh all devices info
     */
    refreshAllInputVideo: function () {
        Lib.TalkativeLog("-@-refresh all video input");

        ListDevices = this.getDevicesIV();
        //compose devices array
        ListCaps = [];
        for (var index in ListDevices) {
            ListCaps[index] = this.getCapsForIV(ListDevices[index].caps);

            Lib.TalkativeLog(
                "-@-webcam /dev/video" +
                    index +
                    " name: " +
                    ListDevices[index].display_name
            );
            Lib.TalkativeLog("-@-caps avaiable N°: " + ListCaps[index].length);
            Lib.TalkativeLog(
                "-@-ListCaps[" + index + "]" + ": " + ListCaps[index]
            );
        }
    },

    /**
     * get caps from device
     */
    getCapsForIV: function (tmpCaps) {
        Lib.TalkativeLog("-@-get all caps from a input video");
        Lib.TalkativeLog("-@-caps avaiable N°: " + tmpCaps.get_size());

        var cleanCaps = [];
        for (var i = 0; i < tmpCaps.get_size(); i++) {
            //cleaned cap
            var tmpStr = tmpCaps
                .get_structure(i)
                .to_string()
                .replace(/;/gi, "");

            //fine cleaning of option CAPS remain
            cleanCaps[i] = this.cleanCapsOPT(tmpStr);

            Lib.TalkativeLog("-@-cap : " + i + " : " + cleanCaps[i]);
        }
        return cleanCaps;
    },

    /**
     * clean caps form options label
     *
     * @param {string} strCaps
     * @return {array}
     */
    cleanCapsOPT: function (strCaps) {
        Lib.TalkativeLog("-@-fine tunning caps:" + strCaps);

        if (strCaps.indexOf("{ ") >= 0) {
            //clean
            var firstOPT = strCaps.indexOf("{ ");
            var lastOPT = strCaps.indexOf(" }");
            var nextMedia = strCaps.indexOf(",", firstOPT);
            if (strCaps.indexOf(",", firstOPT) + 1 > lastOPT + 2) {
                nextMedia = lastOPT;
            }

            var strInitial = strCaps.substr(0, firstOPT);
            var strMedia = strCaps.substring(firstOPT + 2, nextMedia);
            var strPost = strCaps.substr(lastOPT + 2);

            var tmpStr = strInitial + strMedia + strPost;
            Lib.TalkativeLog("-@-cleaned caps:" + tmpStr);
            //recall
            return this.cleanCapsOPT(tmpStr);
        } else {
            return strCaps;
        }
    },

    /**
     * get devices IV
     *
     * @return {array}
     */
    getDevicesIV: function () {
        Lib.TalkativeLog("-@-get devices");

        var list = this.deviceMonitor.get_devices();
        Lib.TalkativeLog("-@-devices number: " + list.length);

        return list;
    },

    /**
     * get array name devices IV
     *
     * @return {array}
     */
    getNameDevices: function () {
        Lib.TalkativeLog("-@-get name devices");
        let tmpArray = [];

        for (var index in ListDevices) {
            var wcName = _("Unspecified webcam");

            if (ListDevices[index].display_name !== "") {
                wcName = ListDevices[index].display_name;
            }

            tmpArray.push(wcName);
        }

        Lib.TalkativeLog("-@-list devices name: " + tmpArray);
        return tmpArray;
    },

    /**
     * get array caps
     *
     * @param device
     * @return {array}
     */
    getListCapsDevice: function (device) {
        const tmpArray = ListCaps[device];
        Lib.TalkativeLog("-@-list caps of device: " + tmpArray);

        return tmpArray;
    },

    /**
     * start listening
     */
    startMonitor: function () {
        Lib.TalkativeLog("-@-start video devicemonitor");
        this.deviceMonitor.start();
    },

    /**
     * Stop listening
     */
    stopMonitor: function () {
        Lib.TalkativeLog("-@-stop video devicemonitor");
        this.disconnectSourceBus();
        this.deviceMonitor.stop();
    },

    /**
     * disconect bus
     */
    disconnectSourceBus: function () {
        if (this.dmBusId) {
            this.dmBus.disconnect(this.dmBusId);
            this.dmBusId = 0;
        }
    },
});
