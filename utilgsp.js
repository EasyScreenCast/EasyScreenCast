/* -*- mode: js; js-basic-offset: 4; indent-tabs-mode: nil -*- */

/*
    Copyright (C) 2016  Borsato Ivano

    The JavaScript code in this page is free software: you can
    redistribute it and/or modify it under the terms of the GNU
    General Public License (GNU GPL) as published by the Free Software
    Foundation, either version 3 of the License, or (at your option)
    any later version.  The code is distributed WITHOUT ANY WARRANTY;
    without even the implied warranty of MERCHANTABILITY or FITNESS
    FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.
*/

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Lib = Me.imports.convenience;
const Pref = Me.imports.prefs;
const UtilAudio = Me.imports.utilaudio;

// CONST GSP - base
const SCREEN = '_SCREENCAST_RES__ENCODER_VIDEO_ ! queue max-size-buffers=0 max-size-time=0 max-size-bytes=0 ! _CONTAINER_';

// CONST GSP - base plus sound
const SCREEN_SOUND = 'queue max-size-buffers=0 max-size-time=0 max-size-bytes=0 ! _SCREENCAST_RES__ENCODER_VIDEO_ ! queue max-size-buffers=0 max-size-time=0 max-size-bytes=0 ! mux. pulsesrc ! audioconvert ! _ENCODER_AUDIO_ ! queue max-size-buffers=0 max-size-time=0 max-size-bytes=0 ! mux. _CONTAINER_ name=mux ';

// CONST GSP - base plus webcam
const SCREEN_WEBCAM = 'queue max-size-buffers=0 max-size-time=0 max-size-bytes=0 ! videomixer name=mix ! videoconvert ! _SCREENCAST_RES__ENCODER_VIDEO_ ! mux. v4l2src _WEBCAM_DEV_ ! _WEBCAM_CAP_ ! queue max-size-buffers=0 max-size-time=0 max-size-bytes=0 ! mix. _CONTAINER_ name=mux';

// CONST GSP - base plus sound and webcam stream
const SCREEN_WEBCAM_SOUND = 'queue max-size-buffers=0 max-size-time=0 max-size-bytes=0 ! videomixer name=mix ! videoconvert ! _SCREENCAST_RES__ENCODER_VIDEO_ ! mux. v4l2src _WEBCAM_DEV_ ! _WEBCAM_CAP_ ! queue max-size-buffers=0 max-size-time=0 max-size-bytes=0 ! mix. pulsesrc ! audioconvert ! _ENCODER_AUDIO_ ! queue max-size-buffers=0 max-size-time=0 max-size-bytes=0 ! mux. _CONTAINER_ name=mux';

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

// CONST CONTAINER - WebM
const webm = {
    nameGSP: 'webmmux',
    quality: [{
        //quality level 0
        fps: 15,
        vq: 'vp8enc min_quantizer=13 max_quantizer=13 cpu-used=5 deadline=1000000 threads=%T',
        aq: 'vorbisenc',
        descr: 'FPS: 15 \nVideo -> VP8 Encoder | blabla \nAudio -> Vorbis Encoder'
    }, {
        //quality level 1
        fps: 30,
        vq: 'vp8enc min_quantizer=13 max_quantizer=13 cpu-used=5 deadline=1000000 threads=%T',
        aq: 'vorbisenc',
        descr: 'FPS: 30 \nVideo -> VP8 Encoder | blabla \nAudio -> Vorbis Encoder'

    }, {
        //quality level 2
        fps: 30,
        vq: 'vp8enc min_quantizer=13 max_quantizer=13 cpu-used=5 deadline=1000000 threads=%T',
        aq: 'vorbisenc',
        descr: 'FPS: 30 \nVideo -> VP8 Encoder | blabla \nAudio -> Vorbis Encoder'
    }, {
        //quality level 3
        fps: 60,
        vq: 'vp8enc min_quantizer=13 max_quantizer=13 cpu-used=5 deadline=1000000 threads=%T',
        aq: 'vorbisenc',
        descr: 'FPS: 60 \nVideo -> VP8 Encoder | blabla \nAudio -> Vorbis Encoder'
    }, ]
};

// CONST CONTAINER - Mp4
const mp4 = {
    nameGSP: 'mp4mux',
    quality: [{
        //quality level 0
        fps: 15,
        vq: 'mpeg2enc',
        aq: 'lamemp3enc',
        descr: 'FPS: 15 \nVideo -> Mpeg2 Encoder | blabla \nAudio -> Mp3 Encoder'
    }, {
        //quality level 1
        fps: 30,
        vq: 'mpeg2enc',
        aq: 'lamemp3enc',
        descr: 'FPS: 30 \nVideo -> Mpeg2 Encoder | blabla \nAudio -> Mp3 Encoder'
    }, {
        //quality level 2
        fps: 30,
        vq: 'mpeg2enc',
        aq: 'lamemp3enc',
        descr: 'FPS: 30 \nVideo -> Mpeg2 Encoder | blabla \nAudio -> Mp3 Encoder'
    }, {
        //quality level 3
        fps: 60,
        vq: 'mpeg2enc',
        aq: 'lamemp3enc',
        descr: 'FPS: 60 \nVideo -> Mpeg2 Encoder | blabla \nAudio -> Mp3 Encoder'
    }, ]
};

