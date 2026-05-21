# 34기 인턴십 포털 — 기능 구현 가이드

> 지금은 모든 데이터가 브라우저 메모리(JS 변수)에만 있어서 새로고침하면 사라집니다.
> 이 문서는 **각 기능을 실제로 동작하게 만들려면 무엇이 필요한지**,
> **어떤 도구로 어떻게 구현하는지**를 정리한 가이드입니다.

---

## 0. 추천 기술 스택 (Google Workspace 기반 + **완전 무료 운영**)

| 영역 | 도구 | 이유 |
|---|---|---|
| 로그인/인증 | **Firebase Authentication** (Google 로그인) | `@mobidays.com` 도메인만 허용 설정 한 줄로 가능 |
| 데이터베이스 | **Firestore** (NoSQL) | 실시간 동기화, 권한 규칙으로 HRD/인턴 분기 처리 쉬움 |
| 파일 저장 | **Firebase Storage** (이력서만, 5GB 무료) | 이력서 보관용. 영상은 YouTube에 |
| 영상 호스팅 | **YouTube 비공개(unlisted)** | 무료, 무제한, iframe 임베드 그대로 사용 |
| 이력서 파싱 | **Claude(Cowork) 직접 사용** | Cloud Functions 불필요. HRD가 PDF 던지면 Claude가 JSON 추출 |
| 호스팅 | **Firebase Hosting** | `firebase deploy` 한 줄로 배포 |
| 개발 도구 | **Cursor** | Firebase 코드를 AI에게 시키기 좋음 |

> **모두 Firebase Spark 플랜(무료)으로 가능. 카드 등록 X, 월 0원.**
> Cloud Functions를 빼는 대신 이력서 파싱 같은 "비밀키 필요한 작업"은 사람이 Claude(Cowork)에 수동으로 시키는 방식으로 우회합니다. 인턴 25명 규모면 자동화 안 해도 충분.

### 초기 셋업 (한 번만)

```bash
# 1. Node.js 설치 후
npm install -g firebase-tools
firebase login                          # Google 계정으로 로그인
firebase init                           # 프로젝트 폴더에서 실행, Auth/Firestore/Hosting/Functions 선택
firebase deploy
```

`index.html`의 `<head>`에 아래 한 줄만 추가하면 Firebase SDK가 로드됩니다:

```html
<script type="module" src="firebase-config.js"></script>
```

Cursor 프롬프트:
> "Firebase v10 SDK를 modular 방식으로 초기화하는 `firebase-config.js`를 만들어줘. Auth, Firestore, Storage를 export 하고, 로컬에서 테스트할 수 있게 Auth emulator도 옵션으로 연결할 수 있게 해줘."

---

## 1. 권한/로그인 기능 (가장 먼저!)

### 지금 상태
- `app.js` 의 `applyRole(role)`, `toggleUserRole()` — **버튼 누르면 역할이 바뀌는 데모용 토글**입니다.
- 실제 로그인 없음, 누구나 CO1(최고권한)으로 진입 가능.

### 필요한 작업
1. **Google 로그인 버튼** 추가 (`@mobidays.com` 도메인만 허용)
2. 로그인한 사용자의 이메일을 보고 `permUsers` 테이블에서 역할(co1/hrd/co/intern) 조회
3. `applyRole()` 을 자동으로 호출해서 UI 잠그기
4. **Firestore 보안 규칙**으로 백엔드에서도 권한 강제

### Firebase로 어떻게?

```js
// 로그인
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ hd: "mobidays.com" });  // 도메인 강제
await signInWithPopup(auth, provider);
```

Firestore 보안 규칙(콘솔에 붙여넣기):

```javascript
match /interns/{id} {
  allow read: if request.auth != null;
  allow write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['co1','hrd'];
}
```

### Cursor 프롬프트

> "내가 만든 `app.js`의 `applyRole()`과 `toggleUserRole()`을 Firebase Authentication 기반으로 바꿔줘.
> - Google 로그인만 허용, hd 파라미터로 `mobidays.com` 강제
> - 로그인 후 `users/{uid}` 문서에서 `role` 필드 읽어와서 applyRole 자동 호출
> - 로그인 안 했으면 페이지를 전부 가리고 로그인 버튼만 보여줘
> - 우측 상단 사용자 배지 클릭하면 로그아웃되게"

---

## 2. 시간표 페이지 (Schedule)

### 지금 상태
- `data.js` 의 `SCHEDULE` 상수 — 페이지 새로고침하면 초기값으로 돌아감
- 체크박스(`checkState`), 평가 체크(`evalCheckState`), 과제 링크(`assignLinks`) 모두 메모리
- HRD 편집 모드(`hrdEditMode`)에서 입력한 강의명/시간 변경도 휘발됨

### 필요한 작업
1. **`SCHEDULE` → Firestore `schedules/{job}/weeks/{wIdx}`** 컬렉션으로 이전
2. **체크 상태 → 사용자별 저장** (`users/{uid}/progress/{lectureKey}`)
3. HRD가 편집 모드에서 저장한 변경사항이 **모든 인턴 화면에 실시간 반영**
4. 과제 링크는 HRD만 편집, 인턴은 읽기 전용

