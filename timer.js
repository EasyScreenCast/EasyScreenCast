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

'use strict';

import GObject from 'gi://GObject';
import GLib from 'gi://GLib';
import * as Lib from './convenience.js';

/*
                DELAY TIMER
*/
let DelaySec = 0;
let timerDelayId = null;
let CallbackFuncDelay = null;
let ElapsedSec;

/**
 * @type {TimerDelay}
 */
export const TimerDelay = GObject.registerClass({
    GTypeName: 'EasyScreenCast_TimerDelay',
}, class TimerDelay extends GObject.Object {
    /**
     * Create a new timer
     *
     * @param {number} delay delay in seconds
     * @param {Function} callback callback function that is called after delay seconds (without arguments)
     * @param {*} scope scope for the callback
     */
    constructor(delay, callback, scope) {
        super();
        if (isNaN(delay)) {
            Lib.TalkativeLog(`-%-delay is NOT a number :${delay}`);
        } else {
            Lib.TalkativeLog(`-%-init TimerDelay called - sec : ${delay}`);

            DelaySec = delay;
            ElapsedSec = 1;

            this.setCallback(callback);
            this.Scope = scope;
        }
    }

    /**
     * Set the callback-function
     *
     * @param {Function} callback callback function that is called after delay seconds (without arguments)
     */
    setCallback(callback) {
        Lib.TalkativeLog('-%-setcallback TimerDelay called');

        if (
            callback === undefined ||
            callback === null ||
            typeof callback !== 'function'
        )
            throw TypeError("'callback' needs to be a function.");

        CallbackFuncDelay = callback;
    }

    /**
     * Set the delay time
     *
     * @param {number} delay delay in seconds
     */
    setDelay(delay) {
        Lib.TalkativeLog(`-%-setdelay TimerDelay called: ${delay}`);

        DelaySec = delay;
    }

    /**
     * Start or restart a new timer
     */
    begin() {
        Lib.TalkativeLog('-%-start TimerDelay called');
        this.stop();

        timerDelayId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () =>
            this._callbackInternal()
        );
    }

    /**
     * Stop the current timer
     */
    stop() {
        Lib.TalkativeLog('-%-stop TimerDelay called');
        if (timerDelayId !== null) {
            if (GLib.source_remove(timerDelayId)) {
                timerDelayId = null;

                ElapsedSec = 1;
            }
        }
    }

    /**
     * A convenient way to restart the timer.
     */
    restart() {
        this.stop();
        this.begin();
    }

    /**
     * The internal callback-function.
     *
     * @private
     * @returns {boolean}
     */
    _callbackInternal() {
        Lib.TalkativeLog(`-%-internalFunction TimerDelay called | Sec = ${ElapsedSec} Sec delay = ${DelaySec}`);
        if (ElapsedSec >= DelaySec) {
            CallbackFuncDelay.apply(this.Scope, []);
            ElapsedSec = 1;
            return false;
        } else {
            ElapsedSec++;
            return true;
        }
    }
});

/*
                    COUNTING TIMER
*/
let timerCountingId = null;
let CallbackFuncCounting = null;
let isRunning = false;
let secpassed = 0;

/**
 * @type {TimerCounting}
 */
export const TimerCounting = GObject.registerClass({
    GTypeName: 'EasyScreenCast_TimerCounting',
}, class TimerCounting extends GObject.Object {
    /**
     * Callback for the counting timer.
     *
     * @callback TimerCounting~callback
     * @param {number} count seconds passed
     * @param {boolean} alertEnd whether the timer is ending
     */

    /**
     * Create a new timer
     *
     * @param {TimerCounting~callback} callback callback function that is called every second
     * @param {EasyScreenCast_Indicator} scope scope for the callback function. This is also used to updateTimeLabel.
     */
    constructor(callback, scope) {
        super();
        Lib.TalkativeLog('-%-init TimerCounting called');

        this.setCallback(callback);
        secpassed = 0;
        this.Scope = scope;
    }

    /**
     * Set the callback-function
     *
     * @param {TimerCounting~callback} callback callback function that is called every second
     */
    setCallback(callback) {
        Lib.TalkativeLog('-%-setcallback TimerCounting called');

        if (
            callback === undefined ||
            callback === null ||
            typeof callback !== 'function'
        )
            throw TypeError("'callback' needs to be a function.");

        CallbackFuncCounting = callback;
    }

    /**
     * Start or restart a new timer
     */
    begin() {
        Lib.TalkativeLog('-%-start TimerCounting called');

        if (isRunning)
            this.stop();

        isRunning = true;

        timerCountingId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () =>
            this._callbackInternal()
        );
    }

    /**
     * Stop the current timer
     */
    stop() {
        Lib.TalkativeLog('-%-stop TimerCounting called');

        isRunning = false;

        if (timerCountingId !== null && GLib.source_remove(timerCountingId))
            timerCountingId = null;
    }

    /**
     * A convenient way to stop timer
     */
    halt() {
        isRunning = false;
    }

    /**
     * The internal callback-function. Calls a function that handles
     * the desktop notifications and one that sets the time label next
     * to the icon.
     *
     * @private
     * @returns {boolean}
     */
    _callbackInternal() {
        if (isRunning === false) {
            Lib.TalkativeLog('-%-finish TimerCounting ');

            CallbackFuncCounting.apply(this.Scope, [secpassed, true]);
            secpassed = 0;

            this.stop();
            this.Scope.updateTimeLabel('');

            return false;
        } else {
            secpassed++;

            Lib.TalkativeLog(`-%-continued TimerCounting | sec: ${secpassed}`);

            CallbackFuncCounting.apply(this.Scope, [secpassed, false]);
            this.Scope.updateTimeLabel(secpassed);

            return true;
        }
    }
});
