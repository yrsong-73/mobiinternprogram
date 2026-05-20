// ──────────────────────────────────────────────
// CLIENT-ONLY AUTH + SYNC SCAFFOLD
// ──────────────────────────────────────────────
const SLOT_HEIGHT = 84; // 30분 단위 셀 높이
const AUTH_STORAGE_KEY = 'mobidaysLoggedInUser';
const APP_STATE_KEY = 'mobidaysAppState';

const USERS = [
  { name:'송유림', email:'yrsong@mobidays.com', role:'CO1' },
  { name:'김연준', email:'yeonjun.kim@mobidays.com', role:'CO1' },
  { name:'정의창', email:'jeong.ichang@intern.mobidays.com', role:'Member' },
  { name:'백호정', email:'baek.hojeong@intern.mobidays.com', role:'Intern' },
  { name:'김수연', email:'kim.suyeon@intern.mobidays.com', role:'Intern' },
  { name:'국정현', email:'guk.jeonghyun@intern.mobidays.com', role:'Intern' },
  { name:'최재언', email:'choi.jaeeon@intern.mobidays.com', role:'Intern' },
  { name:'박예슬', email:'park.yesul@intern.mobidays.com', role:'Intern' },
  { name:'이동제', email:'lee.dongje@intern.mobidays.com', role:'Intern' },
  { name:'정원형', email:'jeong.wonhyung@intern.mobidays.com', role:'Intern' },
  { name:'정수빈', email:'jeong.subin@intern.mobidays.com', role:'Intern' },
  { name:'오지원', email:'oh.jiwon@intern.mobidays.com', role:'Intern' },
  { name:'최민석', email:'choi.minseok@intern.mobidays.com', role:'Intern' },
];

const ACCESS_MAP = {
  schedule: ['CO1','Member','Intern'],
  dashboard: ['CO1','Member'],
  record: ['CO1'],
  video: ['CO1','Intern'],
  perm: ['CO1']
};

let currentUser = null;
let currentRole = null;
let currentJob = 'marketing';
let checkState = {};
let evalCheckState = {};
let assignLinks = {};
let hrdEditMode = false;
let parsedResumeData = null;
let currentVideoDay = 'day1';
let currentVideoIdx = 0;
let videoProgress = {};
let videoCompletedSet = new Set();
let videoSimTimer = null;
let currentSpeed = 1;
let records = [
  { intern:'정의창', author:'송유림', date:'2026-03-16', content:'간담회 질문 - 시간이 아깝지않게 하려면 뭐가 있나?/선호하는 리더 스타일\n앞자리 효과도 있지만 교육에 적극적으로 참여함. 엑셀 미숙.\n마케팅 전략에 대한 센스가 있는 것 같음. 개선된다면 현업 실무가 빠르게 늘 것 같음.' },
  { intern:'백호정', author:'송유림', date:'2026-03-17', content:'RFP분석 실습 작성률 50%미만. 4일차 9시 20분 도착.\n똘똘이 스타일로 보임. 성실하고 매력도 있음. 매체 전략에서 센스와 역량을 보임.' },
  { intern:'김수연', author:'김연준', date:'2026-03-18', content:'위염으로 두통이 심했으나 지금은 나아졌다고 함.\n과제 실습 기간에 AI 플랫폼을 많이 활용하는 것 같음. 마케팅 경력자로서 교육 콘텐츠가 실제 마케터에게 필요한 내용으로 구성되어 유익했다고 함.' },
  { intern:'정원형', author:'김연준', date:'2026-03-20', content:'업무 투입 시 어떤 일을 하게 될지, 어떤 개발환경에서 일할 수 있는지에 대한 관심과 질문이 많은 편. 적극적이고 의욕있음.' },
];

let permUsers = [
  { name:'송유림', email:'yrsong@mobidays.com', role:'CO1' },
  { name:'김연준', email:'yeonjun.kim@mobidays.com', role:'CO1' },
  ...INTERNS.map(i => ({ name: i.name, email: i.name.replace(/\s+/g,'').toLowerCase() + '@intern.mobidays.com', role: 'Intern' }))
];

function initApp() {
  populateLoginOptions();
  loadAuthFromStorage();
  loadAppStateFromStorage();
  renderNavUser();
  applyRole(currentRole || 'Intern');
  renderSchedule();
  renderDashboard();
  renderRecords();
  renderPermPage();
  updateVideoJobDayOptions();
  if (!currentUser) showLoginOverlay();
  window.addEventListener('storage', handleExternalStorageUpdate);
}

function populateLoginOptions() {
  const select = document.getElementById('login-user-select');
  if (!select) return;
  select.innerHTML = USERS.map(u => `<option value="${u.email}">${u.name} (${u.role})</option>`).join('');
}

function handleLogin() {
  const selectedEmail = document.getElementById('login-user-select').value;
  const user = USERS.find(u => u.email === selectedEmail);
  if (!user) {
    showLoginAlert('계정을 선택해주세요');
    return;
  }
  setCurrentUser(user);
}

function setCurrentUser(user) {
  currentUser = { name: user.name, email: user.email };
  currentRole = user.role;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
  localStorage.setItem('mobidaysLoggedInRole', currentRole);
  renderAuthState();
  renderNavTabs();
  renderNavUser();
  hideLoginOverlay();
  showPage('schedule');
  saveStateToStorage();
}

function logout() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem('mobidaysLoggedInRole');
  currentUser = null;
  currentRole = null;
  renderAuthState();
  showLoginOverlay();
}

function loadAuthFromStorage() {
  const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
  const storedRole = localStorage.getItem('mobidaysLoggedInRole');
  if (storedUser && storedRole) {
    try {
      currentUser = JSON.parse(storedUser);
      currentRole = storedRole;
    } catch (err) {
      currentUser = null;
      currentRole = null;
    }
  }
}