### Firebase로 어떻게?

```js
import { onSnapshot, doc, setDoc } from "firebase/firestore";

// 실시간 구독 (HRD가 바꾸면 인턴 화면에도 즉시 반영)
onSnapshot(doc(db, "schedules/marketing"), (snap) => {
  SCHEDULE.marketing = snap.data();
  renderSchedule();
});

// 체크 토글 시
async function toggleCheckKey(key) {
  const uid = auth.currentUser.uid;
  checkState[key] = !checkState[key];
  await setDoc(doc(db, `users/${uid}/progress/${key}`), { done: checkState[key] });
}
```

### Cursor 프롬프트

> "`app.js`의 `toggleCheckKey`, `toggleEvalCheck`, `saveAssignLink`, `updateLectureName`, `updateLectureLink`, `updateLectureTime`, `moveLectureDay` 함수들을 Firestore에 저장하도록 수정해줘.
> - 체크/진도 상태는 `users/{uid}/progress` 서브컬렉션에
> - 시간표 본체(SCHEDULE)는 `schedules/{job}` 문서에
> - 페이지 로드 시 `onSnapshot`으로 구독해서 실시간 반영
> - 인턴 권한일 때는 시간표 본체 수정은 차단"

---

## 3. 대시보드 (Dashboard)

### 지금 상태
- `INTERNS` 배열 — 출결률, 평가점수, 평가 키워드, 강점/약점 모두 하드코딩
- HRD가 셀을 편집(`contenteditable`)해도 메모리에만 반영

### 필요한 작업
1. **`INTERNS` → Firestore `interns` 컬렉션** (각 인턴이 한 문서)
2. 셀 편집 시 해당 인턴 문서 업데이트
3. 출결률은 시간표의 체크 데이터에서 **자동 계산**하는 것도 가능

### Cursor 프롬프트

> "`app.js`의 `renderDashboard`, `updateInternField` 함수를 Firestore 기반으로 바꿔줘.
> - `interns` 컬렉션에서 모든 문서 불러와 카드/테이블 렌더
> - `contenteditable` 셀에서 blur 시 해당 필드만 update
> - 실시간 구독으로 다른 HRD가 편집한 내용도 즉시 보이게"

---

## 4. 인턴 기록표 (Record)

### 지금 상태
- `records` 배열에 메모리로 저장. `saveAllRecords()`, `deleteRecord()` 모두 휘발성

### 필요한 작업
1. **`records` → Firestore `records` 컬렉션** (각 기록이 한 문서)
2. 작성자(`author`), 날짜(`date`), 인턴(`intern`), 내용(`content`) 필드 그대로
3. 기록은 **작성자 본인 + CO1만 삭제** 가능하도록 보안 규칙

### Cursor 프롬프트

> "`saveAllRecords`, `deleteRecord`, `renderRecords` 를 Firestore 기반으로 바꿔줘.
> - `addDoc(collection(db,'records'), {...})` 으로 저장
> - 조회는 `where('intern','==',filterIntern)` 쿼리
> - 삭제는 본인 글이거나 CO1만 가능하게 보안 규칙도 같이 작성"

---

## 5. 영상 뷰어 페이지 — **제거. 시간표 셀에 외부 링크만 연결**

### 결정사항
영상 뷰어 페이지 전체를 제거하고, 시간표의 각 강의 셀에 **기존 영상 링크(Drive/YouTube/Vimeo 등)** 를 외부 링크로 걸어둡니다.
인턴은 링크 클릭 시 새 탭에서 영상 시청 → 다 본 후 시간표 체크박스를 수동으로 누름.

### 코드에서 삭제할 것
**`index.html`**
- `<nav>` 안의 영상 뷰어 탭 (`onclick="showPage('video')"`)
- `<!-- ===== PAGE 4: 영상 뷰어 ===== -->` 부터 해당 `</div>` 까지

**`app.js`**
- `onVideoJobChange`, `updateVideoJobDayOptions`, `loadVideoDay`, `selectVideo`, `updateProgressUI`, `setSpeed`, `openVideoFromSchedule`, `findVideoProgressKey` 함수
- `videoProgress`, `videoCompletedSet`, `videoSimTimer`, `currentSpeed`, `currentVideoDay`, `currentVideoIdx`, `currentVideoJob` 상태 변수
- `showPage` 안의 `if (id === 'video')` 분기

**`data.js`**
- `VIDEO_DAYS` 전체 객체

**`styles.css`**
- `/* ── 영상 뷰어 페이지 ── */` 부터 해당 섹션 끝까지

### 시간표 셀의 영상 링크 처리
`SCHEDULE` 데이터의 각 강의에 `videoUrl` 필드를 추가:

