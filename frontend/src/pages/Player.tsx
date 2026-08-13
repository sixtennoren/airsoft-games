import {
  unlockAudio,
  preloadSound,
  playSound,
  type SoundHandle,
} from "@/lib/audio";
import { useState, useEffect } from "react";

const beep = false;

export default function Player() {
  const [message, setMessage] = useState("Loading...");
  const [offsetD, setOffsetD] = useState("Loading");
  const [buttonText, setButtonText] = useState("Enable sounds");

  useEffect(() => {
    preloadSound("/sounds/bombpl.wav");
    preloadSound("/sounds/bombdef.wav");
    preloadSound("/sounds/bombplanted.mp3");
    preloadSound("/sounds/bombtenseccount.mp3");
    preloadSound("/sounds/c4_explode1.wav");
    preloadSound("/sounds/terwin.wav");
    preloadSound("/sounds/ctwin.wav");
    preloadSound("/sounds/lostround.mp3");
    preloadSound("/sounds/wonround.mp3");
    preloadSound("/sounds/c4_beep2.wav");
    preloadSound("/sounds/c4_final.wav");
    let activeMusic: SoundHandle | null;
    let active10sMusic: SoundHandle | null;
    let plantedTimestamp: number;
    let pingTimestamp: number;
    let plantTime: number;
    let offset: number;

    let timeoutIdLong: number;
    let timeoutId10s: number;

    const boom = async () => {
      setMessage("Boom");
      playSound("/sounds/c4_explode1.wav", 0.7);
      playSound("/sounds/terwin.wav", 1);
      playSound("/sounds/lostround.mp3", 0.3);
    };

    const tenSec = async () => {
      active10sMusic = await playSound("/sounds/bombtenseccount.mp3", 0.4);
      setTimeout(() => {
        activeMusic?.stop();
      }, 389);
      if (beep)
        setTimeout(() => {
          playSound("/sounds/c4_final.wav", 0.4);
        }, 9000);
      timeoutId10s = setTimeout(boom, 11000);
    };

    const beeper = () => {
      playSound("/sounds/c4_beep2.wav", 0.3);
      const timeElapsed = performance.now() - plantedTimestamp;
      const timeLeft = plantTime - timeElapsed;
      const delay = Math.max(100 + (900 * timeLeft) / plantTime, 150);
      if (timeLeft > 1000) setTimeout(beeper, delay);
    };

    const bombPlanted = (timerLength: number, timestamp: number) => {
      const delay = timestamp - Date.now() + offset;
      setMessage(`Planting... (${delay} ms, ${delay + offset})`);

      setTimeout(async () => {
        plantedTimestamp = performance.now();
        plantTime = timerLength * 1000;
        if (beep) setTimeout(beeper, 1000);
        playSound("/sounds/bombpl.wav", 1);
        activeMusic = await playSound("/sounds/bombplanted.mp3", 0.2);

        timeoutIdLong = setTimeout(tenSec, (timerLength - 10) * 1000);
      }, delay);
    };

    const bombDefused = () => {
      setMessage("Defused");
      activeMusic?.stop();
      active10sMusic?.stop();
      playSound("/sounds/bombdef.wav", 1);
      playSound("/sounds/wonround.mp3", 0.3);
      clearTimeout(timeoutIdLong);
      clearTimeout(timeoutId10s);

      setTimeout(() => {
        playSound("/sounds/ctwin.wav", 1);
      }, 1750);
    };

    const socket = new WebSocket("ws://81.226.145.174:8080");
    const ping = () => {
      pingTimestamp = performance.now();
      socket.send(
        JSON.stringify({
          event: "ping",
        }),
      );
    };
    socket.addEventListener("open", () => {
      setMessage("Connected.");
      ping();
    });
    const pingInterval = setInterval(ping, 5000);

    // Listen for messages
    socket.addEventListener("message", (event) => {
      console.log(`Received: ${event.data}`);
      const data = JSON.parse(event.data);
      if (data.event == "bombPlanted")
        bombPlanted(data.data.timerLength, data.timestamp);
      else if (data.event == "bombDefused") bombDefused();
      else if (data.event == "pong") {
        offset =
          (performance.now() - pingTimestamp) / 2 + Date.now() - data.timestamp;
        setOffsetD(String(Math.round(offset)));
      }
    });

    return () => {
      socket.close();
      clearInterval(pingInterval);
    };
  }, []);

  const unlock = async () => {
    setButtonText("...");
    await unlockAudio();
    setButtonText("Sounds unlocked");
  };

  return (
    <div>
      <h1>{message}</h1>
      <h1>Ping: {offsetD}</h1>
      <button
        className="bg-blue-500 text-white px-3 py-2 rounded-md text-3xl"
        onClick={unlock}
      >
        {buttonText}
      </button>
    </div>
  );
}
