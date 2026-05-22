// ============================================================
// app.js — 인턴십 포털 메인 로직
// ============================================================
// 의존성: data.js 가 먼저 로드되어 있어야 함
//
// 섹션 가이드:
//   1. 권한(역할)        applyRole, toggleUserRole, toggleHrdEdit
//   2. 시간표            renderSchedule, switchJob, toggleCheckKey 등
//   3. 대시보드          renderDashboard, highlightTableRow, updateInternField
//   4. 인턴 기록         renderRecordInputPanel, saveAllRecords, renderRecords
//   5. 영상 뷰어         loadVideoDay, selectVideo, setSpeed 등
//   6. 이력서 업로드     handleResumeFile, applyResumeData (Claude API 호출)
//   7. 권한 관리         renderPermPage, setPermRole, addNewUser
//   8. 페이지 전환/토스트 showPage, showToast
// ============================================================


// ──────────────────────────────────────────────
// 권한 (역할)
// ──────────────────────────────────────────────
function applyRole(role) {
  currentRole = role;
  const isHrd = role === 'hrd';
  document.querySelectorAll('.hrd-only').forEach(el => {
    el.style.display = isHrd ? '' : 'none';
  });
  // 권한 탭
  const permTab = document.getElementById('perm-tab');
  if (permTab) permTab.style.display = isHrd ? '' : 'none';
  // 역할 배지 색상
  const badge = document.getElementById('nav-role-badge');
  badge.className = 'nav-role-badge ' + (isHrd ? 'hrd' : 'intern');
  badge.textContent = isHrd ? 'CO1' : '인턴';
  // 이력서 섹션
  const resumeSection = document.getElementById('resume-section');
  if (resumeSection) resumeSection.style.display = isHrd ? '' : 'none';
}

function toggleUserRole() {
  // 권한 변경 기능 비활성화 - 초기 권한으로만 접근 가능
  showToast('🔒 권한 변경은 불가능합니다. 초기 계정으로만 접근 가능합니다.');
}

// ──────────────────────────────────────────────
// HRD 편집 모드
// ──────────────────────────────────────────────
function toggleHrdEdit() {
  hrdEditMode = !hrdEditMode;
  const btn = document.getElementById('hrd-edit-toggle');
  if (hrdEditMode) {
    btn.classList.add('active');
    btn.innerHTML = '<i class="fa-solid fa-circle-check"></i> 편집 완료';
    showToast('✏️ HRD 편집 모드 활성화 — 링크·강의명을 수정할 수 있습니다');
  } else {
    btn.classList.remove('active');
    btn.innerHTML = '<i class="fa-solid fa-pen"></i> HRD 편집 모드';
    showToast('✅ 편집 내용이 저장되었습니다');
  }
  renderSchedule();
}

// ──────────────────────────────────────────────
// SCHEDULE — 시간축 그리드 레이아웃
// ──────────────────────────────────────────────

// 시간 슬롯 정의 (30분 단위) 10:00~19:00
const TIME_SLOTS = [
  '10:00','10:30','11:00','11:30',
  '12:00','12:30',  // 점심
  '13:00','13:30','14:00','14:30','15:00','15:30',
  '16:00','16:30','17:00','17:30','18:00','18:30','19:00'
];
const LUNCH_SLOTS = ['12:00','12:30'];

let currentJob = 'marketing';
let currentRole = 'hrd';
let hrdEditMode = false;
let checkState = {};
let evalCheckState = {};
let assignLinks = {};
let records = [];
let parsedResumeData = null;
let currentVideoDay = 'day1';
let currentVideoIdx = -1;
let videoProgress = {};
let videoCompletedSet = new Set();
let videoSimTimer = null;
let currentSpeed = 1;

