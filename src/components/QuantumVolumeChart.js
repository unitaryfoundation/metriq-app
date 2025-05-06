// QuantumLandscapeChart.js

import React from 'react'
import * as d3 from 'd3'
import { saveAs } from 'file-saver'
import { serializeToString } from 'xmlserializer'
import '../viz-style.css'
import axios from 'axios'
import { sortByCounts } from './SortFunctions'
import config from '../config'
import { Link } from 'react-router-dom/cjs/react-router-dom.min'

const fontType = 'Helvetica'
const smallLabelSize = 15 // font size in pixel
const mobileLabelSize = 11
const chartHeight = 180 // chart height,
const circleSize = 8
const strokeSize = '1.5px'
const circleOpacity = {
  fieldLegend: 0.7,
  achieved: 0.5,
  estimated: 0.1
}
const strokeOpacity = {
  fieldLegend: 0,
  achieved: 1,
  estimated: 0.7
}
const colors = ['#ED1010', '#0D99FF', '#56E1C8', '#FFB800', '#c403f0', '#7c7c66', '#b82840', '#87b5f0', '#25fdf4']
const domainIndex = {
  quantinuum: 0,
  ibmq: 1,
  rigetti: 2,
  other: 3
}
const breakpoint = 700
let isMobile = window.outerWidth < breakpoint

