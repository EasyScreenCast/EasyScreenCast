/*
    Copyright (C) 2013  Borsato Ivano

    The JavaScript code in this page is free software: you can
    redistribute it and/or modify it under the terms of the GNU
    General Public License (GNU GPL) as published by the Free Software
    Foundation, either version 3 of the License, or (at your option)
    any later version.  The code is distributed WITHOUT ANY WARRANTY;
    without even the implied warranty of MERCHANTABILITY or FITNESS
    FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.
*/

/* exported getGSPstd,Settings */
'use strict';

const GObject = imports.gi.GObject;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const Domain = imports.gettext.domain(Me.metadata['gettext-domain']);
const _ = Domain.gettext;


/* eslint-disable no-unused-vars */
// these are exported constants

// setting keys
var INPUT_AUDIO_SOURCE_SETTING_KEY = 'input-audio-source';
var ACTIVE_POST_CMD_SETTING_KEY = 'execute-post-cmd';
var POST_CMD_SETTING_KEY = 'post-cmd';
var ACTIVE_PRE_CMD_SETTING_KEY = 'execute-pre-cmd';
var PRE_CMD_SETTING_KEY = 'pre-cmd';
var ACTIVE_CUSTOM_GSP_SETTING_KEY = 'active-custom-gsp';
var ACTIVE_SHORTCUT_SETTING_KEY = 'active-shortcut';
var SHORTCUT_KEY_SETTING_KEY = 'shortcut-key';
var TIME_DELAY_SETTING_KEY = 'delay-time';
var SHOW_NOTIFY_ALERT_SETTING_KEY = 'show-notify-alert';
var SHOW_AREA_REC_SETTING_KEY = 'show-area-rec';
var VERBOSE_DEBUG_SETTING_KEY = 'verbose-debug';
var PIPELINE_REC_SETTING_KEY = 'pipeline';
var FPS_SETTING_KEY = 'fps';
var STATUS_INDICATORS_SETTING_KEY = 'status-indicators';
var X_POS_SETTING_KEY = 'x-pos';
var Y_POS_SETTING_KEY = 'y-pos';
var WIDTH_SETTING_KEY = 'width-rec';
var HEIGHT_SETTING_KEY = 'height-rec';
var DRAW_CURSOR_SETTING_KEY = 'draw-cursor';
var AREA_SCREEN_SETTING_KEY = 'area-screen';
var FILE_NAME_SETTING_KEY = 'file-name';
var FILE_FOLDER_SETTING_KEY = 'file-folder';
var FILE_CONTAINER_SETTING_KEY = 'file-container';
var FILE_RESOLUTION_TYPE_SETTING_KEY = 'file-resolution-type';
var FILE_RESOLUTION_KAR_SETTING_KEY = 'file-resolution-kar';
var FILE_RESOLUTION_WIDTH_SETTING_KEY = 'file-resolution-width';
var FILE_RESOLUTION_HEIGHT_SETTING_KEY = 'file-resolution-height';
var QUALITY_SETTING_KEY = 'quality-index';
var DEVICE_INDEX_WEBCAM_SETTING_KEY = 'device-webcam-index';
var DEVICE_WEBCAM_SETTING_KEY = 'device-webcam';
var QUALITY_WEBCAM_SETTING_KEY = 'quality-webcam';
var WIDTH_WEBCAM_SETTING_KEY = 'width-webcam';
var HEIGHT_WEBCAM_SETTING_KEY = 'height-webcam';
var TYPE_UNIT_WEBCAM_SETTING_KEY = 'type-unit-webcam';
var MARGIN_X_WEBCAM_SETTING_KEY = 'margin-x-webcam';
var MARGIN_Y_WEBCAM_SETTING_KEY = 'margin-y-webcam';
var ALPHA_CHANNEL_WEBCAM_SETTING_KEY = 'alpha-channel-webcam';
var CORNER_POSITION_WEBCAM_SETTING_KEY = 'corner-position-webcam';

// shortcut tree view columns
var SHORTCUT_COLUMN_KEY = 0;
var SHORTCUT_COLUMN_MODS = 1;
/* eslint-enable no-unused-vars */


var Settings = GObject.registerClass(class EasyScreenCastSettings extends GObject.Object {
    _init() {
        this._settings = ExtensionUtils.getSettings();
    }

    /**
     * getter option
     *
     * @param {string} type value type of the option. one of 'b', 'i', 's', 'd', 'as'
     * @param {string} key option key
     * @returns {string}
     */
    getOption(type, key) {
        switch (type) {
        case 'b':
            return this._settings.get_boolean(key);
        case 'i':
            return this._settings.get_int(key);
        case 's':
            return this._settings.get_string(key);
        case 'd':
            return this._settings.get_double(key);
        case 'as':
            return this._settings.get_strv(key);
        }

        return '';
    }

    /**
     * setter option
     *
     * @param {string} key option key
     * @param {boolean|number|string|double|object} option option value
     * @returns {string} empty string if successful, 'ERROR' otherwise
     */
    setOption(key, option) {
        switch (typeof option) {
        case 'boolean':
            this._settings.set_boolean(key, option);
            break;

        case 'number':
            this._settings.set_int(key, option);
            break;

        case 'string':
            this._settings.set_string(key, option);
            break;

        case 'double':
            this._settings.set_double(key, option);
            break;

        case 'object':
            this._settings.set_strv(key, option);
            break;

        default:
            return 'ERROR';
        }
        return '';
    }

    destroy() {
        if (this._settings) {
            this._settings.run_dispose();
            this._settings = null;
        }
    }
});


/**
 * get a standard gsp pipeline
 *
 * @param {boolean} audio with or without audio
 * @returns {string}
 */
function getGSPstd(audio) {
    // TODO update gsp
    if (audio) {
        return 'queue max-size-buffers=0 max-size-time=0 max-size-bytes=0 ! videorate ! vp8enc min_quantizer=0 max_quantizer=5 cpu-used=3 deadline=1000000 threads=%T ! queue max-size-buffers=0 max-size-time=0 max-size-bytes=0 ! mux. pulsesrc ! queue max-size-buffers=0 max-size-time=0 max-size-bytes=0 ! audioconvert ! vorbisenc ! queue max-size-buffers=0 max-size-time=0 max-size-bytes=0 ! mux. webmmux name=mux ';
    } else {
        return 'vp9enc min_quantizer=0 max_quantizer=5 cpu-used=3 deadline=1000000 threads=%T ! queue max-size-buffers=0 max-size-time=0 max-size-bytes=0 ! webmmux';
    }
}
