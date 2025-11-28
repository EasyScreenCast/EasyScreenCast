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

'use strict';

import * as Lib from './convenience.js';
import * as Settings from './settings.js';

// CONST GSP - base
const SCREEN =
    '_SCREENCAST_RES_ _ENCODER_VIDEO_ ! queue max-size-buffers=0 max-size-time=0 max-size-bytes=0 ! _CONTAINER_';

// CONST GSP - base plus sound
const SCREEN_SOUND =
    'queue max-size-buffers=0 max-size-time=0 max-size-bytes=0 ! _SCREENCAST_RES_ _ENCODER_VIDEO_ ! queue max-size-buffers=0 max-size-time=0 max-size-bytes=0 ! mux. pulsesrc ! audioconvert ! _ENCODER_AUDIO_ ! queue max-size-buffers=0 max-size-time=0 max-size-bytes=0 ! mux. _CONTAINER_ name=mux ';

// CONST GSP - base plus webcam
const SCREEN_WEBCAM =
    'queue max-size-buffers=0 max-size-time=0 max-size-bytes=0 ! videomixer name=mix _WEBCAM_OPT_ ! videoconvert ! _SCREENCAST_RES_ _ENCODER_VIDEO_ ! mux. v4l2src _WEBCAM_DEV_ ! _WEBCAM_CAP_ ! videoscale ! video/x-raw, width=_WEBCAM_W_, height=_WEBCAM_H_, add-borders=false ! queue max-size-buffers=0 max-size-time=0 max-size-bytes=0 ! mix. _CONTAINER_ name=mux';

// CONST GSP - base plus sound and webcam stream
const SCREEN_WEBCAM_SOUND =
    'queue max-size-buffers=0 max-size-time=0 max-size-bytes=0 ! videomixer name=mix _WEBCAM_OPT_ ! videoconvert ! _SCREENCAST_RES_ _ENCODER_VIDEO_ ! mux. v4l2src _WEBCAM_DEV_ ! _WEBCAM_CAP_ ! videoscale ! video/x-raw, width=_WEBCAM_W_, height=_WEBCAM_H_,  add-borders=false ! queue max-size-buffers=0 max-size-time=0 max-size-bytes=0 ! mix. pulsesrc ! audioconvert ! _ENCODER_AUDIO_ ! queue max-size-buffers=0 max-size-time=0 max-size-bytes=0 ! mux. _CONTAINER_ name=mux';

// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

// CONST CONTAINER - WebM
const webmVP8 = {
    fileExt: '.webm',
    nameGSP: 'webmmux',
    quality: [
        {
            // quality level 0
            fps: 15,
            vq:
                'vp8enc min_quantizer=13 max_quantizer=20 cpu-used=5 deadline=1000000 sharpness=2 target-bitrate=10000 threads=%T',
            aq: 'vorbisenc',
            descr:
                'FPS: 15 \nVideo -> VP8  Encoder:\n-min_quantizer=13\n-max_quantizer=20\n-cpu-used=5\n-deadline=1000000\n-sharpness=2\n-target-bitrate=10000\nAudio -> Vorbis Encoder',
        },
        {
            // quality level 1
            fps: 30,
            vq:
                'vp8enc min_quantizer=4 max_quantizer=13 cpu-used=2 deadline=500000 sharpness=0 target-bitrate=15000 threads=%T',
            aq: 'vorbisenc',
            descr:
                'FPS: 30 \nVideo -> VP8  Encoder:\n-min_quantizer=4\n-max_quantizer=13\n-cpu-used=2\n-deadline=500000\n-sharpness=0\n-target-bitrate=15000\nAudio -> Vorbis Encoder',
        },
        {
            // quality level 2
            fps: 30,
            vq:
                'vp8enc min_quantizer=0 max_quantizer=7 cpu-used=1 deadline=500000 sharpness=0 target-bitrate=25000 threads=%T',
            aq: 'vorbisenc',
            descr:
                'FPS: 30 \nVideo -> VP8  Encoder:\n-min_quantizer=0\n-max_quantizer=7\n-cpu-used=1\n-deadline=500000\n-sharpness=0\n-target-bitrate=25000\nAudio -> Vorbis Encoder',
        },
        {
            // quality level 3
            fps: 60,
            vq:
                'vp8enc min_quantizer=0 max_quantizer=0 cpu-used=0 deadline=100000 sharpness=0 target-bitrate=40000 threads=%T',
            aq: 'vorbisenc',
            descr:
                'FPS: 60 \nVideo -> VP8  Encoder:\n-min_quantizer=0\n-max_quantizer=0\n-cpu-used=0\n-deadline=100000\n-sharpness=0\n-target-bitrate=40000\nAudio -> Vorbis Encoder',
        },
    ],
};

