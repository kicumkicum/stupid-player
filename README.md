# stupid-player

It's midleware for simple create player in node.js project.

```javascript
/** CREATE */
var player = new (require('stupid-player'));

player.on(player.EVENT_PLAY, callback);
player.on(player.EVENT_STOP, callback);
player.on(player.EVENT_ERROR, callback);

player.play(urlOrPath).
  .then(function() {
    /** SOME CODE */
  });
  
/** CHANGE VOLUME */
var value = 0.5;
player.setVolume(value)
  .then(function() {
    var currentVolume = player.getVolume();
    console.log(currentVolume);
  };
player.stop();
```

