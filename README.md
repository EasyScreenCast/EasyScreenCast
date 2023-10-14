# EasyScreenCast

[![GitHub Workflow Status](https://github.com/EasyScreenCast/EasyScreenCast/actions/workflows/node.js.yml/badge.svg)](https://github.com/EasyScreenCast/EasyScreenCast/actions)

EasyScreenCast simplifies the use of the video recording function integrated in gnome shell,
allows quickly to change the various settings of the desktop recording.
Copyright (C) 2013-16 Borsato Ivano.

- [Web Page](https://iacopodeenosee.wordpress.com/projects/easyscreencast/)
- [GNOME Shell Extensions Page](https://extensions.gnome.org/extension/690/easyscreencast/)
- [Video](https://youtu.be/81E9AruraKU)

----

**Note:** Since Gnome Shell 42 a new built-in [screenshot/screencast UI](https://help.gnome.org/users/gnome-help/stable/screen-shot-record.html.en)
is available, which might already be all you need.
Just run it via the default shortcut <kbd>Ctlr</kbd>+<kbd>Alt</kbd>+<kbd>Shift</kbd>+<kbd>R</kbd>.

This extension provides more options to configure the screencast:
- include audio channel
- include video stream from webcam
- various quality settings and formats for the resulting video

This extension is a simple ad-hoc solution for recording screencasts. For more sophisticated screencasts,
I'd recommend [OBS Studio](https://obsproject.com/).

----

## Requirements
- Gnome Shell 45 (EasyScreenCast 1.8.0; EasyScreenCast 1.7.1: Gnome Shell 3.38 - 44)
- Gstreamer 1.x [ common function/webcam support ]
- gst plugins ugly [ x264 support ]
- gst plugins base [ common function/theora support ]
- gst plugins good [ mp4/mkv/webm/vp8/vp9 support ]

## License Info
EasyScreenCast is free software distributed under the GNU GPL. All files are under GPL v3. Read [COPYING](COPYING.md) for more information about license.

## How to install
There are several methods:

1.  From **github releases**. Just go to <https://github.com/EasyScreenCast/EasyScreenCast/releases/latest> and download
    the latest zip file. Then install it (adjust the file name accordingly):

    ```
    gnome-extensions install --force EasyScreenCast_1.5.0_42.zip
    ```

    And logout/login again to activate the extension.

2.  From **gnome extension site**, just go on [this page](https://extensions.gnome.org/extension/690/easyscreencast/)
    and click/touch on the button ON, that's all.

3.  By installing the Debian/Ubuntu package "gnome-shell-extension-easyscreencast":
    
    ```
    sudo apt install gnome-shell-extension-easyscreencast
    ```

4.  From **github repo**, if you want the most up-to-date version, just do these simple steps

    ```
    git clone https://github.com/EasyScreenCast/EasyScreenCast.git
    cd EasyScreenCast
    make
    make install
    ```

    Note: You'll need to install the following dev dependencies once:

    ```
    sudo apt install gettext jq intltool
    ```

## How to test changes

You can run a new session to test changes to the installed extension:

```
dbus-run-session -- gnome-shell --nested
```

## How to view the logs
You must **enable the verbose logs in options window** and after that you can find the logs by typing this on terminal:

```
journalctl --since=today --no-pager --output=cat | grep ESC
journalctl /usr/bin/gnome-shell --since=today --no-pager --output=cat
```

to open the option windows from terminal try that on terminal:

```
gnome-extensions prefs EasyScreenCast@iacopodeenosee.gmail.com
```

## Translation
If you want to help with translations, just follow these simple step:

1 - Create a new folders for the translations(if NOT exist), where $lang is a code language [[https://www.gnu.org/software/gettext/manual/html_node/Usual-Language-Codes.html#Usual-Language-Codes](https://www.gnu.org/software/gettext/manual/html_node/Usual-Language-Codes.html#Usual-Language-Codes)]

```
mkdir -p locale/$lang/LC_MESSAGES
```

2 - Translate the string with the program Poedit by using a .pot files (locale/messages.pot)

3 - Save these files in the same directory of .pot files, use the code language for the name of them (locale/$lang.po)

4 - Convert in binary these .po files, where $lang is a code language, with that command:

```
msgfmt locale/$lang.po -o locale/$lang/LC_MESSAGES/EasyScreenCast@iacopodeenosee.gmail.com.mo
```

## Converting to GIF

There are a wide variety of video editors that should be able to convert
the screencasts to GIFs. An easy way to convert a file using the command
line is:

```
ffmpeg -i _filepath -pix_fmt rgb24 _dirpath/_filename.gif
```

For more information see for example:

 - [How do I convert a video to GIF using ffmpeg, with reasonable quality?](https://superuser.com/questions/556029/how-do-i-convert-a-video-to-gif-using-ffmpeg-with-reasonable-quality)


## Test matrix

| Distribution / gnome-shell           | ESC Version | Installation | Screen Recording | +Video Recording | +Audio Recording |
|--------------------------------------|-------------|--------------|------------------|------------------|------------------|
|Gnome OS latest (gnome-shell 45)      | 1.8.0       |  ✔           |  ✔               |  ✔               |  ✔               |
|Debian 11 Bullseye (gnome-shell 3.38) | 1.7.0       |  ✔           |  ✔               |  ✔               |  ✔               |
|Ubuntu 22.04 LTS (gnome-shell 42.2)   | 1.7.0       |  ✔           |  ✔               |  ✔               |  ✔               |
|Debian Experimental (gnome-shell 43)  | 1.7.0       |  ✔           |  ✔               |  ✔               |  ✔               |

Note: Only wayland sessions, always a fresh install of the linux distribution. Screen cast was the whole screen.
Quality setting: FPS 30, VP8, webm container.

X11 session is not tested.