// CONST CONTAINER - Mkv
const mkv = {
    nameGSP: 'matroskamux',
    quality: [{
        //quality level 0
        fps: 15,
        vq: 'x264enc',
        aq: 'flacenc',
        descr: 'FPS: 15 \nVideo -> x264 Encoder | blabla \nAudio -> Flac Encoder'
    }, {
        //quality level 1
        fps: 30,
        vq: 'x264enc',
        aq: 'flacenc',
        descr: 'FPS: 30 \nVideo -> x264 Encoder | blabla \nAudio -> Flac Encoder'
    }, {
        //quality level 2
        fps: 30,
        vq: 'x264enc',
        aq: 'flacenc',
        descr: 'FPS: 30 \nVideo -> x264 Encoder | blabla \nAudio -> Flac Encoder'
    }, {
        //quality level 3
        fps: 60,
        vq: 'x264enc',
        aq: 'flacenc',
        descr: 'FPS: 60 \nVideo -> x264 Encoder | blabla \nAudio -> Flac Encoder'
    }, ]
};

// CONST CONTAINER - Ogg
const ogg = {
    nameGSP: 'oggmux',
    quality: [{
        //quality level 0
        fps: 15,
        vq: 'theoraenc',
        aq: 'opusenc',
        descr: 'FPS: 15 \nVideo -> Theora Encoder | blabla \nAudio -> Opus Encoder'
    }, {
        //quality level 1
        fps: 30,
        vq: 'theoraenc',
        aq: 'opusenc',
        descr: 'FPS: 30 \nVideo -> Theora Encoder | blabla \nAudio -> Opus Encoder'
    }, {
        //quality level 2
        fps: 30,
        vq: 'theoraenc',
        aq: 'opusenc',
        descr: 'FPS: 30 \nVideo -> Theora Encoder | blabla \nAudio -> Opus Encoder'
    }, {
        //quality level 3
        fps: 60,
        vq: 'theoraenc',
        aq: 'opusenc',
        descr: 'FPS: 60 \nVideo -> Theora Encoder | blabla \nAudio -> Opus Encoder'
    }, ]
};

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

// CONST RESOLUTION
const RESOLUTION = [
    // NATIVE SCREENCAST RESOLUTION
    '',
    // SD - 480
    'videoscale ! video/x-raw, width=768, height=480, framerate=30/1 , add-borders=true ! ',
    // HD - 720
    'videoscale ! video/x-raw, width=1280, height=720, framerate=30/1 , add-borders=true ! ',
    // FHD - 1080
    'videoscale ! video/x-raw, width=1920, height=1080, framerate=30/1 , add-borders=true ! ',
    // UHD - 2160
    'videoscale ! video/x-raw, width=3840, height=2160, framerate=30/1 , add-borders=true ! '
];

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

// VAR ARRAY CONTAINER
const CONTAINER = [webm, mp4, mkv, ogg];

//@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

/*
 * Compose GSP
 */
