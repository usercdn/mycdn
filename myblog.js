// URL 파라미터를 분석합니다.
const urlParams = new URLSearchParams(window.location.search);
// 현재 URL 경로를 정리합니다.
const path = window.location.pathname.replace("/", "");

// =====================================================
// [전역 변수 정의 및 주석]
// =====================================================
let id = "abc"; // 현재 사용자의 ID를 임시로 저장하는 변수
if(path == "PostList.naver"){
    // URL 경로가 특정 게시물 목록 형태일 경우, 'blogId' 파라미터에서 사용자 ID를 추출합니다.
    id = urlParams.get("blogId");
} else {
    // 그 외의 경우, URL 경로 자체를 사용자 ID로 간주합니다.
    id = path;
}

window.version = "1.0.2"; // 애플리케이션의 현재 버전
window.elementsToKeep = 5; // 자동화 시 좋아요 버튼 클릭을 시도할 최대 게시물 수 (최신순에서 이 개수만큼 처리)
window.MY_ID = id; // 현재 팝업을 띄운 메인 창의 사용자 ID
// 이웃의 게시물 목록으로 이동하기 위한 기본 URL. 뒤에 이웃의 blogId가 붙어 최종 URL이 됩니다.
window.BOARD_URL = "/PostList.naver?categoryNo=0&listStyle=card&tab=1&trackingCode=blog_buddylist&blogId="; 
window.POST_URL = ""; // (현재 버전에서는 사용되지 않음) 개별 게시물로 이동하기 위한 기본 URL

