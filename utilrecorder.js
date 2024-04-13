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
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import {loadInterfaceXML} from 'resource:///org/gnome/shell/misc/dbusUtils.js';
const ScreencastIface = loadInterfaceXML('org.gnome.Shell.Screencast');

import * as Lib from './convenience.js';
import * as Settings from './settings.js';
import * as Selection from './selection.js';
import * as UtilGSP from './utilgsp.js';
import * as Ext from './extension.js';

/**
 * @type {CaptureVideo}
 */
export const CaptureVideo = GObject.registerClass({
    GTypeName: 'EasyScreenCast_CaptureVideo',
}, class CaptureVideo extends GObject.Object {
    /**
     * Create a video recorder
     */
    constructor() {
        super();
        Lib.TalkativeLog('-&-init recorder');

        this.AreaSelected = null;

        // connect to d-bus service
        const ScreenCastProxy = Gio.DBusProxy.makeProxyWrapper(ScreencastIface);
        this._screenCastService = new ScreenCastProxy(
            Gio.DBus.session,
            'org.gnome.Shell.Screencast',
            '/org/gnome/Shell/Screencast',
            (proxy, error) => {
                if (error)
                    Lib.TalkativeLog(`-&-ERROR(d-bus proxy connected) - ${error.message}`);
                else
                    Lib.TalkativeLog('-&-d-bus proxy connected');
            }
        );
    }

    /**
     * start recording
     */
    start() {
        Lib.TalkativeLog('-&-start video recording');
        this.recordingActive = false;

        let fileExt = UtilGSP.getFileExtension(
            Ext.Indicator.getSettings().getOption('i', Settings.FILE_CONTAINER_SETTING_KEY)
        );
        // prepare variable for screencast
        let fileRec = Ext.Indicator.getSettings().getOption('s', Settings.FILE_NAME_SETTING_KEY);

        let folderRec = '';
        if (Ext.Indicator.getSettings().getOption('s', Settings.FILE_FOLDER_SETTING_KEY) !== '')
            folderRec = Ext.Indicator.getSettings().getOption('s', Settings.FILE_FOLDER_SETTING_KEY);

        let pipelineRec = '';

        if (Ext.Indicator.getSettings().getOption('b', Settings.ACTIVE_CUSTOM_GSP_SETTING_KEY)) {
            pipelineRec = Ext.Indicator.getSettings().getOption(
                's',
                Settings.PIPELINE_REC_SETTING_KEY
            );
        } else {
            // compose GSP
            pipelineRec = UtilGSP.composeGSP(Ext.Indicator.getSettings(), Ext.Indicator.CtrlAudio);
        }

        Lib.TalkativeLog(`-&-file template : ${fileRec}`);
        fileRec = this._generateFileName(fileRec);
        Lib.TalkativeLog(`-&-file final : ${fileRec}`);
        const completeFileRecPath = folderRec !== ''
            ? `${folderRec}/${fileRec}`
            : fileRec;
        Lib.TalkativeLog(`-&-file rec path complete : ${completeFileRecPath}${fileExt}`);

        // prefix with a videoconvert element
        // see DEFAULT_PIPELINE in https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/dbusServices/screencast/screencastService.js#L26
        // this videoconvert element was added always previously (< Gnome 40) and needs to be added now explicitly
        // https://gitlab.gnome.org/GNOME/gnome-shell/-/commit/51bf7ec17617a9ed056dd563afdb98e17da07373
        pipelineRec = `videoconvert chroma-mode=GST_VIDEO_CHROMA_MODE_NONE dither=GST_VIDEO_DITHER_NONE matrix-mode=GST_VIDEO_MATRIX_MODE_OUTPUT_ONLY n-threads=%T ! queue ! ${pipelineRec}`;
        Lib.TalkativeLog(`-&-pipeline : pipeline: ${pipelineRec}`);

        var optionsRec = {
            'draw-cursor': new GLib.Variant(
                'b',
                Ext.Indicator.getSettings().getOption('b', Settings.DRAW_CURSOR_SETTING_KEY)
            ),
            framerate: new GLib.Variant(
                'i',
                Ext.Indicator.getSettings().getOption('i', Settings.FPS_SETTING_KEY)
            ),
            pipeline: new GLib.Variant('s', pipelineRec),
        };

        if (Ext.Indicator.getSettings().getOption('i', Settings.AREA_SCREEN_SETTING_KEY) === 0) {
            this._screenCastService.ScreencastRemote(
                completeFileRecPath,
                optionsRec,
                (result, error) => {
                    if (error) {
                        Lib.TalkativeLog(`-&-ERROR(screencast execute) - ${error.message}`);

                        this.stop();
                        Ext.Indicator.doRecResult(false);
                    } else {
                        Lib.TalkativeLog(`-&-screencast execute - ${result[0]} - ${result[1]}`);

                        let resultingFilePath = result[1];
                        if (resultingFilePath.endsWith('.undefined')) {
                            resultingFilePath = resultingFilePath.substring(0, resultingFilePath.length - '.undefined'.length);
                            resultingFilePath = `${resultingFilePath}${fileExt}`;
                        }
                        this._originalFilePath = result[1];
                        this._filePathWithExtension = resultingFilePath;

                        Ext.Indicator.doRecResult(result[0], resultingFilePath);
                    }
                }
            );
        } else {
            this._screenCastService.ScreencastAreaRemote(
                Ext.Indicator.getSettings().getOption('i', Settings.X_POS_SETTING_KEY),
                Ext.Indicator.getSettings().getOption('i', Settings.Y_POS_SETTING_KEY),
                Ext.Indicator.getSettings().getOption('i', Settings.WIDTH_SETTING_KEY),
                Ext.Indicator.getSettings().getOption('i', Settings.HEIGHT_SETTING_KEY),
                completeFileRecPath,
                optionsRec,
                (result, error) => {
                    if (error) {
                        Lib.TalkativeLog(`-&-ERROR(screencast execute) - ${error.message}`);

                        this.stop();
                        Ext.Indicator.doRecResult(false);
                    } else {
                        Lib.TalkativeLog(`-&-screencast execute - ${result[0]} - ${result[1]}`);

                        // draw area recording
                        if (Ext.Indicator.getSettings().getOption('b', Settings.SHOW_AREA_REC_SETTING_KEY))
                            this.AreaSelected = new Selection.AreaRecording();

                        let resultingFilePath = result[1];
                        if (resultingFilePath.endsWith('.undefined')) {
                            resultingFilePath = resultingFilePath.substring(0, resultingFilePath.length - '.undefined'.length);
                            resultingFilePath = `${resultingFilePath}${fileExt}`;
                        }
                        this._originalFilePath = result[1];
                        this._filePathWithExtension = resultingFilePath;

                        Ext.Indicator.doRecResult(result[0], resultingFilePath);
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

        this._screenCastService.StopScreencastRemote((result, error) => {
            if (error) {
                Lib.TalkativeLog(`-&-ERROR(screencast stop) - ${error.message}`);
                return false;
            } else {
                Lib.TalkativeLog(`-&-screencast stop - ${result[0]}`);


                // rename the file...
                Lib.TalkativeLog(`-&-screencast: rename ${this._originalFilePath} to ${this._filePathWithExtension}`);
                const sourceFile = Gio.File.new_for_path(this._originalFilePath);
                const destFile = Gio.File.new_for_path(this._filePathWithExtension);
                sourceFile.move(destFile, 0, null, null);
            }

            // clear area recording
            if (this.AreaSelected !== null && this.AreaSelected.isVisible())
                this.AreaSelected.clearArea();

            return true;
        });
    }

    // without file extension
    _generateFileName(template) {
        template = template.replaceAll('%d', '%0x').replaceAll('%t', '%0X');
        const datetime = GLib.DateTime.new_now_local();
        let result = datetime.format(template);
        result = result.replaceAll(' ', '_'); // remove white space
        result = result.replaceAll('/', '_'); // remove path separators
        return result;
    }
});
