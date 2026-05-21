// ============================================================
// data.js — 인턴십 포털 데이터 + 초기 상태
// ============================================================
// 이 파일은 모든 정적/초기 데이터를 보관합니다.
// 실제 운영 시 이 안의 값들을 Firestore(Firebase DB)로 옮기게 됩니다.
//   - INTERNS         → /interns 컬렉션
//   - SCHEDULE        → /schedules 컬렉션
//   - VIDEO_DAYS      → /videos 컬렉션
//   - records         → /records 컬렉션
//   - permUsers       → /users 컬렉션 (권한 관리)
// ============================================================

// ──────────────────────────────────────────────
// DATA
// ──────────────────────────────────────────────
const INTERNS = [
  { name:'정의창', job:'마케팅', type:'marketing', mbti:'ESFP', age:'30세(97년생)', school:'한성대 영어영문학부',
    career:'퍼포먼스마케팅 매니저 (2025.09~2026.01)', score_mini:70, score_test:59, score_attitude:5,
    summary:'적극형. 참여도·학습의지 높고 관계 형성 노력도 적극적임. 마케팅 전략 감각 및 업계 이해도(대행사 5개월)로 빠른 온보딩 기대됨. 다만 엑셀 등 실무 툴 숙련도는 보완 필요.',
    attend_rate: 92, assign_rate: 88 },
  { name:'백호정', job:'마케팅', type:'marketing', mbti:'ISTJ', age:'32세(95년생)', school:'충북대 정치외교학과',
    career:'광고기획 운영 (2025.06~2026.02)', score_mini:60, score_test:57, score_attitude:5,
    summary:'차분한 성실형. 마케팅 경력 기반 이해도와 매체 전략 센스가 있으며 동기 신뢰도 높은 편. AI 활용 적극적이고 학습 태도 안정적임.',
    attend_rate: 95, assign_rate: 90 },
  { name:'김수연', job:'마케팅', type:'marketing', mbti:'ENTJ', age:'25세(02년생)', school:'아주대 경영학과',
    career:'스펙업애드 마케팅 인턴', score_mini:70, score_test:75, score_attitude:5,
    summary:'적극적 사고형. 교육 참여도 높고 질문 및 대화 주도 성향 있음. K-POP 등 트렌드 관심 높아 콘텐츠 감각 기대됨.',
    attend_rate: 100, assign_rate: 95 },
  { name:'국정현', job:'마케팅', type:'marketing', mbti:'ESTJ', age:'27세(00년생)', school:'경희대 미디어학과',
    career:'KBS 뉴스 FD (2024~현재)', score_mini:80, score_test:52, score_attitude:5,
    summary:'차분한 학구형. 질문 적극적이고 GA4 등 데이터 영역 관심 높음. 조용하지만 교육 몰입도와 성실성 기반 꾸준함 기대됨.',
    attend_rate: 96, assign_rate: 92 },
  { name:'최재언', job:'마케팅', type:'marketing', mbti:'INFP', age:'26세(01년생)', school:'고려대 경영학',
    career:'카페 마케팅 / BOSCH 산학', score_mini:80, score_test:83, score_attitude:5,
    summary:'안정적 모범생형. 질문 적극적이고 회사·제도 이해도 높이려는 태도 보임. 체계적 교육 만족도가 높고 조직 적응 태도 긍정적.',
    attend_rate: 100, assign_rate: 100 },
  { name:'박예슬', job:'마케팅', type:'marketing', mbti:'ISFP', age:'25세(02년생)', school:'서강대 경영학',
    career:'BITAmin (2024~2025)', score_mini:50, score_test:69, score_attitude:4,
    summary:'조용한 데이터형. 교육 집중도 높고 경청 태도 우수하나 참여는 다소 소극적. Python·SQL·R 활용 가능해 데이터 기반 성장 잠재력 있음.',
    attend_rate: 88, assign_rate: 80 },
  { name:'이동제', job:'마케팅', type:'marketing', mbti:'ENFJ', age:'30세(97년생)', school:'한국외대 컴퓨터공학부',
    career:'퀀트 마케팅 학회 / LG Aimers', score_mini:50, score_test:47, score_attitude:5,
    summary:'차분한 실행형. 컴공 기반 데이터 역량과 AI 활용 관심 높으며 데이터 드리븐 마케팅 지향.',
    attend_rate: 93, assign_rate: 85 },
  { name:'정원형', job:'AI·AX', type:'aiax', mbti:'ISTJ', age:'29세(98년생)', school:'한양대 경영학부',
    career:'AI 심화캠프 1기 (패스트캠퍼스)', score_mini:75, score_test:69, score_attitude:5,
    summary:'주도적 성장형. 현업 투입 및 레퍼런스 축적에 대한 의지가 강하고 AI/AX 업무 관심 높음.',
    attend_rate: 97, assign_rate: 90 },
  { name:'정수빈', job:'AI·AX', type:'aiax', mbti:'ISTP', age:'26세(01년생)', school:'인하대 경제학·통계학',
    career:'KMAC AI·빅데이터 부서 PA', score_mini:70, score_test:83, score_attitude:4,
    summary:'독립적 실용형. 털털하고 의사표현 명확하며 이해력 빠른 편. 문제를 발견하면 단순 해결을 넘어 원인을 찾으려는 태도 보임.',
    attend_rate: 94, assign_rate: 88 },
  { name:'오지원', job:'사업기획·전략', type:'biz', mbti:'INFP', age:'26세(01년생)', school:'이화여대 사학·경영',
    career:'크레도스파트너스 경영기획 인턴', score_mini:70, score_test:54, score_attitude:4,
    summary:'신중한 관망형. 교육 체계에는 높은 만족도 보이나 초기 참여도는 다소 낮은 편. 실무 중심 단계에서 태도 변화 확인 필요.',
    attend_rate: 85, assign_rate: 78 },
  { name:'최민석', job:'사업기획·전략', type:'biz', mbti:'ISFP', age:'29세(98년생)', school:'서강대 경영학과',
    career:'키투웨이 Business Analyst (2023~2024)', score_mini:70, score_test:72, score_attitude:4,
    summary:'전략지향 성실형. 교육 몰입도와 질문 참여 적극적이며 AICPA 기반으로 기획/전략 적합성 기대됨.',
    attend_rate: 91, assign_rate: 86 },
];