function renderAuthState() {
  const userNameEl = document.getElementById('nav-username');
  const badgeEl = document.getElementById('nav-role-badge');
  const logoutBtn = document.getElementById('logout-btn');
  if (userNameEl) userNameEl.textContent = currentUser ? currentUser.name : '로그인 필요';
  if (badgeEl) {
    if (!currentRole) {
      badgeEl.className = 'nav-role-badge';
      badgeEl.textContent = 'Guest';
    } else {
      badgeEl.className = 'nav-role-badge ' + (currentRole === 'CO1' ? 'hrd' : 'intern');
      badgeEl.textContent = currentRole;
    }
  }
  if (logoutBtn) logoutBtn.style.display = currentUser ? '' : 'none';
  const pageAccessMsg = document.getElementById('access-status');
  if (pageAccessMsg) {
    pageAccessMsg.textContent = currentUser ? `${currentUser.name}님으로 로그인 되었습니다` : '로그인 후 접근 권한이 활성화됩니다';
  }
}

function showLoginOverlay() {
  const overlay = document.getElementById('login-overlay');
  if (overlay) overlay.style.display = 'flex';
}

function hideLoginOverlay() {
  const overlay = document.getElementById('login-overlay');
  if (overlay) overlay.style.display = 'none';
}

function showLoginAlert(message) {
  const alert = document.getElementById('login-alert');
  if (!alert) return;
  alert.style.display = 'block';
  alert.textContent = message;
}

function canAccess(page) {
  return currentRole && ACCESS_MAP[page] && ACCESS_MAP[page].includes(currentRole);
}

function renderNavTabs() {
  document.querySelectorAll('.nav-tab').forEach(tab => {
    const page = tab.dataset.page;
    if (!page) return;
    tab.style.display = canAccess(page) ? '' : 'none';
  });
}

function handleExternalStorageUpdate(event) {
  if (!event.key) return;
  if (event.key === AUTH_STORAGE_KEY || event.key === 'mobidaysLoggedInRole') {
    loadAuthFromStorage();
    renderAuthState();
    renderNavTabs();
    if (!currentUser) showLoginOverlay();
  }
  if (event.key === APP_STATE_KEY) {
    loadAppStateFromStorage();
    renderSchedule();
    renderDashboard();
    renderRecords();
    renderPermPage();
  }
}

function saveStateToStorage() {
  const state = {
    checkState,
    evalCheckState,
    assignLinks,
    videoProgress,
    videoCompleted: Array.from(videoCompletedSet),
    records,
    permUsers
  };
  localStorage.setItem(APP_STATE_KEY, JSON.stringify(state));
}

function loadAppStateFromStorage() {
  const raw = localStorage.getItem(APP_STATE_KEY);
  if (!raw) return;
  try {
    const state = JSON.parse(raw);
    checkState = state.checkState || checkState;
    evalCheckState = state.evalCheckState || evalCheckState;
    assignLinks = state.assignLinks || assignLinks;
    videoProgress = state.videoProgress || videoProgress;
    videoCompletedSet = new Set(state.videoCompleted || []);
    records = state.records || records;
    permUsers = state.permUsers || permUsers;
  } catch (err) {
    console.warn('앱 상태 로드 실패', err);
  }
}

function applyRole(role) {
  currentRole = role;
  const isHrd = role === 'CO1';
  document.querySelectorAll('.hrd-only').forEach(el => {
    el.style.display = isHrd ? '' : 'none';
  });
  const permTab = document.getElementById('perm-tab');
  if (permTab) permTab.style.display = canAccess('perm') ? '' : 'none';
  const badge = document.getElementById('nav-role-badge');
  if (badge) {
    badge.className = 'nav-role-badge ' + (isHrd ? 'hrd' : 'intern');
    badge.textContent = role || 'Guest';
  }
  const resumeSection = document.getElementById('resume-section');
  if (resumeSection) resumeSection.style.display = isHrd ? '' : 'none';
  renderNavTabs();
}

function toggleUserRole() {
  showToast('🔒 권한 변경은 지원되지 않습니다. 다른 계정으로 다시 로그인해주세요.');
}

function toggleHrdEdit() {
  hrdEditMode = !hrdEditMode;
  const btn = document.getElementById('hrd-edit-toggle');
  if (btn) {
    if (hrdEditMode) {
      btn.classList.add('active');
      btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> 편집 완료';
      showToast('✏️ HRD 편집 모드 활성화 — 링크·강의명을 수정할 수 있습니다');
    } else {
      btn.classList.remove('active');
      btn.innerHTML = '<i class="fa-solid fa-pen"></i> HRD 편집 모드';
      showToast('✅ 편집 모드가 종료되었습니다');
    }
  }
  renderSchedule();
}

function timeToSlotIndex(timeStr) {
  const t = timeStr.split('~')[0].trim();
  return TIME_SLOTS.indexOf(t);
}

function durationToSlots(timeStr) {
  const parts = timeStr.split('~');
  if (parts.length < 2) return 1;
  const [sh, sm] = parts[0].trim().split(':').map(Number);
  const [eh, em] = parts[1].trim().split(':').map(Number);
  return ((eh * 60 + em) - (sh * 60 + sm)) / 30;
}

