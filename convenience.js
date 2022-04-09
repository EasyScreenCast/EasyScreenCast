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

/* exported TalkativeLog,getFullVersion,debugEnabled,loadIcon,getImagePath */
'use strict';

const Gio = imports.gi.Gio;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

var debugEnabled = false;

/**
 * @param {string} msg the message to log
 * @class
 */
function TalkativeLog(msg) {
    if (debugEnabled) {
        log(`[ESC]${msg}`);
    }
}

/**
 * Gets the full (semantic) version of this extension.
 *
 * <p>Note: The actual value is added during build time.
 *
 * @returns {string} the version
 */
function getFullVersion() {
    return 'dev'; // FULL_VERSION
}

/**
 * Loads an icon from the extention's subdirectory "images".
 *
 * @param {string} name filename of the image
 * @returns {Gio.FileIcon} the icon
 */
function loadIcon(name) {
    return new Gio.FileIcon({
        file: Gio.File.new_for_path(
            getImagePath(name)
        ),
    });
}

/**
 * Gets the path to the image from the extension's subdirectory "images".
 *
 * @param {string} name filename of the image
 * @returns {string} the path
 */
function getImagePath(name) {
    return Me.dir.get_child(`images/${name}`).get_path();
}
