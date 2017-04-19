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

const St = imports.gi.St;
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;
const Lang = imports.lang;
const PanelMenu = imports.ui.panelMenu;
const Clutter = imports.gi.Clutter;
const Panel = imports.ui.panel;
const PopupMenu = imports.ui.popupMenu;
const MessageTray = imports.ui.messageTray;
const Slider = imports.ui.slider;
const Main = imports.ui.main;
const LibRecorder = imports.ui.screencast;

const Gettext = imports.gettext.domain(
    'EasyScreenCast@iacopodeenosee.gmail.com');
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Lib = Me.imports.convenience;
const Settings = Me.imports.settings;
const Time = Me.imports.timer;
const UtilRecorder = Me.imports.utilrecorder;
const UtilAudio = Me.imports.utilaudio;
const UtilWebcam = Me.imports.utilwebcam;
const UtilNotify = Me.imports.utilnotify;
const Selection = Me.imports.selection;


let Indicator;
let timerD = null;
let timerC = null;

let isActive = false;
let pathFile = '';


const EasyScreenCast_Indicator = new Lang.Class({
    Name: 'EasyScreenCast.indicator',
    Extends: PanelMenu.Button,

    _init: function() {
        this.parent(null, 'EasyScreenCast-indicator');

        this.CtrlAudio = new UtilAudio.MixerAudio();
        this.CtrlWebcam = new UtilWebcam.HelperWebcam();
        this.CtrlNotify = new UtilNotify.NotifyManager();

        //check audio
        if (!this.CtrlAudio.checkAudio()) {
            Lib.TalkativeLog('-*-disable audio recording');
            Settings.setOption(Settings.INPUT_AUDIO_SOURCE_SETTING_KEY, 0);
            Settings.setOption(Settings.ACTIVE_CUSTOM_GSP_SETTING_KEY,
                Settings.getGSPstd(false));
        }

        //add enter/leave/click event
        this.actor.connect(
            'enter_event', Lang.bind(this, this.refreshIndicator, true));
        this.actor.connect(
            'leave_event', Lang.bind(this, this.refreshIndicator, false));
        this.actor.connect(
            'button_press_event', Lang.bind(this, this._onButtonPress, false));

        //prepare setting var
        if (Settings.getOption('i', Settings.TIME_DELAY_SETTING_KEY) > 0) {
            this.isDelayActive = true;
        } else {
            this.isDelayActive = false;
        }

        // Add the title bar icon and label for time display
        this.indicatorBox = new St.BoxLayout();
        this.indicatorIcon = new St.Icon({
            gicon: Lib.ESCoffGIcon,
            icon_size: 16
        });
        this.timeLabel = new St.Label({
            text: "",
            style_class: 'time-label',
            y_expand: true,
            y_align: Clutter.ActorAlign.CENTER
        });

        this.indicatorBox.add_actor(this.timeLabel);
        this.indicatorBox.add_actor(this.indicatorIcon);

        //init var
        this.recorder = new UtilRecorder.CaptureVideo();
        this.AreaSelected = null;
        this.TimeSlider = null;

        //add start/stop menu entry
        this._addMIRecording();

        //add separetor menu
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        //add sub menu audio recording
        this.smAudioRec = new PopupMenu.PopupSubMenuMenuItem(
             _('No audio source'), true
        );
        this.smAudioRec.icon.icon_name = 'audio-input-microphone-symbolic';
        this.menu.addMenuItem(this.smAudioRec);
        this._addSubMenuAudioRec();

        //add sub menu webcam recording
        this._addSubMenuWebCam();

        //add sub menu area recording
        this._addSubMenuAreaRec();

        //add sub menu delay recording
        this._addSubMenuDelayRec();

        //add separetor menu
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        //add option menu entry
        this.imOptions = new PopupMenu.PopupMenuItem(_('Options'));
        this.imOptions.actor.insert_child_at_index(new St.Icon({
            style_class: 'popup-menu-icon',
            icon_name: 'preferences-other-symbolic'
        }), 1);
        this.menu.addMenuItem(this.imOptions);
        this.imOptions.connect(
            'activate', Lang.bind(this, this._doExtensionPreferences));
    },

    /**
    * Set a new value for the time label. Integers are
    * converted to seconds, minutes, hours. All other
    * values are converted to strings.
    */
    updateTimeLabel: function(newValue) {
        function padZeros(number) {
            if (number < 10) {
                number = "0" + number;
            }

            return number.toString()
        }

        if (typeof(newValue) == "number") {
            let hours = Math.floor(newValue / 3600);
            newValue = newValue - hours * 3600;

            let minutes = Math.floor(newValue / 60);
            newValue = newValue - minutes * 60;

            newValue = padZeros(hours) +
                 ':' + padZeros(minutes) +
                 ':' + padZeros(newValue);
        }

        this.timeLabel.set_text(newValue.toString());
    },

     /* Left clicking on the icon toggles the recording
      * options menu. Any other mouse button will start
      * the recording.
      * Some submenus are refreshed to account for new
      * sources.
     */
    _onButtonPress: function(actor, event) {
        let button = event.get_button();

        if (button === 1) {
            Lib.TalkativeLog('-*-left click indicator');

            this._addSubMenuAudioRec();
        } else {
            Lib.TalkativeLog('-*-right click indicator');

            if (this.menu.isOpen) {
                this.menu.close();
            }
            this.isShowNotify = Settings.getOption(
                'b', Settings.SHOW_NOTIFY_ALERT_SETTING_KEY);
            this._doRecording();
        }
    },

    _addMIRecording: function() {
        this.imRecordAction = new PopupMenu.PopupBaseMenuItem();
        this.RecordingLabel = new St.Label({
            text: _('Start recording'),
            style_class: 'RecordAction-label',
            content_gravity: Clutter.ContentGravity.CENTER,
            x_expand: true,
            x_align: Clutter.ActorAlign.CENTER,
        });
        this.imRecordAction.actor.add_child(this.RecordingLabel, {
            x_expand: true,
            x_fill: true,
            x_align: Clutter.ActorAlign.CENTER,
        });

        this.imRecordAction.connect('activate', Lang.bind(this, function() {
            this.isShowNotify = Settings.getOption(
                'b', Settings.SHOW_NOTIFY_ALERT_SETTING_KEY);

            this._doRecording();
        }));

        this.menu.addMenuItem(this.imRecordAction);
    },

    /* Refreshes the submenu for audio recording sources.
     */
    _addSubMenuAudioRec: function() {
        Lib.TalkativeLog('-*-reset the sub menu audio');
        //remove old menu items
        this.smAudioRec.menu.removeAll();

        Lib.TalkativeLog('-*-add new items to sub menu audio');
        var arrMI = this._createMIAudioRec();
        for (var ele in arrMI) {
            this.smAudioRec.menu.addMenuItem(arrMI[ele]);
        }
    },

    _addSubMenuWebCam: function() {
        this.smWebCam = new PopupMenu.PopupSubMenuMenuItem('', true);
        this.smWebCam.icon.icon_name = 'camera-web-symbolic';
        var arrMI = this._createMIWebCam();
        for (var ele in arrMI) {
            this.smWebCam.menu.addMenuItem(arrMI[ele]);
        }

        this.smWebCam.label.text =
            this.WebCamDevice[Settings.getOption(
                'i', Settings.DEVICE_WEBCAM_SETTING_KEY)];

        this.menu.addMenuItem(this.smWebCam);
    },

    _addSubMenuAreaRec: function() {
        this.smAreaRec = new PopupMenu.PopupSubMenuMenuItem('', true);
        this.smAreaRec.icon.icon_name = 'view-fullscreen-symbolic';

        var arrMI = this._createMIAreaRec();
        for (var ele in arrMI) {
            this.smAreaRec.menu.addMenuItem(arrMI[ele]);
        }

        this.smAreaRec.label.text =
            this.AreaType[Settings.getOption('i', Settings.AREA_SCREEN_SETTING_KEY)];

        this.menu.addMenuItem(this.smAreaRec);
    },

    _addSubMenuDelayRec: function() {
        this.smDelayRec = new PopupMenu.PopupSubMenuMenuItem('', true);
        this.smDelayRec.icon.icon_name = 'alarm-symbolic';

        var arrMI = this._createMIInfoDelayRec();
        for (var ele in arrMI) {
            this.smDelayRec.menu.addMenuItem(arrMI[ele]);
        }

        var secDelay = Settings.getOption('i', Settings.TIME_DELAY_SETTING_KEY);
        if (secDelay > 0) {
            this.smDelayRec.label.text = secDelay + _(' sec. delay before recording');
        } else {
            this.smDelayRec.label.text = _('Start recording immediately');
        }

        this.menu.addMenuItem(this.smDelayRec);
    },

    _createMIAreaRec: function() {
        this.AreaType = new Array(_('Record all desktop'),
            _('Record a selected monitor'), _('Record a selected window'),
            _('Record a selected area'));

        this.AreaMenuItem = new Array(this.AreaType.length);

        for (var i = 0; i < this.AreaMenuItem.length; i++) {
            this.AreaMenuItem[i] =
                new PopupMenu.PopupMenuItem(this.AreaType[i], {
                    reactive: true,
                    activate: true,
                    hover: true,
                    can_focus: true
                });

            (function(i, arr, item) {
                this.connectMI = function() {
                    this.connect('activate',
                        Lang.bind(this, function() {
                            Lib.TalkativeLog('-*-set area recording to ' + i + ' ' + arr[i]);
                            Settings.setOption(Settings.AREA_SCREEN_SETTING_KEY, i);

                            item.label.text = arr[i];
                        }));
                };
                this.connectMI();
            }).call(this.AreaMenuItem[i], i, this.AreaType, this.smAreaRec);
        }

        return this.AreaMenuItem;
    },

    _createMIWebCam: function() {
        this.WebCamDevice = new Array(_('No WebCam recording'));
        //add menu item webcam device from GST
        this.WebCamDevice.push((this.CtrlWebcam.getNameDevices().join()));
        Lib.TalkativeLog('-*-webcam list: ' + this.WebCamDevice);
        this.AreaMenuItem = new Array(this.WebCamDevice.length);

        for (var i = 0; i < this.AreaMenuItem.length; i++) {
            this.AreaMenuItem[i] =
                new PopupMenu.PopupMenuItem(this.WebCamDevice[i], {
                    reactive: true,
                    activate: true,
                    hover: true,
                    can_focus: true
                });

            (function(i, arr, item) {
                this.connectMI = function() {
                    this.connect('activate',
                        Lang.bind(this, function() {
                            Lib.TalkativeLog('-*-set webcam device to ' + i + ' ' + arr[i]);
                            Settings.setOption(Settings.DEVICE_WEBCAM_SETTING_KEY, i);

                            item.label.text = arr[i];
                        }));
                };
                this.connectMI();
            }).call(this.AreaMenuItem[i], i, this.WebCamDevice, this.smWebCam);
        }

        return this.AreaMenuItem;
    },

    _createMIAudioRec: function() {
        //add std menu item
        this.AudioChoice = new Array({
            desc: _('No audio source'),
            name: 'N/A',
            port: 'N/A',
            sortable: true,
            resizeable: true
        }, {
            desc: _('Default audio source'),
            name: 'N/A',
            port: 'N/A',
            sortable: true,
            resizeable: true
        });
        //add menu item audio source from PA
        var audioList = this.CtrlAudio.getListInputAudio();
        for (var index in audioList) {
            this.AudioChoice.push(audioList[index]);
        }

        this.AudioMenuItem = new Array(this.AudioChoice.length);

        for (var i = 0; i < this.AudioChoice.length; i++) {
            //create label menu
            let labelMenu = this.AudioChoice[i].desc;
            if (i >= 2) {
                labelMenu += _('\n - Port: ') + this.AudioChoice[i].port +
                    _('\n - Name: ') + this.AudioChoice[i].name;
            }
            //create submenu
            this.AudioMenuItem[i] =
                new PopupMenu.PopupMenuItem(labelMenu, {
                    reactive: true,
                    activate: true,
                    hover: true,
                    can_focus: true,
                });
            //add icon on submenu
            this.AudioMenuItem[i].actor.insert_child_at_index(new St.Icon({
                style_class: 'popup-menu-icon',
                icon_name: 'audio-card-symbolic'
            }), 1);

            //update choice audio from pref
            if (i === Settings.getOption(
                    'i', Settings.INPUT_AUDIO_SOURCE_SETTING_KEY)) {
                Lib.TalkativeLog('-*-get audio choice from pref ' + i);
                this.smAudioRec.label.text = this.AudioChoice[i].desc;
            }

            //add action on menu item
            (function(i, arr, item) {
                this.connectMI = function() {
                    this.connect('activate',
                        Lang.bind(this, function() {
                            Lib.TalkativeLog('-*-set audio choice to ' + i);
                            Settings.setOption(
                                Settings.INPUT_AUDIO_SOURCE_SETTING_KEY, i);

                            item.label.text = arr[i].desc;
                        }));
                };
                this.connectMI();
            }).call(this.AudioMenuItem[i], i,
                this.AudioChoice, this.smAudioRec);
        }
        return this.AudioMenuItem;
    },

    _createMIInfoDelayRec: function() {
        this.DelayTimeTitle = new PopupMenu.PopupMenuItem(_('Delay Time'), {
            reactive: false
        });

        this.DelayTimeLabel = new St.Label({
            text: Math.floor(Settings.getOption('i',
                Settings.TIME_DELAY_SETTING_KEY)).toString() + _(' Sec')
        });
        this.DelayTimeTitle.actor.add_child(this.DelayTimeLabel, {
            align: St.Align.END
        });

        this.imSliderDelay = new PopupMenu.PopupBaseMenuItem({
            activate: false
        });
        this.TimeSlider = new Slider.Slider(Settings.getOption('i',
            Settings.TIME_DELAY_SETTING_KEY) / 100);
        this.TimeSlider.connect(
            'value-changed', Lang.bind(this, function(item) {
                this.DelayTimeLabel.set_text(
                    Math.floor(item.value * 100).toString() + _(' Sec'));
            }));

        this.TimeSlider.connect(
            'drag-end', Lang.bind(this, this._onDelayTimeChanged));
        this.TimeSlider.actor.connect('scroll-event',
            Lang.bind(this, this._onDelayTimeChanged));

        this.imSliderDelay.actor.add(this.TimeSlider.actor, {
            expand: true
        });

        return [this.DelayTimeTitle, this.imSliderDelay];
    },

    _enable: function() {
        //enable key binding
        this._enableKeybindings();
        //start monitoring inputvideo
        this.CtrlWebcam.startMonitor();
        //add indicator
        this.actor.add_actor(this.indicatorBox);
    },

    _disable: function() {
        //remove key binding
        this._removeKeybindings();
        //stop monitoring inputvideo
        Indicator.CtrlWebcam.stopMonitor();
        //remove indicator
        this.actor.remove_actor(this.indicatorBox);
    },

    _doDelayAction: function() {
        if (this.isDelayActive) {
            Lib.TalkativeLog('-*-delay recording called | delay= ' + this.TimeSlider.value);
            timerD = new Time.TimerDelay((
                    Math.floor(this.TimeSlider.value * 100)),
                this.recorder.start, this);
            timerD.begin();
        } else {
            Lib.TalkativeLog('-*-instant recording called');
            //start recording
            this.recorder.start();
        }
    },

    _doRecording: function() {
        //start/stop record screen
        if (isActive === false) {
            Lib.TalkativeLog('-*-start recording');

            pathFile = '';

            //get selected area
            var optArea = (Settings.getOption('i', Settings.AREA_SCREEN_SETTING_KEY));
            if (optArea > 0) {
                Lib.TalkativeLog('-*-type of selection of the area to record: ' + optArea);
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
                //stop counting rec
                timerC.halt();
                timerC = null;
            }

            //execute post-command
            if (Settings.getOption('b', Settings.ACTIVE_POST_CMD_SETTING_KEY)) {
                Lib.TalkativeLog('-*-execute post command');

                //launch cmd after registration
                var tmpCmd = Settings.getOption('s', Settings.POST_CMD_SETTING_KEY);

                var mapObj = {
                    _fpath: pathFile,
                    _dirpath: pathFile.substr(0, pathFile.lastIndexOf('/')),
                    _fname: pathFile.substr(pathFile.lastIndexOf('/') + 1,
                        pathFile.length)
                };

                var Cmd = tmpCmd.replace(/_fpath|_dirpath|_fname/gi,
                    function(match) {
                        return mapObj[match];
                    });

                Lib.TalkativeLog('-*-post command:' + Cmd);

                Main.Util.trySpawnCommandLine(Cmd);
            }
        }

        this.refreshIndicator(false);
    },

    doRecResult: function(result, file) {
        if (result) {
            isActive = true;

            Lib.TalkativeLog('-*-record OK');
            //update indicator
            var indicators = Settings.getOption(
                'i', Settings.STATUS_INDICATORS_SETTING_KEY);
            this._replaceStdIndicator(indicators === 1 || indicators === 3);

            if (this.isShowNotify) {
                Lib.TalkativeLog('-*-show notify');
                //create counting notify
                this.notifyCounting = this.CtrlNotify.createNotify(
                    _('Start Recording'), Lib.ESConGIcon);

                //start counting rec
                timerC = new Time.TimerCounting(refreshNotify, this);
                timerC.begin();
            }

            //update path file video
            pathFile = file;
            Lib.TalkativeLog('-*-update abs file path -> ' + pathFile);

        } else {
            Lib.TalkativeLog('-*-record ERROR');

            pathFile = '';

            if (this.isShowNotify) {
                Lib.TalkativeLog('-*-show error notify');
                this.CtrlNotify.createNotify(
                    _('ERROR RECORDER - See logs for more info'),
                    Lib.ESCoffGIcon);
            }
        }
        this.refreshIndicator(false);
    },

    _doExtensionPreferences: function() {
        Lib.TalkativeLog('-*-open preferences');

        Main.Util.trySpawnCommandLine('gnome-shell-extension-prefs  EasyScreenCast@iacopodeenosee.gmail.com');
    },

    _onDelayTimeChanged: function() {

        var secDelay = Math.floor(this.TimeSlider.value * 100);
        Settings.setOption(Settings.TIME_DELAY_SETTING_KEY, secDelay);
        if (secDelay > 0) {
            this.smDelayRec.label.text = secDelay + _(' sec. delay before recording');
        } else {
            this.smDelayRec.label.text = _('Start recording immediately');
        }
    },

    refreshIndicator: function(param1, param2, focus) {
        Lib.TalkativeLog('-*-refresh indicator -A ' + isActive + ' -F ' + focus);

        var indicators = Settings.getOption(
            'i', Settings.STATUS_INDICATORS_SETTING_KEY);

        if (isActive === true) {
            if (indicators === 0 || indicators === 1) {
                if (focus === true) {
                    this.indicatorIcon.set_gicon(Lib.ESConGIconSel);
                } else {
                    this.indicatorIcon.set_gicon(Lib.ESConGIcon);
                }
            } else {
                if (focus === true) {
                    this.indicatorIcon.set_gicon(Lib.ESCoffGIconSel);
                } else {
                    this.indicatorIcon.set_gicon(Lib.ESCoffGIcon);
                }
            }

            this.RecordingLabel.set_text(_('Stop recording'));
        } else {
            if (focus === true) {
                this.indicatorIcon.set_gicon(Lib.ESCoffGIconSel);
            } else {
                this.indicatorIcon.set_gicon(Lib.ESCoffGIcon);
            }
            this.RecordingLabel.set_text(_('Start recording'));
        }
    },

    _replaceStdIndicator: function(OPTtemp) {
        if (OPTtemp) {
            Lib.TalkativeLog('-*-replace STD indicator');
            Main.panel.statusArea['aggregateMenu']
                ._screencast._indicator.visible = false;
        } else {
            Lib.TalkativeLog('-*-use STD indicator');
            Main.panel.statusArea['aggregateMenu']
                ._screencast._indicator.visible = isActive;
        }
    },

    _enableKeybindings: function() {
        if (Settings.getOption('b', Settings.ACTIVE_SHORTCUT_SETTING_KEY)) {
            Lib.TalkativeLog('-*-enable keybinding');

            Main.wm.addKeybinding(
                Settings.SHORTCUT_KEY_SETTING_KEY,
                Settings.settings,
                Meta.KeyBindingFlags.NONE,
                Shell.ActionMode.NORMAL |
                Shell.ActionMode.MESSAGE_TRAY |
                Shell.ActionMode.OVERVIEW |
                Shell.ActionMode.POPUP,
                Lang.bind(this, function() {
                    Lib.TalkativeLog('-*-intercept key combination');
                    this._doRecording();
                })
            );
        }
    },

    _removeKeybindings: function() {
        if (Settings.getOption('b', Settings.ACTIVE_SHORTCUT_SETTING_KEY)) {
            Lib.TalkativeLog('-*-remove keybinding');

            Main.wm.removeKeybinding(Settings.SHORTCUT_KEY_SETTING_KEY);
        }
    },

    destroy: function() {
        Lib.TalkativeLog('-*-destroy indicator called');

        if (isActive) {
            isActive = false;
        }

        this.parent();
    }
});

