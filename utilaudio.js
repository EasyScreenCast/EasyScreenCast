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
import Gvc from 'gi://Gvc';

import * as Lib from './convenience.js';
import * as Settings from './settings.js';
import * as Ext from './extension.js';

/**
 * @type {MixerAudio}
 */
export const MixerAudio = GObject.registerClass({
    GTypeName: 'EasyScreenCast_MixerAudio',
}, class MixerAudio extends GObject.Object {
    constructor() {
        super();
        Lib.TalkativeLog('-#-mixer constructor');

        this._mixerControl = this._createMixerControl();
        this._isConnected = true;
        this._mixerControl.connect('state-changed', () =>
            this._onChangeStatePAC()
        );

        // more log for debug
        if (Lib.debugEnabled) {
            this._mixerControl.connect('stream_added', (control, id) => {
                this._onStreamAdd(control, id);
            });
            this._mixerControl.connect('stream_removed', (control, id) => {
                this._onStreamRemove(control, id);
            });
        }
    }

    /**
     * @returns {Gvc.MixerControl}
     * @private
     */
    _createMixerControl() {
        Lib.TalkativeLog('-#-mixer create');

        // https://gitlab.gnome.org/GNOME/libgnome-volume-control
        var _mixerTmp = new Gvc.MixerControl({
            name: 'ESC Mixer Control',
        });
        _mixerTmp.open();

        return _mixerTmp;
    }

    _onChangeStatePAC() {
        Lib.TalkativeLog('-#-mixer state changed');

        switch (this._mixerControl.get_state()) {
        case Gvc.MixerControlState.CLOSED:
            Lib.TalkativeLog('-#-Mixer close');
            this._isConnected = false;
            break;
        case Gvc.MixerControlState.CONNECTING:
            Lib.TalkativeLog('-#-Mixer connecting');
            this._isConnected = false;
            break;
        case Gvc.MixerControlState.FAILED:
            Lib.TalkativeLog('-#-Mixer failed');
            this._isConnected = false;
            break;
        case Gvc.MixerControlState.READY:
            Lib.TalkativeLog('-#-Mixer ready');
            this._isConnected = true;

            // more log for debug
            if (Lib.debugEnabled)
                this._getInfoPA();

            break;
        default:
            Lib.TalkativeLog('-#-Mixer UNK');
            this._isConnected = false;
            break;
        }
    }

    /**
     * Gets a list of input audio sources.
     *
     * @returns {Array}
     */
    getListInputAudio() {
        Lib.TalkativeLog('-#-get list input audio');

        if (this._isConnected) {
            var arrayTmp = [];

            var tmpSinks = this._mixerControl.get_sinks();
            Lib.TalkativeLog(`-#-Mixer sink -> ${tmpSinks.length}`);
            for (let x in tmpSinks) {
                Lib.TalkativeLog(`-#-sink index: ${tmpSinks[x].index}`);
                Lib.TalkativeLog(`-#-sink name: ${tmpSinks[x].name}`);
                Lib.TalkativeLog(
                    `-#-sink description: ${tmpSinks[x].description}`
                );
                Lib.TalkativeLog(`-#-sink port: ${tmpSinks[x].port}`);

                arrayTmp.push({
                    desc: tmpSinks[x].description,
                    name: tmpSinks[x].name,
                    port: tmpSinks[x].port,
                    sortable: true,
                    resizeable: true,
                });
            }

            var tmpSources = this._mixerControl.get_sources();
            Lib.TalkativeLog(`-#-Mixer sources -> ${tmpSources.length}`);
            for (let x in tmpSources) {
                Lib.TalkativeLog(`-#-source index: ${tmpSources[x].index}`);
                Lib.TalkativeLog(`-#-source name: ${tmpSources[x].name}`);
                Lib.TalkativeLog(
                    `-#-source description: ${tmpSources[x].description}`
                );
                Lib.TalkativeLog(`-#-source port: ${tmpSources[x].port}`);

                arrayTmp.push({
                    desc: tmpSources[x].description,
                    name: tmpSources[x].name,
                    port: tmpSources[x].port,
                    sortable: true,
                    resizeable: true,
                });
            }

            Lib.TalkativeLog(`-#-MIXER SOURCE TOT -> ${arrayTmp.length}`);

            return arrayTmp;
        } else {
            Lib.TalkativeLog('-#-Error lib pulse NOT present or NOT respond');
        }

        return [];
    }

    /**
     * @returns {string}
     */
    getAudioSource() {
        Lib.TalkativeLog('-#-get source audio choosen');

        var arrtmp = this.getListInputAudio();
        var index = Ext.Indicator.getSettings().getOption('i', Settings.INPUT_AUDIO_SOURCE_SETTING_KEY) - 2;

        if (index >= 0 && index < arrtmp.length) {
            return arrtmp[index].name;
        } else {
            Lib.TalkativeLog('-#-ERROR, audio source missing');
            Ext.Indicator.getSettings().setOption(Settings.INPUT_AUDIO_SOURCE_SETTING_KEY, 0);

            return '';
        }
    }

    /**
     * @param {Gvc.MixerControl} control the mixer control to which the stream was added
     * @param {number} id the stream id
     * @private
     */
    _onStreamAdd(control, id) {
        Lib.TalkativeLog(`-#-mixer stream add - ID: ${id}`);
        var streamTmp = control.lookup_stream_id(id);

        if (
            streamTmp.name === 'GNOME Shell' &&
            streamTmp.description === 'Record Stream'
        ) {
            Lib.TalkativeLog('-#-stream gnome recorder captured');

            Lib.TalkativeLog(`-#-stream index: ${streamTmp.index}`);
            Lib.TalkativeLog(`-#-stream card index: ${streamTmp.card_index}`);
            Lib.TalkativeLog(`-#-application_ID: ${streamTmp.application_id}`);
            Lib.TalkativeLog(`-#-stream name: ${streamTmp.name}`);
            Lib.TalkativeLog(`-#-stream icon: ${streamTmp.icon_name}`);
            Lib.TalkativeLog(`-#-stream description: ${streamTmp.description}`);
            Lib.TalkativeLog(`-#-stream port: ${streamTmp.port}`);
        }
    }

    /**
     * @param {Gvc.MixerControl} control the mixer control from where the stream was removed
     * @param {number} id stream id
     * @private
     */
    _onStreamRemove(control, id) {
        Lib.TalkativeLog(`-#-mixer stream remove - ID: ${id}`);
        // note: the stream has been already removed, so
        // control.lookup_stream_id(id) won't return anything
    }

    /**
     * @private
     */
    _getInfoPA() {
        var tmp = this._mixerControl.get_cards();
        Lib.TalkativeLog(`#-# mixer cards -> ${tmp.length}`);
        for (let x in tmp) {
            Lib.TalkativeLog(`-#-card index: ${tmp[x].index}`);
            Lib.TalkativeLog(`-#-card name: ${tmp[x].name}`);
            Lib.TalkativeLog(`-#-card icon: ${tmp[x].icon_name}`);
            Lib.TalkativeLog(`-#-card profile: ${tmp[x].profile}`);
            Lib.TalkativeLog(`-#-card human profile: ${tmp[x].human_profile}`);
        }

        tmp = this._mixerControl.get_sources();
        Lib.TalkativeLog(`#-# mixer sources -> ${tmp.length}`);
        for (let x in tmp) {
            Lib.TalkativeLog(`-#-source index: ${tmp[x].index}`);
            Lib.TalkativeLog(`-#-application_ID: ${tmp[x].application_id}`);
            Lib.TalkativeLog(`-#-source name: ${tmp[x].name}`);
            Lib.TalkativeLog(`-#-source icon: ${tmp[x].icon_name}`);
            Lib.TalkativeLog(`-#-source description: ${tmp[x].description}`);
            Lib.TalkativeLog(`-#-source port: ${tmp[x].port}`);
        }

        tmp = this._mixerControl.get_source_outputs();
        Lib.TalkativeLog(`#-# mixer source output -> ${tmp.length}`);
        for (let x in tmp) {
            Lib.TalkativeLog(`-#-sourceouput index: ${tmp[x].index}`);
            Lib.TalkativeLog(`-#-application_ID: ${tmp[x].application_id}`);
            Lib.TalkativeLog(`-#-sourceouput name: ${tmp[x].name}`);
            Lib.TalkativeLog(`-#-sourceoutput icon: ${tmp[x].icon_name}`);
            Lib.TalkativeLog(
                `-#-sourceoutput description: ${tmp[x].description}`
            );
            Lib.TalkativeLog(`-#-sourceoutput port: ${tmp[x].port}`);
        }

        tmp = this._mixerControl.get_sinks();
        Lib.TalkativeLog(`#-# mixer sink -> ${tmp.length}`);
        for (let x in tmp) {
            Lib.TalkativeLog(`-#-sink index: ${tmp[x].index}`);
            Lib.TalkativeLog(`-#-application_ID: ${tmp[x].application_id}`);
            Lib.TalkativeLog(`-#-sink name: ${tmp[x].name}`);
            Lib.TalkativeLog(`-#-sink icon: ${tmp[x].icon_name}`);
            Lib.TalkativeLog(`-#-sink description: ${tmp[x].description}`);
            Lib.TalkativeLog(`-#-sink port: ${tmp[x].port}`);
        }

        tmp = this._mixerControl.get_sink_inputs();
        Lib.TalkativeLog(`#-# mixer sink input -> ${tmp.length}`);
        for (let x in tmp) {
            Lib.TalkativeLog(`-#-sink input index: ${tmp[x].index}`);
            Lib.TalkativeLog(`-#-application_ID: ${tmp[x].application_id}`);
            Lib.TalkativeLog(`-#-sink input name: ${tmp[x].name}`);
            Lib.TalkativeLog(`-#-sink input icon: ${tmp[x].icon_name}`);
            Lib.TalkativeLog(
                `-#-sink input description: ${tmp[x].description}`
            );
            Lib.TalkativeLog(`-#-sink input port: ${tmp[x].port}`);
        }

        tmp = this._mixerControl.get_streams();
        Lib.TalkativeLog(`#-# mixer stream -> ${tmp.length}`);
        for (let x in tmp) {
            Lib.TalkativeLog(`-#-STREAM index: ${tmp[x].index}`);
            Lib.TalkativeLog(`-#-application_ID: ${tmp[x].application_id}`);
            Lib.TalkativeLog(`-#-stream name: ${tmp[x].name}`);
            Lib.TalkativeLog(`-#-stream icon: ${tmp[x].icon_name}`);
            Lib.TalkativeLog(`-#-stream description: ${tmp[x].description}`);

            var tmp1 = tmp[x].get_ports();
            for (let y in tmp1) {
                Lib.TalkativeLog(`-##-stream port number: ${y}`);
                Lib.TalkativeLog(`-##-stream port name: ${tmp1[y].port}`);
                Lib.TalkativeLog(
                    `-##-stream port human name: ${tmp1[y].human_port}`
                );
                Lib.TalkativeLog(
                    `-##-stream port priority: ${tmp1[y].priority}`
                );
            }
        }
    }

    /**
     * @returns {boolean}
     */
    checkAudio() {
        Lib.TalkativeLog(`-#-check GVC lib presence: ${this._isConnected}`);

        return this._isConnected;
    }

    /**
     * Destroy mixer control
     */
    destroy() {
        if (this._mixerControl) {
            this._mixerControl.close();
            this._mixerControl = null;
        }
    }
});
