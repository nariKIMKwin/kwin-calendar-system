// =========================
// 테마 변경
// =========================

const themeButtons = document.querySelectorAll(".theme-btn");

themeButtons.forEach(btn => {

    btn.addEventListener("click", () => {

        const theme = btn.dataset.theme;

        document.body.classList.remove(
            "theme-white",
            "theme-navy",
            "theme-charcoal",
            "theme-gray",
            "theme-black"
        );

        document.body.classList.add(`theme-${theme}`);

        localStorage.setItem("theme", theme);

    });

});

// 저장된 테마 적용
const savedTheme = localStorage.getItem("theme") || "white";

document.body.classList.add(`theme-${savedTheme}`);

// =========================
// 공휴일
// =========================
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

// =========================
// 기본 변수
// =========================
const socket = io();

let events = [];
let projects = [];
let currentDate = new Date();
let viewMode = "month";

let projectSortKey = "";
let projectSortAsc = true;

let eventLineMap = {};
let maxEventLine = -1;

const calendar = document.getElementById("calendar");
const currentTitle = document.getElementById("currentTitle");

const monthBtn = document.getElementById("monthBtn");
const weekBtn = document.getElementById("weekBtn");
const addBtn = document.getElementById("addBtn");
const projectManageBtn = document.getElementById("projectManageBtn");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const todayBtn = document.getElementById("todayBtn");

const projectView = document.getElementById("projectView");
const projectTableBody = document.getElementById("projectTableBody");
const addProjectBtn = document.getElementById("addProjectBtn");

const projectScheduleView = document.getElementById("projectScheduleView");
const scheduleProjectTitle = document.getElementById("scheduleProjectTitle");
const scheduleProjectInfo = document.getElementById("scheduleProjectInfo");
const projectScheduleTableBody = document.getElementById("projectScheduleTableBody");
const backToProjectBtn = document.getElementById("backToProjectBtn");
const addProjectScheduleBtn = document.getElementById("addProjectScheduleBtn");

let currentScheduleProjectId = "";

const projectModal = document.getElementById("projectModal");
const projectModalTitle = document.getElementById("projectModalTitle");
const projectId = document.getElementById("projectId");
const projectNo = document.getElementById("projectNo");
const projectTitle = document.getElementById("projectTitle") || document.getElementById("projectName");
const companyName = document.getElementById("companyName");
const dueDate = document.getElementById("dueDate");
const projectManager = document.getElementById("projectManager");
const managerPhone = document.getElementById("managerPhone") || document.getElementById("projectPhone");

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

// =========================
// 테마 변경
// =========================
window.addEventListener("DOMContentLoaded", () => {
    const savedTheme = localStorage.getItem("theme") || "white";
    applyTheme(savedTheme);

    document.querySelectorAll(".theme-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const theme = btn.dataset.theme;
            applyTheme(theme);
            localStorage.setItem("theme", theme);
        });
    });
});

function applyTheme(theme) {
    document.body.classList.remove(
        "theme-white",
        "theme-navy",
        "theme-charcoal",
        "theme-gray",
        "theme-black"
    );

    document.body.classList.add(`theme-${theme}`);
}

// =========================
// 서버 데이터
// =========================
socket.on("initData", (data) => {
    events = data.events || [];
    projects = data.projects || [];

    if (projectScheduleView && projectScheduleView.style.display === "block") {
        renderProjectScheduleTable();
    } else if (projectView && projectView.style.display === "block") {
        renderProjectTable();
    } else {
        renderCalendar();
    }
});

// =========================
// 화면 전환
// =========================
function showCalendarView(mode) {
    viewMode = mode;

    calendar.style.display = "block";
    if (projectView) projectView.style.display = "none";
    if (projectScheduleView) projectScheduleView.style.display = "none";
    currentScheduleProjectId = "";

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
    calendar.style.display = "none";
    if (projectView) projectView.style.display = "block";
    if (projectScheduleView) projectScheduleView.style.display = "none";
    currentScheduleProjectId = "";

    monthBtn.classList.remove("active");
    weekBtn.classList.remove("active");
    projectManageBtn.classList.add("active");

    currentTitle.textContent = "프로젝트 관리";
    renderProjectTable();
}

