const assert = require('assert');
const {SoundStream} = require('../dist/sound-stream');

describe('SoundStream', () => {
  it('Should implement the interface', () => {
    const soundStream = new SoundStream();

    assert.ok(soundStream.pipe, 'pipe is not method');
    assert.ok(soundStream.unpipe, 'pipe is not method');
    assert.ok(soundStream.setVolume, 'setVolume is not method');
    assert.ok(soundStream.getVolume, 'getVolume is not method');
  });
});
