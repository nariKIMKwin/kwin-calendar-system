const holidays = {
    "2026-01-01": "신정",

    "2026-02-16": "설날",
    "2026-02-17": "설날",
    "2026-02-18": "설날",

    "2026-03-01": "삼일절",
    "2026-03-02": "대체공휴일",

    "2026-05-05": "어린이날",
    "2026-05-24": "부처님오신날",
    "2026-05-25": "대체공휴일",

    "2026-06-03": "지방선거",
    "2026-06-06": "현충일",

    "2026-08-15": "광복절",
    "2026-08-17": "대체공휴일",

    "2026-09-24": "추석",
    "2026-09-25": "추석",
    "2026-09-26": "추석",

    "2026-10-03": "개천절",
    "2026-10-05": "대체공휴일",
    "2026-10-09": "한글날",

    "2026-12-25": "성탄절"
};

const socket = io();

let events = [];
let projects = [];
let currentDate = new Date();
let viewMode = "month";

let projectSortKey = "";
let projectSortAsc = true;

const calendar = document.getElementById("calendar");
const currentTitle = document.getElementById("currentTitle");

const monthBtn = document.getElementById("monthBtn");
const weekBtn = document.getElementById("weekBtn");
const addBtn = document.getElementById("addBtn");
const projectManageBtn = document.getElementById("projectManageBtn");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const todayBtn = document.getElementById("todayBtn");

const calendarView = document.getElementById("calendarView");
const projectView = document.getElementById("projectView");
const projectTableBody = document.getElementById("projectTableBody");
const addProjectBtn = document.getElementById("addProjectBtn");

const projectModal = document.getElementById("projectModal");
const projectModalTitle = document.getElementById("projectModalTitle");
const projectId = document.getElementById("projectId");
const projectTitle = document.getElementById("projectTitle");
const companyName = document.getElementById("companyName");
const projectNo = document.getElementById("projectNo");
const dueDate = document.getElementById("dueDate");
const projectManager = document.getElementById("projectManager");
const managerPhone = document.getElementById("managerPhone");

const saveProjectBtn = document.getElementById("saveProjectBtn");
const deleteProjectBtn = document.getElementById("deleteProjectBtn");
const closeProjectBtn = document.getElementById("closeProjectBtn");

const eventModal = document.getElementById("eventModal");
const eventModalTitle = document.getElementById("eventModalTitle");

const eventId = document.getElementById("eventId");
const eventType = document.getElementById("eventType");
const projectSelectArea = document.getElementById("projectSelectArea");
const selectedProject = document.getElementById("selectedProject");
const taskName = document.getElementById("taskName");
const manager = document.getElementById("manager");
const startDate = document.getElementById("startDate");
const endDate = document.getElementById("endDate");
const status = document.getElementById("status");
const memo = document.getElementById("memo");

const saveEventBtn = document.getElementById("saveEventBtn");
const deleteEventBtn = document.getElementById("deleteEventBtn");
const closeEventBtn = document.getElementById("closeEventBtn");

socket.on("initData", (data) => {
    events = data.events || [];
    projects = data.projects || [];

    if (projectView.style.display === "block") {
        renderProjectTable();
    } else {
        renderCalendar();
    }
});

function showCalendarView(mode) {
    viewMode = mode;

    calendarView.style.display = "block";
    projectView.style.display = "none";

    if (mode === "month") {
        monthBtn.classList.add("active");
        weekBtn.classList.remove("active");
    } else {
        weekBtn.classList.add("active");
        monthBtn.classList.remove("active");
    }

    projectManageBtn.classList.remove("active");
    renderCalendar();
}

function showProjectView() {
    calendarView.style.display = "none";
    projectView.style.display = "block";

    monthBtn.classList.remove("active");
    weekBtn.classList.remove("active");
    projectManageBtn.classList.add("active");

    currentTitle.textContent = "프로젝트 관리";
    renderProjectTable();
}

monthBtn.onclick = () => {
    showCalendarView("month");
};

weekBtn.onclick = () => {
    showCalendarView("week");
};

projectManageBtn.onclick = () => {
    showProjectView();
};

prevBtn.onclick = () => {
    if (projectView.style.display === "block") return;

    if (viewMode === "month") {
        currentDate.setMonth(currentDate.getMonth() - 1);
    } else {
        currentDate.setDate(currentDate.getDate() - 7);
    }

    renderCalendar();
};

