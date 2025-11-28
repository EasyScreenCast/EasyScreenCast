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

'use strict';

import Gio from 'gi://Gio';

var debugEnabled = false;

/**
 * @param {boolean} d Enable/Disable debug logging
 */
export function setDebugEnabled(d) {
    debugEnabled = d;
}

/**
 * @param {string} msg the message to log
 * @class
 */
export function TalkativeLog(msg) {
    if (debugEnabled)
        console.log(`[ESC]${msg}`);
}

/**
 * Gets the full (semantic) version of this extension.
 *
 * <p>Note: The actual value is added during build time.
 *
 * @returns {string} the version
 */
export function getFullVersion() {
    return 'dev'; // FULL_VERSION
}

/**
 * Loads an icon from the extension's subdirectory "images".
 *
 * @param {Gio.File} extensionDir dir of the extension
 * @param {string} name filename of the image
 * @returns {Gio.FileIcon} the icon
 */
export function loadIcon(extensionDir, name) {
    return new Gio.FileIcon({
        file: Gio.File.new_for_path(
            getImagePath(extensionDir, name)
        ),
    });
}

/**
 * Gets the path to the image from the extension's subdirectory "images".
 *
 * @param {Gio.File} extensionDir dir of the extension
 * @param {string} name filename of the image
 * @returns {string} the path
 */
export function getImagePath(extensionDir, name) {
    return extensionDir.get_child(`images/${name}`).get_path();
}