// 시간표 데이터 (34기 - 6/22 시작)
const SCHEDULE = {
  marketing: {
    week1: [
      { day:'1일차', date:'6/22 월', eval:'DAY1 강의평가', lectures:[
        { time:'10:00~10:30', name:'인턴 프로그램 소개', type:'offline', teacher:'송유림', duration:'0.5h', links:['교안'], check:true, assign:false, hasVideo:false },
        { time:'10:30~12:00', name:'모비데이즈 소개 (대표님 세션)', type:'online', teacher:'-', duration:'1.5h', links:['영상'], check:true, assign:false, hasVideo:true },
        { time:'12:00~13:00', name:'🍽️ 웰컴 런치', type:'lunch', teacher:'-', duration:'1h', links:[], check:false, assign:false, hasVideo:false },
        { time:'13:00~13:30', name:'대표이사 간담회', type:'offline', teacher:'-', duration:'0.5h', links:[], check:true, assign:false, hasVideo:false },
        { time:'14:00~16:00', name:'신규입사자 OJT', type:'offline', teacher:'구지현', duration:'2h', links:['자료'], check:true, assign:false, note:'계정세팅/회사소개/제도·복리후생/업무툴/생활TIP', hasVideo:false },
        { time:'16:00~16:30', name:'조직문화의 이해', type:'self', teacher:'-', duration:'0.5h', links:['자료'], check:false, assign:false, hasVideo:false },
        { time:'16:30~17:00', name:'기초 비즈니스 매너', type:'self', teacher:'-', duration:'0.5h', links:['자료'], check:false, assign:false, hasVideo:false },
        { time:'17:00~18:00', name:'시모프프', type:'offline', teacher:'윤지수', duration:'1h', links:['자료'], check:false, assign:false, hasVideo:false },
        { time:'18:00~18:30', name:'불공정거래 행위 예방 교육', type:'online', teacher:'-', duration:'0.5h', links:[], check:false, assign:true, assignLabel:'K-ITAS 가입 신청서', hasVideo:true },
      ]},
      { day:'2일차', date:'6/23 화', eval:'DAY2 강의평가', lectures:[
        { time:'10:00~11:00', name:'재무 공통 교육', type:'offline', teacher:'김태호', duration:'1h', links:['영상'], check:false, assign:false, hasVideo:true },
        { time:'11:00~12:00', name:'법무 공통 교육', type:'offline', teacher:'김인서', duration:'1h', links:['영상'], check:false, assign:false, hasVideo:true },
        { time:'12:00~13:00', name:'🍽️ 웰컴 런치', type:'lunch', teacher:'-', duration:'1h', links:[], check:false, assign:false, hasVideo:false },
        { time:'13:30~14:30', name:'퍼포먼스마케팅 기초', type:'self', teacher:'-', duration:'1h', links:['자료'], check:false, assign:false, isExam:true, hasVideo:false },
        { time:'14:30~16:00', name:'모바일 광고시장', type:'online', teacher:'-', duration:'1.5h', links:['영상'], check:false, assign:false, isExam:true, hasVideo:true },
        { time:'16:00~17:30', name:'모비그룹 사업의 이해', type:'offline', teacher:'이광수·정성은·안정은', duration:'1.5h', links:['영상'], check:false, assign:false, hasVideo:true },
        { time:'17:30~19:00', name:'디지털 광고시장의 이해', type:'online', teacher:'-', duration:'1.5h', links:['영상'], check:false, assign:false, isExam:true, hasVideo:true },
      ]},
      { day:'3일차', date:'6/24 수', eval:'DAY3 강의평가', lectures:[
        { time:'10:00~10:30', name:'재무·법무 미니테스트', type:'online', teacher:'-', duration:'0.5h', links:['시험 링크'], check:false, assign:false, hasVideo:false },
        { time:'11:00~11:30', name:'모바일 광고용어', type:'self', teacher:'-', duration:'0.5h', links:['자료'], check:false, assign:false, isExam:true, hasVideo:false },
        { time:'11:30~12:00', name:'미디어의 이해', type:'online', teacher:'-', duration:'0.5h', links:['영상'], check:false, assign:false, isExam:true, hasVideo:true },
        { time:'12:00~13:00', name:'🍽️ 웰컴 런치', type:'lunch', teacher:'-', duration:'1h', links:[], check:false, assign:false, hasVideo:false },
        { time:'13:30~14:00', name:'그로스/퍼널 마케팅/신규 트렌드 전략', type:'self', teacher:'-', duration:'0.5h', links:['자료'], check:false, assign:true, assignLabel:'과제 제출', hasVideo:false },
        { time:'14:00~15:00', name:'캠페인 업무 플로우', type:'self', teacher:'-', duration:'1h', links:['자료'], check:false, assign:false, isExam:true, hasVideo:false },
        { time:'15:00~16:00', name:'모비데이즈 상품 이해', type:'online', teacher:'-', duration:'1h', links:['영상'], check:false, assign:false, hasVideo:true },
        { time:'16:00~17:00', name:'RFP 분석/전략수립', type:'offline', teacher:'김보미', duration:'1h', links:['자료', '실습'], check:false, assign:false, hasVideo:false },
        { time:'17:00~18:00', name:'PM매체의 이해(기초)', type:'offline', teacher:'박선민', duration:'1h', links:['매체자료', '틱톡자료'], check:false, assign:false, isExam:true, hasVideo:false },
        { time:'18:00~19:00', name:'스프레드시트 기초', type:'offline', teacher:'윤지수', duration:'1h', links:['실습파일'], check:false, assign:false, hasVideo:false },
      ]},
      { day:'4일차', date:'6/25 목', eval:'DAY4 강의평가', lectures:[
        { time:'10:00~11:00', name:'퍼널별 매체 전략', type:'offline', teacher:'천성화', duration:'1h', links:['교안', '실습'], check:false, assign:false, hasVideo:false },
        { time:'11:00~12:00', name:'데이터 분석 및 전략 설정', type:'offline', teacher:'정지성', duration:'1h', links:['교안', '실습'], check:false, assign:false, hasVideo:false },
        { time:'12:00~13:00', name:'🍽️ 웰컴 런치', type:'lunch', teacher:'-', duration:'1h', links:[], check:false, assign:false, hasVideo:false },
        { time:'13:00~14:00', name:'모비데이즈 플랫폼 전략 이해', type:'online', teacher:'-', duration:'1h', links:['영상'], check:false, assign:false, hasVideo:true },
        { time:'14:30~15:00', name:'미디어믹스의 이해', type:'online', teacher:'-', duration:'0.5h', links:['영상'], check:false, assign:false, isExam:true, hasVideo:true },
        { time:'15:00~16:30', name:'미디어믹스의 실전', type:'offline', teacher:'박화진', duration:'1.5h', links:['교안', '실습'], check:false, assign:false, hasVideo:false },
        { time:'16:30~17:00', name:'어트리뷰션의 이해', type:'online', teacher:'-', duration:'0.5h', links:['영상'], check:false, assign:false, isExam:true, hasVideo:true },
        { time:'17:00~18:30', name:'스피치 기본기 완성', type:'online', teacher:'임지연', duration:'1.5h', links:['교안', '영상'], check:false, assign:false, hasVideo:true },
      ]},
      { day:'5일차', date:'6/26 금', eval:'DAY5 강의평가', lectures:[
        { time:'10:00~11:00', name:'공통교육 TEST', type:'exam', teacher:'-', duration:'1h', links:['시험 링크'], check:false, assign:false, hasVideo:false },
        { time:'11:00~12:00', name:'AI 공통 교육', type:'offline', teacher:'오정은', duration:'1h', links:['교안'], check:false, assign:false, hasVideo:false },
        { time:'12:00~13:00', name:'🍽️ 웰컴 런치', type:'lunch', teacher:'-', duration:'1h', links:[], check:false, assign:false, hasVideo:false },
        { time:'13:30~16:00', name:'구글 애널리틱스 4', type:'offline', teacher:'김민태', duration:'2.5h', links:['교안'], check:false, assign:false, hasVideo:false },
        { time:'17:00~18:00', name:'1주차 개인 회고', type:'task', teacher:'-', duration:'-', links:['제출폴더'], check:false, assign:true, assignLabel:'회고 파일 링크', hasVideo:false },
        { time:'18:00~18:30', name:'과제 안내 & 조별 미팅', type:'offline', teacher:'-', duration:'0.5h', links:[], check:false, assign:false, hasVideo:false },
      ]},
    ],
    week2: [
      { day:'8일차', date:'6/29 월', eval:null, lectures:[
        { time:'10:00~', name:'RFP 분석 & 데이터 분석 (과제 시작)', type:'task', teacher:'-', duration:'-', links:['과제폴더'], check:false, assign:true, assignLabel:'과제폴더 링크', hasVideo:false },
        { time:'11:00~12:00', name:'방향성 설정 워크샵', type:'offline', teacher:'-', duration:'1h', links:[], check:false, assign:false, hasVideo:false },
        { time:'12:00~13:00', name:'🍽️ 웰컴 런치', type:'lunch', teacher:'-', duration:'1h', links:[], check:false, assign:false, hasVideo:false },
        { time:'13:30~', name:'기획 주제 리서치', type:'task', teacher:'-', duration:'-', links:[], check:false, assign:false, hasVideo:false },
        { time:'17:00~', name:'제안서 Part 1 작성', type:'task', teacher:'-', duration:'-', links:[], check:false, assign:false, hasVideo:false },
      ]},
      { day:'9일차', date:'6/30 화', eval:'DAY9 강의평가', lectures:[
        { time:'10:00~', name:'전략 설정 · 팀별 아이디어 구체화', type:'task', teacher:'-', duration:'-', links:[], check:false, assign:false, hasVideo:false },
        { time:'12:00~13:00', name:'🍽️ 웰컴 런치', type:'lunch', teacher:'-', duration:'1h', links:[], check:false, assign:false, hasVideo:false },
        { time:'14:30~15:00', name:'데이터 분석 실습 / 시나리오 작성', type:'task', teacher:'-', duration:'-', links:[], check:false, assign:false, hasVideo:false },
        { time:'15:00~18:00', name:'제안서 작성법의 기초', type:'offline', teacher:'김세웅', duration:'3h', links:['교안', '실습'], check:false, assign:false, hasVideo:true },
        { time:'18:00~', name:'제안서 Part 2 작성', type:'task', teacher:'-', duration:'-', links:[], check:false, assign:false, hasVideo:false },
      ]},
      { day:'10일차', date:'7/1 수', eval:null, lectures:[
        { time:'10:00~', name:'리서치 내용 보완 / 근거 정리', type:'task', teacher:'-', duration:'-', links:[], check:false, assign:false, hasVideo:false },
        { time:'11:00~', name:'제안서 Part 3 작성', type:'task', teacher:'-', duration:'-', links:[], check:false, assign:false, hasVideo:false },
        { time:'12:00~13:00', name:'🍽️ 웰컴 런치', type:'lunch', teacher:'-', duration:'1h', links:[], check:false, assign:false, hasVideo:false },
        { time:'16:30~', name:'제안서 및 발표 자료 완성', type:'task', teacher:'-', duration:'-', links:[], check:false, assign:false, hasVideo:false },
        { time:'18:00~', name:'자체 리허설', type:'task', teacher:'-', duration:'-', links:[], check:false, assign:false, hasVideo:false },
      ]},
      { day:'11일차', date:'7/2 목', eval:'DAY11 강의평가', lectures:[
        { time:'10:00~', name:'제안서 및 발표 보완점 개선', type:'task', teacher:'-', duration:'-', links:[], check:false, assign:false, hasVideo:false },
        { time:'12:00~13:00', name:'🍽️ 웰컴 런치', type:'lunch', teacher:'-', duration:'1h', links:[], check:false, assign:false, hasVideo:false },
        { time:'14:00~17:00', name:'스피치 1:1 집중 코칭', type:'offline', teacher:'임지연', duration:'3h', links:['교안'], check:false, assign:false, hasVideo:true },
        { time:'17:00~', name:'최종 발표자료 완성', type:'task', teacher:'-', duration:'-', links:[], check:false, assign:false, hasVideo:false },
        { time:'최종', name:'최종 자료 제출', type:'task', teacher:'-', duration:'-', links:['제출폴더'], check:false, assign:true, assignLabel:'최종파일 링크', hasVideo:false },
      ]},
      { day:'12일차', date:'7/3 금', eval:null, lectures:[
        { time:'10:00~', name:'최종 발표 (2층 라운지)', type:'offline', teacher:'-', duration:'-', links:[], check:false, assign:false, hasVideo:false },
        { time:'12:00~13:00', name:'🍽️ 웰컴 런치', type:'lunch', teacher:'-', duration:'1h', links:[], check:false, assign:false, hasVideo:false },
        { time:'13:00~', name:'모비톡 - 현직자 미니세션', type:'offline', teacher:'-', duration:'-', links:[], check:false, assign:false, hasVideo:false },
        { time:'14:00~', name:'BR 개인 면담', type:'offline', teacher:'-', duration:'-', links:[], check:false, assign:false, hasVideo:false },
        { time:'17:00~', name:'장원식 (공통TEST + 발표)', type:'task', teacher:'-', duration:'-', links:[], check:false, assign:false, hasVideo:false },
        { time:'18:00~', name:'도서 요약 제출', type:'task', teacher:'-', duration:'-', links:['제출폴더'], check:false, assign:true, assignLabel:'도서파일 링크', hasVideo:false },
      ]},
    ]
  }
};

