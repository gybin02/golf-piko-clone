/* ==========================================================================
   GOLF PIKO - 游戏核心逻辑 (升级版)
   ========================================================================== */

// 简易 Web Audio 音效合成器
const AudioSynth = {
    ctx: null,
    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    },
    resume() {
        this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },
    playRoll() {
        this.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(90, this.ctx.currentTime + 0.25);
        
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.25);
    },
    playHit() {
        this.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.ctx.currentTime + 0.1);
        
        gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    },
    playCollect() {
        this.resume();
        const now = this.ctx.currentTime;
        [880, 1320].forEach((f, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, now + idx * 0.05);
            gain.gain.setValueAtTime(0.08, now + idx * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.3);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + idx * 0.05);
            osc.stop(now + idx * 0.05 + 0.3);
        });
    },
    playPortal() {
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        // 科幻穿梭感音效：频率快速上升
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.25);
        
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.linearRampToValueAtTime(0.12, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(now + 0.25);
    },
    playSplash() {
        this.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(240, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(60, this.ctx.currentTime + 0.35);
        
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.38);
    },
    playWin() {
        this.resume();
        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((f, index) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(f, now + index * 0.08);
            gain.gain.setValueAtTime(0.12, now + index * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.01, now + index * 0.08 + 0.25);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + index * 0.08);
            osc.stop(now + index * 0.08 + 0.3);
        });
    }
};

// ==========================================================================
// 关卡数据定义
// .：普通草地
// x：空单元格（形成板块轮廓）
// w：水池（重置）
// s：木质沙坑/墙壁（阻挡）
// p：紫色收集区（带一颗钻石）
// h：洞口（红旗）
// b：粉色触发按钮
// g：受控的木墙门
// t、T：橙色传送门对 (互通)
// u、U：蓝色传送门对 (互通)
// ==========================================================================
const LEVELS = [
    {
        name: "01. 启航",
        cols: 5,
        rows: 5,
        map: [
            ['.', '.', '.', '.', '.'],
            ['.', 's', 'x', 's', '.'],
            ['.', '.', 'p', '.', '.'],
            ['.', 's', 'x', 's', '.'],
            ['h', '.', '.', '.', '.']
        ],
        start: { row: 0, col: 4 },
        diamonds: [{ row: 2, col: 2, collected: false }]
    },
    {
        name: "02. 激流绕行",
        cols: 6,
        rows: 5,
        map: [
            ['.', '.', '.', '.', '.', '.'],
            ['.', 'w', 'w', 's', 's', '.'],
            ['.', '.', 'p', '.', '.', '.'],
            ['s', 's', 'w', 'w', 'p', '.'],
            ['h', '.', '.', '.', '.', '.']
        ],
        start: { row: 0, col: 0 },
        diamonds: [
            { row: 2, col: 2, collected: false },
            { row: 3, col: 4, collected: false }
        ]
    },
    {
        name: "03. Piko 经典",
        cols: 6,
        rows: 7,
        map: [
            ['s', 'x', '.', '.', 'p', 'x'],
            ['w', 'x', '.', '.', '.', 'x'],
            ['.', '.', '.', '.', '.', 'x'],
            ['x', 'x', '.', '.', 'x', 'p'],
            ['h', 'x', '.', 'b', '.', '.'],
            ['x', '.', '.', '.', '.', '.'],
            ['x', 'p', '.', '.', 'p', 'w']
        ],
        start: { row: 2, col: 1 },
        diamonds: [
            { row: 0, col: 4, collected: false },
            { row: 3, col: 5, collected: false },
            { row: 6, col: 1, collected: false },
            { row: 6, col: 4, collected: false }
        ],
        gate: { row: 4, col: 4 }
    },
    {
        name: "04. 虫洞穿梭",
        cols: 6,
        rows: 6,
        map: [
            ['.', '.', '.', 'x', 'x', 'x'],
            ['.', 'w', '.', 't', 'x', 'x'],
            ['.', 's', 'x', '.', '.', 'p'],
            ['T', '.', 'w', 'u', 'w', '.'],
            ['x', 'x', 'x', 's', 'x', 'h'],
            ['p', '.', '.', 'U', '.', '.']
        ],
        start: { row: 0, col: 0 },
        diamonds: [
            { row: 2, col: 5, collected: false },
            { row: 5, col: 0, collected: false }
        ]
    },
    {
        name: "05. 终极大挑战",
        cols: 6,
        rows: 8,
        map: [
            ['.', '.', '.', 's', 'x', 'x'],
            ['.', 'w', '.', '.', 'p', 'x'],
            ['.', 'b', 'x', 'x', '.', 'x'],
            ['x', 'x', 'x', 'x', 't', 'x'],
            ['h', 'x', 'x', 'x', '.', 'x'],
            ['g', '.', '.', '.', '.', 'p'],
            ['x', 'x', 'T', 'x', 'x', 'x'],
            ['p', '.', '.', '.', 'p', 'w']
        ],
        start: { row: 0, col: 0 },
        diamonds: [
            { row: 1, col: 4, collected: false },
            { row: 5, col: 5, collected: false },
            { row: 7, col: 0, collected: false },
            { row: 7, col: 4, collected: false }
        ],
        gate: { row: 5, col: 0 }
    }
];

