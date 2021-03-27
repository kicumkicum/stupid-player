const assert = require('assert');
const {SoundStream} = require('../lib/sound-stream');

describe('SoundStream', () => {
  it('Should implement the interface', () => {
    const soundStream = new SoundStream();

    assert.ok(soundStream.connect, 'connect is not method');
    assert.ok(soundStream.destroy, 'destroy is not method');
    assert.ok(soundStream.pause, 'pause is not method');
    assert.ok(soundStream.resume, 'resume is not method');
    assert.ok(soundStream.setVolume, 'setVolume is not method');
    assert.ok(soundStream.getVolume, 'getVolume is not method');
  });
});
