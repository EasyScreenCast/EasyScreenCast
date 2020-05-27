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
const GLib = imports.gi.GLib;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Lib = Me.imports.convenience;

/*
                DELAY TIMER
*/
let DelaySec = 0;
let ID_TimerDelay = null;
let CallbackFuncDelay = null;
let ElapsedSec;

/**
 * @type {TimerDelay}
 */
const TimerDelay = new Lang.Class({
    Name: "TimerDelay",

    /**
     * Create a new timer
     *
     * @param {number} delay
     * @param {function} callback
     * @param scope
     */
    _init: function (delay, callback, scope) {
        if (isNaN(delay)) {
            Lib.TalkativeLog("-%-delay is NOT a number :" + delay);
        } else {
            Lib.TalkativeLog("-%-init TimerDelay called - sec : " + delay);

            DelaySec = delay;
            ElapsedSec = 1;

            this.setCallback(callback);
            this.Scope = scope;
        }
    },

    /**
     * Set the callback-function
     *
     * @param {function} callback
     */
    setCallback: function (callback) {
        Lib.TalkativeLog("-%-setcallback TimerDelay called");

        if (
            callback === undefined ||
            callback === null ||
            typeof callback !== "function"
        ) {
            throw TypeError("'callback' needs to be a function.");
        }
        CallbackFuncDelay = callback;
    },

    /**
     * Set the delay time
     *
     * @param {number} delay
     */
    setDelay: function (delay) {
        Lib.TalkativeLog("-%-setdelay TimerDelay called");

        DelaySec = delay;
    },

    /**
     * Start or restart a new timer
     */
    begin: function () {
        Lib.TalkativeLog("-%-start TimerDelay called");
        this.stop();

        ID_TimerDelay = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () =>
            this._callbackInternal()
        );
    },

    /**
     * Stop the current timer
     */
    stop: function () {
        Lib.TalkativeLog("-%-stop TimerDelay called");
        if (ID_TimerDelay !== null) {
            if (GLib.source_remove(ID_TimerDelay)) {
                ID_TimerDelay = null;

                ElapsedSec = 1;
            }
        }
    },

    /**
     * A convenient way to restart the timer.
     */
    restart: function () {
        this.stop();
        this.begin();
    },

    /**
     * The internal callback-function.
     * @private
     * @return {boolean}
     */
    _callbackInternal: function () {
        Lib.TalkativeLog(
            "-%-internalFunction TimerDelay called | Sec = " +
                ElapsedSec +
                " Sec delay = " +
                DelaySec
        );
        if (ElapsedSec >= DelaySec) {
            CallbackFuncDelay.apply(this.Scope, []);
            ElapsedSec = 1;
            return false;
        } else {
            ElapsedSec++;
            return true;
        }
    },
});

/*
                    COUNTING TIMER
*/
let ID_TimerCounting = null;
let CallbackFuncCounting = null;
let isRunning = false;
let secpassed = 0;

/**
 * @type {Lang.Class}
 */
var TimerCounting = new Lang.Class({
    Name: "TimerCounting",

    /**
     * Create a new timer
     *
     * @param {function} callback
     * @param scope
     */
    _init: function (callback, scope) {
        Lib.TalkativeLog("-%-init TimerCounting called");

        this.setCallback(callback);
        secpassed = 0;
        this.Scope = scope;
    },

    /**
     * Set the callback-function
     *
     * @param {function} callback
     */
    setCallback: function (callback) {
        Lib.TalkativeLog("-%-setcallback TimerCounting called");

        if (
            callback === undefined ||
            callback === null ||
            typeof callback !== "function"
        ) {
            throw TypeError("'callback' needs to be a function.");
        }
        CallbackFuncCounting = callback;
    },

    /**
     * Start or restart a new timer
     */
    begin: function () {
        Lib.TalkativeLog("-%-start TimerCounting called");

        if (isRunning) {
            this.stop();
        }
        isRunning = true;

        ID_TimerCounting = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 1000, () =>
            this._callbackInternal()
        );
    },

    /**
     * Stop the current timer
     */
    stop: function () {
        Lib.TalkativeLog("-%-stop TimerCounting called");

        isRunning = false;

        if (ID_TimerCounting !== null) {
            if (GLib.source_remove(ID_TimerCounting)) {
                ID_TimerCounting = null;
            }
        }
    },

    /**
     * A convenient way to stop timer
     */
    halt: function () {
        isRunning = false;
    },

    /**
     * The internal callback-function. Calls a function that handles
     * the desktop notifications and one that sets the time label next
     * to the icon.
     *
     * @private
     * @return {boolean}
     */
    _callbackInternal: function () {
        if (isRunning === false) {
            Lib.TalkativeLog("-%-finish TimerCounting ");

            CallbackFuncCounting.apply(this.Scope, [secpassed, true]);
            secpassed = 0;

            this.stop();
            this.Scope.updateTimeLabel("");

            return false;
        } else {
            secpassed++;

            Lib.TalkativeLog("-%-continued TimerCounting | sec: " + secpassed);

            CallbackFuncCounting.apply(this.Scope, [secpassed, false]);
            this.Scope.updateTimeLabel(secpassed);

            return true;
        }
    },
});
