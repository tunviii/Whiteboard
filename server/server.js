import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const rooms = {};
// Store canvas elements for each room
const roomCanvas = {};

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
                delete roomCanvas[roomId];
            }
        }
    });

    // --- Canvas Events ---

    socket.on("cursor-move", ({ roomId, pointer, username, color }) => {
        socket.to(roomId).emit("cursor-update", { socketId: socket.id, pointer, username, color });
    });

    socket.on("sync-request", ({ roomId }) => {
        if (!roomCanvas[roomId]) {
            roomCanvas[roomId] = [];
        }
        socket.emit("sync-response", roomCanvas[roomId]);
    });

    socket.on("draw-progress", ({ roomId, element }) => {
        // Broadcast ongoing drawing to everyone else in the room
        socket.to(roomId).emit("draw-progress", { socketId: socket.id, element });
    });

    socket.on("draw-end", ({ roomId }) => {
        socket.to(roomId).emit("draw-end", { socketId: socket.id });
    });

    socket.on("add-element", ({ roomId, element }) => {
        if (!roomCanvas[roomId]) {
            roomCanvas[roomId] = [];
        }
        roomCanvas[roomId].push(element);
        socket.to(roomId).emit("element-added", element);
    });

    socket.on("update-elements", ({ roomId, elements }) => {
        roomCanvas[roomId] = elements;
        socket.to(roomId).emit("elements-updated", elements);
    });

    // ---------------------

    socket.on("disconnect", () => {

    console.log("User Disconnected:", socket.id);

    for (const roomId in rooms) {

        rooms[roomId] = rooms[roomId].filter(
            user => user.socketId !== socket.id
        );

        io.to(roomId).emit("users", rooms[roomId]);
        socket.to(roomId).emit("draw-end", { socketId: socket.id }); // Clean up if they disconnect while drawing

        if (rooms[roomId].length === 0) {
            delete rooms[roomId];
            delete roomCanvas[roomId];
        }
    }

});
});

server.listen(5000, () => {
    console.log("Server running on port 5000");
});