EasyScreenCast is a simple extension of a gnome 3 shell DE 

Copyright (C) 2013-2014 Borsato Ivano.

* [Web Page](http://iacopodeenosee.wordpress.com/)
* [GNOME Shell Extensions Page](https://extensions.gnome.org/extension/690/easyscreencast/)

##License Info
EasyScreenCast is free software distributed under the GNU GPL.
All files are under GPL v3.
read > COPYING < for more infomation about license.

##How to install
there are a few thing to do, open a terminal and enter:

1-download from github last version

    git clone https://github.com/iacopodeenosee/EasyScreenCast
    
    
2-move the entire directory to gnome shell extension home

    mv EasyScreenCast ~/.local/share/gnome-shell/extensions/EasyScreenCast@iacopodeenosee.gmail.com
    
    
##Translation
If you want to help with translation in your language, just follow these simple step:

1 - Create a new folders for the translations(if NOT exist), where $lang is a code language [https://www.gnu.org/software/gettext/manual/html_node/Usual-Language-Codes.html#Usual-Language-Codes]

    mkdir -p locale/$lang/LC_MESSAGES

2 - Translate the string with the program Poedit by using a .pot files (locale/messages.pot locale-UI/messagesUI.pot)

3 - Save these files in the same directory of .pot files, use the code language for the name of them (locale/it.po locale-UI/it.po) 

4 - Convert in binary these .po files, where $lang is a code language, with these command:

    msgfmt /locale/$lang.po -o locale/$lang/LC_MESSAGES/EasyScreenCast@iacopodeenosee.gmail.com.mo
    msgfmt /locale-UI/$lang.po -o locale-UI/$lang/LC_MESSAGES/EasyScreenCast@iacopodeenosee.gmail.com.mo