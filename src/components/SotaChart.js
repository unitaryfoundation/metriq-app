// SotaChart.js
// from https://www.d3-graph-gallery.com/graph/scatter_basic.html
// and https://betterprogramming.pub/react-d3-plotting-a-line-chart-with-tooltips-ed41a4c31f4f

import React from 'react'
import { Chart, LinearScale, LogarithmicScale, TimeScale, CategoryScale, PointElement, LineElement, BarElement, ScatterController, BarController, Tooltip } from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import 'chartjs-chart-box-and-violin-plot' // Added import for box plot
import moment from 'moment'
import 'chartjs-adapter-moment'
import axios from 'axios'
import config from '../config'
import { sortByCounts } from './SortFunctions'
import ErrorHandler from './ErrorHandler'
import SotaControlRow from './SotaControlRow'
import { Button } from 'react-bootstrap'
import { Link } from 'react-router-dom'

const chartComponents = [LinearScale, LogarithmicScale, TimeScale, CategoryScale, PointElement, LineElement, BarElement, ScatterController, BarController, Tooltip, ChartDataLabels]
Chart.register(chartComponents)
Chart.register(require('chartjs-chart-box-and-violin-plot')) // Registered box plot controller
Chart.defaults.font.size = 13
const chart = null

class SotaChart extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      windowWidth: 0,
      chart: null,
      task: {},
      isLog: props.isLog ? 1 : 0,
      logBase: Math.log(10),
      log: Math.log10,
      subset: '',
      label: 'method',
      metricNames: {},
      chartKey: null,
      chartData: [],
      isLowerBetterDict: {},
      isSotaLineVisible: true,
      isSotaLabelVisible: true,
      subsetDataSetsActive: {},
      isSameDate: false,
      chartType: props.chartType || 'default' // Initialized chartType
    }

    this.chart = null
    this.chartRef = React.createRef()
    this.updateWindowDimensions = this.updateWindowDimensions.bind(this)
    this.handleOnChange = this.handleOnChange.bind(this)
    this.handleOnChangeLabel = this.handleOnChangeLabel.bind(this)
    this.handleOnChangeLog = this.handleOnChangeLog.bind(this)
    this.handleOnChangeShowLine = this.handleOnChangeShowLine.bind(this)
    this.handleOnChangeShowLabels = this.handleOnChangeShowLabels.bind(this)
    this.loadChart = this.loadChart.bind(this)
    this.loadChartFromState = this.loadChartFromState.bind(this)
    this.formatDate = this.formatDate.bind(this)
    this.handleChartTypeChange = this.handleChartTypeChange.bind(this) // Bind new method
  }

  handleChartTypeChange (chartType) {
    this.setState({ chartType })
    this.loadChartFromState({
      subset: this.state.subset,
      label: this.state.label,
      metricNames: this.state.metricNames,
      chartKey: this.state.chartKey,
      chartData: this.state.chartData,
      isLowerBetterDict: this.state.isLowerBetterDict,
      isLog: this.state.isLog,
      logBase: this.state.logBase,
      log: this.state.log,
      isSotaLineVisible: this.state.isSotaLineVisible,
      isSotaLabelVisible: this.state.isSotaLabelVisible,
      subsetDataSetsActive: this.state.subsetDataSetsActive,
      chartType // Pass the new chartType
    })
  }

  componentDidMount () {
    this.updateWindowDimensions()
    window.addEventListener('resize', this.updateWindowDimensions)
    this.loadChart()
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.updateWindowDimensions)
    if (this.chart) {
      this.chart.destroy()
    }
  }

  updateWindowDimensions () {
    this.setState({ windowWidth: window.innerWidth })
  }

  async loadChart (
    subsetParam = null,
    labelParam = null,
    metricNamesParam = null,
    chartKeyParam = null
  ) {
    let subset = subsetParam || this.state.subset
    let label = labelParam || this.state.label
    let metricNames = metricNamesParam || this.state.metricNames
    let chartKey = chartKeyParam || this.state.chartKey

    try {
      const response = await axios.get(config.api.getTask, {
        params: {
          task_id: this.props.taskId
        }
      })
      this.setState({ task: response.data })

      if (Object.keys(metricNames).length === 0) {
        metricNames = {}
        for (let i = 0; i < response.data.metrics.length; i++) {
          const metric = response.data.metrics[i]
          metricNames[metric] = metric
        }
      }

      if (!chartKey) {
        chartKey = response.data.metrics[0]
      }

      this.setState({ metricNames: metricNames })
      this.setState({ chartKey: chartKey })

      const chartData = []
      const isLowerBetterDict = {}

      for (let i = 0; i < response.data.results.length; i++) {
        const result = response.data.results[i]
        for (let j = 0; j < result.measurements.length; j++) {
          const measurement = result.measurements[j]
          if (measurement.metricName === chartKey) {
            chartData.push({
              submissionId: result.submissionId,
              label: result.evaluatedAt,
              method: result.methodName,
              value: measurement.value,
              platform: result.platformName,
              arXivId: result.arXivId
            })
          }
        }
      }

      isLowerBetterDict[chartKey] = response.data.isLowerBetter

      this.loadChartFromState({
        subset,
        label,
        metricNames,
        chartKey,
        chartData,
        isLowerBetterDict,
        isLog: this.state.isLog,
        logBase: this.state.logBase,
        log: this.state.log,
        isSotaLineVisible: this.state.isSotaLineVisible,
        isSotaLabelVisible: this.state.isSotaLabelVisible,
        subsetDataSetsActive: this.state.subsetDataSetsActive,
        chartType: this.state.chartType
      })
    } catch (err) {
      console.log(err)
      this.setState({
        error:
          'Error loading chart for task. Please try again in a few minutes.'
      })
    }
  }

  loadChartFromState (state) {
    if (!state.chartData) {
      return
    }

    if (this.chart) {
      this.chart.destroy()
    }

    const d = state.chartData.sort((a, b) => (new Date(a.label)).getTime() - (new Date(b.label)).getTime())
    const sotaData = d.filter(obj => obj.submissionId === state.task.sotaSubmission.id)

    let isSameDate = true
    if (d.length > 0) {
      const firstDate = d[0].label
      for (let i = 1; i < d.length; i++) {
        if (d[i].label !== firstDate) {
          isSameDate = false
          break
        }
      }
    }
    this.setState({ isSameDate })

    let lowest = state.isLowerBetterDict[state.chartKey] ? Math.min(...d.map(obj => obj.value)) : Math.max(...d.map(obj => obj.value))
    let highest = state.isLowerBetterDict[state.chartKey] ? Math.max(...d.map(obj => obj.value)) : Math.min(...d.map(obj => obj.value))

    const canLog = (lowest > 0)

    if (state.isLog && canLog) {
      lowest = state.log(lowest)
      highest = state.log(highest)
    }

    // Logic for Box Plot data preparation
    const dateGroups = {}
    if (state.chartType === 'boxplot' && !isSameDate) {
      for (const item of d) {
        const dateStr = moment(item.label).format('YYYY-MM-DD')
        if (!dateGroups[dateStr]) {
          dateGroups[dateStr] = []
        }
        dateGroups[dateStr].push(item)
      }
    }

    let data = {}
    let chartType = isSameDate ? 'bar' : undefined

    if (state.chartType === 'boxplot' && !isSameDate) { // Box plot specific data and chart type
      chartType = 'boxplot'
      const boxplotData = {
        labels: Object.keys(dateGroups).sort(),
        datasets: []
      }

      const boxplotDataset = {
        label: state.chartKey,
        backgroundColor: 'rgba(60, 210, 249, 0.5)',
        borderColor: 'rgb(60, 210, 249)',
        borderWidth: 1,
        outlierColor: '#999999',
        padding: 10,
        itemRadius: 2,
        data: []
      }

      for (const dateStr of boxplotData.labels) {
        const values = dateGroups[dateStr].map(item =>
          (state.isLog && canLog) ? state.log(item.value) : item.value
        )

        if (values.length > 0) {
          values.sort((a, b) => a - b)

          const min = values[0]
          const max = values[values.length - 1]
          const q1 = values[Math.floor(values.length * 0.25)]
          const median = values[Math.floor(values.length * 0.5)]
          const q3 = values[Math.floor(values.length * 0.75)]

          boxplotDataset.data.push({
            min,
            max,
            q1,
            median,
            q3,
            date: dateStr
          })
        }
      }

      boxplotData.datasets.push(boxplotDataset)
      data = boxplotData
    } else if (isSameDate) {
      data = {
        datasets: [],
        labels: d.map((obj, index) => ((state.label === 'arXiv') && obj.arXivId) ? (obj.arXivId + '\n') : (obj.method + (obj.platform ? '\n' + obj.platform : '')))
      }
    } else {
      const dataSotaLine = state.isSotaLineVisible
        ? {
            type: 'line',
            label: '[HIDE LABEL]',
            labels: sotaData.map((obj, index) => obj.method + (obj.platform ? '\n' + obj.platform : '')),
            backgroundColor: 'rgb(60, 210, 249)',
            borderColor: 'rgb(60, 210, 249)',
            data: sotaData.map((obj, index) => {
              return {
                label: ((state.label === 'arXiv') && obj.arXivId) ? (obj.arXivId + '\n') : (obj.method + (obj.platform ? '\n' + obj.platform : '')),
                isShowLabel: index === (sotaData.length - 1),
                submissionId: obj.submissionId,
                x: obj.label,
                y: (state.isLog && canLog) ? state.log(obj.value) : obj.value
              }
            }),
            pointRadius: 0,
            pointHoverRadius: 0
          }
        : {}
      const dataSotaLabels = state.isSotaLabelVisible
        ? {
            type: 'scatter',
            label: '[HIDE LABEL]',
            labels: sotaData.map((obj, index) => obj.method + (obj.platform ? '\n' + obj.platform : '')),
            backgroundColor: 'rgb(60, 210, 249)',
            borderColor: 'rgb(60, 210, 249)',
            data: sotaData.map((obj, index) => {
              return {
                label: ((state.label === 'arXiv') && obj.arXivId) ? (obj.arXivId + '\n') : (obj.method + (obj.platform ? '\n' + obj.platform : '')),
                isShowLabel: index !== (sotaData.length - 1),
                submissionId: obj.submissionId,
                x: obj.label,
                y: (state.isLog && canLog) ? state.log(obj.value) : obj.value
              }
            }),
            pointRadius: 0,
            pointHoverRadius: 0
          }
        : {}
      const datasets = []
      if (state.isSotaLineVisible) {
        datasets.push(dataSotaLine)
      }
      if (state.isSotaLabelVisible) {
        datasets.push(dataSotaLabels)
      }
      data = { datasets }
    }

    // Chart.js options
    const options = {
      animation: {
        duration: 0
      },
      responsive: true,
      maintainAspectRatio: false,
      onClick: (e, item) => {
        if (!item || item.length === 0) {
          return
        }
        const submissionId = item[0].element.$context.raw.submissionId
        window.location.href = '/submission/' + submissionId
      },
      plugins: {
        datalabels: {
          display: function (context) {
            return context.dataset.data[context.dataIndex].isShowLabel
          },
          backgroundColor: function (context) {
            return context.dataset.backgroundColor
          },
          borderRadius: 4,
          color: 'white',
          font: {
            weight: 'bold'
          },
          formatter: function (value, context) {
            return context.dataset.data[context.dataIndex].label
          },
          padding: 6
        },
        tooltip: {
          callbacks: {
            title: function (context) {
              if (state.chartType === 'boxplot' && !isSameDate) {
                return `Date: ${context[0].raw.date}`
              }
              return context[0].label
            },
            label: function (context) {
              if (state.chartType === 'boxplot' && !isSameDate) {
                const data = context.raw
                return [
                  `Min: ${data.min.toPrecision(4)}`,
                  `Q1: ${data.q1.toPrecision(4)}`,
                  `Median: ${data.median.toPrecision(4)}`,
                  `Q3: ${data.q3.toPrecision(4)}`,
                  `Max: ${data.max.toPrecision(4)}`
                ]
              }
              return `Value: ${context.formattedValue}`
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Date'
          },
          type: 'time',
          time: {
            unit: 'day',
            tooltipFormat: 'YYYY-MM-DD',
            displayFormats: {
              millisecond: 'MMM DD',
              second: 'MMM DD',
              minute: 'MMM DD',
              hour: 'MMM DD',
              day: 'MMM DD',
              week: 'MMM DD',
              month: 'MMM DD',
              quarter: 'MMM DD',
              year: 'MMM DD'
            }
          }
        },
        y: {
          title: {
            display: true,
            text: 'Value'
          },
          type: state.isLog ? 'logarithmic' : 'linear',
          min: state.isLog ? lowest : Math.min(0, lowest),
          max: highest,
          ticks: {
            callback: function (value, index, values) {
              return value.toPrecision(4)
            }
          }
        }
      }
    }

    if (isSameDate) {
      options.scales.x.type = 'category'
      options.scales.x.time = {}
      options.indexAxis = 'y'
      options.scales.y.title = {
        display: true,
        text: state.chartKey
      }
      options.scales.x.title = {
        display: true,
        text: 'Date'
      }
    }

    if (chartType === 'boxplot') {
      options.scales.x = {
        type: 'category',
        title: {
          display: true,
          text: 'Date'
        },
        labels: data.labels
      }
    }

    this.chart = new Chart(this.chartRef.current, {
      type: chartType,
      data: data,
      options: options
    })
  }

  handleOnChange (event) {
    const { name, value } = event.target
    this.setState({ [name]: value })
    this.loadChart(
      name === 'subset' ? value : null,
      name === 'label' ? value : null,
      name === 'metricNames' ? value : null,
      name === 'chartKey' ? value : null
    )
  }

  handleOnChangeLog (event) {
    const isLog = event.target.checked
    this.setState({ isLog: isLog ? 1 : 0 })
    this.loadChartFromState({
      subset: this.state.subset,
      label: this.state.label,
      metricNames: this.state.metricNames,
      chartKey: this.state.chartKey,
      chartData: this.state.chartData,
      isLowerBetterDict: this.state.isLowerBetterDict,
      isLog: isLog ? 1 : 0,
      logBase: this.state.logBase,
      log: this.state.log,
      isSotaLineVisible: this.state.isSotaLineVisible,
      isSotaLabelVisible: this.state.isSotaLabelVisible,
      subsetDataSetsActive: this.state.subsetDataSetsActive,
      chartType: this.state.chartType
    })
  }

  handleOnChangeShowLine (event) {
    const isSotaLineVisible = event.target.checked
    this.setState({ isSotaLineVisible: isSotaLineVisible })
    this.loadChartFromState({
      subset: this.state.subset,
      label: this.state.label,
      metricNames: this.state.metricNames,
      chartKey: this.state.chartKey,
      chartData: this.state.chartData,
      isLowerBetterDict: this.state.isLowerBetterDict,
      isLog: this.state.isLog,
      logBase: this.state.logBase,
      log: this.state.log,
      isSotaLineVisible: isSotaLineVisible,
      isSotaLabelVisible: this.state.isSotaLabelVisible,
      subsetDataSetsActive: this.state.subsetDataSetsActive,
      chartType: this.state.chartType
    })
  }

  handleOnChangeShowLabels (event) {
    const isSotaLabelVisible = event.target.checked
    this.setState({ isSotaLabelVisible: isSotaLabelVisible })
    this.loadChartFromState({
      subset: this.state.subset,
      label: this.state.label,
      metricNames: this.state.metricNames,
      chartKey: this.state.chartKey,
      chartData: this.state.chartData,
      isLowerBetterDict: this.state.isLowerBetterDict,
      isLog: this.state.isLog,
      logBase: this.state.logBase,
      log: this.state.log,
      isSotaLineVisible: this.state.isSotaLineVisible,
      isSotaLabelVisible: isSotaLabelVisible,
      subsetDataSetsActive: this.state.subsetDataSetsActive,
      chartType: this.state.chartType
    })
  }

  handleOnChangeLabel (event) {
    const label = event.target.value
    this.setState({ label: label })
    this.loadChartFromState({
      subset: this.state.subset,
      label: label,
      metricNames: this.state.metricNames,
      chartKey: this.state.chartKey,
      chartData: this.state.chartData,
      isLowerBetterDict: this.state.isLowerBetterDict,
      isLog: this.state.isLog,
      logBase: this.state.logBase,
      log: this.state.log,
      isSotaLineVisible: this.state.isSotaLineVisible,
      isSotaLabelVisible: this.state.isSotaLabelVisible,
      subsetDataSetsActive: this.state.subsetDataSetsActive,
      chartType: this.state.chartType
    })
  }

  formatDate (date) {
    const d = new Date(date)
    return d.toLocaleDateString('en-US')
  }

  render () {
    return (
      <span>
        {this.state.error && <ErrorHandler error={this.state.error} />}
        {!this.state.error &&
          <div className='row' style={{ padding: '20px' }}>
            <div className={this.state.windowWidth < 900 ? 'col-12' : 'col-9'}>
              <div style={{ height: '400px' }}>
                <canvas ref={this.chartRef} />
              </div>
            </div>
            <div className={this.state.windowWidth < 900 ? 'col-12' : 'col-3'}>
              <div className='sota-chart-controls'>
                <SotaControlRow
                  name='chartKey'
                  label='Metric:'
                  value={this.state.chartKey}
                  options={this.state.metricNames}
                  onChange={this.handleOnChange}
                />
                <SotaControlRow
                  name='chartType' // Added chart type control
                  label='Chart type:'
                  value={this.state.chartType}
                  options={{
                    default: 'Default',
                    boxplot: 'Box Plot'
                  }}
                  onChange={e => this.handleChartTypeChange(e.target.value)}
                  tooltip='Select chart visualization type'
                />
                <SotaControlRow
                  name='labelOption'
                  label='Label:'
                  value={this.state.label}
                  options={{
                    arXiv: 'arXiv ID',
                    method: 'Method and platform'
                  }}
                  onChange={this.handleOnChangeLabel}
                />
                <div className='row sota-checkbox-row' style={{ paddingTop: '32px' }}>
                  <div className='col-10 text-start sota-label'>
                    Show all labels
                  </div>
                  <div className='col-2 text-end'>
                    <input type='checkbox' className='sota-checkbox-control' checked={this.state.isSotaLabelVisible} onChange={this.handleOnChangeShowLabels} />
                  </div>
                </div>
                <div className='row sota-checkbox-row'>
                  <div className='col-10 text-start'>
                    <span style={{ color: 'rgb(60, 210, 249)', fontWeight: 'bold' }}>―</span> Trace state of the art (SOTA) entries
                  </div>
                  <div className='col-2 text-end'>
                    <input type='checkbox' className='sota-checkbox-control' checked={this.state.isSotaLineVisible} onChange={this.handleOnChangeShowLine} />
                  </div>
                </div>
              </div>
            </div>
          </div>}
      </span>
    )
  }
}

export default SotaChart
