import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import numpy as np
from datetime import datetime

# Page config
st.set_page_config(
    page_title="Dashboard Limpieza Planta Baja",
    page_icon="🏭",
    layout="wide"
)

# Load and process your CSV data
@st.cache_data
def load_data():
    # You would replace this with: df = pd.read_csv('your_file.csv')
    # For demo purposes, I'm creating sample data based on your CSV structure
    data = {
        'workflow_id': [1] * 39,
        'workflow_name': ['Limpieza Planta Baja'] * 39,
        'sector_id': [1] * 39,
        'sector_name': ['Planta Baja'] * 39,
        'step_id': list(range(1, 14)) * 3,
        'step_name': [
            'Subir Plataformas PLA-01 y pla-02', 'Colocar pie de Seguridad', 
            'Mover basura hacia el medio PLA-01 y PLA-02', 'Sacar PSE-01/02',
            'Bajar PLA-01 Y PLA-02', 'Barrido hacia Tolvas', 
            'Apertura de Tolvas TOL-01 y TOL-02', 'Limpieza CIN-01',
            'Limpieza de Rejilla REJ-01', 'Barrido de Tolva-01',
            'Limpieza de Elevador ELE-01', 'Barrido de Tolva-02 a Rejilla',
            'Bajar puente de TOL-02'
        ] * 3,
        'assigned_to': (['operario1'] * 5 + ['operario2'] * 8) * 3,
        'expected_time': ([1, 5, 20, 5, 2, 5, 1, 7, 8, 2, 6, 2, 1] * 3),
        'elapsed_time': [
            # Day 1 (2024-03-20)
            2, 7, 24, 5, 2, 10, 1, 15, 15, 3, 10, 3, 1,
            # Day 2 (2024-03-21)  
            1.5, 8, 27, 6, 2.5, 12, 1.5, 18, 17, 4, 12, 3.5, 1.5,
            # Day 3 (2024-03-22)
            2.5, 9, 30, 7, 3, 14, 2, 21, 19, 5, 14, 4, 2
        ],
        'started_at': [
            # Day 1
            '2024-03-20T10:00:00', '2024-03-20T10:02:00', '2024-03-20T10:09:00',
            '2024-03-20T10:33:00', '2024-03-20T10:38:00', '2024-03-20T10:40:00',
            '2024-03-20T10:50:00', '2024-03-20T10:51:00', '2024-03-20T11:06:00',
            '2024-03-20T11:21:00', '2024-03-20T11:24:00', '2024-03-20T11:34:00',
            '2024-03-20T11:37:00',
            # Day 2
            '2024-03-21T10:00:00', '2024-03-21T10:01:30', '2024-03-21T10:09:30',
            '2024-03-21T10:36:30', '2024-03-21T10:42:30', '2024-03-21T10:45:00',
            '2024-03-21T10:57:00', '2024-03-21T10:58:30', '2024-03-21T11:16:30',
            '2024-03-21T11:33:30', '2024-03-21T11:37:30', '2024-03-21T11:49:30',
            '2024-03-21T11:53:00',
            # Day 3
            '2024-03-22T10:00:00', '2024-03-22T10:02:30', '2024-03-22T10:11:30',
            '2024-03-22T10:41:30', '2024-03-22T10:48:30', '2024-03-22T10:51:30',
            '2024-03-22T11:05:30', '2024-03-22T11:07:30', '2024-03-22T11:28:30',
            '2024-03-22T11:47:30', '2024-03-22T11:52:30', '2024-03-22T12:06:30',
            '2024-03-22T12:10:30'
        ],
        'status': ['done'] * 39
    }
    
    df = pd.DataFrame(data)
    df['started_at'] = pd.to_datetime(df['started_at'])
    df['date'] = df['started_at'].dt.date
    df['variance'] = df['elapsed_time'] - df['expected_time']
    df['efficiency'] = (df['expected_time'] / df['elapsed_time']) * 100
    
    return df

# Load data
df = load_data()

# Title and header
st.title("🏭 Dashboard - Limpieza Planta Baja")
st.markdown("---")

# Sidebar for filters
st.sidebar.header("Filtros")
selected_dates = st.sidebar.multiselect(
    "Seleccionar fechas:",
    options=df['date'].unique(),
    default=df['date'].unique()
)

selected_operators = st.sidebar.multiselect(
    "Seleccionar operarios:",
    options=df['assigned_to'].unique(),
    default=df['assigned_to'].unique()
)

# Filter data
filtered_df = df[
    (df['date'].isin(selected_dates)) & 
    (df['assigned_to'].isin(selected_operators))
]

