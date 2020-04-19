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

# License Info
EasyScreenCast is free software distributed under the GNU GPL. All files are under GPL v3. read [COPYING](COPYING.md) for more infomation about license.

# How to install
there are several methods:

1-from **gnome extension site**, just go on [this page](https://extensions.gnome.org/extension/690/easyscreencast/) and click/touch on the button ON, that's all.


2-from **github repo**, if you want the most up-to-date version, just do these simple steps


```
git clone https://github.com/EasyScreenCast/EasyScreenCast.git
cd EasyScreenCast
make
make install
```

# How to test changes

You can run a new session to test changes to the installed extension:

```
dbus-run-session -- gnome-shell --nested
```

# How to view the logs
You must **enable the verbose logs in options window** and after that you can find the logs by typing this on terminal:

```
journalctl --since=today --no-pager --output=cat | grep ESC
journalctl /usr/bin/gnome-shell --since=today --no-pager --output=cat
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
msgfmt locale/$lang.po -o locale/$lang/LC_MESSAGES/EasyScreenCast@iacopodeenosee.gmail.com.mo
```

# Converting to GIF

There are a wide variety of video editors that should be able to convert
the screencasts to GIFs. An easy way to convert a file using the command
line is:

```
ffmpeg -i _filepath -pix_fmt rgb24 _dirpath/_filename.gif
```

For more information see for example:

 - [How do I convert a video to GIF using ffmpeg, with reasonable quality?](https://superuser.com/questions/556029/how-do-i-convert-a-video-to-gif-using-ffmpeg-with-reasonable-quality)