// ==========================================================================
// 游戏状态管理
// ==========================================================================
let currentLevelIndex = 0;
let currentLevel = null;
let ballPos = { row: 0, col: 0 };
let steps = 0;
let collectedDiamondsCount = 0;
let totalDiamondsCount = 0;
let isMoving = false;
let isGateOpen = false;

// DOM 元素引用
const boardBase = document.getElementById('game-board');
const levelNameEl = document.getElementById('level-name');
const stepCountEl = document.getElementById('step-count');
const diamondRatioEl = document.getElementById('diamond-ratio');
const resetBtn = document.getElementById('reset-btn');
const prevBtn = document.getElementById('prev-btn');
const victoryModal = document.getElementById('victory-modal');
const victoryStepsEl = document.getElementById('victory-steps');
const victoryDiamondsEl = document.getElementById('victory-diamonds');
const nextLevelBtn = document.getElementById('next-level-btn');
const tipToast = document.getElementById('tip-toast');

let ballEl = null;
let ballShadowEl = null;

// ==========================================================================
// 地图渲染器
// ==========================================================================
function initLevel(index) {
    if (boardBase.children.length > 0) {
        // 先淡出离场
        boardBase.classList.add('board-leave');
        setTimeout(() => {
            setupNewLevel(index);
        }, 250);
    } else {
        setupNewLevel(index);
    }
}

function setupNewLevel(index) {
    currentLevelIndex = index;
    currentLevel = JSON.parse(JSON.stringify(LEVELS[index])); // 深拷贝
    ballPos = { ...currentLevel.start };
    steps = 0;
    collectedDiamondsCount = 0;
    totalDiamondsCount = currentLevel.diamonds.length;
    isMoving = false;
    isGateOpen = false;

    // 更新UI
    levelNameEl.textContent = currentLevel.name;
    stepCountEl.textContent = steps;
    updateDiamondUI();
    victoryModal.classList.remove('active');

    // 渲染网格
    renderBoard();
    
    // 入场动效
    boardBase.classList.remove('board-leave');
    boardBase.classList.add('board-enter');
    
    // 强制触发重绘
    boardBase.offsetHeight;
    
    boardBase.classList.remove('board-enter');
    
    showToast();
}

function updateDiamondUI() {
    diamondRatioEl.textContent = `${collectedDiamondsCount} / ${totalDiamondsCount}`;
}

