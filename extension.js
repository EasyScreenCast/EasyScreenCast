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
const St = imports.gi.St;
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;
const Lang = imports.lang;
const PanelMenu = imports.ui.panelMenu;
const Panel = imports.ui.panel;
const PopupMenu = imports.ui.popupMenu;
const MessageTray = imports.ui.messageTray;
const Main = imports.ui.main;
const LibRecorder = imports.ui.components.recorder;


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
let ScreenVideo = new LibRecorder.Recorder();
let isActive = false;
let isFocus=false;


const EasyScreenCast_Indicator = new Lang.Class({
    Name: 'EasyScreenCast.indicator',
    Extends: PanelMenu.SystemStatusButton,

    _init: function() {
	    this.parent(null, "EasyScreenCast-indicator"); 
	    
        //add enter/leave event
        this.actor.connect('enter-event', Lang.bind(this, function(){
            Lib.TalkativeLog('ESC > enter indicator');
            isFocus=true;
            refreshIndicator();
        }));
        this.actor.connect('leave-event', Lang.bind(this, function(){
            Lib.TalkativeLog('ESC > leave indicator');
            isFocus=false;
            refreshIndicator();
        }));

	    //prepare setting var
	    this.isDelayActive=Pref.getActiveDelay();
	    this.isShowNotify=Pref.getShowTimerRec();
	    
	    //add icon
        this.setGIcon(Lib.ESCoffGIcon);
        
        this.DelayTimeSlider=null;
        this.notifyCounting;
        
        //add start/stop menu entry
	    this.imRecordAction = new PopupMenu.PopupBaseMenuItem();
	    this.RecordingLabel = new St.Label({ text: _("Start recording"),
	                                        style_class: 'RecordAction-label' });
	    this.imRecordAction.addActor(this.RecordingLabel, 
	                                { align: St.Align.START });
	    this.menu.addMenuItem(this.imRecordAction);
	    this.imRecordAction.connect('activate', Lang.bind(this, function(){
            this.isShowNotify=Pref.getShowTimerRec();
            this._doDelayAction();
        }));
	    
        //add separetor menu
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        //add delay menu entry
	    this.imDelayRec = new PopupMenu.PopupSwitchMenuItem(_("Delay recording"),
	                        Pref.getActiveDelay(),
                            { style_class: 'popup-subtitle-menu-item' });
	    this.imDelayRec.connect("toggled", Lang.bind(this, function(item){
            if (item.state) {
			    this.isDelayActive=true;
		    } else {
			    this.isDelayActive=false;
		    }
		    Pref.setActiveDelay(item.state);
        }));
        
	    this.menu.addMenuItem(this.imDelayRec);

	    
	    this.DelayTimeTitle = new PopupMenu.PopupMenuItem(_("Delay Time"),
	                             { reactive: false });
        this.DelayTimeLabel = new St.Label({ text: Math.floor(Pref.getTimeDelay()).toString()
                                                    +_(" Sec") });
        this.DelayTimeSlider = new PopupMenu.PopupSliderMenuItem(Pref.getTimeDelay()/100);
        this.DelayTimeSlider.connect('value-changed', Lang.bind(this, function(item) {
            this.DelayTimeLabel.set_text(Math.floor(item.value*100).toString()+_(" Sec"));
        }));
        
        this.DelayTimeSlider.connect('drag-end', Lang.bind(this, this._onDelayTimeChanged));
        this.DelayTimeSlider.actor.connect('scroll-event', 
                                Lang.bind(this, this._onDelayTimeChanged));
        this.DelayTimeTitle.addActor(this.DelayTimeLabel, { align: St.Align.END });
        this.menu.addMenuItem(this.DelayTimeTitle);
        this.menu.addMenuItem(this.DelayTimeSlider);
        
        //add separetor menu
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        //add option menu entry
	    this.imOptions = new PopupMenu.PopupMenuItem(_("Options"));
	    this.menu.addMenuItem(this.imOptions);
	    this.imOptions.connect('activate', Lang.bind(this, this._doExtensionPreferences));
	   
    },
    
    _doDelayAction: function() {
        if(this.isDelayActive  && !isActive){
            Lib.TalkativeLog('ESC > delay recording called | delay= ' + this.DelayTimeSlider.value);
       	    timerD = new Time.TimerDelay((Math.floor(this.DelayTimeSlider.value*100)),this._doRecording,this);
       	    timerD.begin();
        } else {
            Lib.TalkativeLog('ESC > instant recording called');
            this._doRecording();
        }
    },

	_doRecording: function() {
        
        //start/stop record screen
        ScreenVideo._toggleRecorder();
        
        if(isActive===false){
            Lib.TalkativeLog('ESC > start recording');
            isActive=true;

            if(this.isShowNotify){
                Lib.TalkativeLog('ESC > show notify');
                //create notify
                var source = new MessageTray.SystemNotificationSource();
                
                this.notifyCounting  = new MessageTray.Notification(source, 
                                        _("Start Recording"),
                                        null,
                                        { gicon: Lib.ESConGIcon });
                this.notifyCounting.setTransient(false);
                this.notifyCounting.setResident(true);
        
                Main.messageTray.add(source);
                source.notify(this.notifyCounting);
                
                //start counting rec
                timerC = new Time.TimerCounting(refreshNotify,this);
                timerC.begin();
            }
        } else {
            Lib.TalkativeLog('ESC > stop recording');
            isActive=false;
            
            if(timerC!==null){
                //stop counting rec
                timerC.halt();
                timerC=null;
            }

        }
        
        refreshIndicator();
	},

    _doExtensionPreferences: function() {
        Lib.TalkativeLog('ESC > open preferences');
        Main.Util.trySpawnCommandLine('gnome-shell-extension-prefs EasyScreenCast@iacopodeenosee.gmail.com');
    },

    _onDelayTimeChanged: function() {
        Pref.setTimeDelay(Math.floor(this.DelayTimeSlider.value*100));
    },

    destroy: function() {
        this.parent();
    }
});

