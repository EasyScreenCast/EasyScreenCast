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

Gio._promisify(Gio.Subprocess.prototype, 'communicate_utf8_async');
Gio._promisify(Gio.Subprocess.prototype, 'wait_check_async');

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
     * @returns {string[]|null}
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
            return argv;
        } else {
            return null;
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
     *
     * @param {string} cmd the command to be executed
     * @param {ExecuteStuff~resultCallback} resCb callback after the command is finished
     */
    async Execute(cmd, resCb) {
        Lib.TalkativeLog(`-¶-execute: ${cmd}`);

        let argv = this._parseCmd(cmd);
        if (argv !== null) {
            Lib.TalkativeLog(`-¶-argv: ${argv}`);

            try {
                const proc = Gio.Subprocess.new(argv,
                    Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE);
                GLib.strfreev(argv);

                Lib.TalkativeLog('-¶-sync execute (wait for return)');
                const [stdout, stderr] = await proc.communicate_utf8_async(null, null);

                if (proc.get_if_exited()) {
                    const status = proc.get_exit_status();
                    Lib.TalkativeLog(`-¶-stdOut: ${stdout.substring(0, 10)}...`);
                    Lib.TalkativeLog(`-¶-stdErr: ${stderr}`);
                    Lib.TalkativeLog(`-¶-exit: ${status}`);
                    if (resCb !== null) {
                        Lib.TalkativeLog('-¶-exe resultCallback');
                        resCb.apply(this.Scope, [
                            status === 0,
                            stdout,
                        ]);
                    }
                } else {
                    Lib.TalkativeLog('-¶-ERROR sub processes exited abnormally');
                }
            } catch (e) {
                Lib.TalkativeLog(`-¶-ERROR while executing sub process: ${e}`);
            }
        }
    }

    /**
     * @param {string} cmd the command to be executed
     * @returns {*}
     * @class
     */
    async Spawn(cmd) {
        Lib.TalkativeLog(`-¶-spawn: ${cmd}`);
        let argv = this._parseCmd(cmd);
        if (argv !== null) {
            Lib.TalkativeLog(`-¶-argv: ${argv}`);
            try {
                const proc = Gio.Subprocess.new(
                    argv,
                    Gio.SubprocessFlags.NONE
                );
                GLib.strfreev(argv);
                const pid = proc.get_identifier();
                Lib.TalkativeLog(`-¶-spawn: pid: ${pid}`);
                const success = await proc.wait_check_async(null);
                Lib.TalkativeLog(`-¶-spawn: the process ${pid} ${success ? 'succeeded' : 'failed'}`);
            } catch (e) {
                Lib.TalkativeLog(`-¶-ERROR while spawning sub process: ${e}`);
            }
        }
    }
});
