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

import Adw from 'gi://Adw';
import GObject from 'gi://GObject';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import Gdk from 'gi://Gdk';
import Pango from 'gi://Pango';

import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import * as Lib from './convenience.js';
import * as UtilWebcam from './utilwebcam.js';
import * as UtilGSP from './utilgsp.js';
import * as Settings from './settings.js';
import * as UtilExeCmd from './utilexecmd.js';

const EasyScreenCastSettingsWidget = GObject.registerClass({
    GTypeName: 'EasyScreenCast_SettingsWidget',
}, class EasyScreenCastSettingsWidget extends Gtk.Box {
    /**
     * @param {ExtensionPreferences} prefs the prefs instance
     */
    constructor(prefs) {
        super();

        this._prefs = prefs;
        this._settings = new Settings.Settings(this._prefs.getSettings());
        Lib.setDebugEnabled(this._settings.getOption('b', Settings.VERBOSE_DEBUG_SETTING_KEY));
        this.CtrlExe = new UtilExeCmd.ExecuteStuff(this);
        this.CtrlWebcam = new UtilWebcam.HelperWebcam(_('Unspecified webcam'));

        let cssProvider = new Gtk.CssProvider();
        cssProvider.load_from_path(`${prefs.path}/prefs.css`);
        Gtk.StyleContext.add_provider_for_display(
            Gdk.Display.get_default(),
            cssProvider,
            Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);

        // creates the ui builder and add the main resource file
        let uiFilePath = `${this._prefs.path}/Options_UI.glade`;
        let builder = new Gtk.Builder();
        builder.set_translation_domain(this._prefs.metadata['gettext-domain']);

        if (builder.add_from_file(uiFilePath) === 0) {
            Lib.TalkativeLog(`-^-could not load the ui file: ${uiFilePath}`);
            let label = new Gtk.Label({
                label: _('Could not load the preferences UI file'),
                vexpand: true,
            });

            this.append(label);
        } else {
            Lib.TalkativeLog(`-^-UI file receive and load: ${uiFilePath}`);

            // gets the interesting builder objects
            let refBoxMainContainer = builder.get_object('Main_Container');
            this.append(refBoxMainContainer);

            // setup tab options
            this._initTabOptions(this, builder, this._settings._settings);

            // setup tab quality
            this._initTabQuality(this, builder, this._settings._settings);

            // setup tab webcam
            this._initTabWebcam(this, builder, this._settings._settings);

            // setup tab file
            this._initTabFile(this, builder, this._settings._settings);

            // setup tab support
            this._initTabSupport(this, builder, this._settings._settings);

            // setup tab info
            this._initTabInfo(this, builder);

            // @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

            // update GSP area
            this._setStateGSP(
                !this._settings.getOption('b', Settings.ACTIVE_CUSTOM_GSP_SETTING_KEY)
            );

            // update list view
            this._updateRowShortcut(
                this._settings.getOption('as', Settings.SHORTCUT_KEY_SETTING_KEY)[0]
            );

            // update webcam widget state
            this._updateStateWebcamOptions();

            // connect keywebcam signal
            this._settings._settings.connect(
                `changed::${Settings.DEVICE_INDEX_WEBCAM_SETTING_KEY}`,
                () => {
                    Lib.TalkativeLog('-^-webcam device changed');

                    this._updateStateWebcamOptions();
                }
            );
        }
    }

    /**
     * @param {EasyScreenCastSettingsWidget} ctx the prefs/settings widget
     * @param {Gtk.Builder} gtkDB the builder that loaded the UI glade file
     * @param {Gio.Settings} tmpS the current settings
     * @private
     */
    _initTabOptions(ctx, gtkDB, tmpS) {
        // implements show timer option
        let refSwitchShowNotifyAlert = gtkDB.get_object('swt_ShowNotifyAlert');
        tmpS.bind(
            Settings.SHOW_NOTIFY_ALERT_SETTING_KEY,
            refSwitchShowNotifyAlert,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

        // implements show area option
        let refSwitchShowAreaRec = gtkDB.get_object('swt_ShowAreaRec');
        tmpS.bind(
            Settings.SHOW_AREA_REC_SETTING_KEY,
            refSwitchShowAreaRec,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

        // implements show indicator option
        let refComboboxIndicatorsRec = gtkDB.get_object('cbt_StatusIndicatorsRec');
        tmpS.bind(
            Settings.STATUS_INDICATORS_SETTING_KEY,
            refComboboxIndicatorsRec,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

        // implements draw cursor option
        let refSwitchDrawCursorRec = gtkDB.get_object('swt_DrawCursorRec');
        tmpS.bind(
            Settings.DRAW_CURSOR_SETTING_KEY,
            refSwitchDrawCursorRec,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

        // implements enable keybinding option
        let refSwitchEnableShortcut = gtkDB.get_object('swt_KeyShortcut');
        tmpS.bind(
            Settings.ACTIVE_SHORTCUT_SETTING_KEY,
            refSwitchEnableShortcut,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

        // implements selecting alternative key combo
        let refTreeviewShortcut = gtkDB.get_object('treeview_KeyShortcut');
        refTreeviewShortcut.set_sensitive(true);
        ctx.Ref_liststore_Shortcut = gtkDB.get_object('liststore_KeyShortcut');
        ctx.Iter_ShortcutRow = ctx.Ref_liststore_Shortcut.append();

        let renderer = new Gtk.CellRendererAccel({
            editable: true,
        });
        renderer.connect(
            'accel-edited',
            (_0, _1, key, mods, _2) => {
                Lib.TalkativeLog(`-^-edited key accel: key=${key} mods=${mods}`);

                let accel = Gtk.accelerator_name(key, mods);

                ctx._updateRowShortcut(accel);
                this._settings.setOption(Settings.SHORTCUT_KEY_SETTING_KEY, [accel]);
            }
        );

        renderer.connect('accel-cleared', () => {
            Lib.TalkativeLog('-^-cleared key accel');

            ctx._updateRowShortcut(null);
            this._settings.setOption(Settings.SHORTCUT_KEY_SETTING_KEY, []);
        });

        let column = new Gtk.TreeViewColumn();
        column.pack_start(renderer, true);
        column.add_attribute(
            renderer,
            'accel-key',
            Settings.SHORTCUT_COLUMN_KEY
        );
        column.add_attribute(
            renderer,
            'accel-mods',
            Settings.SHORTCUT_COLUMN_MODS
        );

        refTreeviewShortcut.append_column(column);

        // implements post execute command
        let refSwitchExecutePostCmd = gtkDB.get_object('swt_executepostcmd');
        tmpS.bind(
            Settings.ACTIVE_POST_CMD_SETTING_KEY,
            refSwitchExecutePostCmd,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

        let refTexteditPostCmd = gtkDB.get_object('txe_postcmd');
        tmpS.bind(
            Settings.POST_CMD_SETTING_KEY,
            refTexteditPostCmd,
            'text',
            Gio.SettingsBindFlags.DEFAULT
        );

        // implements pre execute command
        let refSwitchExecutePreCmd = gtkDB.get_object('swt_executeprecmd');
        tmpS.bind(
            Settings.ACTIVE_PRE_CMD_SETTING_KEY,
            refSwitchExecutePreCmd,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

        let refTexteditPreCmd = gtkDB.get_object('txe_precmd');
        tmpS.bind(
            Settings.PRE_CMD_SETTING_KEY,
            refTexteditPreCmd,
            'text',
            Gio.SettingsBindFlags.DEFAULT
        );
    }

    /**
     * @param {EasyScreenCastSettingsWidget} ctx the prefs/settings widget
     * @param {Gtk.Builder} gtkDB the builder that loaded the UI glade file
     * @param {Gio.Settings} tmpS the current settings
     * @private
     */
    _initTabQuality(ctx, gtkDB, tmpS) {
        // implements FPS option
        let refSpinnerFrameRateRec = gtkDB.get_object('spb_FrameRateRec');
        // Create an adjustment to use for the second spinbutton
        let adjustment1 = new Gtk.Adjustment({
            value: 30,
            lower: 1,
            upper: 666,
            step_increment: 1,
            page_increment: 10,
        });
        refSpinnerFrameRateRec.configure(adjustment1, 10, 0);
        tmpS.bind(
            Settings.FPS_SETTING_KEY,
            refSpinnerFrameRateRec,
            'value',
            Gio.SettingsBindFlags.DEFAULT
        );

        // implements command string rec option
        let refTexteditPipeline = gtkDB.get_object('txe_CommandStringRec');
        let refBufferPipeline = refTexteditPipeline.get_buffer();
        tmpS.bind(
            Settings.PIPELINE_REC_SETTING_KEY,
            refBufferPipeline,
            'text',
            Gio.SettingsBindFlags.DEFAULT
        );

        // implements label description GSP
        let refLabelDescGSP = gtkDB.get_object('lbl_GSP_Description');
        refLabelDescGSP.set_text(
            UtilGSP.getDescr(
                this._settings.getOption('i', Settings.QUALITY_SETTING_KEY),
                this._settings.getOption('i', Settings.FILE_CONTAINER_SETTING_KEY)
            )
        );
        // update label description when container selection changed
        this._settings._settings.connect(`changed::${Settings.FILE_CONTAINER_SETTING_KEY}`, () => {
            Lib.TalkativeLog('-^- new setting for file container, update gps description');
            refLabelDescGSP.set_text(
                UtilGSP.getDescr(
                    this._settings.getOption('i', Settings.QUALITY_SETTING_KEY),
                    this._settings.getOption('i', Settings.FILE_CONTAINER_SETTING_KEY)
                )
            );
        });


        // implements quality scale option
        let refScaleQuality = gtkDB.get_object('scl_Quality');
        refScaleQuality.set_valign(Gtk.Align.START);
        let adjustment2 = new Gtk.Adjustment({
            value: 1,
            lower: 0,
            upper: 3,
            step_increment: 1,
            page_increment: 1,
        });
        refScaleQuality.set_adjustment(adjustment2);
        refScaleQuality.set_digits(1);
        let ind = 0;
        for (; ind < 4; ind++)
            refScaleQuality.add_mark(ind, Gtk.PositionType.BOTTOM, '');


        refScaleQuality.set_value(
            this._settings.getOption('i', Settings.QUALITY_SETTING_KEY)
        );

        let oldQualityValue = refScaleQuality.get_value();
        refScaleQuality.connect('value-changed', self => {
            // not logging by default - it's too much
            // Lib.TalkativeLog(`-^-value quality changed : ${self.get_value()}`);

            // round the value
            let roundTmp = parseInt(self.get_value().toFixed(0));
            // not logging by default - it's too much
            // Lib.TalkativeLog(`-^-value quality fixed : ${roundTmp}`);

            self.set_value(roundTmp);

            // only update labels for real changes
            if (oldQualityValue !== roundTmp) {
                oldQualityValue = roundTmp;
                this._settings.setOption(Settings.QUALITY_SETTING_KEY, roundTmp);

                // update label descr GSP
                refLabelDescGSP.set_text(
                    UtilGSP.getDescr(
                        roundTmp,
                        this._settings.getOption('i', Settings.FILE_CONTAINER_SETTING_KEY)
                    )
                );

                // update fps
                this._settings.setOption(
                    Settings.FPS_SETTING_KEY,
                    UtilGSP.getFps(
                        roundTmp,
                        this._settings.getOption('i', Settings.FILE_CONTAINER_SETTING_KEY)
                    )
                );
            }
        });

        // implements image for scale widget
        let refImagePerformance = gtkDB.get_object('img_Performance');
        refImagePerformance.set_from_file(Lib.getImagePath(this._prefs.dir, 'Icon_Performance.svg'));

        let refImageQuality = gtkDB.get_object('img_Quality');
        refImageQuality.set_from_file(Lib.getImagePath(this._prefs.dir, 'Icon_Quality.svg'));

        // implements custom GSPipeline option
        let refSwitchCustomGSP = gtkDB.get_object('swt_EnableCustomGSP');
        tmpS.bind(
            Settings.ACTIVE_CUSTOM_GSP_SETTING_KEY,
            refSwitchCustomGSP,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );
        refSwitchCustomGSP.connect('state-set', () => {
            // update GSP text area
            ctx._setStateGSP(this._settings.getOption('b', Settings.ACTIVE_CUSTOM_GSP_SETTING_KEY));
        });

        ctx.Ref_stack_Quality = gtkDB.get_object('stk_Quality');
    }

    /**
     * @param {EasyScreenCastSettingsWidget} ctx the prefs/settings widget
     * @param {Gtk.Builder} gtkDB the builder that loaded the UI glade file
     * @param {Gio.Settings} tmpS the current settings
     * @private
     */
    _initTabWebcam(ctx, gtkDB, tmpS) {
        // implements webcam quality option: Type: GtkListStore
        ctx.Ref_ListStore_QualityWebCam = gtkDB.get_object(
            'liststore_QualityWebCam'
        );
        let refTreeViewQualityWebCam = gtkDB.get_object(
            'treeview_QualityWebam'
        );
        // create column data
        let capsColumn = new Gtk.TreeViewColumn({
            title: _('WebCam Caps'),
        });
        let normalColumn = new Gtk.CellRendererText();
        capsColumn.pack_start(normalColumn, true);
        capsColumn.add_attribute(normalColumn, 'text', 0);

        // insert caps column into treeview
        refTreeViewQualityWebCam.insert_column(capsColumn, 0);

        // setup selection liststore
        let capsSelection = refTreeViewQualityWebCam.get_selection();

        // connect selection signal
        capsSelection.connect('changed', self => {
            let [isSelected,, iter] = self.get_selected();
            if (isSelected) {
                let Caps = ctx.Ref_ListStore_QualityWebCam.get_value(iter, 0);
                Lib.TalkativeLog(`-^-treeview row selected : ${Caps}`);

                this._settings.setOption(Settings.QUALITY_WEBCAM_SETTING_KEY, Caps);

                // update label webcam caps
                ctx.Ref_Label_WebCamCaps.set_ellipsize(Pango.EllipsizeMode.END);
                ctx.Ref_Label_WebCamCaps.set_text(Caps);
            }
        });

        // fill combobox with quality option webcam
        ctx._updateWebCamCaps(this._settings.getOption('i', Settings.DEVICE_INDEX_WEBCAM_SETTING_KEY));

        // implements webcam corner position option
        let refComboboxCornerWebCam = gtkDB.get_object('cbt_WebCamCorner');
        tmpS.bind(
            Settings.CORNER_POSITION_WEBCAM_SETTING_KEY,
            refComboboxCornerWebCam,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

        // implements webcam margin x position option
        let refSpinnerMarginXWebCam = gtkDB.get_object('spb_WebCamMarginX');
        let adjustmentMarginX = new Gtk.Adjustment({
            value: 0,
            lower: 0,
            upper: 10000,
            step_increment: 1,
            page_increment: 10,
        });
        refSpinnerMarginXWebCam.configure(adjustmentMarginX, 10, 0);
        tmpS.bind(
            Settings.MARGIN_X_WEBCAM_SETTING_KEY,
            refSpinnerMarginXWebCam,
            'value',
            Gio.SettingsBindFlags.DEFAULT
        );

        // implements webcam margin y position option
        let refSpinnerMarginYWebCam = gtkDB.get_object('spb_WebCamMarginY');
        let adjustmentMarginY = new Gtk.Adjustment({
            value: 0,
            lower: 0,
            upper: 10000,
            step_increment: 1,
            page_increment: 10,
        });
        refSpinnerMarginYWebCam.configure(adjustmentMarginY, 10, 0);
        tmpS.bind(
            Settings.MARGIN_Y_WEBCAM_SETTING_KEY,
            refSpinnerMarginYWebCam,
            'value',
            Gio.SettingsBindFlags.DEFAULT
        );

        // implements webcam aplha channel option
        let refSpinnerAlphaWebCam = gtkDB.get_object('spb_WebCamAlpha');
        let adjustmentAlpha = new Gtk.Adjustment({
            value: 0.01,
            lower: 0.0,
            upper: 1.0,
            step_increment: 0.05,
            page_increment: 0.25,
        });
        refSpinnerAlphaWebCam.configure(adjustmentAlpha, 0.25, 2);
        tmpS.bind(
            Settings.ALPHA_CHANNEL_WEBCAM_SETTING_KEY,
            refSpinnerAlphaWebCam,
            'value',
            Gio.SettingsBindFlags.DEFAULT
        );

        // implements webcam type unit dimension option
        let refComboboxTypeUnitWebCam = gtkDB.get_object('cbt_WebCamUnitMeasure');
        tmpS.bind(
            Settings.TYPE_UNIT_WEBCAM_SETTING_KEY,
            refComboboxTypeUnitWebCam,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

        // implements webcam width option
        let refSpinnerWidthWebCam = gtkDB.get_object('spb_WebCamWidth');
        let adjustmentWidth = new Gtk.Adjustment({
            value: 20,
            lower: 0,
            upper: 10000,
            step_increment: 1,
            page_increment: 10,
        });
        refSpinnerWidthWebCam.configure(adjustmentWidth, 10, 0);
        tmpS.bind(
            Settings.WIDTH_WEBCAM_SETTING_KEY,
            refSpinnerWidthWebCam,
            'value',
            Gio.SettingsBindFlags.DEFAULT
        );

        // implements webcam heigth option
        let refSpinnerHeightWebCam = gtkDB.get_object('spb_WebCamHeight');
        let adjustmentHeight = new Gtk.Adjustment({
            value: 10,
            lower: 0,
            upper: 10000,
            step_increment: 1,
            page_increment: 10,
        });
        refSpinnerHeightWebCam.configure(adjustmentHeight, 10, 0);
        tmpS.bind(
            Settings.HEIGHT_WEBCAM_SETTING_KEY,
            refSpinnerHeightWebCam,
            'value',
            Gio.SettingsBindFlags.DEFAULT
        );

        // implements webcam stack menu chooser
        ctx.Ref_StackSwitcher_WebCam = gtkDB.get_object('sts_Webcam');
        // implements webcam stack obj
        ctx.Ref_StackObj_WebCam = gtkDB.get_object('stk_Webcam');
        // implements webcam stack menu chooser
        ctx.Ref_Label_WebCam = gtkDB.get_object('lbl_Webcam');
        // implements webcam caps stack menu chooser
        ctx.Ref_Label_WebCamCaps = gtkDB.get_object('lbl_WebcamCaps');
    }

    /**
     * @param {EasyScreenCastSettingsWidget} ctx the prefs/settings widget
     * @param {Gtk.Builder} gtkDB the builder that loaded the UI glade file
     * @param {Gio.Settings} tmpS the current settings
     * @private
     */
    _initTabFile(ctx, gtkDB, tmpS) {
        // implements file name string rec option
        let refTexteditFileName = gtkDB.get_object('txe_FileNameRec');
        tmpS.bind(
            Settings.FILE_NAME_SETTING_KEY,
            refTexteditFileName,
            'text',
            Gio.SettingsBindFlags.DEFAULT
        );

        // implements file container option
        let refComboboxContainer = gtkDB.get_object('cbt_FileContainer');
        tmpS.bind(
            Settings.FILE_CONTAINER_SETTING_KEY,
            refComboboxContainer,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

        // implements file container resolution
        let refStackFileResolution = gtkDB.get_object('stk_FileResolution');

        // implements file resolution preset spinner
        let refComboboxResolution = gtkDB.get_object('cbt_FileResolution');
        tmpS.bind(
            Settings.FILE_RESOLUTION_TYPE_SETTING_KEY,
            refComboboxResolution,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

        // intercept combobox res changed and update width/height value
        refComboboxResolution.connect('changed', self => {
            var activeRes = self.active;
            Lib.TalkativeLog(`-^-preset combobox changed: ${activeRes}`);
            if (activeRes >= 0 && activeRes < 15) {
                var [h, w] = ctx._getResolutionPreset(activeRes);

                // update width/height
                this._settings.setOption(Settings.FILE_RESOLUTION_HEIGHT_SETTING_KEY, h);
                this._settings.setOption(Settings.FILE_RESOLUTION_WIDTH_SETTING_KEY, w);
                Lib.TalkativeLog(`-^-Res changed h: ${h} w: ${w}`);
            }
        });

        // load file resolution pref and upadte UI
        var tmpRes = this._settings.getOption('i', Settings.FILE_RESOLUTION_TYPE_SETTING_KEY);
        if (tmpRes < 0)
            refStackFileResolution.set_visible_child_name('native');
        else if (tmpRes === 999)
            refStackFileResolution.set_visible_child_name('custom');
        else
            refStackFileResolution.set_visible_child_name('preset');


        // setup event on stack switcher
        refStackFileResolution.connect('notify::visible-child-name', () => {
            Lib.TalkativeLog('-^-stack_FR event grab');
            var page = refStackFileResolution.get_visible_child_name();
            Lib.TalkativeLog(`-^-active page -> ${page}`);

            if (page === 'native') {
                // set option to -1
                this._settings.setOption(Settings.FILE_RESOLUTION_TYPE_SETTING_KEY, -1);
            } else if (page === 'preset') {
                // set option to fullHD 16:9
                this._settings.setOption(Settings.FILE_RESOLUTION_TYPE_SETTING_KEY, 8);
            } else if (page === 'custom') {
                // set option to 99
                this._settings.setOption(Settings.FILE_RESOLUTION_TYPE_SETTING_KEY, 999);
            } else {
                Lib.TalkativeLog('-^-page error');
            }
        });

        // implements file width option
        let refSpinnerWidthRes = gtkDB.get_object('spb_ResWidth');
        let adjustmentResWidth = new Gtk.Adjustment({
            value: 640,
            lower: 640,
            upper: 3840,
            step_increment: 1,
            page_increment: 100,
        });
        refSpinnerWidthRes.configure(adjustmentResWidth, 10, 0);
        tmpS.bind(
            Settings.FILE_RESOLUTION_WIDTH_SETTING_KEY,
            refSpinnerWidthRes,
            'value',
            Gio.SettingsBindFlags.DEFAULT
        );

        // implements file heigth option
        let refSpinnerHeightRes = gtkDB.get_object('spb_ResHeight');
        let adjustmentResHeight = new Gtk.Adjustment({
            value: 480,
            lower: 480,
            upper: 2160,
            step_increment: 1,
            page_increment: 100,
        });
        refSpinnerHeightRes.configure(adjustmentResHeight, 10, 0);
        tmpS.bind(
            Settings.FILE_RESOLUTION_HEIGHT_SETTING_KEY,
            refSpinnerHeightRes,
            'value',
            Gio.SettingsBindFlags.DEFAULT
        );

        // implements keep aspect ratio check box
        let refCheckboxKeepAspectRatio = gtkDB.get_object('chb_FileResolution_kar');
        tmpS.bind(
            Settings.FILE_RESOLUTION_KAR_SETTING_KEY,
            refCheckboxKeepAspectRatio,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );

        // implements resolution width scale option
        let refScaleWidthRes = gtkDB.get_object('scl_ResWidth');
        refScaleWidthRes.set_valign(Gtk.Align.START);
        refScaleWidthRes.set_adjustment(adjustmentResWidth);
        refScaleWidthRes.set_digits(0);
        refScaleWidthRes.set_value(this._settings.getOption('i', Settings.FILE_RESOLUTION_WIDTH_SETTING_KEY));

        // implements resolution height scale option
        let refScaleHeightRes = gtkDB.get_object('scl_ResHeight');
        refScaleHeightRes.set_valign(Gtk.Align.START);
        refScaleHeightRes.set_adjustment(adjustmentResHeight);
        refScaleHeightRes.set_digits(0);
        refScaleHeightRes.set_value(this._settings.getOption('i', Settings.FILE_RESOLUTION_HEIGHT_SETTING_KEY));

        // add marks on width/height file resolution
        let ind = 0;
        for (; ind < 13; ind++) {
            var [h, w] = ctx._getResolutionPreset(ind);
            refScaleWidthRes.add_mark(w, Gtk.PositionType.BOTTOM, '');
            refScaleHeightRes.add_mark(h, Gtk.PositionType.BOTTOM, '');
        }

        // implements file folder string rec option
        let refFilechooserFileFolder = gtkDB.get_object('fcb_FilePathRec');
        // check state initial value
        var tmpFolder = this._settings.getOption('s', Settings.FILE_FOLDER_SETTING_KEY);
        Lib.TalkativeLog(`-^-folder for screencast: ${tmpFolder}`);
        if (tmpFolder === '' || tmpFolder === null || tmpFolder === undefined) {
            let result = null;
            ctx.CtrlExe.Execute(
                'xdg-user-dir VIDEOS',
                true,
                (success, out) => {
                    Lib.TalkativeLog(`-^-CALLBACK sync S: ${success} out: ${out}`);
                    if (success && out !== '' && out !== undefined)
                        result = out.replace(/(\n)/g, '');
                },
                null
            );

            if (result !== null) {
                Lib.TalkativeLog(`-^-xdg-user video: ${result}`);
                tmpFolder = result;
            } else {
                Lib.TalkativeLog('-^-NOT SET xdg-user video');

                ctx.CtrlExe.Execute(
                    '/usr/bin/sh -c "echo $HOME"',
                    true,
                    (success, out) => {
                        Lib.TalkativeLog(`-^-CALLBACK sync S: ${success} out: ${out}`);
                        if (success && out !== '' && out !== undefined)
                            tmpFolder = out.replace(/(\n)/g, '');
                    },
                    null
                );
            }

            // connect keywebcam signal
            this._settings._settings.connect(
                `changed::${Settings.DEVICE_INDEX_WEBCAM_SETTING_KEY}`,
                () => {
                    Lib.TalkativeLog('-^-webcam device changed');
                    this._refreshWebcamOptions();
                }
            );
        }

        refFilechooserFileFolder.set_label(`Selected: ${tmpFolder}`);

        refFilechooserFileFolder.connect('clicked', () => {
            Lib.TalkativeLog('-^- file chooser button clicked...');

            let dialog = new Gtk.FileChooserNative({
                'title': 'Select folder',
                'transient-for': refFilechooserFileFolder.get_root(),
                'action': Gtk.FileChooserAction.SELECT_FOLDER,
                'accept-label': 'Ok',
                'cancel-label': 'Cancel',
            });
            dialog.connect('response', (self, response) => {
                if (response === Gtk.ResponseType.ACCEPT) {
                    var tmpPathFolder = self.get_file().get_path();
                    Lib.TalkativeLog(`-^-file path get from widget : ${tmpPathFolder}`);
                    this._settings.setOption(
                        Settings.FILE_FOLDER_SETTING_KEY,
                        tmpPathFolder
                    );
                    refFilechooserFileFolder.set_label(`Selected: ${tmpPathFolder}`);
                }
                ctx.fileChooserDialog = null;
            });
            dialog.show();
            ctx.fileChooserDialog = dialog; // keep a reference to the dialog alive
        });
    }

    /**
     * @param {EasyScreenCastSettingsWidget} ctx the prefs/settings widget
     * @param {Gtk.Builder} gtkDB the builder that loaded the UI glade file
     * @param {Gio.Settings} tmpS the current settings
     * @private
     */
    _initTabSupport(ctx, gtkDB, tmpS) {
        // implements textentry log
        let refTextViewEscLog = gtkDB.get_object('txe_ContainerLog');
        let refBufferLog = refTextViewEscLog.get_buffer();

        // implements verbose debug option
        let refSwitchVerboseDebug = gtkDB.get_object('swt_VerboseDebug');
        tmpS.bind(
            Settings.VERBOSE_DEBUG_SETTING_KEY,
            refSwitchVerboseDebug,
            'active',
            Gio.SettingsBindFlags.DEFAULT
        );
        this._settings._settings.connect(
            `changed::${Settings.VERBOSE_DEBUG_SETTING_KEY}`,
            () => {
                Lib.setDebugEnabled(this._settings.getOption('b', Settings.VERBOSE_DEBUG_SETTING_KEY));
            }
        );

        refSwitchVerboseDebug.connect('state-set', self => {
            // update log display widgets
            refTextViewEscLog.sensistive = self.active;
            refComboboxLogChooser.sensitive = self.active;
        });

        // implements file resolution preset spinner
        let refComboboxLogChooser = gtkDB.get_object('cbt_LogChooser');

        // intercept combobox res changed and update width/height value
        refComboboxLogChooser.connect('changed', self => {
            const activeLog = self.active;
            Lib.TalkativeLog(`-^-log combobox changed: ${activeLog}`);
            switch (activeLog) {
            case 0:
                // clear buffer
                refBufferLog.delete(
                    refBufferLog.get_start_iter(),
                    refBufferLog.get_end_iter()
                );

                ctx.CtrlExe.Execute(
                    'journalctl --since "15 min ago" --output=cat --no-pager',
                    false,
                    success => {
                        Lib.TalkativeLog(`-^-CALLBACK async S= ${success}`);
                    },
                    line => {
                        let esc = line.indexOf('[ESC]');
                        if (
                            line !== '' &&
                                line !== undefined &&
                                esc !== -1
                        ) {
                            line += '\n';
                            refBufferLog.insert(
                                refBufferLog.get_end_iter(),
                                line,
                                line.length
                            );
                        }
                    }
                );
                break;
            case 1:
                // clear buffer
                refBufferLog.delete(
                    refBufferLog.get_start_iter(),
                    refBufferLog.get_end_iter()
                );

                ctx.CtrlExe.Execute(
                    'journalctl --since "15 min ago" --output=cat --no-pager',
                    false,
                    success => {
                        Lib.TalkativeLog(`-^-CALLBACK async S= ${success}`);
                        if (success) {
                            if (refBufferLog.get_line_count() > 0) {
                                let strNOgsp = _(
                                    'No Gstreamer pipeline found'
                                );
                                refBufferLog.insert(
                                    refBufferLog.get_end_iter(),
                                    strNOgsp,
                                    strNOgsp.length
                                );
                            }
                        }
                    },
                    line => {
                        let esc = line.indexOf('-§-final GSP :');
                        if (
                            line !== '' &&
                                line !== undefined &&
                                esc !== -1
                        ) {
                            line += '\n';
                            refBufferLog.insert(
                                refBufferLog.get_end_iter(),
                                line,
                                line.length
                            );
                        }
                    }
                );
                break;
            case 2:
                // clear buffer
                refBufferLog.delete(
                    refBufferLog.get_start_iter(),
                    refBufferLog.get_end_iter()
                );

                ctx.CtrlExe.Execute(
                    'journalctl /usr/bin/gnome-shell --since "15 min ago" --output=cat --no-pager',
                    false,
                    success => {
                        Lib.TalkativeLog(`-^-CALLBACK async S= ${success}`);
                    },
                    line => {
                        if (line !== '' && line !== undefined) {
                            line += '\n';
                            refBufferLog.insert(
                                refBufferLog.get_end_iter(),
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

        // update state of get log
        refComboboxLogChooser.sensistive = this._settings.getOption('b', Settings.VERBOSE_DEBUG_SETTING_KEY);

        // implements default button action
        let refButtonSetDefaultSettings = gtkDB.get_object('btn_DefaultOption');
        refButtonSetDefaultSettings.connect('clicked', () =>
            ctx._setDefaultsettings()
        );
    }

    /**
     * @param {EasyScreenCastSettingsWidget} ctx the prefs/settings widget
     * @param {Gtk.Builder} gtkDB the builder that loaded the UI glade file
     * @private
     */
    _initTabInfo(ctx, gtkDB) {
        // implements info img extension
        let refImageEsc = gtkDB.get_object('img_ESC');
        refImageEsc.set_from_file(Lib.getImagePath(this._prefs.dir, 'Icon_Info.png'));

        // implements info version label
        let refLabelVersion = gtkDB.get_object('lbl_Version');
        refLabelVersion.set_markup(`${_('Version: ')}<span color="blue">${this._prefs.metadata.version}</span> (${Lib.getFullVersion()})`);
    }

    /**
     * @param {number} device device index
     * @private
     */
    _updateWebCamCaps(device) {
        Lib.TalkativeLog(`-^-webcam device index: ${device}`);

        if (device > 0) {
            this._initializeWebcamHelper();
            var listCaps = this.CtrlWebcam.getListCapsDevice(device - 1);
            Lib.TalkativeLog(`-^-webcam caps: ${listCaps.length}`);
            if (listCaps !== null && listCaps !== undefined) {
                this.Ref_ListStore_QualityWebCam.clear();
                for (var index in listCaps) {
                    this.Ref_ListStore_QualityWebCam.set(
                        this.Ref_ListStore_QualityWebCam.append(),
                        [0],
                        [listCaps[index]]
                    );
                }
            } else {
                Lib.TalkativeLog('-^-NO List Caps Webcam');
                this.Ref_ListStore_QualityWebCam.clear();
                this._settings.setOption(Settings.QUALITY_WEBCAM_SETTING_KEY, '');
            }
        } else {
            Lib.TalkativeLog('-^-NO Webcam recording');
            this.Ref_ListStore_QualityWebCam.clear();
            this._settings.setOption(Settings.QUALITY_WEBCAM_SETTING_KEY, '');
        }
    }

    /**
     * Refreshes the webcam settings.
     *
     * @private
     */
    _refreshWebcamOptions() {
        Lib.TalkativeLog('-^-refresh webcam options');
        this._initializeWebcamHelper();

        // fill combobox with quality option webcam
        this._updateWebCamCaps(this._settings.getOption('i', Settings.DEVICE_INDEX_WEBCAM_SETTING_KEY));

        // update webcam widget state
        this._updateStateWebcamOptions();
    }

    /**
     * Initializes this.CtrlWebcam if it is null.
     *
     * @private
     */
    _initializeWebcamHelper() {
        if (this.CtrlWebcam === null)
            this.CtrlWebcam = new UtilWebcam.HelperWebcam(_('Unspecified webcam'));
    }

    /**
     * @param {string} accel accelerator string parsable by Gtk.accelerator_parse, e.g. "&lt;Super&gt;E"
     * @private
     */
    _updateRowShortcut(accel) {
        Lib.TalkativeLog(`-^-update row combo key accel: ${accel}`);

        let [key, mods] = [0, 0];

        if (accel !== null && accel !== undefined) {
            let ok;
            [ok, key, mods] = Gtk.accelerator_parse(accel);

            if (ok !== true) {
                Lib.TalkativeLog('-^-couldn\'t parse accel');
                key = 0;
                mods = 0;
            }
        }

        Lib.TalkativeLog(`-^-key: ${key} mods: ${mods}`);
        this.Ref_liststore_Shortcut.set(
            this.Iter_ShortcutRow,
            [Settings.SHORTCUT_COLUMN_KEY, Settings.SHORTCUT_COLUMN_MODS],
            [key, mods]
        );
    }

    /**
     * @param {boolean} active custom or not custom GStream pipeline
     * @private
     */
    _setStateGSP(active) {
        // update GSP text area
        if (!active) {
            Lib.TalkativeLog('-^-custom GSP');

            this.Ref_stack_Quality.set_visible_child_name('pg_Custom');
        } else {
            Lib.TalkativeLog('-^-NOT custom GSP');

            this.Ref_stack_Quality.set_visible_child_name('pg_Preset');

            var audio = false;
            if (this._settings.getOption('i', Settings.INPUT_AUDIO_SOURCE_SETTING_KEY) > 0)
                audio = true;

            this._settings.setOption(
                Settings.PIPELINE_REC_SETTING_KEY,
                Settings.getGSPstd(audio)
            );
        }
    }

    /**
     * @private
     */
    _updateStateWebcamOptions() {
        Lib.TalkativeLog('-^-update webcam option widgets');

        var tmpDev = this._settings.getOption(
            'i',
            Settings.DEVICE_INDEX_WEBCAM_SETTING_KEY
        );
        this._updateWebCamCaps(tmpDev);
        if (tmpDev > 0) {
            var arrDev = this.CtrlWebcam.getNameDevices();
            this.Ref_Label_WebCam.set_text(arrDev[tmpDev - 1]);

            // setup label webcam caps
            var tmpCaps = this._settings.getOption(
                's',
                Settings.QUALITY_WEBCAM_SETTING_KEY
            );
            if (tmpCaps === '') {
                this.Ref_Label_WebCamCaps.use_markup = true;
                this.Ref_Label_WebCamCaps.set_markup(
                    _(
                        '<span foreground="red">No Caps selected, please select one from the caps list</span>'
                    )
                );
            } else {
                this.Ref_Label_WebCamCaps.set_text(tmpCaps);
            }

            // webcam recording show widget
            this.Ref_StackSwitcher_WebCam.set_sensitive(true);
            this.Ref_StackObj_WebCam.set_sensitive(true);
        } else {
            this.Ref_Label_WebCam.set_text(_('No webcam device selected'));
            // setup label webcam caps
            this.Ref_Label_WebCamCaps.set_text(_('-'));
            // webcam NOT recording hide widget
            this.Ref_StackSwitcher_WebCam.set_sensitive(false);
            this.Ref_StackObj_WebCam.set_sensitive(false);
        }
    }

    /**
     * @param {number} index index of the predefined resolutions
     * @returns {Array}
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
        if (index >= 0 && index < arrRes.length)
            return arrRes[index];
        else
            return null;
    }

    /**
     * function to restore default value of the settings
     *
     * @private
     */
    _setDefaultsettings() {
        Lib.TalkativeLog('-^-restore default option');

        this._settings.setOption(Settings.SHOW_NOTIFY_ALERT_SETTING_KEY, true);
        this._settings.setOption(Settings.SHOW_AREA_REC_SETTING_KEY, false);
        this._settings.setOption(Settings.STATUS_INDICATORS_SETTING_KEY, 1);
        this._settings.setOption(Settings.DRAW_CURSOR_SETTING_KEY, true);
        this._settings.setOption(Settings.VERBOSE_DEBUG_SETTING_KEY, false);
        this._settings.setOption(Settings.ACTIVE_CUSTOM_GSP_SETTING_KEY, false);

        this._settings.setOption(Settings.FPS_SETTING_KEY, 30);
        this._settings.setOption(Settings.X_POS_SETTING_KEY, 0);
        this._settings.setOption(Settings.Y_POS_SETTING_KEY, 0);
        this._settings.setOption(Settings.WIDTH_SETTING_KEY, 600);
        this._settings.setOption(Settings.HEIGHT_SETTING_KEY, 400);

        this._settings.setOption(Settings.FILE_NAME_SETTING_KEY, 'Screencast_%d_%t');
        this._settings.setOption(Settings.FILE_FOLDER_SETTING_KEY, '');
        this._settings.setOption(Settings.ACTIVE_POST_CMD_SETTING_KEY, false);
        this._settings.setOption(Settings.ACTIVE_PRE_CMD_SETTING_KEY, false);
        this._settings.setOption(Settings.POST_CMD_SETTING_KEY, 'xdg-open _fpath &');
        this._settings.setOption(Settings.INPUT_AUDIO_SOURCE_SETTING_KEY, 0);
        this._settings.setOption(Settings.DEVICE_INDEX_WEBCAM_SETTING_KEY, 0);
        this._settings.setOption(Settings.DEVICE_WEBCAM_SETTING_KEY, '');

        this._settings.setOption(Settings.TIME_DELAY_SETTING_KEY, 0);
        this._settings.setOption(Settings.FILE_CONTAINER_SETTING_KEY, 0);
        this._settings.setOption(Settings.FILE_RESOLUTION_TYPE_SETTING_KEY, -1);
        this._settings.setOption(Settings.QUALITY_SETTING_KEY, 1);
        this._settings.setOption(Settings.QUALITY_WEBCAM_SETTING_KEY, '');
        this._settings.setOption(Settings.WIDTH_WEBCAM_SETTING_KEY, 20);
        this._settings.setOption(Settings.HEIGHT_WEBCAM_SETTING_KEY, 10);
        this._settings.setOption(Settings.TYPE_UNIT_WEBCAM_SETTING_KEY, 0);
        this._settings.setOption(Settings.MARGIN_X_WEBCAM_SETTING_KEY, 0);
        this._settings.setOption(Settings.MARGIN_Y_WEBCAM_SETTING_KEY, 0);
        this._settings.setOption(Settings.ALPHA_CHANNEL_WEBCAM_SETTING_KEY, 0.75);
        this._settings.setOption(Settings.CORNER_POSITION_WEBCAM_SETTING_KEY, 0);
    }
});


export default class EasyScreenCastPreferences extends ExtensionPreferences {
    /**
     * @param {Adw.PreferencesWindow} window preferences window?
     * @returns {EasyScreenCastSettingsWidget}
     */
    fillPreferencesWindow(window) {
        window._settings = this.getSettings();

        Lib.TalkativeLog('-^-Init pref widget');

        const page = new Adw.PreferencesPage();

        const group = new Adw.PreferencesGroup({
            title: _('EasyScreenCast'),
        });
        page.add(group);

        const widget = new EasyScreenCastSettingsWidget(this);
        group.add(widget);

        window.add(page);
        // fix for #360 - make it a bit wider to show the "X" to close the window
        window.set_default_size(window['default-width'] + 50, window['default-height']);
    }
}
