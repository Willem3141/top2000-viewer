$(function () {
	var startTime = 0;
	var stopTime = 0;

	var socket = io();

	var currentId = -1;

	socket.on('new song', function(msg) {
		if (msg.currentSong.id !== currentId) {
			$('#huge-id').html(msg.currentSong.id);

			$('#main-view').addClass("id-flash");

			setTimeout(function() {
				$('#main-view').removeClass("id-flash");
			}, 3000);
		}
		$('#main-view').removeClass('notification-shown');

		setTimeout(function() {
			$('#current-song-artist').html(msg.currentSong.artist);
			$('#current-song-title').html(addNonBoldSpan(msg.currentSong.title));
			$('#current-song-votes').html(createVotesText(msg.currentSong));
			$('#top2000-id').html(msg.currentSong.id);

			$('#current-song-year').html(msg.currentSong.year);

			var difference = msg.currentSong.previous - msg.currentSong.id;
			if (msg.currentSong.previous === 0) {
				$('#current-song-difference').html('&#9899;');

			} else if (difference > 0) {
				$('#current-song-difference').html("&#9652; " + difference);

			} else if (difference < 0) {
				$('#current-song-difference').html("&#9662; " + (-difference));

			} else {
				$('#current-song-difference').html("&#8226; 0");
			}

			startTime = msg.currentSong.startTime;
			stopTime = msg.currentSong.stopTime;

			if (msg.previousSong) {
				$('#previous-song-artist').html(msg.previousSong.artist);
				$('#previous-song-title').html(addNonBoldSpan(msg.previousSong.title));
				$('#previous-song-votes').html(createVotesText(msg.previousSong));
				$('#previous-id').html(msg.previousSong.id);
			} else {
				$('#previous-song-artist').html('');
				$('#previous-song-title').html('');
				$('#previous-id').html('');
			}

			if (msg.nextSong) {
				$('#next-song-artist').html(msg.nextSong.artist);
				$('#next-song-title').html(addNonBoldSpan(msg.nextSong.title));
				$('#next-song-votes').html(createVotesText(msg.nextSong));
				$('#next-id').html(msg.nextSong.id);
			} else {
				$('#next-song-artist').html('');
				$('#next-song-title').html('');
				$('#next-id').html('');
			}
			if (msg.currentSong.id !== currentId) {
				currentId = msg.currentSong.id;
				$('#main-view').addClass("song-detail");
			}
			if (msg.currentSong.startTime && msg.currentSong.stopTime) {
				updateProgressBar();
				$('#progress-bar').css('opacity', 1);
			} else {
				$('#progress-bar').css('opacity', 0);
			}
		}, 1000);

		if (msg.currentSong.id !== currentId) {
			setTimeout(function() {
				$('#main-view').removeClass("song-detail");
			}, 10000);
		}
	});
	setInterval(updateProgressBar, 0.5);

	socket.on('error', function(message) {
		$('#main-view').addClass('notification-shown');
		$('#notification').html("De verbinding is verbroken ...<br><span class='notification-message'>" + message + "</span>");
	});

	function createVotesText(song) {
		if (!song.voters) {
			return '';
		}
		var votesHtml = '';
		for (var i = 0; i < song.voters.length; i++) {
			votesHtml += '<div class="vote-badge">' + song.voters[i] + '</div>';
		}
		return votesHtml;
	}

	function updateProgressBar() {
		var fraction = 100 * (new Date().getTime() - startTime) / (stopTime - startTime);
		if (fraction > 100) {
			fraction = 100;
			$('#progress-bar').css('opacity', 0);
		}
		$('#progress-bar-fill').css('width', fraction + '%');
		$('#progress-bar-knob').css('left', fraction + '%');
	}

	socket.on('hour overview', function(msg) {
		$('#hour-overview').addClass('visible');
		$('#hour-overview-header').html('<b>' + msg.date + ' december ' + msg.hour + ':00 &nbsp;&nbsp;&nbsp;&nbsp; uur ' + msg.hourCount + '/160</b><br>' + msg.presenter);
		$('#hour-overview-body').html('');
		for (var i = 0; i < msg.songs.length; i++) {
			var s = msg.songs[i];
			var difference = msg.songs[i].previous - msg.songs[i].id;
			if (msg.songs[i].previous === 0) {
				var diffString = '<div class="hour-overview-diff new">&#9899;</div>';
			} else if (difference > 0) {
				var diffString = '<div class="hour-overview-diff climbs">' + difference + '</div>';
			} else if (difference < 0) {
				var diffString = '<div class="hour-overview-diff descends">' + -difference + '</div>';
			} else {
				var diffString = '<div class="hour-overview-diff equal">=</div>';
			}
			let votesString = '';
			for (let i = 0; i < s['voters'].length; i++) {
				votesString += ' <div class="vote-badge">' + s['voters'][i] + '</div>';
			}
			$('#hour-overview-body').append('<div class="hour-overview-song"><div class="hour-overview-id">' + s.id + '</div>'+ diffString + '<div class="hour-overview-title"><b>' + addNonBoldSpan(s.title) + '</b>' + votesString + '<br><span class="non-bold">' + s.artist + '</span></div></div>');
		}
		// 2 minutes and 2 seconds (to allow the ID flash of the next song to be shown)
		setTimeout(function() {
			$('#hour-overview').removeClass('visible');
			clearTimeout(nextScrollTimer);
		}, 122000);

		startHourOverviewScroll();
	});

	setInterval(updateClock, 1000);

	function updateClock() {
		let date = new Date();
		// show clock only on 31 December or 1 Jan
		if (!((date.getMonth() === 11 && date.getDate() === 31 && date.getHours() >= 12) ||
			(date.getMonth() === 0 && date.getDate() === 1 && date.getHours() === 0 && date.getMinutes() < 15))) {
			$('#clock').toggleClass('visible', false);
			return;
		}
		$('#clock-timer').html(date.getHours() + ":" +
			(date.getMinutes() < 10 ? "0" : "") +
			date.getMinutes() + ":" +
			(date.getSeconds() < 10 ? "0" : "") +
			date.getSeconds());
		$('#clock-image').attr('src', 'timezones/' + date.getHours() + '.png');

		let showClock = false;
		// show clock around each hour
		if (date.getMinutes() === 59 && date.getSeconds() > 50) {
			showClock = true;
		}
		if (date.getMinutes() === 0 && date.getSeconds() < 20) {
			showClock = true;
		}
		// also show it after New Year
		if (date.getHours() === 23 &&
			date.getMinutes() === 56 && date.getSeconds() > 0) {
			showClock = true;
		}
		if (date.getMonth() === 0) {
			showClock = true;
		}
		$('#clock').toggleClass('visible', showClock);
	}

	function addNonBoldSpan(text) {
		return text.replace(/\([^)]*\)/, '<span class="non-bold">$&</span>');
	}

	let nextScrollTimer;

	function startHourOverviewScroll() {
		let $list = $('#hour-overview-body');
		$list.scrollTop(0);
		$list.removeClass('hidden');
		$list.height('auto');

		let availableSpace = $('body').height() - $list.offset().top;
		let scrollDistance = $list.height() - availableSpace;

		$list.height(availableSpace);

		// durations
		let waitDuration = 5000;
		let scrollDuration = scrollDistance * 25;

		// do the animations
		setTimeout(function() {
			$list.animate({
				scrollTop: scrollDistance
			}, {
				duration: scrollDuration,
				easing: 'linear'
			});
		}, waitDuration);

		setTimeout(function() {
			$list.addClass('hidden');
		}, 2 * waitDuration + scrollDuration);
		setTimeout(function() {
			$list.scrollTop(0);
		}, 2 * waitDuration + scrollDuration + 550);

		// recursive call to do the next scroll
		nextScrollTimer = setTimeout(startHourOverviewScroll,
			2 * waitDuration + scrollDuration + 600);
	}
});
