import { useId, useState } from "react";

export default function Bomb() {
  const delayId = useId();
  const [delay, setDelay] = useState(0);
  const plantBomb = async () => {
    const res = await fetch("/api/bomb/plant", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ timerLength: 40, plantedAt: Date.now() }),
    });
    console.log(res.status);
    console.log(await res.json());
  };

  const beginPlantTimer = () => {
    setTimeout(plantBomb, delay * 1000);
  };

  const defuseBomb = async () => {
    const res = await fetch("/api/bomb/defuse", {
      method: "POST",
    });
    console.log(res.status);
    console.log(await res.json());
  };

  return (
    <>
      <button
        className="bg-blue-500 px-3 py-2 rounded-md text-white"
        onClick={beginPlantTimer}
      >
        Plant bomb
      </button>
      <div>
        <label htmlFor={delayId}>Plant delay:</label>
        <input
          id={delayId}
          type="number"
          value={delay}
          min={0}
          onChange={(e) => setDelay(parseInt(e.target.value))}
        ></input>
      </div>
      <button
        className="bg-blue-500 px-3 py-2 rounded-md text-white"
        onClick={defuseBomb}
      >
        Defuse bomb
      </button>
    </>
  );
}
