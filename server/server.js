import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const rooms = {};

const app = express();

app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

app.get("/", (req, res) => {
    res.send("Whiteboard Server Running");
});

io.on("connection", (socket) => {
    console.log("User Connected:", socket.id);

    socket.on("join-room", ({ roomId, username }) => {
    socket.join(roomId);

    if (!rooms[roomId]) {
        rooms[roomId] = [];
    }

    const userIndex = rooms[roomId].findIndex(user => user.socketId === socket.id);

    if (userIndex !== -1) {
        rooms[roomId][userIndex].username = username;
    } else {
        rooms[roomId].push({
            socketId: socket.id,
            username,
        });
    }

    console.log(rooms);

    io.to(roomId).emit("users", rooms[roomId]);
});

    socket.on("leave-room", ({ roomId }) => {
        if (rooms[roomId]) {
            rooms[roomId] = rooms[roomId].filter(user => user.socketId !== socket.id);
            socket.leave(roomId);
            io.to(roomId).emit("users", rooms[roomId]);
            if (rooms[roomId].length === 0) {
                delete rooms[roomId];
            }
        }
    });

    socket.on("disconnect", () => {

    console.log("User Disconnected:", socket.id);

    for (const roomId in rooms) {

        rooms[roomId] = rooms[roomId].filter(
            user => user.socketId !== socket.id
        );

        io.to(roomId).emit("users", rooms[roomId]);

        if (rooms[roomId].length === 0) {
            delete rooms[roomId];
        }
    }

});
});

server.listen(5000, () => {
    console.log("Server running on port 5000");
});