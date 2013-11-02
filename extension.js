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

    As additional permission under GNU GPL version 3 section 7, you
    may distribute non-source (e.g., minimized or compacted) forms of
    that code without the copy of the GNU GPL normally required by
    section 4, provided you include this license notice and a URL
    through which recipients can access the Corresponding Source.
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

let Indicator;
let timerD=null;
let timerC=null;

let isActive = false;


const ScreenCastProxy = Gio.DBusProxy.makeProxyWrapper(LibRecorder.ScreencastIface);


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
        this.TimeSlider = new Slider.Slider(Pref.getOption('i', Pref.TIME_DELAY_SETTING_KEY)/100);
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
       
       //connect to d-bus service
        this.ScreenCastService = new ScreenCastProxy(Gio.DBus.session, 'org.gnome.Shell.Screencast',
            '/org/gnome/Shell/Screencast', Lang.bind(this, function(proxy, error) {
            if (error) {
                Lib.TalkativeLog('ESC > ERROR(d-bus proxy connected) - '+error.message);
                return;
            } else 
                Lib.TalkativeLog('ESC > d-bus proxy connected');
        }));
    },
    
    _doDelayAction: function() {
        if(this.isDelayActive  && !isActive){
            Lib.TalkativeLog('ESC > delay recording called | delay= ' + this.TimeSlider.value);
            timerD = new Time.TimerDelay((Math.floor(this.TimeSlider.value*100)), this._doRecording, this);
            timerD.begin();
        } else {
            Lib.TalkativeLog('ESC > instant recording called');
            this._doRecording();
        }
    },

    _doRecording: function() {
        
        //active/deactive standar indicatorBox
        this._replaceIndicator(Pref.getOption('b',Pref.REPLACE_INDICATOR_SETTING_KEY));
        
        //start/stop record screen
        if(isActive===false){
            Lib.TalkativeLog('ESC > start recording');
            isActive=true;
            
            //prepare variable for screencast
            this.fileRec = Pref.getOption('s', Pref.FILE_NAME_SETTING_KEY);
            if(Pref.getOption('s', Pref.FILE_FOLDER_SETTING_KEY)!=='')
                this.fileRec = Pref.getOption('s', Pref.FILE_FOLDER_SETTING_KEY)+'/' + this.fileRec;
            Lib.TalkativeLog('ESC > path/file template : '+this.fileRec);
            
            var optionsRec = {'draw-cursor': new GLib.Variant('b', Pref.getOption('b', Pref.DRAW_CURSOR_SETTING_KEY)),
                'framerate': new GLib.Variant('i', Pref.getOption('i', Pref.FPS_SETTING_KEY)),
                'pipeline': new GLib.Variant('s', Pref.getOption('s', Pref.PIPELINE_REC_SETTING_KEY))};
            
            if(Pref.getOption('i', Pref.AREA_SCREEN_SETTING_KEY)===0){
                Lib.TalkativeLog('ESC > record full screen area');
                //call d-bus remote method screencats
                this.ScreenCastService.ScreencastRemote(this.fileRec, optionsRec,
                    Lang.bind(this, function(result, error) {
                        if (error) {
                            Lib.TalkativeLog('ESC > ERROR(screencast execute) - '
                                +error.message);
                            return;
                        } else 
                            Lib.TalkativeLog('ESC > screencast execute - '+result[0]
                                +' - '+result[1]);
                    }));
            } else {
                Lib.TalkativeLog('ESC > record specific screen area');
                //call d-bus remote method screencatsarea
                this.ScreenCastService.ScreencastAreaRemote(Pref.getOption('i', Pref.X_POS_SETTING_KEY), 
                    Pref.getOption('i', Pref.Y_POS_SETTING_KEY), Pref.getOption('i', 
                    Pref.WIDTH_SETTING_KEY), Pref.getOption('i', Pref.HEIGHT_SETTING_KEY),
                    this.fileRec, optionsRec,
                    Lang.bind(this, function(result, error) {
                        if (error) {
                            Lib.TalkativeLog('ESC > ERROR(screencast execute) - '
                                +error.message);
                            return;
                        } else 
                            Lib.TalkativeLog('ESC > screencast execute - '+result[0]
                                +' - '+result[1]);
                    }));
            }

            if(this.isShowNotify){
                Lib.TalkativeLog('ESC > show notify');
                //create notify
                this._createNotify();
                
                //start counting rec
                timerC = new Time.TimerCounting(refreshNotify,this);
                timerC.begin();
            }
        } else {
            Lib.TalkativeLog('ESC > stop recording');
            isActive=false;
            
            this.ScreenCastService.StopScreencastRemote(Lang.bind(this, function(result, error) {
                if (error) {
                    Lib.TalkativeLog('ESC > ERROR(screencast stop) - '+error.message);
                    return;
                } else 
                    Lib.TalkativeLog('ESC > screencast stop - '+result[0]);
            }));
            
            if(timerC!==null){
                //stop counting rec
                timerC.halt();
                timerC=null;
            }

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

        this.notifyCounting.addButton('open',_('Open in the filesystem'));
        this.notifyCounting.connect('action-invoked', Lang.bind(this, function(self, action) {
        switch (action) {
            case 'open':
                Lib.TalkativeLog('ESC > button notification pressed');
                Main.Util.trySpawnCommandLine('xdg-open '+this.fileRec);
            break;
        }
            this.notifyCounting.destroy();
        }));

        Main.messageTray.add(source);
        source.notify(this.notifyCounting);
    },
    
    _replaceIndicator: function(temp){
        if(temp){
            Lib.TalkativeLog('ESC > replace indicator');
            Panel.AggregateMenu._screencast=new Lang.Class({
                Name: 'ScreencastIndicator',
                Extends: PanelMenu.SystemIndicator,
                
                _init: function() {
                    this.parent();

                    this._indicator = this._addIndicator();
                    this._indicator.icon_name = 'media-record-symbolic';
                    this._indicator.add_style_class_name('screencast-indicator');
                    this._sync();

                    this._indicator.visible = false;
                },
            });
        }else{
            Lib.TalkativeLog('ESC > use standard indicator');
            Panel.AggregateMenu._screencast=new imports.ui.status.screencast.Indicator();
        }
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
        this.parent;
    }
});

function refreshNotify(sec,alertEnd){
    if(Indicator.notifyCounting!==null || Indicator.notifyCounting === undefined){
        if(alertEnd){
            Indicator.notifyCounting.update(_('EasyScreenCast -> Finish Recording / Seconds : '+ sec),
                                            null,
                                            { gicon: Lib.ESCoffGIcon });
            Indicator.notifyCounting.setButtonSensitive('open',true);
        } else {
            Indicator.notifyCounting.update(_('EasyScreenCast -> Recording in progress / Seconds passed : ') + sec,
                                            null,
                                            { gicon: Lib.ESConGIcon });
            Indicator.notifyCounting.setButtonSensitive('open',false);
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
