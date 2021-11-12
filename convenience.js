/*
  Copyright (c) 2011-2012, Giovanni Campagna <scampa.giovanni@gmail.com>

  Redistribution and use in source and binary forms, with or without
  modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of the GNOME nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
  ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
  WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
  DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER BE LIABLE FOR ANY
  DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
  (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
  LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
  ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
  (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
  SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

const Gettext = imports.gettext;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;

const Config = imports.misc.config;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Settings = Me.imports.settings;

/**
 * @param {string} msg
 * @constructor
 */
function TalkativeLog(msg) {
    if (Settings.getOption("b", Settings.VERBOSE_DEBUG_SETTING_KEY)) {
        log("[ESC]" + msg);
    }
}

var ESConGIcon = new Gio.FileIcon({
    file: Gio.File.new_for_path(
        Me.dir.get_child("images/icon_recording.svg").get_path()
    ),
});

var ESCoffGIcon = new Gio.FileIcon({
    file: Gio.File.new_for_path(
        Me.dir.get_child("images/icon_default.svg").get_path()
    ),
});

var ESConGIconSel = new Gio.FileIcon({
    file: Gio.File.new_for_path(
        Me.dir.get_child("images/icon_recordingSel.svg").get_path()
    ),
});

var ESCoffGIconSel = new Gio.FileIcon({
    file: Gio.File.new_for_path(
        Me.dir.get_child("images/icon_defaultSel.svg").get_path()
    ),
});

var ESCimgPerformance = Me.dir
    .get_child("images/Icon_Performance.svg")
    .get_path();

var ESCimgQuality = Me.dir.get_child("images/Icon_Quality.svg").get_path();

var ESCimgInfo = Me.dir.get_child("images/Icon_Info.png").get_path();