const webmVP9 = {
    fileExt: '.webm',
    nameGSP: 'webmmux',
    quality: [
        {
            // quality level 0
            fps: 15,
            vq:
                'vp9enc min_quantizer=13 max_quantizer=20 cpu-used=5 deadline=1000000 sharpness=2 target-bitrate=10000 threads=%T',
            aq: 'vorbisenc',
            descr:
                'FPS: 15 \nVideo -> VP9  Encoder:\n-min_quantizer=13\n-max_quantizer=20\n-cpu-used=5\n-deadline=1000000\n-sharpness=2\n-target-bitrate=10000\nAudio -> Vorbis Encoder',
        },
        {
            // quality level 1
            fps: 30,
            vq:
                'vp9enc min_quantizer=4 max_quantizer=13 cpu-used=2 deadline=500000 sharpness=0 target-bitrate=15000 threads=%T',
            aq: 'vorbisenc',
            descr:
                'FPS: 30 \nVideo -> VP9  Encoder:\n-min_quantizer=4\n-max_quantizer=13\n-cpu-used=2\n-deadline=500000\n-sharpness=0\n-target-bitrate=15000\nAudio -> Vorbis Encoder',
        },
        {
            // quality level 2
            fps: 30,
            vq:
                'vp9enc min_quantizer=0 max_quantizer=7 cpu-used=1 deadline=500000 sharpness=0 target-bitrate=25000 threads=%T',
            aq: 'vorbisenc',
            descr:
                'FPS: 30 \nVideo -> VP9  Encoder:\n-min_quantizer=0\n-max_quantizer=7\n-cpu-used=1\n-deadline=500000\n-sharpness=0\n-target-bitrate=25000\nAudio -> Vorbis Encoder',
        },
        {
            // quality level 3
            fps: 60,
            vq:
                'vp9enc min_quantizer=0 max_quantizer=0 cpu-used=0 deadline=100000 sharpness=0 target-bitrate=40000 threads=%T',
            aq: 'vorbisenc',
            descr:
                'FPS: 60 \nVideo -> VP9  Encoder:\n-min_quantizer=0\n-max_quantizer=0\n-cpu-used=0\n-deadline=100000\n-sharpness=0\n-target-bitrate=40000\nAudio -> Vorbis Encoder',
        },
    ],
};

// CONST CONTAINER - Mp4
const mp4 = {
    fileExt: '.mp4',
    nameGSP: 'mp4mux',
    quality: [
        {
            // quality level 0
            fps: 15,
            vq:
                'x264enc psy-tune="none" speed-preset="superfast" subme=1 qp-min=28 qp-max=40 threads=%T',
            aq: 'lamemp3enc',
            descr:
                'FPS: 15 \nVideo -> x264enc  Encoder:\n-psy-tune="none"\n-speed-preset="superfast"\n-subme=1\n-qp-min=28\n-qp-max=40\nAudio -> Mp3 Encoder',
        },
        {
            // quality level 1
            fps: 30,
            vq:
                'x264enc psy-tune="animation" speed-preset="fast" subme=5 qp-min=18 qp-max=28 threads=%T',
            aq: 'lamemp3enc',
            descr:
                'FPS: 30 \nVideo -> x264enc  Encoder:\n-psy-tune="animation"\n-speed-preset="fast"\n-subme=5\n-qp-min=18\n-qp-max=28\nAudio -> Mp3 Encoder',
        },
        {
            // quality level 2
            fps: 30,
            vq:
                'x264enc psy-tune="animation" speed-preset="medium" subme=8 qp-min=10 qp-max=18 threads=%T',
            aq: 'lamemp3enc',
            descr:
                'FPS: 30 \nVideo -> x264enc  Encoder:\n-psy-tune="animation"\n-speed-preset="medium"\n-subme=8\n-qp-min=10\n-qp-max=18\nAudio -> Mp3 Encoder',
        },
        {
            // quality level 3
            fps: 60,
            vq:
                'x264enc psy-tune="film" speed-preset="slower" subme=10 qp-min=0 qp-max=10 threads=%T',
            aq: 'lamemp3enc',
            descr:
                'FPS: 60 \nVideo -> x264enc  Encoder:\n-psy-tune="film"\n-speed-preset="slower"\n-subme=10\n-qp-min=0\n-qp-max=10\nAudio -> Mp3 Encoder',
        },
    ],
};

