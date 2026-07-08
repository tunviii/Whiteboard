import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

// rooms[roomId] = { members: { userId: { username, color } }, connections: { socketId: userId } }
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

function broadcastUsers(roomId) {
    const room = rooms[roomId];
    if (!room) return;
    
    const activeUsers = Object.entries(room.connections).map(([socketId, userId]) => {
        const member = room.members[userId];
        return {
            socketId,
            userId,
            username: member.username,
            color: member.color
        };
    });
    
    io.to(roomId).emit("users", activeUsers);
}

io.on("connection", (socket) => {
    console.log("User Connected:", socket.id);

    socket.on("join-room", ({ roomId, username, userId }) => {
        socket.join(roomId);

        if (!rooms[roomId]) {
            rooms[roomId] = {
                members: {},
                connections: {}
            };
        }

        const room = rooms[roomId];

        if (!room.members[userId]) {
            const COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];
            const colorIndex = Object.keys(room.members).length % COLORS.length;
            room.members[userId] = {
                username,
                color: COLORS[colorIndex]
            };
        } else {
            // Update username in case it changed
            room.members[userId].username = username;
        }

        room.connections[socket.id] = userId;

        broadcastUsers(roomId);
    });

    socket.on("leave-room", ({ roomId }) => {
        const room = rooms[roomId];
        if (room && room.connections[socket.id]) {
            delete room.connections[socket.id];
            socket.leave(roomId);
            broadcastUsers(roomId);
            
            if (Object.keys(room.connections).length === 0) {
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
            const room = rooms[roomId];
            if (room.connections[socket.id]) {
                delete room.connections[socket.id];
                broadcastUsers(roomId);
                socket.to(roomId).emit("draw-end", { socketId: socket.id });

                if (Object.keys(room.connections).length === 0) {
                    delete rooms[roomId];
                    delete roomCanvas[roomId];
                }
            }
        }
    });
});

server.listen(5000, () => {
    console.log("Server running on port 5000");
});