nextBtn.onclick = () => {
    if (projectView.style.display === "block") return;

    if (viewMode === "month") {
        currentDate.setMonth(currentDate.getMonth() + 1);
    } else {
        currentDate.setDate(currentDate.getDate() + 7);
    }

    renderCalendar();
};

todayBtn.onclick = () => {
    currentDate = new Date();
    showCalendarView("month");
};

addBtn.onclick = () => {
    openEventModal();
};

addProjectBtn.onclick = () => {
    openProjectModal();
};

document.addEventListener("click", (e) => {
    const th = e.target.closest("th");
    if (!th) return;

    const sortKey = th.dataset.sort;
    if (!sortKey) return;

    if (projectSortKey === sortKey) {
        projectSortAsc = !projectSortAsc;
    } else {
        projectSortKey = sortKey;
        projectSortAsc = true;
    }

    renderProjectTable();
});

saveProjectBtn.onclick = () => {
    const data = {
        id: projectId.value,
        projectTitle: projectTitle.value.trim(),
        companyName: companyName.value.trim(),
        projectNo: projectNo.value.trim(),
        dueDate: dueDate.value,
        projectManager: projectManager.value.trim(),
        managerPhone: managerPhone.value.trim()
    };

    if (!data.projectTitle || !data.projectNo) {
        alert("프로젝트명과 프로젝트 번호는 필수입니다.");
        return;
    }

    if (data.id) {
        socket.emit("updateProject", data);
    } else {
        delete data.id;
        socket.emit("addProject", data);
    }

    closeProjectModal();
};

deleteProjectBtn.onclick = () => {
    if (!projectId.value) return;

    if (confirm("이 프로젝트를 삭제할까요?\n연결된 일정은 [삭제된 프로젝트]로 표시됩니다.")) {
        socket.emit("deleteProject", projectId.value);
        closeProjectModal();
    }
};

closeProjectBtn.onclick = () => {
    closeProjectModal();
};

saveEventBtn.onclick = () => {
    const data = {
        id: eventId.value,
        eventType: eventType.value,
        projectId: eventType.value === "project" ? selectedProject.value : "",
        taskName: taskName.value.trim(),
        manager: manager.value.trim(),
        startDate: startDate.value,
        endDate: endDate.value,
        status: status.value,
        memo: memo.value.trim()
    };

    if (!data.taskName || !data.startDate || !data.endDate) {
        alert("업무 내용, 시작일, 종료일은 필수입니다.");
        return;
    }

    if (data.eventType === "project" && !data.projectId) {
        alert("프로젝트를 선택해주세요.");
        return;
    }

    if (data.startDate > data.endDate) {
        alert("종료일은 시작일보다 빠를 수 없습니다.");
        return;
    }

    if (data.id) {
        socket.emit("updateEvent", data);
    } else {
        delete data.id;
        socket.emit("addEvent", data);
    }

    closeEventModal();
};

deleteEventBtn.onclick = () => {
    if (!eventId.value) return;

    if (confirm("이 일정을 삭제할까요?")) {
        socket.emit("deleteEvent", eventId.value);
        closeEventModal();
    }
};

closeEventBtn.onclick = () => {
    closeEventModal();
};

eventType.onchange = () => {
    toggleProjectSelect();
};

function renderCalendar() {
    calendar.innerHTML = "";

    const weekHeader = document.createElement("div");
    weekHeader.className = "week-header";

    ["일", "월", "화", "수", "목", "금", "토"].forEach(day => {
        const div = document.createElement("div");
        div.textContent = day;
        weekHeader.appendChild(div);
    });

    calendar.appendChild(weekHeader);

    const grid = document.createElement("div");
    grid.className = "calendar-grid";

    if (viewMode === "week") {
        grid.classList.add("week-mode");
        renderWeek(grid);
    } else {
        renderMonth(grid);
    }

    calendar.appendChild(grid);
}

function renderMonth(grid) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    currentTitle.textContent = `${year}년 ${month + 1}월`;

    const firstDay = new Date(year, month, 1);
    const startDateObj = new Date(year, month, 1 - firstDay.getDay());

    for (let i = 0; i < 42; i++) {
        const dateObj = new Date(startDateObj);
        dateObj.setDate(startDateObj.getDate() + i);

        const cell = createDayCell(dateObj);

        if (dateObj.getMonth() !== month) {
            cell.classList.add("other-month");
        }

        grid.appendChild(cell);
    }
}

