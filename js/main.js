// wait for DOM before creating application
window.addEventListener("load", function (e) {
  e.preventDefault();

  //Add the canvas that Pixi automatically created for you to the HTML document
  const tagContainer = document.getElementById("container");
  const app = new PIXI.Application({
    width: 900,
    height: 500,
  });
  tagContainer.appendChild(app.view);

  app.loader
    .add("./assets/symbol_00.png")
    .add("./assets/symbol_01.png")
    .add("./assets/symbol_02.png")
    .add("./assets/symbol_03.png")
    .add("./assets/symbol_04.png")
    .add("./assets/symbol_05.png")
    .load(onAssetsLoaded);

  const REEL_WIDTH = 175;
  const SYMBOL_SIZE = 140;

  // onAssetsLoaded handler builds the example.
  function onAssetsLoaded() {
    // Create different slot symbols.
    const slotTextures = [
      PIXI.Texture.from("./assets/symbols/symbol_00.png"),
      PIXI.Texture.from("./assets/symbols/symbol_01.png"),
      PIXI.Texture.from("./assets/symbols/symbol_02.png"),
      PIXI.Texture.from("./assets/symbols/symbol_03.png"),
      PIXI.Texture.from("./assets/symbols/symbol_04.png"),
      PIXI.Texture.from("./assets/symbols/symbol_05.png"),
    ];

    // Build the reels
    const reels = [];
    const reelContainer = new PIXI.Container();
    for (let i = 0; i < 4; i++) {
      const rc = new PIXI.Container();
      rc.x = i * REEL_WIDTH;
      reelContainer.addChild(rc);

      const reel = {
        container: rc,
        symbols: [],
        position: 0,
        previousPosition: 0,
        blur: new PIXI.filters.BlurFilter(),
      };
      reel.blur.blurX = 0;
      reel.blur.blurY = 0;
      rc.filters = [reel.blur];

      console.log(reels);

      console.log(reel);

      // Build the symbols
      for (let j = 0; j < 4; j++) {
        const symbol = new PIXI.Sprite(
          slotTextures[Math.floor(Math.random() * slotTextures.length)]
        );
        // Scale the symbol to fit symbol area.
        symbol.y = j * SYMBOL_SIZE;
        symbol.scale.x = symbol.scale.y = Math.min(
          SYMBOL_SIZE / symbol.width,
          SYMBOL_SIZE / symbol.height
        );
        symbol.x = Math.round((SYMBOL_SIZE - symbol.width) / 2);
        reel.symbols.push(symbol);
        rc.addChild(symbol);
      }
      reels.push(reel);
    }
    app.stage.addChild(reelContainer);

    // Build top & bottom covers and position reelContainer
    const margin = (app.screen.height - SYMBOL_SIZE * 3) / 2;
    reelContainer.y = margin;
    reelContainer.x = Math.round(app.screen.width - REEL_WIDTH * 5);
    const top = new PIXI.Graphics();
    top.beginFill(0, 1);
    top.drawRect(0, 0, app.screen.width, margin);
    /*  const bottom = new PIXI.Graphics();
    bottom.beginFill(0, 1);
    bottom.drawRect(0, SYMBOL_SIZE * 3 + margin, app.screen.width, margin);  */

    // Add play text
    const style = new PIXI.TextStyle({
      fontFamily: "monospace",
      fontSize: 36,
      fontStyle: "italic",
      fontWeight: "bold",
      fill: ["#ffffff", "#00ff99"], // gradient
      stroke: "#4a1850",
      strokeThickness: 5,
      dropShadow: true,
      dropShadowColor: "#000000",
      dropShadowBlur: 4,
      dropShadowAngle: Math.PI / 6,
      dropShadowDistance: 6,
      wordWrap: true,
      wordWrapWidth: 440,
    });

    
    // Add header text
    const headerText = new PIXI.Text("1X2 Network Jackpot", style);
    headerText.x = Math.round((top.width - headerText.width) / 2);
    headerText.y = Math.round((margin - headerText.height) / 2);
    top.addChild(headerText);
    
    app.stage.addChild(top);
    
    // Set the interactivity.
    
    const buttonSpin = document.getElementById("btn-spin");
    buttonSpin.addEventListener("pointerdown", () => {
      
      startPlay();
    });

    let running = false;

    // Function to start playing.
    function startPlay() {
      if (running) return;
      running = true;

      for (let i = 0; i < reels.length; i++) {
        
            console.log("reels:  ",reels)
        const r = reels[i];
        const extra = Math.floor(Math.random() * 3);
        const target = r.position + 10 + i * 5 + extra;
        const time = 500 + i * 600 + extra * 600;
        
        tweenTo(
          r,
          "position",
          target,
          time,
          backout(0.5),
          null,
          i === reels.length - 1 ? reelsComplete : null
        );
      
    }
    }
    // Reels done handler.
    function reelsComplete() {
      running = false;
    }

    // Listen for animate update.
    app.ticker.add((delta) => {
      // Update the slots.
      for (let i = 0; i < reels.length; i++) {
        const r = reels[i];
        // Update blur filter y amount based on speed.
        // This would be better if calculated with time in mind also. Now blur depends on frame rate.
        r.blur.blurY = (r.position - r.previousPosition) * 8;
        r.previousPosition = r.position;

        // Update symbol positions on reel.
        for (let j = 0; j < r.symbols.length; j++) {
          const s = r.symbols[j];
          const prevy = s.y;
          s.y =
            ((r.position + j) % r.symbols.length) * SYMBOL_SIZE - SYMBOL_SIZE;
          if (s.y < 0 && prevy > SYMBOL_SIZE) {
            // Detect going over and swap a texture.
            // This should in proper product be determined from some logical reel.
            s.texture =
              slotTextures[Math.floor(Math.random() * slotTextures.length)];
            s.scale.x = s.scale.y = Math.min(
              SYMBOL_SIZE / s.texture.width,
              SYMBOL_SIZE / s.texture.height
            );
            s.x = Math.round((SYMBOL_SIZE - s.width) / 2);
          }
        }
      }
    });
  }
  
  // Very simple tweening utility function. This should be replaced with a proper tweening library in a real product.
  const arr=[]
  const tweening = [];
  function tweenTo(
    object,
    property,
    target,
    time,
    easing,
    onchange,
    oncomplete
  ) {
    const tween = {
      object,
      property,
      propertyBeginValue: object[property],
      target,
      easing,
      time,
      change: onchange,
      complete: oncomplete,
      start: Date.now(),
      id:1
    };

    tweening.push(tween);
    console.log("tweeening", tweening);
    console.log("twen", tween);
    console.log("arr", tween);
    return tween;
}

arr.push(tween.id);
  // Listen for animate update.
  app.ticker.add((delta) => {
    const now = Date.now();
    const remove = [];
    for (let i = 0; i < tweening.length; i++) {
      const t = tweening[i];
      const phase = Math.min(1, (now - t.start) / t.time);

      t.object[t.property] = lerp(
        t.propertyBeginValue,
        t.target,
        t.easing(phase)
      );
      if (t.change) t.change(t);
      if (phase === 1) {
        t.object[t.property] = t.target;
        if (t.complete) t.complete(t);
        remove.push(t);
      }
    }
    for (let i = 0; i < remove.length; i++) {
      tweening.splice(tweening.indexOf(remove[i]), 1);
    }
  });

  // Basic lerp funtion.
  function lerp(a1, a2, t) {
    return a1 * (1 - t) + a2 * t;
  }

  // Backout function from tweenjs.
  // https://github.com/CreateJS/TweenJS/blob/master/src/tweenjs/Ease.js
  function backout(amount) {
    return (t) => --t * t * ((amount + 1) * t + amount) + 1;
  }
});
