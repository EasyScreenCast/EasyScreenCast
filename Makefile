# EasyScreenCast Makefile

UUID = EasyScreenCast@iacopodeenosee.gmail.com
NAME_EXTENSION = EasyScreenCast
BASE_MODULES = convenience.js prefs.js prefs.css selection.js utilgsp.js utilwebcam.js COPYING extension.js \
               metadata.json README.md settings.js timer.js utilnotify.js Options_UI.glade Options_UI.glade-gtk4 \
               package.json stylesheet.css utilaudio.js utilrecorder.js utilexecmd.js display_module.js
IMG_MEDIA = icon_defaultSel.svg Icon_Info.png icon_recordingSel.svg icon_default.svg Icon_Performance.svg \
            Icon_Quality.svg  icon_recording.svg

TOLOCALIZE =  prefs.js extension.js selection.js utilwebcam.js
MSGSRC = $(wildcard locale/*.po)

ifeq ($(strip $(DESTDIR)),)
	INSTALLBASE = $(HOME)/.local/share/gnome-shell/extensions
else
	INSTALLBASE = $(DESTDIR)/usr/share/gnome-shell/extensions
endif

INSTALLNAME = EasyScreenCast@iacopodeenosee.gmail.com

# Determine the version from package.json
# Depending on whether this is a build from a tag (a release)
# the version is used without modification. If this is a build
# from a branch, then the extension version is increased.
# This extension version number will be set in metadata.json
PACKAGE_VERSION=$(shell jq -r .version < package.json)
EXTENSION_VERSION=$(shell jq -r .version < metadata.json)
IS_RELEASE=$(if $(findstring HEAD tags/,$(shell git name-rev HEAD)),Y,N)

ifeq ($(IS_RELEASE),Y)
	VERSION=$(PACKAGE_VERSION)
	NEXT_EXTENSION_VERSION=$(EXTENSION_VERSION)
else
	VERSION=$(shell git describe --tags)
	NEXT_EXTENSION_VERSION=$(shell echo "$$(($(EXTENSION_VERSION) + 1))")
endif
VSTRING = $(VERSION)_$(NEXT_EXTENSION_VERSION)

all: extension mergepo

clean:
	rm -f ./schemas/gschemas.compiled
	rm -f ./locale/*.mo
	rm -f ./locale/easyscreencast.pot

extension: ./schemas/gschemas.compiled $(MSGSRC:.po=.mo)

./schemas/gschemas.compiled: ./schemas/org.gnome.shell.extensions.easyscreencast.gschema.xml
	glib-compile-schemas ./schemas/

potfile: ./locale/easyscreencast.pot

mergepo: potfile
	for l in $(MSGSRC); do \
		msgmerge -U $$l ./locale/easyscreencast.pot; \
	done;

./locale/easyscreencast.pot: $(TOLOCALIZE) Options_UI.glade Options_UI.glade-gtk4
	mkdir -p locale
	xgettext -k --keyword=_ --keyword=N_ --from-code=UTF-8 --add-comments='Translators:' -o locale/easyscreencast.pot --package-name "EasyScreenCast" $(TOLOCALIZE)
	intltool-extract --type=gettext/glade Options_UI.glade
	xgettext -k --keyword=_ --keyword=N_ --from-code=UTF-8 --join-existing -o locale/easyscreencast.pot Options_UI.glade.h
	rm Options_UI.glade.h
	intltool-extract --type=gettext/glade Options_UI.glade-gtk4
	xgettext -k --keyword=_ --keyword=N_ --from-code=UTF-8 --join-existing -o locale/easyscreencast.pot Options_UI.glade-gtk4.h
	rm Options_UI.glade-gtk4.h

./locale/%.mo: ./locale/%.po
	msgfmt -c $< -o $@

install: install-local

install-local: _build
	rm -rf $(INSTALLBASE)/$(INSTALLNAME)
	mkdir -p $(INSTALLBASE)/$(INSTALLNAME)
	cp -r ./_build/* $(INSTALLBASE)/$(INSTALLNAME)/
	-rm -fR _build
	echo done

versioninfo:
	@echo "====================================="
	@echo "Building $(NAME_EXTENSION) $(VSTRING)"
	@echo "====================================="

zip-file: _build
	cd _build ; \
	zip -qr "$(NAME_EXTENSION)_$(VSTRING).zip" .
	mv _build/$(NAME_EXTENSION)_$(VSTRING).zip ./
	-rm -fR _build

_build: versioninfo all
	-rm -fR ./_build
	mkdir -p _build
	cp $(BASE_MODULES) _build
	mkdir -p _build/images
	cd images ; cp $(IMG_MEDIA) ../_build/images/
	mkdir -p _build/schemas
	cp schemas/*.xml _build/schemas/
	cp schemas/gschemas.compiled _build/schemas/
	mkdir -p _build/locale
	for l in $(MSGSRC:.po=.mo) ; do \
		lf=_build/locale/`basename $$l .mo`; \
		mkdir -p $$lf; \
		mkdir -p $$lf/LC_MESSAGES; \
		cp $$l $$lf/LC_MESSAGES/$(UUID).mo; \
	done
	sed -i 's/"version": "[0-9]\{1,\}"/"version": "$(NEXT_EXTENSION_VERSION)"/'  _build/metadata.json
