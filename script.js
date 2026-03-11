// ============ STATE ============
let processes = [];
let processCounter = 1;
let currentAlgo = 'fcfs';
let simulationResult = null;
let stepState = null;
let autoPlayInterval = null;

const COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA',
    '#F1948A', '#AED6F1', '#D7BDE2', '#A3E4D7', '#FAD7A0',
    '#ABEBC6', '#D2B4DE', '#AED6F1', '#F9E79F', '#A9CCE3'
];

const ALGO_DESCRIPTIONS = {
    'fcfs': '<strong>First Come First Serve (FCFS):</strong> Processes are executed in the order they arrive. Simple but can cause convoy effect.',
    'sjf': '<strong>Shortest Job First (SJF - Non-Preemptive):</strong> Process with smallest burst time is selected next. Optimal for average waiting time among non-preemptive.',
    'srtf': '<strong>Shortest Remaining Time First (SRTF):</strong> Preemptive version of SJF. Running process can be interrupted if a shorter job arrives.',
    'rr': '<strong>Round Robin (RR):</strong> Each process gets a fixed time quantum. Provides fair CPU allocation. Good for time-sharing systems.',
    'priority-np': '<strong>Priority (Non-Preemptive):</strong> Process with highest priority (lowest number) runs to completion. Can cause starvation.',
    'priority-p': '<strong>Priority (Preemptive):</strong> Running process is preempted if a higher priority process arrives. Lower number = higher priority.'
};

// ============ UI SETUP ============
document.querySelectorAll('.algo-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelector('.algo-btn.active').classList.remove('active');
        btn.classList.add('active');
        currentAlgo = btn.dataset.algo;

        document.getElementById('tqContainer').classList.toggle('show', currentAlgo === 'rr');

        const showPriority = currentAlgo.startsWith('priority');
        document.getElementById('inputPanel').classList.toggle('show-priority', showPriority);

        document.getElementById('algoDesc').innerHTML = ALGO_DESCRIPTIONS[currentAlgo];

        resetSimulation();
    });
});

document.getElementById('speedSlider').addEventListener('input', (e) => {
    document.getElementById('speedLabel').textContent = e.target.value + 'x';
});

document.getElementById('processId').value = 'P' + processCounter;

// ============ PROCESS MANAGEMENT ============
function addProcess() {
    const arrival = parseInt(document.getElementById('arrivalTime').value) || 0;
    const burst = parseInt(document.getElementById('burstTime').value);
    const priority = parseInt(document.getElementById('priorityVal').value) || 1;

    if (!burst || burst < 1) {
        alert('Please enter a valid burst time (≥ 1)');
        return;
    }

    const process = {
        id: 'P' + processCounter,
        arrival: arrival,
        burst: burst,
        priority: priority,
        color: COLORS[(processCounter - 1) % COLORS.length]
    };

    processes.push(process);
    processCounter++;
    document.getElementById('processId').value = 'P' + processCounter;
    document.getElementById('arrivalTime').value = '';
    document.getElementById('burstTime').value = '';
    document.getElementById('priorityVal').value = '1';

    renderProcessTable();
    updateControlVisibility();
    resetSimulation();
}

function deleteProcess(id) {
    processes = processes.filter(p => p.id !== id);
    renderProcessTable();
    updateControlVisibility();
    resetSimulation();
}

function generateRandom() {
    clearAll();
    const count = 5;
    for (let i = 0; i < count; i++) {
        processes.push({
            id: 'P' + processCounter,
            arrival: Math.floor(Math.random() * 8),
            burst: Math.floor(Math.random() * 8) + 1,
            priority: Math.floor(Math.random() * 5) + 1,
            color: COLORS[(processCounter - 1) % COLORS.length]
        });
        processCounter++;
    }
    document.getElementById('processId').value = 'P' + processCounter;
    renderProcessTable();
    updateControlVisibility();
}

