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

'use strict';

import GObject from 'gi://GObject';
import GLib from 'gi://GLib';
import Gio from 'gi://Gio';
import * as Lib from './convenience.js';

/**
 * @type {ExecuteStuff}
 */
export const ExecuteStuff = GObject.registerClass({
    GTypeName: 'EasyScreenCast_ExecuteStuff',
}, class ExecuteStuff extends GObject.Object {
    /**
     * @param {EasyScreenCastSettingsWidget|EasyScreenCastIndicator} scope the scope for executing callback methods
     * @private
     */
    constructor(scope) {
        super();
        Lib.TalkativeLog(`-¶-init scope:${scope}`);

        this.Scope = scope;
        this.Callback = null;
    }

    /**
     * @param {string} cmd the command to be executed
     * @returns {*[]}
     * @private
     */
    _parseCmd(cmd) {
        let successP, argv;

        try {
            [successP, argv] = GLib.shell_parse_argv(cmd);
        } catch (err) {
            Lib.TalkativeLog('-¶-ERROR PARSE');
            successP = false;
        }
        if (successP) {
            Lib.TalkativeLog(`-¶-parse: ${successP} argv: ${argv}`);
            return [successP, argv];
        } else {
            return [successP, null];
        }
    }

    /**
     * Result callback.
     *
     * @callback ExecuteStuff~resultCallback
     * @param {boolean} result whether the executed command exited successfully or not
     * @param {string} stdout (optional) output of the result, if it was executed synchronously
     */

    /**
     * Line output callback for asynchronous commands.
     *
     * @callback ExecuteStuff~lineCallback
     * @param {string} line a single line of output
     */

    /**
     * @param {string} cmd the command to be executed
     * @param {boolean} sync execute synchronously (wait for return) or fork a process
     * @param {ExecuteStuff~resultCallback} resCb callback after the command is finished
     * @param {ExecuteStuff~lineCallback} lineCb callback for stdout when command is executed asynchronosly
     * @class
     */
    Execute(cmd, sync, resCb, lineCb) {
        Lib.TalkativeLog(`-¶-execute: ${cmd}`);

        this.CommandString = cmd;
        if (
            resCb === undefined &&
            resCb === null &&
            typeof resCb !== 'function'
        ) {
            Lib.TalkativeLog('-¶-resCallback NEED to be a function');

            this.Callback = null;
        } else {
            this.Callback = resCb;
        }

        if (sync === true) {
            Lib.TalkativeLog('-¶-sync execute (wait for return)');
            this._syncCmd(this.CommandString);
        } else {
            Lib.TalkativeLog('-¶-async execute (fork process)');
            if (
                lineCb === undefined &&
                lineCb === null &&
                typeof lineCb !== 'function'
            ) {
                Lib.TalkativeLog('-¶-lineCallback NEED to be a function');

                this.lineCallback = null;
            } else {
                this.lineCallback = lineCb;
            }
            this._asyncCmd(this.CommandString);
        }
    }

    /**
     * @param {string} cmd the command to be executed
     * @returns {*}
     * @class
     */
    Spawn(cmd) {
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
                    `-¶-ERROR SPAWN err:${err.message.toString()}`
                );
                successS = false;
            }

            if (successS) {
                Lib.TalkativeLog(`-¶-spawn: ${successS} pid: ${pid}`);
                return true;
            } else {
                Lib.TalkativeLog('-¶-spawn ERROR');
                return null;
            }
        }
        return null;
    }

    /**
     * @param {string} cmd the command to be executed
     * @private
     */
    _syncCmd(cmd) {
        let [successP, argv] = this._parseCmd(cmd);
        let decoder = new TextDecoder();
        if (successP) {
            Lib.TalkativeLog(`-¶-argv: ${argv}`);
            let successS, stdOut, stdErr, exit;
            try {
                [successS, stdOut, stdErr, exit] = GLib.spawn_sync(
                    null,
                    argv,
                    null,
                    GLib.SpawnFlags.SEARCH_PATH,
                    () => {}
                );
            } catch (err) {
                Lib.TalkativeLog('-¶-ERROR SPAWN');
                successS = false;
            }
            if (successS) {
                Lib.TalkativeLog(`-¶-argv: ${argv}`);
                Lib.TalkativeLog(`-¶-stdOut: ${decoder.decode(stdOut)}`);
                Lib.TalkativeLog(`-¶-stdErr: ${decoder.decode(stdErr)}`);
                Lib.TalkativeLog(`-¶-exit: ${exit}`);

                Lib.TalkativeLog('-¶-exe RC');
                if (this.Callback !== null) {
                    this.Callback.apply(this.Scope, [
                        true,
                        decoder.decode(stdOut),
                    ]);
                }
            } else {
                Lib.TalkativeLog(`-¶-ERROR exe WC - exit status: ${exit}`);
                if (this.Callback !== null)
                    this.Callback.apply(this.Scope, [false]);
            }
        }
    }

    /**
     * @param {string} cmd the command to be executed
     * @private
     */
    _asyncCmd(cmd) {
        let [successP, argv] = this._parseCmd(cmd);
        let decoder = new TextDecoder();
        if (successP) {
            Lib.TalkativeLog(`-¶-argv: ${argv}`);
            let successS, pid, stdIn, stdOut, stdErr;

            try {
                [
                    successS,
                    pid,
                    stdIn,
                    stdOut,
                    stdErr,
                ] = GLib.spawn_async_with_pipes(
                    null, // working directory
                    argv, // argv
                    null, // envp
                    GLib.SpawnFlags.SEARCH_PATH, // flags
                    () => {} // child_setup
                );
            } catch (err) {
                Lib.TalkativeLog('-¶-ERROR SPAWN');
                successS = false;
            }
            if (successS) {
                Lib.TalkativeLog(`-¶-argv: ${argv}`);
                Lib.TalkativeLog(`-¶-pid: ${pid}`);
                Lib.TalkativeLog(`-¶-stdIn: ${stdIn}`);
                Lib.TalkativeLog(`-¶-stdOut: ${stdOut}`);
                Lib.TalkativeLog(`-¶-stdErr: ${stdErr}`);

                let outReader = new Gio.DataInputStream({
                    base_stream: new Gio.UnixInputStream({
                        fd: stdOut,
                    }),
                });
                let inWriter = new Gio.DataOutputStream({
                    base_stream: new Gio.UnixOutputStream({
                        fd: stdIn,
                    }),
                });
                inWriter.close(null);

                let [out] = outReader.read_line(null);
                while (out !== null) {
                    if (this.lineCallback !== null)
                        this.lineCallback.apply(this.Scope, [decoder.decode(out)]);

                    [out] = outReader.read_line(null);
                }

                if (this.Callback !== null) {
                    Lib.TalkativeLog('-¶-exe RC');
                    this.Callback.apply(this.Scope, [true]);
                }
            } else {
                Lib.TalkativeLog('-¶-ERROR exe WC');
                if (this.Callback !== null)
                    this.Callback.apply(this.Scope, [false]);
            }
        }
    }
});
