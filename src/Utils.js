import UIfx from 'uifx';
import missSoundFile from './sounds/splash-by-blaukreuz-6261.mp3';
import hitSoundFile from './sounds/9mm-pistol-shoot-short-reverb-7152.mp3';
import sinkSoundFile from './sounds/cannon-shot-6153-cropped.mp3';
import startGameSoundFile from './sounds/107786__leviclaassen__beepbeep.wav';

function randomId() {
    const dateString = Date.now().toString(36);
    const randomness = Math.random().toString(36).substring(2);
    return dateString + randomness;
}

function playSound(move) {
    if (move === "GAME_OVER") {
        const gameOverSound = new UIfx(sinkSoundFile, { volume: .1 });
        gameOverSound.play();
    } else if (move === "START_GAME") {
        const startGameSound = new UIfx(startGameSoundFile, { volume: .1 });
        startGameSound.play();
    } else if (move.hitFlags.sunk) {
        const sinkSound = new UIfx(sinkSoundFile, { volume: .1 });
        sinkSound.play();
    } else if (move.hitFlags.hit) {
        const hitSound = new UIfx(hitSoundFile, { volume: .05 });
        hitSound.play();
    } else {
        const missSound = new UIfx(missSoundFile, { volume: .15 });
        missSound.play();
    }
}

function copyToClipboard(text, event) {
    navigator.clipboard.writeText(text);

    let indicatorTarget = event.target.closest(".shareURL");
    indicatorTarget.classList.remove("copied");
    indicatorTarget.classList.add("copied");
    setTimeout(() => indicatorTarget.classList.remove("copied"), 2000);
}

let Utils = {
    randomId,
    playSound,
    copyToClipboard,
}

export default Utils