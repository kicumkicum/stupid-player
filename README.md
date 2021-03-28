# stupid-player

It's middleware for simple create player in node.js project.

You can play http-link, file path and magnet URI.

```javascript
/** CREATE */
const StupidPlayer = require('stupid-player');

const player = new StupidPlayer();

player.on(player.EVENT_PLAY, callback);
player.on(player.EVENT_STOP, callback);
player.on(player.EVENT_ERROR, callback);

(async () => {
    await player.play(urlOrPathOrMagnet)
    // Some code...

  
    /** CHANGE VOLUME */
    const volume = 50;// 0..100

    await player.setVolume(volume)
    const currentVolume = player.getVolume();
    console.log(currentVolume);

    await player.stop();
})()
```