const mp4Aac = {
    fileExt: '.mp4',
    nameGSP: 'mp4mux',
    quality: [
        {
            // quality level 0
            fps: 15,
            vq:
                'x264enc psy-tune="none" speed-preset="superfast" subme=1 qp-min=28 qp-max=40 threads=%T',
            aq: 'avenc_aac',
            descr:
                'FPS: 15 \nVideo -> x264enc  Encoder:\n-psy-tune="none"\n-speed-preset="superfast"\n-subme=1\n-qp-min=28\n-qp-max=40\nAudio -> AAC Encoder',
        },
        {
            // quality level 1
            fps: 30,
            vq:
                'x264enc psy-tune="animation" speed-preset="fast" subme=5 qp-min=18 qp-max=28 threads=%T',
            aq: 'avenc_aac',
            descr:
                'FPS: 30 \nVideo -> x264enc  Encoder:\n-psy-tune="animation"\n-speed-preset="fast"\n-subme=5\n-qp-min=18\n-qp-max=28\nAudio -> AAC Encoder',
        },
        {
            // quality level 2
            fps: 30,
            vq:
                'x264enc psy-tune="animation" speed-preset="medium" subme=8 qp-min=10 qp-max=18 threads=%T',
            aq: 'avenc_aac',
            descr:
                'FPS: 30 \nVideo -> x264enc  Encoder:\n-psy-tune="animation"\n-speed-preset="medium"\n-subme=8\n-qp-min=10\n-qp-max=18\nAudio -> AAC Encoder',
        },
        {
            // quality level 3
            fps: 60,
            vq:
                'x264enc psy-tune="film" speed-preset="slower" subme=10 qp-min=0 qp-max=10 threads=%T',
            aq: 'avenc_aac',
            descr:
                'FPS: 60 \nVideo -> x264enc  Encoder:\n-psy-tune="film"\n-speed-preset="slower"\n-subme=10\n-qp-min=0\n-qp-max=10\nAudio -> AAC Encoder',
        },
    ],
};

// CONST CONTAINER - Mkv
const mkv = {
    fileExt: '.mkv',
    nameGSP: 'matroskamux',
    quality: [
        {
            // quality level 0
            fps: 15,
            vq:
                'x264enc psy-tune="none" speed-preset="superfast" subme=1 qp-min=28 qp-max=40 threads=%T',
            aq: 'flacenc',
            descr:
                'FPS: 15 \nVideo -> x264enc  Encoder:\n-psy-tune="none"\n-speed-preset="superfast"\n-subme=1\n-qp-min=28\n-qp-max=40\nAudio -> Flac Encoder',
        },
        {
            // quality level 1
            fps: 30,
            vq:
                'x264enc psy-tune="animation" speed-preset="fast" subme=5 qp-min=18 qp-max=28 threads=%T',
            aq: 'flacenc',
            descr:
                'FPS: 30 \nVideo -> x264enc  Encoder:\n-psy-tune="animation"\n-speed-preset="fast"\n-subme=5\n-qp-min=18\n-qp-max=28\nAudio -> Flac Encoder',
        },
        {
            // quality level 2
            fps: 30,
            vq:
                'x264enc psy-tune="animation" speed-preset="medium" subme=8 qp-min=10 qp-max=18 threads=%T',
            aq: 'flacenc',
            descr:
                'FPS: 30 \nVideo -> x264enc  Encoder:\n-psy-tune="animation"\n-speed-preset="medium"\n-subme=8\n-qp-min=10\n-qp-max=18\nAudio -> Flac Encoder',
        },
        {
            // quality level 3
            fps: 60,
            vq:
                'x264enc psy-tune="film" speed-preset="slower" subme=10 qp-min=0 qp-max=10 threads=%T',
            aq: 'flacenc',
            descr:
                'FPS: 60 \nVideo -> x264enc  Encoder:\n-psy-tune="film"\n-speed-preset="slower"\n-subme=10\n-qp-min=0\n-qp-max=10\nAudio -> Flac Encoder',
        },
    ],
};

