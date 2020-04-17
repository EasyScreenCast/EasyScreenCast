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

const ByteArray = imports.byteArray;
const Lang = imports.lang;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Lib = Me.imports.convenience;

/**
 * @type {ExecuteStuff}
 */
var ExecuteStuff = new Lang.Class({
    Name: "ExecuteStuff",

    /**
     * @param scope
     * @private
     */
    _init: function (scope) {
        Lib.TalkativeLog("-¶-init scope:" + scope);

        this.Scope = scope;
        this.Callback = null;
    },

    /**
     * @param cmd
     * @return {*[]}
     * @private
     */
    _parseCmd: function (cmd) {
        let successP, argv;

        try {
            [successP, argv] = GLib.shell_parse_argv(cmd);
        } catch (err) {
            Lib.TalkativeLog("-¶-ERROR PARSE");
            successP = false;
        }
        if (successP) {
            Lib.TalkativeLog("-¶-parse: " + successP + " argv: " + argv);
            return [successP, argv];
        } else {
            return [successP, null];
        }
    },

    /**
     * @param cmd
     * @param sync
     * @param resCallback
     * @param lineCallback
     * @constructor
     */
    Execute: function (cmd, sync, resCallback, lineCallback) {
        Lib.TalkativeLog("-¶-execute: " + cmd);

        this.CommandString = cmd;
        if (
            resCallback === undefined &&
            resCallback === null &&
            typeof resCallback !== "function"
        ) {
            Lib.TalkativeLog("-¶-resCallback NEED to be a function");

            this.Callback = null;
        } else {
            this.Callback = resCallback;
        }

        if (sync === true) {
            Lib.TalkativeLog("-¶-sync execute (wait for return)");
            this._syncCmd(this.CommandString);
        } else {
            Lib.TalkativeLog("-¶-async execute (fork process)");
            if (
                lineCallback === undefined &&
                lineCallback === null &&
                typeof lineCallback !== "function"
            ) {
                Lib.TalkativeLog("-¶-lineCallback NEED to be a function");

                this.lineCallback = null;
            } else {
                this.lineCallback = lineCallback;
            }
            this._asyncCmd(this.CommandString);
        }
    },

    /**
     * @param cmd
     * @return {*}
     * @constructor
     */
    Spawn: function (cmd) {
        let [successP, argv] = this._parseCmd(cmd);
        if (successP) {
            let successS, pid;
            try {
                [successS, pid] = GLib.spawn_async(
                    null,
                    argv,
                    null,
                    GLib.SpawnFlags.SEARCH_PATH |
                        GLib.SpawnFlags.DO_NOT_REAP_CHILD,
                    null
                );
            } catch (err) {
                Lib.TalkativeLog(
                    "-¶-ERROR SPAWN err:" + err.message.toString()
                );
                successS = false;
            }

            if (successS) {
                Lib.TalkativeLog("-¶-spawn: " + successS + " pid: " + pid);
                return true;
            } else {
                Lib.TalkativeLog("-¶-spawn ERROR");
                return null;
            }
        }
    },

    /**
     * @param cmd
     * @private
     */
    _syncCmd: function (cmd) {
        let [successP, argv] = this._parseCmd(cmd);
        if (successP) {
            Lib.TalkativeLog("-¶-argv: " + argv);
            let successS, std_out, std_err, exit;
            try {
                [successS, std_out, std_err, exit] = GLib.spawn_sync(
                    null,
                    argv,
                    null,
                    GLib.SpawnFlags.SEARCH_PATH,
                    function () {}
                );
            } catch (err) {
                Lib.TalkativeLog("-¶-ERROR SPAWN");
                successS = false;
            }
            if (successS) {
                Lib.TalkativeLog("-¶-argv: " + argv);
                Lib.TalkativeLog("-¶-std_out: " + ByteArray.toString(std_out));
                Lib.TalkativeLog("-¶-std_err: " + ByteArray.toString(std_err));

                Lib.TalkativeLog("-¶-exe RC");
                if (this.Callback !== null) {
                    this.Callback.apply(this.Scope, [
                        true,
                        ByteArray.toString(std_out),
                    ]);
                }
            } else {
                Lib.TalkativeLog("-¶-ERROR exe WC");
                if (this.Callback !== null) {
                    this.Callback.apply(this.Scope, [false]);
                }
            }
        }
    },

    /**
     * @param cmd
     * @private
     */
    _asyncCmd: function (cmd) {
        let [successP, argv] = this._parseCmd(cmd);
        if (successP) {
            Lib.TalkativeLog("-¶-argv: " + argv);
            let successS, pid, std_in, std_out, std_err;

            try {
                [
                    successS,
                    pid,
                    std_in,
                    std_out,
                    std_err,
                ] = GLib.spawn_async_with_pipes(
                    null,
                    argv,
                    null,
                    GLib.SpawnFlags.SEARCH_PATH,
                    function () {},
                    null,
                    null
                );
            } catch (err) {
                Lib.TalkativeLog("-¶-ERROR SPAWN");
                successS = false;
            }
            if (successS) {
                Lib.TalkativeLog("-¶-argv: " + argv);
                Lib.TalkativeLog("-¶-pid: " + pid);
                Lib.TalkativeLog("-¶-std_in: " + std_in);
                Lib.TalkativeLog("-¶-std_out: " + std_out);
                Lib.TalkativeLog("-¶-std_err: " + std_err);

                let out_reader = new Gio.DataInputStream({
                    base_stream: new Gio.UnixInputStream({
                        fd: std_out,
                    }),
                });
                let in_writer = new Gio.DataOutputStream({
                    base_stream: new Gio.UnixOutputStream({
                        fd: std_in,
                    }),
                });

                let [out, size] = out_reader.read_line(null);
                while (out !== null) {
                    if (this.lineCallback !== null) {
                        this.lineCallback.apply(this.Scope, [out.toString()]);
                    }
                    [out, size] = out_reader.read_line(null);
                }

                if (this.Callback !== null) {
                    Lib.TalkativeLog("-¶-exe RC");
                    this.Callback.apply(this.Scope, [true]);
                }
            } else {
                Lib.TalkativeLog("-¶-ERROR exe WC");
                if (this.Callback !== null) {
                    this.Callback.apply(this.Scope, [false]);
                }
            }
        }
    },
});
