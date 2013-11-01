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
const PIPELINE_REC_SETTING_KEY = "pipeline";
const FPS_SETTING_KEY = "fps";
const SHOW_INDICATOR_SETTING_KEY = "show-indicator";
const X_POS_SETTING_KEY = "x-pos";
const Y_POS_SETTING_KEY = "y-pos";
const WIDTH_SETTING_KEY = "width-rec";
const HEIGHT_SETTING_KEY = "height-rec";
const DRAW_CURSOR_SETTING_KEY = "draw-cursor";
const AREA_SCREEN_SETTING_KEY = "area-screen";
const FILE_NAME_SETTING_KEY = "file-name";
const FILE_FOLDER_SETTING_KEY = "file-folder";
// setting key - recorder
//const FILE_EXTENSION_SETTING_KEY = "file-extension";
const MAX_DURATION_SETTING_KEY = "max-screencast-length";


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
        checkSettings();
        this.RecorderSettings = new Gio.Settings({ schema: 'org.gnome.settings-daemon.plugins.media-keys' });

        // creates the ui builder and add the main resource file
        let uiFilePath = Me.path + "/EasyScreenCast.gtkbuilder";
        let builder = new Gtk.Builder();
        //builder.set_translation_domain('EasyScreenCast@iacopodeenosee.gmail.comUI');

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
            this.Ref_switch_ShowTimerRec = builder.get_object("swt_ShowTimerRec");
            settings.bind(SHOW_TIMER_REC_SETTING_KEY, this.Ref_switch_ShowTimerRec, "active", Gio.SettingsBindFlags.DEFAULT);
            
            //implements show indicator option
            this.Ref_switch_ShowIndicatorRec = builder.get_object("swt_ShowIndicatorRec");
            settings.bind(SHOW_INDICATOR_SETTING_KEY, this.Ref_switch_ShowIndicatorRec, "active", Gio.SettingsBindFlags.DEFAULT);
            
            //implements draw cursor option
            this.Ref_switch_DrawCursorRec = builder.get_object("swt_DrawCursorRec");
            settings.bind(DRAW_CURSOR_SETTING_KEY, this.Ref_switch_DrawCursorRec, "active", Gio.SettingsBindFlags.DEFAULT);
        
            //implements area recording option
            this.Ref_ComboBox_AreaRec = builder.get_object("cbt_arearec");
            settings.bind(AREA_SCREEN_SETTING_KEY, this.Ref_ComboBox_AreaRec, "active", Gio.SettingsBindFlags.DEFAULT);
            
            //implements image of screen
            this.Ref_Image_Screen = builder.get_object("img_screen");
            this.Ref_Image_Screen.set_from_file(Lib.ESCimgScreen);
            
            //implements FPS option
            this.Ref_spinner_FrameRateRec = builder.get_object("spb_FrameRateRec");
            // Create an adjustment to use for the second spinbutton
            let adjustment1 = new Gtk.Adjustment ({value: 30,lower: 1,upper: 666,
                step_increment: 1,page_increment: 10 });
            this.Ref_spinner_FrameRateRec.configure(adjustment1,10,0);
            settings.bind(FPS_SETTING_KEY, this.Ref_spinner_FrameRateRec, "value", Gio.SettingsBindFlags.DEFAULT);
            
            //implements max duration option
            this.Ref_spinner_MaxDurationRec = builder.get_object("spb_MaxDurationRec");
            // Create an adjustment to use for the second spinbutton
            let adjustment2 = new Gtk.Adjustment ({value: 0,lower: 0,upper: 3600,
                step_increment: 1,page_increment: 10 });
            this.Ref_spinner_MaxDurationRec.configure(adjustment2,10,0);
            this.RecorderSettings.bind(MAX_DURATION_SETTING_KEY, this.Ref_spinner_MaxDurationRec, "value", Gio.SettingsBindFlags.DEFAULT);
            
            //implements specific area options [ X , Y , width , height]
            this.Ref_spinner_X = builder.get_object("spb_XposRec");
            this.Ref_spinner_Y = builder.get_object("spb_YposRec");
            this.Ref_spinner_Width = builder.get_object("spb_WidthRec");
            this.Ref_spinner_Height = builder.get_object("spb_HeigthRec");
            // Create an adjustment to use for the second spinbutton
            let adjustment3 = new Gtk.Adjustment ({value: 0,lower: 0,upper:20000,
                step_increment: 1,page_increment: 10 });
            this.Ref_spinner_X.configure(adjustment3,10,0);
            let adjustment4 = new Gtk.Adjustment ({value: 0,lower: 0,upper:20000,
                step_increment: 1,page_increment: 10 });            
            this.Ref_spinner_Y.configure(adjustment4,10,0);
            let adjustment6 = new Gtk.Adjustment ({value: 600,lower: 0,upper:20000,
                step_increment: 1,page_increment: 10 });
            this.Ref_spinner_Width.configure(adjustment6,10,0);
            let adjustment5 = new Gtk.Adjustment ({value: 400,lower: 0,upper:20000,
                step_increment: 1,page_increment: 10 });
            this.Ref_spinner_Height.configure(adjustment5,10,0);
            settings.bind(X_POS_SETTING_KEY, this.Ref_spinner_X, "value", Gio.SettingsBindFlags.DEFAULT);
            settings.bind(Y_POS_SETTING_KEY, this.Ref_spinner_Y, "value", Gio.SettingsBindFlags.DEFAULT);
            settings.bind(WIDTH_SETTING_KEY, this.Ref_spinner_Width, "value", Gio.SettingsBindFlags.DEFAULT);
            settings.bind(HEIGHT_SETTING_KEY, this.Ref_spinner_Height, "value", Gio.SettingsBindFlags.DEFAULT);
            
            //implements command string rec option
            this.Ref_textedit_Pipeline = builder.get_object("txe_CommandStringRec");
            settings.bind(PIPELINE_REC_SETTING_KEY, this.Ref_textedit_Pipeline, "text", Gio.SettingsBindFlags.DEFAULT);
            
            
            //implements default button action
            this.Ref_button_SetDeafaultSettings = builder.get_object("btn_DefaultOption");
            this.Ref_button_SetDeafaultSettings.connect ("clicked", Lang.bind(this, this._setDefaultsettings));
            
            //implements verbose debug option
            this.Ref_checkboxbutton_VerboseDebug = builder.get_object("ckb_VerboseDebug");
            settings.bind(VERBOSE_DEBUG_SETTING_KEY,this.Ref_checkboxbutton_VerboseDebug, "active", Gio.SettingsBindFlags.DEFAULT);
            
        }
    },
    
    //function to restore default value of the settings
    _setDefaultsettings: function () {
            
        this.Ref_switch_ShowTimerRec.set_active(false);
        this.Ref_switch_ShowIndicatorRec.set_active(true);
        this.Ref_switch_DrawCursorRec.set_active(true);
        this.Ref_radiobutton_FullScreenRec.set_active(true);
        
        this.Ref_spinner_FrameRateRec.set_value(30);
        this.Ref_spinner_MaxDurationRec.set_value(0);

        this.Ref_spinner_X.set_value(0);
        this.Ref_spinner_Y.set_value(0);
        this.Ref_spinner_Width.set_value(600);
        this.Ref_spinner_Height.set_value(400);

        this.Ref_textedit_Pipeline.set_text("vp8enc min_quantizer=13 max_quantizer=13 cpu-used=5 deadline=1000000 threads=%T ! queue ! webmmux");
    }
});