// =========================
// 버튼 이벤트
// =========================
monthBtn.onclick = () => showCalendarView("month");
weekBtn.onclick = () => showCalendarView("week");
projectManageBtn.onclick = () => showProjectView();

prevBtn.onclick = () => {
    if (projectView && projectView.style.display === "block") return;
    if (projectScheduleView && projectScheduleView.style.display === "block") return;

    if (viewMode === "month") {
        currentDate.setMonth(currentDate.getMonth() - 1);
    } else {
        currentDate.setDate(currentDate.getDate() - 7);
    }

    renderCalendar();
};

nextBtn.onclick = () => {
    if (projectView && projectView.style.display === "block") return;
    if (projectScheduleView && projectScheduleView.style.display === "block") return;

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

addBtn.onclick = () => openEventModal();

if (addProjectBtn) {
    addProjectBtn.onclick = () => openProjectModal();
}

if (backToProjectBtn) {
    backToProjectBtn.onclick = () => showProjectView();
}

if (addProjectScheduleBtn) {
    addProjectScheduleBtn.onclick = () => {
        if (!currentScheduleProjectId) return;
        openEventModal(null, "", currentScheduleProjectId);
    };
}

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

// =========================
// 프로젝트 저장
// =========================
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

closeProjectBtn.onclick = () => closeProjectModal();

// =========================
// 일정 저장
// =========================
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

closeEventBtn.onclick = () => closeEventModal();

eventType.onchange = () => toggleProjectSelect();

// =========================
// 달력 렌더링
// =========================
function renderCalendar() {
    calendar.innerHTML = "";

    const weekHeader = document.createElement("div");
    weekHeader.className = "week-header";

    ["일", "월", "화", "수", "목", "금", "토"].forEach((day, index) => {
        const div = document.createElement("div");
        div.textContent = day;

        if (index === 0) div.style.color = "#ff5c5c";
        if (index === 6) div.style.color = "#4ea1ff";

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

    const endDateObj = new Date(startDateObj);
    endDateObj.setDate(startDateObj.getDate() + 41);

    prepareEventLines(formatDate(startDateObj), formatDate(endDateObj));

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

    currentTitle.textContent = `${formatDateKorean(start)} ~ ${formatDateKorean(end)}`;

    prepareEventLines(formatDate(start), formatDate(end));

    for (let i = 0; i < 7; i++) {
        const dateObj = new Date(start);
        dateObj.setDate(start.getDate() + i);
        grid.appendChild(createDayCell(dateObj));
    }
}

// =========================
// 일정 줄 번호 계산
// =========================
function prepareEventLines(viewStart, viewEnd) {
    eventLineMap = {};
    maxEventLine = -1;

    const visibleEvents = events
        .filter(e => rangesOverlap(e.startDate, e.endDate, viewStart, viewEnd))
        .sort((a, b) => {
            if (a.startDate !== b.startDate) {
                return a.startDate.localeCompare(b.startDate);
            }

            return a.endDate.localeCompare(b.endDate);
        });

    const lineUsedRanges = [];

    visibleEvents.forEach(event => {
        const start = maxDate(event.startDate, viewStart);
        const end = minDate(event.endDate, viewEnd);

        let line = 0;

        while (true) {
            if (!lineUsedRanges[line]) {
                lineUsedRanges[line] = [];
            }

            const hasConflict = lineUsedRanges[line].some(range =>
                rangesOverlap(start, end, range.start, range.end)
            );

            if (!hasConflict) {
                lineUsedRanges[line].push({ start, end });
                eventLineMap[event.id] = line;
                maxEventLine = Math.max(maxEventLine, line);
                break;
            }

            line++;
        }
    });
}

// =========================
// 날짜칸 생성
// =========================
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

    if (day === 0) dayNumber.classList.add("sunday");
    if (day === 6) dayNumber.classList.add("saturday");
    if (holidays[dateStr]) dayNumber.classList.add("sunday");

    dayNumber.textContent = dateObj.getDate();
    cell.appendChild(dayNumber);

    if (holidays[dateStr]) {
        const holidayName = document.createElement("div");
        holidayName.className = "holiday-name";
        holidayName.textContent = holidays[dateStr];
        cell.appendChild(holidayName);
    }

    const eventArea = document.createElement("div");
    eventArea.className = "event-area";

    for (let line = 0; line <= maxEventLine; line++) {
        const event = events.find(e =>
            eventLineMap[e.id] === line &&
            isDateInRange(dateStr, e.startDate, e.endDate)
        );

        if (event) {
            eventArea.appendChild(createEventItem(event));
        } else {
            const placeholder = document.createElement("div");
            placeholder.className = "event-placeholder";
            eventArea.appendChild(placeholder);
        }
    }

    cell.appendChild(eventArea);

    cell.ondblclick = () => {
        openEventModal(null, dateStr);
    };

    return cell;
}

function createEventItem(e) {
    const item = document.createElement("div");
    item.className = `event-item ${getEventColorClass(e)}`;

    const display = getEventDisplayText(e);

    item.innerHTML = `
        <div class="event-title-line">${escapeHtml(display.titleLine)}</div>
        <div class="event-task-line">${escapeHtml(display.taskLine)}</div>
    `;

    item.onclick = (event) => {
        event.stopPropagation();
        openEventModal(e);
    };

    return item;
}

// =========================
// 프로젝트 관리 테이블
// =========================
function renderProjectTable() {
    if (!projectTableBody) return;

    projectTableBody.innerHTML = "";

    let sortedProjects = [...projects];

    if (projectSortKey === "projectNo") {
        sortedProjects.sort((a, b) => {
            const numA = getProjectNumber(a.projectNo);
            const numB = getProjectNumber(b.projectNo);
            return projectSortAsc ? numA - numB : numB - numA;
        });
    }

    if (projectSortKey === "companyName" || projectSortKey === "company") {
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
                <button class="table-btn schedule-btn">일정 관리</button>
                <button class="table-btn edit-btn">수정</button>
                <button class="table-btn remove-btn">삭제</button>
            </td>
        `;

        tr.querySelector(".schedule-btn").onclick = () => {
            openProjectScheduleView(project.id);
        };

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


// =========================
// 프로젝트별 일정 관리
// =========================
function openProjectScheduleView(projectId) {
    currentScheduleProjectId = projectId;

    calendar.style.display = "none";
    if (projectView) projectView.style.display = "none";
    if (projectScheduleView) projectScheduleView.style.display = "block";

    monthBtn.classList.remove("active");
    weekBtn.classList.remove("active");
    projectManageBtn.classList.add("active");

    renderProjectScheduleTable();
}

function renderProjectScheduleTable() {
    if (!projectScheduleTableBody || !currentScheduleProjectId) return;

    const project = projects.find(p => p.id === currentScheduleProjectId);

    if (!project) {
        scheduleProjectTitle.textContent = "프로젝트 일정 관리";
        scheduleProjectInfo.textContent = "프로젝트 정보를 찾을 수 없습니다.";
        projectScheduleTableBody.innerHTML = `
            <tr>
                <td colspan="6">프로젝트 정보를 찾을 수 없습니다.</td>
            </tr>
        `;
        return;
    }

    currentTitle.textContent = "프로젝트 일정 관리";
    scheduleProjectTitle.textContent = `[${project.projectNo}] ${project.projectTitle}`;
    scheduleProjectInfo.textContent = `${project.companyName || "업체명 없음"} / 납기일: ${project.dueDate || "미정"}`;

    const projectEvents = events
        .filter(e => e.eventType === "project" && e.projectId === currentScheduleProjectId)
        .sort((a, b) => {
            if ((a.startDate || "") !== (b.startDate || "")) {
                return (a.startDate || "").localeCompare(b.startDate || "");
            }
            return (a.endDate || "").localeCompare(b.endDate || "");
        });

    if (projectEvents.length === 0) {
        projectScheduleTableBody.innerHTML = `
            <tr>
                <td colspan="6">등록된 세부 일정이 없습니다.</td>
            </tr>
        `;
        return;
    }

    projectScheduleTableBody.innerHTML = "";

    projectEvents.forEach(event => {
        const tr = document.createElement("tr");
        const statusName = getStatusName(event.status);

        tr.innerHTML = `
            <td>${escapeHtml(formatShortDate(event.startDate))} ~ ${escapeHtml(formatShortDate(event.endDate))}</td>
            <td class="schedule-task-cell">${escapeHtml(event.taskName || "")}</td>
            <td>${escapeHtml(event.manager || "")}</td>
            <td><span class="status-badge ${escapeHtml(event.status || "planned")}-badge">${escapeHtml(statusName)}</span></td>
            <td class="schedule-memo-cell">${escapeHtml(event.memo || "")}</td>
            <td>
                <button class="table-btn edit-schedule-btn">수정</button>
                <button class="table-btn remove-schedule-btn">삭제</button>
            </td>
        `;

        tr.querySelector(".edit-schedule-btn").onclick = () => {
            openEventModal(event);
        };

        tr.querySelector(".remove-schedule-btn").onclick = () => {
            if (confirm("이 세부 일정을 삭제할까요?")) {
                socket.emit("deleteEvent", event.id);
            }
        };

        projectScheduleTableBody.appendChild(tr);
    });
}

// =========================
// 표시 문구
// =========================
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

// =========================
// 모달
// =========================
function openProjectModal(project = null) {
    projectModal.classList.add("show");

    if (project) {
        projectModalTitle.textContent = "프로젝트 수정";
        projectId.value = project.id;
        projectNo.value = project.projectNo || "";
        projectTitle.value = project.projectTitle || "";
        companyName.value = project.companyName || "";
        dueDate.value = project.dueDate || "";
        projectManager.value = project.projectManager || "";
        managerPhone.value = project.managerPhone || "";
        deleteProjectBtn.style.display = "inline-block";
    } else {
        projectModalTitle.textContent = "프로젝트 추가";
        projectId.value = "";
        projectNo.value = "";
        projectTitle.value = "";
        companyName.value = "";
        dueDate.value = "";
        projectManager.value = "";
        managerPhone.value = "";
        deleteProjectBtn.style.display = "none";
    }
}

function closeProjectModal() {
    projectModal.classList.remove("show");
}

function openEventModal(event = null, selectedDate = "", defaultProjectId = "") {
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
        selectedProject.value = defaultProjectId || "";
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

// =========================
// 공통 함수
// =========================
function isDateInRange(date, start, end) {
    return date >= start && date <= end;
}

function rangesOverlap(start1, end1, start2, end2) {
    return start1 <= end2 && end1 >= start2;
}

function maxDate(a, b) {
    return a > b ? a : b;
}

function minDate(a, b) {
    return a < b ? a : b;
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

function getStatusName(status) {
    if (status === "planned") return "예정";
    if (status === "progress") return "진행중";
    if (status === "done") return "완료";
    if (status === "delay") return "지연";
    if (status === "hold") return "보류";
    return "예정";
}

function formatShortDate(dateText) {
    if (!dateText) return "";

    const parts = dateText.split("-");
    if (parts.length !== 3) return dateText;

    return `${Number(parts[1])}/${Number(parts[2])}`;
}

function getProjectNumber(projectNo) {
    if (!projectNo) return 999999999;

    const parts = projectNo.split("-");
    if (parts.length < 2) return 999999999;

    const num = parseInt(parts[1].replace(/\D/g, ""), 10);
    return isNaN(num) ? 999999999 : num;
}

function escapeHtml(text) {
    return String(text || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}