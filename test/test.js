var assert = require('assert');


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
		it('play', function(done) {
			stupidPlayer.play('http://storage.mp3.cc/download/22183477/aGxhQVE2VTlqWGFGTm1mOVNUcS9ZcWsrMXh5K2d1T0lPZ1hNOUlEMUZxOTVhVTVKcHIzbHRZUGgrWDlhU0RrYW5BVzhSdXJPcEQvMDhSWnRRWGVaVVJYWDB1V0g5TEcxclhxYlhyUExuRld0L2h3ditLNzFDQVkwSWVUOWNubVQ/Oksana_Pochepa_Akula-Melodrama_(mp3.cc).mp3')
				.then(function () {
					setTimeout(function () {
						assert.equal(StupidPlayer.State.PLAY, stupidPlayer._state, 'state');
						done();
					}, 10000);
				});
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
