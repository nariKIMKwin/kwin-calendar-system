const express = require("express");
const session = require("express-session");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const { Pool } = require("pg");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

const LOGIN_ID = process.env.LOGIN_ID || "kwin";
const LOGIN_PASSWORD = process.env.LOGIN_PASSWORD || "위기를기회로";

if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL 환경변수가 없습니다.");
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

app.use(express.json());

app.use(session({
    secret: process.env.SESSION_SECRET || "kwin-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 1000 * 60 * 60 * 24
    }
}));

app.use((req, res, next) => {
    const openPaths = [
        "/login.html",
        "/login",
        "/login.js",
        "/style.css",
        "/logo.png"
    ];

    if (openPaths.includes(req.path)) {
        return next();
    }

    if (req.session && req.session.isLogin) {
        return next();
    }

    return res.redirect("/login.html");
});

app.use(express.static(path.join(__dirname, "public")));

app.post("/login", (req, res) => {
    const { id, password } = req.body;

    if (id === LOGIN_ID && password === LOGIN_PASSWORD) {
        req.session.isLogin = true;
        return res.json({ success: true });
    }

    return res.json({ success: false });
});

app.post("/logout", (req, res) => {
    req.session.destroy(() => {
        res.json({ success: true });
    });
});

async function initDb() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            project_no TEXT NOT NULL,
            project_title TEXT NOT NULL,
            company_name TEXT,
            due_date TEXT,
            project_manager TEXT,
            manager_phone TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        );
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY,
            event_type TEXT NOT NULL,
            project_id TEXT,
            task_name TEXT NOT NULL,
            manager TEXT,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            status TEXT,
            memo TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        );
    `);
await pool.query(`
    ALTER TABLE events
    ADD COLUMN IF NOT EXISTS confirm_users JSONB DEFAULT '[]'::jsonb;
`);
}

async function getProjects() {
    const result = await pool.query(`
        SELECT
            id,
            project_no AS "projectNo",
            project_title AS "projectTitle",
            company_name AS "companyName",
            due_date AS "dueDate",
            project_manager AS "projectManager",
            manager_phone AS "managerPhone"
        FROM projects
        ORDER BY created_at ASC
    `);

    return result.rows;
}

async function getEvents() {
    const result = await pool.query(`
        SELECT
            id,
            event_type AS "eventType",
            project_id AS "projectId",
            task_name AS "taskName",
            manager,
            start_date AS "startDate",
            end_date AS "endDate",
            status,
            memo,
            COALESCE(confirm_users, '[]'::jsonb) AS "confirmUsers"
        FROM events
        ORDER BY created_at ASC
    `);

    return result.rows;
}

async function getAllData() {
    const projects = await getProjects();
    const events = await getEvents();

    return { events, projects };
}

async function emitAll() {
    const data = await getAllData();
    io.emit("initData", data);
}

io.on("connection", async (socket) => {
    socket.emit("initData", await getAllData());

    socket.on("addProject", async (project) => {
        try {
            const id = Date.now().toString();

            await pool.query(`
                INSERT INTO projects
                (id, project_no, project_title, company_name, due_date, project_manager, manager_phone)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
                id,
                project.projectNo,
                project.projectTitle,
                project.companyName || "",
                project.dueDate || "",
                project.projectManager || "",
                project.managerPhone || ""
            ]);

            await emitAll();
        } catch (err) {
            console.error("addProject error:", err);
        }
    });

    socket.on("updateProject", async (project) => {
        try {
            await pool.query(`
                UPDATE projects
                SET
                    project_no = $1,
                    project_title = $2,
                    company_name = $3,
                    due_date = $4,
                    project_manager = $5,
                    manager_phone = $6
                WHERE id = $7
            `, [
                project.projectNo,
                project.projectTitle,
                project.companyName || "",
                project.dueDate || "",
                project.projectManager || "",
                project.managerPhone || "",
                project.id
            ]);

            await emitAll();
        } catch (err) {
            console.error("updateProject error:", err);
        }
    });

    socket.on("deleteProject", async (id) => {
        try {
            await pool.query("DELETE FROM projects WHERE id = $1", [id]);
            await emitAll();
        } catch (err) {
            console.error("deleteProject error:", err);
        }
    });

    socket.on("addEvent", async (event) => {
        try {
            const id = Date.now().toString();
await pool.query(`
    INSERT INTO events
    (id, event_type, project_id, task_name, manager, start_date, end_date, status, memo, confirm_users)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
`, [
    id,
    event.eventType,
    event.projectId || "",
    event.taskName,
    event.manager || "",
    event.startDate,
    event.endDate,
    event.status || "planned",
    event.memo || "",
    JSON.stringify(event.confirmUsers || [])
]);
            await emitAll();
        } catch (err) {
            console.error("addEvent error:", err);
        }
    });

    socket.on("updateEvent", async (event) => {
        try {
await pool.query(`
    UPDATE events
    SET
        event_type = $1,
        project_id = $2,
        task_name = $3,
        manager = $4,
        start_date = $5,
        end_date = $6,
        status = $7,
        memo = $8,
        confirm_users = $9::jsonb
    WHERE id = $10
`, [
    event.eventType,
    event.projectId || "",
    event.taskName,
    event.manager || "",
    event.startDate,
    event.endDate,
    event.status || "planned",
    event.memo || "",
    JSON.stringify(event.confirmUsers || []),
    event.id
]);

            await emitAll();
        } catch (err) {
            console.error("updateEvent error:", err);
        }
    });

    socket.on("deleteEvent", async (id) => {
        try {
            await pool.query("DELETE FROM events WHERE id = $1", [id]);
            await emitAll();
        } catch (err) {
            console.error("deleteEvent error:", err);
        }
    });
});

initDb().then(() => {
    server.listen(PORT, () => {
        console.log(`Server running on ${PORT}`);
    });
});