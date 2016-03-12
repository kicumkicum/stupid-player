var assert = require('assert');
var url = 'http://picosong.com/cdn/7b64bb8716f6f35189b5fe1fba4efd12.mp3';


describe('Creating', function() {
	it('create', function() {
		var StupidPlayer = require('../index');
		var stupidPlayer = new StupidPlayer;
		assert.equal(true, stupidPlayer instanceof StupidPlayer);
	});
});


describe('Action', function() {
	var StupidPlayer = require('../index');
	var stupidPlayer = new StupidPlayer;

	describe('playing', function() {
		it('async', function(done) {
			stupidPlayer.play('http://storage.mp3.cc/download/22183477/aGxhQVE2VTlqWGFGTm1mOVNUcS9ZcWsrMXh5K2d1T0lPZ1hNOUlEMUZxOTVhVTVKcHIzbHRZUGgrWDlhU0RrYW5BVzhSdXJPcEQvMDhSWnRRWGVaVVJYWDB1V0g5TEcxclhxYlhyUExuRld0L2h3ditLNzFDQVkwSWVUOWNubVQ/Oksana_Pochepa_Akula-Melodrama_(mp3.cc).mp3')
				.then(function () {
					setTimeout(function () {
						assert.equal(StupidPlayer.State.PLAY, stupidPlayer._state, 'state');
						done();
					}, 10000);
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
			stupidPlayer.play('http://storage.mp3.cc/download/22183477/aGxhQVE2VTlqWGFGTm1mOVNUcS9ZcWsrMXh5K2d1T0lPZ1hNOUlEMUZxOTVhVTVKcHIzbHRZUGgrWDlhU0RrYW5BVzhSdXJPcEQvMDhSWnRRWGVaVVJYWDB1V0g5TEcxclhxYlhyUExuRld0L2h3ditLNzFDQVkwSWVUOWNubVQ/Oksana_Pochepa_Akula-Melodrama_(mp3.cc).mp3')
				.then(function() {
					stupidPlayer.stop();
					assert.equal(StupidPlayer.State.STOP, stupidPlayer._state, 'state');
					done();
				});
		});

		it('sync play-stop', function(done) {
			stupidPlayer.play('http://storage.mp3.cc/download/22183477/aGxhQVE2VTlqWGFGTm1mOVNUcS9ZcWsrMXh5K2d1T0lPZ1hNOUlEMUZxOTVhVTVKcHIzbHRZUGgrWDlhU0RrYW5BVzhSdXJPcEQvMDhSWnRRWGVaVVJYWDB1V0g5TEcxclhxYlhyUExuRld0L2h3ditLNzFDQVkwSWVUOWNubVQ/Oksana_Pochepa_Akula-Melodrama_(mp3.cc).mp3');
			stupidPlayer.stop();
			setTimeout(done, 10000);
		})
	});
});