```js
{ time:'10:00~12:00', name:'GA4 기초', type:'online',
  videoUrl: 'https://drive.google.com/file/d/XXX/view',
  links:['📺 영상 보기'] }
```

`renderSchedule` 안의 영상 버튼 부분을 다음으로 교체:

```js
const videoBtn = lec.videoUrl
  ? `<a href="${lec.videoUrl}" target="_blank" rel="noopener"
       class="video-play-btn"
       onclick="event.stopPropagation();">▶ 영상 보기</a>`
  : '';
```

### Cursor 프롬프트

> "영상 뷰어 페이지(PAGE 4)를 완전히 제거해줘.
> - index.html 에서 nav 탭과 page 섹션 삭제
> - app.js 에서 영상 관련 함수/상태 모두 삭제 (위 목록 그대로)
> - data.js 의 VIDEO_DAYS 객체 삭제
> - styles.css 의 영상 뷰어 페이지 전용 CSS 삭제
> - SCHEDULE 의 각 강의 객체에 선택적 `videoUrl` 필드 추가하고,
>   renderSchedule 의 영상 버튼이 있으면 외부 링크로 새 탭에서 열도록 변경
> - showPage 의 'video' 케이스 제거"

### 영상 링크는 어디에 보관?
- **Drive 링크**: 공유 설정 "Mobidays 조직 내 링크 있는 모든 사용자"로 → 인턴 회사계정만 자동 시청 가능
- **YouTube unlisted 링크**: 링크 있으면 누구나, 외부 노출 부담 시 비추
- 둘 다 Firestore `schedules` 문서의 강의 객체에 `videoUrl` 필드로 저장

---

## 6. 이력서 업로드 — **Cowork(Claude)에 수동 위임 = 0원**

### 지금 상태
- `handleResumeFile()` 에서 PDF를 base64로 변환하고 Claude API에 직접 요청 보냄
- API 키가 클라이언트에 노출되는 구조라 실제 운영 불가
- API 키 환경에 두려면 Cloud Functions가 필요한데 → **Blaze 플랜(유료, 카드 등록 필요)**

### 무료 전략: 자동화를 빼고 사람이 Claude에 위임
인턴 25명 규모면 신입 받을 때마다 25번 = 1년에 한두 번. 굳이 시스템 안 짜도 됨.

**워크플로우:**
1. HRD가 신규 인턴 이력서 PDF를 **이 Cowork 채팅창에 드래그**
2. "이 PDF에서 이름/학교/전공/경력을 추출해서 다음 JSON 형식으로 줘: `{name, school, major, career}`" 라고 요청
3. Claude가 JSON 반환 → 복사
4. 권한 관리 페이지 "사람 추가" 모달에 붙여넣기

**장점:**
- Claude API 키 관리 0
- Cloud Functions 0
- Firebase Storage에 PDF 안 올려도 됨 (5GB 한도 보존)
- Blaze 플랜 불필요 → **완전 무료 유지**

### 코드 변경 사항
`app.js` 의 `handleResumeFile`, `fileToBase64`, `applyResumeData`, `cancelResumeData`, `showResumePreview` 함수와
`index.html` 의 이력서 업로드 섹션(`#resume-section`)을 **삭제**하면 됩니다.
대신 "사람 추가" 모달에 JSON 붙여넣기 입력란 하나 추가.

### Cursor 프롬프트

> "이력서 자동 파싱 기능을 제거하고, 대신 권한관리 페이지 '사람 추가' 모달에 'JSON 붙여넣기' 모드를 추가해줘.
> - 텍스트영역에 `{name, school, major, career}` 형식 JSON 붙여넣으면 파싱해서 폼 자동 채움
> - 잘못된 JSON이면 빨간 토스트로 알림
> - HRD에게 안내 문구: '이력서 PDF는 Claude(Cowork)에 업로드해서 JSON으로 변환 후 붙여넣으세요'"

### Bonus: 자동화하고 싶어진다면 (나중 옵션)
- **Google Apps Script** (무료) 안에서 Claude API 호출 → 결과 Firestore 쓰기
- Apps Script는 Google 계정에 묶여있고 매월 충분한 실행 시간 무료
- 다만 지금 단계에선 오버엔지니어링. 인원이 100명 넘으면 그때 고민

---

## 7. 권한 관리 페이지 (Perm — CO1 전용)

### 지금 상태
- `permUsers` 배열로 사용자/역할 관리. `setPermRole`, `removePermUser`, `addNewUser` 모두 메모리

### 필요한 작업
1. **`permUsers` → Firestore `users` 컬렉션** (key = uid)
2. 사용자 추가 시: Firebase Auth 사용자가 처음 로그인할 때 자동으로 `users/{uid}` 생성 (Cloud Function)
3. 역할 변경은 **CO1만 가능** (보안 규칙)
4. Slack/이메일 같은 부가 정보는 `users/{uid}` 문서에 추가 필드로

### Cursor 프롬프트

> "권한 관리를 Firestore 기반으로 바꿔줘.
> - `users` 컬렉션을 onSna