# Key Metrics Row
st.header("📊 Métricas Principales")
col1, col2, col3, col4 = st.columns(4)

with col1:
    avg_efficiency = filtered_df['efficiency'].mean()
    st.metric(
        label="Eficiencia Promedio",
        value=f"{avg_efficiency:.1f}%",
        delta=f"{avg_efficiency - 100:.1f}%" if avg_efficiency < 100 else f"+{avg_efficiency - 100:.1f}%"
    )

with col2:
    total_time = filtered_df['elapsed_time'].sum()
    expected_total = filtered_df['expected_time'].sum()
    st.metric(
        label="Tiempo Total (min)",
        value=f"{total_time:.0f}",
        delta=f"{total_time - expected_total:.0f}"
    )

with col3:
    avg_variance = filtered_df['variance'].mean()
    st.metric(
        label="Variación Promedio (min)",
        value=f"{avg_variance:.1f}",
        delta=f"{avg_variance:.1f}" if avg_variance != 0 else "0"
    )

with col4:
    completion_rate = (filtered_df['status'] == 'done').mean() * 100
    st.metric(
        label="Tasa de Completación",
        value=f"{completion_rate:.0f}%"
    )

st.markdown("---")

# Daily Performance Analysis
st.header("📈 Análisis de Rendimiento Diario")

# Calculate daily aggregates
daily_stats = filtered_df.groupby('date').agg({
    'expected_time': 'sum',
    'elapsed_time': 'sum',
    'variance': 'sum',
    'step_id': 'count'
}).round(2)

daily_stats['efficiency'] = (daily_stats['expected_time'] / daily_stats['elapsed_time']) * 100
daily_stats = daily_stats.reset_index()

col1, col2 = st.columns(2)

with col1:
    # Daily time comparison
    fig1 = go.Figure()
    fig1.add_trace(go.Scatter(
        x=daily_stats['date'],
        y=daily_stats['expected_time'],
        mode='lines+markers',
        name='Tiempo Esperado',
        line=dict(color='blue')
    ))
    fig1.add_trace(go.Scatter(
        x=daily_stats['date'],
        y=daily_stats['elapsed_time'],
        mode='lines+markers',
        name='Tiempo Real',
        line=dict(color='red')
    ))
    fig1.update_layout(
        title="Comparación Tiempo Esperado vs Real por Día",
        xaxis_title="Fecha",
        yaxis_title="Tiempo (minutos)",
        hovermode='x unified'
    )
    st.plotly_chart(fig1, use_container_width=True)

with col2:
    # Daily efficiency
    fig2 = px.bar(
        daily_stats,
        x='date',
        y='efficiency',
        title="Eficiencia Diaria (%)",
        color='efficiency',
        color_continuous_scale='RdYlGn'
    )
    fig2.add_hline(y=100, line_dash="dash", line_color="black", 
                   annotation_text="100% Eficiencia")
    fig2.update_layout(xaxis_title="Fecha", yaxis_title="Eficiencia (%)")
    st.plotly_chart(fig2, use_container_width=True)

# Step-by-Step Analysis
st.header("🔍 Análisis por Pasos")

# Calculate step performance
step_performance = filtered_df.groupby(['step_id', 'step_name']).agg({
    'expected_time': 'first',
    'elapsed_time': ['mean', 'std'],
    'variance': 'mean',
    'assigned_to': 'first'
}).round(2)

step_performance.columns = ['expected_time', 'avg_elapsed', 'std_elapsed', 'avg_variance', 'operator']
step_performance = step_performance.reset_index()

col1, col2 = st.columns(2)

with col1:
    # Steps with highest variance
    worst_steps = step_performance.nlargest(8, 'avg_variance')
    fig3 = px.bar(
        worst_steps,
        x='step_id',
        y='avg_variance',
        title="Pasos con Mayor Variación de Tiempo",
        hover_data=['step_name', 'operator'],
        color='avg_variance',
        color_continuous_scale='Reds'
    )
    fig3.update_layout(xaxis_title="ID del Paso", yaxis_title="Variación Promedio (min)")
    st.plotly_chart(fig3, use_container_width=True)

with col2:
    # Step consistency (standard deviation)
    fig4 = px.scatter(
        step_performance,
        x='avg_elapsed',
        y='std_elapsed',
        size='avg_variance',
        color='operator',
        title="Consistencia vs Tiempo Promedio por Paso",
        hover_data=['step_name'],
        labels={
            'avg_elapsed': 'Tiempo Promedio (min)',
            'std_elapsed': 'Desviación Estándar (min)'
        }
    )
    st.plotly_chart(fig4, use_container_width=True)

