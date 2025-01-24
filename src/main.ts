import Phaser from "phaser";
import InvertPostFX from "./pipelines/invert";
import { version } from "../package.json";
import UIPlugin from "phaser3-rex-plugins/templates/ui/ui-plugin";
import BBCodeTextPlugin from "phaser3-rex-plugins/plugins/bbcodetext-plugin";
import InputTextPlugin from "phaser3-rex-plugins/plugins/inputtext-plugin";
import TransitionImagePackPlugin from "phaser3-rex-plugins/templates/transitionimagepack/transitionimagepack-plugin";
import { initI18n } from "./plugins/i18n";
import { db } from "./firebase-config";
import { collection, getDocs } from "firebase/firestore";

// Catch global errors and display them in an alert so users can report the issue.
window.onerror = function (message, source, lineno, colno, error) {
  console.error(error);
  // const errorString = `Received unhandled error. Open browser console and click OK to see details.\nError: ${message}\nSource: ${source}\nLine: ${lineno}\nColumn: ${colno}\nStack: ${error.stack}`;
  //alert(errorString);
  // Avoids logging the error a second time.
  return true;
};

// Catch global promise rejections and display them in an alert so users can report the issue.
window.addEventListener("unhandledrejection", (event) => {
  // const errorString = `Received unhandled promise rejection. Open browser console and click OK to see details.\nReason: ${event.reason}`;
  console.error(event.reason);
  //alert(errorString);
});

/**
 * Sets this object's position relative to another object with a given offset
 */
const setPositionRelative = function (guideObject: Phaser.GameObjects.GameObject, x: number, y: number) {
  const offsetX = guideObject.width * (-0.5 + (0.5 - guideObject.originX));
  const offsetY = guideObject.height * (-0.5 + (0.5 - guideObject.originY));
  this.setPosition(guideObject.x + offsetX + x, guideObject.y + offsetY + y);
};

Phaser.GameObjects.Container.prototype.setPositionRelative = setPositionRelative;
Phaser.GameObjects.Sprite.prototype.setPositionRelative = setPositionRelative;
Phaser.GameObjects.Image.prototype.setPositionRelative = setPositionRelative;
Phaser.GameObjects.NineSlice.prototype.setPositionRelative = setPositionRelative;
Phaser.GameObjects.Text.prototype.setPositionRelative = setPositionRelative;
Phaser.GameObjects.Rectangle.prototype.setPositionRelative = setPositionRelative;

document.fonts.load("16px emerald").then(() => document.fonts.load("10px pkmnems"));

let game;

const startGame = async (manifest?: any) => {
  await initI18n();
  const LoadingScene = (await import("./loading-scene")).LoadingScene;
  const BattleScene = (await import("./battle-scene")).default;
  game = new Phaser.Game({
    type: Phaser.WEBGL,
    parent: "app",
    scale: {
      width: 1920,
      height: 1080,
      mode: Phaser.Scale.FIT
    },
    plugins: {
      global: [{
        key: "rexInputTextPlugin",
        plugin: InputTextPlugin,
        start: true
      }, {
        key: "rexBBCodeTextPlugin",
        plugin: BBCodeTextPlugin,
        start: true
      }, {
        key: "rexTransitionImagePackPlugin",
        plugin: TransitionImagePackPlugin,
        start: true
      }],
      scene: [{
        key: "rexUI",
        plugin: UIPlugin,
        mapping: "rexUI"
      }]
    },
    input: {
      mouse: {
        target: "app"
      },
      touch: {
        target: "app"
      },
      gamepad: true
    },
    dom: {
      createContainer: true
    },
    pixelArt: true,
    pipeline: [ InvertPostFX ] as unknown as Phaser.Types.Core.PipelineConfig,
    scene: [ LoadingScene, BattleScene ],
    version: version
  });
  game.sound.pauseOnBlur = false;
  if (manifest) {
    game["manifest"] = manifest;
  }
};

fetch("/manifest.json")
  .then(res => res.json())
  .then(jsonResponse => {
    startGame(jsonResponse.manifest);
  }).catch(() => {
    // Manifest not found (likely local build)
    startGame();
  });

// Function to set cookie
function setCookie(name: string, value: string, days: number) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/`;
}

// Fetch data from Firestore and store it in cookies
async function fetchAndStoreData() {
  try {
    const querySnapshot = await getDocs(collection(db, "games"));
    const data: { id: string;[key: string]: any }[] = [];

    querySnapshot.forEach((doc) => {
      data.push({ id: doc.id, ...doc.data() });
    });

    setCookie("games-data", JSON.stringify(data), 1);
    console.log("Data saved to cookies.");
  } catch (error) {
    console.error("Error fetching data:", error);
  }
}

fetchAndStoreData().then(() => {
  console.log("Data fetching complete");
  document.dispatchEvent(new Event("gamesDataLoaded"));
});
// Execute when page loads
export default game;
