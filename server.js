const express = require("express");
const http = require("http");
const fs = require("fs");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

<<<<<<< HEAD
const PORT = 3000;
=======
const PORT = process.env.PORT || 3000;
>>>>>>> c564f161fd31fddf20205b4a7ceb99468cef00b9

const EVENTS_FILE = path.join(__dirname, "events.json");
const PROJECTS_FILE = path.join(__dirname, "projects.json");

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

function loadJson(filePath) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, "[]", "utf8");
    }

    try {
        return JSON.parse(fs.readFileSync(filePath, "utf8"));
    } catch {
        return [];
    }
}

function saveJson(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
}

let events = loadJson(EVENTS_FILE);
let projects = loadJson(PROJECTS_FILE);

function emitAll() {
    io.emit("initData", {
        events,
        projects
    });
}

io.on("connection", (socket) => {
    socket.emit("initData", {
        events,
        projects
    });

    socket.on("addProject", (project) => {
        project.id = Date.now().toString();
        projects.push(project);
        saveJson(PROJECTS_FILE, projects);
        emitAll();
    });

    socket.on("updateProject", (updatedProject) => {
        projects = projects.map(p => p.id === updatedProject.id ? updatedProject : p);
        saveJson(PROJECTS_FILE, projects);
        emitAll();
    });

    socket.on("deleteProject", (id) => {
        projects = projects.filter(p => p.id !== id);
        saveJson(PROJECTS_FILE, projects);
        emitAll();
    });

    socket.on("addEvent", (event) => {
        event.id = Date.now().toString();
        events.push(event);
        saveJson(EVENTS_FILE, events);
        emitAll();
    });

    socket.on("updateEvent", (updatedEvent) => {
        events = events.map(e => e.id === updatedEvent.id ? updatedEvent : e);
        saveJson(EVENTS_FILE, events);
        emitAll();
    });

    socket.on("deleteEvent", (id) => {
        events = events.filter(e => e.id !== id);
        saveJson(EVENTS_FILE, events);
        emitAll();
    });
});

server.listen(PORT, () => {
    console.log("KWIN 협업 일정 현황판 실행 중");
    console.log(`http://localhost:${PORT}`);
});