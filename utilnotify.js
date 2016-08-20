/* -*- mode: js; js-basic-offset: 4; indent-tabs-mode: nil -*- */

/*
    Copyright (C) 2016  Borsato Ivano

    The JavaScript code in this page is free software: you can
    redistribute it and/or modify it under the terms of the GNU
    General Public License (GNU GPL) as published by the Free Software
    Foundation, either version 3 of the License, or (at your option)
    any later version.  The code is distributed WITHOUT ANY WARRANTY;
    without even the implied warranty of MERCHANTABILITY or FITNESS
    FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.
*/

const Lang = imports.lang;
const Main = imports.ui.main;
const MessageTray = imports.ui.messageTray;


const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Lib = Me.imports.convenience;
const Pref = Me.imports.prefs;


const NotifyManager = new Lang.Class({
    Name: "NotifyManager",
    /*
     * Create a notify manager
     */
    _init: function() {
        Lib.TalkativeLog('-°-init notify manager');

        this.source = new MessageTray.SystemNotificationSource();
    },
    /*
     * create notify
     */
    createNotify: function(msg, icon, sound) {
        Lib.TalkativeLog('-°-create notify :' + msg);

        var notify = new MessageTray.Notification(this.source, msg, null, {
            gicon: icon
        });

        notify.setTransient(false);
        notify.setResident(true);

        Main.messageTray.add(this.source);
        this.source.notify(notify);

        if (sound) {
            notify.playSound();
        }

        return notify;
    },
    /*
     * update notify
     */
    updateNotify: function(notify, msg, icon, sound) {
        Lib.TalkativeLog('-°-update notify');

        notify.update(msg, null, {
            gicon: icon
        });

        if (sound) {
            notify.playSound();
        }
    }
});
