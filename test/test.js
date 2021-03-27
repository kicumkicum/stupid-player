const StupidPlayer = require('../lib').StupidPlayer;
const State = require('../lib').State;
const assert = require('assert');

const url = `${__dirname}/files/Fragile-Lo-Fi-Chill-Melancholic-Music.mp3`;


describe('Creating', function() {
	it('create', function() {
		const stupidPlayer = new StupidPlayer;
		assert.equal(true, stupidPlayer instanceof StupidPlayer);
	});
});


describe('Action', function() {
	const stupidPlayer = new StupidPlayer;

	describe('playing', function() {
		it('async', function(done) {
			stupidPlayer.play(url)
				.then(function() {
					assert.equal(State.PLAY, stupidPlayer.getState(), 'state');
					done();
				});
		});

		it('event', function(done) {
			this.timeout(10 * 1000);
			stupidPlayer.once(stupidPlayer.EVENT_PLAY, function() {
				assert.equal(State.PLAY, stupidPlayer.getState(), 'state');
				done();
			});

			stupidPlayer.play(url);
		});
	});

	describe('offset', function() {
		it('should increase offset on play', function(done) {
			this.timeout(10 * 1000);
			console.log('before play');
			stupidPlayer.play(url)
				.then(function() {
					console.log('after play');
					const currentOffset = stupidPlayer.getOffset();
					console.log('offset', currentOffset);
					setTimeout(() => {
						const offset = stupidPlayer.getOffset();
						console.log('into setTimeout', offset);
						assert.notEqual(currentOffset, offset);
						done();
					}, 1000);
				});
		});

		it('should stop increasing offset on pause', function(done) {
			this.timeout(10 * 1000);
			console.log('before play');

			stupidPlayer.play(url).then(function() {
				console.log('after play');
                setTimeout(() => {
                    const currentOffset = stupidPlayer.getOffset();
                    console.log('offset', currentOffset);

                    stupidPlayer.pause();

                    console.log('offset', currentOffset);
                    assert.equal(currentOffset, stupidPlayer.getOffset());

                    done();
                    console.log('after done');
                }, 1000);
            });
		});

		it.only('should stop increasing offset on stop', function(done) {
			this.timeout(10 * 1000);

			stupidPlayer.play(url).then(function() {
				setTimeout(() => {
					stupidPlayer.stop();

					assert.equal(0, stupidPlayer.getOffset());

					done();
				}, 1000);
			});
		});
	});

	describe('stopping', function() {
		it('async play-stop', function(done) {
			stupidPlayer.play(url)
				.then(function() {
					assert.equal(State.PLAY, stupidPlayer.getState(), 'state');
					stupidPlayer.stop();
					assert.equal(State.STOP, stupidPlayer.getState(), 'state');
					done();
				});
		});

		it('sync play-stop', function() {
			this.timeout(10 * 1000);
			stupidPlayer.play(url);
			assert.equal(State.PLAY, stupidPlayer.getState(), 'state');
			stupidPlayer.stop();
			assert.equal(State.STOP, stupidPlayer.getState(), 'state');
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
						assert.equal(State.PAUSE, stupidPlayer.getState(), 'state');

						stupidPlayer.play();
						assert.equal(State.PLAY, stupidPlayer.getState(), 'state');
					});
			});

			it('toggle pause', () => {
				stupidPlayer
					.play(url)
					.then(() => {
						stupidPlayer.togglePause();
						assert.equal(State.PAUSE, stupidPlayer.getState(), 'state');

						stupidPlayer.togglePause();
						assert.equal(State.PLAY, stupidPlayer.getState(), 'state');
					});
			});
		});

		describe('Sync', () => {
			it('play-pause-resume', () => {
				stupidPlayer.play(url);
				stupidPlayer.pause();
				assert.equal(State.PAUSE, stupidPlayer.getState(), 'state');

				stupidPlayer.resume();
				assert.equal(State.PLAY, stupidPlayer.getState(), 'state');
			})
		});
	});

	describe.skip('Multiple playing', function() {
		describe('Url is not correct', function() {
			it.skip('Sync playing', function(done) {
				const stupidPlayer = new StupidPlayer;
				const url = 'http://ya.ru/';
				const eventsCount = {
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
				const stupidPlayer = new StupidPlayer;
				const url = 'http://ya.ru/';
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
