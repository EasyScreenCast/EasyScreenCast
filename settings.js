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

'use strict';

import GObject from 'gi://GObject';

// setting keys
export const INPUT_AUDIO_SOURCE_SETTING_KEY = 'input-audio-source';
export const ACTIVE_POST_CMD_SETTING_KEY = 'execute-post-cmd';
export const POST_CMD_SETTING_KEY = 'post-cmd';
export const ACTIVE_PRE_CMD_SETTING_KEY = 'execute-pre-cmd';
export const PRE_CMD_SETTING_KEY = 'pre-cmd';
export const ACTIVE_CUSTOM_GSP_SETTING_KEY = 'active-custom-gsp';
export const ACTIVE_SHORTCUT_SETTING_KEY = 'active-shortcut';
export const SHORTCUT_KEY_SETTING_KEY = 'shortcut-key';
export const TIME_DELAY_SETTING_KEY = 'delay-time';
export const SHOW_NOTIFY_ALERT_SETTING_KEY = 'show-notify-alert';
export const SHOW_AREA_REC_SETTING_KEY = 'show-area-rec';
export const VERBOSE_DEBUG_SETTING_KEY = 'verbose-debug';
export const PIPELINE_REC_SETTING_KEY = 'pipeline';
export const FPS_SETTING_KEY = 'fps';
export const STATUS_INDICATORS_SETTING_KEY = 'status-indicators';
export const X_POS_SETTING_KEY = 'x-pos';
export const Y_POS_SETTING_KEY = 'y-pos';
export const WIDTH_SETTING_KEY = 'width-rec';
export const HEIGHT_SETTING_KEY = 'height-rec';
export const DRAW_CURSOR_SETTING_KEY = 'draw-cursor';
export const AREA_SCREEN_SETTING_KEY = 'area-screen';
export const FILE_NAME_SETTING_KEY = 'file-name';
export const FILE_FOLDER_SETTING_KEY = 'file-folder';
export const FILE_CONTAINER_SETTING_KEY = 'file-container';
export const FILE_RESOLUTION_TYPE_SETTING_KEY = 'file-resolution-type';
export const FILE_RESOLUTION_KAR_SETTING_KEY = 'file-resolution-kar';
export const FILE_RESOLUTION_WIDTH_SETTING_KEY = 'file-resolution-width';
export const FILE_RESOLUTION_HEIGHT_SETTING_KEY = 'file-resolution-height';
export const QUALITY_SETTING_KEY = 'quality-index';
export const DEVICE_INDEX_WEBCAM_SETTING_KEY = 'device-webcam-index';
export const DEVICE_WEBCAM_SETTING_KEY = 'device-webcam';
export const QUALITY_WEBCAM_SETTING_KEY = 'quality-webcam';
export const WIDTH_WEBCAM_SETTING_KEY = 'width-webcam';
export const HEIGHT_WEBCAM_SETTING_KEY = 'height-webcam';
export const TYPE_UNIT_WEBCAM_SETTING_KEY = 'type-unit-webcam';
export const MARGIN_X_WEBCAM_SETTING_KEY = 'margin-x-webcam';
export const MARGIN_Y_WEBCAM_SETTING_KEY = 'margin-y-webcam';
export const ALPHA_CHANNEL_WEBCAM_SETTING_KEY = 'alpha-channel-webcam';
export const CORNER_POSITION_WEBCAM_SETTING_KEY = 'corner-position-webcam';

// shortcut tree view columns
export const SHORTCUT_COLUMN_KEY = 0;
export const SHORTCUT_COLUMN_MODS = 1;

export const Settings = GObject.registerClass(class EasyScreenCastSettings extends GObject.Object {
    constructor(settings) {
        super();
        this._settings = settings;
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
        if (this._settings)
            this._settings = null;
    }
});


/**
 * get a standard gsp pipeline
 *
 * @param {boolean} audio with or without audio
 * @returns {string}
 */
export function getGSPstd(audio) {
    // TODO update gsp
    if (audio)
        return 'queue max-size-buffers=0 max-size-time=0 max-size-bytes=0 ! videorate ! vp8enc min_quantizer=0 max_quantizer=5 cpu-used=3 deadline=1000000 threads=%T ! queue max-size-buffers=0 max-size-time=0 max-size-bytes=0 ! mux. pulsesrc ! queue max-size-buffers=0 max-size-time=0 max-size-bytes=0 ! audioconvert ! vorbisenc ! queue max-size-buffers=0 max-size-time=0 max-size-bytes=0 ! mux. webmmux name=mux ';
    else
        return 'vp9enc min_quantizer=0 max_quantizer=5 cpu-used=3 deadline=1000000 threads=%T ! queue max-size-buffers=0 max-size-time=0 max-size-bytes=0 ! webmmux';
}
