const urlParams = new URLSearchParams(window.location.search);
const path = window.location.pathname.replace("/", "");
let id = "abc";
if(path == "PostList.naver"){
    id = urlParams.get("blogId");
} else {
    id = path;
}
window.version = "1.0.1";

window.MY_ID = id;
window.BOARD_URL = "/PostList.naver?categoryNo=0&listStyle=card&tab=1&trackingCode=blog_buddylist&blogId=";
window.POST_URL = "";


function injectAppStyles() {
  const STYLE_ID = 'app-inline-style';

  // 이미 추가돼 있으면 중복 삽입 방지
  if (document.getElementById(STYLE_ID)) return;

  const css = `
    body { font-family: 'Inter', sans-serif; background-color: #f7f9fb; }
    #appContainer { max-width: 700px; height: 100vh; }
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
            
            <!-- 게시판 타입 선택 UI (최상단 배치) -->
            <div class="mb-5 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                <label class="block text-sm font-bold text-indigo-700 mb-2">① 블로그확인 (T + 그룹 ID)</label>
                <div id="boardTypeRadios" class="type-list">
                    <div v-for="type in dynamicBoardTypes" :key="type" class="flex items-center">
                        <input :id="'type' + type" name="boardType" type="radio" :value="type" 
                                v-model="currentBoardType"
                                class="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500">
                        <label :for="'type' + type" class="ml-2 block text-sm font-medium text-gray-700 cursor-pointer">
                            타입 {{ type }} <span class="font-bold text-indigo-600">({{ managerCount[type] || 0 }}명)</span>
                        </label>
                    </div>
                </div>
            </div>

            <!-- 탭 네비게이션 -->
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
            <!-- 2. 담당자 목록 관리 탭 -->
            <div v-if="currentTab === 'manage'">
                <div class="mb-6 text-input-group">
                    <label for="managerInput" class="block text-sm font-medium text-gray-700 mb-2">
                        타입 <strong class="text-indigo-600">{{ currentBoardType }}</strong>의 이웃 목록 (<strong class="text-indigo-600">blogId 닉네임</strong> 형식으로 입력)
                    </label>
                    <textarea id="managerInput" rows="10" 
                        v-model="currentManagersText"
                        @input="saveTextareaContent"
                        class="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition duration-150 flex-grow"
                        placeholder="예시 (직접 입력 시):&#10;blogId1 닉네임A&#10;blogId2 닉네임B"
                    ></textarea>
                </div>

                <div id="controls" class="flex flex-wrap gap-3 mb-6">
                    <button @click="loadFromAPI" :disabled="api.isLoading" class="flex-1 min-w-[140px] px-4 py-2 text-white bg-green-600 hover:bg-green-700 font-semibold rounded-lg shadow-md transition duration-200 disabled:bg-green-400 disabled:cursor-wait">
                        <span v-if="api.isLoading">API 로딩 중 ({{ api.currentPage }})...</span>
                        <span v-else>서버에서 불러오기 (API)</span>
                    </button>
                    <button v-if="false" @click="loadFromLocalStorage" class="flex-1 min-w-[140px] px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 font-semibold rounded-lg shadow-md transition duration-200">
                        로컬 저장소에서 불러오기
                    </button>
                    <button v-if="false" @click="saveToLocalStorage" class="flex-1 min-w-[140px] px-4 py-2 text-white bg-red-600 hover:bg-red-700 font-semibold rounded-lg shadow-md transition duration-200">
                        로컬 저장소에 저장
                    </button>
                </div>
            </div>

            <!-- 3. 자동화 실행 탭 -->
            <div v-else-if="currentTab === 'auto'">
                
                <div v-if="automation.isProcessing" class="mb-6 p-4 border border-yellow-500 rounded-lg bg-yellow-50 shadow-md">
                    <h3 class="text-lg font-bold text-yellow-800 mb-2">자동화 진행 중...</h3>
                    
                    <!-- 총 진척도 표시 -->
                    <p class="text-gray-700 font-semibold mb-1">
                        총 담당자 처리: {{ automation.processedManagers }} / {{ automation.totalManagers }} 명
                    </p>
                    
                    <!-- 현재 담당자 개별 진척도 표시 -->
                    <div v-if="automation.currentItemTotal > 0">
                        <p class="text-gray-600 text-sm">
                            **타입 {{ currentBoardType }}** - {{ automation.currentManager.id }}({{ automation.currentManager.nickname }}) 처리 중
                            (게시물: {{ automation.currentItemProcessed }} / {{ automation.currentItemTotal }} 건)
                        </p>
                    </div>

                    <div class="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                        <div class="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" :style="{ width: automationProgress + '%' }"></div>
                    </div>
                    <p class="text-xs text-indigo-700 mt-1 font-medium">{{ automationProgress.toFixed(1) }}% 완료</p>

                </div>

                <!-- 옵션 설정 UI -->
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
                        **공통 게시판 URL:** {{ BOARD_URL }}<br>
                        **공통 게시물 URL:** {{ POST_URL }}
                    </p>
                </div>
            
                <button 
                    @click="startBoardAutomation" 
                    :disabled="managerCount[currentBoardType] === 0"
                    class="w-full mt-3 px-4 py-3 text-lg text-white bg-indigo-700 hover:bg-indigo-800 font-bold rounded-lg shadow-xl transition duration-200 transform hover:scale-[1.01] disabled:bg-indigo-400 disabled:cursor-not-allowed"
                >
                    <span v-if="!automation.isProcessing">
                        ▶ 타입 {{ currentBoardType }} 자동확인 시작 (총 {{ managerCount[currentBoardType] || 0 }}명)
                    </span>
                    <span v-else>처리 중... (중지하려면 클릭해주세요)</span>
                </button>
                <p v-if="managerCount[currentBoardType] === 0" class="text-sm text-red-500 mt-2 text-center">
                    선택된 타입({{ currentBoardType }})에 담당자가 없습니다. '담당자 목록 관리' 탭에서 추가하거나 서버에서 불러오세요.
                </p>
            </div>
            
            <!-- 로그 영역 -->
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



    // -----------------------------------------------------
    // 1. 유틸리티 함수 (제공해주신 소스 기반으로 재정의)
    // -----------------------------------------------------

    /** 최소/최대값 범위의 랜덤 정수를 반환합니다. */
    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /** Pointer/Mouse 이벤트를 요소에 디스패치합니다. */
    function seqDispatch(el, type, init) {
        // targetWindow의 document에서 사용할 수 있도록 window 대신 targetWindow를 사용합니다.
        try { el.dispatchEvent(new PointerEvent(type, init)); } catch (e) { /* console.error(e.message); */ }
        try { el.dispatchEvent(new MouseEvent(type, init)); } catch (e) { /* console.error(e.message); */ }
    }

    /** 요소가 보이도록 스크롤하고, 마우스 이벤트 시퀀스를 시뮬레이션하여 클릭합니다. */
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

        // 1) hover 계열 이벤트
        seqDispatch(el, 'pointerover', base);
        seqDispatch(el, 'mouseover', base);
        seqDispatch(el, 'pointerenter', base);
        seqDispatch(el, 'mouseenter', base);
        seqDispatch(el, 'mousemove', base);

        // 2) 약간 대기(호버시 내부 데이터/레이어 토글 시간 확보)
        setTimeout(() => {
            // 3) 실제 클릭 시퀀스 (down → up → click)
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
     * 메인 창(targetWindow)에서 좋아요 버튼을 찾아 클릭하는 로직을 실행합니다.
     * 이 함수는 Vue 컴포넌트의 메서드로 통합되어 Vue의 log 기능과 연동됩니다.
     */
    async function fnBtnclick(targetWindow, logFunction, automation) {
		let self = this;
        if (!targetWindow || !targetWindow.document) {
            logFunction('메인 창(targetWindow)의 document를 찾을 수 없습니다.', 'error');
            return 0; // 처리된 버튼 수 0 반환
        }
        
        // 메인 창의 document를 기준으로 버튼을 찾습니다.
        let likeButtons = Array.from(
            targetWindow.document.querySelectorAll('#contentslist_block a.u_likeit_button:not(.on)')
        );
        const elementsToKeep = 5;

        if (likeButtons.length === 0) {
            logFunction('클릭할 좋아요 버튼을 찾지 못했습니다.', 'info');
            return 0;
        } else if (likeButtons.length > elementsToKeep){
            likeButtons.splice(elementsToKeep);
        }

        logFunction(`총 ${likeButtons.length}개의 좋아요 버튼 클릭을 시작합니다.`, 'info');
        
        let clickedCount = 0;

        for (let i = 0; i < likeButtons.length; i++) {
            if (!automation.isProcessing) { // Vue의 isProcessing 상태를 참조하여 중지 확인
                logFunction('자동화 중지 요청으로 인해 버튼 클릭을 중단합니다.', 'info');
                break;
            }

			if(self.runFlg == false){
				break;
			}


            const btn = likeButtons[i];
            
            // Vue 컴포넌트의 hoverThenClick 함수가 아닌, 유틸리티 함수를 사용합니다.
            // 이 컨텍스트에서는 Vue 인스턴스가 아니므로 직접 정의된 hoverThenClick을 사용해야 하지만,
            // Vue 인스턴스에서 this.hoverThenClick을 호출하는 방식으로 통합합니다.
            // 여기서는 Vue 내부에서 호출되므로, Vue 인스턴스가 제공하는 hoverThenClick을 사용합니다.
            // NOTE: Vue 내부에서 호출되므로, 'targetWindow' 인수를 넘겨 Vue 내부 함수를 사용하도록 처리합니다.
            
            logFunction(`[버튼 클릭] ${i + 1}/${likeButtons.length}번째 버튼 처리 중...`);
            
            // 실제 Vue 인스턴스의 메서드를 호출하는 대신, 버튼을 클릭하는 동작만 정의합니다.
            // Vue 컴포넌트 메서드에서 이 로직을 감싸서 `hoverThenClick`을 호출하게 됩니다.
            
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
            
            // 클릭 시퀀스
            seqDispatch(btn, 'pointerdown', base);
            seqDispatch(btn, 'mousedown', base);
            seqDispatch(btn, 'pointerup', base);
            seqDispatch(btn, 'mouseup', base);
            seqDispatch(btn, 'click', base);
            
            clickedCount++;
            let t = getRandomInt(1000, 5000);
            await new Promise(resolve => setTimeout(resolve, t)); // 1~3초 대기
        }

        logFunction(`총 ${clickedCount}개의 좋아요 버튼 클릭 시뮬레이션 완료.`, 'success');
        return clickedCount;
    }


    // -----------------------------------------------------
    // 2. Vue 앱 구성
    // -----------------------------------------------------

    window.onload = function() {
		injectAppStyles();
        new Vue({
            el: '#app',
            data: {
                // [API] 내 아이디 (하드코딩)
                MY_ID: window.MY_ID, 
                version: window.version,
                LOCAL_STORAGE_KEY: 'BoardManagersData',
				runFlg : false,
                
                // [New] 모든 게시판/게시물이 사용하는 공통 URL
                BOARD_URL: window.BOARD_URL, //'https://common-site.com/board/list/', // manager.id를 붙이기 위해 / 로 끝남
                POST_URL: window.POST_URL, //'https://common-site.com/board/view',
                
                // [New] 메인 창의 document 객체를 담을 변수
                targetWindow: null, 

                // UI 상태
                currentTab: 'manage',
                currentBoardType: 'T1', // 기본 그룹: T1

                // 핵심 데이터 저장소: 키는 'T' + groupId
                managerData: { 'T1': [] }, 
                currentManagersText: '', 
                logMessages: [],
                
                // 공통 자동화 옵션 (현재는 미사용)
                globalAutomationOptions: {
                    option1: false, 
                    option2: false 
                },

                // API 로딩 상태
                api: {
                    isLoading: false,
                    currentPage: 1,
                    sortType: 2, 
                },
                
                // 자동화 상태 관리
                automation: {
                    isProcessing: false,
                    totalManagers: 0,
                    processedManagers: 0,
                    currentManager: { id: '', nickname: '' },
                    // fnBtnclick 방식에서는 게시물 단위의 진척도는 필요 없습니다.
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
                    
                    return (this.automation.processedManagers / totalCurrentManagers) * 100;
                }
            },
            watch: {
                currentBoardType() {
                    this.updateTextareaDisplay();
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
                // [Vue 기본 로직]
                // -----------------------------------------------------
                log(message, type = 'info') {
                    const now = new Date();
                    const timeStr = now.toLocaleTimeString('ko-KR');
                    const className = 'log-' + type;
                    
                    this.logMessages.unshift({ time: timeStr, message: message, class: className });
                    
                    if (this.logMessages.length > 50) {
                        this.logMessages.pop(); 
                    }
                },
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
                    this.log('게시판 타입 [' + this.currentBoardType + ']의 목록 ' + managers.length + '명을 표시했습니다.', 'info');
                },
                saveToLocalStorage() {
                    this.saveTextareaContent(); 
                    try {
                        const dataToSave = {
                            managerData: this.managerData,
                            globalAutomationOptions: this.globalAutomationOptions 
                        };
                        const jsonString = JSON.stringify(dataToSave);
                        localStorage.setItem(this.LOCAL_STORAGE_KEY, jsonString);
                        this.log('Local Storage 저장 성공. 총 ' + this.totalManagerCount + '명의 담당자 정보가 저장되었습니다.', 'success');
                    } catch (e) {
                        this.log('Local Storage 저장 중 오류 발생: ' + e.message, 'error');
                    }
                },
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

                            this.updateTextareaDisplay();
                            this.log('Local Storage에서 담당자 목록 (' + this.totalManagerCount + '명)을 성공적으로 불러왔습니다.', 'success');
                        } else {
                            this.log('Local Storage 데이터 구조가 유효하지 않아 로드하지 못했습니다.', 'error');
                        }
                    } catch (e) {
                        this.log('Local Storage 불러오기 중 오류 발생: ' + e.message, 'error');
                    }
                },
                
                // API 연동 로직 (이전 버전과 동일하게 유지)
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
                            
                            const params = new URLSearchParams({pageNo: pageNo, sortType: sortType});
                            let url = "/api/blogs/" + this.MY_ID + "/my-buddies?" + params.toString();

                            this.log(`[API] ${pageNo} 페이지 호출 중... URL: ${url}`, 'info');

                            // 실제 fetch 대신 시뮬레이션을 사용
                            //const apiResponse = await this.simulateApiCall(pageNo, sortType);
                            const response = await fetch(url);
                            const apiResponse = await response.json(); 
                            
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
                                
                                // 중복 확인 후 추가
                                if (!this.managerData[typeKey].some(m => m.id === manager.id)) {
                                    this.managerData[typeKey].push(manager);
                                }
                            });

                            this.api.currentPage++;
                            let t = getRandomInt(500, 900);
                            await new Promise(r => setTimeout(r, t)); 
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
                
                // API 호출 시뮬레이션 함수 (실제 API 연동 시 이 함수를 제거하고 fetch를 사용해야 함)
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

                // -----------------------------------------------------
                // 3. 자동화 핵심 로직 (요청에 따라 단순화 및 URL 수정)
                // -----------------------------------------------------
                async startBoardAutomation() {
                    if (!window.opener || window.opener.closed) {
                        this.log('자동화 작업을 시작할 메인 창(opener)이 열려있지 않거나 닫혀 있습니다.', 'error');
                        return;
                    }
                    this.targetWindow = window.opener;
					if(this.runFlg == false){
						this.runFlg = true;
					} else {
						this.runFlg = false;
						this.automation.isProcessing = false;
					}
					if(this.runFlg == false){
						return;
					}

                    this.saveTextareaContent();
                    
                    const currentType = this.currentBoardType;
                    const managers = this.managerData[currentType] || [];
                    const totalManagers = managers.length;
                    
                    if (totalManagers === 0) {
                        this.log(`타입 ${currentType}에 담당자가 없습니다. 목록을 확인해주세요.`, 'error');
                        return;
                    }
                    
                    this.automation.isProcessing = true;
                    this.automation.totalManagers = totalManagers;
                    this.automation.processedManagers = 0;
                    this.automation.currentManager = { id: '', nickname: '' };

                    this.log(`### 타입 ${currentType} 자동화 (${totalManagers}명) 시작합니다. ###`, 'info');

                    for (const manager of managers) {
                        if (!this.automation.isProcessing) {
                            this.log('사용자에 의해 자동화 작업이 중지되었습니다.', 'info');
                            break; 
                        }

                        this.automation.currentManager = manager;
                            
                        // 페이지 로딩 대기
                        let loadt = getRandomInt(2000, 7000);
                        await new Promise(r => setTimeout(r, loadt));

                        // 게시판 URL을 사용하여 담당자 게시판으로 이동 및 클릭 시뮬레이션 실행
                        await this.processManagerBoard(currentType, manager); 

                        this.automation.processedManagers++;
                        this.log(`[타입 ${currentType}] ${manager.nickname} (${manager.id}) 담당자 처리 완료!`, 'success');
                    }

                    this.automation.isProcessing = false;
                    if (!this.logMessages[0].message.includes("중지되었습니다")) {
                        this.log('### 자동화 확인 처리 완료! ###', 'success');
                    }
                },

                /**
                 * [List] 담당자 ID를 붙인 URL로 이동하고 fnBtnclick 로직을 실행합니다.
                 * processSinglePost 로직은 제거되었습니다.
                 */
                async processManagerBoard(type, manager) {
					if(this.runFlg == false){
						return;
					}
                    this.log(`[${manager.nickname} (${manager.id})] 이동 중...`);
                    
                    // [변경 요청 반영] BOARD_URL + manager.id 로 이동
                    const finalUrl = this.BOARD_URL + manager.id; 
                    this.targetWindow.location.href = finalUrl;

                    // 페이지 로딩 대기
                    let loadt = getRandomInt(2000, 3000);
                    await new Promise(r => setTimeout(r, loadt)); 

                    // fnBtnclick 실행 로직
                    this.log(`[${manager.id}] 게시판 로딩 완료. 좋아요 버튼 클릭 로직 시작.`, 'info');
                    
                    // fnBtnclick 유틸리티 함수를 메인 창의 컨텍스트에서 실행
                    await fnBtnclick(this.targetWindow, this.log.bind(this), this.automation);
                    
                    // fnBtnclick이 완료되면 다음 담당자로 넘어갑니다.
                    let t = getRandomInt(3000, 13000);
                    await new Promise(r => setTimeout(r, t)); // 다음 담당자 처리 전 잠깐 대기
                },

                // 이전 processSinglePost 함수는 제거되었습니다.
            },
            mounted() {
                if (window.opener) {
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
    };