// CONST CONTAINER - Ogg
const ogg = {
    fileExt: '.ogg',
    nameGSP: 'oggmux',
    quality: [
        {
            // quality level 0
            fps: 15,
            vq:
                'theoraenc speed-level=3 vp3-compatible=true quality=10 bitrate=10000',
            aq: 'opusenc',
            descr:
                'FPS: 15 \nVideo -> Theora Encoder:\n-speed-level=3\n-vp3-compatible=true\n-quality=10\n-bitrate=10000\nAudio -> Opus Encoder',
        },
        {
            // quality level 1
            fps: 30,
            vq:
                'theoraenc speed-level=1 vp3-compatible=false quality=30 bitrate=25000',
            aq: 'opusenc',
            descr:
                'FPS: 30 \nVideo -> Theora Encoder:\n-speed-level=1\n-vp3-compatible=false\n-quality=30\n-bitrate=25000\nAudio -> Opus Encoder',
        },
        {
            // quality level 2
            fps: 30,
            vq:
                'theoraenc speed-level=0 vp3-compatible=false quality=50 bitrate=50000',
            aq: 'opusenc',
            descr:
                'FPS: 30 \nVideo -> Theora Encoder:\n-speed-level=0\n-vp3-compatible=false\n-quality=50\n-bitrate=50000\nAudio -> Opus Encoder',
        },
        {
            // quality level 3
            fps: 60,
            vq:
                'theoraenc speed-level=0 vp3-compatible=false quality=60 bitrate=100000',
            aq: 'opusenc',
            descr:
                'FPS: 60 \nVideo -> Theora Encoder\n-speed-level=0\n-vp3-compatible=false\n-quality=60\n-bitrate=100000\nAudio -> Opus Encoder',
        },
    ],
};

// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

// CONST RESOLUTION
const RESOLUTION = [
    // NATIVE SCREENCAST RESOLUTION
    '',
    // PRESET/CUSTOM SCREENCAST RESOLUTION
    'videoscale ! video/x-raw, width=_RES_WIDTH_, height=_RES_HEIGHT_, add-borders=_RES_KAR_ ! ',
];

// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

// VAR ARRAY CONTAINER
// see cbt_FileContainer in *.glade files for the combo box
const CONTAINER = [webmVP8, webmVP9, mp4, mkv, ogg, mp4Aac];

// @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

/**
 * Compose GSP
 *
 * @param {EasyScreenCastSettings} settings the extension's settings
 * @param {MixerAudio} mixer the mixer
 *
 * @returns {string}
 */
