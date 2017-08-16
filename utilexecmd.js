/*
    Copyright (C) 2017  Borsato Ivano

    The JavaScript code in this page is free software: you can
    redistribute it and/or modify it under the terms of the GNU
    General Public License (GNU GPL) as published by the Free Software
    Foundation, either version 3 of the License, or (at your option)
    any later version.  The code is distributed WITHOUT ANY WARRANTY;
    without even the implied warranty of MERCHANTABILITY or FITNESS
    FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.
*/

const Lang = imports.lang;
const GLib = imports.gi.GLib;


const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Lib = Me.imports.convenience;


const ExecuteStuff = new Lang.Class({
    Name: "ExecuteStuff",

    _init: function(scope) {
        Lib.TalkativeLog('-¶-init scope:' + scope);

        this.Scope = scope;
        this.RightCallback = null;
        this.WrongCallback = null;
    },

    Execute: function(cmd, sync, rightCallback, wrongCallback){
        Lib.TalkativeLog('-¶-execute: ' + cmd);
        this.CommandString = cmd;

        this._setCallback(this.RightCallback, rightCallback);
        this._setCallback(this.WrongCallback ,wrongCallback);

        if(sync===true){
            Lib.TalkativeLog('-¶-sync execute (wait for return)');
            this._syncCmd(this.CommandString);
        } else {
            Lib.TalkativeLog('-¶-async execute (fork process)');
            this._asyncCmd(this.CommandString);
        }
    },

    Spawn: function(cmd){
        Lib.TalkativeLog('-¶-spawn: ' + cmd);

        try {
            let [success, std_out, std_err, code_res] =
                GLib.spawn_sync(null,
                    cmd,
                    null,
                    GLib.SpawnFlags.SEARCH_PATH,
                    null);
        }
        catch(err) {
            var success = false;
        }
        finally {
            if(success && std_out !== null){
                Lib.TalkativeLog('-¶-spawn OK: ' + code_res);
                return std_out.toString();
            } else {
                Lib.TalkativeLog('-¶-spawn ERROR: ' + code_res + ' err: ' + std_err.toString());
                return null;
            }
        }
    },

    _syncCmd: function(cmd) {
        try {
            let [success, std_out, std_err, code_res] =
                GLib.spawn_command_line_sync(cmd);
        }
        catch(err) {
            var success = false;
        }
        finally {
            if(success){
                Lib.TalkativeLog('-¶-execute OK: ' + code_res);
                if(this.RightCallback !== null)
                    this.RightCallback.apply(this.Scope, []);
            } else {
                Lib.TalkativeLog('-¶-execute ERROR: ' + code_res);
                if(this.WrongCallback !== null)
                    this.WrongCallback.apply(this.scope,[]);
            }

            var IOchannelOUT = GLib.IOChannel.unix_new(std_out);
            var IOchannelERR = GLib.IOChannel.unix_new(std_err);

            var tagWatchOUT = GLib.io_add_watch(IOchannelOUT, GLib.PRIORITY_DEFAULT,
                GLib.IOCondition.IN | GLib.IOCondition.HUP,
                Lang.bind(this, this._loadPipeOUT),
                null
            );
            var tagWatchERR = GLib.io_add_watch(IOchannelERR, GLib.PRIORITY_DEFAULT,
                GLib.IOCondition.IN | GLib.IOCondition.HUP,
                Lang.bind(this, this._loadPipeERR),
                null
            );
        }
    },

    _asyncCmd: function(cmd) {
        try {
            var success = GLib.spawn_command_line_async(cmd);
        }
        catch(err) {
            var success = false;
        }
        finally {
            if(success){
                Lib.TalkativeLog('-¶-execute OK');
                if(this.RightCallback !== null)
                    this.RightCallback.apply(this.Scope, []);
            } else {
                Lib.TalkativeLog('-¶-execute ERROR');
                if(this.WrongCallback !== null)
                    this.WrongCallback.apply(this.scope,[]);
            }
        }
    },

    _setCallback: function(dest, func) {
        if (func === undefined || func === null ||
            typeof func !== "function") {
            Lib.TalkativeLog('-¶-callback NEED to be a function');

            dest = null;
        } else {
            dest = func;
        }
    },

    _loadPipeOUT: function(channel, condition, data) {
        if (condition != GLib.IOCondition.HUP) {
            let [size, out] = channel.read_to_end(null);
            let result = out.toString();
            if(result != null){
                Lib.TalkativeLog('-¶-pipe OUT: ' + result);
            }
        }
        GLib.source_remove(this.tagWatchOUT);
        channel.shutdown(true);
    },

    _loadPipeERR: function(channel, condition, data) {
        if (condition != GLib.IOCondition.HUP) {
            let [size, out] = channel.read_to_end(null);
            let result = out.toString();
            if(result != null){
                Lib.TalkativeLog('-¶-pipe ERROR: ' + result);
            }
        }
        GLib.source_remove(this.tagWatchERR);
        channel.shutdown(false);
    }
});
