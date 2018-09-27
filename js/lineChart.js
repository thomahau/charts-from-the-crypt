const parseTime = d3.timeParse('%d/%m/%Y');
const formatTime = d3.timeFormat('%a, %b %d, %Y');

LineChart = function(_parentElement) {
  this.parentElement = _parentElement;

  this.initVis();
};

LineChart.prototype.initVis = function() {
  let vis = this;

  vis.margin = { left: 200, right: 100, top: 100, bottom: 100 };
  vis.height = 550 - vis.margin.top - vis.margin.bottom;
  vis.width = 1300 - vis.margin.left - vis.margin.right;

  vis.svg = d3
    .select(vis.parentElement)
    .append('svg')
    .attr('width', vis.width + vis.margin.left + vis.margin.right)
    .attr('height', vis.height + vis.margin.top + vis.margin.bottom);
  vis.g = vis.svg
    .append('g')
    .attr('transform', 'translate(' + vis.margin.left + ', ' + vis.margin.top + ')');

  vis.t = () => d3.transition().duration(1000);

  vis.bisectDate = d3.bisector(d => d.time).left;

  // Add the line for the first time
  vis.linePath = vis.g
    .append('path')
    .attr('class', 'line')
    .attr('fill', 'none')
    .attr('stroke', 'yellow')
    .attr('stroke-width', '2px');

  // Labels
  vis.g
    .append('text')
    .attr('class', 'x axisLabel')
    .attr('y', vis.height + 50)
    .attr('x', vis.width / 2)
    .attr('font-size', '20px')
    .attr('text-anchor', 'middle')
    .attr('fill', 'white')
    .text('Time');
  vis.yLabel = vis.g
    .append('text')
    .attr('class', 'y axisLabel')
    .attr('transform', 'rotate(-90)')
    .attr('y', -60)
    .attr('x', -170)
    .attr('font-size', '20px')
    .attr('text-anchor', 'middle')
    .attr('fill', 'white')
    .text(`Price (${STORE.tsym})`);

  // Scales
  vis.x = d3.scaleTime().range([0, vis.width]);

  // X-axis
  vis.xAxisCall = d3
    .axisBottom()
    .tickFormat(parseTime())
    .ticks(6);
  vis.xAxis = vis.g
    .append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,' + vis.height + ')');

  // Y-axis
  vis.yAxisCall = d3.axisLeft();
  vis.yAxis = vis.g.append('g').attr('class', 'y axis');

  vis.wrangleData();
};

LineChart.prototype.wrangleData = function() {
  let vis = this;

  vis.data = priceData.map(dataPoint => {
    return { time: dataPoint.time * 1000, price: dataPoint.close };
  });
  // const latestPrice = data[data.length - 1][1];
  vis.updateVis();
};

LineChart.prototype.updateVis = function() {
  let vis = this;

  // Update scales
  STORE.scale === 'logarithmic'
    ? (vis.y = d3.scaleLog().range([vis.height, 0]))
    : (vis.y = d3.scaleLinear().range([vis.height, 0]));
  vis.x.domain(d3.extent(vis.data, d => d.time));
  vis.y.domain([d3.min(vis.data, d => d.price) / 1.005, d3.max(vis.data, d => d.price) * 1.005]);

  // Fix for format values
  function formatAbbreviation(x) {
    const formatter = d3.formatLocale({
      decimal: '.',
      thousands: ',',
      grouping: [3],
      currency: STORE.currency === 'BTC' ? ['', STORE.currency] : [STORE.currency, '']
    });

    return formatter.format('$,')(x.toFixed(2));
  }

  // Update axes
  vis.xAxisCall.scale(vis.x);
  vis.xAxis.transition(vis.t()).call(vis.xAxisCall);
  vis.yAxisCall.scale(vis.y);
  vis.yAxis.transition(vis.t()).call(vis.yAxisCall.tickFormat(formatAbbreviation));

  // Clear old tooltips
  d3.select('.focus').remove();
  d3.select('.overlay').remove();

  // Tooltip code
  const focus = vis.g
    .append('g')
    .attr('class', 'focus')
    .style('display', 'none');
  focus
    .append('rect')
    .attr('width', 130)
    .attr('height', 50)
    .attr('x', -60)
    .attr('y', -78)
    .attr('fill', '#888')
    .attr('fill-opacity', 0.7);
  focus
    .append('line')
    .attr('class', 'x-hover-line hover-line')
    .attr('stroke', 'white')
    .style('stroke-dasharray', '3,3')
    .attr('y1', 0)
    .attr('y2', vis.height);
  focus
    .append('line')
    .attr('class', 'y-hover-line hover-line')
    .attr('stroke', 'white')
    .style('stroke-dasharray', '3,3')
    .attr('x1', 0)
    .attr('x2', vis.width);
  focus
    .append('circle')
    .attr('r', 5)
    .attr('stroke', 'black')
    .attr('fill', 'yellow');
  focus
    .append('text')
    .attr('class', 'date')
    .attr('x', -50)
    .attr('y', -60)
    .style('fill', 'white')
    .style('font-size', '0.8rem')
    .style('font-weight', 'bold');
  focus
    .append('text')
    .attr('class', 'price')
    .attr('x', -50)
    .attr('y', -35)
    .style('fill', 'white')
    .style('font-size', '0.8rem')
    .style('font-weight', 'bold');
  vis.svg
    .append('rect')
    .attr('transform', 'translate(' + vis.margin.left + ',' + vis.margin.top + ')')
    .attr('class', 'overlay')
    .attr('width', vis.width)
    .attr('height', vis.height)
    .style('fill', 'none')
    .style('pointer-events', 'all')
    .on('mouseover', () => focus.style('display', null))
    .on('mouseout', () => focus.style('display', 'none'))
    .on('mousemove', mousemove);

  function mousemove() {
    const x0 = vis.x.invert(d3.mouse(this)[0]).getTime();
    const i = vis.bisectDate(vis.data, x0, 1);
    const d0 = vis.data[i - 1];
    const d1 = vis.data[i];
    const d = d1 && d0 ? (x0 - d0.time > d1.time - x0 ? d1 : d0) : 0;

    focus.attr('transform', 'translate(' + vis.x(d.time) + ',' + vis.y(d.price) + ')');
    focus.select('text.date').text(() => formatTime(new Date(d.time)));
    focus.select('text.price').text(() => formatAbbreviation(d.price));
    focus.select('.x-hover-line').attr('y2', vis.height - vis.y(d.price));
    focus.select('.y-hover-line').attr('x2', -vis.x(d.time));
  }

  // Path generator
  line = d3
    .line()
    .x(d => vis.x(d.time))
    .y(d => vis.y(d.price));

  // Update our line path
  vis.g
    .select('.line')
    .transition(vis.t)
    .attr('d', line(vis.data));

  // Update y-axis label
  vis.yLabel.text(`Price (${STORE.tsym})`);
};
