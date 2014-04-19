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

const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const GLib = imports.gi.GLib;
const St = imports.gi.St;
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;
const Lang = imports.lang;
const PanelMenu = imports.ui.panelMenu;
const Panel = imports.ui.panel;
const PopupMenu = imports.ui.popupMenu;
const MessageTray = imports.ui.messageTray;
const Slider = imports.ui.slider;
const Main = imports.ui.main;
const LibRecorder = imports.ui.screencast;


const Gettext = imports.gettext.domain('EasyScreenCast@iacopodeenosee.gmail.com');
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Lib = Me.imports.convenience;
const Pref = Me.imports.prefs;
const Time = Me.imports.timer;
const UtilRecorder = Me.imports.utilrecorder;

let Indicator;
let timerD=null;
let timerC=null;

let isActive = false;


const EasyScreenCast_Indicator = new Lang.Class({
    Name: 'EasyScreenCast.indicator',
    Extends: PanelMenu.Button,

    _init: function() {
        this.parent(null, 'EasyScreenCast-indicator'); 
        
        //add enter/leave event
        this.actor.connect('enter-event', Lang.bind(this,this.refreshIndicator,true));
        this.actor.connect('leave-event', Lang.bind(this,this.refreshIndicator,false));

        //prepare setting var
        this.isDelayActive=Pref.getOption('b',Pref.ACTIVE_DELAY_SETTING_KEY);
        
        //add icon
        this.indicatorBox = new St.BoxLayout;
        this.indicatorIcon =new St.Icon({ gicon: Lib.ESCoffGIcon, icon_size: 16});

        this.indicatorBox.add_actor (this.indicatorIcon);
        this.actor.add_actor(this.indicatorBox);
        
        //init var
        this.recorder = new UtilRecorder.CaptureVideo();
        this.TimeSlider=null;
        this.notifyCounting;
        
        //add start/stop menu entry
        this.imRecordAction = new PopupMenu.PopupBaseMenuItem;
        this.RecordingLabel = new St.Label({ text: _('Start recording'),
                                            style_class: 'RecordAction-label' });
        this.imRecordAction.actor.add_child(this.RecordingLabel, 
                                    { align: St.Align.START });
        this.menu.addMenuItem(this.imRecordAction);
        this.imRecordAction.connect('activate', Lang.bind(this, function(){
            this.isShowNotify=Pref.getOption('b',Pref.SHOW_TIMER_REC_SETTING_KEY);
            this._doDelayAction();
        }));
        
        //add separetor menu
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem);

        //add delay menu entry
        this.imDelayRec = new PopupMenu.PopupSwitchMenuItem(_('Delay recording'),
                            this.isDelayActive,
                            { style_class: 'popup-subtitle-menu-item' });
        this.imDelayRec.connect('toggled', Lang.bind(this, function(item){
            if (item.state) {
                this.isDelayActive=true;
                  
                this.DelayTimeTitle.actor.show;
                this.TimeSlider.actor.show;
            } else {
                this.isDelayActive=false;
                
                this.DelayTimeTitle.actor.hide;
                this.TimeSlider.actor.hide;
            }
            Pref.setOption(Pref.ACTIVE_DELAY_SETTING_KEY, item.state);
        }));
        
        this.menu.addMenuItem(this.imDelayRec);
        
        this.DelayTimeTitle = new PopupMenu.PopupMenuItem(_('Delay Time'),
                                 { reactive: false });
        this.DelayTimeLabel = new St.Label({ text: Math.floor(Pref.getOption('i',
            Pref.TIME_DELAY_SETTING_KEY)).toString() + _(' Sec') });
        this.DelayTimeTitle.actor.add_child(this.DelayTimeLabel, { align: St.Align.END });
        
        this.imSliderDelay = new PopupMenu.PopupBaseMenuItem({ activate: false });
        this.TimeSlider = new Slider.Slider(Pref.getOption('i',
            Pref.TIME_DELAY_SETTING_KEY)/100);
        this.TimeSlider.connect('value-changed', Lang.bind(this, function(item) {
            this.DelayTimeLabel.set_text(Math.floor(item.value*100).toString()+_(' Sec'));
        }));
        
        this.TimeSlider.connect('drag-end', Lang.bind(this, this._onDelayTimeChanged));
        this.TimeSlider.actor.connect('scroll-event', 
                                Lang.bind(this, this._onDelayTimeChanged));

        this.imSliderDelay.actor.add(this.TimeSlider.actor, { expand: true });
        
        this.menu.addMenuItem(this.DelayTimeTitle);
        this.menu.addMenuItem(this.imSliderDelay);
        
        //add separetor menu
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem);
        //add option menu entry
        this.imOptions = new PopupMenu.PopupMenuItem(_('Options'));
        this.menu.addMenuItem(this.imOptions);
        this.imOptions.connect('activate', Lang.bind(this, this._doExtensionPreferences));
        
        
        if(!this.isDelayActive){
            this.DelayTimeTitle.actor.hide;
            this.TimeSlider.actor.hide;
        }
    },
    
    _doDelayAction: function() {
        if(this.isDelayActive  && !isActive){
            Lib.TalkativeLog('ESC > delay recording called | delay= ' + this.TimeSlider.value);
            timerD = new Time.TimerDelay((Math.floor(this.TimeSlider.value*100)), 
                this._doRecording, this);
            timerD.begin();
        } else {
            Lib.TalkativeLog('ESC > instant recording called');
            this._doRecording();
        }
    },

    _doRecording: function() {
        
        //start/stop record screen
        if(isActive===false){
            Lib.TalkativeLog('ESC > start recording');
            
            //start recording
            this.recorder.start();
        } else {
            Lib.TalkativeLog('ESC > stop recording');
            isActive=false;
            
            this.recorder.stop();
            
            if(timerC!==null){
                //stop counting rec
                timerC.halt();
                timerC=null;
            }

        }
        
        Indicator.refreshIndicator(false);
    },
    
    doRecResult: function(result) {
        if(result){
            isActive=true;

            Lib.TalkativeLog('ESC > record OK');

            if(this.isShowNotify){
                Lib.TalkativeLog('ESC > show notify');
                //create counting notify
                this._createNotify();

                //start counting rec
                timerC = new Time.TimerCounting(refreshNotify,this);
                timerC.begin();
            }
        }else{
            Lib.TalkativeLog('ESC > record ERROR');

            this._createAlertNotify();
        }
        Indicator.refreshIndicator(false);
    },

    _doExtensionPreferences: function() {
        Lib.TalkativeLog('ESC > open preferences');
        Main.Util.trySpawnCommandLine('gnome-shell-extension-prefs EasyScreenCast@iacopodeenosee.gmail.com');
    },

    _onDelayTimeChanged: function() {
        Pref.setOption(Pref.TIME_DELAY_SETTING_KEY,Math.floor(this.TimeSlider.value*100));
    },
    
    _createNotify: function(){
        var source = new MessageTray.SystemNotificationSource();

        this.notifyCounting  = new MessageTray.Notification(source, 
                            _('Start Recording'),
                            null,
                            { gicon: Lib.ESConGIcon});

        this.notifyCounting.setTransient(false);
        this.notifyCounting.setResident(true);

        Main.messageTray.add(source);
        source.notify(this.notifyCounting);
    },
    
    _createAlertNotify: function(){
        var source = new MessageTray.SystemNotificationSource();

        this.notifyAlert  = new MessageTray.Notification(source, 
                            _('ERROR RECORDER - See logs form more info'),
                            null,
                            { gicon: Lib.ESCoffGIcon});

        this.notifyAlert.setTransient(false);
        this.notifyAlert.setResident(true);
        this.notifyAlert.playSound();

        Main.messageTray.add(source);
        source.notify(this.notifyAlert);
    },
    
    refreshIndicator: function(param1, param2, focus){
        Lib.TalkativeLog('ESC > refresh indicator -A '+isActive+' -F '+focus);
        if(Indicator!==null){
            if(isActive===true){
                if(focus===true){
                    Indicator.indicatorIcon.set_gicon(Lib.ESConGIconSel);
                } else {
                    Indicator.indicatorIcon.set_gicon(Lib.ESConGIcon);
                }

                Indicator.RecordingLabel.set_text(_('Stop recording'));
            } else {
                if(focus===true){
                    Indicator.indicatorIcon.set_gicon(Lib.ESCoffGIconSel);
                } else {
                    Indicator.indicatorIcon.set_gicon(Lib.ESCoffGIcon);
                }
                Indicator.RecordingLabel.set_text(_('Start recording'));
            }
        }
    },

    destroy: function() {
        this.destroy();
    }
});

