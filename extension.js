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
import St from 'gi://St';
import Meta from 'gi://Meta';
import Shell from 'gi://Shell';
// https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/ui/panelMenu.js
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import Clutter from 'gi://Clutter';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import * as Slider from 'resource:///org/gnome/shell/ui/slider.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';

import * as Lib from './convenience.js';
import * as Settings from './settings.js';
import * as Time from './timer.js';
import * as UtilRecorder from './utilrecorder.js';
import * as UtilAudio from './utilaudio.js';
import * as UtilWebcam from './utilwebcam.js';
import * as UtilNotify from './utilnotify.js';
import * as Selection from './selection.js';
import * as UtilExeCmd from './utilexecmd.js';

var Indicator;
let timerD = null;
let timerC = null;

let isActive = false;
let pathFile = '';

let keybindingConfigured = false;

/**
 * @type {EasyScreenCastIndicator}
 */
const EasyScreenCastIndicator = GObject.registerClass({
    GTypeName: 'EasyScreenCast_Indicator',
}, class EasyScreenCastIndicator extends PanelMenu.Button {
    constructor(extension) {
        super(null, 'EasyScreenCast_Indicator');

        this._extension = extension;
        this._settings = new Settings.Settings(this._extension.getSettings());
        Lib.setDebugEnabled(this._settings.getOption('b', Settings.VERBOSE_DEBUG_SETTING_KEY));
        this._settings._settings.connect(
            `changed::${Settings.VERBOSE_DEBUG_SETTING_KEY}`,
            () => {
                Lib.setDebugEnabled(this._settings.getOption('b', Settings.VERBOSE_DEBUG_SETTING_KEY));
            }
        );

        this.CtrlAudio = new UtilAudio.MixerAudio();
        // CtrlWebcam is initialized lazy to avoid problems like #368
        this.CtrlWebcam = null;

        this.CtrlNotify = new UtilNotify.NotifyManager();
        this.CtrlExe = new UtilExeCmd.ExecuteStuff(this);

        // load indicator icons
        this._icons = {
            on: Lib.loadIcon(this._extension.dir, 'icon_recording.svg'),
            onSel: Lib.loadIcon(this._extension.dir, 'icon_recordingSel.svg'),
            off: Lib.loadIcon(this._extension.dir, 'icon_default.svg'),
            offSel: Lib.loadIcon(this._extension.dir, 'icon_defaultSel.svg'),
        };

        // check audio
        if (!this.CtrlAudio.checkAudio()) {
            Lib.TalkativeLog('-*-disable audio recording');
            this._settings.setOption(Settings.INPUT_AUDIO_SOURCE_SETTING_KEY, 0);
            this._settings.setOption(
                Settings.ACTIVE_CUSTOM_GSP_SETTING_KEY,
                Settings.getGSPstd(false)
            );
        }

        // add enter/leave/click event
        this.connect('enter_event', () => this.refreshIndicator(true));
        this.connect('leave_event', () => this.refreshIndicator(false));
        this.connect('button_press_event', (actor, event) =>
            this._onButtonPress(actor, event)
        );

        // prepare setting var
        if (this._settings.getOption('i', Settings.TIME_DELAY_SETTING_KEY) > 0)
            this.isDelayActive = true;
        else
            this.isDelayActive = false;


        // Add the title bar icon and label for time display
        this.indicatorBox = new St.BoxLayout();
        this.indicatorIcon = new St.Icon({
            gicon: this._icons.off,
            icon_size: 16,
        });
        this.timeLabel = new St.Label({
            text: '',
            style_class: 'time-label',
            y_expand: true,
            y_align: Clutter.ActorAlign.CENTER,
        });

        this.indicatorBox.add_child(this.timeLabel);
        this.indicatorBox.add_child(this.indicatorIcon);

        // init var
        this.recorder = new UtilRecorder.CaptureVideo();
        this.AreaSelected = null;
        this.TimeSlider = null;

        this._initMainMenu();
    }

    /**
     * @private
     */
    _initMainMenu() {
        this._addStartStopMenuEntry();
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this.sub_menu_audio_recording = new PopupMenu.PopupSubMenuMenuItem(_('No audio source'), true);
        this.sub_menu_audio_recording.icon.icon_name = 'audio-input-microphone-symbolic';
        this.menu.addMenuItem(this.sub_menu_audio_recording);
        this._addAudioRecordingSubMenu();

        // add sub menu webcam recording
        this._addSubMenuWebCam();

        this._addAreaRecordingSubMenu();
        this._addRecordingDelaySubMenu();
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this.menu_item_options = new PopupMenu.PopupMenuItem(_('Options'));
        this.menu_item_options.actor.insert_child_at_index(
            new St.Icon({
                style_class: 'popup-menu-icon',
                icon_name: 'preferences-other-symbolic',
            }),
            1
        );
        this.menu.addMenuItem(this.menu_item_options);
        this.menu_item_options.connect('activate', () => this._openExtensionPreferences());
    }

    /**
     * Set a new value for the time label. Integers are
     * converted to seconds, minutes, hours. All other
     * values are converted to strings.
     *
     * @param {string|number} newValue new value of the label. if a number, then it's the seconds passed.
     * @returns {string}
     */
    updateTimeLabel(newValue) {
        /**
         * @param {number} number a number
         */
        function padZeros(number) {
            if (number < 10)
                number = `0${number}`;

            return number.toString();
        }

        if (typeof newValue === 'number') {
            let hours = Math.floor(newValue / 3600);
            newValue -= hours * 3600;

            let minutes = Math.floor(newValue / 60);
            newValue -= minutes * 60;

            newValue = `${padZeros(hours)}:${padZeros(minutes)}:${padZeros(newValue)}`;
        }

        this.timeLabel.set_text(newValue.toString());
    }

    /**
     * Left clicking on the icon toggles the recording
     * options menu. Any other mouse button will start
     * the recording.
     * Some submenus are refreshed to account for new
     * sources.
     *
     * @param {Clutter.Actor} actor the actor
     * @param {Clutter.Event} event a Clutter.Event
     */
    _onButtonPress(actor, event) {
        let button = event.get_button();

        if (button === 1) {
            Lib.TalkativeLog('-*-left click indicator');

            this._setupExtensionMenu();
        } else {
            Lib.TalkativeLog('-*-right click indicator');

            if (this.menu.isOpen)
                this.menu.close();

            this.isShowNotify = this._settings.getOption('b', Settings.SHOW_NOTIFY_ALERT_SETTING_KEY);
            this._doRecording();
        }
    }

    /**
     * Sets up the menu when the user opens it.
     */
    _setupExtensionMenu() {
        this._addAudioRecordingSubMenu();
        this._addWebcamSubMenu();
    }

    /**
     * Sets up all the options for web-cams. Should only run the
     * first time the icon is clicked an the CtrlWebcam is still
     * null.
     */
    _addWebcamSubMenu() {
        if (this.CtrlWebcam === null)
            this.CtrlWebcam = new UtilWebcam.HelperWebcam(_('Unspecified webcam'));

        // add sub menu webcam recording
        this._populateSubMenuWebcam();

        // start monitoring inputvideo
        this.CtrlWebcam.startMonitor();
    }

    /**
     * Adds individual webcam items to the webcam menu.
     */
    _populateSubMenuWebcam() {
        let arrMI = this._createMIWebCam();

        this.smWebCam.menu.removeAll();
        for (let element in arrMI)
            this.smWebCam.menu.addMenuItem(arrMI[element]);

        let i = this._settings.getOption('i', Settings.DEVICE_INDEX_WEBCAM_SETTING_KEY);
        Lib.TalkativeLog(`-*-populated submenuwebcam. Settings i=${i}`);

        this.smWebCam.label.text = this.WebCamDevice[i];
    }

    /**
     * @private
     */
    _addStartStopMenuEntry() {
        this.imRecordAction = new PopupMenu.PopupBaseMenuItem();
        this.RecordingLabel = new St.Label({
            text: _('Start recording'),
            style_class: 'RecordAction-label',
            content_gravity: Clutter.ContentGravity.CENTER,
            x_expand: true,
            x_align: Clutter.ActorAlign.CENTER,
        });
        this.imRecordAction.actor.add_child(this.RecordingLabel);
        this.imRecordAction.x_expand = true;
        this.imRecordAction.x_fill = true;
        this.imRecordAction.x_align = Clutter.ActorAlign.CENTER;
        this.imRecordAction.connect('activate', () => {
            this.isShowNotify = this._settings.getOption('b', Settings.SHOW_NOTIFY_ALERT_SETTING_KEY);
            this._doRecording();
        });

        this.menu.addMenuItem(this.imRecordAction);
    }

    /**
     *  Refreshes the submenu for audio recording sources.
     */
    _addAudioRecordingSubMenu() {
        Lib.TalkativeLog('-*-reset the sub menu audio');
        // remove old menu items
        this.sub_menu_audio_recording.menu.removeAll();

        Lib.TalkativeLog('-*-add new items to sub menu audio');
        var arrMI = this._createMIAudioRec();
        for (var ele in arrMI)
            this.sub_menu_audio_recording.menu.addMenuItem(arrMI[ele]);
    }

    /**
     * @private
     */
    _addSubMenuWebCam() {
        this.smWebCam = new PopupMenu.PopupSubMenuMenuItem('', true);
        this.smWebCam.icon.icon_name = 'camera-web-symbolic';

        this.menu.addMenuItem(this.smWebCam);
    }

    /**
     * @private
     */
    _addAreaRecordingSubMenu() {
        this.sub_menu_area_recording = new PopupMenu.PopupSubMenuMenuItem('', true);
        this.sub_menu_area_recording.icon.icon_name = 'view-fullscreen-symbolic';

        var arrMI = this._createMIAreaRec();
        for (var ele in arrMI)
            this.sub_menu_area_recording.menu.addMenuItem(arrMI[ele]);

        this.sub_menu_area_recording.label.text = this.AreaType[this._settings.getOption('i', Settings.AREA_SCREEN_SETTING_KEY)];
        this.menu.addMenuItem(this.sub_menu_area_recording);
    }

    /**
     * @private
     */
    _addRecordingDelaySubMenu() {
        this.smDelayRec = new PopupMenu.PopupSubMenuMenuItem('', true);
        this.smDelayRec.icon.icon_name = 'alarm-symbolic';

        var arrMI = this._createMIInfoDelayRec();
        for (var ele in arrMI)
            this.smDelayRec.menu.addMenuItem(arrMI[ele]);

        var secDelay = this._settings.getOption('i', Settings.TIME_DELAY_SETTING_KEY);
        if (secDelay > 0) {
            this.smDelayRec.label.text =
                secDelay + _(' sec. delay before recording');
        } else {
            this.smDelayRec.label.text = _('Start recording immediately');
        }

        this.menu.addMenuItem(this.smDelayRec);
    }

    /**
     * @returns {Array}
     * @private
     */
    _createMIAreaRec() {
        this.AreaType = [
            _('Record all desktop'),
            _('Record a selected monitor'),
            _('Record a selected window'),
            _('Record a selected area'),
        ];

        this.AreaMenuItem = new Array(this.AreaType.length);

        for (var i = 0; i < this.AreaMenuItem.length; i++) {
            this.AreaMenuItem[i] = new PopupMenu.PopupMenuItem(
                this.AreaType[i],
                {
                    reactive: true,
                    activate: true,
                    hover: true,
                    can_focus: true,
                }
            );

            (function (areaSetting, arr, item, settings) {
                this.connectMI = function () {
                    this.connect('activate', () => {
                        Lib.TalkativeLog(`-*-set area recording to ${areaSetting} ${arr[areaSetting]}`);
                        settings.setOption(Settings.AREA_SCREEN_SETTING_KEY, areaSetting);

                        item.label.text = arr[areaSetting];
                    });
                };
                this.connectMI();
            }.call(
                this.AreaMenuItem[i],
                i,
                this.AreaType,
                this.sub_menu_area_recording,
                this._settings
            ));
        }

        return this.AreaMenuItem;
    }

    /**
     * @returns {Array}
     * @private
     */
    _createMIWebCam() {
        this.WebCamDevice = [_('No WebCam recording')];
        // add menu item webcam device from GST
        const devices = this.CtrlWebcam.getDevicesIV();
        this.WebCamDevice.push(...this.CtrlWebcam.getNameDevices());
        Lib.TalkativeLog(`-*-webcam list: ${this.WebCamDevice}`);
        this.AreaMenuItem = new Array(this.WebCamDevice.length);

        for (var i = 0; i < this.AreaMenuItem.length; i++) {
            let devicePath = '';

            // i === 0 is "No Webcam selected"
            if (i > 0) {
                const device = devices[i - 1];
                devicePath = device.get_properties().get_string('device.path');
                Lib.TalkativeLog(`-*-webcam i=${i} devicePath: ${devicePath}`);
            }

            Lib.TalkativeLog(`-*-webcam i=${i} menu-item-text: ${this.WebCamDevice[i]}`);
            this.AreaMenuItem[i] = new PopupMenu.PopupMenuItem(
                this.WebCamDevice[i],
                {
                    reactive: true,
                    activate: true,
                    hover: true,
                    can_focus: true,
                }
            );

            (function (index, devPath, arr, item, settings) {
                this.connectMI = function () {
                    this.connect('activate', () => {
                        Lib.TalkativeLog(`-*-set webcam device to ${index} ${arr[index]} devicePath=${devPath}`);
                        settings.setOption(Settings.DEVICE_INDEX_WEBCAM_SETTING_KEY, index);
                        settings.setOption(Settings.DEVICE_WEBCAM_SETTING_KEY, devPath);
                        item.label.text = arr[index];
                    });
                };
                this.connectMI();
            }.call(
                this.AreaMenuItem[i],
                i,
                devicePath,
                this.WebCamDevice,
                this.smWebCam,
                this._settings
            ));
        }

        return this.AreaMenuItem;
    }

    /**
     * @returns {Array}
     * @private
     */
    _createMIAudioRec() {
        // add std menu item
        this.AudioChoice = [
            {
                desc: _('No audio source'),
                name: 'N/A',
                port: 'N/A',
                sortable: true,
                resizeable: true,
            },
            {
                desc: _('Default audio source'),
                name: 'N/A',
                port: 'N/A',
                sortable: true,
                resizeable: true,
            },
        ];
        // add menu item audio source from PA
        var audioList = this.CtrlAudio.getListInputAudio();
        for (var index in audioList)
            this.AudioChoice.push(audioList[index]);

        this.AudioMenuItem = new Array(this.AudioChoice.length);

        for (var i = 0; i < this.AudioChoice.length; i++) {
            // create label menu
            let labelMenu = this.AudioChoice[i].desc;
            if (i >= 2) {
                labelMenu +=
                    _('\n - Port: ') +
                    this.AudioChoice[i].port +
                    _('\n - Name: ') +
                    this.AudioChoice[i].name;
            }
            // create submenu
            this.AudioMenuItem[i] = new PopupMenu.PopupMenuItem(labelMenu, {
                reactive: true,
                activate: true,
                hover: true,
                can_focus: true,
            });
            // add icon on submenu
            this.AudioMenuItem[i].actor.insert_child_at_index(
                new St.Icon({
                    style_class: 'popup-menu-icon',
                    icon_name: 'audio-card-symbolic',
                }),
                1
            );

            // update choice audio from pref
            if (i === this._settings.getOption('i', Settings.INPUT_AUDIO_SOURCE_SETTING_KEY)) {
                Lib.TalkativeLog(`-*-get audio choice from pref ${i}`);
                this.sub_menu_audio_recording.label.text = this.AudioChoice[i].desc;
            }

            // add action on menu item
            (function (audioIndex, arr, item, settings) {
                this.connectMI = function () {
                    this.connect('activate', () => {
                        Lib.TalkativeLog(`-*-set audio choice to ${audioIndex}`);
                        settings.setOption(Settings.INPUT_AUDIO_SOURCE_SETTING_KEY, audioIndex);
                        item.label.text = arr[audioIndex].desc;
                    });
                };
                this.connectMI();
            }.call(
                this.AudioMenuItem[i],
                i,
                this.AudioChoice,
                this.sub_menu_audio_recording,
                this._settings
            ));
        }
        return this.AudioMenuItem;
    }

    /**
     * @returns {Array}
     * @private
     */
    _createMIInfoDelayRec() {
        this.DelayTimeTitle = new PopupMenu.PopupMenuItem(_('Delay Time'), {
            reactive: false,
        });

        this.DelayTimeLabel = new St.Label({
            text:
                Math.floor(
                    this._settings.getOption('i', Settings.TIME_DELAY_SETTING_KEY)
                ).toString() + _(' Sec'),
        });
        this.DelayTimeTitle.actor.add_child(this.DelayTimeLabel);
        // TODO this.DelayTimeTitle.align = St.Align.END;

        this.imSliderDelay = new PopupMenu.PopupBaseMenuItem({
            activate: false,
        });
        this.TimeSlider = new Slider.Slider(this._settings.getOption('i', Settings.TIME_DELAY_SETTING_KEY) / 100);
        this.TimeSlider.x_expand = true;
        this.TimeSlider.y_expand = true;

        this.TimeSlider.connect('notify::value', item => {
            this.DelayTimeLabel.set_text(
                Math.floor(item.value * 100).toString() + _(' Sec')
            );
        });

        this.TimeSlider.connect('drag-end', () => this._onDelayTimeChanged());
        this.TimeSlider.connect('scroll-event', () =>
            this._onDelayTimeChanged()
        );

        this.imSliderDelay.actor.add_child(this.TimeSlider);

        return [this.DelayTimeTitle, this.imSliderDelay];
    }

    /**
     * @private
     */
    _enable() {
        // enable key binding
        this._enableKeybindings();
        // immediately activate/deactive shortcut on settings change
        this._settings._settings.connect(
            `changed::${Settings.ACTIVE_SHORTCUT_SETTING_KEY}`,
            () => {
                if (this._settings.getOption('b', Settings.ACTIVE_SHORTCUT_SETTING_KEY)) {
                    Lib.TalkativeLog('-^-shortcut changed - enabling');
                    this._enableKeybindings();
                } else {
                    Lib.TalkativeLog('-^-shortcut changed - disabling');
                    this._removeKeybindings();
                }
            }
        );

        // start monitoring inputvideo
        if (this.CtrlWebcam !== null)
            this.CtrlWebcam.startMonitor();

        // add indicator
        this.add_child(this.indicatorBox);
    }

    /**
     * @private
     */
    _disable() {
        // remove key binding
        this._removeKeybindings();
        // stop monitoring inputvideo
        if (this.CtrlWebcam !== null)
            this.CtrlWebcam.stopMonitor();
        // unregister mixer control
        this.CtrlAudio.destroy();

        // remove indicator
        this.remove_child(this.indicatorBox);
    }

    /**
     * @private
     */
    _doDelayAction() {
        if (this.isDelayActive) {
            Lib.TalkativeLog(`-*-delay recording called | delay= ${this.TimeSlider.value}`);
            timerD = new Time.TimerDelay(
                Math.floor(this.TimeSlider.value * 100),
                this._doPreCommand,
                this
            );
            timerD.begin();
        } else {
            Lib.TalkativeLog('-*-instant recording called');
            // start recording
            this._doPreCommand();
        }
    }

    /**
     * @private
     */
    _doPreCommand() {
        if (this._settings.getOption('b', Settings.ACTIVE_PRE_CMD_SETTING_KEY)) {
            Lib.TalkativeLog('-*-execute pre command');

            const PreCmd = this._settings.getOption('s', Settings.PRE_CMD_SETTING_KEY);

            this.CtrlExe.Execute(
                PreCmd,
                false,
                res => {
                    Lib.TalkativeLog(`-*-pre command final: ${res}`);
                    if (res === true) {
                        Lib.TalkativeLog('-*-pre command OK');
                        this.recorder.start();
                    } else {
                        Lib.TalkativeLog('-*-pre command ERROR');
                        this.CtrlNotify.createNotify(
                            _('ERROR PRE COMMAND - See logs for more info'),
                            this._icons.off
                        );
                    }
                },
                line => {
                    Lib.TalkativeLog(`-*-pre command output: ${line}`);
                }
            );
        } else {
            this.recorder.start();
        }
    }

    /**
     * @private
     */
    _doRecording() {
        // start/stop record screen
        if (isActive === false) {
            Lib.TalkativeLog('-*-start recording');

            pathFile = '';

            // get selected area
            const optArea = this._settings.getOption('i', Settings.AREA_SCREEN_SETTING_KEY);
            if (optArea > 0) {
                Lib.TalkativeLog(`-*-type of selection of the area to record: ${optArea}`);
                switch (optArea) {
                case 3:
                    new Selection.SelectionArea();
                    break;
                case 2:
                    new Selection.SelectionWindow();
                    break;
                case 1:
                    new Selection.SelectionDesktop();
                    break;
                }
            } else {
                Lib.TalkativeLog('-*-recording full area');
                this._doDelayAction();
            }
        } else {
            Lib.TalkativeLog('-*-stop recording');
            isActive = false;

            this.recorder.stop();

            if (timerC !== null) {
                // stop counting rec
                timerC.halt();
                timerC = null;
            }

            // execute post-command
            this._doPostCommand();
        }

        this.refreshIndicator(false);
    }

    /**
     * @private
     */
    _doPostCommand() {
        if (this._settings.getOption('b', Settings.ACTIVE_POST_CMD_SETTING_KEY)) {
            Lib.TalkativeLog('-*-execute post command');

            // launch cmd after registration
            const tmpCmd = `/usr/bin/sh -c "${this._settings.getOption('s', Settings.POST_CMD_SETTING_KEY)}"`;

            const mapObj = {
                _fpath: pathFile,
                _dirpath: pathFile.substr(0, pathFile.lastIndexOf('/')),
                _fname: pathFile.substr(
                    pathFile.lastIndexOf('/') + 1,
                    pathFile.length
                ),
            };

            const Cmd = tmpCmd.replace(/_fpath|_dirpath|_fname/gi, match => {
                return mapObj[match];
            });

            Lib.TalkativeLog(`-*-post command:${Cmd}`);

            // execute post command
            this.CtrlExe.Spawn(Cmd);
        }
    }

    /**
     * @param {boolean} result whether the recording was successful
     * @param {string} file file path of the recorded file
     */
    doRecResult(result, file) {
        if (result) {
            isActive = true;

            Lib.TalkativeLog('-*-record OK');
            // update indicator
            const indicators = this._settings.getOption('i', Settings.STATUS_INDICATORS_SETTING_KEY);
            this._replaceStdIndicator(indicators === 1 || indicators === 3);

            if (this.isShowNotify) {
                Lib.TalkativeLog('-*-show notify');
                // create counting notify
                this.notifyCounting = this.CtrlNotify.createNotify(
                    _('Start Recording'),
                    this._icons.on
                );
                this.notifyCounting.connect('destroy', () => {
                    Lib.TalkativeLog('-*-notification destroyed');
                    this.notifyCounting = null;
                });

                // start counting rec
                timerC = new Time.TimerCounting((secpassed, alertEnd) => {
                    this._refreshNotify(secpassed, alertEnd);
                }, this);
                timerC.begin();
            }

            // update path file video
            pathFile = file;
            Lib.TalkativeLog(`-*-update abs file path -> ${pathFile}`);
        } else {
            Lib.TalkativeLog('-*-record ERROR');

            pathFile = '';

            if (this.isShowNotify) {
                Lib.TalkativeLog('-*-show error notify');
                this.CtrlNotify.createNotify(
                    _('ERROR RECORDER - See logs for more info'),
                    this._icons.off
                );
            }
        }
        this.refreshIndicator(false);
    }

    /**
     * @param {number} sec the seconds passed
     * @param {boolean} alertEnd whether the timer is ending
     */
    _refreshNotify(sec, alertEnd) {
        if (this.notifyCounting !== null && this.notifyCounting !== undefined && this.isShowNotify) {
            if (alertEnd) {
                this.CtrlNotify.updateNotify(
                    this.notifyCounting,
                    _(`Finish Recording / Seconds : ${sec}`),
                    this._icons.off,
                    true
                );
            } else {
                this.CtrlNotify.updateNotify(
                    this.notifyCounting,
                    _('Recording ... / Seconds passed : ') + sec,
                    this._icons.on,
                    false
                );
            }
        }
    }

    /**
     * @private
     */
    _openExtensionPreferences() {
        try {
            this._extension.openPreferences();
        } catch (e) {
            Lib.TalkativeLog(`Failed to open preferences: ${e}`);
        }
    }

    /**
     * @private
     */
    _onDelayTimeChanged() {
        const secDelay = Math.floor(this.TimeSlider.value * 100);
        this._settings.setOption(Settings.TIME_DELAY_SETTING_KEY, secDelay);
        if (secDelay > 0)
            this.smDelayRec.label.text = secDelay + _(' sec. delay before recording');
        else
            this.smDelayRec.label.text = _('Start recording immediately');
    }

    /**
     * @param {boolean} focus selects the correct icon depending on the focus state
     */
    refreshIndicator(focus) {
        Lib.TalkativeLog(`-*-refresh indicator -A ${isActive} -F ${focus}`);

        const indicators = this._settings.getOption('i', Settings.STATUS_INDICATORS_SETTING_KEY);

        if (isActive === true) {
            if (indicators === 0 || indicators === 1) {
                if (focus === true)
                    this.indicatorIcon.set_gicon(this._icons.onSel);
                else
                    this.indicatorIcon.set_gicon(this._icons.on);
            } else if (this._settings.getOption('b', Settings.ACTIVE_SHORTCUT_SETTING_KEY)) {
                this.indicatorIcon.set_gicon(null);
            } else if (focus === true) {
                this.indicatorIcon.set_gicon(this._icons.onSel);
            } else {
                this.indicatorIcon.set_gicon(this._icons.on);
            }

            this.RecordingLabel.set_text(_('Stop recording'));
        } else {
            if (focus === true)
                this.indicatorIcon.set_gicon(this._icons.offSel);
            else
                this.indicatorIcon.set_gicon(this._icons.off);

            this.RecordingLabel.set_text(_('Start recording'));
        }
    }

    /**
     * @param {boolean} OPTtemp whether to replace the standard indicator or use it
     * @private
     */
    _replaceStdIndicator(OPTtemp) {
        if (Main.panel.statusArea === undefined) {
            Lib.TalkativeLog('-*-no Main.panel.statusArea found');
            return;
        }

        var stdMenu = Main.panel.statusArea.quickSettings;
        if (stdMenu === undefined) {
            Lib.TalkativeLog('-*-no quickSettings or aggregateMenu in Main.panel.statusArea');
            return;
        }
        if (stdMenu._remoteAccess === undefined) {
            Lib.TalkativeLog('-*-no _remoteAccess indicator applet found');
            return;
        }
        var indicator = stdMenu._remoteAccess._indicator;
        if (indicator === undefined) {
            Lib.TalkativeLog('-*-no _indicator or _recordingIndicator found');
            return;
        }

        if (OPTtemp) {
            Lib.TalkativeLog('-*-replace STD indicator');
            indicator.visible = false;
        } else {
            Lib.TalkativeLog('-*-use STD indicator');
            indicator.visible = isActive;
        }
    }

    /**
     * @private
     */
    _enableKeybindings() {
        if (this._settings.getOption('b', Settings.ACTIVE_SHORTCUT_SETTING_KEY)) {
            Lib.TalkativeLog('-*-enable keybinding');

            Main.wm.addKeybinding(
                Settings.SHORTCUT_KEY_SETTING_KEY,
                this._settings._settings,
                Meta.KeyBindingFlags.NONE,
                // available modes: https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/src/shell-action-modes.h
                Shell.ActionMode.NORMAL |
                    Shell.ActionMode.OVERVIEW |
                    Shell.ActionMode.POPUP |
                    Shell.ActionMode.SYSTEM_MODAL,
                () => {
                    Lib.TalkativeLog('-*-intercept key combination');
                    this._doRecording();
                }
            );
            keybindingConfigured = true;
        }
    }

    /**
     * @private
     */
    _removeKeybindings() {
        if (keybindingConfigured) {
            Lib.TalkativeLog('-*-remove keybinding');
            Main.wm.removeKeybinding(Settings.SHORTCUT_KEY_SETTING_KEY);
            keybindingConfigured = false;
        }
    }

    getSelectedRect() {
        var recX = this._settings.getOption('i', Settings.X_POS_SETTING_KEY);
        var recY = this._settings.getOption('i', Settings.Y_POS_SETTING_KEY);
        var recW = this._settings.getOption('i', Settings.WIDTH_SETTING_KEY);
        var recH = this._settings.getOption('i', Settings.HEIGHT_SETTING_KEY);
        return [recX, recY, recW, recH];
    }

    saveSelectedRect(x, y, h, w) {
        this._settings.setOption(Settings.X_POS_SETTING_KEY, x);
        this._settings.setOption(Settings.Y_POS_SETTING_KEY, y);
        this._settings.setOption(Settings.HEIGHT_SETTING_KEY, h);
        this._settings.setOption(Settings.WIDTH_SETTING_KEY, w);
    }

    getSettings() {
        return this._settings;
    }

    getAudioSource() {
        return this.CtrlAudio.getAudioSource();
    }

    /**
     * Destroy indicator
     */
    destroy() {
        Lib.TalkativeLog('-*-destroy indicator called');

        if (isActive)
            isActive = false;

        if (this._settings) {
            this._settings.destroy();
            this._settings = null;
        }

        super.destroy();
    }
});