export function composeGSP(settings, mixer) {
    Lib.TalkativeLog('-§-COMPOSE GSP');

    let tmpGSP = '';

    // retrieve options
    let deviceWebcam = settings.getOption('s', Settings.DEVICE_WEBCAM_SETTING_KEY);
    let deviceAudio = settings.getOption('i', Settings.INPUT_AUDIO_SOURCE_SETTING_KEY);
    let qualityGSP = settings.getOption('i', Settings.QUALITY_SETTING_KEY);
    let qualityWebcam = settings.getOption('s', Settings.QUALITY_WEBCAM_SETTING_KEY);
    let resolutionType = settings.getOption('i', Settings.FILE_RESOLUTION_TYPE_SETTING_KEY);
    let resolutionKAR = settings.getOption('b', Settings.FILE_RESOLUTION_KAR_SETTING_KEY);
    let resolutionHeight = settings.getOption('i', Settings.FILE_RESOLUTION_HEIGHT_SETTING_KEY);
    let resolutionWidth = settings.getOption('i', Settings.FILE_RESOLUTION_WIDTH_SETTING_KEY);
    let container = settings.getOption('i', Settings.FILE_CONTAINER_SETTING_KEY);

    Lib.TalkativeLog(
        `-§-get option||devW: ${deviceWebcam}||devA: ${deviceAudio}||Qgsp: ${qualityGSP}||Qwc: ${qualityWebcam}||Res: ${resolutionType}||Cont: ${container}`
    );

    if (deviceWebcam !== '') {
        switch (deviceAudio) {
        case 0:
            Lib.TalkativeLog('-§- SCREEN-WEBCAM');

            tmpGSP = SCREEN_WEBCAM;

            // replace WEBCAM_DEVICE/WEBCAM_CAPS
            tmpGSP = _replaceWebcam(
                tmpGSP,
                deviceWebcam,
                qualityWebcam,
                settings
            );

            break;
        case 1:
            Lib.TalkativeLog('-§-SCREEN-WEBCAM-AUDIO(d)');

            tmpGSP = SCREEN_WEBCAM_SOUND;

            // replace WEBCAM_DEVICE/WEBCAM_CAPS/ENCODER-AUDIO
            tmpGSP = _replaceAudio(
                _replaceWebcam(tmpGSP, deviceWebcam, qualityWebcam, settings),
                true,
                container,
                qualityGSP,
                mixer
            );

            break;
        default:
            Lib.TalkativeLog('-§-SCREEN-WEBCAM-AUDIO');

            tmpGSP = SCREEN_WEBCAM_SOUND;

            // replace WEBCAM_DEVICE/WEBCAM_CAPS/ENCODER-AUDIO/AUDIO_DEVICE
            tmpGSP = _replaceAudio(
                _replaceWebcam(tmpGSP, deviceWebcam, qualityWebcam, settings),
                false,
                container,
                qualityGSP,
                mixer
            );
        }
    } else {
        switch (deviceAudio) {
        case 0:
            Lib.TalkativeLog('-§-SCREEN');

            tmpGSP = SCREEN;

            break;
        case 1:
            Lib.TalkativeLog('-§-SCREEN-AUDIO(d)');

            tmpGSP = SCREEN_SOUND;

            // replace ENCODER-AUDIO
            tmpGSP = _replaceAudio(
                tmpGSP,
                true,
                container,
                qualityGSP,
                mixer
            );

            break;
        default:
            Lib.TalkativeLog('-§-SCREEN-AUDIO');

            tmpGSP = SCREEN_SOUND;

            // replace ENCODER-AUDIO/AUDIO_DEVICE
            tmpGSP = _replaceAudio(
                tmpGSP,
                false,
                container,
                qualityGSP,
                mixer
            );
        }
    }

    // compose resolution string
    var resolution = _composeResolution(
        resolutionType,
        resolutionHeight,
        resolutionWidth,
        resolutionKAR
    );

    // replace RESOLUTION/ENCODER-VIDEO/CONTAINER
    var mapObj = {
        _SCREENCAST_RES_: resolution,
        _ENCODER_VIDEO_: CONTAINER[container].quality[qualityGSP].vq,
        _CONTAINER_: CONTAINER[container].nameGSP,
    };

    tmpGSP = tmpGSP.replace(
        /_SCREENCAST_RES_|_ENCODER_VIDEO_|_CONTAINER_/gi,
        match => {
            return mapObj[match];
        }
    );

    Lib.TalkativeLog(`-§-final GSP :${tmpGSP}`);

    return tmpGSP;
}

/**
 * replace audio
 *
 * @param {string} gspRA input pipeline to be modified
 * @param {boolean} defaultAudio whether to use the default audio device
 * @param {int} ConTMP selected output container. Used to determine correct audio encoder
 * @param {int} QGSPtmp quality setting
 * @param {MixerAudio} mixer audio mixer
 * @returns {string} pipeline with audio
 */
function _replaceAudio(gspRA, defaultAudio, ConTMP, QGSPtmp, mixer) {
    Lib.TalkativeLog(`-§-replace audio default->${defaultAudio}`);
    // replace device/encoder
    var aq = CONTAINER[ConTMP].quality[QGSPtmp].aq;
    Lib.TalkativeLog(`-§-pipeline pre-audio:${gspRA} aq:${aq}`);
    var audioPipeline;

    if (defaultAudio) {
        Lib.TalkativeLog('-§-default audio source');
        audioPipeline = gspRA.replace(/_ENCODER_AUDIO_/gi, aq);
    } else {
        var audiosource = mixer.getAudioSource();
        if (audiosource === undefined) {
            Lib.TalkativeLog('-§-failure combination of array audio sources');
            audioPipeline = gspRA.replace(/_ENCODER_AUDIO_/gi, aq);
        } else {
            Lib.TalkativeLog('-§-correct audio source assignment');
            if (audiosource.indexOf('output') !== -1)
                audiosource += '.monitor';

            var reDev = `pulsesrc device="${audiosource}"`;

            var mapObj = {
                pulsesrc: reDev,
                _ENCODER_AUDIO_: aq,
            };

            audioPipeline = gspRA.replace(
                /pulsesrc|_ENCODER_AUDIO_/gi,
                match => {
                    return mapObj[match];
                }
            );
        }
    }

    Lib.TalkativeLog(`-§-pipeline post-audio:${audioPipeline}`);

    return audioPipeline;
}

