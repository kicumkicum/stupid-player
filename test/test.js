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
				.then(function () {
					assert.equal(StupidPlayer.State.PLAY, stupidPlayer._state, 'state');
					done();
				});
		});

		it('event', function(done) {
			this.timeout(10 * 1000);
			stupidPlayer.on(stupidPlayer.EVENT_START, function() {
				assert.equal(StupidPlayer.State.PLAY, stupidPlayer._state, 'state');
				done();
			});

			stupidPlayer.play(url);
		});
	});

	describe('stopping', function() {
		it('async play-stop', function(done) {
			stupidPlayer.play(url)
				.then(function() {
					assert.equal(StupidPlayer.State.PLAY, stupidPlayer._state, 'state');
					stupidPlayer.stop();
					assert.equal(StupidPlayer.State.STOP, stupidPlayer._state, 'state');
					done();
				});
		});

		it('sync play-stop', function() {
			this.timeout(10 * 1000);
			stupidPlayer.play(url);
			assert.equal(StupidPlayer.State.PLAY, stupidPlayer._state, 'state');
			stupidPlayer.stop();
			assert.equal(StupidPlayer.State.STOP, stupidPlayer._state, 'state');
		});
	});
});
