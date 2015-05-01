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
const Gvc = imports.gi.Gvc;
const Lang = imports.lang;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Lib = Me.imports.convenience;
const Pref = Me.imports.prefs;

let MixerControl = null;
let isConnected = false;

const MixerAudio = new Lang.Class({
    Name: 'MixerAudio',

    _init: function () {
        Lib.TalkativeLog('mixer _init');

        MixerControl = this._getMixerControl();

        if (MixerControl) {
            isConnected = true;
            MixerControl.connect("state-changed",
                Lang.bind(this, this._onChangeStatePAC));

            //more log for debug
            if (Pref.getOption('b', Pref.VERBOSE_DEBUG_SETTING_KEY)) {
                MixerControl.connect("stream_added",
                    Lang.bind(this, function (control, id) {
                        this._onStreamAdd(control, id)
                    }));
                MixerControl.connect("stream_removed",
                    Lang.bind(this, function (control, id) {
                        this._onStreamRemove(control, id)
                    }));
            }
        } else {
            Lib.TalkativeLog('Error lib pulse NOT present or NOT respond');
        }
    },

    _getMixerControl: function () {
        var _mixerTmp;
        if (MixerControl) {
            Lib.TalkativeLog('mixer exist -> ' + MixerControl + ' state -> ' + MixerControl.get_state());

            return MixerControl;
        } else {
            Lib.TalkativeLog('mixer create');

            _mixerTmp = new Gvc.MixerControl({
                name: 'ESC Mixer Control'
            });
            _mixerTmp.open();

            return _mixerTmp;
        }
    },

    _onChangeStatePAC: function () {
        Lib.TalkativeLog('mixer state changed');

        switch (MixerControl.get_state()) {
        case Gvc.MixerControlState.CLOSED:
            Lib.TalkativeLog('mixer close');

            isConnected = false;
            break;
        case Gvc.MixerControlState.CONNECTING:
            Lib.TalkativeLog('mixer connecting');
            isConnected = false;
            break;
        case Gvc.MixerControlState.FAILED:
            Lib.TalkativeLog('mixer failed');

            isConnected = false;
            break;
        case Gvc.MixerControlState.READY:
            Lib.TalkativeLog('mixer ready');

            isConnected = true;

            //more log for debug
            if (Pref.getOption('b', Pref.VERBOSE_DEBUG_SETTING_KEY)) {
                this._getInfoPA();
            }

            var arrSource = this.getListInputAudio();
            var arrName = [];
            for (let i in arrSource) {
                arrName.push(arrSource[i].port);
            }
            Lib.TalkativeLog('arr source audio:' + arrName);
            Pref.setOption(Pref.LIST_INPUT_AUDIO_SETTING_KEY, arrName);

            break;
        default:
            Lib.TalkativeLog('mixer UNK');

            isConnected = false;
            break;
        }
    },

    getListInputAudio: function () {
        Lib.TalkativeLog('get list input audio');

        if (isConnected) {
            var tmp = MixerControl.get_sources();
            var arrayTmp = new Array();

            var tmpSinks = MixerControl.get_sinks();
            Lib.TalkativeLog('-###- mixer sink -> ' + tmpSinks.length);
            for (let x in tmpSinks) {
                Lib.TalkativeLog('_sink index: ' + tmpSinks[x].index);
                Lib.TalkativeLog('_sink name: ' + tmpSinks[x].name);
                Lib.TalkativeLog('_sink description: ' + tmpSinks[x].description);
                Lib.TalkativeLog('_sink port: ' + tmpSinks[x].port);

                arrayTmp.push({
                    desc: tmpSinks[x].description,
                    name: tmpSinks[x].name,
                    port: tmpSinks[x].port,
                    sortable: true,
                    resizeable: true
                });
            }

            var tmpSources = MixerControl.get_sources();
            Lib.TalkativeLog('-###- mixer sources -> ' + tmpSources.length);
            for (let x in tmpSources) {
                Lib.TalkativeLog('_source index: ' + tmpSources[x].index);
                Lib.TalkativeLog('_source name: ' + tmpSources[x].name);
                Lib.TalkativeLog('_source description: ' + tmpSources[x].description);
                Lib.TalkativeLog('_source port: ' + tmpSources[x].port);

                arrayTmp.push({
                    desc: tmpSources[x].description,
                    name: tmpSources[x].name,
                    port: tmpSources[x].port,
                    sortable: true,
                    resizeable: true
                });
            }

            Lib.TalkativeLog('MIXER SOURCE TOT -> ' + arrayTmp.length);

            return arrayTmp;
        } else {
            Lib.TalkativeLog('Error lib pulse NOT present or NOT respond');
        }

        return false;
    },

    getAudioSource: function () {
        Lib.TalkativeLog('get source audio choosen');

        var arrtmp = this.getListInputAudio();
        var index = Pref.getOption('i', Pref.INPUT_AUDIO_SOURCE_SETTING_KEY);
        return arrtmp[index].name;
    },


    _onStreamAdd: function (control, id) {
        Lib.TalkativeLog('mixer stream add - ID: ' + id);
        var streamTmp = control.lookup_stream_id(id);

        if (streamTmp.name === 'GNOME Shell' && streamTmp.description === 'Record Stream') {
            Lib.TalkativeLog('stream gnome recorder captured');

            Lib.TalkativeLog('_stream index: ' + streamTmp.index);
            Lib.TalkativeLog('_stream card index: ' + streamTmp.card_index);
            Lib.TalkativeLog('_application_ID: ' + streamTmp.application_id);
            Lib.TalkativeLog('_stream name: ' + streamTmp.name);
            Lib.TalkativeLog('_stream icon: ' + streamTmp.icon_name);
            Lib.TalkativeLog('_stream description: ' + streamTmp.description);
            Lib.TalkativeLog('_stream port: ' + streamTmp.port);
        }
    },

    _onStreamRemove: function (control, id) {
        Lib.TalkativeLog('mixer stream remove - ID: ' + id);
        var streamTmp = control.lookup_stream_id(id);

    },

    _getInfoPA: function () {
        var tmp = MixerControl.get_cards();
        Lib.TalkativeLog('#-# mixer cards -> ' + tmp.length);
        for (let x in tmp) {
            Lib.TalkativeLog('_card index: ' + tmp[x].index);
            Lib.TalkativeLog('_card name: ' + tmp[x].name);
            Lib.TalkativeLog('_card icon: ' + tmp[x].icon_name);
            Lib.TalkativeLog('_card profile: ' + tmp[x].profile);
            Lib.TalkativeLog('_card human profile: ' + tmp[x].human_profile);
        }

        tmp = MixerControl.get_sources();
        Lib.TalkativeLog('#-# mixer sources -> ' + tmp.length);
        for (let x in tmp) {
            Lib.TalkativeLog('_source index: ' + tmp[x].index);
            Lib.TalkativeLog('_application_ID: ' + tmp[x].application_id);
            Lib.TalkativeLog('_source name: ' + tmp[x].name);
            Lib.TalkativeLog('_source icon: ' + tmp[x].icon_name);
            Lib.TalkativeLog('_source description: ' + tmp[x].description);
            Lib.TalkativeLog('_source port: ' + tmp[x].port);
        }

        tmp = MixerControl.get_source_outputs();
        Lib.TalkativeLog('#-# mixer source output -> ' + tmp.length);
        for (let x in tmp) {
            Lib.TalkativeLog('_sourceouput index: ' + tmp[x].index);
            Lib.TalkativeLog('_application_ID: ' + tmp[x].application_id);
            Lib.TalkativeLog('_sourceouput name: ' + tmp[x].name);
            Lib.TalkativeLog('_sourceoutput icon: ' + tmp[x].icon_name);
            Lib.TalkativeLog('_sourceoutput description: ' + tmp[x].description);
            Lib.TalkativeLog('_sourceoutput port: ' + tmp[x].port);
        }

        tmp = MixerControl.get_sinks();
        Lib.TalkativeLog('#-# mixer sink -> ' + tmp.length);
        for (let x in tmp) {
            Lib.TalkativeLog('_sink index: ' + tmp[x].index);
            Lib.TalkativeLog('_application_ID: ' + tmp[x].application_id);
            Lib.TalkativeLog('_sink name: ' + tmp[x].name);
            Lib.TalkativeLog('_sink icon: ' + tmp[x].icon_name);
            Lib.TalkativeLog('_sink description: ' + tmp[x].description);
            Lib.TalkativeLog('_sink port: ' + tmp[x].port);
        }

        tmp = MixerControl.get_sink_inputs();
        Lib.TalkativeLog('#-# mixer sink input -> ' + tmp.length);
        for (let x in tmp) {
            Lib.TalkativeLog('_sink input index: ' + tmp[x].index);
            Lib.TalkativeLog('_application_ID: ' + tmp[x].application_id);
            Lib.TalkativeLog('_sink input name: ' + tmp[x].name);
            Lib.TalkativeLog('_sink input icon: ' + tmp[x].icon_name);
            Lib.TalkativeLog('_sink input description: ' + tmp[x].description);
            Lib.TalkativeLog('_sink input port: ' + tmp[x].port);
        }

        tmp = MixerControl.get_streams();
        Lib.TalkativeLog('#-# mixer stream -> ' + tmp.length);
        for (let x in tmp) {
            Lib.TalkativeLog('STREAM index: ' + tmp[x].index);
            Lib.TalkativeLog('_application_ID: ' + tmp[x].application_id);
            Lib.TalkativeLog('_stream name: ' + tmp[x].name);
            Lib.TalkativeLog('_stream icon: ' + tmp[x].icon_name);
            Lib.TalkativeLog('_stream description: ' + tmp[x].description);

            var tmp1 = tmp[x].get_ports();
            for (let y in tmp1) {
                Lib.TalkativeLog('__stream port number: ' + y);
                Lib.TalkativeLog('__stream port name: ' + tmp1[y].port);
                Lib.TalkativeLog('__stream port human name: ' + tmp1[y].human_port);
                Lib.TalkativeLog('__stream port priority: ' + tmp1[y].priority);
            }
        }
    },

    checkAudio: function () {
        Lib.TalkativeLog('check pulseaudio lib presence: ' + isConnected);

        return isConnected;
    },

    destroy: function () {
        if (MixerControl) {
            MixerControl.close();
        }

        this.destroy();
    }
});
