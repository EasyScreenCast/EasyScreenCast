# v1.6.3 (45) (2022-05-19)

**🎉 Merged pull requests:**

* [#334](https://github.com/EasyScreenCast/EasyScreenCast/pull/334): Fix window and area selection ([@adangel](https://github.com/adangel))

**🐛 Fixed bugs:**

* [#333](https://github.com/EasyScreenCast/EasyScreenCast/issues/333): Window and area selections don't work in latest version of easyscreencast (v44)

**Full Changelog**: <https://github.com/EasyScreenCast/EasyScreenCast/compare/1.6.2...1.6.3>

# v1.6.2 (44) (2022-04-11)

**🐛 Fixed bugs:**

* [#330](https://github.com/EasyScreenCast/EasyScreenCast/issues/330): TypeError: this._settings.destory is not a function

**Full Changelog**: <https://github.com/EasyScreenCast/EasyScreenCast/compare/1.6.1...1.6.2>

# v1.6.1 (43) (2022-04-09)

**🎉 Merged pull requests:**

* [#329](https://github.com/EasyScreenCast/EasyScreenCast/pull/329): Remove global object instances ([@adangel](https://github.com/adangel))

**🐛 Fixed bugs:**

* [#327](https://github.com/EasyScreenCast/EasyScreenCast/issues/327): Remove package.json from extension zip
* [#328](https://github.com/EasyScreenCast/EasyScreenCast/issues/328): Avoid creating objects in global scope

**Full Changelog**: <https://github.com/EasyScreenCast/EasyScreenCast/compare/1.6.0...1.6.1>

# v1.6.0 (42) (2022-04-07)

At least gnome-shell 3.38 is required.

**🚀 Implemented enhancements:**

* [#323](https://github.com/EasyScreenCast/EasyScreenCast/issues/323): Gnome Shell 42 support

**🎉 Merged pull requests:**

* [#324](https://github.com/EasyScreenCast/EasyScreenCast/pull/324): Add Gnome Shell 42 support ([@adangel](https://github.com/adangel))
* [#326](https://github.com/EasyScreenCast/EasyScreenCast/pull/326): Add missing toString methods in selection classes ([@adangel](https://github.com/adangel))

**🐛 Fixed bugs:**

* [#325](https://github.com/EasyScreenCast/EasyScreenCast/issues/325): TypeError: GObject_Object.prototype.toString called on incompatible Object

**Full Changelog**: <https://github.com/EasyScreenCast/EasyScreenCast/compare/1.5.0...1.6.0>

# v1.5.0 (42) (2022-03-05)

At least gnome-shell 3.38 is required. This version of EasyScreenCast is not compatible anymore with older versions.

**🚀 Implemented enhancements:**

* [#288](https://github.com/EasyScreenCast/EasyScreenCast/issues/288): Whatsapp preset

**🎉 Merged pull requests:**

* [#297](https://github.com/EasyScreenCast/EasyScreenCast/pull/297): Add eslint rules ([@adangel](https://github.com/adangel))
* [#302](https://github.com/EasyScreenCast/EasyScreenCast/pull/302): Use ExtensionUtils for initTranslations and getSettings ([@adangel](https://github.com/adangel))
* [#303](https://github.com/EasyScreenCast/EasyScreenCast/pull/303): Display version in prefs dialog ([@adangel](https://github.com/adangel))
* [#304](https://github.com/EasyScreenCast/EasyScreenCast/pull/304): Fix image size of ESC logo ([@adangel](https://github.com/adangel))
* [#305](https://github.com/EasyScreenCast/EasyScreenCast/pull/305): Fix notification ([@adangel](https://github.com/adangel))
* [#306](https://github.com/EasyScreenCast/EasyScreenCast/pull/306): Add a custom _generateFileName function in utilrecorder (#188) ([@adangel](https://github.com/adangel))
* [#308](https://github.com/EasyScreenCast/EasyScreenCast/pull/308): Fix [ESC] does not abort Window / Area Selection ([@meghprkh](https://github.com/meghprkh))
* [#310](https://github.com/EasyScreenCast/EasyScreenCast/pull/310): Added Japanese translation ([@moru348](https://github.com/moru348))
* [#312](https://github.com/EasyScreenCast/EasyScreenCast/pull/312): Add Vietnamese translation ([@lehien](https://github.com/lehien))
* [#313](https://github.com/EasyScreenCast/EasyScreenCast/pull/313): Improved German translation ([@adangel](https://github.com/adangel))
* [#315](https://github.com/EasyScreenCast/EasyScreenCast/pull/315): Filter webcam devices list by devicePath property ([@adangel](https://github.com/adangel))
* [#317](https://github.com/EasyScreenCast/EasyScreenCast/pull/317): Only consider video/x-raw capabilities ([@adangel](https://github.com/adangel))
* [#318](https://github.com/EasyScreenCast/EasyScreenCast/pull/318): Enable or disable keybinding immediately ([@adangel](https://github.com/adangel))
* [#319](https://github.com/EasyScreenCast/EasyScreenCast/pull/319): Logfiles under the support tag weren't shown anymore ([@adangel](https://github.com/adangel))
* [#320](https://github.com/EasyScreenCast/EasyScreenCast/pull/320): Add new file container and presets for mp4+aac ([@adangel](https://github.com/adangel))

**🐛 Fixed bugs:**

* [#130](https://github.com/EasyScreenCast/EasyScreenCast/issues/130): Argument 'accelerator' but got type 'undefined' when loading the preferences dialog
* [#188](https://github.com/EasyScreenCast/EasyScreenCast/issues/188): Improve filename template for the date and time format
* [#299](https://github.com/EasyScreenCast/EasyScreenCast/issues/299): Review results from extensions.gnome.org
* [#301](https://github.com/EasyScreenCast/EasyScreenCast/issues/301): Notification has been already disposed
* [#311](https://github.com/EasyScreenCast/EasyScreenCast/issues/311): Key bindings always enabled. Not able to change.
* [#314](https://github.com/EasyScreenCast/EasyScreenCast/issues/314): Webcam appears twice in the menu
* [#316](https://github.com/EasyScreenCast/EasyScreenCast/issues/316): No webcam recording with capability using image/jpeg

**Full Changelog**: <https://github.com/EasyScreenCast/EasyScreenCast/compare/1.4.0...1.5.0>

# v1.4.0 (42) (2021-10-22)

For gnome-shell 3.16 - 40.

**🚀 Implemented enhancements:**

* Support Gnome Shell 40
* Preliminary support for Gnome Shell 41

**🎉 Merged pull requests:**

* [#295](https://github.com/EasyScreenCast/EasyScreenCast/pull/295) Support Gnome Shell 40 ([@adangel](https://github.com/adangel))
* [#296](https://github.com/EasyScreenCast/EasyScreenCast/pull/296) Add github actions workflow ([@adangel](https://github.com/adangel))

**🐛 Fixed bugs:**

* [#227](https://github.com/EasyScreenCast/EasyScreenCast/issues/227) Update Readme for make requirements
* [#287](https://github.com/EasyScreenCast/EasyScreenCast/issues/287) Installation with make is failing in ubuntu
* [#289](https://github.com/EasyScreenCast/EasyScreenCast/issues/289) GNOME 40 (GTK4)
* [#290](https://github.com/EasyScreenCast/EasyScreenCast/issues/290) Gtk.BuilderError with Gnome Shell 40.3


**Full Changelog**: <https://github.com/EasyScreenCast/EasyScreenCast/compare/1.3.1...1.4.0>

# v1.3.1 (41) (2021-10-10)

For gnome-shell 3.16 - 3.38. Not compatible with gnome-shell 40.

This is a re-release of [1.3.0](https://github.com/EasyScreenCast/EasyScreenCast/releases/1.3.0) but with extension version 41 in metadata.json for extensions.gnome.org.
This avoids that gnome-extensions-app magically downgrades a manually installed version (see also https://gitlab.gnome.org/GNOME/gnome-shell/-/issues/2514).

Install it with `gnome-extensions install EasyScreenCast_1.3.1_41.zip --force`

**🐛 Fixed bugs:**

* [#245](https://github.com/EasyScreenCast/EasyScreenCast/issues/245) Push new version to GNOME shell extensions; GNOME 3.36 keeps "updating" the locally installed extension
* [#262](https://github.com/EasyScreenCast/EasyScreenCast/issues/262) EasyScreenCast update alert every time Chrome opens on RHEL Workstation v7.7

**Full Changelog**: <https://github.com/EasyScreenCast/EasyScreenCast/compare/1.3.0...1.3.1>

# v1.3.0 (2021-10-10)

For gnome-shell 3.16 - 3.38. Not compatible with gnome-shell 40.

**🚀 Implemented enhancements:**

* Compatible with gnome-shell 3.38

**🎉 Merged pull requests:**

* [#258](https://github.com/EasyScreenCast/EasyScreenCast/pull/258) Replace deprecated gnome-shell-extension-prefs ([@efernandesng](https://github.com/efernandesng))
* [#270](https://github.com/EasyScreenCast/EasyScreenCast/pull/270) Add catalan translation ([@cubells](https://github.com/cubells))
* [#276](https://github.com/EasyScreenCast/EasyScreenCast/pull/276) Allow extension to load under GNOME 3.38 ([@Ian2020](https://github.com/Ian2020))
* [#291](https://github.com/EasyScreenCast/EasyScreenCast/pull/291) Improve webcam (de)selection ([@adangel](https://github.com/adangel))

**🐛 Fixed bugs:**

* [#243](https://github.com/EasyScreenCast/EasyScreenCast/issues/243) TypeError: listCaps is undefined
* [#251](https://github.com/EasyScreenCast/EasyScreenCast/issues/251) Option Is not Working
* [#253](https://github.com/EasyScreenCast/EasyScreenCast/issues/253) settings for this extension cant be displayed
* [#255](https://github.com/EasyScreenCast/EasyScreenCast/issues/255) Can't select no webcam recording
* [#256](https://github.com/EasyScreenCast/EasyScreenCast/issues/256) Unable to open Options
* [#257](https://github.com/EasyScreenCast/EasyScreenCast/issues/257) The Screen Recorder says ERROR RECORDER - See Logs for details..
* [#269](https://github.com/EasyScreenCast/EasyScreenCast/issues/269) There is an error loading the preferences dialog for EasyScreenCast: TypeError: ListCaps is undefined
* [#272](https://github.com/EasyScreenCast/EasyScreenCast/issues/272) Unable to install in ubuntu gorilla (20.10)
* [#275](https://github.com/EasyScreenCast/EasyScreenCast/issues/275) Warning messages in log: Usage of object.actor is deprecated
* [#279](https://github.com/EasyScreenCast/EasyScreenCast/issues/279) The settings of extension EasyScreenCast@iacopodeenosee.gmail.com had an error
* [#280](https://github.com/EasyScreenCast/EasyScreenCast/issues/280) global is not defined
* [#281](https://github.com/EasyScreenCast/EasyScreenCast/issues/281) Extension not working in Gnome 3.38 (Fedora 33)
* [#282](https://github.com/EasyScreenCast/EasyScreenCast/issues/282) Can't deselect webcam recording
* [#285](https://github.com/EasyScreenCast/EasyScreenCast/issues/285) Crashes when tried to use with usb webcam
* [#286](https://github.com/EasyScreenCast/EasyScreenCast/issues/286) No JS module 'screencast' found in search path

**Full Changelog**: <https://github.com/EasyScreenCast/EasyScreenCast/compare/1.2.0...1.3.0>

# v1.2.0 (2020-04-19)

* [#247](https://github.com/EasyScreenCast/EasyScreenCast/issues/247) Fix opening settings for GNOME shell 3.36

**Full Changelog**: <https://github.com/EasyScreenCast/EasyScreenCast/compare/1.1.0...1.2.0>

# v1.1.0 (2020-04-06)

**Full Changelog**: <https://github.com/EasyScreenCast/EasyScreenCast/compare/1.0.0...1.1.0>

# v1.0.0 (2018-07-01)

* Various fixes and improvements

**Full Changelog**: <https://github.com/EasyScreenCast/EasyScreenCast/compare/0.10...1.0.0>

# v0.10 (2017-04-21)

* [#116](https://github.com/EasyScreenCast/EasyScreenCast/pull/116) @epozuelo fixed an issue with reloading of the extension
* [#115](https://github.com/EasyScreenCast/EasyScreenCast/pull/115) Fixed some clutter warnings when opening the extension preferences.

**Full Changelog**: <https://github.com/EasyScreenCast/EasyScreenCast/compare/0.9.9...0.10>

# v0.9.9 (2016-11-02)

- Added support for Gnome Shell 3.22
- Moved repository to organization and updated the links
- @iacopodeenosee fixed an issue with a overlay message not disappearing (https://github.com/EasyScreenCast/EasyScreenCast/issues/100)
- @iacopodeenosee fixed a Clutter warning (https://github.com/EasyScreenCast/EasyScreenCast/issues/103)
- A number of other issues were resolved by @iacopodeenosee and @prahal  

**Full Changelog**: <https://github.com/EasyScreenCast/EasyScreenCast/compare/0.9.8...0.9.9>

# v0.9.8 (2016-03-20)

* minor bug-fix
* added more variable in post cmd
* move selection area into indicator menu
* add right click on indicator icon to start/stop recording
* new UI preferences
* create 4 preset quality GSP for vp8 codec
* added the ability to select the format
* added the ability to select the resolution
* added the ability to record the webcam stream

**Full Changelog**: <https://github.com/EasyScreenCast/EasyScreenCast/compare/0.9.7...0.9.8>

# v0.9.7 (2015-05-01)

* added audio support
* added shortkey support
* added command post-recording
* added Russian translation (thanks Zirrald)
* update IT translation
* bug-fix

**Full Changelog**: <https://github.com/EasyScreenCast/EasyScreenCast/compare/0.9.6...0.9.7>

# v0.9.6 (2014-06-08)

* added selection function
* update IT translation
* minor bug-fix

**Full Changelog**: <https://github.com/EasyScreenCast/EasyScreenCast/compare/0.9.5...0.9.6>

# v0.9.5 (2014-05-14)

* added French translation (thanks Maxime L)
* lock-screen fix

**Full Changelog**: <https://github.com/EasyScreenCast/EasyScreenCast/compare/0.9.4...0.9.5>

# v0.9.4 (2014-04-19)

* update to shell 3.12
* minor bug-fix

**Full Changelog**: <https://github.com/EasyScreenCast/EasyScreenCast/compare/0.9.3...0.9.4>

# v0.9.3 (2013-11-13)

* direct call gnome shell recorder

**Full Changelog**: <https://github.com/EasyScreenCast/EasyScreenCast/compare/0.9.2...0.9.3>

# v0.9.2 (2013-11-02)

* update to shell 3.10
* manage more option
* fix translation UI
* minor fix

**Full Changelog**: <https://github.com/EasyScreenCast/EasyScreenCast/compare/0.9.1...0.9.2>

# v0.9.1 (2013-06-29)

* fix it translation
* option for manage debug info
* reorganize code
* minor bug fix

**Full Changelog**: <https://github.com/EasyScreenCast/EasyScreenCast/compare/0.9.0...0.9.1>

# v0.9.0 (2013-06-05)

This version is the first release of the extension

Featured:

* command screencast with GUI menu
* Possibly to add delay for screencast
* possibly to change configuration screencast into menu extension
