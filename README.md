# ⚙️ CPU Scheduler Demonstrator

An interactive web-based simulator for visualizing and comparing CPU Scheduling Algorithms in real-time. Built as a 4th Semester Operating Systems project.

---

## 🔗 Live Demo

👉 [Click Here to Try](https://cpu-scheduling-simulator0.netlify.app/)

---

## 📌 About The Project

In our 4th Semester, **Operating Systems** is a core subject. One of the most important topics is **CPU Scheduling** — how the operating system decides which process gets the CPU and when.

Instead of just solving numericals on paper, I built this **interactive visual tool** that:
- Generates **Gantt Charts** automatically
- Shows **step-by-step execution**
- Calculates all metrics **instantly**
- Compares **all algorithms** side by side

This tool helps students **understand scheduling concepts visually** rather than just memorizing formulas.

---

## ✨ Features

### 🎯 6 Scheduling Algorithms
| # | Algorithm | Type |
|---|-----------|------|
| 1 | FCFS (First Come First Serve) | Non-Preemptive |
| 2 | SJF (Shortest Job First) | Non-Preemptive |
| 3 | SRTF (Shortest Remaining Time First) | Preemptive |
| 4 | Round Robin | Time Quantum Based |
| 5 | Priority Scheduling | Non-Preemptive |
| 6 | Priority Scheduling | Preemptive |

### 📊 Visualizations
- **Gantt Chart** — Color-coded animated execution timeline
- **CPU Visualization** — Real-time Ready Queue → CPU → Completed flow
- **Timeline Bar** — Progress cursor showing simulation position
- **Queue State Diagram** — Step-by-step queue changes (Round Robin)

### 📈 Performance Metrics
- Completion Time (CT)
- Turnaround Time (TAT)
- Waiting Time (WT)
- Response Time (RT)
- CPU Utilization (%)
- Throughput (processes/unit time)
- Number of Context Switches

### ⚖️ Algorithm Comparison
- Compare all 6 algorithms on the **same set of processes**
- Best performing algorithm highlighted with ⭐
- Metrics compared: Avg TAT, Avg WT, Avg RT, Context Switches, CPU Utilization

### 🎮 Simulation Controls
- **Run Full** — Instant complete simulation
- **Auto Play** — Animated step-through with adjustable speed
- **Step Forward** — Manual one-step-at-a-time execution
- **Reset** — Reset simulation to initial state
- **Speed Control** — 1x to 10x speed adjustment

### ⌨️ Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `Enter` | Run full simulation |
| `Space` | Play / Pause auto step |
| `→` (Arrow Right) | Step forward |
| `R` | Reset simulation |

### 🔄 Round Robin Special Features
- **Queue State Diagram** — Shows ready queue before and after each execution
- **Context Switch Highlighting** — Red highlighted rows for context switches
- **Remaining Burst Times** — Shows remaining time for each process in queue
- **New Arrivals** — Green indicators for newly arrived processes
- **Custom Time Quantum** — Adjustable time quantum value

---

## 🛠️ Tech Stack

| Technology | Usage |
|------------|-------|
| **HTML** | Structure & Layout |
| **CSS** | Styling, Animations, Responsive Design |
| **JavaScript** | Algorithm Logic, DOM Manipulation, Simulation |

> No external libraries or frameworks used. Built with **pure vanilla code**.
