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

const Lang = imports.lang;
const Shell = imports.gi.Shell;
const Main = imports.ui.main;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const LibRecorder = imports.ui.screencast;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Lib = Me.imports.convenience;
const Pref = Me.imports.prefs;
const Selection = Me.imports.selection;
const UtilGSP = Me.imports.utilgsp;
const Ext = Me.imports.extension;

const ScreenCastProxy = Gio.DBusProxy.makeProxyWrapper(
    LibRecorder.ScreencastIface);
let ScreenCastService = null;

const CaptureVideo = new Lang.Class({
    Name: "RecordVideo",
    /*
     * Create a video recorder
     */
    _init: function() {
        Lib.TalkativeLog('-&-init recorder');

        this.AreaSelected = null;

        //connect to d-bus service
        ScreenCastService = new ScreenCastProxy(
            Gio.DBus.session, 'org.gnome.Shell.Screencast',
            '/org/gnome/Shell/Screencast',
            Lang.bind(this, function(proxy, error) {
                if (error) {
                    Lib.TalkativeLog('-&-ERROR(d-bus proxy connected) - ' + error.message);
                    return;
                } else
                    Lib.TalkativeLog('-&-d-bus proxy connected');
            })
        );
    },
    /*
     * start recording
     */
    start: function() {
        Lib.TalkativeLog('-&-start video recording');
        this.recordingActive = false;

        //prepare variable for screencast
        var fileRec = Pref.getOption('s', Pref.FILE_NAME_SETTING_KEY);
        if (Pref.getOption('s', Pref.FILE_FOLDER_SETTING_KEY) !== '')
            fileRec = Pref.getOption('s', Pref.FILE_FOLDER_SETTING_KEY) +
            '/' + fileRec;

        let pipelineRec = '';

        if (Pref.getOption('b', Pref.ACTIVE_CUSTOM_GSP_SETTING_KEY)) {
            pipelineRec = Pref.getOption('s',
                Pref.PIPELINE_REC_SETTING_KEY);
        } else {
            //compose GSP
            pipelineRec = UtilGSP.composeGSP();
        }

        Lib.TalkativeLog('-&-path/file template : ' + fileRec);

        var optionsRec = {
            'draw-cursor': new GLib.Variant(
                'b', Pref.getOption('b', Pref.DRAW_CURSOR_SETTING_KEY)),
            'framerate': new GLib.Variant(
                'i', Pref.getOption('i', Pref.FPS_SETTING_KEY)),
            'pipeline': new GLib.Variant(
                's', pipelineRec)
        };

        if (Pref.getOption('i', Pref.AREA_SCREEN_SETTING_KEY) === 0) {
            ScreenCastService.ScreencastRemote(fileRec, optionsRec,
                Lang.bind(this, function(result, error) {
                    if (error) {
                        Lib.TalkativeLog('-&-ERROR(screencast execute) - ' + error.message);

                        this.stop();
                        Ext.Indicator.doRecResult(false);
                    } else
                        Lib.TalkativeLog('-&-screencast execute - ' + result[0] + ' - ' + result[1]);

                    Ext.Indicator.doRecResult(result[0], result[1]);
                })
            );
        } else {
            ScreenCastService.ScreencastAreaRemote(Pref.getOption(
                    'i', Pref.X_POS_SETTING_KEY), Pref.getOption(
                    'i', Pref.Y_POS_SETTING_KEY), Pref.getOption(
                    'i', Pref.WIDTH_SETTING_KEY), Pref.getOption(
                    'i', Pref.HEIGHT_SETTING_KEY),
                fileRec, optionsRec,
                Lang.bind(this, function(result, error) {
                    if (error) {
                        Lib.TalkativeLog('-&-ERROR(screencast execute) - ' + error.message);

                        this.stop();
                        Ext.Indicator.doRecResult(false);
                    } else {
                        Lib.TalkativeLog('-&-screencast execute - ' + result[0] + ' - ' + result[1]);

                        //draw area recording
                        if (Pref.getOption(
                                'b', Pref.SHOW_AREA_REC_SETTING_KEY)) {
                            this.AreaSelected = new Selection.AreaRecording();
                        }

                        Ext.Indicator.doRecResult(result[0], result[1]);
                    }
                })
            );
        }
    },
    /*
     * Stop recording
     */
    stop: function() {
        Lib.TalkativeLog('-&-stop video recording');

        ScreenCastService.StopScreencastRemote(Lang.bind(
            this,
            function(result, error) {
                if (error) {
                    Lib.TalkativeLog('-&-ERROR(screencast stop) - ' + error.message);
                    return false;
                } else
                    Lib.TalkativeLog('-&-screencast stop - ' + result[0]);

                //clear area recording
                if (this.AreaSelected !== null &&
                    this.AreaSelected.isVisible()) {
                    this.AreaSelected.clearArea();
                }

                return true;
            }
        ));
    }
});