/**
 * replace webcam
 *
 * @param {string} gspRW input pipeline to be modified
 * @param {string} device webcam device file (e.g. /dev/video0)
 * @param {string} caps quality options
 * @param {EasyScreenCastSettings} settings the extension's settings
 * @returns {string} pipeline with webcam settings
 */
function _replaceWebcam(gspRW, device, caps, settings) {
    Lib.TalkativeLog(`-§-replace webcam -> ${device} caps: ${caps}`);

    // replace device/caps
    var reDev = `device=${device}`;
    var reWCopt = _composeWebCamOption(settings);
    var [reWCwidth, reWCheight] = _getWebCamDimension(settings);

    Lib.TalkativeLog(`-§-pipeline pre-webcam:${gspRW}`);

    var mapObj = {
        _WEBCAM_DEV_: reDev,
        _WEBCAM_CAP_: caps,
        _WEBCAM_OPT_: reWCopt,
        _WEBCAM_W_: reWCwidth,
        _WEBCAM_H_: reWCheight,
    };

    var webcamPipeline = gspRW.replace(
        /_WEBCAM_DEV_|_WEBCAM_CAP_|_WEBCAM_OPT_|_WEBCAM_W_|_WEBCAM_H_/gi,
        match => {
            return mapObj[match];
        }
    );

    Lib.TalkativeLog(`-§-pipeline post-webcam:${webcamPipeline}`);

    return webcamPipeline;
}

/**
 * replace resolution
 *
 * @param {int} tmpRes resolution type: native/custom
 * @param {int} h custom height
 * @param {int} w custom width
 * @param {boolean} kar whether to keep aspect ratio
 * @returns {string} pipeline part for scaling resolution
 */
function _composeResolution(tmpRes, h, w, kar) {
    Lib.TalkativeLog(`-§-resolution option: ${tmpRes}`);
    var strRes = RESOLUTION[0];
    var mapObj = {};

    switch (tmpRes) {
    case -1:
        break;
    case 999:
        mapObj = {
            _RES_KAR_: kar ? 'true' : 'false',
            _RES_HEIGHT_: h,
            _RES_WIDTH_: w,
        };

        strRes = RESOLUTION[1].replace(
            /_RES_KAR_|_RES_HEIGHT_|_RES_WIDTH_/gi,
            match => {
                return mapObj[match];
            }
        );
        break;
    default:
        mapObj = {
            _RES_KAR_: 'true',
            _RES_HEIGHT_: h,
            _RES_WIDTH_: w,
        };

        strRes = RESOLUTION[1].replace(
            /_RES_KAR_|_RES_WIDTH_|_RES_HEIGHT_/gi,
            match => {
                return mapObj[match];
            }
        );
    }

    Lib.TalkativeLog(`-§-compose resolution: ${strRes}`);
    return strRes;
}

/**
 * compose option webcam position
 *
 * @param {EasyScreenCastSettings} settings the extension's settings
 *
 * @returns {string}
 */
