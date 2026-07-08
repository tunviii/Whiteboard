import { useParams } from "react-router-dom";

export default function Navbar() {
    const { roomId } = useParams();

    const copyRoomId = async () => {
        await navigator.clipboard.writeText(roomId);
        alert("Room ID copied!");
    };

    return (
        <header className="h-16 bg-white border-b shadow-sm px-8 flex items-center justify-between">

    <h1 className="text-3xl font-bold text-indigo-600">
        🎨 Collaborative Whiteboard
    </h1>

    <div className="flex gap-4 items-center">

        <span className="font-mono bg-gray-100 px-4 py-2 rounded-lg">
            {roomId}
        </span>

        <button
            onClick={copyRoomId}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
        >
            Copy Room ID
        </button>

    </div>

</header>
    );
}