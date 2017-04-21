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
const Settings = Me.imports.settings;


function init() {
    Lib.initTranslations('EasyScreenCast@iacopodeenosee.gmail.com');
}

const EasyScreenCastSettingsWidget = new GObject.Class({
    Name: 'EasyScreenCast.Prefs.Widget',
    GTypeName: 'EasyScreenCastSettingsWidget',
    Extends: Gtk.Box,

    _init: function(params) {
        this.parent(params);

        // creates the settings
        Settings.checkSettings();

        this.CtrlWebcam = new UtilWebcam.HelperWebcam();

        // creates the ui builder and add the main resource file
        let uiFilePath = Me.path + '/EasyScreenCast.gtkbuilder';
        let builder = new Gtk.Builder();
        builder.set_translation_domain(
            'EasyScreenCast@iacopodeenosee.gmail.com');

        if (builder.add_from_file(uiFilePath) === 0) {
            Lib.TalkativeLog('-^-could not load the ui file: ' + format(uiFilePath));

            let label = new Gtk.Label({
                label: _('Could not load the preferences UI file'),
                vexpand: true
            });

            this.pack_start(label, true, true, 0);
        } else {
            Lib.TalkativeLog('-^-UI file receive and load: ' + uiFilePath);

            // gets the interesting builder objects
            let Ref_box_MainContainer = builder.get_object('Main_Container');
            // packs the main table
            this.pack_start(Ref_box_MainContainer, true, true, 0);

            //implements show timer option
            this.Ref_switch_ShowNotifyAlert = builder.get_object(
                'swt_ShowNotifyAlert');
            Settings.settings.bind(
                Settings.SHOW_NOTIFY_ALERT_SETTING_KEY, this.Ref_switch_ShowNotifyAlert,
                'active', Gio.SettingsBindFlags.DEFAULT);

            //implements show area option
            this.Ref_switch_ShowAreaRec = builder.get_object('swt_ShowAreaRec');
            Settings.settings.bind(
                Settings.SHOW_AREA_REC_SETTING_KEY, this.Ref_switch_ShowAreaRec,
                'active', Gio.SettingsBindFlags.DEFAULT);

            //implements show indicator option
            this.Ref_combobox_IndicatorsRec = builder.get_object(
                'cbt_StatusIndicatorsRec');
            Settings.settings.bind(
                Settings.STATUS_INDICATORS_SETTING_KEY, this.Ref_combobox_IndicatorsRec,
                'active', Gio.SettingsBindFlags.DEFAULT);

            //implements draw cursor option
            this.Ref_switch_DrawCursorRec = builder.get_object(
                'swt_DrawCursorRec');
            Settings.settings.bind(
                Settings.DRAW_CURSOR_SETTING_KEY, this.Ref_switch_DrawCursorRec,
                'active', Gio.SettingsBindFlags.DEFAULT);

            //implements enable keybinding option
            this.Ref_switch_EnableShortcut = builder.get_object(
                'swt_KeyShortcut');
            Settings.settings.bind(
                Settings.ACTIVE_SHORTCUT_SETTING_KEY, this.Ref_switch_EnableShortcut,
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
                    function(renderer, path, key, mods, hwCode) {
                        Lib.TalkativeLog('-^-edited key accel');

                        let accel = Gtk.accelerator_name(key, mods);

                        this._updateRowShortcut(accel);
                        Settings.setOption(Settings.SHORTCUT_KEY_SETTING_KEY, [accel]);
                    }
                )
            );

            renderer.connect(
                "accel-cleared", Lang.bind(this,
                    function(renderer, path) {
                        Lib.TalkativeLog('-^-cleared key accel');

                        this._updateRowShortcut(null);
                        Settings.setOption(Settings.SHORTCUT_KEY_SETTING_KEY, []);
                    }
                )
            );

            let column = new Gtk.TreeViewColumn();
            column.pack_start(renderer, true);
            column.add_attribute(renderer, "accel-key", Settings.SHORTCUT_COLUMN_KEY);
            column.add_attribute(renderer, "accel-mods", Settings.SHORTCUT_COLUMN_MODS);

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
            Settings.settings.bind(
                Settings.FPS_SETTING_KEY, this.Ref_spinner_FrameRateRec, 'value',
                Gio.SettingsBindFlags.DEFAULT);

            //implements command string rec option
            this.Ref_textedit_Pipeline = builder.get_object(
                'txe_CommandStringRec');
            this.Ref_buffer_Pipeline = this.Ref_textedit_Pipeline.get_buffer();
            Settings.settings.bind(
                Settings.PIPELINE_REC_SETTING_KEY, this.Ref_buffer_Pipeline, 'text',
                Gio.SettingsBindFlags.DEFAULT);

            //implements label desciption GSP
            this.Ref_label_DescrGSP = builder.get_object(
                'lbl_GSP_Description');
            this.Ref_label_DescrGSP.set_text(UtilGSP.getDescr(
                Settings.getOption('i', Settings.QUALITY_SETTING_KEY),
                Settings.getOption('i', Settings.FILE_CONTAINER_SETTING_KEY)));

            //implements quality scale option
            this.Ref_scale_Quality = builder.get_object(
                'scl_Quality');
            this.Ref_scale_Quality.set_valign(Gtk.Align.START);
            let adjustment2 = new Gtk.Adjustment({
                value: 1,
                lower: 0,
                upper: 3,
                step_increment: 1,
                page_increment: 1
            });
            this.Ref_scale_Quality.set_adjustment(adjustment2);
            this.Ref_scale_Quality.set_digits(1);
            let ind = 0;
            for (; ind < 4; ind++) {
                this.Ref_scale_Quality.add_mark(ind,
                    Gtk.PositionType.BOTTOM, '');
            }

            this.Ref_scale_Quality.set_value(Settings.getOption(
                'i', Settings.QUALITY_SETTING_KEY));

            this.Ref_scale_Quality.connect(
                'value-changed', Lang.bind(this, function(self) {
                    Lib.TalkativeLog('-^-value quality changed : ' + self.get_value());

                    //round the value
                    var roundTmp = parseInt((self.get_value()).toFixed(0));
                    Lib.TalkativeLog('-^-value quality fixed : ' + roundTmp);

                    //update label descr GSP
                    this.Ref_label_DescrGSP.set_text(UtilGSP.getDescr(
                        roundTmp,
                        Settings.getOption('i', Settings.FILE_CONTAINER_SETTING_KEY)));

                    //update fps
                    Settings.setOption(Settings.FPS_SETTING_KEY, UtilGSP.getFps(
                        roundTmp,
                        Settings.getOption('i', Settings.FILE_CONTAINER_SETTING_KEY)));

                    self.set_value(roundTmp);

                    Settings.setOption(Settings.QUALITY_SETTING_KEY, roundTmp);
                })
            );

            //implements image for scale widget
            this.Ref_image_Performance = builder.get_object(
                'img_Performance');
            this.Ref_image_Performance.set_from_file(Lib.ESCimgPerformance);

            this.Ref_image_Quality = builder.get_object(
                'img_Quality');
            this.Ref_image_Quality.set_from_file(Lib.ESCimgQuality);

            //implements custom GSPipeline option
            this.Ref_switch_CustomGSP = builder.get_object(
                'swt_EnableCustomGSP');
            Settings.settings.bind(
                Settings.ACTIVE_CUSTOM_GSP_SETTING_KEY, this.Ref_switch_CustomGSP,
                'active', Gio.SettingsBindFlags.DEFAULT);
            this.Ref_switch_CustomGSP.connect(
                'state-set', Lang.bind(this, function(self) {
                    //update GSP text area
                    this._setStateGSP(Settings.getOption(
                        'b', Settings.ACTIVE_CUSTOM_GSP_SETTING_KEY));
                })
            );

            this.Ref_stack_Quality = builder.get_object('stk_Quality');

            //implements post execute command
            this.Ref_switch_ExecutePostCMD = builder.get_object(
                'swt_executepostcmd');
            Settings.settings.bind(
                Settings.ACTIVE_POST_CMD_SETTING_KEY, this.Ref_switch_ExecutePostCMD,
                'active', Gio.SettingsBindFlags.DEFAULT);

            this.Ref_textedit_PostCMD = builder.get_object(
                'txe_postcmd');
            Settings.settings.bind(
                Settings.POST_CMD_SETTING_KEY, this.Ref_textedit_PostCMD,
                'text', Gio.SettingsBindFlags.DEFAULT);

            //implements file name string rec option
            this.Ref_textedit_FileName = builder.get_object(
                'txe_FileNameRec');
            Settings.settings.bind(
                Settings.FILE_NAME_SETTING_KEY, this.Ref_textedit_FileName, 'text',
                Gio.SettingsBindFlags.DEFAULT);

            //implements file container option
            this.Ref_combobox_Container = builder.get_object(
                'cbt_FileContainer');
            Settings.settings.bind(
                Settings.FILE_CONTAINER_SETTING_KEY, this.Ref_combobox_Container,
                'active', Gio.SettingsBindFlags.DEFAULT);

            //implements file container option
            this.Ref_combobox_Resolution = builder.get_object(
                'cbt_FileResolution');
            Settings.settings.bind(
                Settings.FILE_RESOLUTION_SETTING_KEY, this.Ref_combobox_Resolution,
                'active', Gio.SettingsBindFlags.DEFAULT);

            //implements file folder string rec option
            this.Ref_filechooser_FileFolder = builder.get_object(
                'fcb_FilePathRec');

            //check state initial value
            var tmpFolder = Settings.getOption('s', Settings.FILE_FOLDER_SETTING_KEY);
            Lib.TalkativeLog('-^-folder for screencast: ' + tmpFolder);
            if (tmpFolder === '' ||
                tmpFolder === null ||
                tmpFolder === undefined) {
                var res = (Lib.getResultCmd(['xdg-user-dir', 'VIDEOS']))
                    .replace(/(\n)/g, "");
                if (res !== null) {
                    Lib.TalkativeLog('-^-xdg-user video: ' + res);
                    tmpFolder = res;
                } else {
                    Lib.TalkativeLog('-^-NOT SET xdg-user video');
                    tmpFolder = (Lib.getResultCmd(['echo', '$HOME']))
                        .replace(/(\n)/g, "");
                }
            }
            this.Ref_filechooser_FileFolder.set_filename(tmpFolder);

            this.Ref_filechooser_FileFolder.connect(
                'file_set', Lang.bind(this,
                    function(self) {
                        var tmpPathFolder = self.get_filename();
                        Lib.TalkativeLog('-^-file path get from widget : ' + tmpPathFolder);
                        if (tmpPathFolder !== null)
                            Settings.setOption(Settings.FILE_FOLDER_SETTING_KEY, tmpPathFolder);
                    })
            );

            //implements webcam quality option
            this.Ref_ListStore_QualityWebCam = builder.get_object(
                'liststore_QualityWebCam');
            this.Ref_TreeView_QualityWebCam = builder.get_object(
                'treeview_QualityWebam');
            //create column data
            let CapsColumn = new Gtk.TreeViewColumn({
                title: _('WebCam Caps')
            });
            let normalColumn = new Gtk.CellRendererText();
            CapsColumn.pack_start(normalColumn, true);
            CapsColumn.add_attribute(normalColumn, "text", 0);

            // insert caps column into treeview
            this.Ref_TreeView_QualityWebCam.insert_column(CapsColumn, 0);

            //setup selection liststore
            let CapsSelection = this.Ref_TreeView_QualityWebCam.get_selection();

            // connect selection signal
            CapsSelection.connect('changed', Lang.bind(this, function(self) {
                let [isSelected, model, iter] =
                self.get_selected();
                if (isSelected) {
                    let Caps = this.Ref_ListStore_QualityWebCam.get_value(iter, 0);
                    Lib.TalkativeLog('-^-treeview row selected : ' + Caps);

                    Settings.setOption(Settings.QUALITY_WEBCAM_SETTING_KEY, Caps);

                    //update label webcam caps
                    this.Ref_Label_WebCamCaps.set_ellipsize(
                        Pango.EllipsizeMode.END);
                    this.Ref_Label_WebCamCaps.set_text(Caps);
                }
            }));

            //fill combobox with quality option webcam
            this._updateWebCamCaps(Settings.getOption('i', Settings.DEVICE_WEBCAM_SETTING_KEY));

            //implements webcam corner position option
            this.Ref_combobox_CornerWebCam = builder.get_object(
                'cbt_WebCamCorner');
            Settings.settings.bind(
                Settings.CORNER_POSITION_WEBCAM_SETTING_KEY, this.Ref_combobox_CornerWebCam,
                'active', Gio.SettingsBindFlags.DEFAULT);

            //implements webcam margin x position option
            this.Ref_Spinner_MarginXWebCam = builder.get_object(
                'spb_WebCamMarginX');
            let adjustmentMarginX = new Gtk.Adjustment({
                value: 0,
                lower: 0,
                upper: 10000,
                step_increment: 1,
                page_increment: 10
            });
            this.Ref_Spinner_MarginXWebCam.configure(adjustmentMarginX, 10, 0);
            Settings.settings.bind(
                Settings.MARGIN_X_WEBCAM_SETTING_KEY, this.Ref_Spinner_MarginXWebCam,
                'value',
                Gio.SettingsBindFlags.DEFAULT);

            //implements webcam margin y position option
            this.Ref_Spinner_MarginYWebCam = builder.get_object(
                'spb_WebCamMarginY');
            let adjustmentMarginY = new Gtk.Adjustment({
                value: 0,
                lower: 0,
                upper: 10000,
                step_increment: 1,
                page_increment: 10
            });
            this.Ref_Spinner_MarginYWebCam.configure(adjustmentMarginY, 10, 0);
            Settings.settings.bind(
                Settings.MARGIN_Y_WEBCAM_SETTING_KEY, this.Ref_Spinner_MarginYWebCam,
                'value',
                Gio.SettingsBindFlags.DEFAULT);

            //implements webcam aplha channel option
            this.Ref_Spinner_AlphaWebCam = builder.get_object(
                'spb_WebCamAlpha');
            let adjustmentAlpha = new Gtk.Adjustment({
                value: 0.01,
                lower: 0.00,
                upper: 1.00,
                step_increment: 0.05,
                page_increment: 0.25
            });
            this.Ref_Spinner_AlphaWebCam.configure(adjustmentAlpha, 0.25, 2);
            Settings.settings.bind(
                Settings.ALPHA_CHANNEL_WEBCAM_SETTING_KEY, this.Ref_Spinner_AlphaWebCam,
                'value',
                Gio.SettingsBindFlags.DEFAULT);

            //implements webcam type unit dimension option
            this.Ref_combobox_TypeUnitWebCam = builder.get_object(
                'cbt_WebCamUnitMeasure');
            Settings.settings.bind(
                Settings.TYPE_UNIT_WEBCAM_SETTING_KEY, this.Ref_combobox_TypeUnitWebCam,
                'active', Gio.SettingsBindFlags.DEFAULT);

            //implements webcam width option
            this.Ref_Spinner_WidthWebCam = builder.get_object(
                'spb_WebCamWidth');
            let adjustmentWidth = new Gtk.Adjustment({
                value: 20,
                lower: 0,
                upper: 10000,
                step_increment: 1,
                page_increment: 10
            });
            this.Ref_Spinner_WidthWebCam.configure(adjustmentWidth, 10, 0);
            Settings.settings.bind(
                Settings.WIDTH_WEBCAM_SETTING_KEY, this.Ref_Spinner_WidthWebCam,
                'value',
                Gio.SettingsBindFlags.DEFAULT);

            //implements webcam heigth option
            this.Ref_Spinner_HeightWebCam = builder.get_object(
                'spb_WebCamHeight');
            let adjustmentHeight = new Gtk.Adjustment({
                value: 10,
                lower: 0,
                upper: 10000,
                step_increment: 1,
                page_increment: 10
            });
            this.Ref_Spinner_HeightWebCam.configure(adjustmentHeight, 10, 0);
            Settings.settings.bind(
                Settings.HEIGHT_WEBCAM_SETTING_KEY, this.Ref_Spinner_HeightWebCam,
                'value',
                Gio.SettingsBindFlags.DEFAULT);

            //implements webcam stack menu chooser
            this.Ref_StackSwitcher_WebCam = builder.get_object(
                'sts_Webcam');
            //implements webcam stack obj
            this.Ref_StackObj_WebCam = builder.get_object(
                'stk_Webcam');
            //implements webcam stack menu chooser
            this.Ref_Label_WebCam = builder.get_object(
                'lbl_Webcam');
            //implements webcam caps stack menu chooser
            this.Ref_Label_WebCamCaps = builder.get_object(
                'lbl_WebcamCaps');

            //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

            //update GSP area
            this._setStateGSP(!Settings.getOption('b', Settings.ACTIVE_CUSTOM_GSP_SETTING_KEY));

            //implements default button action
            this.Ref_button_SetDeafaultSettings = builder.get_object(
                'btn_DefaultOption');
            this.Ref_button_SetDeafaultSettings.connect(
                'clicked', Lang.bind(this, this._setDefaultsettings));

            //implements verbose debug option
            this.Ref_switch_VerboseDebug = builder.get_object(
                'swt_VerboseDebug');
            Settings.settings.bind(
                Settings.VERBOSE_DEBUG_SETTING_KEY, this.Ref_switch_VerboseDebug,
                'active', Gio.SettingsBindFlags.DEFAULT);

            //update list view
            this._updateRowShortcut(
                Settings.getOption('as', Settings.SHORTCUT_KEY_SETTING_KEY)[0]);

            //update webcam widget state
            this._updateStateWebcamOptions();

            //connect keywebcam signal
            Settings.settings.connect('changed::' + Settings.DEVICE_WEBCAM_SETTING_KEY,
                Lang.bind(this, function() {
                    Lib.TalkativeLog('-^-webcam device changed');

                    this._updateStateWebcamOptions();
                })
            );
        }
    },

    _updateWebCamCaps: function(device) {
        if (device > 0) {
            Lib.TalkativeLog('-^-webcam device: ' + device);

            var listCaps = this.CtrlWebcam.getListCapsDevice(device - 1);
            Lib.TalkativeLog('-^-webcam caps: ' + listCaps.length);
            if (listCaps !== null && listCaps !== undefined) {
                for (var index in listCaps) {
                    this.Ref_ListStore_QualityWebCam.set(
                        this.Ref_ListStore_QualityWebCam.append(), [0], [listCaps[index]]);
                }
            } else {
                Lib.TalkativeLog('-^-NO List Caps Webcam');
                this.Ref_ListStore_QualityWebCam.clear();
                Settings.setOption(Settings.QUALITY_WEBCAM_SETTING_KEY, '');
            }
        } else {
            Lib.TalkativeLog('-^-NO Webcam recording');
            this.Ref_ListStore_QualityWebCam.clear();
            Settings.setOption(Settings.QUALITY_WEBCAM_SETTING_KEY, '');
        }
    },

    _updateRowShortcut: function(accel) {
        Lib.TalkativeLog('-^-update row combo key accel');

        let [key, mods] =
        (accel !== null) ? Gtk.accelerator_parse(accel): [0, 0];

        Lib.TalkativeLog('-^-key ' + key + ' mods ' + mods);
        this.Ref_liststore_Shortcut.set(
            this.Iter_ShortcutRow, [Settings.SHORTCUT_COLUMN_KEY, Settings.SHORTCUT_COLUMN_MODS], [key, mods]);
    },

    _setStateGSP: function(active) {
        //update GSP text area
        if (!active) {
            Lib.TalkativeLog('-^-custom GSP');

            this.Ref_stack_Quality.set_visible_child_name('pg_Custom');

            Settings.setOption(Settings.FPS_SETTING_KEY, 30);

        } else {
            Lib.TalkativeLog('-^-NOT custom GSP');

            this.Ref_stack_Quality.set_visible_child_name('pg_Preset');

            var audio = false;
            if (Settings.getOption('i', Settings.INPUT_AUDIO_SOURCE_SETTING_KEY) > 0) {
                audio = true;
            }
            Settings.setOption(Settings.PIPELINE_REC_SETTING_KEY, Settings.getGSPstd(audio));

        }
    },

    _updateStateWebcamOptions: function() {
        Lib.TalkativeLog('-^-update webcam option widgets');

        var tmpDev = Settings.getOption('i', Settings.DEVICE_WEBCAM_SETTING_KEY);
        this._updateWebCamCaps(tmpDev);
        if (tmpDev > 0) {
            var arrDev = this.CtrlWebcam.getNameDevices();
            this.Ref_Label_WebCam.set_text(arrDev[tmpDev - 1]);

            //setup label webcam caps
            var tmpCaps = Settings.getOption('s', Settings.QUALITY_WEBCAM_SETTING_KEY);
            if (tmpCaps === '') {
                //this.Ref_Label_WebCamCaps.use_markup(true);
                this.Ref_Label_WebCamCaps.set_markup(
                    _('<span foreground="red">No Caps selected, please select one from the caps list</span>'));
            } else {
                this.Ref_Label_WebCamCaps.set_text(tmpCaps);
            }

            //webcam recording show widget
            this.Ref_StackSwitcher_WebCam.set_sensitive(true);
            this.Ref_StackObj_WebCam.set_sensitive(true);
        } else {
            this.Ref_Label_WebCam.set_text(
                _('No webcam device selected'));
            //setup label webcam caps
            this.Ref_Label_WebCamCaps.set_text(_('-'));
            //webcam NOT recording hide widget
            this.Ref_StackSwitcher_WebCam.set_sensitive(false);
            this.Ref_StackObj_WebCam.set_sensitive(false);
        }
    },

    //function to restore default value of the settings
    _setDefaultsettings: function() {
        Lib.TalkativeLog('-^-restore default option');

        Settings.setOption(Settings.SHOW_NOTIFY_ALERT_SETTING_KEY, true);
        Settings.setOption(Settings.SHOW_AREA_REC_SETTING_KEY, false);
        Settings.setOption(Settings.STATUS_INDICATORS_SETTING_KEY, 1);
        Settings.setOption(Settings.DRAW_CURSOR_SETTING_KEY, true);
        Settings.setOption(Settings.VERBOSE_DEBUG_SETTING_KEY, false);
        Settings.setOption(Settings.ACTIVE_CUSTOM_GSP_SETTING_KEY, false);

        Settings.setOption(Settings.FPS_SETTING_KEY, 30);
        Settings.setOption(Settings.X_POS_SETTING_KEY, 0);
        Settings.setOption(Settings.Y_POS_SETTING_KEY, 0);
        Settings.setOption(Settings.WIDTH_SETTING_KEY, 600);
        Settings.setOption(Settings.HEIGHT_SETTING_KEY, 400);

        Settings.setOption(Settings.FILE_NAME_SETTING_KEY, 'Screencast_%d_%t');
        Settings.setOption(Settings.FILE_FOLDER_SETTING_KEY, '');
        Settings.setOption(Settings.ACTIVE_POST_CMD_SETTING_KEY, false);
        Settings.setOption(Settings.POST_CMD_SETTING_KEY, 'xdg-open _fpath &');
        Settings.setOption(Settings.INPUT_AUDIO_SOURCE_SETTING_KEY, 0);
        Settings.setOption(Settings.DEVICE_WEBCAM_SETTING_KEY, 0);

        Settings.setOption(Settings.TIME_DELAY_SETTING_KEY, 0);
        Settings.setOption(Settings.FILE_CONTAINER_SETTING_KEY, 0);
        Settings.setOption(Settings.FILE_RESOLUTION_SETTING_KEY, 0);
        Settings.setOption(Settings.QUALITY_SETTING_KEY, 1);
        Settings.setOption(Settings.QUALITY_WEBCAM_SETTING_KEY, '');
        Settings.setOption(Settings.WIDTH_WEBCAM_SETTING_KEY, 20);
        Settings.setOption(Settings.HEIGHT_WEBCAM_SETTING_KEY, 10);
        Settings.setOption(Settings.TYPE_UNIT_WEBCAM_SETTING_KEY, 0);
        Settings.setOption(Settings.MARGIN_X_WEBCAM_SETTING_KEY, 0);
        Settings.setOption(Settings.MARGIN_Y_WEBCAM_SETTING_KEY, 0);
        Settings.setOption(Settings.ALPHA_CHANNEL_WEBCAM_SETTING_KEY, 0.75);
        Settings.setOption(Settings.CORNER_POSITION_WEBCAM_SETTING_KEY, 0);
    }
});

function buildPrefsWidget() {
    Lib.TalkativeLog('-^-Init pref widget');

    var widget = new EasyScreenCastSettingsWidget();

    widget.show_all();

    return widget;
}
