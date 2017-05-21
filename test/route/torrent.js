const assert = require('assert');
const torrentRoute = require('../../lib/routes/torrent').default;
const uriFixtures = require('../fixtures/uri.json');

describe('URI', () => {
	it('Should ', () => {
		const torrentUri = uriFixtures.torrent;
		const otherUri = Object.keys(uriFixtures)
			.filter((type) => type !== 'torrent')
			.map((type) => uriFixtures[type]);
		torrentUri.forEach((uri) => assert.equal(true, torrentRoute.test(uri), 'torrent uri'));
		otherUri.forEach((type) => type.forEach((uri) => {
			assert.equal(false, torrentRoute.test(uri), 'other uri');
		}));
	});
});

// TODO: Route::read tests
