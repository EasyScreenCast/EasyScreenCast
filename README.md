EasyScreenCast simplifies the use of the video recording function integrated in gnome shell, allows quickly to change the various settings of the desktop recording. Copyright (C) 2013-16 Borsato Ivano.
- [Web Page](http://iacopodeenosee.wordpress.com/)
- [GNOME Shell Extensions Page](https://extensions.gnome.org/extension/690/easyscreencast/)
- [Video](https://youtu.be/81E9AruraKU)

# Requirements
- Gnome Shell 3.12+ [ 3.16+ audio/webcam support ]
- Gstreamer 1.x [ common function/webcam support ]
- gst plugins ugly [ x264 support ]
- gst plugins base [ common function/theora support ]
- gst plugins good [ mp4/mkv/webm/vp8/vp9 support ]

# Gstreamer patterns pipeline
![GStreamer  pipeline](https://iacopodeenosee.files.wordpress.com/2016/03/gstreamer_pipeline_diagram.jpeg "GSP pipeline")

# License Info
EasyScreenCast is free software distributed under the GNU GPL. All files are under GPL v3. read > COPYING < for more infomation about license.

# How to install
there are a few thing to do, open a terminal and enter:

1-download from github last version

```
git clone https://github.com/EasyScreenCast/EasyScreenCast
```

2-move the entire directory to gnome shell extension home

```
mv EasyScreenCast ~/.local/share/gnome-shell/extensions/EasyScreenCast@iacopodeenosee.gmail.com
```

# How to view the logs
You must **enable the verbose logs in options window** and after that you can find the logs by typing this on terminal:

```
journalctl --since=today --no-pager | grep js
```

to open the option windows from terminal try that on terminal:

```
gnome-shell-extension-prefs EasyScreenCast@iacopodeenosee.gmail.com
```

# Translation
If you want to help with translations, just follow these simple step:

1 - Create a new folders for the translations(if NOT exist), where $lang is a code language [[https://www.gnu.org/software/gettext/manual/html_node/Usual-Language-Codes.html#Usual-Language-Codes](https://www.gnu.org/software/gettext/manual/html_node/Usual-Language-Codes.html#Usual-Language-Codes)]

```
mkdir -p locale/$lang/LC_MESSAGES
```

2 - Translate the string with the program Poedit by using a .pot files (locale/messages.pot)

3 - Save these files in the same directory of .pot files, use the code language for the name of them (locale/$lang.po)

4 - Convert in binary these .po files, where $lang is a code language, with that command:

```
msgfmt /locale/$lang.po -o locale/$lang/LC_MESSAGES/EasyScreenCast@iacopodeenosee.gmail.com.mo
```
