import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import numpy as np
from datetime import datetime

# Page config
st.set_page_config(
    page_title="Dashboard Limpieza Recepción",
    page_icon="🏭",
    layout="wide"
)

# Load and process your CSV data
@st.cache_data
def load_data():
    df = pd.read_csv('backend/reports/data/historical_data.csv')
    df['started_at'] = pd.to_datetime(df['started_at'])
    df['completed_at'] = pd.to_datetime(df['completed_at'])
    df['date'] = df['started_at'].dt.date
    
    # Convert elapsed_time from seconds to minutes
    df['elapsed_time_min'] = df['elapsed_time'] / 60 / 1000
    df['variance_min'] = df['elapsed_time_min'] - df['expected_time']
    df['efficiency'] = (df['expected_time'] / df['elapsed_time_min']) * 100
    
    return df

# Load data
df = load_data()

# Get unique execution dates sorted
execution_dates = sorted(df['date'].unique(), reverse=True)
latest_date = execution_dates[0]
previous_date = execution_dates[1] if len(execution_dates) > 1 else None

# Filter data for latest and previous executions
latest_execution = df[df['date'] == latest_date]
previous_execution = df[df['date'] == previous_date] if previous_date else pd.DataFrame()

# Title and header
st.title("🏭 Dashboard - Limpieza Recepción")
st.markdown(f"**Última ejecución**: {latest_date} | **Ejecución anterior**: {previous_date if previous_date else 'N/A'}")
st.markdown("---")

# ==========================================
# SECCIÓN 1: ÚLTIMA EJECUCIÓN
# ==========================================
st.header("🎯 Última Ejecución")

# Key metrics for latest execution
latest_total_time = latest_execution['elapsed_time_min'].sum()
latest_expected_time = latest_execution['expected_time'].sum()
latest_efficiency = (latest_expected_time / latest_total_time) * 100
latest_variance = latest_total_time - latest_expected_time

# Previous execution metrics for comparison
if not previous_execution.empty:
    prev_total_time = previous_execution['elapsed_time_min'].sum()
    prev_expected_time = previous_execution['expected_time'].sum()
    prev_efficiency = (prev_expected_time / prev_total_time) * 100
    prev_variance = prev_total_time - prev_expected_time
    
    time_delta = latest_total_time - prev_total_time
    efficiency_delta = latest_efficiency - prev_efficiency
    variance_delta = latest_variance - prev_variance
else:
    time_delta = efficiency_delta = variance_delta = 0

col1, col2, col3, col4 = st.columns(4)

with col1:
    st.metric(
        label="Tiempo Total",
        value=f"{latest_total_time:.1f} min",
        delta=f"{time_delta:.1f} min" if time_delta != 0 else None
    )

with col2:
    st.metric(
        label="Eficiencia",
        value=f"{latest_efficiency:.1f}%",
        delta=f"{efficiency_delta:.1f}%" if efficiency_delta != 0 else None
    )

with col3:
    st.metric(
        label="Variación vs Esperado",
        value=f"{latest_variance:.1f} min",
        delta=f"{variance_delta:.1f} min" if variance_delta != 0 else None
    )

with col4:
    completed_steps = len(latest_execution[latest_execution['status'] == 'done'])
    total_steps = len(latest_execution)
    st.metric(
        label="Pasos Completados",
        value=f"{completed_steps}/{total_steps}",
        delta="100%" if completed_steps == total_steps else f"{(completed_steps/total_steps)*100:.0f}%"
    )

# Timeline of latest execution
st.subheader("⏰ Timeline de la Última Ejecución")

timeline_data = latest_execution.copy().reset_index(drop=True)
timeline_data['duration_min'] = timeline_data['elapsed_time_min']

fig_timeline = px.timeline(
    timeline_data,
    x_start='started_at',
    x_end='completed_at',
    y='step_name',
    color='assigned_to',
    title=f"Ejecución del {latest_date}",
    hover_data=['expected_time', 'elapsed_time_min', 'variance_min']
)

# Add vertical red lines for expected duration - one per step
for idx, row in timeline_data.iterrows():
    # Calculate when this step should have ended based on expected time
    expected_end_time = row['started_at'] + pd.Timedelta(minutes=float(row['expected_time']))
    
    # Add line only for this specific step's row (limited height)
    fig_timeline.add_shape(
        type="line",
        x0=expected_end_time,
        x1=expected_end_time,
        y0=idx - 0.4,  # Start slightly above the step bar
        y1=idx + 0.4,  # End slightly below the step bar
        line=dict(color="red", width=3, dash="solid"),
        opacity=0.8
    )

fig_timeline.update_yaxes(autorange="reversed")
fig_timeline.update_layout(
    height=500,
    annotations=[
        dict(
            x=0.02, y=0.98,
            xref="paper", yref="paper",
            # text="🔴 Líneas rojas = Cuándo debería haber terminado cada paso",
            text="",
            showarrow=False,
            font=dict(size=11, color="red"),
            bgcolor="white",
            bordercolor="red",
            borderwidth=1
        )
    ]
)
st.plotly_chart(fig_timeline, use_container_width=True)