SCHEDULE.aiax = JSON.parse(JSON.stringify(SCHEDULE.marketing));
SCHEDULE.aiax.week1[2].lectures = SCHEDULE.aiax.week1[2].lectures.filter(l=>!['그로스/퍼널 마케팅/신규 트렌드 전략','캠페인 업무 플로우'].includes(l.name));
SCHEDULE.aiax.week1[2].lectures.splice(3, 0, { time:'13:30~15:00', name:'AI 공통 교육', type:'offline', teacher:'오정은', duration:'1.5h', links:['교안'], check:false, assign:false, hasVideo:false });
SCHEDULE.aiax.week1[3].lectures = SCHEDULE.aiax.week1[3].lectures.filter(l=>!['퍼널별 매체 전략','데이터 분석 및 전략 설정','미디어믹스의 이해','미디어믹스의 실전','어트리뷰션의 이해'].includes(l.name));
SCHEDULE.aiax.week1[3].lectures.push({ time:'14:30~16:00', name:'AI·AX 업무의 이해', type:'offline', teacher:'오정은', duration:'1.5h', links:['교안'], check:false, assign:false, hasVideo:false });

SCHEDULE.biz = JSON.parse(JSON.stringify(SCHEDULE.marketing));
SCHEDULE.biz.week1[3].lectures = SCHEDULE.biz.week1[3].lectures.filter(l=>!['퍼널별 매체 전략','데이터 분석 및 전략 설정','미디어믹스의 이해','미디어믹스의 실전','어트리뷰션의 이해'].includes(l.name));
SCHEDULE.biz.week1[3].lectures.push({ time:'13:30~15:00', name:'모비인사이드 업무의 이해', type:'offline', teacher:'조예지·한송아', duration:'1.5h', links:['교안'], check:false, assign:false, hasVideo:false });
SCHEDULE.biz.week1[3].lectures.push({ time:'15:00~16:00', name:'사업개발팀 업무의 이해', type:'offline', teacher:'김우현·김찬슬', duration:'1h', links:['교안'], check:false, assign:false, hasVideo:false });

