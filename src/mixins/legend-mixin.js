import d3 from "d3"
import { override } from "../../src/core/core"

const PERCENTAGE = 100.0
const LOWER_THAN_START_RANGE = 1000

function defaultFormatter(value) {
  const commafy = d3.format(",")
  let formattedValue = parseFloat(value).toFixed(2)
  if (value >= LOWER_THAN_START_RANGE) {
    formattedValue = Math.round(value)
  }

  return commafy(formattedValue)
}

// Finds the name of the color measure, so we can use it when finding the format of the color legend
function getColorMeasureName(chart) {
  const groups = chart.group()
  if (!(groups && groups.reduce)) {
    return null
  }
  const measures = chart.group().reduce()
  if (!Array.isArray(measures)) {
    return null
  }

  const colorMeasure = measures.filter(x => x.name === "color")
  // This function should always return either a string or null, never "undefined", since an
  // "undefined" key to the valueFormatter sends us down a weird code path.
  return colorMeasure.length > 0 &&
    typeof colorMeasure[0].measureName !== "undefined"
    ? colorMeasure[0].measureName
    : null
}

export default function legendMixin(chart) {
  chart.legendablesContinuous = function() {
    const legends = []
    const colorDomain = chart.colors().domain()

    const colorDomainSize = colorDomain[1] - colorDomain[0]
    const colorRange = chart.colors().range()
    const numColors = colorRange.length
    const colorMeasureName = getColorMeasureName(chart)

    for (let c = 0; c < numColors; c++) {
      let startRange = (c / (numColors - 1)) * colorDomainSize + colorDomain[0]
      if (chart.isTargeting()) {
        startRange = "%" + (parseFloat(startRange) * PERCENTAGE).toFixed(2)
      } else if (chart.colorByExpr() === "count(*)") {
        startRange = parseInt(startRange) // eslint-disable-line radix
      } else {
        startRange = parseFloat(startRange)
      }

      let color = null

      if (colorDomainSize === 0) {
        color = colorRange[Math.floor(numColors / 2)]
      } else {
        color = colorRange[c]
      }

      const valueFormatter = chart.valueFormatter()
      let value = startRange
      if (!isNaN(value)) {
        value =
          (valueFormatter && valueFormatter(value, colorMeasureName)) ||
          defaultFormatter(value)
      }

      legends.push({
        color,
        value
      })
    }

    return legends
  }

  const legend_events = ["clearCustomContLegend", "setCustomContLegend"]

  const legend_listeners = d3.dispatch(...legend_events)

  override(chart, "on", (event, listener) => {
    const NON_INDEX = -1
    if (legend_events.indexOf(event) === NON_INDEX) {
      chart._on(event, listener)
    } else {
      legend_listeners.on(event, listener)
    }

    return chart
  })

  chart._invokeClearCustomContLegendListener = function() {
    legend_listeners.clearCustomContLegend(chart)
  }

  chart._invokeSetCustomContLegendListener = function(f) {
    legend_listeners.setCustomContLegend(chart, f)
  }

  return chart
}
