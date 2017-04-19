/* -*- mode: js; js-basic-offset: 4; indent-tabs-mode: nil -*- */

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

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Pango = imports.gi.Pango;
const Lang = imports.lang;

const Gettext = imports.gettext.domain(
    'EasyScreenCast@iacopodeenosee.gmail.com');
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Lib = Me.imports.convenience;
const UtilWebcam = Me.imports.utilwebcam;
const UtilGSP = Me.imports.utilgsp;


// setting keys
const INPUT_AUDIO_SOURCE_SETTING_KEY = 'input-audio-source';
const ACTIVE_POST_CMD_SETTING_KEY = 'execute-post-cmd';
const POST_CMD_SETTING_KEY = 'post-cmd';
const ACTIVE_CUSTOM_GSP_SETTING_KEY = 'active-custom-gsp';
const ACTIVE_SHORTCUT_SETTING_KEY = 'active-shortcut';
const SHORTCUT_KEY_SETTING_KEY = 'shortcut-key';
const TIME_DELAY_SETTING_KEY = 'delay-time';
const SHOW_NOTIFY_ALERT_SETTING_KEY = 'show-notify-alert';
const SHOW_AREA_REC_SETTING_KEY = 'show-area-rec';
const VERBOSE_DEBUG_SETTING_KEY = 'verbose-debug';
const PIPELINE_REC_SETTING_KEY = 'pipeline';
const FPS_SETTING_KEY = 'fps';
const STATUS_INDICATORS_SETTING_KEY = 'status-indicators';
const X_POS_SETTING_KEY = 'x-pos';
const Y_POS_SETTING_KEY = 'y-pos';
const WIDTH_SETTING_KEY = 'width-rec';
const HEIGHT_SETTING_KEY = 'height-rec';
const DRAW_CURSOR_SETTING_KEY = 'draw-cursor';
const AREA_SCREEN_SETTING_KEY = 'area-screen';
const FILE_NAME_SETTING_KEY = 'file-name';
const FILE_FOLDER_SETTING_KEY = 'file-folder';
const FILE_CONTAINER_SETTING_KEY = 'file-container';
const FILE_RESOLUTION_SETTING_KEY = 'file-resolution';
const QUALITY_SETTING_KEY = 'quality-index';
const DEVICE_WEBCAM_SETTING_KEY = 'device-webcam';
const QUALITY_WEBCAM_SETTING_KEY = 'quality-webcam';
const WIDTH_WEBCAM_SETTING_KEY = 'width-webcam';
const HEIGHT_WEBCAM_SETTING_KEY = 'height-webcam';
const TYPE_UNIT_WEBCAM_SETTING_KEY = 'type-unit-webcam';
const MARGIN_X_WEBCAM_SETTING_KEY = 'margin-x-webcam';
const MARGIN_Y_WEBCAM_SETTING_KEY = 'margin-y-webcam';
const ALPHA_CHANNEL_WEBCAM_SETTING_KEY = 'alpha-channel-webcam';
const CORNER_POSITION_WEBCAM_SETTING_KEY = 'corner-position-webcam';

// shortcut tree view columns
const SHORTCUT_COLUMN_KEY = 0;
const SHORTCUT_COLUMN_MODS = 1;


let settings = null;

//getter option
function getOption(type, key) {
    checkSettings();

    switch (type) {
        case 'b':
            return settings.get_boolean(key);
            break;

        case 'i':
            return settings.get_int(key);
            break;

        case 's':
            return settings.get_string(key);
            break;

        case 'd':
            return settings.get_double(key);
            break;

        case 'as':
            return settings.get_strv(key);
            break;

        default:
            return 'ERROR';
    }
    return '';
}

//getter option
function getGSPstd(audio) {

    //TODO update gsp
    if (audio) {
        return 'queue max-size-buffers=0 max-size-time=0 max-size-bytes=0 ! videorate ! vp8enc min_quantizer=0 max_quantizer=5 cpu-used=3 deadline=1000000 threads=%T ! queue max-size-buffers=0 max-size-time=0 max-size-bytes=0 ! mux. pulsesrc ! queue max-size-buffers=0 max-size-time=0 max-size-bytes=0 ! audioconvert ! vorbisenc ! queue max-size-buffers=0 max-size-time=0 max-size-bytes=0 ! mux. webmmux name=mux ';
    } else {
        return 'vp9enc min_quantizer=0 max_quantizer=5 cpu-used=3 deadline=1000000 threads=%T ! queue max-size-buffers=0 max-size-time=0 max-size-bytes=0 ! webmmux';
    }
}

//setter option
function setOption(key, option) {
    checkSettings();

    switch (typeof(option)) {
        case 'boolean':
            settings.set_boolean(key, option);
            break;

        case 'number':
            settings.set_int(key, option);
            break;

        case 'string':
            settings.set_string(key, option);
            break;

        case 'double':
            settings.set_double(key, option);
            break;

        case 'object':
            settings.set_strv(key, option);
            break;

        default:
            return 'ERROR';
    }
    return '';
}

function checkSettings() {
    if (settings === null) {
        settings = Lib.getSettings('org.gnome.shell.extensions.EasyScreenCast');
    }
}