function timeToSlotIndex(timeStr) {
  // e.g. "10:00" or "10:00~10:30"
  const t = timeStr.split('~')[0].trim();
  return TIME_SLOTS.indexOf(t);
}
function durationToSlots(timeStr) {
  // e.g. "10:00~11:30" → 3 slots
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

let activePop = null;

function renderSchedule() {
  const data = SCHEDULE[currentJob];
  const container = document.getElementById('schedule-content');
  let html = '';

  const renderWeek = (weekData, weekLabel, weekNote) => {
    const wIdx = weekLabel.includes('1') ? 0 : 1;
    const numDays = weekData.length;
    // grid: 시간축(70px) + 5개 요일
    const gridCols = `70px repeat(${numDays}, 1fr)`;

    html += `<div class="week-section">
      <div class="week-header">
        <span class="week-badge">${weekLabel}</span>
        <span class="week-subtitle">${weekNote}</span>
      </div>
      <div class="timetable-wrap">
        <!-- 헤더 행 -->
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

    // 바디: 시간축 + 슬롯 컨테이너
    html += `<div class="timetable-body" style="display:grid;grid-template-columns:${gridCols};">`;

    // 시간축 컬럼
    html += `<div class="timetable-time-col">`;
    TIME_SLOTS.forEach(t => {
      const isLunch = LUNCH_SLOTS.includes(t);
      html += `<div class="timetable-time-slot" style="${isLunch ? 'color:#B45309;background:#FFFDF5;' : ''}">${t}</div>`;
    });
    html += `</div>`;

    // 요일별 컬럼
    weekData.forEach((day, di) => {
      html += `<div class="timetable-day-col" id="col-${wIdx}-${di}">`;

      // 빈 슬롯들 렌더
    TIME_SLOTS.forEach((t, si) => {
  const isLunch = LUNCH_SLOTS.includes(t);
  html += `<div class="timetable-slot${isLunch ? ' lunch-slot' : ''}"></div>`;
});

      // 강의 카드 오버레이 (절대 위치)
      day.lectures.forEach((lec, li) => {
        const key = `${currentJob}-${wIdx}-${di}-${li}`;
        const isChecked = checkState[key] || false;
        const savedLink = assignLinks[key] || '';
        const startIdx = timeToSlotIndex(lec.time);
        const slots = durationToSlots(lec.time);
        if (startIdx < 0) return;

        const slotIdx12 = TIME_SLOTS.indexOf('12:00');
        let topOffset = startIdx * 72;

        const height = slots * 72 - 4;
        const typeClass = lec.type || 'online';
        const expandId = `exp-${wIdx}-${di}-${li}`;

        // 링크 버튼들 (항상 표시) — hasVideo인 경우 '영상' 링크는 영상뷰어 버튼으로 대체
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
                // 영상링크는 영상뷰어 버튼으로 통합
                return `<button class="video-play-btn" onclick="event.stopPropagation();openVideoFromSchedule('${lec.name}')">▶ 영상 보기</button>`;
              }
              if (isExamLink) { icon = 'fa-file-pen'; style = 'color:#E85D75;background:#FFF0F3;border-color:#F9BFCC;'; }
              return `<a href="#" class="lec-link" onclick="event.stopPropagation();return false;" style="font-size:10.5px;${style}"><i class="fa-solid ${icon}" style="font-size:9px;"></i>${lnk}</a>`;
            }).join('');

        // hasVideo지만 links에 '영상'이 없는 경우 대비 별도 버튼
        const hasVideoLink = (lec.links || []).some(l => l.includes('영상'));
        const videoBtn = (lec.hasVideo && !hasVideoLink)
          ? `<button class="video-play-btn" onclick="event.stopPropagation();openVideoFromSchedule('${lec.name}')">▶ 영상 보기</button>`
          : '';

        // 수강완료 체크
        const checkRow = `<div class="check-row" style="width:100%;" onclick="event.stopPropagation();">
          <div class="check-box ${isChecked?'checked':''}" id="chk-${key}" onclick="toggleCheckKey('${key}')" title="수강 완료" style="flex-shrink:0;${lec.hasVideo && !isChecked ? 'opacity:0.5;' : ''}"></div>
          <span class="check-label">${isChecked ? '✅ 수강완료' : '수강 완료'}</span>
        </div>`;

        // 과제 제출 링크 입력
        const assignRow = lec.assign ? `<div style="width:100%;margin-top:2px;display:flex;gap:5px;align-items:center;" onclick="event.stopPropagation();">
          <i class="fa-solid fa-paperclip" style="color:var(--text-muted);font-size:10px;flex-shrink:0;"></i>
          <input type="text" class="assign-link-input"
            placeholder="${lec.assignLabel || '제출 링크'}"
            value="${savedLink}"
            onchange="saveAssignLink('${key}',this.value)"
            onclick="event.stopPropagation();" style="flex:1;font-size:11px;">
        </div>` : '';

        // 공통시험 배지
        const examBadge = lec.isExam
          ? `<span class="lec-tag" style="background:var(--exam-bg);color:var(--exam-color);border:1px solid var(--exam-border);margin-top:3px;display:inline-flex;align-items:center;gap:3px;"><i class="fa-solid fa-star" style="font-size:9px;"></i>공통시험과목</span>`
          : '';

        const nameField = hrdEditMode
          ? `<input class="tt-edit-input" value="${lec.name}"
               onchange="updateLectureName('${currentJob}',${wIdx},${di},${li},this.value)"
               onclick="event.stopPropagation();" style="margin-bottom:4px;font-size:12px;">`
          : `<div class="tt-name" style="flex:1;">${lec.name}</div>`;

        // HRD 편집 모드 추가 필드
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

      html += `</div>`; // timetable-day-col
    });

    html += `</div></div></div>`; // timetable-body, timetable-wrap, week-section
  };

  renderWeek(data.week1, 'Week 1', '6/22(월) ~ 6/26(금) · 공통 + 직무별 교육');
  renderWeek(data.week2, 'Week 2', '6/29(월) ~ 7/3(금) · 과제 수행 및 최종 발표');

  container.innerHTML = html;

  // 시간표가 10시부터 보이도록 스크롤 조정
  setTimeout(() => {
    const timetableWraps = document.querySelectorAll('.timetable-wrap');
    timetableWraps.forEach(wrap => {
      // 헤더 높이 약 56px를 고려해서 10:00 시간 슬롯이 헤더 바로 아래 보이도록
      const timeColumn = wrap.querySelector('.timetable-time-col');
      if (timeColumn) {
        const firstTimeSlot = timeColumn.querySelector('.timetable-time-slot');
        if (firstTimeSlot) {
          // 첫 번째 시간(10:00)의 위치로 스크롤 이동 (상위 패딩 고려)
          wrap.parentElement.scrollTop = Math.max(0, firstTimeSlot.offsetTop - 70);
        }
      }
      wrap.scrollLeft = 0;
    });
  }, 100);

  // 팝오버 외부 클릭 닫기
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
  // 다른 열린 카드 닫기
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

function openPop(e, id) {
  // 팝오버 사용 안 함 (인라인 확장으로 대체)
}



function toggleCheckKey(key) {
  // 영상 강의인지 확인 (hasVideo 체크)
  const parts = key.split('-'); // e.g. "marketing-0-0-2"
  if (parts.length === 4) {
    const [job, wIdx, di, li] = parts;
    const wKey = wIdx === '0' ? 'week1' : 'week2';
    const lec = SCHEDULE[job]?.[wKey]?.[parseInt(di)]?.lectures?.[parseInt(li)];
    if (lec && lec.hasVideo) {
      // 영상 진행률 확인 (VIDEO_DAYS 기준으로 dayKey 찾기)
      const videoKey = findVideoProgressKey(lec.name);
      const progress = videoKey ? (videoProgress[videoKey] || 0) : 0;
      if (progress < 70) {
        showToast('📹 영상을 70% 이상 수강 후 체크할 수 있습니다');
        return;
      }
    }
  }
  checkState[key] = !checkState[key];
  // DOM 체크박스 업데이트
  const cb = document.getElementById('chk-' + key);
  if (cb) cb.classList.toggle('checked', checkState[key]);
  showToast(checkState[key] ? '✅ 수강 완료로 표시했습니다' : '수강 완료 체크 해제');
  renderSchedule();
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
  showToast('⏰ 시간이 변경됐습니다 (저장 후 새로고침)');
}
function moveLectureDay(job, wIdx, fromDi, li, toDiStr) {
  const wKey = wIdx === 0 ? 'week1' : 'week2';
  const toDi = parseInt(toDiStr);
  if (toDi === fromDi) return;
  const lec = SCHEDULE[job][wKey][fromDi].lectures.splice(li, 1)[0];
  SCHEDULE[job][wKey][toDi].lectures.push(lec);
  showToast(`✅ 강의가 이동됐습니다`);
  renderSchedule();
}

function toggleCheck(key, el) {
  checkState[key] = !checkState[key];
  el.classList.toggle('checked', checkState[key]);
  const label = el.nextElementSibling;
  if (label) label.textContent = checkState[key] ? '✅ 수강완료' : '수강 완료';
  showToast(checkState[key] ? '✅ 수강 완료로 표시했습니다' : '수강 완료 체크를 해제했습니다');
}

function toggleEvalCheck(key, el) {
  evalCheckState[key] = !evalCheckState[key];
  el.classList.toggle('done', evalCheckState[key]);
  el.innerHTML = evalCheckState[key]
    ? '<i class="fa-solid fa-check" style="font-size:9px;"></i>평가완료'
    : '평가완료 체크';
  showToast(evalCheckState[key] ? '✅ 강의평가 완료 표시했습니다' : '강의평가 완료 해제했습니다');
}

function saveAssignLink(key, val) {
  assignLinks[key] = val;
  showToast('📎 링크가 저장되었습니다');
}

// ──────────────────────────────────────────────
// DASHBOARD
// ──────────────────────────────────────────────
function renderDashboard() {
  const grid = document.getElementById('intern-cards');
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
        <div class="progress-bar-fill" style="width:${intern.attend_rate}%"></div>
      </div>
      <div style="font-size:11px; color:var(--text-muted); margin-top:5px; text-align:right;">수강체크율 ${intern.attend_rate}%</div>
    </div>
  `).join('');

  const jobBadgeHTML = (intern) => {
    const cls = intern.type;
    return `<span class="intern-job-badge ${cls}" style="font-size:10.5px;padding:2px 8px;margin:0;">${intern.job}</span>`;
  };

  const tbody = document.getElementById('detail-tbody');
  tbody.innerHTML = INTERNS.map((intern, idx) => {
    const editable = currentRole === 'hrd';
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
  `}).join('');

  // CO1 편집 모드 힌트
  if (currentRole === 'hrd') {
    const hint = document.getElementById('table-edit-hint');
    if (hint) hint.style.display = '';
  }
}

function highlightTableRow(idx) {
  // 기존 하이라이트 제거
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
      // 수강률 바 업데이트
      if (field === 'attend_rate') {
        const bar = document.getElementById('bar-attend-' + idx);
        if (bar) bar.style.width = Math.min(100, num) + '%';
      }
    }
  } else {
    INTERNS[idx][field] = val;
  }
  showToast('✅ 수정됐습니다');
}

// ──────────────────────────────────────────────
// RECORD
// ──────────────────────────────────────────────
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
  if (filtered.length === 0) {
    list.innerHTML = `<div class="empty-state"><i class="fa-regular fa-folder-open"></i><p>기록이 없습니다</p></div>`;
    return;
  }

  // 인턴별 섹션 분리
  const internNames = INTERNS.map(i => i.name);
  const grouped = {};
  filtered.forEach(r => {
    if (!grouped[r.intern]) grouped[r.intern] = [];
    grouped[r.intern].push(r);
  });

  let html = '';
  const order = filterIntern ? [filterIntern] : internNames.filter(n => grouped[n]);
  order.forEach(name => {
    if (!grouped[name]) return;
    html += `<div class="record-intern-section">
      <div class="record-intern-label"><i class="fa-solid fa-user"></i>${name}</div>
      <div class="record-entries">`;
    grouped[name].forEach((r, i) => {
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
  renderRecords();
  showToast('🗑️ 기록이 삭제되었습니다');
}

// ──────────────────────────────────────────────
// 영상 뷰어
// ──────────────────────────────────────────────
let currentVideoJob = 'marketing';

function onVideoJobChange(job) {
  currentVideoJob = job;
  // 직무 탭도 함께 동기화
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
  // 직무별 영상이 있는 일자만 필터링 (VIDEO_DAYS는 공통이지만 직무 연동 표시)
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
  sel.value = 'day1';
  loadVideoDay('day1');
}

function loadVideoDay(dayKey) {
  currentVideoDay = dayKey;
  currentVideoIdx = -1;
  const dayData = VIDEO_DAYS[dayKey];

  // 사이드바 목록 렌더
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

  // 첫 번째 자동 선택
  selectVideo(0);
}

function selectVideo(idx) {
  const dayData = VIDEO_DAYS[currentVideoDay];
  if (!dayData || !dayData.lectures[idx]) return;
  currentVideoIdx = idx;
  const lec = dayData.lectures[idx];

  // 타이머 초기화
  if (videoSimTimer) clearInterval(videoSimTimer);

  // 사이드바 active
  document.querySelectorAll('.video-sidebar-item').forEach((el, i) => {
    el.classList.toggle('active', i === idx);
  });

  // 제목 업데이트
  document.getElementById('video-current-title').textContent = lec.name;
  document.getElementById('video-playing-name').textContent = lec.name + ' 재생 중...';

  // 플레이어 전환
  document.getElementById('video-placeholder').style.display = 'none';
  document.getElementById('video-iframe-wrap').style.display = 'block';
  document.getElementById('video-progress-overlay').style.display = 'flex';

  // 진행률 복원 (이어보기)
  const vKey = `${currentVideoDay}-${idx}`;
  const savedProgress = videoProgress[vKey] || 0;
  updateProgressUI(savedProgress, vKey);
  if (savedProgress > 0 && savedProgress < 100) {
    showToast(`▶ 이어보기: ${Math.round(savedProgress)}% 지점부터 재생합니다`);
  }

  // 진행률 시뮬레이션 (실제 영상 URL 없을 때 대체)
  if (!lec.videoUrl) {
    let prog = savedProgress;
    videoSimTimer = setInterval(() => {
      prog = Math.min(prog + (currentSpeed * 0.5), 100);
      videoProgress[vKey] = prog;
      updateProgressUI(prog, vKey);
      if (prog >= 100) clearInterval(videoSimTimer);
    }, 1000);
  }
}

function updateProgressUI(prog, vKey) {
  document.getElementById('video-progress-fill').style.width = prog + '%';
  document.getElementById('video-progress-label').textContent = Math.round(prog) + '%';

  const badge = document.getElementById('video-complete-badge');
  if (prog >= 70) {
    badge.classList.add('show');
  }
}

function setSpeed(speed, btn) {
  currentSpeed = speed;
  document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  showToast(`▶ 배속 ${speed}x 설정`);
}

function openVideoFromSchedule(lecName) {
  // 시간표에서 영상 보기 클릭 시 뷰어 페이지로 이동 후 해당 강의 선택
  showPage('video');
  // 모든 일차에서 해당 강의 찾기
  for (const [dayKey, dayData] of Object.entries(VIDEO_DAYS)) {
    const idx = dayData.lectures.findIndex(l => l.name === lecName);
    if (idx !== -1) {
      document.getElementById('video-day-select').value = dayKey;
      loadVideoDay(dayKey);
      selectVideo(idx);
      return;
    }
  }
  showToast('📹 해당 영상을 뷰어에서 찾을 수 없습니다');
}

// ──────────────────────────────────────────────
// 이력서 파싱 (Claude API)
// ──────────────────────────────────────────────
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
    // 파일을 base64로 변환
    const base64 = await fileToBase64(file);
    const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const mediaType = isPdf ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    const messages = isPdf ? [
      {
        role: 'user',
        content: [
          { type: 'document', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: `이 이력서 문서에서 다음 정보를 추출하여 JSON으로만 응답해주세요 (마크다운 없이 순수 JSON):
{
  "name": "이름",
  "school": "최종학력 (학교명 + 전공)",
  "career": "주요 경력 (최신순 1~2개, 짧게)",
  "mbti": "MBTI (없으면 빈 문자열)",
  "age": "나이 또는 생년 (없으면 빈 문자열)",
  "job": "지원 직무 추정 (마케팅/AI·AX/사업기획·전략 중 하나)",
  "summary": "핵심 역량 및 특징 2~3문장 요약"
}` }
        ]
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

    // JSON 파싱
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
  el.className = 'resume-parsing-status ' + type;
  el.textContent = msg;
  el.style.display = 'block';
}

function showResumePreview(data) {
  const preview = document.getElementById('resume-preview');
  const content = document.getElementById('resume-preview-content');
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
  // 새 인턴 데이터로 추가 (기존 인턴이 없으면)
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
    // 기존 데이터 업데이트
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
  renderDashboard();
}

function cancelResumeData() {
  document.getElementById('resume-preview').style.display = 'none';
  parsedResumeData = null;
}

// ──────────────────────────────────────────────
// 권한 관리 페이지
// ──────────────────────────────────────────────
let permUsers = [
  { name:'송유림', email:'yrsong@mobidays.com', role:'CO1' },
  { name:'김연준', email:'yeonjun.kim@mobidays.com', role:'CO1' },
  ...INTERNS.map(i => ({ name: i.name, email: i.name + '@intern.mobidays.com', role: 'Intern' }))
];

const ROLE_COLORS = {
  CO1: { bg:'rgba(255,107,43,0.15)', border:'rgba(255,107,43,0.4)', text:'#FF6B2B' },
  Member: { bg:'rgba(59,130,246,0.12)', border:'rgba(59,130,246,0.35)', text:'#3B82F6' },
  Intern: { bg:'rgba(139,92,246,0.12)', border:'rgba(139,92,246,0.35)', text:'#8B5CF6' },
};

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

function setPermRole(idx, role, btn) {
  permUsers[idx].role = role;
  renderPermPage();
  showToast(`✅ ${permUsers[idx].name} → ${role} 권한으로 변경됐습니다`);
}

function removePermUser(idx) {
  const name = permUsers[idx].name;
  if (!confirm(`${name}을(를) 목록에서 삭제하시겠습니까?`)) return;
  permUsers.splice(idx, 1);
  renderPermPage();
  showToast(`🗑️ ${name} 삭제됨`);
}

function showAddUserModal() {
  const modal = document.getElementById('add-user-modal');
  modal.style.display = 'flex';
  document.getElementById('new-user-name').value = '';
  document.getElementById('new-user-email').value = '';
  document.getElementById('new-user-role').value = 'Intern';
}

function closeAddUserModal() {
  document.getElementById('add-user-modal').style.display = 'none';
}

function addNewUser() {
  const name = document.getElementById('new-user-name').value.trim();
  const email = document.getElementById('new-user-email').value.trim();
  const role = document.getElementById('new-user-role').value;
  if (!name) { showToast('⚠️ 이름을 입력해주세요'); return; }
  permUsers.push({ name, email: email || '-', role });
  closeAddUserModal();
  renderPermPage();
  showToast(`✅ ${name} 추가됨 (${role})`);
}

// ──────────────────────────────────────────────
// PAGE NAV
// ──────────────────────────────────────────────
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');

  const tabMap = { schedule:0, dashboard:1, record:2, video:3 };
  const tabs = document.querySelectorAll('.nav-tab');
  if (tabMap[id] !== undefined) tabs[tabMap[id]].classList.add('active');

  if (id === 'dashboard') renderDashboard();
  if (id === 'record') renderRecords();
  if (id === 'video') {
    // 직무 드롭다운 현재 직무로 동기화
    const jobSel = document.getElementById('video-job-select');
    if (jobSel) jobSel.value = currentJob;
    updateVideoJobDayOptions();
  }
  if (id === 'perm') renderPermPage();
  return false;
}

// ──────────────────────────────────────────────
// TOAST
// ──────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

// ── INIT ──
applyRole('hrd');
renderSchedule();
// 영상 뷰어 일자 목록 초기화
setTimeout(() => updateVideoJobDayOptions(), 0);
