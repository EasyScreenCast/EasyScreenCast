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

const GIRepository = imports.gi.GIRepository;
GIRepository.Repository.prepend_search_path("/usr/lib/gnome-shell");
GIRepository.Repository.prepend_library_path("/usr/lib/gnome-shell");
GIRepository.Repository.prepend_search_path("/usr/lib64/gnome-shell");
GIRepository.Repository.prepend_library_path("/usr/lib64/gnome-shell");
const Gvc = imports.gi.Gvc;
const Lang = imports.lang;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Lib = Me.imports.convenience;
const Settings = Me.imports.settings;

let MixerControl = null;
let isConnected = false;

/**
 * @type {MixerAudio}
 */
var MixerAudio = new Lang.Class({
    Name: "MixerAudio",

    /**
     * Init Lang class
     *
     * @private
     */
    _init: function () {
        Lib.TalkativeLog("-#-mixer _init");

        MixerControl = this._getMixerControl();

        if (MixerControl) {
            isConnected = true;
            MixerControl.connect("state-changed", () =>
                this._onChangeStatePAC()
            );

            //more log for debug
            if (Settings.getOption("b", Settings.VERBOSE_DEBUG_SETTING_KEY)) {
                MixerControl.connect("stream_added", (control, id) => {
                    this._onStreamAdd(control, id);
                });
                MixerControl.connect("stream_removed", (control, id) => {
                    this._onStreamRemove(control, id);
                });
            }
        } else {
            Lib.TalkativeLog("-#-Error lib pulse NOT present or NOT respond");
        }
    },

    /**
     * @return {*}
     * @private
     */
    _getMixerControl: function () {
        var _mixerTmp;

        if (MixerControl) {
            Lib.TalkativeLog(
                "-#-mixer exist -> " +
                    MixerControl +
                    " state -> " +
                    MixerControl.get_state()
            );

            return MixerControl;
        } else {
            Lib.TalkativeLog("-#-mixer create");

            _mixerTmp = new Gvc.MixerControl({
                name: "ESC Mixer Control",
            });
            _mixerTmp.open();

            return _mixerTmp;
        }
    },

    _onChangeStatePAC: function () {
        Lib.TalkativeLog("-#-mixer state changed");

        switch (MixerControl.get_state()) {
            case Gvc.MixerControlState.CLOSED:
                Lib.TalkativeLog("-#-Mixer close");
                isConnected = false;
                break;
            case Gvc.MixerControlState.CONNECTING:
                Lib.TalkativeLog("-#-Mixer connecting");
                isConnected = false;
                break;
            case Gvc.MixerControlState.FAILED:
                Lib.TalkativeLog("-#-Mixer failed");
                isConnected = false;
                break;
            case Gvc.MixerControlState.READY:
                Lib.TalkativeLog("-#-Mixer ready");
                isConnected = true;

                //more log for debug
                if (
                    Settings.getOption("b", Settings.VERBOSE_DEBUG_SETTING_KEY)
                ) {
                    this._getInfoPA();
                }

                break;
            default:
                Lib.TalkativeLog("-#-Mixer UNK");
                isConnected = false;
                break;
        }
    },

    /**
     * Gets a list of input audio sources.
     *
     * @returns {array}
     */
    getListInputAudio: function () {
        Lib.TalkativeLog("-#-get list input audio");

        if (isConnected) {
            var arrayTmp = [];

            var tmpSinks = MixerControl.get_sinks();
            Lib.TalkativeLog("-#-Mixer sink -> " + tmpSinks.length);
            for (let x in tmpSinks) {
                Lib.TalkativeLog("-#-sink index: " + tmpSinks[x].index);
                Lib.TalkativeLog("-#-sink name: " + tmpSinks[x].name);
                Lib.TalkativeLog(
                    "-#-sink description: " + tmpSinks[x].description
                );
                Lib.TalkativeLog("-#-sink port: " + tmpSinks[x].port);

                arrayTmp.push({
                    desc: tmpSinks[x].description,
                    name: tmpSinks[x].name,
                    port: tmpSinks[x].port,
                    sortable: true,
                    resizeable: true,
                });
            }

            var tmpSources = MixerControl.get_sources();
            Lib.TalkativeLog("-#-Mixer sources -> " + tmpSources.length);
            for (let x in tmpSources) {
                Lib.TalkativeLog("-#-source index: " + tmpSources[x].index);
                Lib.TalkativeLog("-#-source name: " + tmpSources[x].name);
                Lib.TalkativeLog(
                    "-#-source description: " + tmpSources[x].description
                );
                Lib.TalkativeLog("-#-source port: " + tmpSources[x].port);

                arrayTmp.push({
                    desc: tmpSources[x].description,
                    name: tmpSources[x].name,
                    port: tmpSources[x].port,
                    sortable: true,
                    resizeable: true,
                });
            }

            Lib.TalkativeLog("-#-MIXER SOURCE TOT -> " + arrayTmp.length);

            return arrayTmp;
        } else {
            Lib.TalkativeLog("-#-Error lib pulse NOT present or NOT respond");
        }

        return [];
    },

    /**
     * @return {string}
     */
    getAudioSource: function () {
        Lib.TalkativeLog("-#-get source audio choosen");

        var arrtmp = this.getListInputAudio();
        var index =
            Settings.getOption("i", Settings.INPUT_AUDIO_SOURCE_SETTING_KEY) -
            2;

        if (index >= 0 && index < arrtmp.length) {
            return arrtmp[index].name;
        } else {
            Lib.TalkativeLog("-#-ERROR, audio source missing");
            Settings.setOption(Settings.INPUT_AUDIO_SOURCE_SETTING_KEY, 0);

            return "";
        }
    },

    /**
     * @param control
     * @param id
     * @private
     */
    _onStreamAdd: function (control, id) {
        Lib.TalkativeLog("-#-mixer stream add - ID: " + id);
        var streamTmp = control.lookup_stream_id(id);

        if (
            streamTmp.name === "GNOME Shell" &&
            streamTmp.description === "Record Stream"
        ) {
            Lib.TalkativeLog("-#-stream gnome recorder captured");

            Lib.TalkativeLog("-#-stream index: " + streamTmp.index);
            Lib.TalkativeLog("-#-stream card index: " + streamTmp.card_index);
            Lib.TalkativeLog("-#-application_ID: " + streamTmp.application_id);
            Lib.TalkativeLog("-#-stream name: " + streamTmp.name);
            Lib.TalkativeLog("-#-stream icon: " + streamTmp.icon_name);
            Lib.TalkativeLog("-#-stream description: " + streamTmp.description);
            Lib.TalkativeLog("-#-stream port: " + streamTmp.port);
        }
    },

    /**
     * @param control
     * @param id
     * @private
     */
    _onStreamRemove: function (control, id) {
        Lib.TalkativeLog("-#-mixer stream remove - ID: " + id);
        var streamTmp = control.lookup_stream_id(id);
    },

    /**
     * @private
     */
    _getInfoPA: function () {
        var tmp = MixerControl.get_cards();
        Lib.TalkativeLog("#-# mixer cards -> " + tmp.length);
        for (let x in tmp) {
            Lib.TalkativeLog("-#-card index: " + tmp[x].index);
            Lib.TalkativeLog("-#-card name: " + tmp[x].name);
            Lib.TalkativeLog("-#-card icon: " + tmp[x].icon_name);
            Lib.TalkativeLog("-#-card profile: " + tmp[x].profile);
            Lib.TalkativeLog("-#-card human profile: " + tmp[x].human_profile);
        }

        tmp = MixerControl.get_sources();
        Lib.TalkativeLog("#-# mixer sources -> " + tmp.length);
        for (let x in tmp) {
            Lib.TalkativeLog("-#-source index: " + tmp[x].index);
            Lib.TalkativeLog("-#-application_ID: " + tmp[x].application_id);
            Lib.TalkativeLog("-#-source name: " + tmp[x].name);
            Lib.TalkativeLog("-#-source icon: " + tmp[x].icon_name);
            Lib.TalkativeLog("-#-source description: " + tmp[x].description);
            Lib.TalkativeLog("-#-source port: " + tmp[x].port);
        }

        tmp = MixerControl.get_source_outputs();
        Lib.TalkativeLog("#-# mixer source output -> " + tmp.length);
        for (let x in tmp) {
            Lib.TalkativeLog("-#-sourceouput index: " + tmp[x].index);
            Lib.TalkativeLog("-#-application_ID: " + tmp[x].application_id);
            Lib.TalkativeLog("-#-sourceouput name: " + tmp[x].name);
            Lib.TalkativeLog("-#-sourceoutput icon: " + tmp[x].icon_name);
            Lib.TalkativeLog(
                "-#-sourceoutput description: " + tmp[x].description
            );
            Lib.TalkativeLog("-#-sourceoutput port: " + tmp[x].port);
        }

        tmp = MixerControl.get_sinks();
        Lib.TalkativeLog("#-# mixer sink -> " + tmp.length);
        for (let x in tmp) {
            Lib.TalkativeLog("-#-sink index: " + tmp[x].index);
            Lib.TalkativeLog("-#-application_ID: " + tmp[x].application_id);
            Lib.TalkativeLog("-#-sink name: " + tmp[x].name);
            Lib.TalkativeLog("-#-sink icon: " + tmp[x].icon_name);
            Lib.TalkativeLog("-#-sink description: " + tmp[x].description);
            Lib.TalkativeLog("-#-sink port: " + tmp[x].port);
        }

        tmp = MixerControl.get_sink_inputs();
        Lib.TalkativeLog("#-# mixer sink input -> " + tmp.length);
        for (let x in tmp) {
            Lib.TalkativeLog("-#-sink input index: " + tmp[x].index);
            Lib.TalkativeLog("-#-application_ID: " + tmp[x].application_id);
            Lib.TalkativeLog("-#-sink input name: " + tmp[x].name);
            Lib.TalkativeLog("-#-sink input icon: " + tmp[x].icon_name);
            Lib.TalkativeLog(
                "-#-sink input description: " + tmp[x].description
            );
            Lib.TalkativeLog("-#-sink input port: " + tmp[x].port);
        }

        tmp = MixerControl.get_streams();
        Lib.TalkativeLog("#-# mixer stream -> " + tmp.length);
        for (let x in tmp) {
            Lib.TalkativeLog("-#-STREAM index: " + tmp[x].index);
            Lib.TalkativeLog("-#-application_ID: " + tmp[x].application_id);
            Lib.TalkativeLog("-#-stream name: " + tmp[x].name);
            Lib.TalkativeLog("-#-stream icon: " + tmp[x].icon_name);
            Lib.TalkativeLog("-#-stream description: " + tmp[x].description);

            var tmp1 = tmp[x].get_ports();
            for (let y in tmp1) {
                Lib.TalkativeLog("-##-stream port number: " + y);
                Lib.TalkativeLog("-##-stream port name: " + tmp1[y].port);
                Lib.TalkativeLog(
                    "-##-stream port human name: " + tmp1[y].human_port
                );
                Lib.TalkativeLog(
                    "-##-stream port priority: " + tmp1[y].priority
                );
            }
        }
    },

    /**
     * @return {boolean}
     */
    checkAudio: function () {
        Lib.TalkativeLog("-#-check GVC lib presence: " + isConnected);

        return isConnected;
    },

    /**
     * Destroy mixer control
     */
    destroy: function () {
        if (MixerControl) {
            MixerControl.close();
        }

        this.destroy();
    },
});
