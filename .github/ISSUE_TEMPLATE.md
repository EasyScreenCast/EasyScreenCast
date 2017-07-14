<!--- Provide a general summary of the issue in the Title above -->

## Expected Behavior
<!--- If you're describing a bug, tell us what should happen -->
<!--- If you're suggesting a change/improvement, tell us how it should work -->

## Current Behavior
<!--- If describing a bug, tell us what happens instead of the expected behavior -->
<!--- If suggesting a change/improvement, explain the difference from current behavior -->

## Possible Solution
<!--- Not obligatory, but suggest a fix/reason for the bug, -->
<!--- or ideas how to implement the addition or change -->

## Steps to Reproduce (for bugs)
<!--- Provide a link to a live example, or an unambiguous set of steps to -->
<!--- reproduce this bug. Include code to reproduce, if relevant -->
1.
2.
3.
4.

## Logs
<!--- Providing logs helps us come up with a solution that is most useful in the real world -->
 * Use `journalctl /usr/bin/gnome-shell -f` to monitor Gnome shell activity. Maybe the crash will log something.
 * Log, **enable verbose debug logs** into options window, and after that try  
 `journalctl --since=today --no-pager | grep js`
 * webcam info:
 `v4l2-ctl --all`
 * webcam info:
 `for VIDEO_DEVICE in /dev/video* ; do echo ; echo ; echo $VIDEO_DEVICE ; echo ; v4l2-ctl --device=$VIDEO_DEVICE --list-inputs ; done`
 * webcam info:
 `GST_DEBUG=v4l2src:5 gst-launch-1.0 v4l2src num-buffers=1 ! fakesink | grep probed`

## Your Environment
<!--- Include as many relevant details about the environment you experienced the bug in -->
* Where did you download the extension?
 [ ] Gnome shell extension website
 [ ] From Git (Add commit tag)
* Gnome shell version:

* Operating System and version:

* Display server: Wayland / X11 / Other
