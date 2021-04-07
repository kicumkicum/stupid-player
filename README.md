# stupid-player

It's middleware for simple create player in node.js project.

You can play any readable stream with mp3 content. But you can create readable stream for http-link, file path and magnet URI with internal method.

```javascript
/** CREATE */
const StupidPlayer = require('stupid-player');

const player = new StupidPlayer();

player.on(player.EVENT_PLAY, callback);
player.on(player.EVENT_STOP, callback);
player.on(player.EVENT_ERROR, callback);

(async () => {
    const readStream = await StupidPlayer.getReadStream(urlOrPathOrMagnet);

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
