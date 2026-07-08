import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import socket from "../services/socket";

import Navbar from "../components/Navbar/Navbar";
import Toolbar from "../components/Toolbar/Toolbar";
import Canvas from "../components/Whiteboard/Canvas";
import UserList from "../components/Sidebar/UserList";

export default function Room() {

    const { roomId } = useParams();

    const username = localStorage.getItem("username");

    const [users, setUsers] = useState([]);

    useEffect(() => {

        socket.connect();

        const handleUsers = (users) => {
            setUsers(users);
        };

        socket.emit("join-room", {
            roomId,
            username,
        });

        socket.on("users", handleUsers);

        return () => {

            socket.off("users", handleUsers);

            socket.disconnect();

        };

    }, [roomId, username]);

    return (
    <div className="h-screen flex flex-col bg-slate-100">

        <Navbar />

        <div className="flex flex-1 overflow-hidden">

            <Toolbar />

            <Canvas />

            <UserList users={users} />

        </div>

    </div>
);

}