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

const GIRepository = imports.gi.GIRepository;
GIRepository.Repository.prepend_search_path("/usr/lib64/gnome-shell");
GIRepository.Repository.prepend_library_path("/usr/lib64/gnome-shell");

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Pango = imports.gi.Pango;
const Lang = imports.lang;

const Gettext = imports.gettext.domain(
    "EasyScreenCast@iacopodeenosee.gmail.com"
);
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Lib = Me.imports.convenience;
const UtilWebcam = Me.imports.utilwebcam;
const UtilGSP = Me.imports.utilgsp;
const Settings = Me.imports.settings;
const UtilExeCmd = Me.imports.utilexecmd;

function init() {
    Lib.initTranslations("EasyScreenCast@iacopodeenosee.gmail.com");
}

const EasyScreenCastSettingsWidget = new GObject.Class({
    Name: "EasyScreenCast.Prefs.Widget",
    GTypeName: "EasyScreenCastSettingsWidget",
    Extends: Gtk.Box,

    /**
     * Init class
     *
     * @param {array} params
     * @private
     */
    _init: function (params) {
        this.parent(params);

        // creates the settings
        Settings.checkSettings();
        this.CtrlExe = new UtilExeCmd.ExecuteStuff(this);
        this.CtrlWebcam = new UtilWebcam.HelperWebcam();

        // creates the ui builder and add the main resource file
        let uiFilePath = Me.path + "/Options_UI.glade";
        let builder = new Gtk.Builder();
        builder.set_translation_domain(
            "EasyScreenCast@iacopodeenosee.gmail.com"
        );

        if (builder.add_from_file(uiFilePath) === 0) {
            Lib.TalkativeLog(
                "-^-could not load the ui file: " + format(uiFilePath)
            );
            let label = new Gtk.Label({
                label: _("Could not load the preferences UI file"),
                vexpand: true,
            });

            this.pack_start(label, true, true, 0);
        } else {
            Lib.TalkativeLog("-^-UI file receive and load: " + uiFilePath);

            // gets the interesting builder objects
            let Ref_box_MainContainer = builder.get_object("Main_Container");
            // packs the main table
            this.pack_start(Ref_box_MainContainer, true, true, 0);

            // setup tab options
            this._initTabOptions(this, builder, Settings.settings);

            // setup tab quality
            this._initTabQuality(this, builder, Settings.settings);

            // setup tab webcam
            this._initTabWebcam(this, builder, Settings.settings);

            // setup tab file
            this._initTabFile(this, builder, Settings.settings);

            // setup tab support
            this._initTabSupport(this, builder, Settings.settings);

            // setup tab info
            this._initTabInfo(this, builder);

            //@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

            //update GSP area
            this._setStateGSP(
                !Settings.getOption("b", Settings.ACTIVE_CUSTOM_GSP_SETTING_KEY)
            );

            //update list view
            this._updateRowShortcut(
                Settings.getOption("as", Settings.SHORTCUT_KEY_SETTING_KEY)[0]
            );

            //update webcam widget state
            this._updateStateWebcamOptions();

            //connect keywebcam signal
            Settings.settings.connect(
                "changed::" + Settings.DEVICE_WEBCAM_SETTING_KEY,
                () => {
                    Lib.TalkativeLog("-^-webcam device changed");

                    this._updateStateWebcamOptions();
                }
            );
        }
    },

    /**
     * @param ctx
     * @param gtkDB
     * @param tmpS
     * @private
     */
    _initTabOptions(ctx, gtkDB, tmpS) {
        //implements show timer option
        let Ref_switch_ShowNotifyAlert = gtkDB.get_object(
            "swt_ShowNotifyAlert"
        );
        tmpS.bind(
            Settings.SHOW_NOTIFY_ALERT_SETTING_KEY,
            Ref_switch_ShowNotifyAlert,
            "active",
            Gio.SettingsBindFlags.DEFAULT
        );

        //implements show area option
        let Ref_switch_ShowAreaRec = gtkDB.get_object("swt_ShowAreaRec");
        tmpS.bind(
            Settings.SHOW_AREA_REC_SETTING_KEY,
            Ref_switch_ShowAreaRec,
            "active",
            Gio.SettingsBindFlags.DEFAULT
        );

        //implements show indicator option
        let Ref_combobox_IndicatorsRec = gtkDB.get_object(
            "cbt_StatusIndicatorsRec"
        );
        tmpS.bind(
            Settings.STATUS_INDICATORS_SETTING_KEY,
            Ref_combobox_IndicatorsRec,
            "active",
            Gio.SettingsBindFlags.DEFAULT
        );

        //implements draw cursor option
        let Ref_switch_DrawCursorRec = gtkDB.get_object("swt_DrawCursorRec");
        tmpS.bind(
            Settings.DRAW_CURSOR_SETTING_KEY,
            Ref_switch_DrawCursorRec,
            "active",
            Gio.SettingsBindFlags.DEFAULT
        );

        //implements enable keybinding option
        let Ref_switch_EnableShortcut = gtkDB.get_object("swt_KeyShortcut");
        tmpS.bind(
            Settings.ACTIVE_SHORTCUT_SETTING_KEY,
            Ref_switch_EnableShortcut,
            "active",
            Gio.SettingsBindFlags.DEFAULT
        );

        //implements selecting alternative key combo
        let Ref_treeview_Shortcut = gtkDB.get_object("treeview_KeyShortcut");
        Ref_treeview_Shortcut.set_sensitive(true);
        ctx.Ref_liststore_Shortcut = gtkDB.get_object("liststore_KeyShortcut");
        ctx.Iter_ShortcutRow = ctx.Ref_liststore_Shortcut.append();

        let renderer = new Gtk.CellRendererAccel({
            editable: true,
        });
        renderer.connect(
            "accel-edited",
            (renderer, path, key, mods, hwCode) => {
                Lib.TalkativeLog("-^-edited key accel");

                let accel = Gtk.accelerator_name(key, mods);

                ctx._updateRowShortcut(accel);
                Settings.setOption(Settings.SHORTCUT_KEY_SETTING_KEY, [accel]);
            }
        );

        renderer.connect("accel-cleared", (renderer, path) => {
            Lib.TalkativeLog("-^-cleared key accel");

            ctx._updateRowShortcut(null);
            Settings.setOption(Settings.SHORTCUT_KEY_SETTING_KEY, []);
        });

        let column = new Gtk.TreeViewColumn();
        column.pack_start(renderer, true);
        column.add_attribute(
            renderer,
            "accel-key",
            Settings.SHORTCUT_COLUMN_KEY
        );
        column.add_attribute(
            renderer,
            "accel-mods",
            Settings.SHORTCUT_COLUMN_MODS
        );

        Ref_treeview_Shortcut.append_column(column);

        //implements post execute command
        let Ref_switch_ExecutePostCMD = gtkDB.get_object("swt_executepostcmd");
        tmpS.bind(
            Settings.ACTIVE_POST_CMD_SETTING_KEY,
            Ref_switch_ExecutePostCMD,
            "active",
            Gio.SettingsBindFlags.DEFAULT
        );

        let Ref_textedit_PostCMD = gtkDB.get_object("txe_postcmd");
        tmpS.bind(
            Settings.POST_CMD_SETTING_KEY,
            Ref_textedit_PostCMD,
            "text",
            Gio.SettingsBindFlags.DEFAULT
        );

        //implements pre execute command
        let Ref_switch_ExecutePreCMD = gtkDB.get_object("swt_executeprecmd");
        tmpS.bind(
            Settings.ACTIVE_PRE_CMD_SETTING_KEY,
            Ref_switch_ExecutePreCMD,
            "active",
            Gio.SettingsBindFlags.DEFAULT
        );

        let Ref_textedit_PreCMD = gtkDB.get_object("txe_precmd");
        tmpS.bind(
            Settings.PRE_CMD_SETTING_KEY,
            Ref_textedit_PreCMD,
            "text",
            Gio.SettingsBindFlags.DEFAULT
        );
    },

    /**
     * @param ctx
     * @param gtkDB
     * @param tmpS
     * @private
     */
    _initTabQuality(ctx, gtkDB, tmpS) {
        //implements FPS option
        let Ref_spinner_FrameRateRec = gtkDB.get_object("spb_FrameRateRec");
        // Create an adjustment to use for the second spinbutton
        let adjustment1 = new Gtk.Adjustment({
            value: 30,
            lower: 1,
            upper: 666,
            step_increment: 1,
            page_increment: 10,
        });
        Ref_spinner_FrameRateRec.configure(adjustment1, 10, 0);
        tmpS.bind(
            Settings.FPS_SETTING_KEY,
            Ref_spinner_FrameRateRec,
            "value",
            Gio.SettingsBindFlags.DEFAULT
        );

        //implements command string rec option
        let Ref_textedit_Pipeline = gtkDB.get_object("txe_CommandStringRec");
        let Ref_buffer_Pipeline = Ref_textedit_Pipeline.get_buffer();
        tmpS.bind(
            Settings.PIPELINE_REC_SETTING_KEY,
            Ref_buffer_Pipeline,
            "text",
            Gio.SettingsBindFlags.DEFAULT
        );

        //implements label desciption GSP
        let Ref_label_DescrGSP = gtkDB.get_object("lbl_GSP_Description");
        Ref_label_DescrGSP.set_text(
            UtilGSP.getDescr(
                Settings.getOption("i", Settings.QUALITY_SETTING_KEY),
                Settings.getOption("i", Settings.FILE_CONTAINER_SETTING_KEY)
            )
        );

        //implements quality scale option
        let Ref_scale_Quality = gtkDB.get_object("scl_Quality");
        Ref_scale_Quality.set_valign(Gtk.Align.START);
        let adjustment2 = new Gtk.Adjustment({
            value: 1,
            lower: 0,
            upper: 3,
            step_increment: 1,
            page_increment: 1,
        });
        Ref_scale_Quality.set_adjustment(adjustment2);
        Ref_scale_Quality.set_digits(1);
        let ind = 0;
        for (; ind < 4; ind++) {
            Ref_scale_Quality.add_mark(ind, Gtk.PositionType.BOTTOM, "");
        }

        Ref_scale_Quality.set_value(
            Settings.getOption("i", Settings.QUALITY_SETTING_KEY)
        );

        Ref_scale_Quality.connect("notify::value", (self) => {
            Lib.TalkativeLog("-^-value quality changed : " + self.get_value());

            //round the value
            var roundTmp = parseInt(self.get_value().toFixed(0));
            Lib.TalkativeLog("-^-value quality fixed : " + roundTmp);

            //update label descr GSP
            Ref_label_DescrGSP.set_text(
                UtilGSP.getDescr(
                    roundTmp,
                    Settings.getOption("i", Settings.FILE_CONTAINER_SETTING_KEY)
                )
            );

            //update fps
            Settings.setOption(
                Settings.FPS_SETTING_KEY,
                UtilGSP.getFps(
                    roundTmp,
                    Settings.getOption("i", Settings.FILE_CONTAINER_SETTING_KEY)
                )
            );

            self.set_value(roundTmp);

            Settings.setOption(Settings.QUALITY_SETTING_KEY, roundTmp);
        });

        //implements image for scale widget
        let Ref_image_Performance = gtkDB.get_object("img_Performance");
        Ref_image_Performance.set_from_file(Lib.ESCimgPerformance);

        let Ref_image_Quality = gtkDB.get_object("img_Quality");
        Ref_image_Quality.set_from_file(Lib.ESCimgQuality);

        //implements custom GSPipeline option
        let Ref_switch_CustomGSP = gtkDB.get_object("swt_EnableCustomGSP");
        tmpS.bind(
            Settings.ACTIVE_CUSTOM_GSP_SETTING_KEY,
            Ref_switch_CustomGSP,
            "active",
            Gio.SettingsBindFlags.DEFAULT
        );
        Ref_switch_CustomGSP.connect("state-set", (self) => {
            //update GSP text area
            ctx._setStateGSP(
                Settings.getOption("b", Settings.ACTIVE_CUSTOM_GSP_SETTING_KEY)
            );
        });

        ctx.Ref_stack_Quality = gtkDB.get_object("stk_Quality");
    },

    /**
     * @param ctx
     * @param gtkDB
     * @param tmpS
     * @private
     */
    _initTabWebcam(ctx, gtkDB, tmpS) {
        //implements webcam quality option
        ctx.Ref_ListStore_QualityWebCam = gtkDB.get_object(
            "liststore_QualityWebCam"
        );
        let Ref_TreeView_QualityWebCam = gtkDB.get_object(
            "treeview_QualityWebam"
        );
        //create column data
        let CapsColumn = new Gtk.TreeViewColumn({
            title: _("WebCam Caps"),
        });
        let normalColumn = new Gtk.CellRendererText();
        CapsColumn.pack_start(normalColumn, true);
        CapsColumn.add_attribute(normalColumn, "text", 0);

        // insert caps column into treeview
        Ref_TreeView_QualityWebCam.insert_column(CapsColumn, 0);

        //setup selection liststore
        let CapsSelection = Ref_TreeView_QualityWebCam.get_selection();

        // connect selection signal
        CapsSelection.connect("changed", (self) => {
            let [isSelected, model, iter] = self.get_selected();
            if (isSelected) {
                let Caps = ctx.Ref_ListStore_QualityWebCam.get_value(iter, 0);
                Lib.TalkativeLog("-^-treeview row selected : " + Caps);

                Settings.setOption(Settings.QUALITY_WEBCAM_SETTING_KEY, Caps);

                //update label webcam caps
                ctx.Ref_Label_WebCamCaps.set_ellipsize(Pango.EllipsizeMode.END);
                ctx.Ref_Label_WebCamCaps.set_text(Caps);
            }
        });

        //fill combobox with quality option webcam
        ctx._updateWebCamCaps(
            Settings.getOption("i", Settings.DEVICE_WEBCAM_SETTING_KEY)
        );

        //implements webcam corner position option
        let Ref_combobox_CornerWebCam = gtkDB.get_object("cbt_WebCamCorner");
        tmpS.bind(
            Settings.CORNER_POSITION_WEBCAM_SETTING_KEY,
            Ref_combobox_CornerWebCam,
            "active",
            Gio.SettingsBindFlags.DEFAULT
        );

        //implements webcam margin x position option
        let Ref_Spinner_MarginXWebCam = gtkDB.get_object("spb_WebCamMarginX");
        let adjustmentMarginX = new Gtk.Adjustment({
            value: 0,
            lower: 0,
            upper: 10000,
            step_increment: 1,
            page_increment: 10,
        });
        Ref_Spinner_MarginXWebCam.configure(adjustmentMarginX, 10, 0);
        tmpS.bind(
            Settings.MARGIN_X_WEBCAM_SETTING_KEY,
            Ref_Spinner_MarginXWebCam,
            "value",
            Gio.SettingsBindFlags.DEFAULT
        );

        //implements webcam margin y position option
        let Ref_Spinner_MarginYWebCam = gtkDB.get_object("spb_WebCamMarginY");
        let adjustmentMarginY = new Gtk.Adjustment({
            value: 0,
            lower: 0,
            upper: 10000,
            step_increment: 1,
            page_increment: 10,
        });
        Ref_Spinner_MarginYWebCam.configure(adjustmentMarginY, 10, 0);
        tmpS.bind(
            Settings.MARGIN_Y_WEBCAM_SETTING_KEY,
            Ref_Spinner_MarginYWebCam,
            "value",
            Gio.SettingsBindFlags.DEFAULT
        );

        //implements webcam aplha channel option
        let Ref_Spinner_AlphaWebCam = gtkDB.get_object("spb_WebCamAlpha");
        let adjustmentAlpha = new Gtk.Adjustment({
            value: 0.01,
            lower: 0.0,
            upper: 1.0,
            step_increment: 0.05,
            page_increment: 0.25,
        });
        Ref_Spinner_AlphaWebCam.configure(adjustmentAlpha, 0.25, 2);
        tmpS.bind(
            Settings.ALPHA_CHANNEL_WEBCAM_SETTING_KEY,
            Ref_Spinner_AlphaWebCam,
            "value",
            Gio.SettingsBindFlags.DEFAULT
        );

        //implements webcam type unit dimension option
        let Ref_combobox_TypeUnitWebCam = gtkDB.get_object(
            "cbt_WebCamUnitMeasure"
        );
        tmpS.bind(
            Settings.TYPE_UNIT_WEBCAM_SETTING_KEY,
            Ref_combobox_TypeUnitWebCam,
            "active",
            Gio.SettingsBindFlags.DEFAULT
        );

        //implements webcam width option
        let Ref_Spinner_WidthWebCam = gtkDB.get_object("spb_WebCamWidth");
        let adjustmentWidth = new Gtk.Adjustment({
            value: 20,
            lower: 0,
            upper: 10000,
            step_increment: 1,
            page_increment: 10,
        });
        Ref_Spinner_WidthWebCam.configure(adjustmentWidth, 10, 0);
        tmpS.bind(
            Settings.WIDTH_WEBCAM_SETTING_KEY,
            Ref_Spinner_WidthWebCam,
            "value",
            Gio.SettingsBindFlags.DEFAULT
        );

        //implements webcam heigth option
        let Ref_Spinner_HeightWebCam = gtkDB.get_object("spb_WebCamHeight");
        let adjustmentHeight = new Gtk.Adjustment({
            value: 10,
            lower: 0,
            upper: 10000,
            step_increment: 1,
            page_increment: 10,
        });
        Ref_Spinner_HeightWebCam.configure(adjustmentHeight, 10, 0);
        tmpS.bind(
            Settings.HEIGHT_WEBCAM_SETTING_KEY,
            Ref_Spinner_HeightWebCam,
            "value",
            Gio.SettingsBindFlags.DEFAULT
        );

        //implements webcam stack menu chooser
        ctx.Ref_StackSwitcher_WebCam = gtkDB.get_object("sts_Webcam");
        //implements webcam stack obj
        ctx.Ref_StackObj_WebCam = gtkDB.get_object("stk_Webcam");
        //implements webcam stack menu chooser
        ctx.Ref_Label_WebCam = gtkDB.get_object("lbl_Webcam");
        //implements webcam caps stack menu chooser
        ctx.Ref_Label_WebCamCaps = gtkDB.get_object("lbl_WebcamCaps");
    },

    /**
     * @param ctx
     * @param gtkDB
     * @param tmpS
     * @private
     */
    _initTabFile(ctx, gtkDB, tmpS) {
        //implements file name string rec option
        let Ref_textedit_FileName = gtkDB.get_object("txe_FileNameRec");
        tmpS.bind(
            Settings.FILE_NAME_SETTING_KEY,
            Ref_textedit_FileName,
            "text",
            Gio.SettingsBindFlags.DEFAULT
        );

        //implements file container option
        let Ref_combobox_Container = gtkDB.get_object("cbt_FileContainer");
        tmpS.bind(
            Settings.FILE_CONTAINER_SETTING_KEY,
            Ref_combobox_Container,
            "active",
            Gio.SettingsBindFlags.DEFAULT
        );

        //implements file stack resolution
        let Ref_stack_FileResolution = gtkDB.get_object("stk_FileResolution");

        //implements file container resolution
        let Ref_stackswitcher_FileResolution = gtkDB.get_object(
            "sts_FileResolution"
        );

        //implements file resolution preset spinner
        let Ref_combobox_Resolution = gtkDB.get_object("cbt_FileResolution");
        tmpS.bind(
            Settings.FILE_RESOLUTION_TYPE_SETTING_KEY,
            Ref_combobox_Resolution,
            "active",
            Gio.SettingsBindFlags.DEFAULT
        );

        //intercept combobox res changed and update width/height value
        Ref_combobox_Resolution.connect("changed", (self) => {
            var activeRes = self.active;
            Lib.TalkativeLog("-^-preset combobox changed: " + activeRes);
            if (activeRes >= 0 && activeRes < 15) {
                var [h, w] = ctx._getResolutionPreset(activeRes);

                //update width/height
                Settings.setOption(
                    Settings.FILE_RESOLUTION_HEIGHT_SETTING_KEY,
                    h
                );
                Settings.setOption(
                    Settings.FILE_RESOLUTION_WIDTH_SETTING_KEY,
                    w
                );
                Lib.TalkativeLog("-^-Res changed h: " + h + " w: " + w);
            }
        });

        //load file resolution pref and upadte UI
        var tmpRes = Settings.getOption(
            "i",
            Settings.FILE_RESOLUTION_TYPE_SETTING_KEY
        );
        if (tmpRes < 0) {
            Ref_stack_FileResolution.set_visible_child_name("native");
        } else if (tmpRes === 999) {
            Ref_stack_FileResolution.set_visible_child_name("custom");
        } else {
            Ref_stack_FileResolution.set_visible_child_name("preset");
        }

        //setup event on stack switcher
        Ref_stackswitcher_FileResolution.connect("event", () => {
            Lib.TalkativeLog("-^-stack_FR event grab");
            var page = Ref_stack_FileResolution.get_visible_child_name();
            Lib.TalkativeLog("-^-active page -> " + page);

            if (page === "native") {
                //set option to -1
                Settings.setOption(
                    Settings.FILE_RESOLUTION_TYPE_SETTING_KEY,
                    -1
                );
            } else if (page === "preset") {
                //set option to fullHD 16:9
                Settings.setOption(
                    Settings.FILE_RESOLUTION_TYPE_SETTING_KEY,
                    8
                );
            } else if (page === "custom") {
                //set option to 99
                Settings.setOption(
                    Settings.FILE_RESOLUTION_TYPE_SETTING_KEY,
                    999
                );
            } else {
                Lib.TalkativeLog("-^-page error");
            }
        });

        //implements file width option
        let Ref_Spinner_WidthRes = gtkDB.get_object("spb_ResWidth");
        let adjustmentResWidth = new Gtk.Adjustment({
            value: 640,
            lower: 640,
            upper: 3840,
            step_increment: 1,
            page_increment: 100,
        });
        Ref_Spinner_WidthRes.configure(adjustmentResWidth, 10, 0);
        tmpS.bind(
            Settings.FILE_RESOLUTION_WIDTH_SETTING_KEY,
            Ref_Spinner_WidthRes,
            "value",
            Gio.SettingsBindFlags.DEFAULT
        );

        //implements file heigth option
        let Ref_Spinner_HeightRes = gtkDB.get_object("spb_ResHeight");
        let adjustmentResHeight = new Gtk.Adjustment({
            value: 480,
            lower: 480,
            upper: 2160,
            step_increment: 1,
            page_increment: 100,
        });
        Ref_Spinner_HeightRes.configure(adjustmentResHeight, 10, 0);
        tmpS.bind(
            Settings.FILE_RESOLUTION_HEIGHT_SETTING_KEY,
            Ref_Spinner_HeightRes,
            "value",
            Gio.SettingsBindFlags.DEFAULT
        );

        //implements keep aspect ratio check box
        let Ref_checkbox_KAR = gtkDB.get_object("chb_FileResolution_kar");
        tmpS.bind(
            Settings.FILE_RESOLUTION_KAR_SETTING_KEY,
            Ref_checkbox_KAR,
            "active",
            Gio.SettingsBindFlags.DEFAULT
        );

        //implements resolution width scale option
        let Ref_scale_WidthRes = gtkDB.get_object("scl_ResWidth");
        Ref_scale_WidthRes.set_valign(Gtk.Align.START);
        Ref_scale_WidthRes.set_adjustment(adjustmentResWidth);
        Ref_scale_WidthRes.set_digits(0);
        Ref_scale_WidthRes.set_value(
            Settings.getOption("i", Settings.FILE_RESOLUTION_WIDTH_SETTING_KEY)
        );

        //implements resolution height scale option
        let Ref_scale_HeightRes = gtkDB.get_object("scl_ResHeight");
        Ref_scale_HeightRes.set_valign(Gtk.Align.START);
        Ref_scale_HeightRes.set_adjustment(adjustmentResHeight);
        Ref_scale_HeightRes.set_digits(0);
        Ref_scale_HeightRes.set_value(
            Settings.getOption("i", Settings.FILE_RESOLUTION_HEIGHT_SETTING_KEY)
        );

        // add marks on width/height file resolution
        let ind = 0;
        for (; ind < 13; ind++) {
            var [h, w] = ctx._getResolutionPreset(ind);
            Ref_scale_WidthRes.add_mark(w, Gtk.PositionType.BOTTOM, "");

            Ref_scale_HeightRes.add_mark(h, Gtk.PositionType.BOTTOM, "");
        }

        //implements file folder string rec option
        let Ref_filechooser_FileFolder = gtkDB.get_object("fcb_FilePathRec");
        //check state initial value
        var tmpFolder = Settings.getOption(
            "s",
            Settings.FILE_FOLDER_SETTING_KEY
        );
        Lib.TalkativeLog("-^-folder for screencast: " + tmpFolder);
        if (tmpFolder === "" || tmpFolder === null || tmpFolder === undefined) {
            let result = null;
            ctx.CtrlExe.Execute(
                "xdg-user-dir VIDEOS",
                true,
                (success, out) => {
                    Lib.TalkativeLog(
                        "-^-CALLBACK sync S: " + success + " out: " + out
                    );
                    if (success && out !== "" && out !== undefined) {
                        result = out.replace(/(\n)/g, "");
                    }
                },
                null
            );

            if (result !== null) {
                Lib.TalkativeLog("-^-xdg-user video: " + result);
                tmpFolder = result;
            } else {
                Lib.TalkativeLog("-^-NOT SET xdg-user video");

                ctx.CtrlExe.Execute(
                    '/usr/bin/sh -c "echo $HOME"',
                    true,
                    (success, out) => {
                        Lib.TalkativeLog(
                            "-^-CALLBACK sync S: " + success + " out: " + out
                        );
                        if (success && out !== "" && out !== undefined) {
                            tmpFolder = out.replace(/(\n)/g, "");
                        }
                    },
                    null
                );
            }

            //connect keywebcam signal
            Settings.settings.connect(
                "changed::" + Settings.DEVICE_WEBCAM_SETTING_KEY,
                Lang.bind(this, function () {
                    Lib.TalkativeLog("-^-webcam device changed");
                    this._refreshWebcamOptions();
                })
            );
        }
        Ref_filechooser_FileFolder.set_filename(tmpFolder);

        Ref_filechooser_FileFolder.connect("file_set", (self) => {
            var tmpPathFolder = self.get_filename();
            Lib.TalkativeLog("-^-file path get from widget : " + tmpPathFolder);
            if (tmpPathFolder !== null) {
                Settings.setOption(
                    Settings.FILE_FOLDER_SETTING_KEY,
                    tmpPathFolder
                );
            }
        });
    },

    /**
     * @param ctx
     * @param gtkDB
     * @param tmpS
     * @private
     */
    _initTabSupport(ctx, gtkDB, tmpS) {
        //implements textentry log
        let Ref_TextView_ESCLog = gtkDB.get_object("txe_ContainerLog");
        let Ref_buffer_Log = Ref_TextView_ESCLog.get_buffer();

        //implements verbose debug option
        let Ref_switch_VerboseDebug = gtkDB.get_object("swt_VerboseDebug");
        tmpS.bind(
            Settings.VERBOSE_DEBUG_SETTING_KEY,
            Ref_switch_VerboseDebug,
            "active",
            Gio.SettingsBindFlags.DEFAULT
        );

        Ref_switch_VerboseDebug.connect("state-set", (self) => {
            //update log display widgets
            Ref_TextView_ESCLog.sensistive = self.active;
            Ref_combobox_LogChooser.sensitive = self.active;
        });

        //implements file resolution preset spinner
        let Ref_combobox_LogChooser = gtkDB.get_object("cbt_LogChooser");

        //intercept combobox res changed and update width/height value
        Ref_combobox_LogChooser.connect("changed", (self) => {
            const activeLog = self.active;
            Lib.TalkativeLog("-^-log combobox changed: " + activeLog);
            switch (activeLog) {
                case 0:
                    //clear buffer
                    Ref_buffer_Log.delete(
                        Ref_buffer_Log.get_start_iter(),
                        Ref_buffer_Log.get_end_iter()
                    );

                    ctx.CtrlExe.Execute(
                        'journalctl --since "15 min ago" --output=cat --no-pager',
                        false,
                        (success) => {
                            Lib.TalkativeLog("-^-CALLBACK async S= " + success);
                        },
                        (line) => {
                            let esc = line.indexOf("[ESC]");
                            if (
                                line !== "" &&
                                line !== undefined &&
                                esc !== -1
                            ) {
                                line += "\n";
                                Ref_buffer_Log.insert(
                                    Ref_buffer_Log.get_end_iter(),
                                    line,
                                    line.length
                                );
                            }
                        }
                    );
                    break;
                case 1:
                    //clear buffer
                    Ref_buffer_Log.delete(
                        Ref_buffer_Log.get_start_iter(),
                        Ref_buffer_Log.get_end_iter()
                    );

                    ctx.CtrlExe.Execute(
                        'journalctl --since "15 min ago" --output=cat --no-pager',
                        false,
                        (success) => {
                            Lib.TalkativeLog("-^-CALLBACK async S= " + success);
                            if (success) {
                                if (Ref_buffer_Log.get_line_count() > 0) {
                                    let strNOgsp = _(
                                        "No Gstreamer pipeline found"
                                    );
                                    Ref_buffer_Log.insert(
                                        Ref_buffer_Log.get_end_iter(),
                                        strNOgsp,
                                        strNOgsp.length
                                    );
                                }
                            }
                        },
                        (line) => {
                            let esc = line.indexOf("-§-final GSP :");
                            if (
                                line !== "" &&
                                line !== undefined &&
                                esc !== -1
                            ) {
                                line += "\n";
                                Ref_buffer_Log.insert(
                                    Ref_buffer_Log.get_end_iter(),
                                    line,
                                    line.length
                                );
                            }
                        }
                    );
                    break;
                case 2:
                    //clear buffer
                    Ref_buffer_Log.delete(
                        Ref_buffer_Log.get_start_iter(),
                        Ref_buffer_Log.get_end_iter()
                    );

                    ctx.CtrlExe.Execute(
                        'journalctl /usr/bin/gnome-shell --since "15 min ago" --output=cat --no-pager',
                        false,
                        (success) => {
                            Lib.TalkativeLog("-^-CALLBACK async S= " + success);
                        },
                        (line) => {
                            if (line !== "" && line !== undefined) {
                                line += "\n";
                                Ref_buffer_Log.insert(
                                    Ref_buffer_Log.get_end_iter(),
                                    line,
                                    line.length
                                );
                            }
                        }
                    );
                    break;
                default:
                    break;
            }
        });

        //update state of get log
        Ref_combobox_LogChooser.sensistive = Settings.getOption(
            "b",
            Settings.VERBOSE_DEBUG_SETTING_KEY
        );

        //implements default button action
        let Ref_button_SetDeafaultSettings = gtkDB.get_object(
            "btn_DefaultOption"
        );
        Ref_button_SetDeafaultSettings.connect("clicked", () =>
            ctx._setDefaultsettings()
        );
    },

    /**
     * @param ctx
     * @param gtkDB
     * @private
     */
    _initTabInfo(ctx, gtkDB) {
        //implements info img extension
        let Ref_image_ESC = gtkDB.get_object("img_ESC");
        Ref_image_ESC.set_from_file(Lib.ESCimgInfo);

        //implements info version label
        let Ref_Label_Version = gtkDB.get_object("lbl_Version");
        Ref_Label_Version.set_markup(
            _("Version: ") +
                '<span color="blue">' +
                Me.metadata.version +
                "</span>"
        );
    },

    /**
     * @param device
     * @private
     */
    _updateWebCamCaps: function (device) {
        Lib.TalkativeLog("-^-webcam device: " + device);

        if (device > 0) {
            this._initializeWebcamHelper();
            var listCaps = this.CtrlWebcam.getListCapsDevice(device - 1);
            Lib.TalkativeLog("-^-webcam caps: " + listCaps.length);
            if (listCaps !== null && listCaps !== undefined) {
                for (var index in listCaps) {
                    this.Ref_ListStore_QualityWebCam.set(
                        this.Ref_ListStore_QualityWebCam.append(),
                        [0],
                        [listCaps[index]]
                    );
                }
            } else {
                Lib.TalkativeLog("-^-NO List Caps Webcam");
                this.Ref_ListStore_QualityWebCam.clear();
                Settings.setOption(Settings.QUALITY_WEBCAM_SETTING_KEY, "");
            }
        } else {
            Lib.TalkativeLog("-^-NO Webcam recording");
            this.Ref_ListStore_QualityWebCam.clear();
            Settings.setOption(Settings.QUALITY_WEBCAM_SETTING_KEY, "");
        }
    },

    /**
     * Refreshes the webcam settings.
     *
     * @private
     */
    _refreshWebcamOptions: function () {
        Lib.TalkativeLog("-^-refresh webcam options");
        this._initializeWebcamHelper();

        //fill combobox with quality option webcam
        this._updateWebCamCaps(
            Settings.getOption("i", Settings.DEVICE_WEBCAM_SETTING_KEY)
        );

        //update webcam widget state
        this._updateStateWebcamOptions();
    },

    /**
     * Initializes this.CtrlWebcam if it is null.
     *
     * @private
     */
    _initializeWebcamHelper: function () {
        if (this.CtrlWebcam === null) {
            this.CtrlWebcam = new UtilWebcam.HelperWebcam();
        }
    },

    /**
     * @param accel
     * @private
     */
    _updateRowShortcut: function (accel) {
        Lib.TalkativeLog("-^-update row combo key accel");

        let [key, mods] =
            accel !== null ? Gtk.accelerator_parse(accel) : [0, 0];

        Lib.TalkativeLog("-^-key " + key + " mods " + mods);
        this.Ref_liststore_Shortcut.set(
            this.Iter_ShortcutRow,
            [Settings.SHORTCUT_COLUMN_KEY, Settings.SHORTCUT_COLUMN_MODS],
            [key, mods]
        );
    },

    /**
     * @param active
     * @private
     */
    _setStateGSP: function (active) {
        //update GSP text area
        if (!active) {
            Lib.TalkativeLog("-^-custom GSP");

            this.Ref_stack_Quality.set_visible_child_name("pg_Custom");
        } else {
            Lib.TalkativeLog("-^-NOT custom GSP");

            this.Ref_stack_Quality.set_visible_child_name("pg_Preset");

            var audio = false;
            if (
                Settings.getOption(
                    "i",
                    Settings.INPUT_AUDIO_SOURCE_SETTING_KEY
                ) > 0
            ) {
                audio = true;
            }
            Settings.setOption(
                Settings.PIPELINE_REC_SETTING_KEY,
                Settings.getGSPstd(audio)
            );
        }
    },

    /**
     * @private
     */
    _updateStateWebcamOptions: function () {
        Lib.TalkativeLog("-^-update webcam option widgets");

        var tmpDev = Settings.getOption(
            "i",
            Settings.DEVICE_WEBCAM_SETTING_KEY
        );
        this._updateWebCamCaps(tmpDev);
        if (tmpDev > 0) {
            var arrDev = this.CtrlWebcam.getNameDevices();
            this.Ref_Label_WebCam.set_text(arrDev[tmpDev - 1]);

            //setup label webcam caps
            var tmpCaps = Settings.getOption(
                "s",
                Settings.QUALITY_WEBCAM_SETTING_KEY
            );
            if (tmpCaps === "") {
                this.Ref_Label_WebCamCaps.use_markup = true;
                this.Ref_Label_WebCamCaps.set_markup(
                    _(
                        '<span foreground="red">No Caps selected, please select one from the caps list</span>'
                    )
                );
            } else {
                this.Ref_Label_WebCamCaps.set_text(tmpCaps);
            }

            //webcam recording show widget
            this.Ref_StackSwitcher_WebCam.set_sensitive(true);
            this.Ref_StackObj_WebCam.set_sensitive(true);
        } else {
            this.Ref_Label_WebCam.set_text(_("No webcam device selected"));
            //setup label webcam caps
            this.Ref_Label_WebCamCaps.set_text(_("-"));
            //webcam NOT recording hide widget
            this.Ref_StackSwitcher_WebCam.set_sensitive(false);
            this.Ref_StackObj_WebCam.set_sensitive(false);
        }
    },

    /**
     * @param index
     * @return {array}
     * @private
     */
    _getResolutionPreset(index) {
        var arrRes = [
            [480, 640],
            [480, 854],
            [600, 800],
            [720, 960],
            [720, 1280],
            [768, 1024],
            [768, 1366],
            [1024, 1280],
            [1080, 1920],
            [1200, 1600],
            [1440, 2560],
            [2048, 2560],
            [2160, 3840],
        ];
        if (index >= 0 && index < arrRes.length) {
            return arrRes[index];
        } else {
            return null;
        }
    },

    /**
     * function to restore default value of the settings
     *
     * @private
     */
    _setDefaultsettings: function () {
        Lib.TalkativeLog("-^-restore default option");

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

        Settings.setOption(Settings.FILE_NAME_SETTING_KEY, "Screencast_%d_%t");
        Settings.setOption(Settings.FILE_FOLDER_SETTING_KEY, "");
        Settings.setOption(Settings.ACTIVE_POST_CMD_SETTING_KEY, false);
        Settings.setOption(Settings.ACTIVE_PRE_CMD_SETTING_KEY, false);
        Settings.setOption(Settings.POST_CMD_SETTING_KEY, "xdg-open _fpath &");
        Settings.setOption(Settings.INPUT_AUDIO_SOURCE_SETTING_KEY, 0);
        Settings.setOption(Settings.DEVICE_WEBCAM_SETTING_KEY, 0);

        Settings.setOption(Settings.TIME_DELAY_SETTING_KEY, 0);
        Settings.setOption(Settings.FILE_CONTAINER_SETTING_KEY, 0);
        Settings.setOption(Settings.FILE_RESOLUTION_TYPE_SETTING_KEY, -1);
        Settings.setOption(Settings.QUALITY_SETTING_KEY, 1);
        Settings.setOption(Settings.QUALITY_WEBCAM_SETTING_KEY, "");
        Settings.setOption(Settings.WIDTH_WEBCAM_SETTING_KEY, 20);
        Settings.setOption(Settings.HEIGHT_WEBCAM_SETTING_KEY, 10);
        Settings.setOption(Settings.TYPE_UNIT_WEBCAM_SETTING_KEY, 0);
        Settings.setOption(Settings.MARGIN_X_WEBCAM_SETTING_KEY, 0);
        Settings.setOption(Settings.MARGIN_Y_WEBCAM_SETTING_KEY, 0);
        Settings.setOption(Settings.ALPHA_CHANNEL_WEBCAM_SETTING_KEY, 0.75);
        Settings.setOption(Settings.CORNER_POSITION_WEBCAM_SETTING_KEY, 0);
    },
});

/**
 * @return {GObject.Class}
 */
function buildPrefsWidget() {
    Lib.TalkativeLog("-^-Init pref widget");

    var widget = new EasyScreenCastSettingsWidget();

    widget.show_all();

    return widget;
}
