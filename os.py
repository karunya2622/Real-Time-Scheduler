import streamlit as st
import pandas as pd
import math
from functools import reduce
import matplotlib.pyplot as plt

# -------- LCM Function --------
def lcm(a, b):
    return abs(a * b) // math.gcd(a, b) if a and b else 0

def get_hyperperiod(tasks):
    periods = [t["Period"] for t in tasks]
    hp = reduce(lcm, periods) if periods else 0
    return min(hp, 200) # Cap hyperperiod to prevent browser crash


# -------- Page Config --------
st.set_page_config(
    page_title="Real-Time Scheduling Simulator",
    page_icon="💻",
    layout="wide"
)

# -------- Custom CSS --------
st.markdown("""
<style>
.stApp {
    background-color: #e6f2ff;
}

h1 {
    color: #003366;
    text-align: center;
}

h2 {
    color: #0059b3;
}

.stButton>button {
    background-color: #0073e6;
    color: white;
    font-size: 16px;
    border-radius: 10px;
    padding: 10px;
}

.stButton>button:hover {
    background-color: #0059b3;
}
</style>
""", unsafe_allow_html=True)

# -------- Title --------
st.title("Real-Time Scheduling Simulator")

st.write("""
This simulator demonstrates two real-time CPU scheduling algorithms:

• **Rate Monotonic Scheduling (RMS)**  
• **Earliest Deadline First (EDF)**  

Enter task parameters below and run the simulation.
""")

# -------- Number of Tasks --------
num_tasks = st.number_input(
    "Enter Number of Tasks",
    min_value=1,
    max_value=10,
    step=1
)

tasks = []

st.header("Enter Task Details")

# -------- Task Input --------
for i in range(num_tasks):

    col1, col2, col3 = st.columns(3)

    execution = col1.number_input(
        f"Execution Time (Task {i+1})",
        min_value=1,
        step=1,
        key=f"exec{i}"
    )

    period = col2.number_input(
        f"Period (Task {i+1})",
        min_value=1,
        step=1,
        key=f"per{i}"
    )

    deadline = col3.number_input(
        f"Deadline (Task {i+1})",
        min_value=1,
        step=1,
        key=f"dead{i}"
    )

    tasks.append({
        "Task": f"T{i+1}",
        "Execution": int(execution),
        "Period": int(period),
        "Deadline": int(deadline)
    })


# -------- Show Task Table --------
with st.expander("Show Task Table", expanded=True):

    df = pd.DataFrame(tasks)

    st.subheader("Task Information")
    st.dataframe(df)


# -------- RMS Algorithm --------
def rate_monotonic(tasks):

    hp = get_hyperperiod(tasks)

    schedule = []

    remaining_exec = {t["Task"]: 0 for t in tasks}
    periods = {t["Task"]: t["Period"] for t in tasks}

    for time in range(hp):

        for t in tasks:
            if time % t["Period"] == 0:
                remaining_exec[t["Task"]] += t["Execution"]

        ready_tasks = [t for t in remaining_exec if remaining_exec[t] > 0]

        if not ready_tasks:
            schedule.append("Idle")

        else:
            ready_tasks.sort(key=lambda x: periods[x])
            task = ready_tasks[0]

            schedule.append(task)
            remaining_exec[task] -= 1

    return schedule


# -------- EDF Algorithm --------
def earliest_deadline(tasks):

    hp = get_hyperperiod(tasks)

    schedule = []

    remaining_exec = {t["Task"]: 0 for t in tasks}
    deadlines = {t["Task"]: float('inf') for t in tasks}

    for time in range(hp):

        for t in tasks:
            if time % t["Period"] == 0:
                remaining_exec[t["Task"]] += t["Execution"]
                deadlines[t["Task"]] = time + t["Deadline"]

        ready_tasks = [t for t in remaining_exec if remaining_exec[t] > 0]

        if not ready_tasks:
            schedule.append("Idle")

        else:
            ready_tasks.sort(key=lambda x: deadlines[x])
            task = ready_tasks[0]

            schedule.append(task)
            remaining_exec[task] -= 1

    return schedule


