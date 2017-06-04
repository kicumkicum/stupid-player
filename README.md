# stupid-player

It's middleware for simple create player in node.js project.

```javascript
/** CREATE */
var player = new (require('stupid-player'));

player.on(player.EVENT_START, callback);
player.on(player.EVENT_STOP, callback);
player.on(player.EVENT_ERROR, callback);

player.play(urlOrPath)
  .then(function() {
    /** SOME CODE */
  });
  
/** CHANGE VOLUME */
var value = 50;// 0..100
player.setVolume(value)
  .then(function() {
    var currentVolume = player.getVolume();
    console.log(currentVolume);
  };
player.stop();
```

