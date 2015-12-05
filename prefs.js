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
const Lang = imports.lang;

const Gettext = imports.gettext.domain(
    'EasyScreenCast@iacopodeenosee.gmail.com');
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Lib = Me.imports.convenience;

// setting keys
const INPUT_AUDIO_SOURCE_SETTING_KEY = 'input-audio-source';
const ACTIVE_POST_CMD_SETTING_KEY = 'execute-post-cmd';
const POST_CMD_SETTING_KEY = 'post-cmd';
const ACTIVE_CUSTOM_GSP_SETTING_KEY = 'active-custom-gsp';
const ACTIVE_SHORTCUT_SETTING_KEY = 'active-shortcut';
const SHORTCUT_KEY_SETTING_KEY = 'shortcut-key';
const TIME_DELAY_SETTING_KEY = 'delay-time';
const SHOW_TIMER_REC_SETTING_KEY = 'show-timer-rec';
const SHOW_AREA_REC_SETTING_KEY = 'show-area-rec';
const VERBOSE_DEBUG_SETTING_KEY = 'verbose-debug';
const PIPELINE_REC_SETTING_KEY = 'pipeline';
const FPS_SETTING_KEY = 'fps';
const REPLACE_INDICATOR_SETTING_KEY = 'replace-indicator';
const X_POS_SETTING_KEY = 'x-pos';
const Y_POS_SETTING_KEY = 'y-pos';
const WIDTH_SETTING_KEY = 'width-rec';
const HEIGHT_SETTING_KEY = 'height-rec';
const DRAW_CURSOR_SETTING_KEY = 'draw-cursor';
const AREA_SCREEN_SETTING_KEY = 'area-screen';
const FILE_NAME_SETTING_KEY = 'file-name';
const FILE_FOLDER_SETTING_KEY = 'file-folder';

// shortcut tree view columns
const SHORTCUT_COLUMN_KEY = 0;
const SHORTCUT_COLUMN_MODS = 1;


let settings = null;

function init() {
    Lib.initTranslations('EasyScreenCast@iacopodeenosee.gmail.com');
}