# Operator Performance
st.header("👥 Rendimiento por Operario")

operator_stats = filtered_df.groupby(['assigned_to', 'date']).agg({
    'elapsed_time': 'sum',
    'expected_time': 'sum',
    'step_id': 'count'
}).reset_index()

operator_stats['efficiency'] = (operator_stats['expected_time'] / operator_stats['elapsed_time']) * 100

col1, col2 = st.columns(2)

with col1:
    # Operator time distribution by day
    fig5 = px.bar(
        operator_stats,
        x='date',
        y='elapsed_time',
        color='assigned_to',
        title="Distribución de Tiempo por Operario y Día",
        barmode='stack'
    )
    fig5.update_layout(xaxis_title="Fecha", yaxis_title="Tiempo (minutos)")
    st.plotly_chart(fig5, use_container_width=True)

with col2:
    # Operator efficiency comparison
    avg_efficiency_by_operator = operator_stats.groupby('assigned_to')['efficiency'].mean().reset_index()
    fig6 = px.bar(
        avg_efficiency_by_operator,
        x='assigned_to',
        y='efficiency',
        title="Eficiencia Promedio por Operario",
        color='efficiency',
        color_continuous_scale='RdYlGn'
    )
    fig6.add_hline(y=100, line_dash="dash", line_color="black")
    fig6.update_layout(xaxis_title="Operario", yaxis_title="Eficiencia Promedio (%)")
    st.plotly_chart(fig6, use_container_width=True)

# Detailed Step Performance Table
st.header("📋 Tabla Detallada de Rendimiento por Pasos")

# Create a more detailed table
detailed_table = step_performance.copy()
detailed_table['step_name_short'] = detailed_table['step_name'].str[:40] + '...'
detailed_table['variance_status'] = detailed_table['avg_variance'].apply(
    lambda x: '🔴 Alto' if x > 5 else '🟡 Medio' if x > 2 else '🟢 Bajo'
)

st.dataframe(
    detailed_table[['step_id', 'step_name_short', 'expected_time', 'avg_elapsed', 
                   'avg_variance', 'variance_status', 'operator']].rename(columns={
        'step_id': 'ID',
        'step_name_short': 'Nombre del Paso',
        'expected_time': 'Tiempo Esperado (min)',
        'avg_elapsed': 'Tiempo Promedio (min)',
        'avg_variance': 'Variación Promedio (min)',
        'variance_status': 'Estado de Variación',
        'operator': 'Operario'
    }),
    use_container_width=True
)

# Workflow Timeline
st.header("⏰ Línea de Tiempo del Flujo de Trabajo")

# Create timeline for latest date
latest_date = df['date'].max()
timeline_data = df[df['date'] == latest_date].copy()
timeline_data['end_time'] = timeline_data['started_at'] + pd.Timedelta(minutes=1) * timeline_data['elapsed_time']

fig7 = px.timeline(
    timeline_data,
    x_start='started_at',
    x_end='end_time',
    y='step_name',
    color='assigned_to',
    title=f"Línea de Tiempo - {latest_date}",
    hover_data=['expected_time', 'elapsed_time', 'variance']
)
fig7.update_yaxes(autorange="reversed")
fig7.update_layout(height=600)
st.plotly_chart(fig7, use_container_width=True)

# Summary insights
st.header("💡 Insights y Recomendaciones")

col1, col2 = st.columns(2)

with col1:
    st.subheader("Problemas Identificados")
    worst_step = step_performance.loc[step_performance['avg_variance'].idxmax()]
    st.write(f"• **Paso más problemático**: {worst_step['step_name']} (Variación: +{worst_step['avg_variance']:.1f} min)")
    
    if avg_efficiency < 100:
        st.write(f"• **Eficiencia general por debajo del objetivo**: {avg_efficiency:.1f}%")
    
    inconsistent_steps = step_performance[step_performance['std_elapsed'] > 3]
    if len(inconsistent_steps) > 0:
        st.write(f"• **{len(inconsistent_steps)} pasos con alta variabilidad** en tiempo de ejecución")

with col2:
    st.subheader("Recomendaciones")
    st.write("• Revisar procesos en pasos con mayor variación")
    st.write("• Estandarizar procedimientos para mejorar consistencia")
    st.write("• Considerar capacitación adicional si hay diferencias significativas entre operarios")
    st.write("• Implementar mejoras en los pasos que consistentemente exceden el tiempo esperado")

# Raw data section (collapsible)
with st.expander("Ver datos sin procesar"):
    st.dataframe(filtered_df)