//all getter option
function getVerboseDebug(){
    checkSettings();
    return settings.get_boolean(VERBOSE_DEBUG_SETTING_KEY);
};

function getShowTimerRec(){
    checkSettings();
    return settings.get_boolean(SHOW_TIMER_REC_SETTING_KEY);
};

function getShowIndicatorRec(){
    checkSettings();
    return settings.get_boolean(SHOW_INDICATOR_SETTING_KEY);
};

function getAreaScreenRec(){
    checkSettings();
    return settings.get_int(AREA_SCREEN_SETTING_KEY);
};

function getDrawCursorRec(){
    checkSettings();
    return settings.get_boolean(DRAW_CURSOR_SETTING_KEY);
};

function getPipelineRec(){
    checkSettings();
    return settings.get_string(PIPELINE_REC_SETTING_KEY);
};

function getFPSRec(){
    checkSettings();
    return settings.get_int(FPS_SETTING_KEY);
};

function getXRec(){
    checkSettings();
    return settings.get_int(X_POS_SETTING_KEY);
};
function getYRec(){
    checkSettings();
    return settings.get_int(Y_POS_SETTING_KEY);
};
function getWidthRec(){
    checkSettings();
    return settings.get_int(WIDTH_SETTING_KEY);
};
function getHeightRec(){
    checkSettings();
    return settings.get_int(HEIGHT_SETTING_KEY);
};

//all getter/setter option
function getActiveDelay(){
    checkSettings();
    return settings.get_boolean(ACTIVE_DELAY_SETTING_KEY);
};

function getTimeDelay(){
    checkSettings();
    return settings.get_int(TIME_DELAY_SETTING_KEY);
};

function setActiveDelay(temp){
    checkSettings();
    settings.set_boolean(ACTIVE_DELAY_SETTING_KEY, temp);
};

function setTimeDelay(temp){
    checkSettings();
    settings.set_int(TIME_DELAY_SETTING_KEY, temp);
};

function checkSettings(){
    if(settings===null){
        settings = Lib.getSettings("org.gnome.shell.extensions.EasyScreenCast");
    }
}

function buildPrefsWidget() {
    Lib.TalkativeLog('ESC > Init pref widget');
    var widget = new EasyScreenCastSettingsWidget();
    
    widget.show_all();

    return widget;
};