function refreshNotify(sec,alertEnd){
    if(Indicator.notifyCounting!==null || Indicator.notifyCounting !== undefined){
        if(alertEnd){
            Indicator.notifyCounting.update(_('EasyScreenCast -> Finish Recording / Seconds : '+ sec),
                                            null,
                                            { gicon: Lib.ESCoffGIcon });
            
            Indicator.notifyCounting.addAction(_('Open in the filesystem'),
                Lang.bind(this, function(self, action) {
                    Lib.TalkativeLog('ESC > button notification pressed');
                    pathFile=Pref.getOption('s', Pref.FILE_FOLDER_SETTING_KEY)
                    if(pathFile===""){
                        Main.Util.trySpawnCommandLine('xdg-open "$(xdg-user-dir VIDEOS)"');
                    }else{
                        Main.Util.trySpawnCommandLine('xdg-open '+pathFile);
                    }
            }));
            
            Indicator.notifyCounting.playSound();

        } else {
            Indicator.notifyCounting.update(_('EasyScreenCast -> Recording in progress / Seconds passed : ') + sec,
                                            null,
                                            { gicon: Lib.ESConGIcon });
        }
    }
}




function init(meta) {
    Lib.TalkativeLog('ESC > initExtension called');
    
    Lib.initTranslations('EasyScreenCast@iacopodeenosee.gmail.com');
}


function enable() {
    Lib.TalkativeLog('ESC > enableExtension called');
    
    if(Indicator===null || Indicator===undefined){
        Indicator = new EasyScreenCast_Indicator();
        Main.panel.addToStatusArea('EasyScreenCast-indicator', Indicator);
    }
}

function disable() {
    Lib.TalkativeLog('ESC > disableExtension called');
    
    if(timerD!==null){
        timerD.stop();
    }
    
    if(Indicator){
        Indicator.destroy();
    }
    Indicator=null;
}