function renderWeek(grid) {
    const base = new Date(currentDate);
    const day = base.getDay();
    const start = new Date(base);
    start.setDate(base.getDate() - day);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    currentTitle.textContent =
        `${formatDateKorean(start)} ~ ${formatDateKorean(end)}`;

    for (let i = 0; i < 7; i++) {
        const dateObj = new Date(start);
        dateObj.setDate(start.getDate() + i);
        grid.appendChild(createDayCell(dateObj));
    }
}
function createDayCell(dateObj) {

    const cell = document.createElement("div");
    cell.className = "day-cell";

    if (isToday(dateObj)) {
        cell.classList.add("today");
    }

    const dateStr = formatDate(dateObj);

    const dayNumber = document.createElement("div");
    dayNumber.className = "day-number";

    const day = dateObj.getDay();

    // 일요일
    if (day === 0) {
        dayNumber.classList.add("sunday");
    }

    // 토요일
    if (day === 6) {
        dayNumber.classList.add("saturday");
    }

    // 공휴일
    if (holidays[dateStr]) {
        dayNumber.classList.add("sunday");
    }

    dayNumber.textContent = dateObj.getDate();

    cell.appendChild(dayNumber);

    // 공휴일 이름 표시
    if (holidays[dateStr]) {

        const holidayName = document.createElement("div");
        holidayName.className = "holiday-name";
        holidayName.textContent = holidays[dateStr];

        cell.appendChild(holidayName);
    }

    const dayEvents = events.filter(e =>
        isDateInRange(dateStr, e.startDate, e.endDate)
    );

    dayEvents.forEach(e => {

        const item = document.createElement("div");
        item.className = `event-item ${getEventColorClass(e)}`;

        const display = getEventDisplayText(e);

        item.innerHTML = `
            <div class="event-title-line">${escapeHtml(display.titleLine)}</div>
            <div class="event-task-line">${escapeHtml(display.taskLine)}</div>
        `;

        item.onclick = () => {
            openEventModal(e);
        };

        cell.appendChild(item);
    });

    cell.ondblclick = () => {
        openEventModal(null, dateStr);
    };

    return cell;
}
function renderProjectTable() {
    projectTableBody.innerHTML = "";

    let sortedProjects = [...projects];

    if (projectSortKey === "projectNo") {
        sortedProjects.sort((a, b) => {
            const numA = getProjectNumber(a.projectNo);
            const numB = getProjectNumber(b.projectNo);
            return projectSortAsc ? numA - numB : numB - numA;
        });
    }

    if (projectSortKey === "companyName") {
        sortedProjects.sort((a, b) => {
            const nameA = a.companyName || "";
            const nameB = b.companyName || "";
            return projectSortAsc
                ? nameA.localeCompare(nameB, "ko")
                : nameB.localeCompare(nameA, "ko");
        });
    }

    if (projectSortKey === "dueDate") {
        sortedProjects.sort((a, b) => {
            const dateA = a.dueDate || "9999-12-31";
            const dateB = b.dueDate || "9999-12-31";
            return projectSortAsc
                ? dateA.localeCompare(dateB)
                : dateB.localeCompare(dateA);
        });
    }

    if (sortedProjects.length === 0) {
        projectTableBody.innerHTML = `
            <tr>
                <td colspan="7">등록된 프로젝트가 없습니다.</td>
            </tr>
        `;
        return;
    }

    sortedProjects.forEach(project => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${escapeHtml(project.projectNo)}</td>
            <td>${escapeHtml(project.projectTitle)}</td>
            <td>${escapeHtml(project.companyName || "")}</td>
            <td>${escapeHtml(project.dueDate || "")}</td>
            <td>${escapeHtml(project.projectManager || "")}</td>
            <td>${escapeHtml(project.managerPhone || "")}</td>
            <td>
                <button class="table-btn edit-btn">수정</button>
                <button class="table-btn remove-btn">삭제</button>
            </td>
        `;

        tr.querySelector(".edit-btn").onclick = () => {
            openProjectModal(project);
        };

        tr.querySelector(".remove-btn").onclick = () => {
            if (confirm("이 프로젝트를 삭제할까요?\n연결된 일정은 [삭제된 프로젝트]로 표시됩니다.")) {
                socket.emit("deleteProject", project.id);
            }
        };

        projectTableBody.appendChild(tr);
    });
}

function getProjectNumber(projectNo) {
    if (!projectNo) return 999999999;

    const parts = projectNo.split("-");
    if (parts.length < 2) return 999999999;

    const num = parseInt(parts[1].replace(/\D/g, ""), 10);
    return isNaN(num) ? 999999999 : num;
}

function getEventDisplayText(event) {
    if (event.eventType === "project") {
        const project = projects.find(p => p.id === event.projectId);

        if (project) {
            return {
                titleLine: `[${project.projectNo}] ${project.projectTitle}`,
                taskLine: `${event.taskName}${event.manager ? ` (${event.manager})` : ""}`
            };
        }

        return {
            titleLine: "[삭제된 프로젝트]",
            taskLine: `${event.taskName}${event.manager ? ` (${event.manager})` : ""}`
        };
    }

    const typeName = getEventTypeName(event.eventType);

    return {
        titleLine: `[${typeName}]`,
        taskLine: `${event.taskName}${event.manager ? ` (${event.manager})` : ""}`
    };
}

function getEventTypeName(type) {
    if (type === "etc") return "기타 업무";
    if (type === "notice") return "공지사항";
    if (type === "family") return "경조사";
    return "일정";
}

function getEventColorClass(event) {
    if (event.eventType === "notice") return "notice-bg";
    if (event.eventType === "family") return "family-bg";
    return `${event.status}-bg`;
}

function openProjectModal(project = null) {
    projectModal.classList.add("show");

    if (project) {
        projectModalTitle.textContent = "프로젝트 수정";
        projectId.value = project.id;
        projectTitle.value = project.projectTitle || "";
        companyName.value = project.companyName || "";
        projectNo.value = project.projectNo || "";
        dueDate.value = project.dueDate || "";
        projectManager.value = project.projectManager || "";
        managerPhone.value = project.managerPhone || "";
        deleteProjectBtn.style.display = "inline-block";
    } else {
        projectModalTitle.textContent = "프로젝트 추가";
        projectId.value = "";
        projectTitle.value = "";
        companyName.value = "";
        projectNo.value = "";
        dueDate.value = "";
        projectManager.value = "";
        managerPhone.value = "";
        deleteProjectBtn.style.display = "none";
    }
}

function closeProjectModal() {
    projectModal.classList.remove("show");
}

function openEventModal(event = null, selectedDate = "") {
    eventModal.classList.add("show");
    fillProjectSelect();

    if (event) {
        eventModalTitle.textContent = "일정 수정";
        eventId.value = event.id;
        eventType.value = event.eventType || "project";
        selectedProject.value = event.projectId || "";
        taskName.value = event.taskName || "";
        manager.value = event.manager || "";
        startDate.value = event.startDate || "";
        endDate.value = event.endDate || "";
        status.value = event.status || "planned";
        memo.value = event.memo || "";
        deleteEventBtn.style.display = "inline-block";
    } else {
        eventModalTitle.textContent = "일정 추가";
        eventId.value = "";
        eventType.value = "project";
        selectedProject.value = "";
        taskName.value = "";
        manager.value = "";
        startDate.value = selectedDate || formatDate(new Date());
        endDate.value = selectedDate || formatDate(new Date());
        status.value = "planned";
        memo.value = "";
        deleteEventBtn.style.display = "none";
    }

    toggleProjectSelect();
}

function closeEventModal() {
    eventModal.classList.remove("show");
}

function fillProjectSelect() {
    selectedProject.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "프로젝트를 선택하세요";
    selectedProject.appendChild(defaultOption);

    projects.forEach(p => {
        const option = document.createElement("option");
        option.value = p.id;
        option.textContent = `[${p.projectNo}] ${p.projectTitle}`;
        selectedProject.appendChild(option);
    });
}

function toggleProjectSelect() {
    projectSelectArea.style.display = eventType.value === "project" ? "block" : "none";
}

function isDateInRange(date, start, end) {
    return date >= start && date <= end;
}

function formatDate(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, "0");
    const d = String(dateObj.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function formatDateKorean(dateObj) {
    return `${dateObj.getFullYear()}년 ${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일`;
}

function isToday(dateObj) {
    const today = new Date();
    return formatDate(today) === formatDate(dateObj);
}

function escapeHtml(text) {
    return String(text || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}