st.markdown("---")

# ==========================================
# SECCIÓN 2: EVOLUCIÓN RECIENTE
# ==========================================
if not previous_execution.empty:
    st.header("📊 Evolución vs Ejecución Anterior")
    
    # Step-by-step comparison
    latest_by_step = latest_execution.groupby(['step_id', 'step_name']).agg({
        'elapsed_time_min': 'first',
        'expected_time': 'first',
        'variance_min': 'first',
        'assigned_to': 'first'
    }).reset_index()
    
    previous_by_step = previous_execution.groupby(['step_id', 'step_name']).agg({
        'elapsed_time_min': 'first',
        'expected_time': 'first',
        'variance_min': 'first'
    }).reset_index()
    
    # Merge for comparison
    step_comparison = latest_by_step.merge(
        previous_by_step[['step_id', 'elapsed_time_min', 'variance_min']], 
        on='step_id', 
        suffixes=('_latest', '_previous')
    )
    step_comparison['time_change'] = step_comparison['elapsed_time_min_latest'] - step_comparison['elapsed_time_min_previous']
    step_comparison['variance_change'] = step_comparison['variance_min_latest'] - step_comparison['variance_min_previous']
    
    col1, col2 = st.columns(2)
    
    with col1:
        # Time changes by step
        step_comparison['step_name_short'] = step_comparison['step_name'].str[:25] + '...'
        
        fig_change = px.bar(
            step_comparison,
            x='step_name_short',
            y='time_change',
            title="Cambio en Tiempo por Paso (vs Ejecución Anterior)",
            color='time_change',
            color_continuous_scale='RdYlGn_r',
            hover_data=['step_name', 'assigned_to']
        )
        fig_change.add_hline(y=0, line_dash="dash", line_color="black")
        fig_change.update_layout(
            xaxis_title="Paso",
            yaxis_title="Cambio en Tiempo (min)",
            xaxis={'tickangle': 45}
        )
        st.plotly_chart(fig_change, use_container_width=True)
    
    with col2:
        # Operator performance comparison
        latest_by_operator = latest_execution.groupby('assigned_to')['elapsed_time_min'].sum()
        previous_by_operator = previous_execution.groupby('assigned_to')['elapsed_time_min'].sum()
        
        operator_comparison = pd.DataFrame({
            'operator': latest_by_operator.index,
            'latest': latest_by_operator.values,
            'previous': [previous_by_operator.get(op, 0) for op in latest_by_operator.index]
        })
        
        fig_operators = go.Figure()
        fig_operators.add_trace(go.Bar(
            name='Ejecución Anterior',
            x=operator_comparison['operator'],
            y=operator_comparison['previous'],
            marker_color='lightblue'
        ))
        fig_operators.add_trace(go.Bar(
            name='Última Ejecución',
            x=operator_comparison['operator'],
            y=operator_comparison['latest'],
            marker_color='darkblue'
        ))
        
        fig_operators.update_layout(
            title="Comparación Tiempo por Operario",
            xaxis_title="Operario",
            yaxis_title="Tiempo Total (min)",
            barmode='group'
        )
        st.plotly_chart(fig_operators, use_container_width=True)
    
    # Summary of changes
    st.subheader("📈 Resumen de Cambios")
    
    improved_steps = len(step_comparison[step_comparison['time_change'] < 0])
    worsened_steps = len(step_comparison[step_comparison['time_change'] > 0])
    unchanged_steps = len(step_comparison[step_comparison['time_change'] == 0])
    
    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric("Pasos Mejorados", improved_steps, f"⬇️ {improved_steps}")
    with col2:
        st.metric("Pasos Empeorados", worsened_steps, f"⬆️ {worsened_steps}")
    with col3:
        st.metric("Sin Cambios", unchanged_steps, f"➡️ {unchanged_steps}")
    
    st.markdown("---")

# ==========================================
# SECCIÓN 3: ANÁLISIS HISTÓRICO
# ==========================================
st.header("📈 Análisis Histórico")

# Historical performance metrics
historical_stats = df.groupby('date').agg({
    'elapsed_time_min': 'sum',
    'expected_time': 'sum',
    'variance_min': 'sum',
    'step_id': 'count'
}).reset_index()

historical_stats['efficiency'] = (historical_stats['expected_time'] / historical_stats['elapsed_time_min']) * 100
historical_stats['date_str'] = pd.to_datetime(historical_stats['date']).dt.strftime('%m/%d')

col1, col2 = st.columns(2)