function switchJob(job, btn) {
  currentJob = job;
  document.querySelectorAll('.job-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderSchedule();
}

function renderSchedule() {
  const data = SCHEDULE[currentJob];
  const container = document.getElementById('schedule-content');
  if (!container) return;
  let html = '';

  const renderWeek = (weekData, weekLabel, weekNote) => {
    const wIdx = weekLabel.includes('1') ? 0 : 1;
    const numDays = weekData.length;
    const gridCols = `70px repeat(${numDays}, 1fr)`;

    html += `<div class="week-section">
      <div class="week-header">
        <span class="week-badge">${weekLabel}</span>
        <span class="week-subtitle">${weekNote}</span>
      </div>
      <div class="timetable-wrap">
        <div class="timetable-head" style="grid-template-columns:${gridCols};">
          <div class="timetable-head-time">시간</div>`;

    weekData.forEach((day, di) => {
      const evalDoneKey = `evalDone-${currentJob}-${wIdx}-${di}`;
      const isEvalDone = evalCheckState[evalDoneKey] || false;
      html += `<div class="timetable-head-day">
        <div class="day-n">${day.day}</div>
        <div class="day-date">${day.date}</div>
        <div class="day-eval-wrap">`;
      if (day.eval) {
        html += `<a href="#" class="day-eval" onclick="return false;" style="font-size:9px;"><i class="fa-solid fa-star" style="font-size:8px;"></i>${day.eval}</a>
          <span class="day-eval-check ${isEvalDone?'done':''}" onclick="toggleEvalCheck('${evalDoneKey}',this)" style="font-size:9px;">
            ${isEvalDone ? '<i class="fa-solid fa-check" style="font-size:8px;"></i>평가완료' : '평가완료 체크'}
          </span>`;
      }
      html += `</div></div>`;
    });
    html += `</div>`;

    html += `<div class="timetable-body" style="display:grid;grid-template-columns:${gridCols};">`;
    html += `<div class="timetable-time-col">`;
    TIME_SLOTS.forEach(t => {
      const isLunch = LUNCH_SLOTS.includes(t);
      html += `<div class="timetable-time-slot" style="${isLunch ? 'color:#B45309;background:#FFFDF5;' : ''}">${t}</div>`;
    });
    html += `</div>`;

    weekData.forEach((day, di) => {
      html += `<div class="timetable-day-col" id="col-${wIdx}-${di}">`;
      TIME_SLOTS.forEach((t) => {
        const isLunch = LUNCH_SLOTS.includes(t);
        html += `<div class="timetable-slot${isLunch ? ' lunch-slot' : ''}"></div>`;
      });

      day.lectures.forEach((lec, li) => {
        const key = `${currentJob}-${wIdx}-${di}-${li}`;
        const isChecked = checkState[key] || false;
        const savedLink = assignLinks[key] || '';
        const startIdx = timeToSlotIndex(lec.time);
        const slots = durationToSlots(lec.time);
        if (startIdx < 0) return;

        const topOffset = startIdx * SLOT_HEIGHT;
        const height = slots * SLOT_HEIGHT - 4;
        const typeClass = lec.type || 'online';
        const expandId = `exp-${wIdx}-${di}-${li}`;

        const linksHtml = hrdEditMode
          ? (lec.links || []).map((lnk, lnkIdx) =>
              `<input class="tt-edit-input" value="${lnk}" placeholder="링크명"
                 onchange="updateLectureLink('${currentJob}',${wIdx},${di},${li},${lnkIdx},this.value)"
                 onclick="event.stopPropagation();" style="margin-bottom:4px;">`
            ).join('')
          : (lec.links || []).map(lnk => {
              const isVideo = lnk.includes('영상');
              const isExamLink = lnk.includes('시험');
              let icon = 'fa-link';
              let style = '';
              if (isVideo && lec.hasVideo) {
                return `<button class="video-play-btn" onclick="event.stopPropagation();openVideoFromSchedule('${lec.name}')">▶ 영상 보기</button>`;
              }
              if (isExamLink) { icon = 'fa-file-pen'; style = 'color:#E85D75;background:#FFF0F3;border-color:#F9BFCC;'; }
              return `<a href="#" class="lec-link" onclick="event.stopPropagation();return false;" style="font-size:10.5px;${style}"><i class="fa-solid ${icon}" style="font-size:9px;"></i>${lnk}</a>`;
            }).join('');

        const hasVideoLink = (lec.links || []).some(l => l.includes('영상'));
        const videoBtn = (lec.hasVideo && !hasVideoLink)
          ? `<button class="video-play-btn" onclick="event.stopPropagation();openVideoFromSchedule('${lec.name}')">▶ 영상 보기</button>`
          : '';

        const showCheckRow = lec.type !== 'lunch';
        const checkRow = showCheckRow ? `<div class="check-row" style="width:100%;" onclick="event.stopPropagation();">
          <div class="check-box ${isChecked?'checked':''}" id="chk-${key}" onclick="toggleCheckKey('${key}')" title="수강 완료" style="flex-shrink:0;${lec.hasVideo && !isChecked ? 'opacity:0.5;' : ''}"></div>
          <span class="check-label">${isChecked ? '✅ 수강완료' : '수강 완료'}</span>
        </div>` : '';

        const assignRow = lec.assign ? `<div style="width:100%;margin-top:2px;display:flex;gap:5px;align-items:center;" onclick="event.stopPropagation();">
          <i class="fa-solid fa-paperclip" style="color:var(--text-muted);font-size:10px;flex-shrink:0;"></i>
          <input type="text" class="assign-link-input"
            placeholder="${lec.assignLabel || '제출 링크'}"
            value="${savedLink}"
            onchange="saveAssignLink('${key}',this.value)"
            onclick="event.stopPropagation();" style="flex:1;font-size:11px;">
        </div>` : '';

        const examBadge = lec.isExam
          ? `<span class="lec-tag" style="background:var(--exam-bg);color:var(--exam-color);border:1px solid var(--exam-border);margin-top:3px;display:inline-flex;align-items:center;gap:3px;"><i class="fa-solid fa-star" style="font-size:9px;"></i>공통시험과목</span>`
          : '';

        const nameField = hrdEditMode
          ? `<input class="tt-edit-input" value="${lec.name}"
               onchange="updateLectureName('${currentJob}',${wIdx},${di},${li},this.value)"
               onclick="event.stopPropagation();" style="margin-bottom:4px;font-size:12px;">`
          : `<div class="tt-name" style="flex:1;">${lec.name}</div>`;

        const hrdFields = hrdEditMode ? `
          <div class="tt-edit-group" style="margin-top:6px;">
            <div class="tt-edit-label">시간</div>
            <input class="tt-edit-input" value="${lec.time}"
              onchange="updateLectureTime('${currentJob}',${wIdx},${di},${li},this.value)"
              onclick="event.stopPropagation();" placeholder="10:00~11:00" style="margin-bottom:4px;">
          </div>
          <div class="tt-edit-group">
            <div class="tt-edit-label">요일 이동</div>
            <select class="tt-edit-input" onchange="moveLectureDay('${currentJob}',${wIdx},${di},${li},this.value)" onclick="event.stopPropagation();">
              ${weekData.map((d,ddd)=>`<option value="${ddd}" ${ddd===di?'selected':''}>${d.day} (${d.date})</option>`).join('')}
            </select>
          </div>
          ${linksHtml ? `<div class="tt-edit-group" style="margin-top:4px;"><div class="tt-edit-label">링크</div>${linksHtml}</div>` : ''}
        ` : '';

        const startTimeLabel = lec.time && lec.time !== '최종'
          ? `<div style="font-size:9.5px;font-weight:600;color:var(--text-muted);margin-bottom:2px;letter-spacing:0.2px;">${lec.time.split('~')[0]}</div>`
          : '';

        html += `<div class="tt-cell ${typeClass}"
  id="${expandId}"
  style="top:${topOffset+2}px;min-height:${height}px;height:auto;overflow:visible;z-index:2;"
  title="${lec.name}">
  ${startTimeLabel}
  <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:2px;">
    ${nameField}
    <span style="font-size:10px;color:var(--text-muted);flex-shrink:0;margin-top:1px;">${lec.duration}</span>
  </div>
  ${lec.teacher && lec.teacher !== '-' ? `<div class="tt-meta">${lec.teacher}</div>` : ''}
  <div style="margin-top:5px;display:flex;flex-wrap:wrap;gap:3px;align-items:center;">
    ${examBadge}
    ${linksHtml && !hrdEditMode ? linksHtml : ''}
    ${videoBtn}
    ${checkRow}
    ${assignRow}
    ${hrdFields}
  </div>
</div>`;
      });

      html += `</div>`;
    });

    html += `</div></div></div>`;
  };

  renderWeek(data.week1, 'Week 1', '6/22(월) ~ 6/26(금) · 공통 + 직무별 교육');
  renderWeek(data.week2, 'Week 2', '6/29(월) ~ 7/3(금) · 과제 수행 및 최종 발표');
  container.innerHTML = html;

  setTimeout(() => {
    document.querySelectorAll('.timetable-wrap').forEach(wrap => {
      const timeColumn = wrap.querySelector('.timetable-time-col');
      if (timeColumn) {
        const firstTimeSlot = timeColumn.querySelector('.timetable-time-slot');
        if (firstTimeSlot) {
          wrap.parentElement.scrollTop = Math.max(0, firstTimeSlot.offsetTop - 70);
        }
      }
      wrap.scrollLeft = 0;
    });
  }, 100);

  if (!window._popHandlerSet) {
    document.addEventListener('click', function() {
      document.querySelectorAll('.tt-expandable').forEach(c => {
        const d = c.querySelector('.tt-cell-detail');
        if (d) d.style.display = 'none';
        c.style.height = c.dataset.origHeight || '';
        c.style.zIndex = '';
        c.style.overflow = 'hidden';
      });
    });
    window._popHandlerSet = true;
  }
}

function toggleCellExpand(e, id) {
  e.stopPropagation();
  const cell = document.getElementById(id);
  if (!cell) return;
  const detail = cell.querySelector('.tt-cell-detail');
  if (!detail) return;
  const isOpen = detail.style.display !== 'none';
  document.querySelectorAll('.tt-expandable').forEach(c => {
    if (c.id !== id) {
      const d = c.querySelector('.tt-cell-detail');
      if (d) d.style.display = 'none';
      c.style.height = c.dataset.origHeight || '';
      c.style.zIndex = '';
      c.style.overflow = 'hidden';
    }
  });
  if (isOpen) {
    detail.style.display = 'none';
    cell.style.height = cell.dataset.origHeight || '';
    cell.style.zIndex = '';
    cell.style.overflow = 'hidden';
  } else {
    if (!cell.dataset.origHeight) cell.dataset.origHeight = cell.style.height;
    detail.style.display = 'block';
    cell.style.height = 'auto';
    cell.style.minHeight = cell.dataset.origHeight || '48px';
    cell.style.zIndex = '10';
    cell.style.overflow = 'visible';
  }
}

function toggleCheckKey(key) {
  const parts = key.split('-');
  if (parts.length === 4) {
    const [job, wIdx, di, li] = parts;
    const wKey = wIdx === '0' ? 'week1' : 'week2';
    const lec = SCHEDULE[job]?.[wKey]?.[parseInt(di)]?.lectures?.[parseInt(li)];
    if (lec && lec.hasVideo) {
      const videoKey = findVideoProgressKey(lec.name);
      const progress = videoKey ? (videoProgress[videoKey] || 0) : 0;
      if (progress < 70) {
        showToast('📹 영상을 70% 이상 시청해야 체크할 수 있습니다');
        return;
      }
    }
  }
  checkState[key] = !checkState[key];
  saveStateToStorage();
  renderSchedule();
  showToast(checkState[key] ? '✅ 수강 완료로 표시했습니다' : '수강 체크를 해제했습니다');
}

function findVideoProgressKey(lecName) {
  for (const [dayKey, dayData] of Object.entries(VIDEO_DAYS)) {
    const idx = dayData.lectures.findIndex(l => l.name === lecName);
    if (idx !== -1) return `${dayKey}-${idx}`;
  }
  return null;
}

function updateLectureName(job, wIdx, di, li, val) {
  const wKey = wIdx === 0 ? 'week1' : 'week2';
  SCHEDULE[job][wKey][di].lectures[li].name = val;
}
function updateLectureLink(job, wIdx, di, li, lnkIdx, val) {
  const wKey = wIdx === 0 ? 'week1' : 'week2';
  SCHEDULE[job][wKey][di].lectures[li].links[lnkIdx] = val;
}
function updateLectureTime(job, wIdx, di, li, val) {
  const wKey = wIdx === 0 ? 'week1' : 'week2';
  SCHEDULE[job][wKey][di].lectures[li].time = val;
  showToast('⏰ 시간이 변경되었습니다. 새로고침 후 확인해주세요.');
}
function moveLectureDay(job, wIdx, fromDi, li, toDiStr) {
  const wKey = wIdx === 0 ? 'week1' : 'week2';
  const toDi = parseInt(toDiStr);
  if (toDi === fromDi) return;
  const lec = SCHEDULE[job][wKey][fromDi].lectures.splice(li, 1)[0];
  SCHEDULE[job][wKey][toDi].lectures.push(lec);
  showToast('✅ 강의 이동이 완료되었습니다');
  renderSchedule();
}

function saveAssignLink(key, val) {
  assignLinks[key] = val;
  saveStateToStorage();
  showToast('📎 제출 링크가 저장되었습니다');
}

function renderDashboard() {
  const grid = document.getElementById('intern-cards');
  if (grid) {
    grid.innerHTML = INTERNS.map((intern, idx) => `
      <div class="intern-card ${intern.type}" onclick="highlightTableRow(${idx})">
        <div class="intern-job-badge ${intern.type}">${intern.job}</div>
        <div class="intern-name">${intern.name}</div>
        <div class="intern-info">${intern.mbti} · ${intern.age}</div>
        <div class="intern-stats">
          <div class="istat">
            <div class="istat-val">${intern.attend_rate}%</div>
            <div class="istat-label">수강체크율</div>
          </div>
          <div class="istat">
            <div class="istat-val">${intern.assign_rate}%</div>
            <div class="istat-label">과제제출</div>
          </div>
          <div class="istat">
            <div class="istat-val">${intern.score_mini}<span style="font-size:11px;font-weight:500;">점</span></div>
            <div class="istat-label">미니테스트</div>
          </div>
          <div class="istat">
            <div class="istat-val">${intern.score_test}<span style="font-size:11px;font-weight:500;">점</span></div>
            <div class="istat-label">공통테스트</div>
          </div>
        </div>
        <div class="progress-bar-wrap">
          <div class="progress-bar-fill" id="bar-attend-${idx}" style="width:${intern.attend_rate}%"></div>
        </div>
        <div style="font-size:11px; color:var(--text-muted); margin-top:5px; text-align:right;">수강체크율 ${intern.attend_rate}%</div>
      </div>
    `).join('');
  }

  const tbody = document.getElementById('detail-tbody');
  if (!tbody) return;
  tbody.innerHTML = INTERNS.map((intern, idx) => {
    const editable = currentRole === 'CO1';
    const editAttr = editable ? 'contenteditable="true" style="outline:none;min-width:20px;"' : '';
    const editCellStyle = editable ? 'background:rgba(255,107,43,0.03);' : '';
    return `
    <tr id="dash-row-${idx}" ${editable ? 'class="editable-row"' : ''}>
      <td style="white-space:nowrap;"><strong ${editAttr} data-field="name" data-idx="${idx}" onblur="updateInternField(${idx},'name',this.textContent)">${intern.name}</strong></td>
      <td style="white-space:nowrap;">${jobBadgeHTML(intern)}</td>
      <td style="white-space:nowrap;${editCellStyle}" ${editAttr} data-field="school" data-idx="${idx}" onblur="updateInternField(${idx},'school',this.textContent)">${intern.school}</td>
      <td style="white-space:nowrap;font-size:15.6px;color:var(--text-secondary);${editCellStyle}" ${editAttr} data-field="career" data-idx="${idx}" onblur="updateInternField(${idx},'career',this.textContent)">${intern.career}</td>
      <td style="white-space:nowrap;">
        <span ${editAttr} data-field="attend_rate" data-idx="${idx}" onblur="updateInternField(${idx},'attend_rate',this.textContent)">${intern.attend_rate}%</span>
      </td>
      <td style="white-space:nowrap;"><span ${editAttr} data-field="score_mini" data-idx="${idx}" onblur="updateInternField(${idx},'score_mini',this.textContent)">${intern.score_mini}</span>점</td>
      <td style="white-space:nowrap;"><span ${editAttr} data-field="score_test" data-idx="${idx}" onblur="updateInternField(${idx},'score_test',this.textContent)">${intern.score_test}</span>점</td>
      <td style="white-space:nowrap;"><span ${editAttr} data-field="score_attitude" data-idx="${idx}" onblur="updateInternField(${idx},'score_attitude',this.textContent)">${intern.score_attitude}</span>/5</td>
      <td style="white-space:nowrap;"><span class="badge ok"><i class="fa-solid fa-circle-check" style="font-size:10px;"></i> 정상</span></td>
      <td class="summary-cell" ${editAttr} data-field="summary" data-idx="${idx}" onblur="updateInternField(${idx},'summary',this.textContent)" style="${editCellStyle}">${intern.summary}</td>
    </tr>
  `;
  }).join('');

  const hint = document.getElementById('table-edit-hint');
  if (hint) hint.style.display = currentRole === 'CO1' ? '' : 'none';
}

function jobBadgeHTML(intern) {
  const cls = intern.type;
  return `<span class="intern-job-badge ${cls}" style="font-size:10.5px;padding:2px 8px;margin:0;">${intern.job}</span>`;
}

function highlightTableRow(idx) {
  document.querySelectorAll('#detail-tbody tr').forEach(tr => {
    tr.classList.remove('row-highlighted');
    tr.style.outline = '';
  });
  const row = document.getElementById('dash-row-' + idx);
  if (!row) return;
  row.classList.add('row-highlighted');
  row.style.outline = '2px solid #FF6B2B';
  row.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function updateInternField(idx, field, val) {
  val = val.trim();
  if (field === 'attend_rate' || field === 'score_mini' || field === 'score_test' || field === 'score_attitude') {
    const num = parseFloat(val);
    if (!isNaN(num)) {
      INTERNS[idx][field] = num;
      if (field === 'attend_rate') {
        const bar = document.getElementById('bar-attend-' + idx);
        if (bar) bar.style.width = Math.min(100, num) + '%';
      }
    }
  } else {
    INTERNS[idx][field] = val;
  }
  saveStateToStorage();
  showToast('✅ 정보가 수정되었습니다');
}

const INTERN_NAMES_ALL = ['정의창','백호정','김수연','국정현','최재언','박예슬','이동제','정원형','정수빈','오지원','최민석'];

function renderRecordInputPanel() {
  const author = document.getElementById('rec-author-select').value;
  const panel = document.getElementById('record-input-panel');
  const grid = document.getElementById('record-input-grid');
  if (!author) { panel.style.display = 'none'; return; }
  panel.style.display = 'block';

  const jobBadgeForName = (name) => {
    const intern = INTERNS.find(i => i.name === name);
    if (!intern) return '';
    return `<span class="intern-job-badge ${intern.type}" style="font-size:10px;padding:2px 7px;margin:0;">${intern.job}</span>`;
  };

  grid.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;margin-bottom:20px;">` +
    INTERN_NAMES_ALL.map(name => `
      <div style="background:var(--bg-card);border:1px solid var(--border);border-radius:var(--radius);padding:14px 16px;box-shadow:var(--shadow);">
        <div style="font-size:13px;font-weight:700;color:var(--text-primary);margin-bottom:8px;display:flex;align-items:center;gap:6px;">
          <i class="fa-solid fa-user" style="color:var(--mobi-orange);font-size:12px;"></i>${name}${jobBadgeForName(name)}
        </div>
        <textarea class="form-textarea" id="rec-ta-${name}" placeholder="${name}에 대한 기록 (교육 태도, 면담 내용, 특이사항 등)..." style="min-height:90px;font-size:12.5px;"></textarea>
      </div>
    `).join('') + `</div>`;
}

function saveAllRecords() {
  const author = document.getElementById('rec-author-select').value;
  if (!author) { showToast('⚠️ 작성자를 먼저 선택해주세요'); return; }
  const today = new Date().toISOString().split('T')[0];
  let saved = 0;
  INTERN_NAMES_ALL.forEach(name => {
    const ta = document.getElementById('rec-ta-' + name);
    if (ta && ta.value.trim()) {
      records.unshift({ intern: name, author, date: today, content: ta.value.trim() });
      ta.value = '';
      saved++;
    }
  });
  if (saved === 0) { showToast('⚠️ 입력된 내용이 없습니다'); return; }
  saveStateToStorage();
  renderRecords();
  showToast(`✅ ${saved}건의 기록이 저장되었습니다`);
}

function renderRecords() {
  const filterIntern = document.getElementById('filter-intern').value;
  let filtered = records.filter(r => {
    if (filterIntern && r.intern !== filterIntern) return false;
    return true;
  });

  const list = document.getElementById('record-list');
  if (!list) return;
  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty-state"><i class="fa-regular fa-folder-open"></i><p>기록이 없습니다</p></div>`;
    return;
  }

  const grouped = {};
  filtered.forEach(r => {
    if (!grouped[r.intern]) grouped[r.intern] = [];
    grouped[r.intern].push(r);
  });

  let html = '';
  const order = filterIntern ? [filterIntern] : INTERN_NAMES_ALL.filter(n => grouped[n]);
  order.forEach(name => {
    if (!grouped[name]) return;
    html += `<div class="record-intern-section">
      <div class="record-intern-label"><i class="fa-solid fa-user"></i>${name}</div>
      <div class="record-entries">`;
    grouped[name].forEach((r) => {
      const globalIdx = records.indexOf(r);
      html += `<div class="record-entry">
        <div class="record-entry-header">
          <div class="record-entry-meta">
            <span class="record-author">${r.author}</span>
            <span class="record-date">${r.date}</span>
          </div>
          <button class="btn-secondary" style="padding:5px 10px; font-size:12px;" onclick="deleteRecord(${globalIdx})">
            <i class="fa-regular fa-trash-can"></i>
          </button>
        </div>
        <div class="record-content">${r.content}</div>
      </div>`;
    });
    html += `</div></div>`;
  });
  list.innerHTML = html;
}

function deleteRecord(realIdx) {
  if (!confirm('이 기록을 삭제하시겠습니까?')) return;
  records.splice(realIdx, 1);
  saveStateToStorage();
  renderRecords();
  showToast('🗑️ 기록이 삭제되었습니다');
}

let currentVideoJob = 'marketing';

function onVideoJobChange(job) {
  currentVideoJob = job;
  currentJob = job;
  document.querySelectorAll('.job-tab').forEach(b => {
    const jobMap = {'marketing':'마케팅','aiax':'AI·AX','biz':'사업기획·전략'};
    b.classList.toggle('active', b.textContent.includes(jobMap[job]));
  });
  updateVideoJobDayOptions();
}

function updateVideoJobDayOptions() {
  const sel = document.getElementById('video-day-select');
  if (!sel) return;
  const allDays = [
    {key:'day1', label:'1일차 - 6/22 (월)'},
    {key:'day2', label:'2일차 - 6/23 (화)'},
    {key:'day3', label:'3일차 - 6/24 (수)'},
    {key:'day4', label:'4일차 - 6/25 (목)'},
    {key:'day5', label:'5일차 - 6/26 (금)'},
    {key:'day9', label:'9일차 - 6/30 (화)'},
    {key:'day11', label:'11일차 - 7/2 (목)'},
  ];
  sel.innerHTML = allDays.map(d => `<option value="${d.key}">${d.label}</option>`).join('');
  sel.value = currentVideoDay;
  loadVideoDay(currentVideoDay);
}

function loadVideoDay(dayKey) {
  currentVideoDay = dayKey;
  currentVideoIdx = -1;
  const dayData = VIDEO_DAYS[dayKey];

  const sidebar = document.getElementById('video-sidebar-list');
  if (!dayData || dayData.lectures.length === 0) {
    sidebar.innerHTML = `<div style="padding:20px;text-align:center;color:rgba(255,255,255,0.3);font-size:12px;">해당 일차에 영상 강의가 없습니다</div>`;
    document.getElementById('video-placeholder').style.display = 'flex';
    document.getElementById('video-iframe-wrap').style.display = 'none';
    document.getElementById('video-progress-overlay').style.display = 'none';
    return;
  }

  sidebar.innerHTML = dayData.lectures.map((lec, idx) => {
    const vKey = `${dayKey}-${idx}`;
    const isDone = videoCompletedSet.has(vKey);
    return `<div class="video-sidebar-item ${isDone ? 'completed' : ''}" id="vsitem-${idx}" onclick="selectVideo(${idx})">
      <div class="video-sidebar-item-title">${lec.name}</div>
      <div class="video-sidebar-item-meta">
        <span>${lec.teacher !== '-' ? lec.teacher : ''}</span>
        <span>${lec.duration}</span>
      </div>
    </div>`;
  }).join('');

  selectVideo(0);
}

function selectVideo(idx) {
  const dayData = VIDEO_DAYS[currentVideoDay];
  if (!dayData || !dayData.lectures[idx]) return;
  currentVideoIdx = idx;
  const lec = dayData.lectures[idx];

  if (videoSimTimer) clearInterval(videoSimTimer);

  document.querySelectorAll('.video-sidebar-item').forEach((el, i) => {
    el.classList.toggle('active', i === idx);
  });

  document.getElementById('video-current-title').textContent = lec.name;
  document.getElementById('video-playing-name').textContent = lec.name + ' 재생 중...';
  document.getElementById('video-placeholder').style.display = 'none';
  document.getElementById('video-iframe-wrap').style.display = 'block';
  document.getElementById('video-progress-overlay').style.display = 'flex';

  const vKey = `${currentVideoDay}-${idx}`;
  const savedProgress = videoProgress[vKey] || 0;
  updateProgressUI(savedProgress, vKey);
  if (savedProgress > 0 && savedProgress < 100) {
    showToast(`▶ 이어보기: ${Math.round(savedProgress)}% 지점부터 재생합니다`);
  }

  if (!lec.videoUrl) {
    let prog = savedProgress;
    videoSimTimer = setInterval(() => {
      prog = Math.min(prog + (currentSpeed * 0.5), 100);
      videoProgress[vKey] = prog;
      updateProgressUI(prog, vKey);
      saveStateToStorage();
      if (prog >= 100) clearInterval(videoSimTimer);
    }, 1000);
  }
}

function updateProgressUI(prog, vKey) {
  const fill = document.getElementById('video-progress-fill');
  const label = document.getElementById('video-progress-label');
  const badge = document.getElementById('video-complete-badge');
  if (fill) fill.style.width = prog + '%';
  if (label) label.textContent = Math.round(prog) + '%';
  if (badge) {
    if (prog >= 70) badge.classList.add('show');
    else badge.classList.remove('show');
  }
  if (prog >= 70) videoCompletedSet.add(vKey);
}

function setSpeed(speed, btn) {
  currentSpeed = speed;
  document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  showToast(`▶ 배속 ${speed}x 설정`);
}

function openVideoFromSchedule(lecName) {
  if (!canAccess('video')) {
    showToast('🔒 해당 기능은 현재 권한으로 접근할 수 없습니다');
    return;
  }
  showPage('video');
  for (const [dayKey, dayData] of Object.entries(VIDEO_DAYS)) {
    const idx = dayData.lectures.findIndex(l => l.name === lecName);
    if (idx !== -1) {
      const videoDaySelect = document.getElementById('video-day-select');
      if (videoDaySelect) videoDaySelect.value = dayKey;
      loadVideoDay(dayKey);
      selectVideo(idx);
      return;
    }
  }
  showToast('📹 해당 영상을 뷰어에서 찾을 수 없습니다');
}

function handleResumeDrop(event) {
  event.preventDefault();
  document.getElementById('resume-drop-zone').classList.remove('dragover');
  const file = event.dataTransfer.files[0];
  if (file) handleResumeFile(file);
}

async function handleResumeFile(file) {
  if (!file) return;
  const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
  if (!allowed.includes(file.type) && !file.name.endsWith('.pdf') && !file.name.endsWith('.docx') && !file.name.endsWith('.doc')) {
    showStatus('error', '⚠️ PDF 또는 Word 파일만 지원합니다');
    return;
  }
  showStatus('loading', `⏳ "${file.name}" 파싱 중... Claude AI가 이력서를 분석하고 있습니다`);

  try {
    const base64 = await fileToBase64(file);
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const mediaType = isPdf ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const messages = isPdf ? [
      {
        role: 'user',
        content: [
          { type: 'document', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: `이 이력서 문서에서 다음 정보를 추출하여 JSON으로만 응답해주세요 (마크다운 없이 순수 JSON):\n{\n  "name": "이름",\n  "school": "최종학력 (학교명 + 전공)",\n  "career": "주요 경력 (최신순 1~2개, 짧게)",\n  "mbti": "MBTI (없으면 빈 문자열)",\n  "age": "나이 또는 생년 (없으면 빈 문자열)",\n  "job": "지원 직무 추정 (마케팅/AI·AX/사업기획·전략 중 하나)",\n  "summary": "핵심 역량 및 특징 2~3문장 요약"\n}` }]
      }
    ] : [
      { role: 'user', content: `이력서 내용에서 이름, 학력, 경력, MBTI, 나이, 직무, 역량 요약을 JSON으로 추출해주세요. 파일이 DOCX 형식이라 텍스트로 직접 붙여넣기가 필요합니다. JSON 형식:\n{"name":"","school":"","career":"","mbti":"","age":"","job":"마케팅","summary":""}` }
    ];

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages
      })
    });

    const data = await response.json();
    const rawText = data.content?.map(c => c.text || '').join('');
    const clean = rawText.replace(/```json|```/g, '').trim();
    parsedResumeData = JSON.parse(clean);
    showStatus('done', '✅ 이력서 파싱 완료! 아래 내용을 확인하고 적용해주세요.');
    showResumePreview(parsedResumeData);
  } catch (err) {
    console.error(err);
    showStatus('error', '❌ 파싱 중 오류가 발생했습니다. 다시 시도해주세요.');
  }
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.readAsDataURL(file);
  });
}