function refreshNotify(sec, alertEnd) {
    if (Indicator.notifyCounting !== null ||
        Indicator.notifyCounting !== undefined || Indicator.isShowNotify) {
        if (alertEnd) {

            this.CtrlNotify.updateNotify(this.notifyCounting,
                _('EasyScreenCast -> Finish Recording / Seconds : ' + sec),
                Lib.ESCoffGIcon,
                true);
        } else {
            this.CtrlNotify.updateNotify(this.notifyCounting,
                _('EasyScreenCast -> Recording in progress / Seconds passed : ') + sec,
                Lib.ESConGIcon,
                false);
        }
    }
}

function init(meta) {
    Lib.TalkativeLog('-*-initExtension called');

    Lib.initTranslations('EasyScreenCast@iacopodeenosee.gmail.com');
}

function enable() {
    Lib.TalkativeLog('-*-enableExtension called');

    if (Indicator === null || Indicator === undefined) {
        Lib.TalkativeLog('-*-create indicator');

        Indicator = new EasyScreenCast_Indicator();
        Main.panel.addToStatusArea('EasyScreenCast-indicator', Indicator);
    }

    Indicator._enable();
}

function disable() {
    Lib.TalkativeLog('-*-disableExtension called');

    if (timerD !== null) {
        Lib.TalkativeLog('-*-timerD stoped');
        timerD.stop();
    }

    if (Indicator !== null) {
        Lib.TalkativeLog('-*-indicator call destroy');

        Indicator._disable();
        Indicator.destroy();
        Indicator = null;
    }
}