export default class EasyScreenCast extends Extension {
    /**
     *
     */
    enable() {
        Lib.TalkativeLog('-*-enableExtension called');
        Lib.TalkativeLog(`-*-version: ${this.metadata.version}`);
        Lib.TalkativeLog(`-*-install path: ${this.path}`);
        Lib.TalkativeLog(`-*-version (package.json): ${Lib.getFullVersion()}`);

        if (Indicator === null || Indicator === undefined) {
            Lib.TalkativeLog('-*-create indicator');

            Indicator = new EasyScreenCastIndicator(this);
            Main.panel.addToStatusArea('EasyScreenCast-indicator', Indicator);
        }

        Indicator._enable();
    }

    /**
     *
     */
    disable() {
        Lib.TalkativeLog('-*-disableExtension called');

        if (timerD !== null) {
            Lib.TalkativeLog('-*-timerD stopped');
            timerD.stop();
            timerD = null;
        }

        // this might happen, if the extension is disabled during recording
        if (timerC !== null) {
            // stop counting rec
            timerC.halt();
            timerC = null;
        }


        if (Indicator !== null) {
            Lib.TalkativeLog('-*-indicator call destroy');

            Indicator._disable();
            Indicator.destroy();
            Indicator = null;
        }
    }
}

export {Indicator};
