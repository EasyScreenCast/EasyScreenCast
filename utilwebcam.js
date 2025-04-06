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

'use strict';

import GObject from 'gi://GObject';
import GLib from 'gi://GLib';
import Gst from 'gi://Gst?version=1.0';
import * as Lib from './convenience.js';

export const HelperWebcam = GObject.registerClass({
    GTypeName: 'EasyScreenCast_HelperWebcam',
}, class HelperWebcam extends GObject.Object {
    /**
     * Create a device monitor inputvideo
     *
     * @param {string} unspecifiedWebcamText localized text for "Unspecified Webcam"
     */
    constructor(unspecifiedWebcamText) {
        super();
        this._unspecified_webcam_text = unspecifiedWebcamText;
        Lib.TalkativeLog('-@-init webcam');

        var [result, _] = Gst.init_check(null);
        Lib.TalkativeLog(`-@-gstreamer init result: ${result}`);
        if (!result) {
            Lib.TalkativeLog('-@-gstreamer init failed');
            throw new Error('GStreamer init failed');
        }

        // get gstreamer lib version
        var [M, m, micro, nano] = Gst.version();
        Lib.TalkativeLog(
            `-@-gstreamer version: ${M}.${m}.${micro}.${nano}`
        );
        if (M === 1 && m >= 8) {
            // gstreamer version equal or higher 1.8
            this.deviceMonitor = new Gst.DeviceMonitor({
                show_all: true,
            });
        } else {
            // gstreamer version lower 1.8
            this.deviceMonitor = new Gst.DeviceMonitor();
        }

        // get gstreamer plugin avaiable
        let registry = new Gst.Registry();
        let listPI = registry.get_plugin_list();
        Lib.TalkativeLog(`-@-plugin list: ${listPI.length}`);
        for (var ind in listPI) {
            Lib.TalkativeLog(
                `-@-plugin name: ${
                    listPI[ind].get_name()
                } Pfilename: ${
                    listPI[ind].get_filename()
                } Pdesc:  ${
                    listPI[ind].get_description()
                } Pversion: ${
                    listPI[ind].get_version()
                } Pload: ${
                    listPI[ind].is_loaded()}`
            );
        }

        // create device monitor
        if (this.deviceMonitor !== null && this.deviceMonitor !== undefined) {
            Lib.TalkativeLog('-@-device monitor created');
            this.dmBus = this.deviceMonitor.get_bus();
            if (this.dmBus !== null && this.dmBus !== undefined) {
                Lib.TalkativeLog('-@-dbus created');
                this.dmBus.add_watch(GLib.PRIORITY_DEFAULT, this._getMsg.bind(this));
                let caps = Gst.Caps.new_empty_simple('video/x-raw');
                this.deviceMonitor.add_filter('Video/Source', caps);
                this.startMonitor();
                // update device and caps
                this.refreshAllInputVideo();
            } else {
                Lib.TalkativeLog('-@-ERROR dbus creation');
            }
        } else {
            Lib.TalkativeLog('-@-ERROR device monitor creation');
        }
    }

    /**
     * Callback for the DeviceMonitor watcher
     *
     * @param {Gst.Bus} bus the DeviceMonitor Bus of gstreamer
     * @param {Gst.Message} message the message
     * @returns {boolean}
     */
    _getMsg(bus, message) {
        Lib.TalkativeLog('-@-event getmsg');
        switch (message.type) {
        case Gst.MessageType.DEVICE_ADDED:
            Lib.TalkativeLog('Device added');

            // update device and caps
            this.refreshAllInputVideo();
            break;
        case Gst.MessageType.DEVICE_REMOVED:
            Lib.TalkativeLog('Device removed');

            // update device and caps
            this.refreshAllInputVideo();
            break;
        default:
            Lib.TalkativeLog('Device UNK');
            break;
        }

        return GLib.SOURCE_CONTINUE;
    }

    /**
     * refresh all devices info
     */
    refreshAllInputVideo() {
        Lib.TalkativeLog('-@-refresh all video input');

        this._listDevices = this.getDevicesIV();
        // compose devices array
        this._listCaps = [];
        for (var index in this._listDevices) {
            this._listCaps[index] = this.getCapsForIV(this._listDevices[index].caps);

            Lib.TalkativeLog(`-@-webcam /dev/video${index} name: ${this._listDevices[index].display_name}`);
            Lib.TalkativeLog(`-@-caps available: ${this._listCaps[index].length}`);
            Lib.TalkativeLog(`-@-ListCaps[${index}]: ${this._listCaps[index]}`);
        }
    }

    /**
     * get caps from device.
     * A single capability might look like: <code>video/x-raw, format=(string)YUY2, width=(int)640, height=(int)480, pixel-aspect-ratio=(fraction)1/1, framerate=(fraction)30/1</code>
     * This encodes a single capability (fixed), but there might also be capabilities which represent options, e.g.
     * <code>video/x-raw, format=(string)YUY2, width=(int)640, height=(int)480, pixel-aspect-ratio=(fraction)1/1, framerate=(fraction) { 30/1, 25/1, 20/1 }</code>.
     * <br>
     * The code here will take always the first option and unroll the options for framerate.
     *
     * @param {Gst.Caps} tmpCaps capabilities of a device
     * @returns {string[]}
     */
    getCapsForIV(tmpCaps) {
        Lib.TalkativeLog('-@-get all caps from a input video');
        Lib.TalkativeLog(`-@-caps available before filtering for video/x-raw: ${tmpCaps.get_size()}`);

        let cleanCaps = [];
        for (let i = 0; i < tmpCaps.get_size(); i++) {
            let capsStructure = tmpCaps.get_structure(i);

            // only consider "video/x-raw"
            if (capsStructure.get_name() === 'video/x-raw') {
                Lib.TalkativeLog(`-@-cap : ${i} : original : ${capsStructure.to_string()}`);

                let tmpStr = 'video/x-raw';
                let result, number, fraction;
                result = capsStructure.get_string('format');
                if (result !== null)
                    tmpStr += `, format=(string)${result}`;
                [result, number] = capsStructure.get_int('width');
                if (result === true)
                    tmpStr += `, width=(int)${number}`;
                [result, number] = capsStructure.get_int('height');
                if (result === true)
                    tmpStr += `, height=(int)${number}`;
                [result, number, fraction] = capsStructure.get_fraction('pixel-aspect-ratio');
                if (result === true)
                    tmpStr += `, pixel-aspect-ratio=(fraction)${number}/${fraction}`;


                if (capsStructure.has_field('framerate')) {
                    [result, number, fraction] = capsStructure.get_fraction('framerate');
                    if (result === true) {
                        // a single framerate
                        this._addAndLogCapability(cleanCaps, i, `${tmpStr}, framerate=(fraction)${number}/${fraction}`);
                    } else {
                        // multiple framerates

                        // unfortunately GstValueList is not supported in this gjs-binding
                        // "Error: Don't know how to convert GType GstValueList to JavaScript object"
                        // -> capsStructure.get_value('framerate') <- won't work
                        // -> capsStructure.get_list('framerate') <- only returns the numerator of the fraction
                        //
                        // therefore manually parsing the framerate values from the string representation
                        let framerates = capsStructure.to_string();
                        framerates = framerates.substring(framerates.indexOf('framerate=(fraction){') + 21);
                        framerates = framerates.substring(0, framerates.indexOf('}'));
                        framerates.split(',').forEach(element => {
                            let [numerator, denominator] = element.split('/', 2);
                            this._addAndLogCapability(cleanCaps, i, `${tmpStr}, framerate=(fraction)${numerator.trim()}/${denominator.trim()}`);
                        });
                    }
                } else {
                    // no framerate at all
                    this._addAndLogCapability(cleanCaps, i, tmpStr);
                }
            } else {
                Lib.TalkativeLog(`-@-cap : ${i} : skipped : ${capsStructure.to_string()}`);
            }
        }
        return cleanCaps;
    }

    /**
     * Adds the capability str to the array caps, if it is not already there. Avoids duplicates.
     *
     * @param {Array} caps the list of capabilities
     * @param {int} originalIndex index of the original capabilities list from the device
     * @param {string} str the capability string to add
     */
    _addAndLogCapability(caps, originalIndex, str) {
        if (caps.indexOf(str) === -1) {
            caps.push(str);
            Lib.TalkativeLog(`-@-cap : ${originalIndex} : added cap : ${str}`);
        } else {
            Lib.TalkativeLog(`-@-cap : ${originalIndex} : ignore duplicated cap : ${str}`);
        }
    }

    /**
     * get devices IV
     *
     * @returns {Gst.Device[]}
     */
    getDevicesIV() {
        Lib.TalkativeLog('-@-get devices');

        var list = this.deviceMonitor.get_devices();
        Lib.TalkativeLog(`-@-devices number: ${list.length}`);

        // Note:
        // Although the computer may have just one webcam connected to
        // it, more than one GstDevice may be listed and all pointing to
        // the same video device (for example /dev/video0. Each
        // GstDevice is supposed to be used with a specific source, for
        // example, a pipewiresrc or a v4l2src. For now, we are only
        // using v4l2src.
        // See also: Gst.DeviceMonitor.get_providers: pipewiredeviceprovider,decklinkdeviceprovider,v4l2deviceprovider
        // CLI: "/usr/bin/gst-device-monitor-1.0 Video/Source"
        //
        // So, here we filter the devices, that have a device.path property, which
        // means, these are only v4l2 devices

        var filtered = list.filter(device => {
            let props = device.get_properties();
            let hasDevice = props != null && props.get_string('device.path') !== null;
            if (props != null)
                props.free();
            return hasDevice;
        });
        Lib.TalkativeLog(`-@-devices number after filtering for v4l2: ${filtered.length}`);

        return filtered;
    }

    /**
     * get array name devices IV
     *
     * @returns {Array}
     */
    getNameDevices() {
        Lib.TalkativeLog('-@-get name devices');
        let tmpArray = [];

        for (var index in this._listDevices) {
            var wcName = this._unspecified_webcam_text;

            if (this._listDevices[index].display_name !== '')
                wcName = this._listDevices[index].display_name;

            tmpArray.push(wcName);
        }

        Lib.TalkativeLog(`-@-list devices name: ${tmpArray}`);
        return tmpArray;
    }

    /**
     * get array caps
     *
     * @param {int} index device
     * @returns {string[]}
     */
    getListCapsDevice(index) {
        const tmpArray = this._listCaps[index];
        Lib.TalkativeLog(`-@-list caps of device: ${tmpArray}`);
        return tmpArray;
    }

    /**
     * start listening
     */
    startMonitor() {
        Lib.TalkativeLog('-@-start video devicemonitor');
        this.deviceMonitor.start();
    }

    /**
     * Stop listening
     */
    stopMonitor() {
        Lib.TalkativeLog('-@-stop video devicemonitor');
        this.disconnectSourceBus();
        this.deviceMonitor.stop();
    }

    /**
     * disconect bus
     */
    disconnectSourceBus() {
        if (this.dmBusId) {
            this.dmBus.disconnect(this.dmBusId);
            this.dmBusId = 0;
        }
    }
});