function _composeWebCamOption(settings) {
    Lib.TalkativeLog('-§-compose webcam option');

    // retrieve option webcam
    var webcamAlpha = settings.getOption('d', Settings.ALPHA_CHANNEL_WEBCAM_SETTING_KEY);
    var webcamMarginX = settings.getOption('i', Settings.MARGIN_X_WEBCAM_SETTING_KEY);
    var webcamMarginY = settings.getOption('i', Settings.MARGIN_Y_WEBCAM_SETTING_KEY);
    var webcamCornerPosition = settings.getOption('i', Settings.CORNER_POSITION_WEBCAM_SETTING_KEY);
    var [webcamWidth, webcamHeight, screenWidth, screenHeight] = _getWebCamDimension(settings);

    var posX = 0;
    var posY = 0;

    Lib.TalkativeLog(
        `-§-alpha=${webcamAlpha} |marX=${webcamMarginX} |marY=${webcamMarginY} |corner=${webcamCornerPosition}`
    );

    // corner top-left
    posX = webcamMarginX;
    posY = webcamMarginY;

    switch (webcamCornerPosition) {
    case 0:
        // corner bottom-right
        posX = Math.floor(screenWidth - (webcamWidth + webcamMarginX));
        posY = Math.floor(screenHeight - (webcamHeight + webcamMarginY));
        break;
    case 1:
        // corner bottom-left
        posX = webcamMarginX;
        posY = Math.floor(screenHeight - (webcamHeight + webcamMarginY));
        break;
    case 2:
        // corner top-right
        posX = Math.floor(screenWidth - (webcamWidth + webcamMarginX));
        posY = webcamMarginY;
        break;
    default:
    }

    // check valid position
    if ((posX < 0 || posX > screenWidth) && (posY < 0 || posY > screenHeight)) {
        Lib.TalkativeLog('-§-NOT valid position');
        posX = 0;
        posY = 0;
    }

    var tmpWCopt =
        `sink_0::alpha=1 sink_1::alpha=${
            webcamAlpha
        } sink_1::xpos=${
            posX
        } sink_1::ypos=${
            posY
        } `;

    Lib.TalkativeLog(`-§-posX=${posX} |posY=${posY}`);
    Lib.TalkativeLog(`-§-webcam option=${tmpWCopt}`);

    return tmpWCopt;
}

/**
 * retrieve dimension webcam
 *
 * @param {EasyScreenCastSettings} settings the extension's settings
 *
 * @returns {*[]} array with webcam width,height,screen-width,screen-height
 */
function _getWebCamDimension(settings) {
    Lib.TalkativeLog('-§-get webcam dimension');

    var webcamWidth = settings.getOption('i', Settings.WIDTH_WEBCAM_SETTING_KEY);
    var webcamHeight = settings.getOption('i', Settings.HEIGHT_WEBCAM_SETTING_KEY);
    var webcamUnit = settings.getOption('i', Settings.TYPE_UNIT_WEBCAM_SETTING_KEY);
    var screenWidth = settings.getOption('i', Settings.WIDTH_SETTING_KEY);
    var screenHeight = settings.getOption('i', Settings.HEIGHT_SETTING_KEY);

    if (settings.getOption('i', Settings.AREA_SCREEN_SETTING_KEY) === 0) {
        screenWidth = global.screen_width;
        screenHeight = global.screen_height;
    }

    Lib.TalkativeLog(
        `-§-WC w=${webcamWidth} WC h=${webcamHeight} WCtype=${webcamUnit} screen W=${screenWidth} screen H=${screenHeight}`
    );

    if (webcamUnit === 0) {
        webcamWidth = Math.floor((screenWidth * webcamWidth) / 100);
        webcamHeight = Math.floor((screenHeight * webcamHeight) / 100);
    }

    Lib.TalkativeLog(`-§-after percentage WCw=${webcamWidth} WCh=${webcamHeight}`);

    return [webcamWidth, webcamHeight, screenWidth, screenHeight];
}

/**
 * get description
 *
 * @param {int} quality selected quality
 * @param {int} container selected container format
 * @returns {string}
 */
export function getDescr(quality, container) {
    Lib.TalkativeLog(`-§-get description Q-> ${quality} C-> ${container}`);

    return CONTAINER[container].quality[quality].descr;
}

/**
 * get fps
 *
 * @param {int} quality selected quality
 * @param {int} container selected container format
 * @returns {number}
 */
export function getFps(quality, container) {
    Lib.TalkativeLog(`-§-get fps Q-> ${quality} C-> ${container}`);

    return CONTAINER[container].quality[quality].fps;
}

/**
 * get file extension
 *
 * @param {int} container selected container format
 * @returns {string}
 */
export function getFileExtension(container) {
    Lib.TalkativeLog(`-§-get file extension C-> ${container}`);

    return CONTAINER[container].fileExt;
}