function clearAll() {
    processes = [];
    processCounter = 1;
    document.getElementById('processId').value = 'P1';
    renderProcessTable();
    updateControlVisibility();
    resetSimulation();
    document.getElementById('ganttPanel').style.display = 'none';
    document.getElementById('resultsPanel').style.display = 'none';
    document.getElementById('comparePanel').style.display = 'none';
    document.getElementById('queueStatePanel').style.display = 'none';
}

function renderProcessTable() {
    const tbody = document.getElementById('processTableBody');
    const emptyState = document.getElementById('emptyState');

    if (processes.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';
    tbody.innerHTML = processes.map(p => `
        <tr class="highlight-row">
            <td><span class="color-dot" style="background:${p.color}"></span></td>
            <td>${p.id}</td>
            <td>${p.arrival}</td>
            <td>${p.burst}</td>
            <td class="priority-col">${p.priority}</td>
            <td><button class="delete-btn" onclick="deleteProcess('${p.id}')">✕</button></td>
        </tr>
    `).join('');
}

function updateControlVisibility() {
    document.getElementById('controlPanel').style.display = processes.length > 0 ? 'block' : 'none';
}

// ============ SCHEDULING ALGORITHMS ============
function runAlgorithm(algo, procs, tq) {
    const p = procs.map(proc => ({
        ...proc,
        remaining: proc.burst,
        completed: false,
        startTime: -1,
        completionTime: 0,
        firstResponse: -1
    }));

    let gantt = [];
    let time = 0;
    let completed = 0;
    const n = p.length;
    const maxTime = 500;

    // For Round Robin queue state tracking
    let queueStates = [];

    if (algo === 'fcfs') {
        const sorted = [...p].sort((a, b) => a.arrival - b.arrival || a.id.localeCompare(b.id));
        sorted.forEach(proc => {
            if (time < proc.arrival) {
                gantt.push({ id: 'Idle', start: time, end: proc.arrival, color: 'transparent' });
                time = proc.arrival;
            }
            proc.startTime = time;
            proc.firstResponse = time;
            gantt.push({ id: proc.id, start: time, end: time + proc.burst, color: proc.color });
            time += proc.burst;
            proc.completionTime = time;
            proc.remaining = 0;
            proc.completed = true;
        });
    }
    else if (algo === 'sjf') {
        while (completed < n && time < maxTime) {
            const available = p.filter(proc => !proc.completed && proc.arrival <= time);
            if (available.length === 0) {
                const next = p.filter(proc => !proc.completed).sort((a, b) => a.arrival - b.arrival)[0];
                gantt.push({ id: 'Idle', start: time, end: next.arrival, color: 'transparent' });
                time = next.arrival;
                continue;
            }
            available.sort((a, b) => a.burst - b.burst || a.arrival - b.arrival);
            const proc = available[0];
            proc.startTime = time;
            proc.firstResponse = time;
            gantt.push({ id: proc.id, start: time, end: time + proc.burst, color: proc.color });
            time += proc.burst;
            proc.completionTime = time;
            proc.remaining = 0;
            proc.completed = true;
            completed++;
        }
    }
    else if (algo === 'srtf') {
        while (completed < n && time < maxTime) {
            const available = p.filter(proc => !proc.completed && proc.arrival <= time);
            if (available.length === 0) {
                const next = p.filter(proc => !proc.completed).sort((a, b) => a.arrival - b.arrival)[0];
                gantt.push({ id: 'Idle', start: time, end: next.arrival, color: 'transparent' });
                time = next.arrival;
                continue;
            }
            available.sort((a, b) => a.remaining - b.remaining || a.arrival - b.arrival);
            const proc = available[0];
            if (proc.firstResponse === -1) proc.firstResponse = time;

            const nextArrivals = p.filter(pr => !pr.completed && pr.arrival > time).map(pr => pr.arrival);
            let runUntil = time + proc.remaining;
            for (const na of nextArrivals) {
                if (na < runUntil) runUntil = na;
            }

            const runTime = runUntil - time;
            gantt.push({ id: proc.id, start: time, end: runUntil, color: proc.color });
            proc.remaining -= runTime;
            time = runUntil;

            if (proc.remaining === 0) {
                proc.completionTime = time;
                proc.completed = true;
                completed++;
            }
        }
    }
    else if (algo === 'rr') {
        const queue = [];
        const sorted = [...p].sort((a, b) => a.arrival - b.arrival);
        let idx = 0;

        while (idx < n && sorted[idx].arrival <= time) {
            queue.push(sorted[idx]);
            idx++;
        }

        while (completed < n && time < maxTime) {
            if (queue.length === 0) {
                const next = sorted.find(proc => !proc.completed && proc.arrival > time);
                if (next) {
                    gantt.push({ id: 'Idle', start: time, end: next.arrival, color: 'transparent' });
                    time = next.arrival;
                    while (idx < n && sorted[idx].arrival <= time) {
                        queue.push(sorted[idx]);
                        idx++;
                    }
                } else break;
                continue;
            }

            const proc = queue.shift();
            if (proc.firstResponse === -1) proc.firstResponse = time;
            const execTime = Math.min(tq, proc.remaining);

            // Record queue state BEFORE execution
            const queueSnapshot = queue.map(q => ({ id: q.id, remaining: q.remaining, color: q.color }));
            const runningSnapshot = { id: proc.id, remaining: proc.remaining, color: proc.color, execTime: execTime };

            gantt.push({ id: proc.id, start: time, end: time + execTime, color: proc.color });
            proc.remaining -= execTime;
            time += execTime;

            // Add newly arrived processes
            const newArrivals = [];
            while (idx < n && sorted[idx].arrival <= time) {
                queue.push(sorted[idx]);
                newArrivals.push({ id: sorted[idx].id, color: sorted[idx].color });
                idx++;
            }

            let event = '';
            let isContextSwitch = false;

            if (proc.remaining === 0) {
                proc.completionTime = time;
                proc.completed = true;
                completed++;
                event = `${proc.id} completed`;
            } else {
                queue.push(proc);
                event = `${proc.id} preempted (remaining: ${proc.remaining})`;
                isContextSwitch = true;
            }

            // Queue state AFTER execution
            const queueAfterSnapshot = queue.map(q => ({ id: q.id, remaining: q.remaining, color: q.color }));

            queueStates.push({
                time: time - execTime,
                timeEnd: time,
                running: runningSnapshot,
                queueBefore: queueSnapshot,
                queueAfter: queueAfterSnapshot,
                event: event,
                newArrivals: newArrivals,
                isContextSwitch: isContextSwitch
            });
        }
    }
    else if (algo === 'priority-np') {
        while (completed < n && time < maxTime) {
            const available = p.filter(proc => !proc.completed && proc.arrival <= time);
            if (available.length === 0) {
                const next = p.filter(proc => !proc.completed).sort((a, b) => a.arrival - b.arrival)[0];
                gantt.push({ id: 'Idle', start: time, end: next.arrival, color: 'transparent' });
                time = next.arrival;
                continue;
            }
            available.sort((a, b) => a.priority - b.priority || a.arrival - b.arrival);
            const proc = available[0];
            proc.startTime = time;
            proc.firstResponse = time;
            gantt.push({ id: proc.id, start: time, end: time + proc.burst, color: proc.color });
            time += proc.burst;
            proc.completionTime = time;
            proc.remaining = 0;
            proc.completed = true;
            completed++;
        }
    }
    else if (algo === 'priority-p') {
        while (completed < n && time < maxTime) {
            const available = p.filter(proc => !proc.completed && proc.arrival <= time);
            if (available.length === 0) {
                const next = p.filter(proc => !proc.completed).sort((a, b) => a.arrival - b.arrival)[0];
                gantt.push({ id: 'Idle', start: time, end: next.arrival, color: 'transparent' });
                time = next.arrival;
                continue;
            }
            available.sort((a, b) => a.priority - b.priority || a.arrival - b.arrival);
            const proc = available[0];
            if (proc.firstResponse === -1) proc.firstResponse = time;

            const nextArrivals = p.filter(pr => !pr.completed && pr.arrival > time).map(pr => pr.arrival);
            let runUntil = time + proc.remaining;
            for (const na of nextArrivals) {
                if (na < runUntil) runUntil = na;
            }

            const runTime = runUntil - time;
            gantt.push({ id: proc.id, start: time, end: runUntil, color: proc.color });
            proc.remaining -= runTime;
            time = runUntil;

            if (proc.remaining === 0) {
                proc.completionTime = time;
                proc.completed = true;
                completed++;
            }
        }
    }

    // Merge consecutive same-process gantt blocks
    const mergedGantt = [];
    gantt.forEach(block => {
        if (mergedGantt.length > 0 && mergedGantt[mergedGantt.length - 1].id === block.id) {
            mergedGantt[mergedGantt.length - 1].end = block.end;
        } else {
            mergedGantt.push({ ...block });
        }
    });

    // Count context switches
    let contextSwitches = 0;
    for (let i = 1; i < mergedGantt.length; i++) {
        if (mergedGantt[i].id !== 'Idle' && mergedGantt[i - 1].id !== 'Idle') {
            contextSwitches++;
        } else if (mergedGantt[i].id !== 'Idle' && mergedGantt[i - 1].id === 'Idle') {
            if (i >= 2 && mergedGantt[i - 2].id !== mergedGantt[i].id) {
                contextSwitches++;
            }
        }
    }

    // Calculate metrics
    const results = p.map(proc => ({
        id: proc.id,
        arrival: proc.arrival,
        burst: proc.burst,
        priority: proc.priority,
        color: proc.color,
        completion: proc.completionTime,
        turnaround: proc.completionTime - proc.arrival,
        waiting: proc.completionTime - proc.arrival - proc.burst,
        response: proc.firstResponse - proc.arrival
    }));

    const totalTime = mergedGantt.length > 0 ? mergedGantt[mergedGantt.length - 1].end : 0;
    const idleTime = mergedGantt.filter(b => b.id === 'Idle').reduce((sum, b) => sum + (b.end - b.start), 0);

    return {
        gantt: mergedGantt,
        results: results,
        avgTurnaround: (results.reduce((s, r) => s + r.turnaround, 0) / n).toFixed(2),
        avgWaiting: (results.reduce((s, r) => s + r.waiting, 0) / n).toFixed(2),
        avgResponse: (results.reduce((s, r) => s + r.response, 0) / n).toFixed(2),
        cpuUtilization: totalTime > 0 ? (((totalTime - idleTime) / totalTime) * 100).toFixed(1) : '0',
        totalTime: totalTime,
        throughput: totalTime > 0 ? (n / totalTime).toFixed(3) : '0',
        contextSwitches: contextSwitches,
        queueStates: queueStates
    };
}

// ============ SIMULATION ============
function runSimulation() {
    if (processes.length === 0) return;

    const tq = parseInt(document.getElementById('timeQuantum').value) || 2;
    simulationResult = runAlgorithm(currentAlgo, processes, tq);

    renderGanttChart(simulationResult.gantt);
    renderResults(simulationResult);
    renderTimeline(simulationResult.gantt);

    document.getElementById('ganttPanel').style.display = 'block';
    document.getElementById('resultsPanel').style.display = 'block';
    document.getElementById('comparePanel').style.display = 'block';

    // Show queue state diagram for Round Robin
    if (currentAlgo === 'rr' && simulationResult.queueStates.length > 0) {
        renderQueueStateDiagram(simulationResult.queueStates, simulationResult.contextSwitches);
        document.getElementById('queueStatePanel').style.display = 'block';
    } else {
        document.getElementById('queueStatePanel').style.display = 'none';
    }

    // Update CPU visual to final state
    document.getElementById('cpuProcess').textContent = '-';
    document.getElementById('cpuTime').textContent = 'Complete';
    document.getElementById('cpuBox').classList.remove('running');
    document.getElementById('readyQueue').innerHTML = '<span style="color:#555;">Empty</span>';
    document.getElementById('completedQueue').innerHTML = processes.map(p =>
        `<span class="rq-process" style="background:${p.color};">${p.id}</span>`
    ).join('');

    addLog(simulationResult.totalTime, 'COMPLETE', `All processes finished. Total time: ${simulationResult.totalTime}`);

    document.getElementById('ganttPanel').scrollIntoView({ behavior: 'smooth' });
}

function renderGanttChart(gantt) {
    const container = document.getElementById('ganttChart');
    if (gantt.length === 0) {
        container.innerHTML = '<div class="empty-state">No data</div>';
        return;
    }

    const totalTime = gantt[gantt.length - 1].end;
    const minWidth = 40;
    const scale = Math.max(minWidth, 800 / totalTime);

    container.innerHTML = gantt.map((block, i) => {
        const width = (block.end - block.start) * scale;
        const isIdle = block.id === 'Idle';
        return `
            <div class="gantt-block" style="width:${width}px; animation-delay:${i * 0.1}s;">
                <div class="gantt-bar ${isIdle ? 'idle' : ''}" 
                     style="background:${isIdle ? '' : block.color};"
                     title="${block.id} [${block.start}-${block.end}]">
                    ${block.id}
                </div>
                <span class="gantt-time">${block.start}</span>
                ${i === gantt.length - 1 ? `<span class="gantt-time gantt-time-end">${block.end}</span>` : ''}
            </div>
        `;
    }).join('');
}

function renderTimeline(gantt) {
    const container = document.getElementById('timelineContainer');
    if (gantt.length === 0) return;

    const totalTime = gantt[gantt.length - 1].end;
    let html = '<div class="timeline-cursor" id="timelineCursor"></div>';

    gantt.forEach(block => {
        const left = (block.start / totalTime) * 100;
        const width = ((block.end - block.start) / totalTime) * 100;
        const isIdle = block.id === 'Idle';
        html += `<div class="timeline-bar" style="left:${left}%;width:${width}%;background:${isIdle ? 'rgba(255,255,255,0.05)' : block.color};">${block.id}</div>`;
    });

    container.innerHTML = html;
}

function renderResults(result) {
    const tbody = document.getElementById('resultsTableBody');
    tbody.innerHTML = result.results.map(r => `
        <tr>
            <td><span class="color-dot" style="background:${r.color}"></span> ${r.id}</td>
            <td>${r.arrival}</td>
            <td>${r.burst}</td>
            <td>${r.completion}</td>
            <td>${r.turnaround}</td>
            <td>${r.waiting}</td>
            <td>${r.response}</td>
        </tr>
    `).join('');

    document.getElementById('statsGrid').innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${result.avgTurnaround}</div>
            <div class="stat-label">Avg Turnaround Time</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${result.avgWaiting}</div>
            <div class="stat-label">Avg Waiting Time</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${result.avgResponse}</div>
            <div class="stat-label">Avg Response Time</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${result.cpuUtilization}%</div>
            <div class="stat-label">CPU Utilization</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${result.throughput}</div>
            <div class="stat-label">Throughput (p/unit)</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${result.totalTime}</div>
            <div class="stat-label">Total Time</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${result.contextSwitches}</div>
            <div class="stat-label">Context Switches</div>
        </div>
    `;
}

// ============ QUEUE STATE DIAGRAM (ROUND ROBIN) ============
function renderQueueStateDiagram(queueStates, totalCS) {
    const wrapper = document.getElementById('queueStateWrapper');

    let html = `
        <div style="margin-bottom:15px; display:flex; align-items:center; gap:15px; flex-wrap:wrap;">
            <div style="padding:8px 15px; background:rgba(245,87,108,0.15); border:1px solid rgba(245,87,108,0.4); border-radius:8px; color:#f5576c; font-weight:700; font-size:0.9rem;">
                🔄 Total Context Switches: ${totalCS}
            </div>
            <div style="font-size:0.8rem; color:#888;">
                <span class="cs-badge">CS</span> = Context Switch (highlighted rows)
            </div>
        </div>
        <table class="queue-state-table">
            <thead>
                <tr>
                    <th>Step</th>
                    <th>Time</th>
                    <th>Running</th>
                    <th>Exec Time</th>
                    <th>Ready Queue (Before)</th>
                    <th>Event</th>
                    <th>Ready Queue (After)</th>
                </tr>
            </thead>
            <tbody>
    `;

    queueStates.forEach((state, i) => {
        const rowClass = state.isContextSwitch ? 'context-switch-row' : '';
        const csBadge = state.isContextSwitch ? '<span class="cs-badge">CS</span>' : '';

        const queueBeforeHtml = state.queueBefore.length > 0
            ? state.queueBefore.map(q => `<span class="queue-process" style="background:${q.color};">${q.id}(${q.remaining})</span>`).join(' → ')
            : '<span style="color:#555;">Empty</span>';

        const queueAfterHtml = state.queueAfter.length > 0
            ? state.queueAfter.map(q => `<span class="queue-process" style="background:${q.color};">${q.id}(${q.remaining})</span>`).join(' → ')
            : '<span style="color:#555;">Empty</span>';

        const newArrivalsHtml = state.newArrivals.length > 0
            ? `<br><span style="color:#43e97b; font-size:0.75rem;">+ Arrived: ${state.newArrivals.map(a => a.id).join(', ')}</span>`
            : '';

        html += `
            <tr class="${rowClass}">
                <td>${i + 1}</td>
                <td>${state.time} → ${state.timeEnd}</td>
                <td class="running-cell">
                    <span class="queue-process" style="background:${state.running.color};">${state.running.id}</span>
                </td>
                <td>${state.running.execTime} unit${state.running.execTime > 1 ? 's' : ''}</td>
                <td class="queue-cell">${queueBeforeHtml}</td>
                <td class="event-cell">${state.event} ${csBadge} ${newArrivalsHtml}</td>
                <td class="queue-cell">${queueAfterHtml}</td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    wrapper.innerHTML = html;
}

// ============ STEP BY STEP ============
function initStepState() {
    if (processes.length === 0) return;

    const tq = parseInt(document.getElementById('timeQuantum').value) || 2;
    simulationResult = runAlgorithm(currentAlgo, processes, tq);

    stepState = {
        gantt: simulationResult.gantt,
        currentIndex: -1,
        currentTime: 0,
        totalTime: simulationResult.totalTime
    };

    document.getElementById('ganttPanel').style.display = 'block';
    document.getElementById('ganttChart').innerHTML = '';
    document.getElementById('timelineContainer').innerHTML = '';
    renderTimeline(simulationResult.gantt);
    document.getElementById('logContainer').innerHTML = '<div class="log-entry"><span class="info">Step simulation initialized.</span></div>';
}

function stepForward() {
    if (!stepState) initStepState();
    if (!stepState) return;

    stepState.currentIndex++;
    if (stepState.currentIndex >= stepState.gantt.length) {
        renderResults(simulationResult);
        document.getElementById('resultsPanel').style.display = 'block';
        document.getElementById('comparePanel').style.display = 'block';

        if (currentAlgo === 'rr' && simulationResult.queueStates.length > 0) {
            renderQueueStateDiagram(simulationResult.queueStates, simulationResult.contextSwitches);
            document.getElementById('queueStatePanel').style.display = 'block';
        }

        document.getElementById('cpuProcess').textContent = '-';
        document.getElementById('cpuTime').textContent = 'Complete';
        document.getElementById('cpuBox').classList.remove('running');
        addLog(stepState.totalTime, 'COMPLETE', 'All processes finished!');
        pauseAutoStep();
        return;
    }

    const block = stepState.gantt[stepState.currentIndex];
    const isIdle = block.id === 'Idle';

    // Add to gantt
    const ganttContainer = document.getElementById('ganttChart');
    const totalTime = stepState.totalTime;
    const scale = Math.max(40, 800 / totalTime);
    const width = (block.end - block.start) * scale;

    const div = document.createElement('div');
    div.className = 'gantt-block';
    div.style.width = width + 'px';
    div.innerHTML = `
        <div class="gantt-bar ${isIdle ? 'idle' : ''}" 
             style="background:${isIdle ? '' : block.color};"
             title="${block.id} [${block.start}-${block.end}]">
            ${block.id}
        </div>
        <span class="gantt-time">${block.start}</span>
        ${stepState.currentIndex === stepState.gantt.length - 1 ? `<span class="gantt-time gantt-time-end">${block.end}</span>` : ''}
    `;
    ganttContainer.appendChild(div);

    // Update CPU visual
    if (isIdle) {
        document.getElementById('cpuProcess').textContent = '-';
        document.getElementById('cpuTime').textContent = `Idle (${block.start}-${block.end})`;
        document.getElementById('cpuBox').classList.remove('running');
        addLog(block.start, 'IDLE', `CPU idle from ${block.start} to ${block.end}`);
    } else {
        document.getElementById('cpuProcess').textContent = block.id;
        document.getElementById('cpuProcess').style.color = block.color;
        document.getElementById('cpuTime').textContent = `T: ${block.start} → ${block.end}`;
        document.getElementById('cpuBox').classList.add('running');
        document.getElementById('cpuBox').style.borderColor = block.color;
        addLog(block.start, 'RUNNING', `${block.id} executing [${block.start}-${block.end}]`);
    }

    // Update ready queue
    const currentTime = block.end;
    const completedIds = [];
    const shownGantt = stepState.gantt.slice(0, stepState.currentIndex + 1);

    processes.forEach(proc => {
        const totalExecuted = shownGantt.filter(b => b.id === proc.id).reduce((sum, b) => sum + (b.end - b.start), 0);
        if (totalExecuted >= proc.burst) {
            completedIds.push(proc.id);
        }
    });

    const readyProcs = processes.filter(p =>
        p.arrival <= currentTime &&
        p.id !== block.id &&
        !completedIds.includes(p.id)
    );

    const rqHtml = readyProcs.length > 0
        ? readyProcs.map(p => `<span class="rq-process" style="background:${p.color};">${p.id}</span>`).join('')
        : '<span style="color:#555;">Empty</span>';
    document.getElementById('readyQueue').innerHTML = rqHtml;

    const cqHtml = completedIds.length > 0
        ? completedIds.map(id => {
            const p = processes.find(proc => proc.id === id);
            return `<span class="rq-process" style="background:${p.color};">${p.id}</span>`;
        }).join('')
        : '<span style="color:#555;">None</span>';
    document.getElementById('completedQueue').innerHTML = cqHtml;

    // Update timeline cursor
    const cursor = document.getElementById('timelineCursor');
    if (cursor) {
        cursor.style.left = ((block.end / totalTime) * 100) + '%';
    }

    stepState.currentTime = currentTime;
}

function startAutoStep() {
    if (!stepState) initStepState();

    document.getElementById('btnStepPlay').style.display = 'none';
    document.getElementById('btnStepPause').style.display = 'inline-flex';

    const speed = parseInt(document.getElementById('speedSlider').value);
    const interval = 1500 / speed;

    autoPlayInterval = setInterval(() => {
        if (stepState && stepState.currentIndex >= stepState.gantt.length - 1) {
            stepForward();
            pauseAutoStep();
            return;
        }
        stepForward();
    }, interval);
}

function pauseAutoStep() {
    clearInterval(autoPlayInterval);
    autoPlayInterval = null;
    document.getElementById('btnStepPlay').style.display = 'inline-flex';
    document.getElementById('btnStepPause').style.display = 'none';
}

function resetSimulation() {
    pauseAutoStep();
    stepState = null;
    simulationResult = null;

    document.getElementById('ganttChart').innerHTML = '';
    document.getElementById('timelineContainer').innerHTML = '';
    document.getElementById('resultsTableBody').innerHTML = '';
    document.getElementById('statsGrid').innerHTML = '';
    document.getElementById('logContainer').innerHTML = '<div class="log-entry"><span class="info">Simulation ready. Click Run or Step to begin.</span></div>';
    document.getElementById('queueStateWrapper').innerHTML = '';
    document.getElementById('queueStatePanel').style.display = 'none';

    document.getElementById('cpuProcess').textContent = '-';
    document.getElementById('cpuProcess').style.color = '#fff';
    document.getElementById('cpuTime').textContent = 'Idle';
    document.getElementById('cpuBox').classList.remove('running');
    document.getElementById('cpuBox').style.borderColor = 'rgba(79, 172, 254, 0.5)';
    document.getElementById('readyQueue').innerHTML = '<span style="color:#555;">Empty</span>';
    document.getElementById('completedQueue').innerHTML = '<span style="color:#555;">None</span>';
}

function addLog(time, action, info) {
    const container = document.getElementById('logContainer');
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.innerHTML = `<span class="time">[T=${time}]</span> <span class="action">${action}</span> <span class="info">— ${info}</span>`;
    container.appendChild(entry);
    container.scrollTop = container.scrollHeight;
}

// ============ COMPARISON ============
function runComparison() {
    if (processes.length === 0) return;

    const tq = parseInt(document.getElementById('timeQuantum').value) || 2;
    const algorithms = [
        { key: 'fcfs', name: 'FCFS' },
        { key: 'sjf', name: 'SJF (Non-Preemptive)' },
        { key: 'srtf', name: 'SRTF (Preemptive)' },
        { key: 'rr', name: `Round Robin (TQ=${tq})` },
        { key: 'priority-np', name: 'Priority (Non-Preemptive)' },
        { key: 'priority-p', name: 'Priority (Preemptive)' }
    ];

    const results = algorithms.map(algo => {
        const result = runAlgorithm(algo.key, processes, tq);
        return {
            name: algo.name,
            avgTurnaround: parseFloat(result.avgTurnaround),
            avgWaiting: parseFloat(result.avgWaiting),
            avgResponse: parseFloat(result.avgResponse),
            cpuUtilization: parseFloat(result.cpuUtilization),
            contextSwitches: result.contextSwitches
        };
    });

    const bestTAT = Math.min(...results.map(r => r.avgTurnaround));
    const bestWT = Math.min(...results.map(r => r.avgWaiting));
    const bestRT = Math.min(...results.map(r => r.avgResponse));
    const bestCPU = Math.max(...results.map(r => r.cpuUtilization));
    const bestCS = Math.min(...results.map(r => r.contextSwitches));

    const tbody = document.getElementById('compareTableBody');
    tbody.innerHTML = results.map(r => `
        <tr>
            <td>${r.name}</td>
            <td class="${r.avgTurnaround === bestTAT ? 'best' : ''}">${r.avgTurnaround.toFixed(2)} ${r.avgTurnaround === bestTAT ? '⭐' : ''}</td>
            <td class="${r.avgWaiting === bestWT ? 'best' : ''}">${r.avgWaiting.toFixed(2)} ${r.avgWaiting === bestWT ? '⭐' : ''}</td>
            <td class="${r.avgResponse === bestRT ? 'best' : ''}">${r.avgResponse.toFixed(2)} ${r.avgResponse === bestRT ? '⭐' : ''}</td>
            <td class="${r.contextSwitches === bestCS ? 'best' : ''}">${r.contextSwitches} ${r.contextSwitches === bestCS ? '⭐' : ''}</td>
            <td class="${r.cpuUtilization === bestCPU ? 'best' : ''}">${r.cpuUtilization}% ${r.cpuUtilization === bestCPU ? '⭐' : ''}</td>
        </tr>
    `).join('');

    document.getElementById('comparePanel').style.display = 'block';
}

// ============ KEYBOARD SHORTCUTS ============
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;

    if (e.key === 'Enter') {
        e.preventDefault();
        runSimulation();
    } else if (e.key === ' ') {
        e.preventDefault();
        if (autoPlayInterval) pauseAutoStep();
        else startAutoStep();
    } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        stepForward();
    } else if (e.key === 'r' || e.key === 'R') {
        resetSimulation();
    }
});

document.querySelectorAll('#arrivalTime, #burstTime, #priorityVal').forEach(input => {
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addProcess();
        }
    });
});