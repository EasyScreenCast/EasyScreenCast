const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

/**
 * @type {{_display(): Meta_Display, number_of_displays(): int}}
 */
var display_api = {
    /**
     * Returns the Wayland display or
     *
     * @return {Meta_Display}
     */
    _display() {
        return global.display || global.screen;
    },

    /**
     * @return {int}
     * @public
     */
    number_displays() {
        return this._display().get_n_monitors();
    },

    /**
     * @param {int} display_index
     * @returns {*}
     */
    display_geometry_for_index(display_index) {
        return this._display().get_monitor_geometry(display_index);
    },

    /**
     * @param {string} cursor
     * @returns {*}
     */
    set_cursor(cursor) {
        return this._display().set_cursor(cursor);
    },
};