function composeGSP() {
    Lib.TalkativeLog('-§-COMPOSE GSP');

    this.CtrlAudio = new UtilAudio.MixerAudio();
    this.tmpGSP = '';

    //retrieve options
    let Device_Webcam = Pref.getOption(
        'i', Pref.DEVICE_WEBCAM_SETTING_KEY);
    let Device_Audio = Pref.getOption(
        'i', Pref.INPUT_AUDIO_SOURCE_SETTING_KEY);
    let QualityGSP = Pref.getOption(
        'i', Pref.QUALITY_SETTING_KEY);
    let QualityWebcam = Pref.getOption(
        's', Pref.QUALITY_WEBCAM_SETTING_KEY);
    let Resolution = Pref.getOption(
        'i', Pref.FILE_RESOLUTION_SETTING_KEY);
    let Container = Pref.getOption(
        'i', Pref.FILE_CONTAINER_SETTING_KEY);

    Lib.TalkativeLog('-§-get option||devWB: ' + Device_Webcam + '||devA: ' + Device_Audio + '||Qgsp: ' + QualityGSP + '||Qwc: ' + QualityWebcam + '||Res: ' + Resolution + '||Cont: ' + Container);

    if (Device_Webcam > 0) {
        switch (Device_Audio) {
            case 0:
                Lib.TalkativeLog('-§- SCREEN-WEBCAM');

                this.tmpGSP = SCREEN_WEBCAM;

                //replace WEBCAM_DEVICE/WEBCAM_CAPS
                this.tmpGSP = replaceWebcam(
                    this.tmpGSP,
                    Device_Webcam,
                    QualityWebcam
                );

                break;
            case 1:
                Lib.TalkativeLog('-§-SCREEN-WEBCAM-AUDIO(d)');

                this.tmpGSP = SCREEN_WEBCAM_SOUND;

                //replace WEBCAM_DEVICE/WEBCAM_CAPS/ENCODER-AUDIO
                this.tmpGSP = replaceAudio(
                    replaceWebcam(
                        this.tmpGSP,
                        Device_Webcam,
                        QualityWebcam),
                    true,
                    Container,
                    QualityGSP);

                break;
            default:
                Lib.TalkativeLog('-§-SCREEN-WEBCAM-AUDIO');

                this.tmpGSP = SCREEN_WEBCAM_SOUND;

                //replace WEBCAM_DEVICE/WEBCAM_CAPS/ENCODER-AUDIO/AUDIO_DEVICE
                this.tmpGSP = replaceAudio(
                    replaceWebcam(
                        this.tmpGSP,
                        Device_Webcam,
                        QualityWebcam),
                    false,
                    Container,
                    QualityGSP);
        }
    } else {
        switch (Device_Audio) {
            case 0:
                Lib.TalkativeLog('-§-SCREEN');

                this.tmpGSP = SCREEN;

                break;
            case 1:
                Lib.TalkativeLog('-§-SCREEN-AUDIO(d)');

                this.tmpGSP = SCREEN_SOUND;

                //replace ENCODER-AUDIO
                this.tmpGSP = replaceAudio(
                    this.tmpGSP,
                    true,
                    Container,
                    QualityGSP);

                break;
            default:
                Lib.TalkativeLog('-§-SCREEN-AUDIO');

                this.tmpGSP = SCREEN_SOUND;

                //replace ENCODER-AUDIO/AUDIO_DEVICE
                this.tmpGSP = replaceAudio(
                    this.tmpGSP,
                    false,
                    Container,
                    QualityGSP);
        }
    }

    //replace RESOLUTION/ENCODER-VIDEO/CONTAINER
    var mapObj = {
        _SCREENCAST_RES_: RESOLUTION[Resolution],
        _ENCODER_VIDEO_: CONTAINER[Container].quality[QualityGSP].vq,
        _CONTAINER_: CONTAINER[Container].nameGSP
    };

    this.tmpGSP = this.tmpGSP.replace(
        /_SCREENCAST_RES_|_ENCODER_VIDEO_|_CONTAINER_/gi,
        function(match) {
            return mapObj[match];
        }
    );


    Lib.TalkativeLog('-§-final GSP :' + this.tmpGSP);

    return this.tmpGSP;
}

/*
 * replace audio
 */
function replaceAudio(gsp, defaultAudio, ConTMP, QGSPtmp) {
    Lib.TalkativeLog('-§-replace audio default->' + defaultAudio);
    //replace device/encoder
    Lib.TalkativeLog('-§-pipeline pre-audio:' + gsp);

    if (defaultAudio) {
        var audioPipeline = gsp.replace(/_ENCODER_AUDIO_/gi,
            CONTAINER[ConTMP].quality[QGSPtmp].aq);
    } else {
        var audiosource = this.CtrlAudio.getAudioSource();
        if (audiosource.indexOf('output') !== -1) {
            audiosource += '.monitor';
        }
        var reDev = 'pulsesrc device="' + audiosource + '"';

        var mapObj = {
            pulsesrc: reDev,
            _ENCODER_VIDEO_: CONTAINER[ConTMP].quality[QGSPtmp].aq
        };

        var audioPipeline = gsp.replace(/pulsesrc|_ENCODER_AUDIO_/gi,
            function(match) {
                return mapObj[match];
            }
        );
    }

    Lib.TalkativeLog('-§-pipeline post-audio:' + audioPipeline);

    return audioPipeline;
}

/*
 * replace webcam
 */
function replaceWebcam(gsp, device, caps) {
    Lib.TalkativeLog('-§-replace webcam -> ' + device);

    //replace device/caps
    var reDev = '/dev/video' + device - 1;

    Lib.TalkativeLog('-§-pipeline pre-webcam:' + gsp);

    var mapObj = {
        _WEBCAM_DEV_: reDev,
        _ENCODER_VIDEO_: caps
    };

    var audioPipeline = gsp.replace(/_WEBCAM_DEV_|_WEBCAM_CAP_/gi,
        function(match) {
            return mapObj[match];
        }
    );

    Lib.TalkativeLog('-§-pipeline post-webcam:' + webcamPipeline);

    return webcamPipeline;
}

/*
 * get description
 */
function getDescr(quality, container) {
    Lib.TalkativeLog('-§-get description Q-> ' + quality + ' C-> ' + container);

    return CONTAINER[container].quality[quality].descr;
}