function injectAppStyles() {
  const STYLE_ID = 'app-inline-style';

  // 이미 추가돼 있으면 중복 삽입 방지
  if (document.getElementById(STYLE_ID)) return;

  const css = `
    body { font-family: 'Inter', sans-serif; background-color: #f7f9fb; }
    /* 가로 폭 제한 해제 (max-width: 700px 제거) */
    #appContainer { max-width: none; height: 100vh; } 
    /* 로그 영역에 스크롤 적용 */
    .log-area { max-height: 200px; overflow-y: auto; display: flex; flex-direction: column-reverse; }
    .log-area div { padding: 4px 8px; margin-bottom: 4px; border-radius: 4px; font-size: 0.8rem; word-break: break-all; }
    .log-success { background-color: #d1fae5; color: #065f46; }
    .log-error { background-color: #fee2e2; color: #991b1b; }
    .log-info { background-color: #e0f2fe; color: #075985; }
    .tab-button { transition: all 0.2s; border-bottom: 3px solid transparent; }
    .tab-button.active { border-color: #4f46e5; color: #1e3a8a; font-weight: 600; }
    .text-input-group { display: flex; flex-direction: column; flex-grow: 1; }
  `;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.type = 'text/css';
  style.appendChild(document.createTextNode(css));

  document.head.appendChild(style);

	const app = document.getElementById('app');
	
	if (app) {
		const htmlContent = `
		<div id="appContainer" class="bg-white rounded-xl shadow-2xl border border-gray-100 flex flex-col h-full overflow-hidden">
            <header class="p-6 pb-0">
                <h1 class="text-3xl font-extrabold text-gray-800 mb-2">블로그 자동 관리 도구(v.{{version}})</h1>
                <p class="text-gray-500 mb-4 text-sm">
                    팝업을 띄운 <strong class="text-red-500">메인 창</strong>에서 블로그 확인을 자동화합니다.
                </p>
                
                <div class="mb-5 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                    <label class="block text-sm font-bold text-indigo-700 mb-2">① 블로그확인 (T + 그룹 명칭)</label>
                    <div id="boardTypeRadios" class="type-list grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
                        <div v-for="type in dynamicBoardTypes" :key="type" class="flex items-center">
                            <input :id="'type' + type" name="boardType" type="radio" :value="type" 
                                    v-model="currentBoardType"
                                    class="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500">
                            <label :for="'type' + type" class="ml-2 block text-sm font-medium text-gray-700 cursor-pointer">
                                <span class="font-bold text-indigo-600">{{ getGroupName(type) }}</span> ({{ managerCount[type] || 0 }}명)
                            </label>
                        </div>
                    </div>
                </div>

                <nav class="flex border-b border-gray-200">
                    <button 
                        @click="currentTab = 'manage'" 
                        :class="{'active': currentTab === 'manage'}" 
                        class="tab-button py-2 px-4 text-gray-500 hover:text-indigo-600 focus:outline-none"
                    >
                        ② 이웃 목록 관리
                    </button>
                    <button 
                        @click="currentTab = 'auto'" 
                        :class="{'active': currentTab === 'auto'}" 
                        class="tab-button py-2 px-4 text-gray-500 hover:text-indigo-600 focus:outline-none"
                    >
                        ③ 자동화 실행
                    </button>
                </nav>
            </header>

            <main class="flex-grow overflow-auto p-6 pt-4">
                <div v-if="currentTab === 'manage'">
                    <div class="mb-6 text-input-group">
                        <label for="managerInput" class="block text-sm font-medium text-gray-700 mb-2">
                            그룹 <strong class="text-indigo-600">{{ getGroupName(currentBoardType) }}</strong>의 이웃 목록 (<strong class="text-indigo-600">blogId 닉네임</strong> 형식으로 입력)
                        </label>
                        <textarea id="managerInput" rows="6" 
                            v-model="currentManagersText"
                            @input="saveTextareaContent"
                            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 flex-grow"
                            placeholder="예시 (직접 입력 시):&#10;blogId1 닉네임A&#10;blogId2 닉네임B"
                        ></textarea>
                    </div>

                    <div id="controls" class="flex flex-wrap gap-3 mb-6">
                        <button @click="loadFromAPI" :disabled="api.isLoading" class="flex-1 min-w-[140px] px-4 py-2 text-white bg-green-600 hover:bg-green-700 font-semibold rounded-lg shadow-md transition duration-200 disabled:bg-green-400 disabled:cursor-wait">
                            <span v-if="api.isLoading">API 로딩 중 ({{ api.currentPage }})...</span>
                            <span v-else>서버 조회</span>
                        </button>
                        <button @click="loadFromLocalStorage" class="flex-1 min-w-[140px] px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 font-semibold rounded-lg shadow-md transition duration-200">
                            목록 불러오기
                        </button>
                        <button @click="saveToLocalStorage" class="flex-1 min-w-[140px] px-4 py-2 text-white bg-red-600 hover:bg-red-700 font-semibold rounded-lg shadow-md transition duration-200">
                            목록 저장
                        </button>
                    </div>
                </div>

                <div v-else-if="currentTab === 'auto'">
                    
                    <div v-if="automation.isProcessing" class="mb-6 p-4 border border-yellow-500 rounded-lg bg-yellow-50 shadow-md">
                        <h3 class="text-lg font-bold text-yellow-800 mb-2">
                            자동화 진행 중... <span class="font-normal text-sm text-yellow-700">(진행: {{ formatElapsedTime }})</span>
                        </h3>
                        
                        <p class="text-gray-700 font-semibold mb-1">
                            총 이웃 처리: {{ automation.processedManagers }} / {{ automation.totalManagers }} 명
                        </p>
                        
                        <div v-if="automation.totalManagers > 0">
                            <p class="text-gray-600 text-sm">
                                **그룹 {{ getGroupName(currentBoardType) }}** - {{ automation.currentManager.id }}({{ automation.currentManager.nickname }}) 처리 중
                            </p>
                        </div>

                        <div class="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                            <div class="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" :style="{ width: automationProgress + '%' }"></div>
                        </div>
                        <p class="text-xs text-indigo-700 mt-1 font-medium">{{ automationProgress.toFixed(1) }}% 완료</p>

                    </div>

                    <div class="mb-6 p-4 border border-indigo-200 rounded-lg bg-indigo-50" v-if="false">
                        <label class="block text-sm font-bold text-indigo-700 mb-3">
                            자동화 옵션 설정
                        </label>
                        <div class="space-y-3">
                            <div class="flex items-center justify-between p-2 bg-white rounded-md shadow-sm border border-gray-200">
                                <label for="option1" class="flex-1 text-sm font-medium text-gray-700">옵션 1: 기본 멘트 추가 작업</label>
                                <input id="option1" type="checkbox" v-model="globalAutomationOptions.option1" class="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                            </div>
                            <div class="flex items-center justify-between p-2 bg-white rounded-md shadow-sm border border-gray-200">
                                <label for="option2" class="flex-1 text-sm font-medium text-gray-700">옵션 2: 확장 멘트 추가 작업</label>
                                <input id="option2" type="checkbox" v-model="globalAutomationOptions.option2" class="h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500">
                            </div>
                        </div>
                        <p class="text-xs text-gray-500 mt-3 p-1">
                            **공통 블로그 URL:** {{ BOARD_URL }}<br>
                            **공통 게시물 URL:** {{ POST_URL }}
                        </p>
                    </div>
                
                    <button 
                        @click="startBoardAutomation" 
                        :disabled="managerCount[currentBoardType] === 0 && !automation.isProcessing"
                        class="w-full mt-3 px-4 py-3 text-lg text-white font-bold rounded-lg shadow-xl transition duration-200 transform hover:scale-[1.01] 
                        " :class="{'bg-red-700 hover:bg-red-800': automation.isProcessing, 'bg-indigo-700 hover:bg-indigo-800': !automation.isProcessing}"
                    >
                        <span v-if="!automation.isProcessing">
                            {{ automation.processedManagers > 0 ? '▶ 다시시작' : '▶ 시작' }} 
                            (총 {{ managerCount[currentBoardType] || 0 }}명)
                        </span>
                        <span v-else>
                            처리 중... (중지하려면 클릭해주세요)
                        </span>
                    </button>
                    <p v-if="managerCount[currentBoardType] === 0 && !automation.isProcessing" class="text-sm text-red-500 mt-2 text-center">
                        선택된 {{ getGroupName(currentBoardType) }}에 이웃이 없습니다. 조회버튼을 이용해 다시 조회하세요.
                    </p>
                </div>
                
                <div class="mt-8 border-t pt-4">
                    <h2 class="text-xl font-bold text-gray-800 mb-3">작업 로그</h2>
                    <div id="logArea" class="log-area bg-gray-50 p-3 rounded-lg min-h-[100px] shadow-inner">
                        <div v-for="(log, index) in logMessages" :key="index" :class="log.class" class="rounded-lg shadow-sm">
                            <strong>[{{ log.time }}]</strong> {{ log.message }}
                        </div>
                    </div>
                </div>
            </main>
        </div>
		`;
		app.innerHTML = htmlContent;
	}
};



    // =====================================================

    // -----------------------------------------------------
    // 1. 유틸리티 함수
    // -----------------------------------------------------

    /** * [랜덤 정수 생성]
     * 최소/최대값 범위의 랜덤 정수를 반환합니다. (자동화 딜레이 시간 생성에 사용) 
     */
    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /** * [이벤트 디스패치]
     * Pointer/Mouse 이벤트를 요소에 시퀀스적으로 디스패치합니다. (클릭 시뮬레이션의 핵심)
     */
    function seqDispatch(el, type, init) {
        // targetWindow의 document에서 사용할 수 있도록 window 대신 targetWindow를 사용합니다.
        try { el.dispatchEvent(new PointerEvent(type, init)); } catch (e) { /* console.error(e.message); */ }
        try { el.dispatchEvent(new MouseEvent(type, init)); } catch (e) { /* console.error(e.message); */ }
    }

    /**
     * [클릭 시뮬레이션]
     * 요소가 보이도록 스크롤하고, 마우스 이벤트 시퀀스를 시뮬레이션하여 클릭합니다.
     * @param {Element} el - 클릭할 대상 요소
     * @param {Window} targetWindow - 이벤트가 디스패치될 메인 창 Window 객체
     * @param {number} delay - 호버 이벤트 후 실제 클릭 시퀀스까지의 대기 시간 (ms)
     */
    function hoverThenClick(el, targetWindow, delay = 200) {
        if (!el) return;

        // 팝업 창이 아닌, 메인 창(targetWindow)의 요소에 대해 스크롤합니다.
        el.scrollIntoView({ block: 'center', inline: 'center' });

        const rect = el.getBoundingClientRect();
        const base = {
            bubbles: true,
            cancelable: true,
            composed: true,
            view: targetWindow ? targetWindow.defaultView : window,
            isPrimary: true,
            pointerType: 'mouse',
            clientX: (rect.left + rect.right) / 2,
            clientY: (rect.top + rect.bottom) / 2,
        };

        // 1) hover 계열 이벤트 시뮬레이션
        seqDispatch(el, 'pointerover', base);
        seqDispatch(el, 'mouseover', base);
        seqDispatch(el, 'pointerenter', base);
        seqDispatch(el, 'mouseenter', base);
        seqDispatch(el, 'mousemove', base);

        // 2) 약간 대기(호버시 내부 데이터/레이어 토글 시간 확보)
        setTimeout(() => {
            // 3) 실제 클릭 시퀀스 (down → up → click) 시뮬레이션
            seqDispatch(el, 'pointerdown', base);
            seqDispatch(el, 'mousedown', base);

            // 버튼형 접근성 핸들러를 쓰는 경우 키보드도 시도
            el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }));
            el.dispatchEvent(new KeyboardEvent('keyup',   { key: 'Enter', code: 'Enter', bubbles: true }));

            seqDispatch(el, 'pointerup', base);
            seqDispatch(el, 'mouseup', base);
            seqDispatch(el, 'click', base);
        }, delay);
    }

    /**
     * [좋아요 버튼 클릭 로직]
     * 메인 창(targetWindow)에서 좋아요 버튼을 찾아 시뮬레이션 클릭을 실행합니다.
     * @param {Window} targetWindow - 메인 창 Window 객체 (좋아요 버튼이 있는 창)
     * @param {Function} logFunction - Vue 인스턴스의 log 메서드 (로그 기록용)
     * @param {Object} automation - Vue 인스턴스의 automation 상태 객체 (중지 플래그 확인용)
     * @returns {number} 처리된 좋아요 버튼 수
     */
    async function fnBtnclick(targetWindow, logFunction, automation) {
		let self = this;
        if (!targetWindow || !targetWindow.document) {
            logFunction('메인 창(targetWindow)의 document를 찾을 수 없습니다.', 'error');
            return 0; // 처리된 버튼 수 0 반환
        }
        
        // 메인 창의 document를 기준으로 '좋아요' 버튼 (아직 클릭되지 않은 상태)을 찾습니다.
        let likeButtons = Array.from(
            targetWindow.document.querySelectorAll('#contentslist_block a.u_likeit_button:not(.on)')
        );
        
        window.elementsToKeep = getRandomInt(4, 7); // 4~7 개 랜덤 검색
        if (likeButtons.length === 0) {
            logFunction('클릭할 좋아요 버튼을 찾지 못했습니다.', 'info');
            return 0;
        } else if (likeButtons.length > window.elementsToKeep){
            // elementsToKeep 수 만큼만 처리하기 위해 초과분은 제외 (최신 게시물 위주로 처리)
            let deleteCount = likeButtons.length - window.elementsToKeep;
            likeButtons.splice(0, deleteCount);
        }

        logFunction(`총 ${likeButtons.length}개의 좋아요 버튼 클릭을 시작합니다.`, 'info');
        
        let clickedCount = 0;

        for (let i = 0; i < likeButtons.length; i++) {
            // Vue의 isProcessing 상태나 runFlg를 참조하여 중지 여부를 확인합니다.
            if (!automation.isProcessing || self.runFlg == false) { 
                logFunction('자동화 중지 요청으로 인해 버튼 클릭을 중단합니다.', 'info');
                break;
            }

            const btn = likeButtons[i];
            
            logFunction(`[버튼 클릭] ${i + 1}/${likeButtons.length}번째 버튼 처리 중...`);
            
            const rect = btn.getBoundingClientRect();
            const base = {
                bubbles: true,
                cancelable: true,
                composed: true,
                view: targetWindow.defaultView,
                isPrimary: true,
                pointerType: 'mouse',
                clientX: (rect.left + rect.right) / 2,
                clientY: (rect.top + rect.bottom) / 2,
            };

            // 스크롤 및 클릭 시뮬레이션
            btn.scrollIntoView({ block: 'center', inline: 'center' });
            
            // 클릭 시퀀스 (down → up → click)
            seqDispatch(btn, 'pointerdown', base);
            seqDispatch(btn, 'mousedown', base);
            seqDispatch(btn, 'pointerup', base);
            seqDispatch(btn, 'mouseup', base);
            seqDispatch(btn, 'click', base);
            
            clickedCount++;
            let t = getRandomInt(1000, 5000); // 1초 ~ 5초 사이 랜덤 대기
            await new Promise(resolve => setTimeout(resolve, t)); 
        }

        logFunction(`총 ${clickedCount}개의 좋아요 완료.`, 'success');
        return clickedCount;
    }

    /**
     * [시간 포매팅]
     * 밀리초 단위의 시간을 "H시간 M분 S초" 형식으로 포맷합니다.
     * @param {number} ms - 경과 시간 (밀리초)
     * @returns {string} 포맷된 시간 문자열
     */
    function formatTime(ms) {
        if (ms < 0) return "0초";
        let seconds = Math.floor(ms / 1000);
        const hours = Math.floor(seconds / 3600);
        seconds %= 3600;
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        let parts = [];
        if (hours > 0) parts.push(`${hours}시간`);
        if (minutes > 0) parts.push(`${minutes}분`);
        if (remainingSeconds > 0 || parts.length === 0) parts.push(`${remainingSeconds}초`); // 시간이 0일 때 "0초" 표시

        return parts.join(' ');
    }


    // -----------------------------------------------------
    // 2. Vue 앱 구성
    // -----------------------------------------------------

    window.onload = function() {
        injectAppStyles();
        window.app = new Vue({
            el: '#app',
            data: {
                // [Vue 데이터]
                MY_ID: window.MY_ID, // 현재 사용자 블로그 ID
                version: window.version, // 애플리케이션 버전
                LOCAL_STORAGE_KEY: 'MyData_' + window.MY_ID, // 로컬 스토리지에 데이터를 저장할 때 사용할 키
				runFlg : false, // 자동화 실행/중지 상태를 관리하는 플래그 (토글 역할)
                
                BOARD_URL: window.BOARD_URL, // 이웃 블로그 기본 URL
                POST_URL: window.POST_URL, // 개별 게시물 기본 URL (미사용)
                
                targetWindow: null, // 팝업을 띄운 메인 창(opener)의 Window 객체
                
                // UI 상태
                currentTab: 'manage', // 현재 활성화된 탭 ('manage' 또는 'auto')
                currentBoardType: 'T1', // 현재 선택된 블로그 타입 (T1, T2 등)

                // 핵심 데이터 저장소
                managerData: { 'T1': [] }, // 키: 'T' + groupId, 값: { id, nickname } 객체 배열
                groupList: [], // {groupId: 1, groupName: "새 그룹"} 형태의 그룹 정보 목록
                currentManagersText: '', // 현재 선택된 타입의 이웃 목록을 표시하는 textarea 내용
                logMessages: [], // 작업 로그 메시지 배열
                
                // 경과 시간 및 타이머 관련
                startTime: null, // 자동화 시작 시간 (Date 객체)
                elapsedTime: 0, // 경과 시간 (밀리초)
                timerInterval: null, // setInterval 핸들러

                // 공통 자동화 옵션 (현재는 미사용)
                globalAutomationOptions: {
                    option1: false, 
                    option2: false 
                },

                // API 로딩 상태
                api: {
                    isLoading: false, // API 호출 중 여부
                    currentPage: 1, // 현재 로드 중인 페이지 번호
                    sortType: 2, // API 호출에 사용되는 정렬 타입
                },
                
                // 자동화 상태 관리
                automation: {
                    isProcessing: false, // 자동화 작업 진행 중 여부 (중지 버튼 제어용)
                    totalManagers: 0, // 현재 타입의 총 이웃 수
                    processedManagers: 0, // 현재까지 처리 완료된 이웃 수 (다음 시작 위치)
                    currentManager: { id: '', nickname: '' }, // 현재 처리 중인 이웃 정보
                    // 다음 두 속성은 현재 좋아요 클릭 로직에서는 게시물 단위 진척도 측정에 사용되지 않음
                    currentItemProcessed: 0, 
                    currentItemTotal: 0, 
                    totalDuration: null, // 최종 완료까지 걸린 총 시간 (밀리초)
                }
            },
            computed: {
                /** * [동적 블로그 타입]
                 * managerData의 키를 기반으로 사용 가능한 블로그 타입 목록(T1, T2...)을 오름차순으로 정렬하여 반환합니다. 
                 */
                dynamicBoardTypes() {
                    const types = Object.keys(this.managerData).sort((a, b) => {
                        const numA = parseInt(a.substring(1));
                        const numB = parseInt(b.substring(1));
                        return numA - numB;
                    });
                    
                    // 현재 타입이 목록에 없으면 첫 번째 타입으로 기본값 설정
                    if (!types.includes(this.currentBoardType)) {
                        this.currentBoardType = types[0] || 'T1';
                    }
                    
                    return types;
                },
                /** * [타입별 이웃 수]
                 * 각 블로그 타입별로 등록된 이웃 수를 계산하여 객체 형태로 반환합니다. 
                 */
                managerCount() {
                    return Object.keys(this.managerData).reduce((acc, type) => {
                        acc[type] = this.managerData[type] ? this.managerData[type].length : 0;
                        return acc;
                    }, {});
                },
                /** * [총 이웃 수]
                 * 모든 타입의 이웃 수를 합산하여 반환합니다.
                 */
                totalManagerCount() {
                    return Object.keys(this.managerData).reduce((sum, type) => sum + this.managerCount[type], 0);
                },
                /** * [자동화 진척도]
                 * 현재 선택된 타입의 전체 이웃 대비 처리된 이웃 비율(%)을 계산합니다.
                 */
                automationProgress() {
                    const totalCurrentManagers = this.managerCount[this.currentBoardType] || 0; 
                    if (totalCurrentManagers === 0) return 0;
                    
                    return (this.automation.processedManagers / totalCurrentManagers) * 100;
                },
                /** * [경과 시간 포맷]
                 * 현재 경과 시간(elapsedTime)을 "H시간 M분 S초" 형식으로 변환하여 반환합니다.
                 */
                formatElapsedTime() {
                    return formatTime(this.elapsedTime);
                }
            },
            watch: {
                /** currentBoardType 변경 시 textarea 내용을 업데이트합니다. */
                currentBoardType() {
                    this.updateTextareaDisplay();
                },
                /** managerData가 변경될 때마다 textarea 내용을 업데이트합니다. */
                managerData: {
                    handler() {
                        this.updateTextareaDisplay();
                    },
                    deep: true
                }
            },
            methods: {
                // -----------------------------------------------------
                // [Vue 기본 로직]
                // -----------------------------------------------------
                /** * [그룹 명칭 가져오기]
                 * 블로그 타입(T1, T2 등)에 해당하는 그룹 명칭을 반환합니다. 없으면 기본 타입을 반환합니다.
                 */
                getGroupName(type) {
                    const groupId = parseInt(type.substring(1));
                    const group = this.groupList.find(g => g.groupId === groupId);
                    return group ? group.groupName : `타입 ${type}`;
                },
                /** * [로그 기록]
                 * 작업 로그 메시지를 기록하고 UI에 표시합니다. 
                 * @param {string} message - 로그 내용
                 * @param {string} type - 로그 타입 ('info', 'success', 'error')
                 */
                log(message, type = 'info') {
                    const now = new Date();
                    const timeStr = now.toLocaleTimeString('ko-KR');
                    const className = 'log-' + type;
                    
                    this.logMessages.unshift({ time: timeStr, message: message, class: className });
                    
                    // 로그 메시지 개수 제한
                    if (this.logMessages.length > 50) {
                        this.logMessages.pop(); 
                    }
                },
                /** * [텍스트 파싱]
                 * textarea의 텍스트 ('blogId 닉네임' 형식)를 이웃 객체 배열로 변환합니다.
                 */
                parseTextToManagers(text) {
                    const managers = [];
                    const lines = text.split('\n')
                        .map(line => line.trim())
                        .filter(line => line.length > 0);

                    lines.forEach(line => {
                        const parts = line.split(/\s+/).filter(p => p.length > 0);
                        let id = parts[0] || ''; // blogId
                        let nickname = parts.length > 1 ? parts.slice(1).join(' ') : id;

                        if (id) {
                            managers.push({ id: id, nickname: nickname }); 
                        }
                    });

                    // 중복된 ID를 가진 이웃을 제거하고 고유한 목록만 반환
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
                /** * [매니저 목록을 텍스트로 변환]
                 * 이웃 객체 배열을 'blogId 닉네임' 형식의 텍스트로 변환합니다.
                 */
                managersToText(managers) {
                    if (!managers || managers.length === 0) return '';
                    return managers.map(m => m.id + ' ' + m.nickname).join('\n');
                },
                /** * [텍스트 저장]
                 * textarea의 현재 내용을 파싱하여 현재 선택된 타입의 managerData에 저장합니다.
                 */
                saveTextareaContent() {
                    this.$set(this.managerData, this.currentBoardType, this.parseTextToManagers(this.currentManagersText));
                },
                /** * [textarea UI 업데이트]
                 * 현재 선택된 타입의 managerData를 textarea에 표시합니다.
                 */
                updateTextareaDisplay() {
                    const managers = this.managerData[this.currentBoardType] || [];
                    this.currentManagersText = this.managersToText(managers);
                    this.log('그룹 [' + this.getGroupName(this.currentBoardType) + ']의 목록 ' + managers.length + '명을 표시했습니다.', 'info');
                },
                /** * [로컬 저장소 저장]
                 * 현재의 managerData, groupList, 옵션을 로컬 스토리지에 저장합니다.
                 */
                saveToLocalStorage() {
                    this.saveTextareaContent(); // 현재 textarea 내용 반영
                    try {
                        const dataToSave = {
                            managerData: this.managerData,
                            groupList: this.groupList, // 그룹 리스트 추가
                            globalAutomationOptions: this.globalAutomationOptions 
                        };
                        const jsonString = JSON.stringify(dataToSave);
                        localStorage.setItem(this.LOCAL_STORAGE_KEY, jsonString);
                        this.log('Local Storage 저장 성공. 총 ' + this.totalManagerCount + '명의 이웃 정보와 그룹 정보가 저장되었습니다.', 'success');
                    } catch (e) {
                        this.log('Local Storage 저장 중 오류 발생: ' + e.message, 'error');
                    }
                },
                /** * [로컬 저장소 불러오기]
                 * 로컬 스토리지에서 데이터를 불러와 managerData, groupList, 옵션을 복원합니다.
                 */
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
                            this.groupList = loadedData.groupList || []; // 그룹 리스트 로드
                            this.globalAutomationOptions = loadedData.globalAutomationOptions || this.globalAutomationOptions;

                            this.updateTextareaDisplay();
                            this.log('Local Storage에서 이웃 목록 (' + this.totalManagerCount + '명)을 성공적으로 불러왔습니다.', 'success');
                        } else {
                            this.log('Local Storage 데이터 구조가 유효하지 않아 로드하지 못했습니다.', 'error');
                        }
                    } catch (e) {
                        this.log('Local Storage 불러오기 중 오류 발생: ' + e.message, 'error');
                    }
                },
                
                // API 연동 로직
                /** * [API에서 이웃 목록 불러오기]
                 * 서버 API를 호출하여 이웃 목록(버디 리스트)과 그룹 목록을 가져옵니다.
                 */
                async loadFromAPI() {
                    if (this.api.isLoading) return;
                    
                    this.api.isLoading = true;
                    this.log('### 서버(API)에서 이웃 목록 불러오기 시작... ###', 'info');

                    this.managerData = {}; // 데이터 초기화
                    this.groupList = []; // 그룹 리스트 초기화
                    this.api.currentPage = 1;
                    let hasMoreData = true;
                    let totalLoadedCount = 0;
                    let isGroupListLoaded = false;

                    try {
                        while (hasMoreData) {
                            const pageNo = this.api.currentPage;
                            const sortType = this.api.sortType;
                            
                            const params = new URLSearchParams({pageNo: pageNo, sortType: sortType});
                            let url = "/api/blogs/" + this.MY_ID + "/my-buddies?" + params.toString();

                            this.log(`[API] ${pageNo} 페이지 호출 중... URL: ${url}`, 'info');

                            const response = await fetch(url);
                            const apiResponse = await response.json(); 
                            
                            // 1. 그룹 목록 (첫 페이지에서만 로드)
                            if (!isGroupListLoaded && apiResponse.result && apiResponse.result.buddyGroupList) {
                                this.groupList = apiResponse.result.buddyGroupList;
                                this.log(`[API] 총 ${this.groupList.length}개의 그룹 정보를 불러왔습니다.`, 'info');
                                isGroupListLoaded = true;
                            }
                            
                            // 2. 버디 목록
                            if (!apiResponse.isSuccess || !apiResponse.result || !apiResponse.result.buddyList || apiResponse.result.buddyList.length === 0) {
                                hasMoreData = false;
                                this.log(`[API] ${pageNo} 페이지에 더 이상 데이터가 없거나 요청이 성공적이지 않습니다.`, 'info');
                                break;
                            }

                            const buddyList = apiResponse.result.buddyList;
                            totalLoadedCount += buddyList.length;

                            // 불러온 데이터를 그룹 ID별로 분류하여 managerData에 저장
                            buddyList.forEach(buddy => {
                                const typeKey = `T${buddy.groupId}`; // groupId를 사용하여 T1, T2 등의 키 생성
                                const manager = { 
                                    id: buddy.blogId, 
                                    nickname: buddy.nickName 
                                };
                                
                                if (!this.managerData[typeKey]) {
                                    this.$set(this.managerData, typeKey, []); // 새 타입일 경우 초기화
                                }
                                
                                // 중복 확인 후 추가
                                if (!this.managerData[typeKey].some(m => m.id === manager.id)) {
                                    this.managerData[typeKey].push(manager);
                                }
                            });

                            this.api.currentPage++;
                            let t = getRandomInt(100, 700); // 다음 페이지 호출 전 랜덤 대기
                            await new Promise(r => setTimeout(r, t)); 
                        }

                        this.log(`### 서버에서 총 ${totalLoadedCount}명의 이웃 목록을 ${this.api.currentPage - 1} 페이지에 걸쳐 성공적으로 불러왔습니다. ###`, 'success');
                        
                        if (!this.managerData[this.currentBoardType]) {
                            this.currentBoardType = this.dynamicBoardTypes[0] || 'T1';
                        }
                        this.updateTextareaDisplay();
                        this.saveToLocalStorage(); // 성공 시 로컬 스토리지에 저장

                    } catch (error) {
                        this.log('서버(API) 호출 중 치명적인 오류 발생: ' + error.message, 'error');
                    } finally {
                        this.api.isLoading = false;
                    }
                },

                // -----------------------------------------------------
                // 3. 자동화 핵심 로직 및 타이머
                // -----------------------------------------------------
                /** * [타이머 시작]
                 * 경과 시간 측정을 시작하고, 1초마다 elapsedTime을 업데이트합니다.
                 */
                startAutomationTimer() {
                    if (this.timerInterval) this.stopAutomationTimer(); // 기존 타이머가 있으면 중지
                    if (!this.startTime) this.startTime = new Date(); // 첫 시작 시간 설정

                    this.timerInterval = setInterval(() => {
                        this.elapsedTime = new Date() - this.startTime;
                    }, 1000);
                },
                /** * [타이머 중지]
                 * 경과 시간 측정을 멈춥니다.
                 */
                stopAutomationTimer() {
                    clearInterval(this.timerInterval);
                    this.timerInterval = null;
                },

                /** * [자동화 시작/중지 토글]
                 * 자동화 작업을 시작하거나 진행 중인 작업을 중지합니다.
                 */
                async startBoardAutomation() {
                    if (!window.opener || window.opener.closed) {
                        this.log('자동화 작업을 시작할 메인 창(opener)이 열려있지 않거나 닫혀 있습니다.', 'error');
                        return;
                    }
                    this.targetWindow = window.opener;

                    // 1. 중지 요청 처리 (자동화 진행 중일 때)
					if(this.runFlg == true){
						this.runFlg = false;
						this.automation.isProcessing = false; 
                        this.stopAutomationTimer(); // 타이머 중지
						this.log('사용자에 의해 자동화 작업이 중지되었습니다. 현재 위치에서 다시시작 할 수 있습니다.', 'info');
						return;
					}
                    
                    // 2. 자동화 시작/다시시작 준비
                    this.runFlg = true;
                    this.automation.isProcessing = true; // 자동화 시작 상태 설정
                    this.startAutomationTimer(); // 타이머 시작
                    
                    this.saveTextareaContent(); // 시작 전 현재 textarea 내용 반영 (최신 목록 반영)
                    
                    const currentType = this.currentBoardType;
                    const managers = this.managerData[currentType] || [];
                    const totalManagers = managers.length;
                    
                    if (totalManagers === 0) {
                        this.log(`타입 ${currentType}에 이웃이 없습니다. 목록을 확인해주세요.`, 'error');
                        this.automation.isProcessing = false;
                        this.stopAutomationTimer();
                        return;
                    }
                    
                    this.automation.totalManagers = totalManagers;

                    // 재시작일 경우, 기존 processedManagers (처리 완료 수)를 시작 인덱스로 사용
                    let startIndex = this.automation.processedManagers;
                    
                    // 초기 시작 메시지
                    if (startIndex === 0) {
                        this.log(`### 그룹 ${this.getGroupName(currentType)} 자동화 (${totalManagers}명) 시작합니다. ###`, 'info');
                    } else {
                        this.log(`### 그룹 ${this.getGroupName(currentType)} 자동화 (${totalManagers}명) 다시시작합니다. (재개: ${startIndex + 1}번째 이웃부터) ###`, 'info');
                    }


                    for (let i = startIndex; i < managers.length; i++) {
                        const manager = managers[i];

                        // 각 이웃 처리 전 중지 상태 재확인
                        if (!this.automation.isProcessing || this.runFlg == false) {
                            // 중지 플래그가 이미 설정되었으므로, 반복문만 종료하고 타이머 중지는 위에서 처리됨
                            break; 
                        }

                        this.automation.currentManager = manager;
                        
                        // 페이지 로딩 대기
                        let loadt = getRandomInt(2000, 7000); // 2초 ~ 7초 사이 랜덤 대기
                        await new Promise(r => setTimeout(r, loadt));

                        // 이웃 블로그로 이동 및 클릭 시뮬레이션 실행
                        await this.processManagerBoard(currentType, manager); 

                        this.automation.processedManagers++;
                        this.log(`[그룹 ${this.getGroupName(currentType)}] ${manager.nickname} (${manager.id}) 처리 완료! (${this.automation.processedManagers}/${totalManagers})`, 'success');
                    }

                    // 3. 완료/최종 중지 처리
                    if (!this.automation.isProcessing) {
                        // 중지 버튼을 눌러 루프가 종료된 경우 (타이머는 이미 중지됨)
                        this.log('자동화 작업이 중지 지점에서 멈췄습니다.', 'info');
                    } else {
                        // 모든 작업이 완료된 경우
                        this.stopAutomationTimer(); // 타이머 중지
                        this.automation.totalDuration = this.elapsedTime; // 총 소요 시간 기록
                        this.automation.isProcessing = false;
                        this.runFlg = false;
                        this.log(`### 자동화 확인 처리 완료! (총 소요: ${formatTime(this.automation.totalDuration)}) ###`, 'success');
                        this.automation.processedManagers = 0; // 완료 후 초기화 (다음 시작 시 0부터)
                        this.automation.totalDuration = null; // 완료 후 소요 시간 초기화
                    }
                },

                /**
                 * [이웃 블로그 처리]
                 * 이웃 ID를 붙인 URL로 메인 창을 이동시키고, fnBtnclick 로직을 실행합니다.
                 * @param {string} type - 블로그 타입
                 * @param {Object} manager - 이웃 정보 { id, nickname }
                 */
                async processManagerBoard(type, manager) {
					if(this.runFlg == false){
						return;
					}
                    this.log(`[${manager.nickname} (${manager.id})] 블로그로 이동 중...`);
                    
                    // BOARD_URL + manager.id 로 메인 창의 URL을 변경하여 페이지 이동
                    const finalUrl = this.BOARD_URL + manager.id; 
                    this.targetWindow.location.href = finalUrl;

                    // 페이지 로딩 대기
                    let loadt = getRandomInt(2000, 3000); // 2초 ~ 3초 사이 랜덤 대기
                    await new Promise(r => setTimeout(r, loadt)); 

                    // fnBtnclick 실행 로직 (좋아요 버튼 클릭 시뮬레이션)
                    this.log(`[${manager.id}] 로딩 완료. 좋아요 버튼 클릭 로직 시작.`, 'info');
                    
                    // fnBtnclick 유틸리티 함수를 호출하여 메인 창에서 작업 수행
                    await fnBtnclick.call(this, this.targetWindow, this.log.bind(this), this.automation);
                    
                    // 다음 이웃 처리 전 잠깐 대기
                    let t = getRandomInt(2000, 13000); // 2초 ~ 13초 사이 랜덤 대기
                    await new Promise(r => setTimeout(r, t)); 
                },
            },
            mounted() {
                // Vue 인스턴스가 마운트된 후 초기화 작업 수행
                if (window.opener) {
                    this.targetWindow = window.opener; // 메인 창 객체 저장
                }
                
                // T1 타입이 정의되지 않았을 경우 초기화
                if (!this.managerData['T1']) {
                    this.$set(this.managerData, 'T1', []);
                }

                this.loadFromLocalStorage(); // 로컬 저장소에서 데이터 로드 시도
                this.log('블로그 자동 관리 시스템이 로드되었습니다. 작업을 시작해 주세요.', 'info');
                this.updateTextareaDisplay(); // 현재 타입의 목록을 textarea에 표시
            }
        });
    };