function refreshIndicator() {
    Lib.TalkativeLog('ESC > refresh indicator');
    if(Indicator!==null){
        if(isActive===true){
            if(isFocus===true){
                Indicator.setGIcon(Lib.ESConGIconSel);
            } else {
                Indicator.setGIcon(Lib.ESConGIcon);
            }

            Indicator.RecordingLabel.set_text(_("Stop recording"));
        } else {
            if(isFocus===true){
                Indicator.setGIcon(Lib.ESCoffGIconSel);
            } else {
                Indicator.setGIcon(Lib.ESCoffGIcon);
            }
            Indicator.RecordingLabel.set_text(_("Start recording"));
        }
    }
}

function refreshNotify(sec,alertEnd){
    if(Indicator.notifyCounting!==null || Indicator.notifyCounting === undefined){
        if(alertEnd){
            Indicator.notifyCounting.update(_("EasyScreenCast -> Finish Recording"),
                                            _("total Seconds : "+ sec),
                                            { gicon: Lib.ESCoffGIcon });
        } else {
            Indicator.notifyCounting.update(_("EasyScreenCast -> Seconds passed : ") + sec,
                                            _("Recording in progress"),
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
	    Indicator = new EasyScreenCast_Indicator;
        Main.panel.addToStatusArea('EasyScreenCast-indicator', Indicator);
        
        //binding keys
        var BindKeys = new Gio.Settings({ schema: 'org.gnome.shell.keybindings' });
        Main.wm.addKeybinding('toggle-recording',
            BindKeys,
            Meta.KeyBindingFlags.NONE,
            Shell.KeyBindingMode.ALL,
            Lang.bind(this, refreshIndicator));
	}

}

function disable() {
	Lib.TalkativeLog('ESC > disableExtension called');
    
    if(timerD!==null){
        timerD.stop();
    }
    
    Main.wm.removeKeybinding('toggle-recording');
    if(Indicator){
        Indicator.destroy();
    }
    Indicator=null;
}
