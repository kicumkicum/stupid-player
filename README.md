# stupid-player

It's middleware for simple create player in node.js project.

You can play any readable stream with mp3 content. But you can create readable stream for http-link, file path and magnet URI with internal method.

## Using

```javascript
/** CREATE */
const StupidPlayer = require('stupid-player').StupidPlayer;

const URL = 'https://free.music/abc.mp3';
const PATH = '/home/noname/music/abc.mp3';
const MAGNET = 'magnet:?xt=urn:btih:225e65b5fada79cc4e28c547f769e25cf7440f7e';

const player = new StupidPlayer();

player.on(player.EVENT_PLAY, callback);
player.on(player.EVENT_STOP, callback);
player.on(player.EVENT_ERROR, callback);

(async () => {
    const readStream = await StupidPlayer.getReadStream(URL || PATH || MAGNET);

    await player.play(readStream);

    // Some code...
  
    /** CHANGE VOLUME */
    const volume = 50;// 0..100

    await player.setVolume(volume)
    const currentVolume = player.getVolume();
    console.log(currentVolume);

    await player.stop();
})()
```

## Building

For linux:

```bash
sudo apt-get install make gcc libasound2-dev libmp3lame-dev libmpg123-dev
```

For windows:

You must have installed python.
