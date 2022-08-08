// wait for DOM before creating application

import data from "./data.js";

window.addEventListener("load", function () {
  //Add the canvas that Pixi automatically created for you to the HTML document
  const tagContainer = document.getElementById("canvas-container");
  const app = new PIXI.Application({
    width: 800,
    height: 400,
    transparent: false,
    antialias: true,
  });
  tagContainer.appendChild(app.view);

  app.loader
    .add(`./assets/symbol_00.png`)
    .add(`./assets/symbol_01.png`)
    .add(`./assets/symbol_02.png`)
    .add(`./assets/symbol_03.png`)
    .add("./assets/symbol_04.png")
    .add("./assets/symbol_05.png")
    .load(onAssetsLoaded);

  const REEL_WIDTH = 145;
  const SYMBOL_SIZE = 135;

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

      // Build the symbols
      //creando contenido de las columnas
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
    const margin = (app.screen.height - SYMBOL_SIZE * 2) / 8;
    reelContainer.y = margin;
    reelContainer.x = Math.round(app.screen.width - REEL_WIDTH * 5);
    const top = new PIXI.Graphics();
    top.beginFill(0, 1);
    top.drawRect(0, 0, app.screen.width, margin);
    app.stage.addChild(top);

    // Set the interactivity.

    const handleSpin = document.getElementById("handle-spin");
    handleSpin.addEventListener("pointerdown", () => {
      startPlay();
    });
    let running = false;

    // Function to start playing.
    function startPlay() {
      if (running) return;
      running = true;
      randomPrize(data);

      for (let i = 0; i < reels.length; i++) {
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

      console.log("reels:  ", reels);
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
    };

    tweening.push(tween);
    return tween;
  }

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

/* let btnCredit = document.getElementById("btn-credit");
btnCredit.addEventListener("click", balance); */
let credit;

function balance(prize) {
  let inputCredit = document.getElementById("inputCredit").value;
  credit = credit ?? Number(inputCredit);

  let bet;
  if (credit >= 10 && document.getElementById("10").checked) {
    bet = Number(document.getElementById("10").value);
  } else if (credit >= 50 && document.getElementById("50").checked) {
    bet = Number(document.getElementById("50").value);
  } else if (credit >= 100 && document.getElementById("100").checked) {
    bet = Number(document.getElementById("100").value);
  }
  credit -= bet;

  if (prize > 0) {
    document.getElementById("balance").innerText = `Balance: £ ${(credit +=
      prize)}`;
  }
  if (prize === 0) {
    document.getElementById("balance").innerText = `Balance: £ ${credit}`;
  }
}

function randomPrize(data) {
  const randomWinner = Math.floor(Math.random() * data.length);
  const prize = data[randomWinner].response.results.win;
  const divPoints = document.getElementById("points");
  console.log(prize);
  setTimeout(() => {
    balance(prize);
    if (prize > 0) {
      divPoints.innerHTML = `Congrats you won £ ${prize}!!`;
    } else {
      divPoints.innerHTML = `You haven't won :(`;
    }
  }, 3000);
}
