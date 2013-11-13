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

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Lib = Me.imports.convenience;
const Pref = Me.imports.prefs;

const CaptureVideo = new Lang.Class({
    Name: "RecordVideo",
    /*
     * Create a video recorder
     */
    _init: function(){
        Lib.TalkativeLog('ESC > init recorder');
        
        this.recorder = new Shell.Recorder({ stage: global.stage,
            screen: global.screen });
    },
    /*
     * start recording
     */
    start: function(){
        Lib.TalkativeLog('ESC > start video recording');
        
        let [success, fileName] = this.recorder.record();
        if (success) {
            Lib.TalkativeLog('ESC > RECORDING OK');
        } else{
            Lib.TalkativeLog('ESC > ERROR RECORDING');
        }
        return success;
    },
    /*
     * Stop recording
     */
    stop: function(){
        Lib.TalkativeLog('ESC > stop video recording');
        
        this.recorder.close();
    },
    /**
     * Set option
     */
    setOption: function(file, fps, pipeline, drawcursor){
        Lib.TalkativeLog('ESC > set option : file- '+file+' fps- '+fps+
            ' pipeline- '+pipeline+' dc- '+drawcursor);
            
        this.recorder.set_file_template(file);
        this.recorder.set_framerate(fps);
        this.recorder.set_pipeline(pipeline);
        this.recorder.set_draw_cursor(drawcursor);
    },
    
    /**
     * Set area
     */
    setArea: function(x, y, width, height){
        Lib.TalkativeLog('ESC > set area : x- '+x+' y- '+y+' w- '+width+' h- '+
            height);

        this.recorder.set_area(x, y, width, height);
    }
});