with col1:
    # Historical efficiency trend
    fig_hist_eff = px.line(
        historical_stats,
        x='date_str',
        y='efficiency',
        title="Tendencia de Eficiencia Histórica",
        markers=True
    )
    fig_hist_eff.add_hline(y=100, line_dash="dash", line_color="red", 
                           annotation_text="100% Objetivo")
    fig_hist_eff.update_layout(
        xaxis_title="Fecha",
        yaxis_title="Eficiencia (%)"
    )
    st.plotly_chart(fig_hist_eff, use_container_width=True)

with col2:
    # Historical time trend
    fig_hist_time = go.Figure()
    fig_hist_time.add_trace(go.Scatter(
        x=historical_stats['date_str'],
        y=historical_stats['expected_time'],
        mode='lines+markers',
        name='Tiempo Esperado',
        line=dict(color='blue')
    ))
    fig_hist_time.add_trace(go.Scatter(
        x=historical_stats['date_str'],
        y=historical_stats['elapsed_time_min'],
        mode='lines+markers',
        name='Tiempo Real',
        line=dict(color='red')
    ))
    fig_hist_time.update_layout(
        title="Tendencia de Tiempos Históricos",
        xaxis_title="Fecha",
        yaxis_title="Tiempo (min)"
    )
    st.plotly_chart(fig_hist_time, use_container_width=True)

# Step performance over time (problematic steps)
st.subheader("🔍 Rendimiento Histórico por Pasos")

# Calculate average performance by step across all executions
step_historical = df.groupby(['step_id', 'step_name']).agg({
    'elapsed_time_min': ['mean', 'std'],
    'expected_time': 'first',
    'variance_min': 'mean',
    'assigned_to': 'first'
}).round(2)

step_historical.columns = ['avg_elapsed', 'std_elapsed', 'expected_time', 'avg_variance', 'operator']
step_historical = step_historical.reset_index()
step_historical['consistency_score'] = step_historical['std_elapsed'] / step_historical['avg_elapsed'] * 100

# Most problematic steps
problematic_steps = step_historical.nlargest(6, 'avg_variance')

col1, col2 = st.columns(2)

with col1:
    # Steps with highest average variance
    problematic_steps['step_name_short'] = problematic_steps['step_name'].str[:20] + '...'
    
    fig_problematic = px.bar(
        problematic_steps,
        x='step_name_short',
        y='avg_variance',
        title="Pasos con Mayor Variación Histórica",
        color='avg_variance',
        color_continuous_scale='Reds',
        hover_data=['step_name', 'operator']
    )
    fig_problematic.update_layout(
        xaxis_title="Paso",
        yaxis_title="Variación Promedio (min)",
        xaxis={'tickangle': 45}
    )
    st.plotly_chart(fig_problematic, use_container_width=True)

with col2:
    # Step consistency (coefficient of variation)
    fig_consistency = px.scatter(
        step_historical,
        x='avg_elapsed',
        y='consistency_score',
        size='avg_variance',
        color='operator',
        title="Consistencia vs Tiempo Promedio",
        hover_data=['step_name'],
        labels={
            'avg_elapsed': 'Tiempo Promedio (min)',
            'consistency_score': 'Variabilidad (%)'
        }
    )
    st.plotly_chart(fig_consistency, use_container_width=True)

# Historical statistics summary
st.subheader("📊 Estadísticas Generales")

col1, col2, col3, col4 = st.columns(4)

with col1:
    avg_total_time = historical_stats['elapsed_time_min'].mean()
    st.metric("Tiempo Promedio Total", f"{avg_total_time:.1f} min")

with col2:
    avg_efficiency = historical_stats['efficiency'].mean()
    st.metric("Eficiencia Promedio", f"{avg_efficiency:.1f}%")

with col3:
    total_executions = len(historical_stats)
    st.metric("Total Ejecuciones", total_executions)

with col4:
    best_time = historical_stats['elapsed_time_min'].min()
    st.metric("Mejor Tiempo", f"{best_time:.1f} min")

# Detailed historical table
st.subheader("📋 Historial Detallado por Paso")

detailed_historical = step_historical.copy()
detailed_historical['step_name_display'] = detailed_historical['step_name'].str[:50] + '...'
detailed_historical['performance_status'] = detailed_historical['avg_variance'].apply(
    lambda x: '🔴 Problemático' if x > 5 else '🟡 Moderado' if x > 2 else '🟢 Óptimo'
)

st.dataframe(
    detailed_historical[['step_id', 'step_name_display', 'expected_time', 'avg_elapsed', 
                        'avg_variance', 'consistency_score', 'performance_status', 'operator']].rename(columns={
        'step_id': 'ID',
        'step_name_display': 'Nombre del Paso',
        'expected_time': 'Tiempo Esperado (min)',
        'avg_elapsed': 'Tiempo Promedio (min)',
        'avg_variance': 'Variación Promedio (min)',
        'consistency_score': 'Variabilidad (%)',
        'performance_status': 'Estado',
        'operator': 'Operario'
    }),
    use_container_width=True
)

# Raw data section (collapsible)
with st.expander("Ver datos sin procesar"):
    st.dataframe(df)