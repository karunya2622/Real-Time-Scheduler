document.addEventListener('DOMContentLoaded', () => {

    /* --- DOM Elements --- */
    const numTasksInput = document.getElementById('numTasks');
    const btnMinus = document.getElementById('btnMinus');
    const btnPlus = document.getElementById('btnPlus');
    const btnLoadSample = document.getElementById('btnLoadSample');
    const btnReset = document.getElementById('btnReset');
    const btnRunSim = document.getElementById('btnRunSim');
    
    const taskInputsContainer = document.getElementById('taskInputsContainer');
    const simulationOutput = document.getElementById('simulationOutput');
    const calcHyperperiod = document.getElementById('calcHyperperiod');
    const calcUtilization = document.getElementById('calcUtilization');
    const utilDesc = document.getElementById('utilDesc');
    const rmsBoundResult = document.getElementById('rmsBoundResult');
    const taskSynopsisBody = document.getElementById('taskSynopsisBody');
    
    /* Timelines */
    const rmsStatus = document.getElementById('rmsStatus');
    const ganttRMS = document.getElementById('ganttRMS');
    const edfStatus = document.getElementById('edfStatus');
    const ganttEDF = document.getElementById('ganttEDF');
    const finalVerdictText = document.getElementById('finalVerdictText');

    // Chart instances
    let charts = {
        gantt: null,
        utilization: null,
        pie: null,
        miss: null
    };

    // Color Palette
    const taskColors = [
        '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
        '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16'
    ];

    /* --- Initialization --- */
    renderInputRows(parseInt(numTasksInput.value));

    /* --- Event Listeners --- */
    btnMinus.addEventListener('click', () => {
        let v = parseInt(numTasksInput.value);
        if (v > 1) { numTasksInput.value = v - 1; renderInputRows(v - 1); }
    });

    btnPlus.addEventListener('click', () => {
        let v = parseInt(numTasksInput.value);
        if (v < 10) { numTasksInput.value = v + 1; renderInputRows(v + 1); }
    });

    btnLoadSample.addEventListener('click', () => {
        numTasksInput.value = 3;
        renderInputRows(3);
        const data = [
            {c: 1, t: 4, d: 4},
            {c: 2, t: 6, d: 6},
            {c: 3, t: 8, d: 8}
        ];
        for(let i=0; i<3; i++) {
            document.getElementById(`exec_${i+1}`).value = data[i].c;
            document.getElementById(`period_${i+1}`).value = data[i].t;
            document.getElementById(`deadline_${i+1}`).value = data[i].d;
        }
    });

    btnReset.addEventListener('click', () => {
        numTasksInput.value = 3;
        renderInputRows(3);
        simulationOutput.classList.add('hidden');
        window.scrollTo({top: 0, behavior: 'smooth'});
    });

    btnRunSim.addEventListener('click', () => {
        const tasks = extractTasks();
        if (!validate(tasks)) return;
        
        simulationOutput.classList.remove('hidden');
        runProcessor(tasks);
        document.getElementById('results').scrollIntoView({behavior: 'smooth', block: 'start'});
    });

    /* --- Input Rendering --- */
    function renderInputRows(n) {
        taskInputsContainer.innerHTML = '';
        for (let i = 1; i <= n; i++) {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div class="task-badge" style="border-left: 4px solid ${taskColors[i-1]}">Task ${i}</div>
                </td>
                <td><input type="number" id="exec_${i}" min="1" placeholder="C"></td>
                <td><input type="number" id="period_${i}" min="1" placeholder="T"></td>
                <td><input type="number" id="deadline_${i}" min="1" placeholder="D"></td>
            `;
            taskInputsContainer.appendChild(tr);
        }
    }

    /* --- Logic --- */
    function extractTasks() {
        let tasks = [];
        let num = parseInt(numTasksInput.value);
        for(let i=1; i<=num; i++) {
            tasks.push({
                id: `T${i}`,
                c: parseInt(document.getElementById(`exec_${i}`).value),
                t: parseInt(document.getElementById(`period_${i}`).value),
                d: parseInt(document.getElementById(`deadline_${i}`).value),
                color: taskColors[i-1],
                index: i-1
            });
        }
        return tasks;
    }

    function validate(tasks) {
        for(let tk of tasks) {
            if (isNaN(tk.c) || isNaN(tk.t) || isNaN(tk.d) || tk.c <= 0 || tk.t <= 0 || tk.d <= 0) {
                alert(`Please fill all parameters for ${tk.id} with valid positive integers.`);
                return false;
            }
            if (tk.c > tk.t) {
                alert(`${tk.id}: Execution Time (C) cannot be greater than Period (T).`);
                return false;
            }
        }
        return true;
    }

    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
    const lcm = (a, b) => (a * b) / gcd(a, b);
    const lcmArr = arr => arr.reduce((acc, v) => lcm(acc, v), 1);

    function runProcessor(tasks) {
        // Compute H
        let hRaw = lcmArr(tasks.map(tk => tk.t));
        let h = hRaw > 150 ? 150 : hRaw; // Cap for visualization
        
        calcHyperperiod.innerText = hRaw + (hRaw > 150 ? " (Capped at 150 for render)" : "");

        // Compute Util
        let u = tasks.reduce((sum, tk) => sum + (tk.c/tk.t), 0);
        calcUtilization.innerText = `${(u*100).toFixed(1)}%`;
        
        const utilCard = document.getElementById('utilCard');
        if(u <= 1) {
            utilDesc.innerHTML = `<i class="fa-solid fa-check-circle" style="color:var(--success)"></i> System is Not Overloaded`;
            utilCard.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        } else {
            utilDesc.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color:white"></i> SYSTEM OVERLOAD`;
            utilCard.style.background = 'linear-gradient(135deg, #ef4444, #b91c1c)';
        }

        // RMS Bound check
        let n = tasks.length;
        let bound = n * (Math.pow(2, 1/n) - 1);
        if (u <= bound) {
            rmsBoundResult.innerText = `Feasible (U ≤ ${(bound*100).toFixed(1)}%)`;
            rmsBoundResult.style.color = "var(--success)";
        } else if (u <= 1) {
            rmsBoundResult.innerText = `Needs Testing (${(bound*100).toFixed(1)}% < U ≤ 100%)`;
            rmsBoundResult.style.color = "var(--warning)";
        } else {
            rmsBoundResult.innerText = `Infeasible (U > 100%)`;
            rmsBoundResult.style.color = "var(--danger)";
        }

        // Synopsis Table
        populateSynopsis(tasks);

        // Simulate
        const rmsResult = simulateAlgorithm(tasks, h, 'RMS');
        const edfResult = simulateAlgorithm(tasks, h, 'EDF');

        // Render HTML Gantt
        drawFlexGantt(rmsResult.schedule, ganttRMS, H => `${H}`);
        drawFlexGantt(edfResult.schedule, ganttEDF, H => `${H}`);

        updateStatus(rmsStatus, rmsResult.misses, 'RMS');
        updateStatus(edfStatus, edfResult.misses, 'EDF');
        
        generateVerdict(rmsResult.misses, edfResult.misses, u);

        // Render Charts
        renderCharts(tasks, rmsResult, edfResult, h, u);
    }

    function populateSynopsis(tasks) {
        taskSynopsisBody.innerHTML = '';
        
        // RM Priority order (lowest period = highest priority, index 1)
        let rmOrder = [...tasks].sort((a,b) => a.t - b.t);
        
        tasks.forEach(tk => {
            let rmPriority = rmOrder.findIndex(x => x.id === tk.id) + 1;
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span style="font-weight:700; color:${tk.color}">${tk.id}</span></td>
                <td>${(tk.c/tk.t).toFixed(3)}</td>
                <td>Priority ${rmPriority}</td>
                <td style="color:var(--text-muted); font-size:0.9rem">Absolute deadline dynamically checked</td>
            `;
            taskSynopsisBody.appendChild(tr);
        });
    }

    function simulateAlgorithm(tasks, horizon, mode) {
        let schedule = [];
        let misses = 0;
        
        let state = tasks.map(tk => ({
            ...tk,
            remaining: 0,
            abs_deadline: 0
        }));

        for(let t = 0; t < horizon; t++) {
            // Release Check & Miss Check
            state.forEach(tk => {
                // If it's a multiple of period, release new job
                if (t % tk.t === 0) {
                    if (tk.remaining > 0 && t >= tk.abs_deadline) {
                        misses++; 
                    }
                    if (t % tk.t === 0) {
                        tk.remaining = tk.c;
                        tk.abs_deadline = t + tk.d;
                    }
                } else {
                    // Miss check if we hit deadline inside a period
                    if (tk.remaining > 0 && t === tk.abs_deadline) {
                        misses++;
                    }
                }
            });

            // Ready queue
            let ready = state.filter(tk => tk.remaining > 0);
            
            if (ready.length > 0) {
                // Sort
                ready.sort((a, b) => {
                    if (mode === 'RMS') {
                        if (a.t !== b.t) return a.t - b.t;
                    } else if (mode === 'EDF') {
                        if (a.abs_deadline !== b.abs_deadline) return a.abs_deadline - b.abs_deadline;
                    }
                    // Tie breaker
                    return a.id.localeCompare(b.id);
                });

                let running = ready[0];
                schedule.push(running.id);
                running.remaining--;
            } else {
                schedule.push('IDLE');
            }
        }
        return { schedule, misses };
    }

    function drawFlexGantt(schedule, container, labelFunc) {
        container.innerHTML = '';
        if(schedule.length === 0) return;

        let blocks = [];
        let cur = schedule[0];
        let count = 0;

        for(let i=0; i<schedule.length; i++) {
            if(schedule[i] === cur) count++;
            else {
                blocks.push({id: cur, span: count});
                cur = schedule[i];
                count = 1;
            }
        }
        blocks.push({id: cur, span: count});

        blocks.forEach(b => {
            const div = document.createElement('div');
            div.style.flexGrow = b.span;
            
            if(b.id === 'IDLE') {
                div.className = 'gantt-block gantt-idle';
            } else {
                div.className = 'gantt-block';
                // find color from ID
                let color = taskColors[parseInt(b.id.replace('T','')) - 1];
                div.style.backgroundColor = color;
                div.innerText = b.id;
            }
            container.appendChild(div);
        });
    }

    function updateStatus(el, misses, name) {
        if(misses === 0) {
            el.className = 'status-banner status-success';
            el.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${name} scheduled successfully with 0 deadline misses.`;
        } else {
            el.className = 'status-banner status-danger';
            el.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> ${name} encountered ${misses} deadline miss(es).`;
        }
    }

    function generateVerdict(rmsMiss, edfMiss, u) {
        let msg = "";
        if (rmsMiss === 0 && edfMiss === 0) {
            msg = `Both Rate Monotonic and Earliest Deadline First achieved perfectly feasible schedules. Since the total utilization (${(u*100).toFixed(1)}%) is sustainable, the simpler static-priority RMS is highly sufficient.`;
        } else if (rmsMiss > 0 && edfMiss === 0) {
            msg = `RMS failed to find a valid schedule, but EDF succeeded. This proves EDF's theoretical optimality and superior performance bounded only by the 100% utilization limit.`;
        } else if (rmsMiss === 0 && edfMiss > 0) {
            msg = `Anomalous result: EDF failed where RMS succeeded. This only typically occurs under transient overload conditions or abnormal deadline constraints (D < T).`;
        } else {
            msg = `Both algorithms encountered deadline misses. The CPU is mathematically overloaded (Utilization > 100%), and no algorithm can guarantee strict real-time execution.`;
        }
        finalVerdictText.innerText = msg;
    }

    /* --- Charting logic with Chart.js --- */
    function destroyCharts() {
        Object.values(charts).forEach(c => { if(c) c.destroy(); });
    }

    function renderCharts(tasks, rmsResult, edfResult, H, u) {
        destroyCharts();
        Chart.defaults.font.family = "'Inter', sans-serif";
        Chart.defaults.color = '#64748b';

        let labels = tasks.map(t => t.id);
        let utils = tasks.map(t => (t.c/t.t));

        // 1. Utilization Chart
        const ctxUtil = document.getElementById('utilizationChart').getContext('2d');
        charts.utilization = new Chart(ctxUtil, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Individual Utilization',
                    data: utils,
                    backgroundColor: tasks.map(t => t.color),
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: {display: false} },
                scales: {
                    y: { beginAtZero: true, grid: {color: '#f1f5f9'}, ticks: {format: {style: 'percent'}} },
                    x: { grid: {display: false} }
                }
            }
        });

        // 2. Pie Chart (Busy vs Idle)
        const ctxPie = document.getElementById('pieChart').getContext('2d');
        let busy = rmsResult.schedule.filter(x => x !== 'IDLE').length;
        let idle = H - busy;
        charts.pie = new Chart(ctxPie, {
            type: 'doughnut',
            data: {
                labels: ['CPU Busy', 'CPU Idle'],
                datasets: [{
                    data: [busy, idle],
                    backgroundColor: ['#3b82f6', '#e2e8f0'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                cutout: '70%',
                plugins: { legend: {position: 'bottom'} }
            }
        });

        // 3. Miss Analysis Chart (Comparison Bar)
        const ctxMiss = document.getElementById('missAnalysisChart').getContext('2d');
        charts.miss = new Chart(ctxMiss, {
            type: 'bar',
            data: {
                labels: ['RMS', 'EDF'],
                datasets: [{
                    label: 'Deadline Misses',
                    data: [rmsResult.misses, edfResult.misses],
                    backgroundColor: ['#8b5cf6', '#ec4899'],
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                indexAxis: 'y',
                plugins: { legend: {display: false} },
                scales: {
                    x: { beginAtZero: true, suggestedMax: 5, grid: {color: '#f1f5f9'} },
                    y: { grid: {display: false} }
                }
            }
        });

        // 4. Gantt Chart (Using generic Bar Chart for Timeline)
        // Converting schedule array into execution chunks per task
        const ctxGantt = document.getElementById('ganttChartJS').getContext('2d');
        
        let datasets = [];
        
        // Setup base tasks
        tasks.forEach(tk => {
            // we will build stacked array blocks
            // Note: building a real robust Gantt in chart.js requires custom plugins or ranges.
            // We'll mimic task execution counts.
            let rmsExec = rmsResult.schedule.filter(id => id === tk.id).length;
            let edfExec = edfResult.schedule.filter(id => id === tk.id).length;
            
            datasets.push({
                label: tk.id,
                data: [rmsExec, edfExec],
                backgroundColor: tk.color
            });
        });

        charts.gantt = new Chart(ctxGantt, {
            type: 'bar',
            data: {
                labels: ['RMS Executed Time', 'EDF Executed Time'],
                datasets: datasets
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: 'Total Scheduled CPU Units Allocation' }
                },
                scales: {
                    x: { stacked: true, grid: {display: false} },
                    y: { stacked: true, beginAtZero: true, grid: {color: '#f1f5f9'} }
                }
            }
        });
    }

});
