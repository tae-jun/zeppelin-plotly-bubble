import Visualization from 'zeppelin-vis'
import ColumnselectorTransformation from 'zeppelin-tabledata/columnselector'


export default class PlotlyBubble extends Visualization {
  constructor(targetEl, config) {
    super(targetEl, config)

    // A promise which loads plotly script from CDN.
    this.plotlyPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.onload = resolve
      script.src = 'https://cdn.plot.ly/plotly-1.30.0.min.js'
      document.head.appendChild(script)
    })

    this.props = [
      { name: 'xAxis' },
      { name: 'yAxis' },
      { name: 'zAxis' },
      { name: 'category' },
    ]

    this.transformation = new ColumnselectorTransformation(config, this.props)
  }

  render(tableData) {
    const conf = this.config

    /** can be rendered when all axises are defined */
    if (!conf.xAxis || !conf.yAxis || !conf.zAxis || !conf.category) {
      this.hideChart()
      return
    }

    const groups = tableData.rows.map((row) => { return row[conf.category.index].trim() })
    const groupedIndices = _.groupBy(_.range(groups.length), (i) => { return groups[i] })

    const excludeIdxs = [conf.xAxis.index, conf.yAxis.index, conf.zAxis.index, conf.category.index]
    const otherIdxs = tableData.columns
      .filter((_, i) => !excludeIdxs.includes(i))
      .map(value => value.index)

    const traces = _.map(groupedIndices, (indices, group) => {
      const rows = _.values(_.pick(tableData.rows, indices))

      const x = rows.map(row => parseFloat(row[conf.xAxis.index]))
      const y = rows.map(row => parseFloat(row[conf.yAxis.index]))
      const z = rows.map(row => parseFloat(row[conf.zAxis.index]))

      const text = rows
        .map(row => _.pick(row, otherIdxs))
        .map(row => _.map(row, (value, key) => `${tableData.columns[key].name.trim()}: ${value.trim()}`)
          .reduce((a, b) => a + '<br />' + b))

      return {
        x, y,
        mode: 'markers',
        name: group,
        text: text,
        marker: {
          size: z
        }
      }
    })

    this.plotlyPromise.then(() => {
      const layout = {
        // title: 'Marker Size',
        hovermode: 'closest',
        margin: { t: 0 },
      }

      Plotly.newPlot(this.getTargetElement(), traces, layout, { showLink: false, displayModeBar: false });
    })
  }

  hideChart() {
    this.getTargetElement().innerHTML = `
        <div style="margin-top: 60px; text-align: center; font-weight: 100">
            <span style="font-size:30px;">
                Please set axes in
            </span>
            <span style="font-size: 30px; font-style:italic;">
                Settings
            </span>
        </div>`
  }

  getTargetElement() {
    return this.targetEl[0]
  }

  getTransformation() {
    return this.transformation
  }
}