function renderBoard() {
    boardBase.innerHTML = '';
    
    const { rows, cols, map } = currentLevel;
    
    boardBase.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
    boardBase.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    boardBase.style.setProperty('--cols', cols);
    boardBase.style.setProperty('--rows', rows);
    
    const maxBoardWidth = 360;
    const tileWidth = maxBoardWidth / Math.max(rows, cols);
    boardBase.style.width = `${tileWidth * cols}px`;
    boardBase.style.height = `${tileWidth * rows}px`;

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const tileType = map[r][c];
            const tileEl = document.createElement('div');
            tileEl.className = 'tile';
            tileEl.dataset.row = r;
            tileEl.dataset.col = c;

            const isLight = (r + c) % 2 === 0;

            // 1. 基本贴图渲染
            switch (tileType) {
                case 'x':
                    tileEl.classList.add('tile-empty');
                    break;
                case '.':
                    tileEl.classList.add('tile-grass', isLight ? 'light' : 'dark');
                    break;
                case 'w':
                    tileEl.classList.add('tile-water');
                    break;
                case 's':
                    tileEl.classList.add('tile-sand');
                    break;
                case 'p':
                    tileEl.classList.add('tile-target');
                    if (hasDiamondAt(r, c)) {
                        const diamondEl = document.createElement('span');
                        diamondEl.className = 'diamond';
                        diamondEl.id = `diamond-${r}-${c}`;
                        diamondEl.textContent = '💎';
                        tileEl.appendChild(diamondEl);
                    }
                    break;
                case 'h':
                    tileEl.classList.add('tile-grass', isLight ? 'light' : 'dark', 'tile-hole');
                    const cupEl = document.createElement('div');
                    cupEl.className = 'hole-cup';
                    const poleEl = document.createElement('div');
                    poleEl.className = 'flagpole';
                    const flagEl = document.createElement('div');
                    flagEl.className = 'flag';
                    poleEl.appendChild(flagEl);
                    cupEl.appendChild(poleEl);
                    tileEl.appendChild(cupEl);
                    break;
                case 'b':
                    tileEl.classList.add('tile-grass', isLight ? 'light' : 'dark');
                    const switchEl = document.createElement('div');
                    switchEl.className = 'switch-button';
                    switchEl.id = 'gate-switch';
                    tileEl.appendChild(switchEl);
                    break;
                case 't':
                case 'T':
                    // 橙色传送门
                    tileEl.classList.add('tile-grass', isLight ? 'light' : 'dark');
                    const portalOrange = document.createElement('div');
                    portalOrange.className = 'tile-portal';
                    tileEl.appendChild(portalOrange);
                    break;
                case 'u':
                case 'U':
                    // 蓝色传送门
                    tileEl.classList.add('tile-grass', isLight ? 'light' : 'dark');
                    const portalBlue = document.createElement('div');
                    portalBlue.className = 'tile-portal portal-blue';
                    tileEl.appendChild(portalBlue);
                    break;
            }

            // 渲染受控门
            if (currentLevel.gate && currentLevel.gate.row === r && currentLevel.gate.col === c) {
                tileEl.classList.add('tile-grass', isLight ? 'light' : 'dark');
                const gateEl = document.createElement('div');
                gateEl.className = 'gate-wall';
                gateEl.id = 'gate-wall';
                tileEl.appendChild(gateEl);
            }

            // 2. 自适应边缘大圆角检测 (像自适应瓦片系统，打磨浮岛边界)
            if (tileType !== 'x') {
                const isEdgeEmpty = (rowOffset, colOffset) => {
                    const targetRow = r + rowOffset;
                    const targetCol = c + colOffset;
                    if (targetRow < 0 || targetRow >= rows || targetCol < 0 || targetCol >= cols) return true;
                    return map[targetRow][targetCol] === 'x';
                };

                const topEmpty = isEdgeEmpty(-1, 0);
                const bottomEmpty = isEdgeEmpty(1, 0);
                const leftEmpty = isEdgeEmpty(0, -1);
                const rightEmpty = isEdgeEmpty(0, 1);

                const radiusVal = '20px';
                if (topEmpty && leftEmpty) tileEl.style.borderTopLeftRadius = radiusVal;
                if (topEmpty && rightEmpty) tileEl.style.borderTopRightRadius = radiusVal;
                if (bottomEmpty && leftEmpty) tileEl.style.borderBottomLeftRadius = radiusVal;
                if (bottomEmpty && rightEmpty) tileEl.style.borderBottomRightRadius = radiusVal;
            }

            boardBase.appendChild(tileEl);
        }
    }

    // 生成球的阴影与本体
    ballShadowEl = document.createElement('div');
    ballShadowEl.className = 'ball-shadow';
    boardBase.appendChild(ballShadowEl);

    ballEl = document.createElement('div');
    ballEl.className = 'ball-element';
    boardBase.appendChild(ballEl);

    updateBallDOMPosition(false);
}

function hasDiamondAt(r, c) {
    return currentLevel.diamonds.some(d => d.row === r && d.col === c && !d.collected);
}