const EasyScreenCastSettingsWidget = new GObject.Class({
    Name: 'EasyScreenCast.Prefs.Widget',
    GTypeName: 'EasyScreenCastSettingsWidget',
    Extends: Gtk.Box,

    _init: function (params) {
        this.parent(params);

        // creates the settings
        checkSettings();

        // creates the ui builder and add the main resource file
        let uiFilePath = Me.path + '/EasyScreenCast.gtkbuilder';
        let builder = new Gtk.Builder();
        builder.set_translation_domain(
            'EasyScreenCast@iacopodeenosee.gmail.com');

        if (builder.add_from_file(uiFilePath) == 0) {
            Lib.TalkativeLog('could not load the ui file: ' + format(uiFilePath));

            let label = new Gtk.Label({
                label: _('Could not load the preferences UI file'),
                vexpand: true
            });

            this.pack_start(label, true, true, 0);
        } else {
            Lib.TalkativeLog('UI file receive and load: ' + uiFilePath);

            // gets the interesting builder objects
            let Ref_box_MainContainer = builder.get_object('Main_Container');
            // packs the main table
            this.pack_start(Ref_box_MainContainer, true, true, 0);

            //implements show timer option
            this.Ref_switch_ShowTimerRec = builder.get_object(
                'swt_ShowTimerRec');
            settings.bind(
                SHOW_TIMER_REC_SETTING_KEY, this.Ref_switch_ShowTimerRec,
                'active', Gio.SettingsBindFlags.DEFAULT);

            //implements show area option
            this.Ref_switch_ShowAreaRec = builder.get_object('swt_ShowAreaRec');
            settings.bind(
                SHOW_AREA_REC_SETTING_KEY, this.Ref_switch_ShowAreaRec,
                'active', Gio.SettingsBindFlags.DEFAULT);

            //implements show indicator option
            this.Ref_switch_ShowIndicatorRec = builder.get_object(
                'swt_ShowIndicatorRec');
            settings.bind(
                REPLACE_INDICATOR_SETTING_KEY, this.Ref_switch_ShowIndicatorRec,
                'active', Gio.SettingsBindFlags.DEFAULT);

            //implements draw cursor option
            this.Ref_switch_DrawCursorRec = builder.get_object(
                'swt_DrawCursorRec');
            settings.bind(
                DRAW_CURSOR_SETTING_KEY, this.Ref_switch_DrawCursorRec,
                'active', Gio.SettingsBindFlags.DEFAULT);

            //implements enable keybinding option
            this.Ref_switch_EnableShortcut = builder.get_object(
                'swt_KeyShortcut');
            settings.bind(
                ACTIVE_SHORTCUT_SETTING_KEY, this.Ref_switch_EnableShortcut,
                'active', Gio.SettingsBindFlags.DEFAULT);



            //implements selecting alternative key combo
            this.Ref_treeview_Shortcut = builder.get_object(
                "treeview_KeyShortcut");
            this.Ref_treeview_Shortcut.set_sensitive(true);
            this.Ref_liststore_Shortcut = builder.get_object(
                "liststore_KeyShortcut");
            this.Iter_ShortcutRow = this.Ref_liststore_Shortcut.append();

            let renderer = new Gtk.CellRendererAccel({
                editable: true
            });
            renderer.connect(
                "accel-edited", Lang.bind(this,
                    function (renderer, path, key, mods, hwCode) {
                        Lib.TalkativeLog('edited key accel');

                        let accel = Gtk.accelerator_name(key, mods);

                        this._updateRowShortcut(accel);
                        setOption(SHORTCUT_KEY_SETTING_KEY, [accel]);
                    }));


            renderer.connect(
                "accel-cleared", Lang.bind(this,
                    function (renderer, path) {
                        Lib.TalkativeLog('cleared key accel');

                        this._updateRowShortcut(null);
                        setOption(SHORTCUT_KEY_SETTING_KEY, []);
                    }
                ));

            let column = new Gtk.TreeViewColumn();
            column.pack_start(renderer, true);
            column.add_attribute(renderer, "accel-key", SHORTCUT_COLUMN_KEY);
            column.add_attribute(renderer, "accel-mods", SHORTCUT_COLUMN_MODS);

            this.Ref_treeview_Shortcut.append_column(column);

            //implements FPS option
            this.Ref_spinner_FrameRateRec = builder.get_object(
                'spb_FrameRateRec');
            // Create an adjustment to use for the second spinbutton
            let adjustment1 = new Gtk.Adjustment({
                value: 30,
                lower: 1,
                upper: 666,
                step_increment: 1,
                page_increment: 10
            });
            this.Ref_spinner_FrameRateRec.configure(adjustment1, 10, 0);
            settings.bind(
                FPS_SETTING_KEY, this.Ref_spinner_FrameRateRec, 'value',
                Gio.SettingsBindFlags.DEFAULT);

            //implements command string rec option
            this.Ref_textedit_Pipeline = builder.get_object(
                'txe_CommandStringRec');
            this.Ref_buffer_Pipeline = this.Ref_textedit_Pipeline.get_buffer();
            settings.bind(
                PIPELINE_REC_SETTING_KEY, this.Ref_buffer_Pipeline, 'text',
                Gio.SettingsBindFlags.DEFAULT);

            //implements custom GSPipeline option
            this.Ref_switch_CustomGSP = builder.get_object(
                'swt_EnableCustomGSP');
            settings.bind(
                ACTIVE_CUSTOM_GSP_SETTING_KEY, this.Ref_switch_CustomGSP,
                'active', Gio.SettingsBindFlags.DEFAULT);
            this.Ref_switch_CustomGSP.connect(
                'state_changed', Lang.bind(this, function () {
                    //update GSP text area
                    this._setStateGSP();
                }));

            //implements post execute command
            this.Ref_switch_ExecutePostCMD = builder.get_object(
                'swt_executepostcmd');
            settings.bind(
                ACTIVE_POST_CMD_SETTING_KEY, this.Ref_switch_ExecutePostCMD,
                'active', Gio.SettingsBindFlags.DEFAULT);

            this.Ref_textedit_PostCMD = builder.get_object(
                'txe_postcmd');
            settings.bind(
                POST_CMD_SETTING_KEY, this.Ref_textedit_PostCMD,
                'text', Gio.SettingsBindFlags.DEFAULT);

            //implements file name string rec option
            this.Ref_textedit_FileName = builder.get_object('txe_FileNameRec');
            settings.bind(
                FILE_NAME_SETTING_KEY, this.Ref_textedit_FileName, 'text',
                Gio.SettingsBindFlags.DEFAULT);

            //implements file folder option
            this.Ref_label_FileFolderRec = builder.get_object(
                'lbl_FileFolderRec');
            settings.bind(
                FILE_FOLDER_SETTING_KEY, this.Ref_label_FileFolderRec, 'label',
                Gio.SettingsBindFlags.DEFAULT);

            //implements file folder string rec option
            this.Ref_filechooser_FileFolder = builder.get_object(
                'fcs_FilePathRec');
            this.Ref_filechooser_FileFolder.set_can_focus(false);
            this.Ref_filechooser_FileFolder.connect(
                'selection_changed', Lang.bind(this,
                    function (self) {
                        Lib.TalkativeLog('file path get from widget : ' + self.get_filename());
                        if (self.get_filename() !== null)
                            setOption(FILE_FOLDER_SETTING_KEY,
                                self.get_filename());
                    }));

            //update GSP text area and input source
            this._setStateGSP();

            //implements default button action
            this.Ref_button_SetDeafaultSettings = builder.get_object(
                'btn_DefaultOption');
            this.Ref_button_SetDeafaultSettings.connect(
                'clicked', Lang.bind(this, this._setDefaultsettings));

            //implements verbose debug option
            this.Ref_switch_VerboseDebug = builder.get_object(
                'swt_VerboseDebug');
            settings.bind(
                VERBOSE_DEBUG_SETTING_KEY, this.Ref_switch_VerboseDebug,
                'active', Gio.SettingsBindFlags.DEFAULT);

            //update list view
            this._updateRowShortcut(
                getOption('as', SHORTCUT_KEY_SETTING_KEY)[0]);

        }
    },

    _updateRowShortcut: function (accel) {
        Lib.TalkativeLog('update row combo key accel');

        let [key, mods] =
        (accel !== null) ? Gtk.accelerator_parse(accel): [0, 0];

        Lib.TalkativeLog('key ' + key + ' mods ' + mods);
        this.Ref_liststore_Shortcut.set(
            this.Iter_ShortcutRow, [SHORTCUT_COLUMN_KEY, SHORTCUT_COLUMN_MODS], [key, mods]);
    },

    _setStateGSP: function () {
        //update GSP text area
        if (getOption('b', ACTIVE_CUSTOM_GSP_SETTING_KEY)) {
            Lib.TalkativeLog('custom GSP');

            this.Ref_textedit_Pipeline.set_editable(true);
            this.Ref_textedit_Pipeline.set_cursor_visible(true);
            this.Ref_textedit_Pipeline.set_sensitive(true);

        } else {
            Lib.TalkativeLog('NOT custom GSP');

            this.Ref_textedit_Pipeline.set_editable(false);
            this.Ref_textedit_Pipeline.set_cursor_visible(false);
            this.Ref_textedit_Pipeline.set_sensitive(false);

            var audio = false;
            if (getOption('i', INPUT_AUDIO_SOURCE_SETTING_KEY) > 0) {
                audio = true;
            }
            setOption(PIPELINE_REC_SETTING_KEY, getGSPstd(audio));

        }
    },

    //function to restore default value of the settings
    _setDefaultsettings: function () {
        Lib.TalkativeLog('restore default option');

        setOption(SHOW_TIMER_REC_SETTING_KEY, true);
        setOption(SHOW_AREA_REC_SETTING_KEY, false);
        setOption(REPLACE_INDICATOR_SETTING_KEY, false);
        setOption(DRAW_CURSOR_SETTING_KEY, true);
        setOption(VERBOSE_DEBUG_SETTING_KEY, false);
        setOption(ACTIVE_CUSTOM_GSP_SETTING_KEY, false);

        setOption(FPS_SETTING_KEY, 30);
        setOption(X_POS_SETTING_KEY, 0);
        setOption(Y_POS_SETTING_KEY, 0);
        setOption(WIDTH_SETTING_KEY, 600);
        setOption(HEIGHT_SETTING_KEY, 400);

        setOption(FILE_NAME_SETTING_KEY, 'Screencast_%d_%t.webm');
        setOption(FILE_FOLDER_SETTING_KEY, '');
        setOption(ACTIVE_POST_CMD_SETTING_KEY, false);
        setOption(POST_CMD_SETTING_KEY, 'xdg-open AbsFilePath &');
        setOption(INPUT_AUDIO_SOURCE_SETTING_KEY, -1);
        setOption(AREA_SCREEN_SETTING_KEY, 0);
    }
});

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

    case 'as':
        return settings.get_strv(key);
        break;

    default:
        return 'ERROR';
    };
    return '';
}

//getter option
function getGSPstd(audio) {
    if (audio) {
        return 'queue ! videorate ! vp8enc min_quantizer=13 max_quantizer=13 cpu-used=5 deadline=1000000 threads=%T ! queue ! mux. pulsesrc ! queue ! audioconvert ! vorbisenc ! queue ! mux. webmmux name=mux ';
    } else {
        return 'vp9enc min_quantizer=13 max_quantizer=13 cpu-used=5 deadline=1000000 threads=%T ! queue ! webmmux';
    }
}

//setter option
function setOption(key, option) {
    checkSettings();

    switch (typeof (option)) {
    case 'boolean':
        settings.set_boolean(key, option);
        break;

    case 'number':
        settings.set_int(key, option);
        break;

    case 'string':
        settings.set_string(key, option);
        break;

    case 'object':
        settings.set_strv(key, option);
        break;

    default:
        return 'ERROR';
    };
    return '';
}


function checkSettings() {
    if (settings === null) {
        settings = Lib.getSettings('org.gnome.shell.extensions.EasyScreenCast');
    }
}

function buildPrefsWidget() {
    Lib.TalkativeLog('Init pref widget');

    var widget = new EasyScreenCastSettingsWidget();

    widget.show_all();

    return widget;
};