function QuantumVolumeChart (props) {
  const chartRef = React.useRef()
  const legendRef = React.useRef()
  const legendColorRef = React.useRef()
  const [key] = React.useState(crypto.randomUUID())
  const [chartId] = React.useState('my_dataviz_' + key)
  const [legendId] = React.useState('legend_guide_' + key)
  const [legendColorId] = React.useState('legend-color-' + key)
  const [labelClass] = React.useState('labeltohide' + key)
  const [svgLegendId] = React.useState('svglegend' + key)
  const [toolTipId] = React.useState('#scatter-tooltip' + key)
  const [svgId] = React.useState('#svgscatter' + key)
  const [taskName, setTaskName] = React.useState('')
  const [metricName, setMetricName] = React.useState(props.metric)
  const [metricNames, setMetricNames] = React.useState([])
  const [areLabelsVisible, setAreLabelsVisible] = React.useState(false)
  const [areLabelsArxiv, setAreLabelsArxiv] = React.useState(false)
  const [isScaleLinear, setIsScaleLinear] = React.useState(parseInt(props.taskId) !== 34)
  const [isHide, setIsHide] = React.useState(false)
  const [d, setD] = React.useState({})

  function parseDate (dateString) {
    const [year, month, date] = dateString.split('-').map(Number)

    return new Date(year, month - 1, date)
  }

  // Quick sort from https://www.geeksforgeeks.org/javascript-program-for-quick-sort/
  // ...PURELY because Chrome Array.prototype.sort() is bugged for this case!
  function partition (arr, low, high) {
    const pivot = arr[high].dayIndexInEpoch
    let i = low - 1

    for (let j = low; j <= high - 1; ++j) {
      // If current element is smaller than the pivot
      if (arr[j].dayIndexInEpoch < pivot) {
        // Increment index of smaller element
        ++i;
        // Swap elements
        [arr[i], arr[j]] = [arr[j], arr[i]]
      }
    }
    // Swap pivot to its correct position
    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]]
    return i + 1 // Return the partition index
  }

  function dayIndexInEpoch (dateString) {
    // This is actually purely a work-around for a bug baked into Chrome.
    // It doesn't need to be exact; it just needs to be unique and maintain order.
    const [year, month, date] = dateString.split('-').map(Number)

    return (year - 1960) * 372 + (month - 1) * 31 + date
  }

  function makeClass (x, y) {
    return `c${x - y}`
  }

  function onLabelSwitchClick () {
    setAreLabelsVisible(!areLabelsVisible)
  }
  function onArxivSwitchClick () {
    setAreLabelsVisible(true)
    setAreLabelsArxiv(!areLabelsArxiv)
  }
  function onScaleSwitchClick () {
    setIsScaleLinear(!isScaleLinear)
  }
  function onMetricSelectChange (e) {
    setMetricName(e.target.value)
  }

  function onDownloadClick () {
    const svgElement = d3.select('#' + chartId).node()
    const svgString = serializeToString(svgElement)
    const blob = new Blob([svgString], {
      type: 'image/svg+xml;charset=utf-8'
    })
    saveAs(blob, 'chart.svg')
  }

  const quickSort = React.useCallback((arr, low, high) => {
    if (low >= high) return
    const pi = partition(arr, low, high)

    quickSort(arr, low, pi - 1)
    quickSort(arr, pi + 1, high)
  }, [])

  // Function to build legend
  const legend = React.useCallback((circleSizeFields = 8) => {
    let multCoeff = 1
    if (isMobile) {
      multCoeff = 1.5
    }

    const legendColor = d3.select(legendColorRef.current)

    const chartWidth = legendColor
      .node()
      .getBoundingClientRect().width

    // initiate svg
    const svg = legendColor
      .append('svg')
      .attr('viewBox', [0, 0, chartWidth * multCoeff, chartHeight])
      .attr('id', svgLegendId)
      .style('width', '100%')

    let newY = circleSizeFields + 10

    if (props.isQubits) {
      // circle 1
      svg
        .append('circle')
        .attr('stroke-width', strokeSize)
        .attr('cx', circleSizeFields)
        .attr('cy', newY)
        .attr('r', circleSizeFields)
        .style('stroke', colors[1])
        .style('stroke-opacity', strokeOpacity.fieldLegend)
        .style('fill', colors[1])
        .style('fill-opacity', circleOpacity.fieldLegend)

      // circle 1 label
      svg
        .append('text')
        .attr('x', circleSizeFields * 2 + 15)
        .attr('y', newY + 4)
        .style('font-size', `${smallLabelSize}px`)
        .style('font-family', fontType)
        .text('2 qubits')

      newY = newY + circleSizeFields + 20

      // circle 2
      svg
        .append('circle')
        .attr('stroke-width', strokeSize)
        .attr('cx', circleSizeFields)
        .attr('cy', newY)
        .attr('r', circleSizeFields)
        .style('stroke', colors[5])
        .style('stroke-opacity', strokeOpacity.fieldLegend)
        .style('fill', colors[5])
        .style('fill-opacity', circleOpacity.fieldLegend)

      // circle 2 label
      svg
        .append('text')
        .attr('x', circleSizeFields * 2 + 15)
        .attr('y', newY + 4)
        .style('font-size', `${smallLabelSize}px`)
        .style('font-family', fontType)
        .text('6 qubits')

      newY = newY + circleSizeFields + 20

      // circle 3
      svg
        .append('circle')
        .attr('stroke-width', strokeSize)
        .attr('cx', circleSizeFields)
        .attr('cy', newY)
        .attr('r', circleSizeFields)
        .style('stroke', colors[6])
        .style('stroke-opacity', strokeOpacity.fieldLegend)
        .style('fill', colors[6])
        .style('fill-opacity', circleOpacity.fieldLegend)

      // circle 3 label
      svg
        .append('text')
        .attr('x', circleSizeFields * 2 + 15)
        .attr('y', newY + 4)
        .style('font-size', `${smallLabelSize}px`)
        .style('font-family', fontType)
        .text('7 qubits')

      return
    }

    // circle 1
    svg
      .append('circle')
      .attr('stroke-width', strokeSize)
      .attr('cx', circleSizeFields)
      .attr('cy', newY)
      .attr('r', circleSizeFields)
      .style('stroke', colors[domainIndex.ibmq])
      .style('stroke-opacity', strokeOpacity.fieldLegend)
      .style('fill', colors[domainIndex.ibmq])
      .style('fill-opacity', circleOpacity.fieldLegend)

    // circle 1 label
    svg
      .append('text')
      .attr('x', circleSizeFields * 2 + 15)
      .attr('y', newY + 4)
      .style('font-size', `${smallLabelSize}px`)
      .style('font-family', fontType)
      .text('IBMQ')

    newY = newY + circleSizeFields + 20

    // circle 2
    svg
      .append('circle')
      .attr('stroke-width', strokeSize)
      .attr('cx', circleSizeFields)
      .attr('cy', newY)
      .attr('r', circleSizeFields)
      .style('stroke', colors[domainIndex.quantinuum])
      .style('stroke-opacity', strokeOpacity.fieldLegend)
      .style('fill', colors[domainIndex.quantinuum])
      .style('fill-opacity', circleOpacity.fieldLegend)

    // circle 2 label
    svg
      .append('text')
      .attr('x', circleSizeFields * 2 + 15)
      .attr('y', newY + 4)
      .style('font-size', `${smallLabelSize}px`)
      .style('font-family', fontType)
      .text('Quantinuum')

    newY = newY + circleSizeFields + 20

    // circle 3
    svg
      .append('circle')
      .attr('stroke-width', strokeSize)
      .attr('cx', circleSizeFields)
      .attr('cy', newY)
      .attr('r', circleSizeFields)
      .style('stroke', colors[domainIndex.rigetti])
      .style('stroke-opacity', strokeOpacity.fieldLegend)
      .style('fill', colors[domainIndex.rigetti])
      .style('fill-opacity', circleOpacity.fieldLegend)

    // circle 3 label
    svg
      .append('text')
      .attr('x', circleSizeFields * 2 + 15)
      .attr('y', newY + 4)
      .style('font-size', `${smallLabelSize}px`)
      .style('font-family', fontType)
      .text('Rigetti')

    newY = newY + circleSizeFields + 20

    // circle 4
    svg
      .append('circle')
      .attr('stroke-width', strokeSize)
      .attr('cx', circleSizeFields)
      .attr('cy', newY)
      .attr('r', circleSizeFields)
      .style('stroke', colors[domainIndex.other])
      .style('stroke-opacity', strokeOpacity.fieldLegend)
      .style('fill', colors[domainIndex.other])
      .style('fill-opacity', circleOpacity.fieldLegend)

    // circle 4 label
    svg
      .append('text')
      .attr('x', circleSizeFields * 2 + 15)
      .attr('y', newY + 4)
      .style('font-size', `${smallLabelSize}px`)
      .style('font-family', fontType)
      .text('Other')
  }, [props.isQubits, svgLegendId])

  const mousemove = React.useCallback((
    e,
    marginRight,
    xRange,
    data,
    svg,
    colors,
    domainIndex,
    fontType, // font size in pixel
    smallLabelSize,
    selectionRadius = 50,
    tooltipOffsetX = 0,
    tooltipOffsetY = 0,
    border = '1px',
    borderColor = 'black',
    padding = '5px',
    borderRadius = '5px',
    backgroundColor = '#fafafa',
    arrowSize = 8,
    turnTooltip = 0.6
  ) => {
    const mouseX = e.pageX
    const mouseY = e.pageY

    const targetID = e.target.id
    const targetClass = e.target.className.baseVal

    const selectedCircle = svg
      .select(`circle#${targetID}`)
      .node()
      .getBoundingClientRect()

    const xPerc = (selectedCircle.x - xRange[0]) / (xRange[1] - marginRight)

    const circleX = selectedCircle.x + window.scrollX + tooltipOffsetX
    const circleXshifted = circleX + selectedCircle.width
    const circleY = selectedCircle.y + window.scrollY + tooltipOffsetY

    const mouseDist = Math.sqrt((circleX - mouseX) ** 2 + (circleY - mouseY) ** 2)

    if (mouseDist <= selectionRadius) {
      svg.selectAll('line.selectedLine')
        .attr('class', null)
        .style('visibility', 'hidden')

      svg.selectAll('text.selectedText')
        .attr('class', null)
        .style('visibility', 'hidden')

      svg.selectAll(`line#${targetID}`)
        .attr('class', 'selectedLine')
        .style('visibility', 'visible')

      svg.selectAll(`text#${targetID}`)
        .attr('class', 'selectedText')
        .style('visibility', 'visible')

      const idData = data.filter((d) => d.id === targetID)[0]
      let otherCircles
      try {
        otherCircles = svg.selectAll(`circle.${targetClass}`)
      } catch {
        otherCircles = null
      }

      d3.select(toolTipId)
      // Main tooltip
        .style('visibility', 'visible')
        .style('top', `${circleY}px`)
        .style('font-size', `${smallLabelSize}px`)
        .style('font-family', fontType)
        .style('border', border)
        .style('border-style', 'solid')
        .style('border-color', borderColor)
        .style('border-radius', borderRadius)
        .style('padding', padding)
        .style('background-color', backgroundColor)
        .style(
          'transform',
        `translateY(-50%) translateY(${selectedCircle.width / 2}px)`
        )
        .html(
        `
      <div>
        ${otherCircles
? [...otherCircles._groups[0]]
          .map(
            (crcl) =>
              `<div style="font-size: 1.5em;">${crcl.__data__.platformName ? crcl.__data__.platformName : crcl.__data__.methodName}</div>`
          )
          .join('')
          : ('<div style="font-size: 1.5em;">' + (idData.platformName ? idData.platformName : idData.methodName) + '</div>')}
        ${d3.utcFormat('%B %d, %Y')(idData.tableDate)}<br>
        ${!otherCircles && !idData.platformName ? '' : (idData.methodName + '<br>')}
        <a href="/Submission/${
          idData.submissionId
        }" style="color: ${
          colors[props.isQubits ? idData.qubitCount - 1 : domainIndex[idData.domain]]
        }; filter: brightness(0.85)">→ explore submission</a>
      </div>`
        )

      if (xPerc < turnTooltip) {
        d3.select(toolTipId)
          .style('right', null)
          .style('left', `${circleXshifted + arrowSize / 2}px`)
      } else {
        d3.select(toolTipId)
          .style('left', null)
          .style('right', `${window.innerWidth - circleX + arrowSize / 2}px`)
      }

      d3.select(toolTipId)
        // triangle
        .append('div')
        .attr('id', 'tooltip-triangle')
        .style('position', 'absolute  ')
        .style('content', '         ')
        .style('top', '50%')
        .style('left', `${xPerc < turnTooltip ? 0 : 100}%`)
        .style('transform', 'translateX(-50%) rotate(45deg)')
        .style('border', border)
        .style('border-style', 'solid')
        .style('margin-top', `-${arrowSize / 2}px`)
        .style('width', `${arrowSize}px`)
        .style('height', `${arrowSize}px`)
        .style(
          'border-color',
          xPerc < turnTooltip
            ? `transparent transparent ${borderColor} ${borderColor}`
            : `${borderColor} ${borderColor} transparent transparent`
        )
        .style('background-color', backgroundColor)
    } else {
      d3.select(toolTipId).style('visibility', 'hidden')

      svg.selectAll('line.selectedLine')
        .attr('class', null)
        .style('visibility', 'hidden')

      svg.selectAll('text.selectedText')
        .attr('class', null)
        .style('visibility', 'hidden')
    }
  }, [props.isQubits, toolTipId])

  const barplot = React.useCallback((
    data,
    isl,
    ala,
    xRange,
    yRange,
    Y,
    marginLeft,
    marginTop,
    yAxisText,
    svg
  ) => {
    // Different series might have the same platform
    const series = {}
    for (let i = 0; i < data.length; ++i) {
      let s = (i.arXiv && ala) ? `arXiv:${i.arXiv}` : (data[i].platformName ? data[i].platformName : data[i].methodName)
      if (s in series) {
        ++series[s]
        s += ' (' + series[s] + ')'
      } else {
        series[s] = 1
      }
      data[i].domainName = s
    }

    const height = yRange[0] - yRange[1]
    const yMin = d3.min(Y)
    const yDomain = [yMin < 1 ? yMin : 1, d3.max(Y)]
    const x = d3.scaleBand()
      .range([xRange[0], xRange[1]])
      .domain(data.map((i) => i.domainName))
      .padding(0.2)
    svg.append('g')
      .attr('transform', 'translate(0,' + height + ')')
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('transform', 'translate(-10,0)rotate(-45)')
      .style('text-anchor', 'end')

    // Add Y axis
    const y = (isl ? d3.scaleLinear() : d3.scaleLog())
      .range([0, yRange[0] - yRange[1]])
      .domain([yDomain[1], yDomain[0]])

    const yAxis = d3.axisLeft(y)
    // append y axis
    svg
      .append('g')
      .attr('transform', `translate(${marginLeft},0)`)
      .attr('class', 'yaxis')
      .style('font-size', `${smallLabelSize}px`)
      .style('font-family', fontType)
      .call(yAxis)
      .call((g) =>
        g
          .append('text')
          .attr('transform', 'rotate(270)')
          .attr('x', -marginTop)
          .attr('y', -50)
          .attr('fill', 'currentColor')
          .attr('text-anchor', 'end')
          .attr('font-size', `${smallLabelSize}px`)
          .text(yAxisText)
      )

    // Bars
    svg.selectAll('bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('x', (i) => x(i.domainName))
      .attr('y', (i) => y(i.metricValue))
      .attr('width', x.bandwidth())
      .attr('height', (i) => (height - y(i.metricValue)))
      .style('stroke', (i) =>
        colors[props.isQubits ? i.qubitCount - 1 : domainIndex[i.provider]]
          ? colors[props.isQubits ? i.qubitCount - 1 : domainIndex[i.provider]]
          : colors[3]
      )
      .style('fill', (i) =>
        colors[props.isQubits ? i.qubitCount - 1 : domainIndex[i.provider]]
          ? colors[props.isQubits ? i.qubitCount - 1 : domainIndex[i.provider]]
          : colors[3]
      )
  }, [props.isQubits])

  const scatterplot = React.useCallback((
    data,
    isl,
    alv,
    ala,
    yName, // the y column
    xName, // the x column
    marginLeft,
    marginRight, // right margin, in pixels
    xlabelDistance,
    I,
    voronoi,
    xRange,
    xScale,
    x,
    yScale,
    y,
    maxIDs,
    maxData,
    tooltipLineColor,
    tooltipLineStrokeTexture,
    horizontalLineStrokeSize,
    tickInterval,
    marginTop,
    marginBottom,
    chartHeight,
    chartWidth,
    xLabelShift,
    xAxisText,
    yAxisText,
    svg
  ) => {
    const xAxis = d3.axisBottom(xScale).ticks(tickInterval)
    // append x axis
    svg
      .append('g')
      .attr('transform', `translate(0,${chartHeight - marginBottom})`)
      .attr('class', 'xaxis')
      .style('font-size', `${smallLabelSize}px`)
      .style('font-family', fontType)
      .call(xAxis)
      .call((g) =>
        g
          .append('text')
          .attr('x', chartWidth - marginRight)
          .attr('y', marginBottom - 4)
          .attr('transform', `translate(0,${-xLabelShift})`)
          .attr('fill', 'currentColor')
          .attr('text-anchor', 'end')
          .text(xAxisText)
      )
    const yAxis = d3.axisLeft(yScale).tickFormat(d3.format('.2f'))

    // append y axis
    svg
      .append('g')
      .attr('transform', `translate(${marginLeft},0)`)
      .attr('class', 'yaxis')
      .style('font-size', `${smallLabelSize}px`)
      .style('font-family', fontType)
      .call(yAxis)
      .call((g) =>
        g
          .append('text')
          .attr('transform', 'rotate(270)')
          .attr('x', -marginTop)
          .attr('y', -50)
          .attr('fill', 'currentColor')
          .attr('text-anchor', 'end')
          .attr('font-size', `${smallLabelSize}px`)
          .text(yAxisText)
      )

    // max lines (h + v)
    svg
      .append('g')
      .selectAll('line')
      .data(maxData.slice(0, maxData.length - 1))
      .join('line')
      .attr('x1', (i) => xScale(x(i)) + circleSize)
      .attr('y1', (i) => yScale(y(i)))
      .attr('x2', (i) => xScale(i.nextX))
      .attr('y2', (i) => yScale(y(i)))
      .style('stroke', tooltipLineColor)
      .style('stroke-width', horizontalLineStrokeSize)
      .style('stroke-dasharray', tooltipLineStrokeTexture)
    svg
      .append('g')
      .selectAll('line')
      .data(maxData.slice(0, maxData.length - 1))
      .join('line')
      .attr('x1', (i) => xScale(i.nextX))
      .attr('y1', (i) => yScale(y(i)))
      .attr('x2', (i) => xScale(i.nextX))
      .attr('y2', (i) => yScale(i.nextY) + circleSize)
      .style('stroke', tooltipLineColor)
      .style('stroke-width', horizontalLineStrokeSize)
      .style('stroke-dasharray', tooltipLineStrokeTexture)

    // voronoi grid
    svg
      .append('g')
      .attr('stroke', 'none')
      .attr('fill', '#00000000')
      .selectAll('path')
      .data(I)
      .join('path')
      .attr('d', (i) => voronoi.renderCell(i))
      .attr('id', function (i) {
        return data[i].id
      })
      .attr('class', function (i) {
        return makeClass(data[i][xName], data[i][yName])
      })
    // .attr("centroid_x", (i) => d3.polygonCentroid(voronoi.cellPolygon(i))[0])
    // .attr("centroid_y", (i) => d3.polygonCentroid(voronoi.cellPolygon(i))[1])
    // .classed("voronoi", true)
      .on('mousemove touchstart', (e) =>
        mousemove(
          e,
          marginRight,
          xRange,
          data,
          svg,
          colors,
          domainIndex,
          fontType,
          smallLabelSize
        )
      )
      .on('mouseout touchend', (e) => {
        d3.select(toolTipId).style('visibility', 'hidden')
      })

    // append circles
    svg
      .append('g')
      .attr('stroke-width', strokeSize)
      .selectAll('circle')
      .data(data)
      .join('circle')
      .attr('cx', (i) => xScale(x(i)))
      .attr('cy', (i) => yScale(y(i)))
      .attr('r', circleSize)
      .style('cursor', 'pointer')
      .style('stroke', (i) =>
        colors[props.isQubits ? i.qubitCount - 1 : domainIndex[i.provider]]
          ? colors[props.isQubits ? i.qubitCount - 1 : domainIndex[i.provider]]
          : colors[3]
      )
      .style('fill', (i) =>
        colors[props.isQubits ? i.qubitCount - 1 : domainIndex[i.provider]]
          ? colors[props.isQubits ? i.qubitCount - 1 : domainIndex[i.provider]]
          : colors[3]
      )
      .style('fill-opacity', (i) => circleOpacity.achieved)
      .attr('id', (i) => i.id)
      .attr('class', (i) => {
        return maxIDs.includes(i.id) ? 'haslabel' : null
      })
      .attr('class', (i) => makeClass(x(i), y(i)))
      .attr('submissionId', (i) => i.submissionId)
      .attr('label', (i) => {
        if (i.arXiv && ala) { return `arXiv:${i.arXiv}` }
        return i.platformName ? i.platformName : i.methodName
      })
      .on('click', function () {
        if (!isMobile) {
          const submissionId = d3.select(this).attr('submissionId')
          window.open(`/Submission/${submissionId}`)
        }
      })
      .on('mousemove touchstart', (e) =>
        mousemove(
          e,
          marginRight,
          xRange,
          data,
          svg,
          colors,
          domainIndex,
          fontType,
          smallLabelSize
        )
      )
      .on('mouseout touchend', (e) => {
        d3.select(toolTipId).style('visibility', 'hidden')
      })

    // label
    svg.selectAll('circle').each(function (d, i) {
      const id = d3.select(this).attr('id')

      if (maxIDs.includes(id)) {
        const x = svg.select(`circle#${id}`).attr('cx')
        const y = svg.select(`circle#${id}`).attr('cy')

        const svgWidth = d3
          .select(svgId)
          .node()
          .getBoundingClientRect().width

        const turnLabelBreakpoint = isMobile
          ? (svgWidth / 3) * 1.5
          : svgWidth / 3

        svg
          .append('text')
          .attr(
            'x',
            x > turnLabelBreakpoint
              ? Number(x) - xlabelDistance
              : Number(x) + xlabelDistance
          )
          .attr('y', Number(y))
          .attr('class', labelClass)
          .style(
            'visibility',
            alv ? 'visible' : 'hidden'
          )
          .style(
            'font-size',
            isMobile ? `${mobileLabelSize}px` : `${smallLabelSize}px`
          )
          .style('font-family', fontType)
          .attr('text-anchor', x > turnLabelBreakpoint ? 'end' : 'start')
          .text(`${svg.select(`circle#${id}`).attr('label')}`)
      }
    })
  }, [props.isQubits, mousemove, labelClass, svgId, toolTipId])

  // Function to draw plot
  const plot = React.useCallback((
    data,
    isl = false,
    alv = false,
    ala = false,
    yAxisText = metricName,
    yName = 'metricValue', // the y column
    xAxisText = 'Date →',
    xName = 'tableDate', // the x column
    chartTarget = chartRef.current, // html target element to attach chart
    chartHeight = 600, // chart height
    marginTop = 40, // top margin, in pixels
    marginRight = 100, // right margin, in pixels
    marginBottom = 70, // bottom margin, in pixels
    xLabelShift = marginBottom - 40,
    marginLeft = 100, // left margin, in pixels
    rangeMult = 0.11,
    xScaleType = d3.scaleTime,
    horizontalLineStrokeSize = '1px',
    tooltipLineStrokeTexture = '1 1',
    tooltipLineColor = '#bbbbbb',
    tooltipLineTextBorder = 2.5,
    xlabelDistance = 19
  ) => {
    if (!data || !data.filter || !data.length) {
      return
    }
    data = data
      .filter(
        (x) => (!isNaN(x[xName]) && (x[xName] > 0) && !isNaN(x[yName]) && (x[yName] > 0))
      )
      .map(function (obj, index) {
        return { ...obj, id: `ID_${index + 1}` }
      })

    // list of IDs of data with max values
    // maxData with only max objects

    const metricNameInvariant = yAxisText.toLowerCase()
    const isQv = (metricNameInvariant === 'quantum volume')

    data = data.filter((x) => x.metricName.toLowerCase() === metricNameInvariant)
    if (isQv && !isl) {
      data = data.filter((x) => x.metricValue > 1)
    }

    data.map((d) => {
      if (isQv && !isl) {
        d.metricValue = Math.log2(d.metricValue)
      }

      return 0
    })

    if (!data.length) {
      return
    }

    const chronData = [...data]
    quickSort(chronData, 0, chronData.length - 1)
    const maxIDs = [chronData[0].id]
    let currentMaxValue = chronData[0].metricValue
    for (let lcv = 1; lcv < chronData.length; ++lcv) {
      const d = chronData[lcv]
      if (d.metricValue > currentMaxValue) {
        maxIDs.push(d.id)
        currentMaxValue = d.metricValue
      }
    }

    const maxData = chronData.filter((d) => maxIDs.includes(d.id))
    for (let lcv = 0; lcv < (maxData.length - 1); ++lcv) {
      maxData[lcv].nextX = maxData[lcv + 1][xName]
      maxData[lcv].nextY = maxData[lcv + 1][yName]
    }

    let isSameDate = true
    for (let i = 1; i < data.length; ++i) {
      if (data[0].dayIndexInEpoch !== data[i].dayIndexInEpoch) {
        isSameDate = false
        break
      }
    }
    if (isSameDate) {
      marginBottom = 128
      xLabelShift = marginBottom - 40
    }

    const yScaleType = (isl || isQv) ? d3.scaleLinear : d3.scaleLog
    if (isQv && !isl) {
      yAxisText = 'Log-2 Quantum Volume'
    }
    yAxisText += ' →'

    // define aesthetic mappings
    const x = (d) => d[xName]
    const y = (d) => d[yName]

    // width
    const chartWidth = d3.select(chartTarget).node().getBoundingClientRect().width
    if (isMobile) {
      marginLeft = 80
      marginRight = 50
    }

    // ranges
    const xRange = [marginLeft, chartWidth - marginRight] // [left, right]
    const yRange = [chartHeight - marginBottom, marginTop] // [bottom, top]

    // values
    const X = d3.map(data, x)
    const Y = d3.map(data, y)
    const I = d3.range(data.length)

    // domains
    const yMin = d3.min(Y)
    const yMax = d3.max(Y)
    const xMin = new Date(d3.min(X))
    const xMax = new Date(d3.max(X))
    xMin.setMonth(xMin.getMonth() - 3)
    xMax.setMonth(xMax.getMonth() + 3)
    const xDomain = [xMin, xMax]
    const yDomain = [yMin < 1 ? yMin : 1, yMax > 1 ? (d3.max(Y) + d3.max(Y) * rangeMult) : 1]

    // scale
    const xScale = xScaleType(xDomain, xRange)
    const yScale = yScaleType(yDomain, yRange)

    // time axes formatter
    // For a less crowded x axis, especially if we increase fontsize for labels
    const tickInterval = d3.timeMonth.every(12)

    // voronoi generator
    const dataForVoronoi = d3.map(I, (i) => [xScale(X[i]), yScale(Y[i])])
    const voronoiRange = [xRange[0], yRange[1], xRange[1], yRange[0]]
    const voronoi = d3.Delaunay.from(dataForVoronoi).voronoi(voronoiRange)

    // generate tooltip
    d3
      .select('body')
      .append('div')
      .attr('id', 'scatter-tooltip' + key)
      .style('position', 'absolute')

    // initiate svg
    const svg = d3
      .select(chartTarget)
      .append('svg')
      .attr('viewBox', [0, 0, chartWidth, chartHeight])
      .attr('id', 'svgscatter' + key)
      .attr('style', 'max-width: 100%')

    // tooltip vlines
    svg
      .append('g')
      .selectAll('line')
      .data(data)
      .join('line')
      .attr('x1', (i) => xScale(x(i)))
      .attr('y1', (i) => yScale(y(i)) + circleSize)
      .attr('x2', (i) => xScale(x(i)))
      .attr('y2', yScale(1))
      .attr('id', (i) => i.id)
      .style('visibility', 'hidden')
      .style('stroke', tooltipLineColor)
      .style('stroke-width', horizontalLineStrokeSize)
      .style('stroke-dasharray', tooltipLineStrokeTexture)

    // tooltip vline text
    svg
      .append('g')
      .selectAll('text')
      .data(data)
      .join('text')
      .attr('x', (i) => xScale(x(i)) + tooltipLineTextBorder)
      .attr('y', yScale(1) - tooltipLineTextBorder)
      .attr('id', (i) => i.id)
      .style('visibility', 'hidden')
      .style('font-size', `${smallLabelSize}px`)
      .style('font-family', fontType)
      .text((i) => d3.utcFormat('%B %Y')(x(i)))

    // tooltip hlines
    svg
      .append('g')
      .selectAll('line')
      .data(data)
      .join('line')
      .attr('x1', (i) => xScale(x(i)) - circleSize)
      .attr('y1', (i) => yScale(y(i)))
      .attr('x2', xScale(d3.min(X)))
      .attr('y2', (i) => yScale(y(i)))
      .attr('id', (i) => i.id)
      .style('visibility', 'hidden')
      .style('stroke', tooltipLineColor)
      .style('stroke-width', horizontalLineStrokeSize)
      .style('stroke-dasharray', tooltipLineStrokeTexture)

    // tooltip hline text
    svg
      .append('g')
      .selectAll('text')
      .data(data)
      .join('text')
      .attr('x', xScale(d3.min(X)) + tooltipLineTextBorder)
      .attr('y', (i) => yScale(y(i)) - tooltipLineTextBorder)
      .attr('id', (i) => i.id)
      .style('visibility', 'hidden')
      .style('font-size', `${smallLabelSize}px`)
      .style('font-family', fontType)
      .text((i) => d3.format('.2s')(y(i)))

    if (isSameDate) {
      barplot(
        data,
        isl,
        ala,
        xRange,
        [chartHeight - marginBottom / 2, marginTop],
        Y,
        marginLeft,
        marginTop,
        yAxisText,
        svg
      )
    } else {
      scatterplot(
        data,
        isl,
        alv,
        ala,
        yName, // the y column
        xName, // the x column
        marginLeft,
        marginRight, // right margin, in pixels
        xlabelDistance,
        I,
        voronoi,
        xRange,
        xScale,
        x,
        yScale,
        y,
        maxIDs,
        maxData,
        tooltipLineColor,
        tooltipLineStrokeTexture,
        horizontalLineStrokeSize,
        tickInterval,
        marginTop,
        marginBottom,
        chartHeight,
        chartWidth,
        xLabelShift,
        xAxisText,
        yAxisText,
        svg
      )
    }
  }, [barplot, scatterplot, metricName, key, quickSort])

  React.useEffect(() => {
    const scroll = window.scrollY
    isMobile = window.outerWidth < breakpoint
    d3.select(chartRef.current).select(svgId).remove()
    d3.select(chartRef.current).select(toolTipId).remove()
    d3.select(legendColorRef.current).selectAll('#' + svgLegendId).remove()
    plot(d, isScaleLinear, areLabelsVisible, areLabelsArxiv, metricName)
    legend()
    if (areLabelsVisible) {
      [...document.getElementsByClassName(labelClass)].forEach((el) => {
        el.style.visibility = 'visible'
      })
    } else {
      [...document.getElementsByClassName(labelClass)].forEach((el) => {
        el.style.visibility = 'hidden'
      })
    }
    window.scrollTo(0, scroll)
  }, [plot, legend, d, isScaleLinear, metricName, areLabelsVisible, areLabelsArxiv, key, svgId, toolTipId, svgLegendId, labelClass])

  React.useEffect(() => {
    // Draw scatterplot from data
    const taskRoute = config.api.getUriPrefix() + '/task/' + props.taskId
    axios.get(taskRoute)
      .then(res => {
        const task = res.data.data
        setTaskName(task.fullName)
        task.childTasks.sort(sortByCounts)
        if (props.onLoadData) {
          props.onLoadData(task)
        }

        // Count data per metric name
        const results = task.results
        const mNames = []
        const metricNameCounts = []
        for (let i = 0; i < results.length; ++i) {
          if (results[i].submissionUrl.toLowerCase().startsWith('https://arxiv.org/')) {
            const parts = results[i].submissionUrl.split('/')
            results[i].arXiv = (parts[parts.length - 1] === '') ? parts[parts.length - 2] : parts[parts.length - 1]
          } else {
            results[i].arXiv = null
          }

          if (mNames.includes(results[i].metricName)) {
            ++metricNameCounts[mNames.indexOf(results[i].metricName)]
          } else {
            mNames.push(results[i].metricName)
            metricNameCounts.push(1)
          }
        }

        // Filter metric names with low counts of results
        const mNamesFiltered = []
        const metricNameCountsFiltered = []
        for (let i = 0; i < metricNameCounts.length; ++i) {
          if (metricNameCounts[i] > 2) {
            mNamesFiltered.push(mNames[i])
            metricNameCountsFiltered.push(metricNameCounts[i])
          }
        }
        if (!mNamesFiltered.length) {
          // Chart doesn't have enough data to display at all
          setIsHide(true)
          return
        }

        // Pick the default metric to display
        let metric = mNamesFiltered[0]
        if (!mNamesFiltered.includes(metric)) {
          let maxCount = metricNameCountsFiltered[0]
          let maxCountIndex = 0
          for (let i = 1; i < mNamesFiltered.length; ++i) {
            if (metricNameCountsFiltered[i] > maxCount) {
              maxCountIndex = i
              maxCount = metricNameCountsFiltered[i]
            }
          }
          metric = mNamesFiltered[maxCountIndex]
        }

        setMetricNames(mNamesFiltered)
        if (!metricName) {
          setMetricName(metric)
        }

        // Map data to schema
        const data = results
          .map((_d) => ({
            key: +_d.id,
            submissionId: +_d.submissionId,
            platformName: _d.platformName,
            methodName: _d.methodName,
            metricName: _d.metricName,
            metricValue: _d.metricValue,
            qubitCount: _d.qubitCount ? +_d.qubitCount : '',
            circuitDepth: _d.circuitDepth ? +_d.circuitDepth : '',
            provider: _d.providerName ? _d.providerName.toLowerCase() : 'Other',
            tableDate: parseDate(!_d.evaluatedAt ? _d.createdAt.split('T')[0] : _d.evaluatedAt),
            dayIndexInEpoch: dayIndexInEpoch(!_d.evaluatedAt ? _d.createdAt.split('T')[0] : _d.evaluatedAt),
            arXiv: _d.arXiv
          }))

        // Filter same as with metric names
        const dataFiltered = []
        for (let i = 0; i < data.length; ++i) {
          if (mNamesFiltered.includes(data[i].metricName)) {
            dataFiltered.push(data[i])
          }
        }

        setD(dataFiltered)
      })
      .catch(err => {
        console.log(err)
      })
      // eslint-disable-next-line
  }, [props.taskId])

  React.useEffect(() => {
    return () => {
      // On cleanup, hide the tooltip!
      d3.select(toolTipId).style('visibility', 'hidden')
    }
  }, [toolTipId])

  return (
    <span>
      <div className='row'>
        <div className='col text-start'>
          <h4 align='left'>{props.isPreview ? <Link to={'/Task/' + props.taskId}>{taskName}</Link> : taskName}</h4>
        </div>
      </div>
      {!isHide &&
        <div id='cargo'>
          <div id={chartId} ref={chartRef} />
          <div id={legendId} ref={legendRef} style={{ textAlign: 'justify' }}>
            <div>
              {!props.isQubits &&
                <span>
                  <div id='legend-switch'>
                    <label className='switch'>
                      <input id='labelSwitch' type='checkbox' onClick={onLabelSwitchClick} checked={areLabelsVisible} />
                      <span className='slider round' />
                    </label>
                    <span className='switchLabel'>Show labels</span>
                  </div>
                  <div id='legend-switch'>
                    <label className='switch'>
                      <input id='arXivSwitch' type='checkbox' onClick={onArxivSwitchClick} />
                      <span className='slider round' />
                    </label>
                    <span className='switchLabel'>Labels | ID</span>
                  </div>
                </span>}
              <div id='legend-switch'>
                <label className='switch'>
                  <input id='isScaleLinearSwitch' type='checkbox' onClick={onScaleSwitchClick} />
                  <span className='slider round' />
                </label>
                <span className='switchLabel'>{parseInt(props.taskId) !== 34 ? 'Linear | Log' : 'Log | Linear'}</span>
              </div>
              <div id='legend-switch'>
                <label className='switch' style={{ width: '50%' }}>
                  <select id='metricSelect' style={{ width: '100%' }} onChange={onMetricSelectChange} value={metricName}>
                    {metricNames.map((option, index) => <option key={index} value={option}>{option}</option>)}
                  </select>
                </label>
                <span className='switchLabel' style={{ width: '50%' }}> Metric</span>
              </div>
            </div>
            <div>
              <span className='legendTitle'>{props.isQubits ? 'Qubits' : 'Providers'}</span>
              <div id={legendColorId} ref={legendColorRef} />
            </div>
            <div>
              <div id='legend-stroke'>
                <button id='downloadButton' className='mybutton' onClick={onDownloadClick}>Download chart</button>
              </div>
            </div>
          </div>
        </div>}
    </span>
  )
}

export default QuantumVolumeChart