// 寻找配对传送门
function findPortalPartner(type, fromRow, fromCol) {
    const partnerType = type === type.toLowerCase() ? type.toUpperCase() : type.toLowerCase();
    const { rows, cols, map } = currentLevel;
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (map[r][c] === partnerType && (r !== fromRow || c !== fromCol)) {
                return { row: r, col: c };
            }
        }
    }
    return null;
}

// ==========================================================================
// 运动计算与反馈控制
// ==========================================================================
function updateBallDOMPosition(animate = true) {
    setDOMPosition(ballPos.row, ballPos.col, animate);
}

function setDOMPosition(r, c, animate = true, duration = 0.3) {
    if (!animate) {
        ballEl.style.transition = 'none';
        ballShadowEl.style.transition = 'none';
    } else {
        ballEl.style.transition = `left ${duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94), top ${duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 0.15s ease`;
        ballShadowEl.style.transition = `left ${duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94), top ${duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
    }

    // 清空旧的直接定位值，让 CSS 变量定位公式生效
    ballEl.style.left = '';
    ballEl.style.top = '';
    ballShadowEl.style.left = '';
    ballShadowEl.style.top = '';

    // 设置坐标索引变量，交由 CSS 进行高精度缩放定位
    ballEl.style.setProperty('--col-idx', c);
    ballEl.style.setProperty('--row-idx', r);
    ballShadowEl.style.setProperty('--col-idx', c);
    ballShadowEl.style.setProperty('--row-idx', r);
}

// 核心滑动决策：小球沿着方向滑动直到碰到障碍，支持传送门穿梭
function slideBall(dx, dy) {
    if (isMoving) return;
    
    let curRow = ballPos.row;
    let curCol = ballPos.col;
    let stepSequence = []; // 记录滚动的每一格
    let teleportEvents = []; // 记录所有的传送事件
    let status = "normal"; // "normal", "water", "hole"
    
    const visitedTiles = new Set();
    const cycleDetectionKey = (r, c, x, y) => `${r},${c},${x},${y}`;

    while (true) {
        let nextRow = curRow + dy;
        let nextCol = curCol + dx;
        
        // 1. 越界阻挡
        if (nextRow < 0 || nextRow >= currentLevel.rows || nextCol < 0 || nextCol >= currentLevel.cols) {
            break;
        }
        
        const nextTile = currentLevel.map[nextRow][nextCol];
        
        // 2. 空单元格阻挡
        if (nextTile === 'x') {
            break;
        }
        
        // 3. 沙坑/木墙阻挡
        if (nextTile === 's') {
            break;
        }
        
        // 4. 机关木门阻挡 (未打开前)
        const isGate = currentLevel.gate && currentLevel.gate.row === nextRow && currentLevel.gate.col === nextCol;
        if (isGate && !isGateOpen) {
            break;
        }
        
        // 行进一格
        curRow = nextRow;
        curCol = nextCol;
        
        // 5. 传送门穿越处理
        const isPortal = ['t', 'T', 'u', 'U'].includes(nextTile);
        if (isPortal) {
            const partner = findPortalPartner(nextTile, curRow, curCol);
            if (partner) {
                // 死循环防范
                const key = cycleDetectionKey(curRow, curCol, dx, dy);
                if (visitedTiles.has(key)) {
                    break;
                }
                visitedTiles.add(key);
                
                // 将传送入口格记入序列
                stepSequence.push({ row: curRow, col: curCol, tile: nextTile });
                
                // 瞬间穿越坐标
                curRow = partner.row;
                curCol = partner.col;
                
                // 记录传送事件
                teleportEvents.push({
                    from: { row: stepSequence[stepSequence.length - 1].row, col: stepSequence[stepSequence.length - 1].col },
                    to: { row: curRow, col: curCol }
                });
                
                continue; // 从传送出口继续滑
            }
        }
        
        stepSequence.push({ row: curRow, col: curCol, tile: nextTile });
        
        // 6. 水池终结
        if (nextTile === 'w') {
            status = "water";
            break;
        }
        
        // 7. 终点洞口终结
        if (nextTile === 'h') {
            status = "hole";
            break;
        }
    }
    
    if (stepSequence.length === 0) return;
    
    // 增加步数
    steps++;
    stepCountEl.textContent = steps;
    
    // 开始运行多段运动队列
    isMoving = true;
    
    // 构造运动行为队列
    const actionQueue = [];
    let currentTiles = [];
    
    for (let i = 0; i < stepSequence.length; i++) {
        const step = stepSequence[i];
        currentTiles.push(step);
        
        const isPortal = ['t', 'T', 'u', 'U'].includes(step.tile);
        if (isPortal) {
            // 这段路终结在传送入口
            actionQueue.push({
                type: 'slide',
                to: { row: step.row, col: step.col },
                tiles: [...currentTiles]
            });
            currentTiles = [];
            
            // 找出传送目标
            const teleEvent = teleportEvents.find(e => e.from.row === step.row && e.from.col === step.col);
            if (teleEvent) {
                actionQueue.push({
                    type: 'teleport',
                    from: teleEvent.from,
                    to: teleEvent.to
                });
            }
        }
    }
    
    if (currentTiles.length > 0) {
        actionQueue.push({
            type: 'slide',
            to: { row: stepSequence[stepSequence.length - 1].row, col: stepSequence[stepSequence.length - 1].col },
            tiles: [...currentTiles]
        });
    }
    
    // 开始播放动作队列
    executeActionQueue(actionQueue, 0, dx, dy, () => {
        // 全段播放完毕，检查终结状态
        if (status === "water") {
            handleSplash();
        } else if (status === "hole") {
            handleWin();
        } else {
            isMoving = false;
        }
    });
}

// 递归式执行分段路径动画
function executeActionQueue(queue, index, dx, dy, onFinish) {
    if (index >= queue.length) {
        onFinish();
        return;
    }
    
    const action = queue[index];
    
    if (action.type === 'slide') {
        const moveDuration = 0.12 + (action.tiles.length * 0.05);
        
        // 挤压形变
        const stretchX = dx !== 0 ? 1.15 : 0.95;
        const stretchY = dy !== 0 ? 1.15 : 0.95;
        ballEl.style.transform = `scale(${stretchX}, ${stretchY})`;
        
        // 设置移动
        setDOMPosition(action.to.row, action.to.col, true, moveDuration);
        AudioSynth.playRoll();
        
        // 沿途事件触发器
        action.tiles.forEach((step, idx) => {
            const ratio = (idx + 1) / action.tiles.length;
            const triggerDelay = ratio * moveDuration * 1000;
            
            if (step.tile === 'p') {
                setTimeout(() => collectDiamondAt(step.row, step.col), triggerDelay - 50);
            }
            if (step.tile === 'b') {
                setTimeout(() => triggerGateSwitch(), triggerDelay);
            }
        });
        
        setTimeout(() => {
            ballEl.style.transform = 'scale(1)';
            AudioSynth.playHit();
            
            // 更新当前逻辑位置，开启下一步
            ballPos.row = action.to.row;
            ballPos.col = action.to.col;
            executeActionQueue(queue, index + 1, dx, dy, onFinish);
        }, moveDuration * 1000);
        
    } else if (action.type === 'teleport') {
        // 缩回淡出
        ballEl.style.transition = 'transform 0.12s ease-out, opacity 0.12s ease-out';
        ballEl.style.transform = 'scale(0)';
        ballEl.style.opacity = '0';
        
        ballShadowEl.style.transition = 'transform 0.12s ease-out, opacity 0.12s ease-out';
        ballShadowEl.style.transform = 'scale(0)';
        ballShadowEl.style.opacity = '0';
        
        AudioSynth.playPortal();
        
        setTimeout(() => {
            // 瞬间传送并移位
            ballPos.row = action.to.row;
            ballPos.col = action.to.col;
            setDOMPosition(action.to.row, action.to.col, false);
            
            // 弹出还原
            setTimeout(() => {
                ballEl.style.transition = 'transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.15s ease';
                ballEl.style.transform = 'scale(1)';
                ballEl.style.opacity = '1';
                
                ballShadowEl.style.transition = 'transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.15s ease';
                ballShadowEl.style.transform = 'scale(1)';
                ballShadowEl.style.opacity = '1';
                
                setTimeout(() => {
                    executeActionQueue(queue, index + 1, dx, dy, onFinish);
                }, 150);
            }, 50);
        }, 120);
    }
}

// 收集钻石
function collectDiamondAt(r, c) {
    const diamondIndex = currentLevel.diamonds.findIndex(d => d.row === r && d.col === c && !d.collected);
    if (diamondIndex !== -1) {
        currentLevel.diamonds[diamondIndex].collected = true;
        collectedDiamondsCount++;
        updateDiamondUI();
        
        const dEl = document.getElementById(`diamond-${r}-${c}`);
        if (dEl) {
            dEl.style.transform = 'scale(0) translateY(-20px)';
            dEl.style.opacity = '0';
            dEl.style.transition = 'all 0.3s ease-out';
            AudioSynth.playCollect();
        }
    }
}

// 踩下触发按钮，缩回关卡门
function triggerGateSwitch() {
    if (isGateOpen) return;
    isGateOpen = true;
    
    const switchEl = document.getElementById('gate-switch');
    if (switchEl) {
        switchEl.classList.add('pressed');
    }
    
    const gateEl = document.getElementById('gate-wall');
    if (gateEl) {
        gateEl.classList.add('open');
        AudioSynth.playCollect();
    }
}

// 落水重置
function handleSplash() {
    ballEl.classList.add('splash');
    AudioSynth.playSplash();
    
    setTimeout(() => {
        ballPos = { ...currentLevel.start };
        ballEl.classList.remove('splash');
        updateBallDOMPosition(false);
        isMoving = false;
    }, 500);
}

// 胜利通关
function handleWin() {
    ballEl.classList.add('sink');
    AudioSynth.playWin();
    
    setTimeout(() => {
        victoryStepsEl.textContent = steps;
        
        const allCollected = collectedDiamondsCount === totalDiamondsCount;
        if (allCollected) {
            victoryDiamondsEl.textContent = `完美！收集了所有 ${totalDiamondsCount} 颗钻石！💎`;
            victoryDiamondsEl.style.color = '#388e3c';
        } else {
            victoryDiamondsEl.textContent = `收集了 ${collectedDiamondsCount}/${totalDiamondsCount} 颗钻石 (可重试收集全部) 💎`;
            victoryDiamondsEl.style.color = '#e65100';
        }
        
        victoryModal.classList.add('active');
        isMoving = false;
    }, 600);
}

// ==========================================================================
// 控制与事件监听
// ==========================================================================

resetBtn.addEventListener('click', () => {
    AudioSynth.playHit();
    initLevel(currentLevelIndex);
});

prevBtn.addEventListener('click', () => {
    AudioSynth.playHit();
    if (currentLevelIndex > 0) {
        initLevel(currentLevelIndex - 1);
    } else {
        initLevel(0);
    }
});

nextLevelBtn.addEventListener('click', () => {
    AudioSynth.playHit();
    if (currentLevelIndex < LEVELS.length - 1) {
        initLevel(currentLevelIndex + 1);
    } else {
        initLevel(0);
    }
});

function showToast() {
    tipToast.classList.add('show');
    setTimeout(() => {
        tipToast.classList.remove('show');
    }, 3500);
}

// 1. 键盘方向键/WASD 逻辑
window.addEventListener('keydown', (e) => {
    if (isMoving || victoryModal.classList.contains('active')) return;
    
    switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
            slideBall(0, -1);
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            if (e.key !== 's') slideBall(0, 1);
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            slideBall(-1, 0);
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            slideBall(1, 0);
            break;
    }
});

// 2. 移动端触屏滑动手势识别 (Swipe)
let touchStartX = 0;
let touchStartY = 0;

window.addEventListener('touchstart', (e) => {
    AudioSynth.resume();
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
}, { passive: true });

window.addEventListener('touchend', (e) => {
    if (isMoving || victoryModal.classList.contains('active')) return;
    
    const touchEndX = e.changedTouches[0].screenX;
    const touchEndY = e.changedTouches[0].screenY;
    
    const diffX = touchEndX - touchStartX;
    const diffY = touchEndY - touchStartY;
    const threshold = 35;
    
    if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > threshold) {
            if (diffX > 0) slideBall(1, 0);
            else slideBall(-1, 0);
        }
    } else {
        if (Math.abs(diffY) > threshold) {
            if (diffY > 0) slideBall(0, 1);
            else slideBall(0, -1);
        }
    }
}, { passive: true });

// 启动第一关
window.addEventListener('DOMContentLoaded', () => {
    initLevel(0);
});