function showStatus(type, msg) {
  const el = document.getElementById('resume-status');
  if (!el) return;
  el.className = 'resume-parsing-status ' + type;
  el.textContent = msg;
  el.style.display = 'block';
}

function showResumePreview(data) {
  const preview = document.getElementById('resume-preview');
  const content = document.getElementById('resume-preview-content');
  if (!preview || !content) return;
  preview.style.display = 'block';
  content.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
      <div><strong>이름</strong>: ${data.name || '-'}</div>
      <div><strong>직무</strong>: ${data.job || '-'}</div>
      <div><strong>학력</strong>: ${data.school || '-'}</div>
      <div><strong>MBTI</strong>: ${data.mbti || '-'}</div>
      <div style="grid-column:1/-1"><strong>경력</strong>: ${data.career || '-'}</div>
      <div style="grid-column:1/-1"><strong>요약</strong>: ${data.summary || '-'}</div>
    </div>
  `;
}

function applyResumeData() {
  if (!parsedResumeData) return;
  const d = parsedResumeData;
  const exists = INTERNS.find(i => i.name === d.name);
  if (!exists && d.name) {
    const typeMap = { '마케팅':'marketing', 'AI·AX':'aiax', '사업기획·전략':'biz' };
    INTERNS.push({
      name: d.name,
      job: d.job || '마케팅',
      type: typeMap[d.job] || 'marketing',
      mbti: d.mbti || '-',
      age: d.age || '-',
      school: d.school || '-',
      career: d.career || '-',
      score_mini: 0, score_test: 0, score_attitude: 0,
      summary: d.summary || '',
      attend_rate: 0, assign_rate: 0
    });
    showToast(`✅ ${d.name} 인턴 정보가 추가되었습니다`);
  } else if (exists) {
    Object.assign(exists, {
      school: d.school || exists.school,
      career: d.career || exists.career,
      mbti: d.mbti || exists.mbti,
      summary: d.summary || exists.summary
    });
    showToast(`✅ ${d.name} 인턴 정보가 업데이트되었습니다`);
  }
  document.getElementById('resume-preview').style.display = 'none';
  document.getElementById('resume-status').style.display = 'none';
  parsedResumeData = null;
  saveStateToStorage();
  renderDashboard();
}

function cancelResumeData() {
  document.getElementById('resume-preview').style.display = 'none';
  parsedResumeData = null;
}

function renderPermPage() {
  const list = document.getElementById('perm-intern-list');
  if (!list) return;
  list.innerHTML = permUsers.map((u, idx) => {
    const rc = ROLE_COLORS[u.role] || ROLE_COLORS.Intern;
    return `<div class="perm-row" style="display:grid;grid-template-columns:auto 160px auto 1fr;align-items:center;gap:0;padding:10px 0;">
      <div style="padding:0 8px;display:flex;align-items:center;">
        <button onclick="removePermUser(${idx})" style="padding:4px 8px;border-radius:20px;border:1px solid #FFCFB8;background:#FFF0EA;color:#FF6B2B;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit;line-height:1;" title="삭제">✕</button>
      </div>
      <div style="padding:0 8px;display:flex;align-items:center;gap:10px;">
        <div class="perm-avatar" style="background:${rc.bg};color:${rc.text};border:1px solid ${rc.border};">${u.name[0]}</div>
        <div>
          <div class="perm-name">${u.name}</div>
        </div>
      </div>
      <div style="padding:0 8px;min-width:220px;display:flex;gap:5px;justify-content:center;">
        ${['CO1','Member','Intern'].map(r => `
          <button onclick="setPermRole(${idx}, '${r}', this)" style="
            padding:4px 12px;border-radius:20px;border:1.5px solid ${u.role===r ? ROLE_COLORS[r].border : 'var(--border-strong)'};
            background:${u.role===r ? ROLE_COLORS[r].bg : 'white'};
            color:${u.role===r ? ROLE_COLORS[r].text : 'var(--text-secondary)'};
            font-size:11.5px;font-weight:700;cursor:pointer;font-family:inherit;transition:all 0.15s;"
          >${r}</button>`).join('')}
      </div>
      <div style="padding:0 8px;font-size:12px;color:var(--text-secondary);">${u.email}</div>
    </div>`;
  }).join('');
}

function setPermRole(idx, role) {
  permUsers[idx].role = role;
  saveStateToStorage();
  renderPermPage();
  showToast(`✅ ${permUsers[idx].name} 권한이 ${role}으로 변경되었습니다`);
}

function removePermUser(idx) {
  const name = permUsers[idx].name;
  if (!confirm(`${name}을(를) 목록에서 삭제하시겠습니까?`)) return;
  permUsers.splice(idx, 1);
  saveStateToStorage();
  renderPermPage();
  showToast(`🗑️ ${name}이 목록에서 제거되었습니다`);
}

function showAddUserModal() {
  const modal = document.getElementById('add-user-modal');
  if (!modal) return;
  modal.style.display = 'flex';
  document.getElementById('new-user-name').value = '';
  document.getElementById('new-user-email').value = '';
  document.getElementById('new-user-role').value = 'Intern';
}

function closeAddUserModal() {
  const modal = document.getElementById('add-user-modal');
  if (!modal) return;
  modal.style.display = 'none';
}

function addNewUser() {
  const name = document.getElementById('new-user-name').value.trim();
  const email = document.getElementById('new-user-email').value.trim();
  const role = document.getElementById('new-user-role').value;
  if (!name) { showToast('⚠️ 이름을 입력해주세요'); return; }
  permUsers.push({ name, email: email || '-', role });
  saveStateToStorage();
  closeAddUserModal();
  renderPermPage();
  showToast(`✅ ${name}이 추가되었습니다 (${role})`);
}

function showPage(id) {
  if (!currentUser) {
    showLoginOverlay();
    showToast('🔐 로그인 후 접근 가능합니다');
    return false;
  }
  if (!canAccess(id)) {
    showToast('🔒 해당 페이지에 접근할 수 있는 권한이 없습니다');
    return false;
  }
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  const page = document.getElementById('page-' + id);
  if (page) page.classList.add('active');
  const tab = document.querySelector(`.nav-tab[data-page="${id}"]`);
  if (tab) tab.classList.add('active');
  if (id === 'dashboard') renderDashboard();
  if (id === 'record') renderRecords();
  if (id === 'video') {
    const jobSel = document.getElementById('video-job-select');
    if (jobSel) jobSel.value = currentJob;
    updateVideoJobDayOptions();
  }
  if (id === 'perm') renderPermPage();
  return false;
}

let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

window.addEventListener('DOMContentLoaded', initApp);