# -------- Run Simulation --------
with st.expander("Scheduling Simulation Results", expanded=True):

    hp = get_hyperperiod(tasks)

    st.write(f"### Hyperperiod (LCM of Periods): {hp}")

    # -------- RMS --------
    st.subheader("Rate Monotonic Scheduling")

    rms_schedule = rate_monotonic(tasks)

    rms_df = pd.DataFrame({
        "Time": list(range(hp)),
        "Task Executed": rms_schedule
    })

    st.dataframe(rms_df)

    # -------- EDF --------
    st.subheader("Earliest Deadline First Scheduling")

    edf_schedule = earliest_deadline(tasks)

    edf_df = pd.DataFrame({
        "Time": list(range(hp)),
        "Task Executed": edf_schedule
    })

    st.dataframe(edf_df)


# -------- Graph Visualization --------
with st.expander("Show Graphs", expanded=True):

    def create_textbook_bar_chart(labels, values, title, ylabel):
        # Textbook style size (6, 4)
        fig, ax = plt.subplots(figsize=(6, 4))
        
        # White background
        fig.patch.set_facecolor('white')
        ax.set_facecolor('white')

        # Add more lines: enable minor ticks for denser gridlines
        ax.minorticks_on()
        ax.xaxis.set_tick_params(which='minor', bottom=False) # Disable minor ticks on X axis
        
        # Light horizontal grid lines targeting both major and minor ticks
        ax.yaxis.grid(True, which='major', linestyle='-', alpha=0.4, color='gray', zorder=0)
        ax.yaxis.grid(True, which='minor', linestyle=':', alpha=0.2, color='gray', zorder=0)
        ax.xaxis.grid(False)

        # Single color: navy blue
        bar_colors = ['navy'] * len(labels)

        # Medium bar width, spacing, black borders
        bars = ax.bar(
            labels, 
            values, 
            color=bar_colors, 
            width=0.5, 
            edgecolor='black', 
            linewidth=1.5,
            zorder=3
        )

        # Visible X and Y axes
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.spines['left'].set_linewidth(1.2)
        ax.spines['left'].set_color('black')
        ax.spines['bottom'].set_linewidth(1.2)
        ax.spines['bottom'].set_color('black')
        ax.tick_params(axis='both', colors='black')

        # Labels and formatting
        ax.set_title(title, fontsize=12, fontweight='bold', pad=10, color='black')
        ax.set_ylabel(ylabel, fontsize=10, color='black')
        ax.set_xlabel("Tasks", fontsize=10, color='black')
        
        # Values shown on top of bars
        for bar in bars:
            height = bar.get_height()
            ax.annotate(f'{height}',
                        xy=(bar.get_x() + bar.get_width() / 2, height),
                        xytext=(0, 3),  # 3 points vertical offset
                        textcoords="offset points",
                        ha='center', va='bottom',
                        fontsize=10, fontweight='bold', color='black')

        plt.tight_layout()
        return fig

    # Prepare Data
    task_labels = [t["Task"] for t in tasks]
    exec_values = [t["Execution"] for t in tasks]
    period_values = [t["Period"] for t in tasks]
    dead_values = [t["Deadline"] for t in tasks]

    # Render Charts (Side-By-Side via columns)
    col1, col2, col3 = st.columns(3)

    with col1:
        st.markdown("<h4 style='text-align: center; color: black;'>Execution Time</h4>", unsafe_allow_html=True)
        fig_exec = create_textbook_bar_chart(task_labels, exec_values, "Task Execution (C)", "Time Units")
        st.pyplot(fig_exec)

    with col2:
        st.markdown("<h4 style='text-align: center; color: black;'>Period</h4>", unsafe_allow_html=True)
        fig_period = create_textbook_bar_chart(task_labels, period_values, "Task Periods (T)", "Time Units")
        st.pyplot(fig_period)

    with col3:
        st.markdown("<h4 style='text-align: center; color: black;'>Deadline</h4>", unsafe_allow_html=True)
        fig_dead = create_textbook_bar_chart(task_labels, dead_values, "Task Deadlines (D)", "Time Units")
        st.pyplot(fig_dead)