# Development

Here are some random notes and weblinks that might be helpful.

# Debugging tipps

## Testing new changes locally without log off

Under Wayland, gnome-shell can't be restarted like in X via Alt+F2 'r'. Therefore a nested gnome-shell can be used.
Otherwise you need to log off and log on again - which includes stopping all applications.

```
dbus-run-session -- gnome-shell --nested
```

Why is it necessary to restart gnome-shell? Once the javascript modules are loaded by the javascript engine,
they can't be changed anymore - any change does not have an effect. The javascript engine needs to be restarted.
E.g. there is no "hot swap code replacement". Disabling and enabling the extension also doesn't help.

## In case prefs UI does not yet work

The preferences can be written on the command line, e.g.

```
dconf write /org/gnome/shell/extensions/EasyScreenCast/verbose-debug true
dconf read /org/gnome/shell/extensions/EasyScreenCast/verbose-debug
```

## Viewing logs

```
journalctl -f -o cat /usr/bin/gnome-shell
```

## Previewing Preferences UI

```
gtk4-builder-tool preview --id=Main_Container --css=prefs.css Options_UI.glade-gtk4
```

## Screencast requirements

sudo apt install gstreamer1.0-plugins-base pipewire

# Web sites

*   https://extensions.gnome.org/extension/690/easyscreencast/
*   https://stackoverflow.com/questions/50052926/docs-for-developing-gnome-shell-extensions
*   https://gjs.guide/extensions/development/debugging.html#logging
*   https://gjs.guide/extensions/upgrading/gnome-shell-40.html
*   https://glade.gnome.org/
*   https://discourse.gnome.org/t/plan-about-gtk4-support-of-glade/5965
*   Gtk3 to 4: https://docs.gtk.org/gtk4/migrating-3to4.html
    `gtk4-builder-tool simplify --3to4 Options_UI.glade`
*   https://docs.gtk.org/gtk4/class.Stack.html
*   https://docs.gtk.org/gtk4/index.html
*   https://docs.gtk.org/gtk4/visual_index.html
*   https://blogs.gnome.org/xjuan/ --> glade for gtk4
*   https://devdocs.io/gtk~4.0-widgets-abstract-base-classes/
*   https://docs.gtk.org/gtk3/method.Box.pack_start.html
*   Screencast: https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/dbusServices/screencast/screencastService.js
*   https://discourse.gnome.org/t/gnome-shell-40-and-screen-recorder/6901
*   Using podman to test against various gnome shell versions:
    *   https://github.com/Schneegans/gnome-shell-pod/
    *   https://stackoverflow.com/questions/12050021/how-to-make-xvfb-display-visible
*   Manual install from zip: https://www.pragmaticlinux.com/2021/06/manually-install-a-gnome-shell-extension-from-a-zip-file/

# GStreamer Pipelines

*   https://github.com/matthew1000/gstreamer-cheat-sheet

*   Install and test:
    ```
    sudo apt install gstreamer1.0-tools
    gst-launch-1.0 ...
    gst-launch-1.0 videotestsrc ! videoconvert ! autovideosink
    ```

*   Default gnome screencast pipeline:
    `videoconvert chroma-mode=GST_VIDEO_CHROMA_MODE_NONE dither=GST_VIDEO_DITHER_NONE matrix-mode=GST_VIDEO_MATRIX_MODE_OUTPUT_ONLY n-threads=%T ! queue ! vp8enc cpu-used=16 max-quantizer=17 deadline=1 keyframe-mode=disabled threads=%T static-threshold=1000 buffer-size=20000 ! queue ! webmmux`
    See https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/dbusServices/screencast/screencastService.js#L26

*   pipeline used by ESC (see utilgsp.js):
    ```
    _SCREENCAST_RES_ _ENCODER_VIDEO_ ! queue max-size-buffers=0 max-size-time=0 max-size-bytes=0 ! _CONTAINER_
    _SCREENCAST_RES_ = ""
    _ENCODER_VIDEO_ = "vp8enc min_quantizer=4 max_quantizer=13 cpu-used=2 deadline=500000 sharpness=0 target-bitrate=15000 threads=%T"
    _CONTAINER_ = webmmux
    ```

*   Note: ximagesrc doesn't work with wayland - use videotestsrc to get some video

Samples:

```
gst-launch-1.0 -e ximagesrc \
    ! vp8enc min_quantizer=4 max_quantizer=13 cpu-used=2 deadline=500000 sharpness=0 target-bitrate=15000 threads=%T \
    ! queue max-size-buffers=0 max-size-time=0 max-size-bytes=0 \
    ! webmmux \
    ! filesink location=file.webm


gst-launch-1.0 -e ximagesrc \
    ! videoconvert chroma-mode=GST_VIDEO_CHROMA_MODE_NONE dither=GST_VIDEO_DITHER_NONE matrix-mode=GST_VIDEO_MATRIX_MODE_OUTPUT_ONLY n-threads=%T \
    ! vp8enc min_quantizer=4 max_quantizer=13 cpu-used=2 deadline=500000 sharpness=0 target-bitrate=15000 threads=%T \
    ! queue max-size-buffers=0 max-size-time=0 max-size-bytes=0 \
    ! webmmux \
    ! filesink location=file.webm
```

*   `%T` is replaced by gnome screen cast service (https://gitlab.gnome.org/GNOME/gnome-shell/-/blob/main/js/dbusServices/screencast/screencastService.js#L219)

```
gst-launch-1.0 -e ximagesrc \
    ! videoconvert chroma-mode=GST_VIDEO_CHROMA_MODE_NONE dither=GST_VIDEO_DITHER_NONE matrix-mode=GST_VIDEO_MATRIX_MODE_OUTPUT_ONLY n-threads=2 \
    ! queue \
    ! vp8enc cpu-used=16 max-quantizer=17 deadline=1 keyframe-mode=disabled threads=2 static-threshold=1000 buffer-size=20000 \
    ! queue \
    ! webmmux \
    ! filesink location=file.webm

gst-launch-1.0 -e videotestsrc \
    ! vp8enc min_quantizer=4 max_quantizer=13 cpu-used=2 deadline=500000 sharpness=0 target-bitrate=15000 threads=4 \
    ! queue max-size-buffers=0 max-size-time=0 max-size-bytes=0 \
    ! webmmux \
    ! filesink location=file.webm
```

*   See also file `test_GSP_webcam_pip` for pipelines


# Debugging

## Gnome shell
https://gjs.guide/extensions/development/debugging.html

set environment variables, in /etc/environment, to be available for main gnome-shell process at startup/login

SHELL_DEBUG=all

#many messages from G_MESSAGES_DEBUG
#G_MESSAGES_DEBUG=all


## Gstreamer
https://gstreamer.freedesktop.org/documentation/application-development/appendix/checklist-element.html?gi-language=c#debugging

GStreamer: set environment variable
GST_DEBUG
              Comma-separated list of debug categories and levels (e.g.  GST_DEBUG=totem:4,typefind:5). '*' is allowed as a wildcard  as  part  of  debug  category  names  (e.g.  GST_DE‐
              BUG=*sink:6,*audio*:6).  Since  1.2.0  it  is  also  possible  to specify the log level by name (1=ERROR, 2=WARN, 3=FIXME, 4=INFO, 5=DEBUG, 6=LOG, 7=TRACE, 9=MEMDUMP) (e.g.
              GST_DEBUG=*audio*:LOG)

e.g. GST_DEBUG=*:6

set it in /etc/environment to be available for the main gnome-shell process at startup/login

