var StupidPlayer = require('../index');
var assert = require('assert');
var url = 'http://www.stephaniequinn.com/Music/Allegro%20from%20Duet%20in%20C%20Major.mp3';


describe('Creating', function() {
	it('create', function() {
		var stupidPlayer = new StupidPlayer;
		assert.equal(true, stupidPlayer instanceof StupidPlayer);
	});
});


describe('Action', function() {
	var stupidPlayer = new StupidPlayer;

	describe('playing', function() {
		it('async', function(done) {
			stupidPlayer.play(url)
				.then(function() {
					assert.equal(StupidPlayer.State.PLAY, stupidPlayer._state, 'state');
					done();
				});
		});

		it('event', function(done) {
			this.timeout(10 * 1000);
			stupidPlayer.once(stupidPlayer.EVENT_PLAY, function() {
				assert.equal(StupidPlayer.State.PLAY, stupidPlayer._state, 'state');
				done();
			});

			stupidPlayer.play(url);
		});
	});

	describe('offset', function() {

		it('should increase offset on play', function(done) {
			this.timeout(10 * 1000);
			stupidPlayer.play(url).then(function() {
					var currentOffset = stupidPlayer.getOffset();
					assert.equal(StupidPlayer.State.PLAY, stupidPlayer.state, 'state');
					setTimeout(() => {
						assert.notEqual(currentOffset, stupidPlayer.getOffset());
						done();
					}, 1000);
				});;
		});

		it('should stop increasing offset on pause', function(done) {
			this.timeout(10 * 1000);
			stupidPlayer.play(url).then(function() {
					assert.equal(StupidPlayer.State.PLAY, stupidPlayer.state, 'state');
					setTimeout(() => {
						var currentOffset = stupidPlayer.getOffset();
						stupidPlayer.pause();
						assert.equal(StupidPlayer.State.PAUSE, stupidPlayer.state, 'state');
						assert.equal(currentOffset, stupidPlayer.getOffset());
						done();
					}, 1000);
				});;
		});

		it('should stop increasing offset on stop', function(done) {
			this.timeout(10 * 1000);

			stupidPlayer.play(url).then(function() {
					assert.equal(StupidPlayer.State.PLAY, stupidPlayer.state, 'state');
					setTimeout(() => {
						stupidPlayer.stop();
						assert.equal(StupidPlayer.State.STOP, stupidPlayer.state, 'state');
						assert.equal(0, stupidPlayer.getOffset());
						done();
					}, 1000);
				});;
		});
	});

	describe('stopping', function() {
		it('async play-stop', function(done) {
			stupidPlayer.play(url)
				.then(function() {
					assert.equal(StupidPlayer.State.PLAY, stupidPlayer.state, 'state');
					stupidPlayer.stop();
					assert.equal(StupidPlayer.State.STOP, stupidPlayer.state, 'state');
					done();
				});
		});

		it('sync play-stop', function() {
			this.timeout(10 * 1000);
			stupidPlayer.play(url);
			assert.equal(StupidPlayer.State.PLAY, stupidPlayer.state, 'state');
			stupidPlayer.stop();
			assert.equal(StupidPlayer.State.STOP, stupidPlayer.state, 'state');
		});
	});

	describe('pause', () => {
		'use strict';
		describe('Async', () => {
			it('pause-resume', () => {
				stupidPlayer
					.play(url)
					.then(() => {
						stupidPlayer.pause();
						assert.equal(StupidPlayer.State.PAUSE, stupidPlayer.state, 'state');

						stupidPlayer.play();
						assert.equal(StupidPlayer.State.PLAY, stupidPlayer.state, 'state');
					});
			});

			it('toggle pause', () => {
				stupidPlayer
					.play(url)
					.then(() => {
						stupidPlayer.togglePause();
						assert.equal(StupidPlayer.State.PAUSE, stupidPlayer.state, 'state');

						stupidPlayer.togglePause();
						assert.equal(StupidPlayer.State.PLAY, stupidPlayer.state, 'state');
					});
			});
		});

		describe('Sync', () => {
			it('play-pause-resume', () => {
				stupidPlayer.play(url);
				stupidPlayer.pause();
				assert.equal(StupidPlayer.State.PAUSE, stupidPlayer.state, 'state');

				stupidPlayer.resume();
				assert.equal(StupidPlayer.State.PLAY, stupidPlayer.state, 'state');
			})
		});
	});

	describe('Multiple playing', function() {
		describe('Url is not correct', function() {
			it.skip('Sync playing', function(done) {
				var stupidPlayer = new StupidPlayer;
				var url = 'http://ya.ru/';
				var eventsCount = {
					play: 0,
					stop: 0,
					error: 0
				};
				this.timeout(20 * 1000);

				stupidPlayer.once(stupidPlayer.EVENT_ERROR, function() {
					eventsCount.error++;
					stupidPlayer.play(url);
				});
				stupidPlayer.once(stupidPlayer.EVENT_PLAY, function() {
					eventsCount.play++;
				});
				stupidPlayer.once(stupidPlayer.EVENT_STOP, function() {
					eventsCount.stop++;
				});

				stupidPlayer.play(url);
				setTimeout(function() {
					assert.equal(eventsCount.error, eventsCount.play - 1, 'Error fired after not all play-events');
					assert.equal(eventsCount.stop, 1, 'Stop was fired');
					done();
				}, 19 * 1000);
			});

			it('Sync double playing', function(done) {
				var stupidPlayer = new StupidPlayer;
				var url = 'http://ya.ru/';
				this.timeout(20 * 1000);

				stupidPlayer.once(stupidPlayer.EVENT_ERROR, function() {
					stupidPlayer.play(url);
					stupidPlayer.play(url);
				});

				stupidPlayer.play(url);
				setTimeout(function() {
					done();
				}, 19 * 1000);
			});

			it('Async playing', function() {

			});
		});
	});
});
