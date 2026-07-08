import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuid } from "uuid";

export default function Home() {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");

  const navigate = useNavigate();

  const createRoom = () => {
    if (!username.trim()) {
      alert("Please enter your name.");
      return;
    }

    const id = uuid();

    localStorage.setItem("username", username);

    navigate(`/room/${id}`);
  };

  const joinRoom = () => {
    if (!username.trim()) {
      alert("Please enter your name.");
      return;
    }

    if (!roomId.trim()) {
      alert("Please enter a room ID.");
      return;
    }

    localStorage.setItem("username", username);

    navigate(`/room/${roomId}`);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">

        <h1 className="text-4xl font-bold text-center text-slate-800">
          Collaborative Whiteboard
        </h1>

        <p className="text-center text-slate-500 mt-3">
          Draw together in real time.
        </p>

        <div className="mt-8 space-y-4">

          <input
            type="text"
            placeholder="Enter your name"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <input
            type="text"
            placeholder="Room ID (only if joining)"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

        </div>

        <div className="grid grid-cols-2 gap-4 mt-6">

          <button
            onClick={createRoom}
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg transition"
          >
            Create Room
          </button>

          <button
            onClick={joinRoom}
            className="border border-indigo-600 text-indigo-600 hover:bg-indigo-50 py-3 rounded-lg transition"
          >
            Join Room
          </button>

        </div>

      </div>
    </div>
  );
}