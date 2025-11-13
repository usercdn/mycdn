// =========================================================================
// 1. 전역 설정 및 유틸리티 함수
// =========================================================================

// Canvas 환경에서 제공되는 전역 변수 설정 (원본 값 유지)
const urlParams = new URLSearchParams(window.location.search);
const path = window.location.pathname.replace("/", "");
let id = "abc";
if(path == "PostList.naver"){
    id = urlParams.get("blogId");
} else {
    id = path;
}
window.version = "1.0.2"; // 새로운 기능 추가에 따라 버전만 업데이트합니다.
window.elementsToKeep = 5;
window.MY_ID = id;

// 게시판 URL 설정 (원본 값 유지)
window.BOARD_URL = "/PostList.naver?categoryNo=0&listStyle=card&tab=1&trackingCode=blog_buddylist&blogId=";
window.POST_URL = "";

// 팝업이 띄워진 메인 창의 document
window.targetWindow = document;
if(!!window.opener){
	window.targetWindow = window.opener.document;
}

// -----------------------------------------------------
// 유틸리티 함수 (원본 유지 및 기능 개선)
// -----------------------------------------------------

function getRandomInt(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function seqDispatch(el, type, init) {
	// targetWindow의 document에서 사용할 수 있도록 window 대신 targetWindow를 사용합니다.
	const targetWindow = window.opener || window;
	try { el.dispatchEvent(new PointerEvent(type, { ...init, view: targetWindow.defaultView })); } catch (e) { /* console.error(e.message); */ }
	try { el.dispatchEvent(new MouseEvent(type, { ...init, view: targetWindow.defaultView })); } catch (e) { /* console.error(e.message); */ }
}

/**
 * 요소에 마우스 이벤트를 시뮬레이션하고 클릭합니다.
 * @param {Element} el - 클릭할 HTML 요소
 * @param {number} delay - hover 후 클릭까지 대기 시간 (ms)
 */
function hoverThenClick(el, delay = 200) {
	if (!el) return;

	// 화면 안으로 스크롤
	el.scrollIntoView({ block: 'center', inline: 'center' });

	const rect = el.getBoundingClientRect();
	const base = {
		bubbles: true,
		cancelable: true,
		composed: true,
		view: window.opener || window, // 메인 창 또는 현재 창
		isPrimary: true,
		pointerType: 'mouse',
		clientX: (rect.left + rect.right) / 2,
		clientY: (rect.top + rect.bottom) / 2,
	};

	// 1) hover 계열
	seqDispatch(el, 'pointerover', base);
	seqDispatch(el, 'mouseover', base);
	seqDispatch(el, 'pointerenter', base);
	seqDispatch(el, 'mouseenter', base);
	seqDispatch(el, 'mousemove', base);

	// 2) 약간 대기 (호버시 내부 데이터/레이어 토글 시간 확보)
	setTimeout(() => {
		// 3) 실제 클릭 시퀀스 (down → up → click)
		seqDispatch(el, 'pointerdown', base);
		seqDispatch(el, 'mousedown', base);

		// 버튼형 접근성 핸들러를 쓰는 경우 키보드도 시도 (Enter/Space)
		el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
		el.dispatchEvent(new KeyboardEvent('keyup',   { key: 'Enter', code: 'Enter', bubbles: true }));

		seqDispatch(el, 'pointerup', base);
		seqDispatch(el, 'mouseup', base);
		seqDispatch(el, 'click', base);
	}, delay);
}

/**
 * [수정] 메인 창(targetWindow)에서 좋아요 버튼을 찾아 클릭하는 로직을 실행합니다.
 * @param {Element} targetWindowDocument - 좋아요 버튼이 있는 메인 창의 document 객체
 * @param {function} logFunction - 로그 기록 함수 (this.log.bind(this))
 * @param {object} automationState - Vue의 automation 상태 객체 (중지 로직 참조용)
 * @returns {Promise<number>} 클릭된 좋아요 버튼의 수
 */
async function fnBtnclick(targetWindowDocument, logFunction, automationState) {
    if (!targetWindowDocument) {
        logFunction('메인 창 document를 찾을 수 없습니다.', 'error');
        return 0;
    }
    
    // 메인 창의 document를 기준으로 버튼을 찾습니다.
    const likeButtons = Array.from(
        targetWindowDocument.querySelectorAll('#contentslist_block a.u_likeit_button:not(.on)')
    );

    const totalButtons = likeButtons.length;

    if (totalButtons === 0) {
        return 0;
    }

    logFunction(`총 ${totalButtons}개의 좋아요 버튼 클릭을 시작합니다.`, 'info');
    
    let clickedCount = 0;

    for (let i = 0; i < totalButtons; i++) {
        if (!automationState.isProcessing) { // Vue의 isProcessing 상태를 참조하여 중지 확인
            logFunction('자동화 중지 요청으로 인해 버튼 클릭을 중단합니다.', 'info');
            break;
        }

        const btn = likeButtons[i];
        
        // hoverThenClick을 사용하여 이벤트 시퀀스 실행
        hoverThenClick(btn, 200); 
        
        clickedCount++;
        // 버튼 클릭 간격은 짧게 유지
        let t = getRandomInt(1000, 3000); 
        await new Promise(resolve => setTimeout(resolve, t)); 
    }

    logFunction(`총 ${clickedCount}개의 좋아요 버튼 클릭 시뮬레이션 완료.`, 'success');
    return clickedCount;
}


// -----------------------------------------------------
// 인라인 스타일 함수 (HTML 파일에 포함되어야 하나, JS 파일에 구조상 추가)
// [요청 2] 폭 제한 제거 반영
// -----------------------------------------------------
function injectAppStyles() {
  const STYLE_ID = 'app-inline-style';
  if (document.getElementById(STYLE_ID)) return;

  const css = `
    body { font-family: 'Inter', sans-serif; background-color: #f7f9fb; }
    #appContainer { width: 100%; height: 100vh; } /* max-width: 700px 제거 */
    /* 로그 영역에 스크롤 적용 */
    .log-area { max-height: 200px; overflow-y: auto; display: flex; flex-direction: column-reverse; }
    .log-area div { padding: 4px 8px; margin-bottom: 4px; border-radius: 4px; font-size: 0.8rem; word-break: break-all; }
    .log-success { background-color: #d1fae5; color: #065f46; }
    .log-error { background-color: #fee2e2; color: #991b1b; }
    .log-info { background-color: #e0f2fe; color: #075985; }
    .log-system { background-color: #fef9c3; color: #854d0e; }
    .tab-button { transition: all 0.2s; border-bottom: 3px solid transparent; }
    .tab-button.active { border-color: #4f46e5; color: #1e3a8a; font-weight: 600; }
    .text-input-group { display: flex; flex-direction: column; flex-grow: 1; }
    .type-list { 
        display: flex; 
        flex-wrap: wrap; 
        gap: 12px;
    }
    .type-item {
        flex: 1 1 calc(50% - 12px);
    }
    @media (min-width: 640px) { /* sm */
        .type-item {
            flex: 1 1 calc(33.333% - 12px);
        }
    }
  `;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = css;
  document.head.appendChild(style);
}

// =========================================================================
// 2. Vue 앱 구성
// =========================================================================

// Vue는 HTML 파일이 로드된 후 window.onload에서 실행되어야 하지만, 
// 여기서는 JS 파일의 실행 컨텍스트에 맞게 즉시 정의합니다.
if (typeof Vue !== 'undefined') {
    new Vue({
        el: '#app',
        data: {
            MY_ID: window.MY_ID, 
            LOCAL_STORAGE_KEY: 'BoardManagersData_V2', 
            BOARD_URL: window.BOARD_URL,
            
            targetWindow: null, // 메인 창 객체
            currentTab: 'manage',
            currentBoardType: 'T1', 

            managerData: { 'T1': [] }, 
            currentManagersText: '', 
            logMessages: [],
            globalAutomationOptions: { option1: false, option2: false },

            api: {
                isLoading: false,
                currentPage: 1,
                sortType: 2, 
            },
            
            // [수정] 자동화 상태 관리 (재개 로직과 시간 측정 속성 추가)
            automation: {
                isProcessing: false,
                totalManagers: 0,
                processedManagers: 0,
                currentManager: { id: '', nickname: '' },
                currentManagerIndex: -1, 
                
                // [핵심] 타입별 재개 시작 지점 (인덱스)
                typeStartIndexes: {}, 
                
                // [요청] 경과 시간 측정용 변수
                startTime: null, 
                elapsedTime: 0,
                timerInterval: null,
            }
        },
        computed: {
            dynamicBoardTypes() {
                const types = Object.keys(this.managerData).sort((a, b) => {
                    const numA = parseInt(a.substring(1));
                    const numB = parseInt(b.substring(1));
                    return numA - numB;
                });
                
                if (!types.includes(this.currentBoardType)) {
                    this.currentBoardType = types[0] || 'T1';
                }
                
                return types;
            },
            managerCount() {
                return Object.keys(this.managerData).reduce((acc, type) => {
                    acc[type] = this.managerData[type] ? this.managerData[type].length : 0;
                    return acc;
                }, {});
            },
            totalManagerCount() {
                return Object.keys(this.managerData).reduce((sum, type) => sum + this.managerCount[type], 0);
            },
            automationProgress() {
                const totalCurrentManagers = this.managerCount[this.currentBoardType] || 0; 
                if (totalCurrentManagers === 0) return 0;
                
                // 시작 인덱스를 고려하여 진척도 계산
                const startIndex = this.automation.typeStartIndexes[this.currentBoardType] || 0;
                const totalToProcess = totalCurrentManagers - startIndex;
                const processedSinceStart = this.automation.processedManagers;
                
                if (totalToProcess <= 0) return 100;

                return (processedSinceStart / totalToProcess) * 100;
            },
            // [요청] 경과 시간을 'n분 m초' 형식으로 표시
            elapsedTimeDisplay() {
                const totalSeconds = Math.floor(this.automation.elapsedTime / 1000);
                const minutes = Math.floor(totalSeconds / 60);
                const seconds = totalSeconds % 60;
                return `${minutes}분 ${seconds}초`;
            }
        },
        watch: {
            currentBoardType() {
                this.updateTextareaDisplay();
                this.automation.elapsedTime = 0; // 타입 변경 시 경과 시간 표시 초기화
            },
            managerData: {
                handler() {
                    this.updateTextareaDisplay();
                },
                deep: true
            }
        },
        methods: {
            // -----------------------------------------------------
            // 로그 및 데이터 처리
            // -----------------------------------------------------
            log(message, type = 'info') {
                const now = new Date();
                const timeStr = now.toLocaleTimeString('ko-KR');
                const className = 'log-' + type;
                
                // unshift 대신 push를 사용하고 CSS에서 reverse를 사용해야 최신 로그가 아래로 내려갑니다.
                this.logMessages.push({ time: timeStr, message: message, class: className });
                
                if (this.logMessages.length > 50) {
                    this.logMessages.shift(); // 오래된 로그 제거
                }
            },
            parseTextToManagers(text) {
                const managers = [];
                const lines = text.split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0);

                lines.forEach(line => {
                    const parts = line.split(/\s+/).filter(p => p.length > 0);
                    let id = parts[0] || ''; 
                    let nickname = parts.length > 1 ? parts.slice(1).join(' ') : id;

                    if (id) {
                        managers.push({ id: id, nickname: nickname }); 
                    }
                });

                const uniqueManagers = [];
                const ids = new Set();
                managers.forEach(manager => {
                    if (!ids.has(manager.id)) {
                        ids.add(manager.id);
                        uniqueManagers.push(manager);
                    }
                });
                return uniqueManagers;
            },
            managersToText(managers) {
                if (!managers || managers.length === 0) return '';
                return managers.map(m => m.id + ' ' + m.nickname).join('\n');
            },
            saveTextareaContent() {
                this.$set(this.managerData, this.currentBoardType, this.parseTextToManagers(this.currentManagersText));
            },
            updateTextareaDisplay() {
                const managers = this.managerData[this.currentBoardType] || [];
                this.currentManagersText = this.managersToText(managers);
            },
            
            // -----------------------------------------------------
            // Local Storage 및 재개 로직
            // -----------------------------------------------------

            // [수정] 재개 인덱스 저장 로직 추가
            saveToLocalStorage() {
                this.saveTextareaContent(); 
                try {
                    const dataToSave = {
                        managerData: this.managerData,
                        globalAutomationOptions: this.globalAutomationOptions,
                        // 타입별 시작 인덱스 저장
                        typeStartIndexes: this.automation.typeStartIndexes 
                    };
                    const jsonString = JSON.stringify(dataToSave);
                    localStorage.setItem(this.LOCAL_STORAGE_KEY, jsonString);
                    this.log('Local Storage 저장 성공. 총 ' + this.totalManagerCount + '명의 담당자 정보가 저장되었습니다.', 'success');
                } catch (e) {
                    this.log('Local Storage 저장 중 오류 발생: ' + e.message, 'error');
                }
            },
            // [수정] 재개 인덱스 불러오기 로직 추가
            loadFromLocalStorage() {
                try {
                    const jsonString = localStorage.getItem(this.LOCAL_STORAGE_KEY);
                    if (!jsonString) {
                        this.log('Local Storage에 저장된 데이터가 없습니다.', 'info');
                        return;
                    }
                    const loadedData = JSON.parse(jsonString);
                    
                    if (loadedData && loadedData.managerData) {
                        this.managerData = loadedData.managerData;
                        this.globalAutomationOptions = loadedData.globalAutomationOptions || this.globalAutomationOptions;
                        
                        // 타입별 시작 인덱스 로드
                        if (loadedData.typeStartIndexes) {
                            this.automation.typeStartIndexes = loadedData.typeStartIndexes;
                            const loadedCount = Object.keys(loadedData.typeStartIndexes).filter(k => loadedData.typeStartIndexes[k] > 0).length;
                            if (loadedCount > 0) {
                                this.log(`재개 지점 ${loadedCount}개를 Local Storage에서 불러왔습니다.`, 'system');
                            }
                        }

                        this.updateTextareaDisplay();
                        this.log('Local Storage에서 담당자 목록 (' + this.totalManagerCount + '명)을 성공적으로 불러왔습니다.', 'success');
                    } else {
                        this.log('Local Storage 데이터 구조가 유효하지 않아 로드하지 못했습니다.', 'error');
                    }
                } catch (e) {
                    this.log('Local Storage 불러오기 중 오류 발생: ' + e.message, 'error');
                }
            },

            // -----------------------------------------------------
            // API 시뮬레이션 (원본 로직 유지)
            // -----------------------------------------------------
            async simulateApiCall(pageNo, sortType) {
                await new Promise(r => setTimeout(r, 300));
                
                const data = { isSuccess: true, result: { buddyList: [] } };
                
                if (pageNo === 1) {
                    data.result.buddyList = [
                        { groupId: 1, blogId: 'buddy_korea', nickName: '김대표' },
                        { groupId: 2, blogId: 'buddy_japan', nickName: '스즈키' },
                        { groupId: 1, blogId: 'buddy_usa', nickName: '존스' },
                    ];
                } else if (pageNo === 2) {
                    data.result.buddyList = [
                        { groupId: 3, blogId: 'buddy_group3_a', nickName: '삼번장' },
                        { groupId: 1, blogId: 'buddy_group1_d', nickName: '일번보조' },
                    ];
                } else {
                    data.result.buddyList = [];
                }
                
                return data;
            },
            async loadFromAPI() {
                if (this.api.isLoading) return;
                
                this.api.isLoading = true;
                this.log('### 서버(API)에서 담당자 목록 불러오기 시작... ###', 'info');

                this.managerData = {}; // 데이터 초기화
                this.api.currentPage = 1;
                let hasMoreData = true;
                let totalLoadedCount = 0;

                try {
                    while (hasMoreData) {
                        const pageNo = this.api.currentPage;
                        const sortType = this.api.sortType;
                        
                        const apiResponse = await this.simulateApiCall(pageNo, sortType);
                        
                        if (!apiResponse.isSuccess || !apiResponse.result || !apiResponse.result.buddyList || apiResponse.result.buddyList.length === 0) {
                            hasMoreData = false;
                            this.log(`[API] ${pageNo} 페이지에 더 이상 데이터가 없거나 요청이 성공적이지 않습니다.`, 'info');
                            break;
                        }

                        const buddyList = apiResponse.result.buddyList;
                        totalLoadedCount += buddyList.length;

                        buddyList.forEach(buddy => {
                            const typeKey = `T${buddy.groupId}`; 
                            const manager = { 
                                id: buddy.blogId, 
                                nickname: buddy.nickName 
                            };
                            
                            if (!this.managerData[typeKey]) {
                                this.$set(this.managerData, typeKey, []);
                            }
                            
                            if (!this.managerData[typeKey].some(m => m.id === manager.id)) {
                                this.managerData[typeKey].push(manager);
                            }
                        });

                        this.api.currentPage++;
                        await new Promise(r => setTimeout(r, 500)); 
                    }

                    this.log(`### 서버에서 총 ${totalLoadedCount}명의 담당자 목록을 ${this.api.currentPage - 1} 페이지에 걸쳐 성공적으로 불러왔습니다. ###`, 'success');
                    
                    if (!this.managerData[this.currentBoardType]) {
                        this.currentBoardType = this.dynamicBoardTypes[0] || 'T1';
                    }
                    this.updateTextareaDisplay();

                } catch (error) {
                    this.log('서버(API) 호출 중 치명적인 오류 발생: ' + error.message, 'error');
                } finally {
                    this.api.isLoading = false;
                }
            },

            // -----------------------------------------------------
            // 타이머 로직 (요청 반영)
            // -----------------------------------------------------
            startTimer() {
                if (this.automation.timerInterval) clearInterval(this.automation.timerInterval);
                this.automation.startTime = Date.now() - this.automation.elapsedTime; 
                this.automation.timerInterval = setInterval(() => {
                    this.automation.elapsedTime = Date.now() - this.automation.startTime;
                }, 1000);
            },
            stopTimer() {
                if (this.automation.timerInterval) {
                    clearInterval(this.automation.timerInterval);
                    this.automation.timerInterval = null;
                }
            },


            // -----------------------------------------------------
            // 자동화 핵심 로직 (재개 로직 통합)
            // -----------------------------------------------------
            async startBoardAutomation() {
                // targetWindow가 document인지 확인 (window.opener.document가 아닐 경우)
                if (!window.opener || window.opener.closed) {
                    this.log('자동화 작업을 시작할 메인 창(opener)이 열려있지 않거나 닫혀 있습니다.', 'error');
                    return;
                }
                this.targetWindow = window.opener;

                this.saveTextareaContent();
                
                const currentType = this.currentBoardType;
                const managers = this.managerData[currentType] || [];
                const totalManagers = managers.length;
                
                if (totalManagers === 0) {
                    this.log(`타입 ${currentType}에 담당자가 없습니다. 목록을 확인해주세요.`, 'error');
                    return;
                }
                
                // [재개] 시작 인덱스 가져오기 (없으면 0)
                const startIndex = this.automation.typeStartIndexes[currentType] || 0;

                this.automation.isProcessing = true;
                this.automation.totalManagers = totalManagers; 
                this.automation.processedManagers = 0; // 재개 지점부터 처리된 카운트
                
                this.startTimer();
                
                const startMessage = startIndex > 0 
                    ? `### 타입 ${currentType} 자동화 재개 (${startIndex + 1}번째 / 총 ${totalManagers}명) ###`
                    : `### 타입 ${currentType} 자동화 (${totalManagers}명) 시작합니다. ###`;
                this.log(startMessage, 'system');

                // 시작 인덱스부터 순회
                for (let i = startIndex; i < totalManagers; i++) {
                    if (!this.automation.isProcessing) {
                        // 중단된 경우 다음 시작 인덱스를 저장합니다. (현재 중단된 담당자의 위치)
                        this.$set(this.automation.typeStartIndexes, currentType, i);
                        this.saveToLocalStorage();
                        this.stopTimer();
                        this.log(`사용자에 의해 작업이 중지되었으며, ${i + 1}번째 담당자부터 재개 가능합니다.`, 'system');
                        break; 
                    }

                    const manager = managers[i];
                    this.automation.currentManager = manager;
                    this.automation.currentManagerIndex = i; // 인덱스 저장
                    
                    // 담당자 게시판 이동 및 클릭 시뮬레이션 실행
                    const clickedCount = await this.processManagerBoard(currentType, manager); 

                    this.automation.processedManagers++;
                    
                    // [재개] 담당자 처리가 완료되었으므로, 다음 시작 인덱스를 업데이트하고 저장합니다.
                    this.$set(this.automation.typeStartIndexes, currentType, i + 1);
                    this.saveToLocalStorage(); 

                    this.log(`[타입 ${currentType}] ${manager.nickname} (${manager.id}) 처리 완료! (좋아요 ${clickedCount}개 클릭)`, 'success');
                }
                
                // 최종 종료 처리
                if (this.automation.isProcessing) {
                    this.stopTimer();
                    this.automation.isProcessing = false;
                    
                    // 모든 처리가 완료된 경우, 재개 인덱스를 0으로 초기화
                    this.$set(this.automation.typeStartIndexes, currentType, 0);
                    this.saveToLocalStorage();
                    this.log('### 자동화 확인 처리 완료! ###', 'success');
                    this.automation.elapsedTime = 0; 
                }
            },

            /**
             * [List] 담당자 ID를 붙인 URL로 이동하고 fnBtnclick 로직을 실행합니다.
             */
            async processManagerBoard(type, manager) {
                this.log(`[${manager.id}] 담당자 게시판 이동 중... (URL: ${this.BOARD_URL} + ${manager.id})`);
                
                // [원본 로직] window.BOARD_URL + manager.id 로 이동
                const finalUrl = this.BOARD_URL + manager.id; 
                // 메인 창의 location을 변경합니다.
                this.targetWindow.location.href = finalUrl; 

                // 페이지 로딩 대기 (2~3초 랜덤)
                let loadt = getRandomInt(2000, 3000);
                await new Promise(r => setTimeout(r, loadt)); 

                // fnBtnclick 실행 로직
                this.log(`[${manager.id}] 게시판 로딩 완료. 좋아요 버튼 클릭 로직 시작.`, 'info');
                
                // [수정] fnBtnclick 유틸리티 함수를 메인 창의 document 객체, 로그 함수, 자동화 상태를 전달하여 실행
                const clickedCount = await fnBtnclick(this.targetWindow.document, this.log.bind(this), this.automation);
                
                // [요청] 유연한 딜레이: 클릭한 좋아요 버튼이 없으면 빠르게, 있으면 길게 대기
                if (clickedCount === 0 || !this.automation.isProcessing) {
                    this.log(`[${manager.id}] 클릭할 버튼이 없어 다음 담당자로 빠르게 이동합니다.`, 'info');
                    await new Promise(r => setTimeout(r, 300)); // 최소 대기 시간 (300ms)
                } else {
                     // 좋아요를 클릭한 경우 3~13초 랜덤 대기 (원본 값 유지)
                    let t = getRandomInt(3000, 13000); 
                    await new Promise(r => setTimeout(r, t)); 
                }
                
                return clickedCount;
            },
        },
        mounted() {
            // Vue 컴포넌트 마운트 시 스타일 주입 (HTML에 없을 경우를 대비)
            injectAppStyles();

            if (window.opener) {
                // window.targetWindow가 document이므로 opener의 document를 할당합니다.
                this.targetWindow = window.opener;
            }
            
            if (!this.managerData['T1']) {
                this.$set(this.managerData, 'T1', []);
            }

            this.loadFromLocalStorage();
            this.log('게시판 담당자 관리 시스템이 로드되었습니다. 작업을 시작해 주세요.', 'info');
            this.updateTextareaDisplay();
        }
    });
} else {
    // Vue가 로드되지 않은 환경에서는 콘솔에 경고를 출력합니다.
    console.warn("Vue.js 2.x 라이브러리가 로드되지 않아 앱을 초기화할 수 없습니다.");
}
