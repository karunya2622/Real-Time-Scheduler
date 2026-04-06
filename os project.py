import streamlit as st
import pandas as pd
import math
from functools import reduce
import plotly.graph_objects as go


def lcm(a, b):
    return abs(a * b) // math.gcd(a, b) if a and b else 0

def get_hyperperiod(tasks):
    periods = [t["Period"] for t in tasks]
    return reduce(lcm, periods) if periods else 0


# -------- Page Config --------
st.set_page_config(
    page_title="Real-Time Scheduling Simulator",
    page_icon="💻 ",
    layout="wide"
)

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
if st.button("Show Task Table"):

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
if st.button("Run Scheduling Simulation"):

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
def create_custom_bar_chart(df, y_col, title):
    colors = ['#FF4B4B', '#00CC96', '#636EFA', '#FECB52', '#FFA15A', '#19D3F3', '#FF6692', '#B6E880', '#FF97FF', '#FFD700']
    fig = go.Figure(data=[
        go.Bar(
            x=df['Task'],
            y=df[y_col],
            marker_color=colors[:len(df)],
            marker_line_color='rgba(0,0,0,0.8)',
            marker_line_width=2.5,
            opacity=0.9,
            text=df[y_col],
            textposition='auto',
            name=title
        )
    ])
    fig.update_layout(
        title=dict(text=title, font=dict(size=20, family='Arial', color='#003366'), x=0.5),
        xaxis=dict(title="Task", showgrid=False, tickfont=dict(size=14, family='Arial', color='#003366')),
        yaxis=dict(title="Values", showgrid=True, gridcolor='#e6e6e6', zeroline=True, zerolinecolor='black', zerolinewidth=1),
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        bargap=0.3,
        height=380,
        margin=dict(l=40, r=20, t=60, b=40)
    )
    return fig

if st.button("Show Graphs"):

    df = pd.DataFrame(tasks)

    col1, col2, col3 = st.columns(3)

    with col1:
        st.plotly_chart(create_custom_bar_chart(df, "Execution", "Execution Time"), use_container_width=True)

    with col2:
        st.plotly_chart(create_custom_bar_chart(df, "Period", "Period"), use_container_width=True)

    with col3:
        st.plotly_chart(create_custom_bar_chart(df, "Deadline", "Deadline"), use_container_width=True)
