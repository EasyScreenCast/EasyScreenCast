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

/* exported CaptureVideo */
'use strict';

const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const { loadInterfaceXML, _ } = imports.misc.fileUtils;
const ScreencastIface = loadInterfaceXML('org.gnome.Shell.Screencast');

const ExtensionUtils = imports.misc.extensionUtils;

const Config = imports.misc.config;
const shellVersion = Number.parseInt(Config.PACKAGE_VERSION.split('.')[0]);

const Me = ExtensionUtils.getCurrentExtension();
const Lib = Me.imports.convenience;
const Settings = Me.imports.settings;
const Selection = Me.imports.selection;
const UtilGSP = Me.imports.utilgsp;
const Ext = Me.imports.extension;

const ScreenCastProxy = Gio.DBusProxy.makeProxyWrapper(ScreencastIface);
let ScreenCastService = null;

/**
 * @type {CaptureVideo}
 */
var CaptureVideo = GObject.registerClass({
    GTypeName: 'CaptureVideo',
}, class CaptureVideo extends GObject.Object {
    /**
     * Create a video recorder
     */
    _init() {
        Lib.TalkativeLog('-&-init recorder');

        this.AreaSelected = null;

        // connect to d-bus service
        ScreenCastService = new ScreenCastProxy(
            Gio.DBus.session,
            'org.gnome.Shell.Screencast',
            '/org/gnome/Shell/Screencast',
            (proxy, error) => {
                if (error) {
                    Lib.TalkativeLog(`-&-ERROR(d-bus proxy connected) - ${error.message}`);
                } else {
                    Lib.TalkativeLog('-&-d-bus proxy connected');
                }
            }
        );
    }

    /**
     * start recording
     */
    start() {
        Lib.TalkativeLog('-&-start video recording');
        this.recordingActive = false;

        // prepare variable for screencast
        var fileRec =
            Settings.getOption('s', Settings.FILE_NAME_SETTING_KEY) +
            UtilGSP.getFileExtension(
                Settings.getOption('i', Settings.FILE_CONTAINER_SETTING_KEY)
            );

        if (Settings.getOption('s', Settings.FILE_FOLDER_SETTING_KEY) !== '') {
            fileRec = `${Settings.getOption('s', Settings.FILE_FOLDER_SETTING_KEY)}/${fileRec}`;
        }

        let pipelineRec = '';

        if (Settings.getOption('b', Settings.ACTIVE_CUSTOM_GSP_SETTING_KEY)) {
            pipelineRec = Settings.getOption(
                's',
                Settings.PIPELINE_REC_SETTING_KEY
            );
        } else {
            // compose GSP
            pipelineRec = UtilGSP.composeGSP();
        }

        Lib.TalkativeLog(`-&-path/file template : ${fileRec}`);
        if (shellVersion >= 40) {
            // prefix with a videoconvert element
            // see DEFAULT_PIPELINE in https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/dbusServices/screencast/screencastService.js#L26
            // this videoconvert element was added always previously and needs to be added now explicitly
            // https://gitlab.gnome.org/GNOME/gnome-shell/-/commit/51bf7ec17617a9ed056dd563afdb98e17da07373
            pipelineRec = `videoconvert chroma-mode=GST_VIDEO_CHROMA_MODE_NONE dither=GST_VIDEO_DITHER_NONE matrix-mode=GST_VIDEO_MATRIX_MODE_OUTPUT_ONLY n-threads=%T ! queue ! ${pipelineRec}`;
            Lib.TalkativeLog(`-&-pipeline : gnome-shell-version=${shellVersion} pipeline: ${pipelineRec}`);
        }

        var optionsRec = {
            'draw-cursor': new GLib.Variant(
                'b',
                Settings.getOption('b', Settings.DRAW_CURSOR_SETTING_KEY)
            ),
            framerate: new GLib.Variant(
                'i',
                Settings.getOption('i', Settings.FPS_SETTING_KEY)
            ),
            pipeline: new GLib.Variant('s', pipelineRec),
        };

        if (Settings.getOption('i', Settings.AREA_SCREEN_SETTING_KEY) === 0) {
            ScreenCastService.ScreencastRemote(
                fileRec,
                optionsRec,
                (result, error) => {
                    if (error) {
                        Lib.TalkativeLog(
                            `-&-ERROR(screencast execute) - ${error.message}`
                        );

                        this.stop();
                        Ext.Indicator.doRecResult(false);
                    } else {
                        Lib.TalkativeLog(
                            `-&-screencast execute - ${
                                result[0]
                            } - ${
                                result[1]}`
                        );
                    }

                    Ext.Indicator.doRecResult(result[0], result[1]);
                }
            );
        } else {
            ScreenCastService.ScreencastAreaRemote(
                Settings.getOption('i', Settings.X_POS_SETTING_KEY),
                Settings.getOption('i', Settings.Y_POS_SETTING_KEY),
                Settings.getOption('i', Settings.WIDTH_SETTING_KEY),
                Settings.getOption('i', Settings.HEIGHT_SETTING_KEY),
                fileRec,
                optionsRec,
                (result, error) => {
                    if (error) {
                        Lib.TalkativeLog(`-&-ERROR(screencast execute) - ${error.message}`);

                        this.stop();
                        Ext.Indicator.doRecResult(false);
                    } else {
                        Lib.TalkativeLog(`-&-screencast execute - ${result[0]} - ${result[1]}`);

                        // draw area recording
                        if (Settings.getOption('b', Settings.SHOW_AREA_REC_SETTING_KEY)) {
                            this.AreaSelected = new Selection.AreaRecording();
                        }

                        Ext.Indicator.doRecResult(result[0], result[1]);
                    }
                }
            );
        }
    }

    /**
     * Stop recording
     *
     * @returns {boolean}
     */
    stop() {
        Lib.TalkativeLog('-&-stop video recording');

        ScreenCastService.StopScreencastRemote((result, error) => {
            if (error) {
                Lib.TalkativeLog(`-&-ERROR(screencast stop) - ${error.message}`);
                return false;
            } else {
                Lib.TalkativeLog(`-&-screencast stop - ${result[0]}`);
            }

            // clear area recording
            if (this.AreaSelected !== null && this.AreaSelected.isVisible()) {
                this.AreaSelected.clearArea();
            }

            return true;
        });
    }
});
