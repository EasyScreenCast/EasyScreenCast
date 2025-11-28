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

'use strict';

import GObject from 'gi://GObject';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
// https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/ui/messageTray.js
import * as MessageTray from 'resource:///org/gnome/shell/ui/messageTray.js';
import St from 'gi://St';

import * as Lib from './convenience.js';
import * as Settings from './settings.js';
import * as Ext from './extension.js';

import {gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';

/**
 * @type {NotifyManager}
 */
export const NotifyManager = GObject.registerClass({
    GTypeName: 'EasyScreenCast_NotifyManager',
}, class NotifyManager extends GObject.Object {
    /**
     * Create a notify manager
     */
    constructor() {
        super();
        Lib.TalkativeLog('-°-init notify manager');
        this._alertWidget = null;
    }

    /**
     * create notify
     *
     * @param {string} msg the title
     * @param {Gio.FileIcon} icon the icon
     * @param {boolean} sound whether to play a sound
     * @returns {MessageTray.Notification}
     */
    createNotify(msg, icon, sound) {
        Lib.TalkativeLog(`-°-create notify :${msg}`);
        var source = new MessageTray.Source({
            title: _('EasyScreenCast'),
        });
        var notify = new MessageTray.Notification({
            source,
            title: msg,
            body: null,
            gicon: icon,
            isTransient: false,
            resident: true,
        });

        Main.messageTray.add(source);
        source.addNotification(notify);

        if (sound)
            notify.playSound();

        return notify;
    }

    /**
     * update notify
     *
     * @param {MessageTray.Notification} notify the already existing notification to update
     * @param {string} msg the title
     * @param {Gio.FileIcon} icon the icon
     * @param {boolean} sound whether to play a sound
     */
    updateNotify(notify, msg, icon, sound) {
        Lib.TalkativeLog('-°-update notify');

        notify.set({
            title: msg,
            body: null,
            gicon: icon,
        });

        if (sound)
            notify.playSound();
    }

    /**
     * create alert
     *
     * @param {string} msg the message
     */
    createAlert(msg) {
        Lib.TalkativeLog(`-°-show alert tweener : ${msg}`);
        if (Ext.Indicator.getSettings().getOption('b', Settings.SHOW_NOTIFY_ALERT_SETTING_KEY)) {
            var monitor = Main.layoutManager.focusMonitor;

            this.resetAlert();
            this._alertWidget = new St.Label({
                style_class: 'alert-msg',
                opacity: 255,
                text: msg,
            });
            Main.uiGroup.add_child(this._alertWidget);

            this._alertWidget.set_position(
                Math.floor(monitor.width / 2 - this._alertWidget.width / 2),
                Math.floor(monitor.height / 2 - this._alertWidget.height / 2)
            );

            Lib.TalkativeLog(`-°-show alert tweener : opacity=${this._alertWidget.opacity}`);

            // see org/gnome/shell/ui/environment.js#_easeActor
            // TODO: for some reason, no transition is created, so the onComplete
            // callback is called _immediately_
            /*
            import Clutter from 'gi://Clutter';
            this._alertWidget.ease({
                opacity: 0,
                duration: 400,
                mode: Clutter.AnimationMode.EASE_OUT_QUAD,
                onComplete: () => {
                    Lib.TalkativeLog(`-°-show alert tweener completed: opacity=${this._alertWidget.opacity}`);
                    Main.uiGroup.remove_child(this._alertWidget);
                    this._alertWidget = null;
                },
            });
            */
        }
    }

    resetAlert() {
        if (this._alertWidget !== null) {
            this._alertWidget.hide();
            Main.uiGroup.remove_child(this._alertWidget);
            this._alertWidget = null;
        }
    }
});