// 영상 뷰어 일차별 데이터
const VIDEO_DAYS = {
  day1: {
    label: '1일차 - 6/22 (월)',
    lectures: [
      { name:'모비데이즈 소개 (대표님 세션)', teacher:'-', duration:'1.5h', type:'online', videoUrl: '' },
      { name:'불공정거래 행위 예방 교육', teacher:'-', duration:'0.5h', type:'online', videoUrl: '' },
    ]
  },
  day2: {
    label: '2일차 - 6/23 (화)',
    lectures: [
      { name:'재무 공통 교육', teacher:'김태호', duration:'1h', type:'offline', videoUrl: '' },
      { name:'법무 공통 교육', teacher:'김인서', duration:'1h', type:'offline', videoUrl: '' },
      { name:'모바일 광고시장', teacher:'-', duration:'1.5h', type:'online', videoUrl: '' },
      { name:'모비그룹 사업의 이해', teacher:'이광수·정성은·안정은', duration:'1.5h', type:'offline', videoUrl: '' },
      { name:'디지털 광고시장의 이해', teacher:'-', duration:'1.5h', type:'online', videoUrl: '' },
    ]
  },
  day3: {
    label: '3일차 - 6/24 (수)',
    lectures: [
      { name:'미디어의 이해', teacher:'-', duration:'0.5h', type:'online', videoUrl: '' },
      { name:'모비데이즈 상품 이해', teacher:'-', duration:'1h', type:'online', videoUrl: '' },
    ]
  },
  day4: {
    label: '4일차 - 6/25 (목)',
    lectures: [
      { name:'모비데이즈 플랫폼 전략 이해', teacher:'-', duration:'1h', type:'online', videoUrl: '' },
      { name:'미디어믹스의 이해', teacher:'-', duration:'0.5h', type:'online', videoUrl: '' },
      { name:'어트리뷰션의 이해', teacher:'-', duration:'0.5h', type:'online', videoUrl: '' },
      { name:'스피치 기본기 완성', teacher:'임지연', duration:'1.5h', type:'online', videoUrl: '' },
    ]
  },
  day5: {
    label: '5일차 - 6/26 (금)',
    lectures: []
  },
  day9: {
    label: '9일차 - 6/30 (화)',
    lectures: [
      { name:'제안서 작성법의 기초', teacher:'김세웅', duration:'3h', type:'offline', videoUrl: '' },
    ]
  },
  day11: {
    label: '11일차 - 7/2 (목)',
    lectures: [
      { name:'스피치 1:1 집중 코칭', teacher:'임지연', duration:'3h', type:'offline', videoUrl: '' },
    ]
  },
};

// ── 상태 ──
let currentJob = 'marketing';
let checkState = {};
let evalCheckState = {};
let assignLinks = {};
let hrdEditMode = false;
let currentRole = 'hrd'; // 'hrd' | 'intern'
let currentUser = '송유림';
let parsedResumeData = null;

// 영상 뷰어 상태
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
