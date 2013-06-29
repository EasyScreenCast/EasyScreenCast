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

const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Gettext = imports.gettext.domain('EasyScreenCast@iacopodeenosee.gmail.com');
const _ = Gettext.gettext;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Lib = Me.imports.convenience;

// setting keys - own
const ACTIVE_DELAY_SETTING_KEY = "active-delay-time";
const TIME_DELAY_SETTING_KEY = "delay-time";
const SHOW_TIMER_REC_SETTING_KEY = "show-timer-rec";
const VERBOSE_DEBUG_SETTING_KEY = "verbose-debug";
// setting key - recorder
const FILE_EXTENSION_SETTING_KEY = "file-extension";
const FPS_SETTING_KEY = "framerate";
const COMMAND_LINE_REC_SETTING_KEY = "pipeline";

let settings=null;

function init() {
	Lib.initTranslations('EasyScreenCast@iacopodeenosee.gmail.com');
}

const EasyScreenCastSettingsWidget = new GObject.Class({
    Name: 'EasyScreenCast.Prefs.Widget',
    GTypeName: 'EasyScreenCastSettingsWidget',
    Extends: Gtk.Box,

    _init: function(params) {
        this.parent(params);

        this.orientation = Gtk.Orientation.VERTICAL;
        this.spacign = 0;

        // creates the settings
        if(settings===null){
            settings = Lib.getSettings("org.gnome.shell.extensions.EasyScreenCast");
        }
        this.RecorderSettings = new Gio.Settings({ schema: 'org.gnome.shell.recorder' });

        // creates the ui builder and add the main resource file
        let uiFilePath = Me.path + "/EasyScreenCast.gtkbuilder";
        let builder = new Gtk.Builder();
        builder.set_translation_domain('EasyScreenCast@iacopodeenosee.gmail.comUI');

        if (builder.add_from_file(uiFilePath) == 0) {
            Lib.TalkativeLog("ESC > could not load the ui file: %s".format(uiFilePath));

            let label = new Gtk.Label({
                label: _("Could not load the preferences UI file"),
                vexpand: true
            });

            this.pack_start(label, true, true, 0);
        } else {
            Lib.TalkativeLog('ESC > UI file receive and load: '+uiFilePath);

            // gets the interesting builder objects
            let Ref_box_MainContainer = builder.get_object("Main_Container");
            // packs the main table
            this.pack_start(Ref_box_MainContainer, true, true, 0);

            
            //implements show timer option
            let Ref_switch_ShowTimerRec = builder.get_object("swt_ShowTimerRec");
            settings.bind(SHOW_TIMER_REC_SETTING_KEY, Ref_switch_ShowTimerRec, "active", Gio.SettingsBindFlags.DEFAULT);
            
            
            //implements FPS option
            let Ref_spinner_FrameRateRec = builder.get_object("spb_FrameRateRec");
            // Create an adjustment to use for the second spinbutton
            let adjustment = new Gtk.Adjustment ({value: 30,lower: 1,upper: 666,
                step_increment: 1,page_increment: 10 });
            Ref_spinner_FrameRateRec.configure(adjustment,10,0);
            this.RecorderSettings.bind(FPS_SETTING_KEY, Ref_spinner_FrameRateRec, "value", Gio.SettingsBindFlags.DEFAULT);
            
            
            //implements file extension rec option
            let Ref_textedit_FileExtension = builder.get_object("txe_FileExtensionRec");
            this.RecorderSettings.bind(FILE_EXTENSION_SETTING_KEY, Ref_textedit_FileExtension, "text", Gio.SettingsBindFlags.DEFAULT);
            
            
            //implements command string rec option
            let Ref_textedit_CommandStringRec = builder.get_object("txe_CommandStringRec");
            this.RecorderSettings.bind(COMMAND_LINE_REC_SETTING_KEY, Ref_textedit_CommandStringRec, "text", Gio.SettingsBindFlags.DEFAULT);
            
            
            //implements default button action
            let Ref_button_SetDeafaultSettings = builder.get_object("btn_DefaultOption");
            Ref_button_SetDeafaultSettings.connect ("clicked", Lang.bind(this, this._setDefaultsettings));
            
            //implements verbose debug option
            let Ref_checkboxbutton_VerboseDebug = builder.get_object("ckb_VerboseDebug");
            settings.bind(VERBOSE_DEBUG_SETTING_KEY,Ref_checkboxbutton_VerboseDebug, "active", Gio.SettingsBindFlags.DEFAULT);
            
        }
    },
    
    //function to restore default value of the settings
    _setDefaultsettings: function () {
            
        Ref_switch_ShowTimerRec.set_active(false);
        Ref_spinner_FrameRateRec.set_value(30);
        Ref_textedit_FileExtension.set_text("webm");
        Ref_textedit_CommandString.set_text("vp8enc min_quantizer=13 max_quantizer=13 cpu-used=5 deadline=1000000 threads=%T ! queue ! webmmux");
    }
});

function getVerboseDebug(){
    if(settings===null){
         settings = Lib.getSettings("org.gnome.shell.extensions.EasyScreenCast");
    }
    return settings.get_boolean(VERBOSE_DEBUG_SETTING_KEY);
};

function getShowTimerRec(){
    if(settings===null){
         settings = Lib.getSettings("org.gnome.shell.extensions.EasyScreenCast");
    }
    return settings.get_boolean(SHOW_TIMER_REC_SETTING_KEY);
};


function getActiveDelay(){
    if(settings===null){
         settings = Lib.getSettings("org.gnome.shell.extensions.EasyScreenCast");
    }
    return settings.get_boolean(ACTIVE_DELAY_SETTING_KEY);
};

function getTimeDelay(){
    if(settings===null){
         settings = Lib.getSettings("org.gnome.shell.extensions.EasyScreenCast");
    }
    return settings.get_int(TIME_DELAY_SETTING_KEY);
};

function setActiveDelay(temp){
    if(settings===null){
         settings = Lib.getSettings("org.gnome.shell.extensions.EasyScreenCast");
    }
    settings.set_boolean(ACTIVE_DELAY_SETTING_KEY, temp);
};

function setTimeDelay(temp){
    if(settings===null){
         settings = Lib.getSettings("org.gnome.shell.extensions.EasyScreenCast");
    }
    settings.set_int(TIME_DELAY_SETTING_KEY, temp);
};


function buildPrefsWidget() {
    Lib.TalkativeLog('ESC > Init pref widget');
    var widget = new EasyScreenCastSettingsWidget();
    
    widget.show_all();

    return widget;
};
