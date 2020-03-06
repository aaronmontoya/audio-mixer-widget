window.onload = function () {
	function detectIE() {
		var ua = window.navigator.userAgent;

		// Test values; Uncomment to check result …

		// IE 10
		// ua = 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0)';

		// IE 11
		// ua = 'Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko';

		// Edge 12 (Spartan)
		// ua = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.71 Safari/537.36 Edge/12.0';

		// Edge 13
		// ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2486.0 Safari/537.36 Edge/13.10586';

		var msie = ua.indexOf('MSIE ');
		if (msie > 0) {
			// IE 10 or older => return version number
			return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
		}

		var trident = ua.indexOf('Trident/');
		if (trident > 0) {
			// IE 11 => return version number
			var rv = ua.indexOf('rv:');
			return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
		}

		var edge = ua.indexOf('Edge/');
		if (edge > 0) {
			// Edge (IE 12+) => return version number
			return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
		}

		// other browser
		return false;
	}
	// Create if statement that checks the user agent
	// If Chrome or Firefox, load the widget
	// If IE, Safari or mobile, load the mixed down track in an <audio> element, instead
	var noShow = false;
	if (window.webkitAudioContext) {
		noShow = true;
	} else if (window.matchMedia('(pointer: coarse)').matches) {
		noShow = true;
	} else if (window.matchMedia('(hover:none)').matches) {
		noShow = true;
	} else if (window.matchMedia('(hover:on-demand)').matches) {
		noShow = true;
	} else {
		var isIE = detectIE();
		if (isIE) {
			noShow = true;
		}
	}

	if (noShow == true) {
		var duckMixer = document.getElementById('duck-mixer');
		duckMixer.classList.add('hide');
		var duckMixerAlt = document.getElementById('duck-mixer-alt');
		duckMixerAlt.classList.remove('hide');
		duckMixerAlt.classList.add('bg--gradient');
		var board = document.getElementsByClassName('duck-mixer--board--alt')[0];
		return
	} else {
		var board = document.getElementsByClassName('duck-mixer--board')[0];
	}

	// declare variables to be used across the scope of this function
	var a = 0;
	var adjustSliderFlag = true;
	var analyzer = new Array();
	var audioFiles = [
		'audio/drums.mp3',
		'audio/bass.mp3',
		'audio/guitar.mp3',
		'audio/lead-vox.mp3',
		'audio/horns.mp3',
		'audio/organ.mp3',
		'audio/bg-vox.mp3',
		'audio/harmonica.mp3'
	];
	var audioFilesNum = audioFiles.length;
	var audioFilePath = new Array();
	var audioFrequencyData = new Array();
	var btnSetSoloTrack = new Array();
	var curVolumePrev = 0.5;
	var cbxSetTracksMemory = new Array();
	var context = null;
	var decodedAudio = new Array();
	var gainNode = new Array();
	var initialBoardWidth = board.offsetWidth;
	var loopCount = 0;
	var muteAll = false;
	var numTracksDecoded = 0;
	var playState = 'stopped';
	var rawAudioData = new ArrayBuffer();
	var rawAudioDataArray = new Array(audioFilesNum);
	var request = new Array();
	var resumePlayTime = 0;
	var sldVolumeTracks = new Array();
	var soloTrackFlag = new Array();
	var source = null;
	var sourceArray = new Array();
	var svgElement = document.getElementsByClassName('visualization')[0];
	var svgElementChildren = document.getElementsByClassName('visualization')[0].children;
	var svgElementChildrenNum = svgElementChildren.length;
	var statusDisplay = document.getElementsByClassName('viz-and-credits initial')[0];
	var statusDisplayText = svgElementChildren[svgElementChildrenNum - 1];
	var stylesheet = document.styleSheets[0];
	var contStatusDisplayText = svgElementChildren[svgElementChildrenNum - 2];
	var trackBuffer = new Array();
	var trackDuration = new Array(audioFilesNum);
	var trackNames = [
		'drums',
		'bass-guitar',
		'guitar',
		'vocals',
		'horns',
		'organ',
		'bg-vocals',
		'harmonica'
	];
	// Assign var trackNum to the number of tracks to load
	var trackNum = audioFiles.length;
	var elapsedPlayTime = 0;
	var trackVolumeMemory = new Array(audioFilesNum);
	var unplayed = true;
	var iosUserActivated = false;
	var visualData = new Array();


	// Set initial value of flags to indicate which tracks are playing solo to false
	// Also set intial value of trackVolumeMemory to 50%
	for (i = 0; i < audioFilesNum; i++) {
		soloTrackFlag[i] = false;
		trackVolumeMemory[i] = 0.5;
	}

	// Construct the audio context within which we can play files and create sounds
	// Prefixing for webkit and blink browsers
	var context = new (window.AudioContext || window.webkitAudioContext);

	if (!context) {
		var context = false;
	}

	// Declare variables to represent actionable interface elements, like buttons, sliders, checkboxes and labels
	var btnPlay = document.querySelector('div#duck-mixer button.play');
	var btnStop = document.querySelector('div#duck-mixer button.stop');
	var btnMuteAll = document.querySelector('div#duck-mixer button.mute-all');
	var lblSetTracks = document.querySelectorAll('div#duck-mixer ul.choose--track label.btnTrack');
	var cbxSetTracks = document.querySelectorAll('div#duck-mixer ul.choose--track input[type=checkbox]');
	var sldVolumeMaster = document.querySelector('div#duck-mixer div.controls--track--mobile-master input[type=range]#duck-mixer--volume--master');
	var btnSoloTrackMaster = document.querySelector('div#duck-mixer div.controls--track--mobile-master button.solo');
	var btnSetSoloTrack = document.querySelectorAll('div#duck-mixer div.controls--track--master ul.choose--track button.solo');

	for (i = 0; i < trackNum; i++) {
		sldVolumeTracks[i] = document.querySelector('input#duck-mixer--volume--track--' + trackNames[i]);
	}

	btnPlay.removeAttribute('disabled');
	btnPlay.addEventListener('click', function () {
		if (unplayed) {
			// Run initializing function that sets everything up
			init();
		}
	});

	injectStyle = function (rulesString) {
		numRules = stylesheet.cssRules.length;
		success = stylesheet.insertRule(rulesString, numRules);
	}

	var boardWidthOG = 292;

	function updateClipPath(width) {
		var sizeChange = boardWidthOG - width;
		sizeChange *= -1;
		var sizeChangePerSide = Math.round(sizeChange / 2);
		sizeChangePerSide++;
		var newClipPathStyleString = null;
		if (width <= 995) {
			var newClipPathStyleString = 'calc(50% - 9rem - ' + sizeChangePerSide + 'px) calc(4.1rem + 5px), calc(50% - 8.7rem - ' + sizeChangePerSide + 'px) calc(3.74rem + 3px), calc(50% - 8.21rem - ' + sizeChangePerSide + 'px) calc(3.52rem + 2.5px), calc(50% + 8.21rem + ' + sizeChangePerSide + 'px) calc(3.52rem + 2.5px), calc(50% + 8.7rem + ' + sizeChangePerSide + 'px) calc(3.74rem + 3px), calc(50% + 9rem + ' + sizeChangePerSide + 'px) calc(4.1rem + 5px), calc(50% + 9rem + ' + sizeChangePerSide + 'px) calc(100% - 4.2rem - 3px), calc(50% + 8.7rem + ' + sizeChangePerSide + 'px) calc(100% - 3.8rem - 2.5px), calc(50% + 8.21rem + ' + sizeChangePerSide + 'px) calc(100% - 3.6rem - 1px), calc(50% - 8.21rem - ' + sizeChangePerSide + 'px) calc(100% - 3.6rem - 1px), calc(50% - 8.7rem - ' + sizeChangePerSide + 'px) calc(100% - 3.8rem - 2.5px), calc(50% - 9rem - ' + sizeChangePerSide + 'px) calc(100% - 4.2rem - 3px)';
		} else if (width > 995 && width < 1202) {
			var newClipPathStyleString = 'calc(50% - 9rem - ' + sizeChangePerSide + 'px) calc(5rem + 5px), calc(50% - 8.7rem - ' + sizeChangePerSide + 'px) calc(4.64rem + 3px), calc(50% - 8.21rem - ' + sizeChangePerSide + 'px) calc(4.42rem + 2.5px), calc(50% + 8.21rem + ' + sizeChangePerSide + 'px) calc(4.42rem + 2.5px), calc(50% + 8.7rem + ' + sizeChangePerSide + 'px) calc(4.64rem + 3px), calc(50% + 9rem + ' + sizeChangePerSide + 'px) calc(5rem + 5px), calc(50% + 9rem + ' + sizeChangePerSide + 'px) calc(100% - 5.1rem - 3px), calc(50% + 8.7rem + ' + sizeChangePerSide + 'px) calc(100% - 4.7rem - 2.5px), calc(50% + 8.21rem + ' + sizeChangePerSide + 'px) calc(100% - 4.5rem - 1px), calc(50% - 8.21rem - ' + sizeChangePerSide + 'px) calc(100% - 4.5rem - 1px), calc(50% - 8.7rem - ' + sizeChangePerSide + 'px) calc(100% - 4.7rem - 2.5px), calc(50% - 9rem - ' + sizeChangePerSide + 'px) calc(100% - 5.1rem - 3px)';
		} else {
			var newClipPathStyleString = 'calc(50% - 9rem - ' + sizeChangePerSide + 'px) calc(5.9rem + 5px), calc(50% - 8.7rem - ' + sizeChangePerSide + 'px) calc(5.54rem + 3px), calc(50% - 8.21rem - ' + sizeChangePerSide + 'px) calc(5.32rem + 2.5px), calc(50% + 8.21rem + ' + sizeChangePerSide + 'px) calc(5.32rem + 2.5px), calc(50% + 8.7rem + ' + sizeChangePerSide + 'px) calc(5.54rem + 3px), calc(50% + 9rem + ' + sizeChangePerSide + 'px) calc(5.9rem + 5px), calc(50% + 9rem + ' + sizeChangePerSide + 'px) calc(100% - 6rem - 3px), calc(50% + 8.7rem + ' + sizeChangePerSide + 'px) calc(100% - 5.6rem - 2.5px), calc(50% + 8.21rem + ' + sizeChangePerSide + 'px) calc(100% - 5.4rem - 1px), calc(50% - 8.21rem - ' + sizeChangePerSide + 'px) calc(100% - 5.4rem - 1px), calc(50% - 8.7rem - ' + sizeChangePerSide + 'px) calc(100% - 5.6rem - 2.5px), calc(50% - 9rem - ' + sizeChangePerSide + 'px) calc(100% - 6rem - 3px)';
		}
		var newClipPathStyleRule = 'div#duck-mixer::before {-webkit-clip-path: polygon(' + newClipPathStyleString + '); clip-path: polygon(' + newClipPathStyleString + ');}';
		injectStyle(newClipPathStyleRule);
	}

	function resizeCheck() {
		boardWidth = board.offsetWidth;
		// Send the updateClipPath function the boardWidth variable to operate on via a
		// function that limits the amount of animation requests made to the browser, which
		// reduces the amount of work it is doing at any given period and makes the entire
		// page more performant.
		if (boardWidth < 1300) {
			updateClipPath(boardWidth);
		}
	}

	window.addEventListener('resize', function () {
		resizeCheck();
	});

	function initGUI() {
		// Tell buttons what to do when it is the target of an action
		btnPlay.addEventListener('click', btnPlayAction);
		btnStop.addEventListener('click', function () {
			controlAudioPlayback('stop');
			btnPlay.classList.remove('active');
			btnPlay.innerHTML = 'Play';
		});
		btnMuteAll.addEventListener('click', function () {
			muteTrack();
		});

		for (u = 0; u < cbxSetTracks.length; u++) {
			function initCbxSetTracksListeners(index) {
				cbxSetTracks[index].addEventListener('click', function () {
					muteTrack(index);

					for (i = 0; i < cbxSetTracks.length; i++) {
						updateSvgElementChildren(i);
					}
				});
			}
			initCbxSetTracksListeners(u);
		}

		for (u = 0; u < lblSetTracks.length; u++) {
			initTrackLoadedListeners = function (c) {
				request[c].addEventListener('loadend', function () {
					trackLoaded(c);
				});
			}
			initTrackLoadedListeners(u);
		}

		sldVolumeMaster.addEventListener('change', function () {
			for (i = 0; i < gainNode.length; i++) {
				if (gainNode[i].gain.value !== 0) {
					curVol = sldVolumeMaster.value * .01;
					if (curVol < 0.01 && curVol !== 0) {
						curVol = 0.01;
					}
					controlVolume(curVol, i);
				}
				updateTrackVolumeDisplay(i);
			}
		});
		btnSoloTrackMaster.addEventListener('mousedown', function () {
			e = document.activeElement;
			id = e.id;
			if (e.type == "checkbox") {
				e = e.parentElement.parentElement;
				t = indexElement(e);
				soloTrack(t);
				// return focus to element so another press of the button unsolos the track
				setTimeout(function () { document.getElementById(id).focus(); }, 100);
			}
		});
		function initSldVolumeTracksListeners(a) {
			sldVolumeTracks[a].addEventListener('change', function () {
				sendVol = sldVolumeTracks[a].value * 0.01;
				if (gainNode[a].gain.value == 0) {
					trackVolumeMemory[a] = sendVol;
					updateTrackVolumeDisplay(a);
				} else {
					controlVolume(sendVol, a);
				}
			});
		}
		for (i = 0; i < sldVolumeTracks.length; i++) {
			initSldVolumeTracksListeners(i);
		}
		function initBtnSetSoloTrack(a) {
			btnSetSoloTrack[a].addEventListener('click', function () {
				soloTrack(a);
			});
		}
		for (i = 0; i < btnSetSoloTrack.length; i++) {
			initBtnSetSoloTrack(i);
		}
	}

	updateClipPath(initialBoardWidth);

	// Judiciously send animation requests to the browser so as not to overload the user's machine.
	// This function wraps a function passed to it via variable f with arguments a (which are optional)
	// and executes it one at a time. The running variable is essentially the throttle; when it is set to true,
	// the function will exit before requesting another animation frame.
	function throttleAnimationRequests(f, a) {
		if (!running) {
			running = true;
			if (window.requestAnimationFrame) {
				window.requestAnimationFrame(function () {
					if (!a) {
						// run the passed function without arguments
						f();
					} else {
						// run the passed function with arguments
						var passedFunction = f + '(' + a + ')';
						passedFunction(a);
					}
				});
			} else {
				setTimeout(f, 66);
			}
		} else {
			var running = false;
		}
	}

	function indexElement(el) {
		if (!el) return -1;
		var pb = 0;
		do {
			if (el.nodeName == "LI") {
				pb++;
			}
		} while (el = el.previousSibling);
		return pb - 1;
	}

	function updateSvgElementChildren(r, ht) {
		var directVolume = gainNode[r].gain.value;

		if (r < 8) {
			if (directVolume == 0) {
				svgElementChildren[r].setAttribute('stroke', 'black');
				svgElementChildren[r].setAttribute('opacity', '0.18');
			} else {
				svgElementChildren[r].setAttribute('stroke', 'rgba(254, 225, 35, 1)');
				svgElementChildren[r].setAttribute('opacity', '1');
			}
		} else {
			return;
		}
		// Adjust the height of the tracks, if a height argument is provided
		// Otherwise, stop.
		if (!ht) {
			return;
		}
		var newHeight = Math.round(ht * 0.1);
		if (newHeight < 3) {
			newHeight = 3;
		} else if (newHeight > 99) {
			newHeight = 99;
		}
		newHeight = 100 - newHeight + '%';
		svgElementChildren[r].setAttribute('y2', newHeight);
	}

	function renderFrame() {
		// only continue looping the function that gathers the audio data while audio is playing
		if (playState == "playing") {
			throttleAnimationRequests(renderFrame);
			if (statusDisplayText.textContent !== 'Playing') {
				statusDisplayText.textContent = 'Playing';
			}
		}

		// render audio data into an array of values
		analyzer.getByteFrequencyData(audioFrequencyData);

		var interval = Math.round(audioFrequencyData.length / 14);
		var dataStream = new Array();

		// store audio data to route to the visual elements on the page
		for (i = 0; i < audioFrequencyData.length; i++) {
			if (i < interval) {
				if (!dataStream[0]) {
					dataStream[0] = 0;
				}
				var dataStreamStartNum = dataStream[0];
				dataStream[0] = dataStreamStartNum + audioFrequencyData[i];
			} else if (i < interval * 2) {
				if (!dataStream[1]) {
					dataStream[1] = 0;
				}
				var dataStreamStartNum = dataStream[1];
				dataStream[1] = dataStreamStartNum + audioFrequencyData[i];
			} else if (i < interval * 3) {
				if (!dataStream[2]) {
					dataStream[2] = 0;
				}
				var dataStreamStartNum = dataStream[2];
				dataStream[2] = dataStreamStartNum + audioFrequencyData[i];
			} else if (i < interval * 4) {
				if (!dataStream[3]) {
					dataStream[3] = 0;
				}
				var dataStreamStartNum = dataStream[3];
				dataStream[3] = dataStreamStartNum + audioFrequencyData[i];
			} else if (i < interval * 5) {
				if (!dataStream[4]) {
					dataStream[4] = 0;
				}
				var dataStreamStartNum = dataStream[4];
				dataStream[4] = dataStreamStartNum + audioFrequencyData[i];
			} else if (i < interval * 6) {
				if (!dataStream[5]) {
					dataStream[5] = 0;
				}
				var dataStreamStartNum = dataStream[5];
				dataStream[5] = dataStreamStartNum + audioFrequencyData[i];
			} else if (i < interval * 7) {
				if (!dataStream[6]) {
					dataStream[6] = 0;
				}
				var dataStreamStartNum = dataStream[6];
				dataStream[6] = dataStreamStartNum + audioFrequencyData[i];
			} else if (i < interval * 8) {
				if (!dataStream[7]) {
					dataStream[7] = 0;
				}
				var dataStreamStartNum = dataStream[7];
				dataStream[7] = dataStreamStartNum + audioFrequencyData[i];
			}
		}

		var visualData = new Array();

		for (i = 0; i < dataStream.length; i++) {
			updateSvgElementChildren(i, dataStream[i]);
			visualData[i] = dataStream[i];
			dataStream[i] = 0;
		}
	}

	visualizeAudio = function () {
		audioOutput = context.createGain();

		var connectThemAll;
		for (i = 0; i < sourceArray.length; i++) {
			connectThemAll = sourceArray[i].connect(audioOutput);
		}

		analyzer = context.createAnalyser();
		analyzer.fftSize = 64;

		// Connect the unified audio source to the analyzer
		audioOutput.connect(analyzer);

		var frequencyBinCount = analyzer.frequencyBinCount;

		// frequencyBinCount tells you how many values you'll receive from the analyser
		audioFrequencyData = new Uint8Array(frequencyBinCount);

		renderFrame();
	}

	function getTrackVolume(track) {
		trackIsMute = null;
		if (!track && track !== 0) {
			return false;
		}

		if (track >= 0 && track < trackNum) {
			curVolume = gainNode[track].gain.value;
			if (curVolume == 0) {
				trackIsMute = true;
			} else {
				trackIsMute = false;
			}
		} else {
			curVolume = 0.5;
		}

		return curVolume;
	}

	// Adjust individual track volume.
	// If the last argument is not passed, adjust volume of all tracks
	controlVolume = function (newVolume, track) {
		curVolume = getTrackVolume(track);

		if (!track && track !== 0) {
			for (i = 0; i < audioFilesNum; i++) {
				if (curVolume !== 0) {
					setTrackVolume(i, newVolume);
				}
			}
		} else {
			setTrackVolume(track, newVolume);
		}
	}

	setTrackVolume = function (track, vol) {
		if (vol !== 0) {
			trackVolumeMemory[track] = gainNode[track].gain.value = vol;
		} else {
			gainNode[track].gain.value = vol;
		}

		updateTrackVolumeDisplay(track);
	}

	updateTrackVolumeDisplay = function (track) {
		// Set the volume of the current track if it isn't already.
		// If a volume already exists in memory, display it, and if not get it.
		if (trackVolumeMemory[track] >= 0) {
			curVolume = trackVolumeMemory[track];
		} else {
			curVolume = getTrackVolume(track);
		}

		// Never display volume as 100; display 99, instead.
		if (curVolume == 1) {
			curVolume = 0.99;
		}
		var curVolumeDisplay = Math.round(curVolume * 100);

		// Increment the track number for use in the injected CSS rules, which target
		// psuedo elements attached to the items of an unordered list on the page.
		track++;
		injectStyle('div#duck-mixer ul.choose--track li:nth-of-type(' + track + ') > label::before{ content: \'' + curVolumeDisplay + '\'; }');

		if (curVolume !== curVolumePrev) {
			adjustSliderFlag = false;
		}
	}

	muteTrack = function (track) {
		// If no argument passed, toggle mute of all tracks.
		if (!track && track !== 0) {
			var muteCheck = null;

			if (muteAll) {
				for (i = 0; i < audioFilesNum; i++) {
					// Restore tracks to volume levels in memory.
					// If, for some reason, the levels aren't in memory, yet, store
					// the current levels there.
					if (!trackVolumeMemory[i]) {
						trackVolumeMemory[i] = getTrackVolume(i);
					}
					setTrackVolume(i, trackVolumeMemory[i]);

					cbxSetTracks[i].checked = true;

					// No track is in solo mode
					soloTrackFlag[i] = false;
				}

				muteAll = false;
			} else {
				for (i = 0; i < audioFilesNum; i++) {
					curVolume = getTrackVolume(i);
					if (curVolume !== 0) {
						trackVolumeMemory[i] = curVolume;
						soloTrackFlag[i] = true;
					} else {
						soloTrackFlag[i] = false;
					}
					controlVolume(0, i);
					cbxSetTracks[i].checked = false;
					btnSetSoloTrack[i].classList.remove('active');
				}
				muteAll = true;
			}
			for (i = 0; i < gainNode.length; i++) {
				muteCheck += getTrackVolume(i);
			}
			if (muteCheck == 0) {
				btnMuteAll.innerHTML = 'Unmute All';
				btnMuteAll.classList.add('active');
			} else {
				btnMuteAll.innerHTML = 'Mute All';
				btnMuteAll.classList.remove('active');
			}
			for (i = 0; i < lblSetTracks.length; i++) {
				updateSvgElementChildren(i);
			}
		} else {
			curVolume = getTrackVolume(track);

			if (curVolume == 0) {
				if (trackVolumeMemory[track]) {
					controlVolume(trackVolumeMemory[track], track);
				} else {
					controlVolume(0.5, track);
				}
				muteAll = false;

				btnMuteAll.classList.remove('active');
				btnMuteAll.innerHTML = 'Mute All';

				var numMutedTracks = 0;
				for (i = 0; i < audioFilesNum; i++) {
					if (gainNode[i].gain.value == 0) {
						numMutedTracks++;
					}
				}
				for (i = 0; i < btnSetSoloTrack.length; i++) {
					soloTrackFlag[i] = false;
					btnSetSoloTrack[i].classList.remove('active');
				}
				if (numMutedTracks == trackNum - 1) {
					btnSetSoloTrack[track].classList.add('active');
					soloTrackFlag[track] = true;
				}
			} else {
				trackVolumeMemory[track] = curVolume;
				controlVolume(0, track);
				var numMutedTracks = 0;
				for (i = 0; i < audioFilesNum; i++) {
					if (gainNode[i].gain.value == 0) {
						numMutedTracks++;
						soloTrackFlag[i] = false;
					} else {
						soloTrackFlag[i] = true;
					}
				}
				if (numMutedTracks == audioFilesNum) {
					muteAll = true;
					for (i = 0; i < btnSetSoloTrack.length; i++) {
						btnSetSoloTrack[i].classList.remove('active');
						soloTrackFlag[i] = false;
					}
				} else if (numMutedTracks == audioFilesNum - 1) {
					for (i = 0; i < btnSetSoloTrack.length; i++) {
						if (soloTrackFlag[i] == true) {
							btnSetSoloTrack[i].classList.add('active');
						}
					}
				} else {
					muteAll = false;
					for (i = 0; i < btnSetSoloTrack.length; i++) {
						btnSetSoloTrack[i].classList.remove('active');
					}
				}
			}
		}
	}

	// Mute all tracks except the one specified by the passed argument.
	soloTrack = function (track) {
		var curVolume = gainNode[track].gain.value;

		if (soloTrackFlag[track] == true && gainNode[track].gain.value !== 0) {
			for (i = 0; i < audioFilesNum; i++) {
				if (trackVolumeMemory[i]) {
					gainNode[i].gain.value = trackVolumeMemory[i];
				} else {
					gainNode[i].gain.value = 0.5;
				}
			}
			soloTrackFlag[track] = false;
			btnSetSoloTrack[track].classList.remove('active');
		} else {
			btnSetSoloTrack[track].classList.add('active');
			for (i = 0; i < audioFilesNum; i++) {
				if (track !== i) {
					gainNode[i].gain.value = 0;
					soloTrackFlag[i] = false;
					muteAll = false;
					btnSetSoloTrack[i].classList.remove('active');
				} else if (!track && track !== 0) {
					// console.log('no track argument passed; did nothing.');
				} else {
					if (trackVolumeMemory[track]) {
						gainNode[i].gain.value = trackVolumeMemory[track];
					} else {
						gainNode[track].gain.value = 1;
						trackVolumeMemory[track] = gainNode[i].gain.value;
					}
					soloTrackFlag[i] = true;
					muteAll = false;
				}
				updateTrackVolumeDisplay(i);
			}
		}

		for (i = 0; i < gainNode.length; i++) {
			curVolume = gainNode[i].gain.value;
			if (curVolume == 0) {
				cbxSetTracks[i].checked = false;
			} else {
				cbxSetTracks[i].checked = true;
			}
		}
	}

	// Create the necessary constructs to enable audio playback in the browser
	// Expose a function to allow a user to control playback—play, pause, resume and stop
	controlAudioPlayback = function (c, t) {
		if (context) {
			if (c == 'play') {
				// if an audio track already exists and is paused, stop it and disconnect it from the context in preparation
				// for creating a new source to which we can connect the context
				if (playState != 'playing') {
					if (playState == 'paused') {
						beginPlayTime = context.currentTime;
					} else if (playState == 'stopped') {
						beginPlayTime = context.currentTime;
					}

					// In the case that the individual track durations don't match each other, choose the longest duration as the loop duration value
					loopDuration = Math.max.apply(null, trackDuration);

					// Play the track from either the beginning or at the point the user last paused the track
					function play() {
						// set playhead variable to either the last point the user paused the track or the beginning,
						// depending on the state of the track
						if (playState == 'paused') {
							if (elapsedPlayTime < loopDuration) {
								resumePlayTime = elapsedPlayTime;
							} else {
								currentLoopElapsedTime = elapsedPlayTime % loopDuration;
								loopCount = Math.floor(elapsedPlayTime / loopDuration);
								resumePlayTime = elapsedPlayTime - loopDuration;
							}
						} else if (playState == 'stopped') {
							resumePlayTime = 0;
							elapsedPlayTime = 0;
						}

						readyTracksForPlay();
						for (i = 0; i < audioFilesNum; i++) {
							sourceArray[i].start(0, resumePlayTime);

							if (cbxSetTracksMemory[i] == false) {
								cbxSetTracks[i].checked = false;
							}
						}

						playState = 'playing';
						unplayed = false;

						// Update status text so user know's what's happening
						statusDisplay.classList.add('playing');
						statusDisplay.classList.remove('loading');
						statusDisplay.classList.remove('paused');
						statusDisplay.classList.remove('stopped');
						statusDisplayText.textContent = 'Playing';
						visualizeAudio();
					}

					play();
				}
			} else if (c == 'pause') {
				// Note the time during the context when the user paused the track
				if (playState == 'playing') {
					// The time with regard to the audio context at which the user paused the track
					pauseTime = context.currentTime;

					// Calculate the time the track played for up to the point of the user pausing the track
					elapsedPlayTimeOld = elapsedPlayTime;
					elapsedPlayTimeNew = pauseTime - beginPlayTime;
					elapsedPlayTime = elapsedPlayTimeNew + elapsedPlayTimeOld;

					// stop playing each track
					for (i = 0; i < audioFilesNum; i++) {
						sourceArray[i].stop();
					}
					playState = 'paused';

					// Update status text displayed at the top of widget board so user know's what's happening
					statusDisplay.classList.add('paused');
					statusDisplay.classList.remove('playing');
					statusDisplayText.textContent = 'Paused';
				}
			} else if (c == 'stop') {
				// If the user played the track already during the session, stop the track when the user requests to stop.
				// Otherwise, do not send the stop method to the AudioBufferSource, becuase it will throw an error as it,
				// did not start yet. How can you stop something that hasn't started, right?
				if (!unplayed) {
					for (i = 0; i < audioFilesNum; i++) {
						sourceArray[i].stop();
					}
				}

				// Set the playState variable to accurately reflect the current state
				playState = 'stopped';

				// Update status text displayed at the top of widget board so user know's what's happening
				statusDisplay.classList.add('stopped');
				statusDisplay.classList.remove('playing');
				statusDisplay.classList.remove('paused');
				statusDisplayText.textContent = 'Stopped';

				// Reset variables related to track timing; as the user chose to stop the track rather than pause it, therefore
				// the values held in them previously are no longer applicable.
				elapsedPlayTimeNew = 0;
				elapsedPlayTimeOld = 0;
				elapsedPlayTime = 0;
				beginPlayTime = 0
				pauseTime = 0;
			} else {
				playState = null;
			}
		} else {
			alert("Web Audio API not detected. Please try a different, newer browser.");
		}
	}

	function btnPlayAction() {
		if (playState == "stopped" || playState == "paused") {
			// Play the audio
			controlAudioPlayback('play');

			// Change button in response to audio playing
			btnPlay.classList.add('active');
			btnPlay.innerHTML = 'Pause';
		} else if (playState == "playing") {
			// Pause the audio
			controlAudioPlayback('pause');

			// Change button in response to audio being paused
			btnPlay.classList.remove('active');
			btnPlay.innerHTML = 'Play';
		}
	}

	function readyTracksForPlay() {
		for (i = 0; i < audioFilesNum; i++) {
			if (sourceArray[i]) {
				// disconnect old audio node from context
				sourceArray[i].disconnect();
				sourceArray[i] = null;
			}
			// create the AudioSourceNode
			sourceArray[i] = context.createBufferSource();
			decodedAudio[i] = sourceArray[i].buffer = trackBuffer[i];

			// Make the track loop
			sourceArray[i].loop = true;

			// Note the duration of each track and keep it in a separate array
			trackDuration[i] = decodedAudio[i].duration;

			// Connect each buffer to its own gainNode to control volume of each track individually.
			if (!gainNode[i]) {
				gainNode[i] = context.createGain();
				// Set default volume to 0.5 and store it for use in updating the interface
				curVolumePrev = curVolume = gainNode[i].gain.value = 0.5;
			}

			// Connect the buffer to the gain node
			gainConnectReport = sourceArray[i].connect(gainNode[i]);

			// Connect the buffer to the destination property of the AudioContext, which is represented by var context
			connectReport = gainNode[i].connect(context.destination);
		}

		for (i = 0; i < trackNum; i++) {
			curVolume = gainNode[i].gain.value;

			// If it's mute, make sure the checkbox is unchecked.
			// Otherwise, check the box and set the volume of the track
			// to the value stored in memory, or the default of 0.5
			if (curVolume == 0) {
				cbxSetTracks[i].checked = false;
			} else {
				cbxSetTracks[i].checked = true;

				var volInMem = trackVolumeMemory[i];

				if (!volInMem && volInMem !== 0) {
					volInMem = 0.5;
				}
				// Set volume of all tracks to what was in memory
				controlVolume(volInMem, i);
			}
		}

		if (unplayed) {
			// Enable input elements
			btnStop.removeAttribute('disabled');
			btnMuteAll.removeAttribute('disabled');
			btnSoloTrackMaster.removeAttribute('disabled');
			sldVolumeMaster.removeAttribute('disabled');
			for (i = 0; i < lblSetTracks.length; i++) {
				lblSetTracks[i].removeAttribute('disabled');
				cbxSetTracks[i].removeAttribute('disabled');
				btnSetSoloTrack[i].removeAttribute('disabled');
				sldVolumeTracks[i].removeAttribute('disabled');
			}
			// Change button in response to audio playing
			btnPlay.classList.add('active');
			btnPlay.innerHTML = 'Pause';
		}
	}

	function decodeAudio(data, number) {
		context.decodeAudioData(data, function (buffer) {
			// store the buffer data into var trackBuffer, which is to be referenced multiple times during runtime to plug into new buffer source nodes
			// Decode the raw audio and store it in a variable that can now be referenced for playback
			trackBuffer[number] = buffer;
			numTracksDecoded++;

			if (numTracksDecoded == audioFilesNum) {
				readyTracksForPlay();
				statusDisplayText.textContent = 'Stopped';
				statusDisplayText.setAttribute('fill', 'white');
				contStatusDisplayText.setAttribute('fill', 'rgba(0,0,0,0.18)');
				if (unplayed) {
					controlAudioPlayback('play');
				}
			}
		});
	}

	function trackLoaded(a) {
		// Store the response to the request
		rawAudioData[a] = request[a].response;

		// Send the track data to be decoded
		decodeAudio(rawAudioData[a], a);
	}

	// load an audio file and decode the binary data into a buffer format the browser can work with
	// return the buffer to be played
	function loadAudio(p) {
		for (i = 0; i < audioFilesNum; i++) {
			requestArray[i] = new XMLHttpRequest();
			request[i] = requestArray[i];
			audioFilePath[i] = p[i];

			// Open the file specified by variable audioFile
			request[i].open('GET', audioFilePath[i], true);

			// Set type of response to a format suitable for storage in memory and quick playback
			request[i].responseType = 'arraybuffer';

			// Send the request for the audio file
			request[i].send('');
		}

		// Initalize the graphical user interface; make the buttons clickable and connected to the functions in this script.
		initGUI();
	}

	// Initialize the widget with this function
	function init() {
		// If the audio context was established, call the function that loads the files
		if (context) {
			// Create an array to hold all the file requests
			requestArray = new Array(trackNum);

			// Update status text so user know's what's happening
			statusDisplay.classList.add('loading');
			statusDisplay.classList.remove('initial');
			statusDisplayText.textContent = 'Loading';

			// Call the function that loads the files
			loadAudio(audioFiles);
		} else {
			alert("Web Audio API not detected. Please try a different, newer browser.");
		}
	}
}