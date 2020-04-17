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
const St = imports.gi.St;
const Tweener = imports.ui.tweener;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Lib = Me.imports.convenience;
const Settings = Me.imports.settings;

/**
 * @type {NotifyManager}
 */
var NotifyManager = new Lang.Class({
    Name: "NotifyManager",

    /**
     * Create a notify manager
     */
    _init: function () {
        Lib.TalkativeLog("-°-init notify manager");

        this.source = new MessageTray.SystemNotificationSource();
    },

    /**
     * create notify
     *
     * @param msg
     * @param icon
     * @param sound
     * @return {MessageTray.Notification}
     */
    createNotify: function (msg, icon, sound) {
        Lib.TalkativeLog("-°-create notify :" + msg);
        var notify = new MessageTray.Notification(this.source, msg, null, {
            gicon: icon,
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

    /**
     * update notify
     *
     * @param notify
     * @param msg
     * @param icon
     * @param sound
     */
    updateNotify: function (notify, msg, icon, sound) {
        Lib.TalkativeLog("-°-update notify");

        notify.update(msg, null, {
            gicon: icon,
        });

        if (sound) {
            notify.playSound();
        }
    },

    /**
     * create alert
     *
     * @param msg
     */
    createAlert: function (msg) {
        Lib.TalkativeLog("-°-show alert tweener : " + msg);
        if (Settings.getOption("b", Settings.SHOW_NOTIFY_ALERT_SETTING_KEY)) {
            var monitor = Main.layoutManager.focusMonitor;

            var text = new St.Label({
                style_class: "alert-msg",
                text: msg,
            });
            text.opacity = 255;
            Main.uiGroup.add_actor(text);

            text.set_position(
                Math.floor(monitor.width / 2 - text.width / 2),
                Math.floor(monitor.height / 2 - text.height / 2)
            );

            Tweener.addTween(text, {
                opacity: 0,
                time: 4,
                transition: "easeOutQuad",
                onComplete: () => {
                    Main.uiGroup.remove_actor(text);
                    text = null;
                },
            });
        }
    },
});
