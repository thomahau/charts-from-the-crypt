const margin = { left: 200, right: 50, top: 50, bottom: 100 };
const height = 500 - margin.top - margin.bottom;
const width = 1300 - margin.left - margin.right;

const svg = d3
  .select('#js-chart-container')
  .append('svg')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom);
const g = svg.append('g').attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');

const t = function() {
  return d3.transition().duration(1000);
};

const parseTime = d3.timeParse('%d/%m/%Y');
const formatTime = d3.timeFormat('%d/%m/%Y');
const bisectDate = d3.bisector(function(d) {
  return d.time;
}).left;

// Add the line for the first time
g.append('path')
  .attr('class', 'line')
  .attr('fill', 'none')
  .attr('stroke', 'yellow')
  .attr('stroke-width', '3px');

// Labels
const xLabel = g
  .append('text')
  .attr('class', 'x axisLabel')
  .attr('y', height + 50)
  .attr('x', width / 2)
  .attr('font-size', '20px')
  .attr('text-anchor', 'middle')
  .attr('fill', 'white')
  .text('Time');
const yLabel = g
  .append('text')
  .attr('class', 'y axisLabel')
  .attr('transform', 'rotate(-90)')
  .attr('y', -60)
  .attr('x', -170)
  .attr('font-size', '20px')
  .attr('text-anchor', 'middle')
  .attr('fill', 'white')
  .text('Price (USD)');

// Scales
const x = d3.scaleTime().range([0, width]);
const y = d3.scaleLinear().range([height, 0]);

// X-axis
const xAxisCall = d3.axisBottom().ticks(4);
const xAxis = g
  .append('g')
  .attr('class', 'x axis')
  .attr('transform', 'translate(0,' + height + ')');

// Y-axis
const yAxisCall = d3.axisLeft();
const yAxis = g.append('g').attr('class', 'y axis');

// Event listeners
// $("#coin-select").on("change", update)
// $("#var-select").on("change", update)

// Add jQuery UI slider
// $("#date-slider").slider({
//     range: true,
//     max: parseTime("31/10/2017").getTime(),
//     min: parseTime("12/5/2013").getTime(),
//     step: 86400000, // One day
//     values: [parseTime("12/5/2013").getTime(), parseTime("31/10/2017").getTime()],
//     slide: function(event, ui){
//         $("#dateLabel1").text(formatTime(new Date(ui.values[0])));
//         $("#dateLabel2").text(formatTime(new Date(ui.values[1])));
//         update();
//     }
// });

function handleData(rawData) {
  if (rawData.Response === 'Error') {
    showErr(rawData.Message);
  } else {
    const data = rawData['Data'].map(dataPoint => {
      return { time: dataPoint.time, price: dataPoint.close };
    });
    // const latestPrice = data[data.length - 1][1];

    // let chartOptions = getBaseChartOptions(latestPrice);
    // chartOptions = addRangeChartOptions(chartOptions);

    $('.welcome-message, .error-message').remove();
    $('#js-chart-container').prop('hidden', false);

    if (!$('.js-help-btn').length) {
      renderBannerHelpButton();
    }
    // Run the visualization for the first time
    update(data);
  }
}

function update(data) {
  console.log(data);
  // Update scales
  x.domain(
    d3.extent(data, function(d) {
      return d.time;
    })
  );
  y.domain([
    d3.min(data, function(d) {
      return d.price; // return d[yValue];
    }) / 1.005,
    d3.max(data, function(d) {
      return d.price; // return d[yValue];
    }) * 1.005
  ]);

  // Fix for format values
  const formatSi = d3.format('.2s');
  function formatAbbreviation(x) {
    const s = formatSi(x);
    switch (s[s.length - 1]) {
      case 'G':
        return s.slice(0, -1) + 'B';
      case 'k':
        return s.slice(0, -1) + 'K';
    }
    return s;
  }

  // Update axes
  xAxisCall.scale(x);
  xAxis.transition(t()).call(xAxisCall);
  yAxisCall.scale(y);
  yAxis.transition(t()).call(yAxisCall.tickFormat(formatAbbreviation)); // formatAbbreviation

  // Clear old tooltips
  d3.select('.focus').remove();
  d3.select('.overlay').remove();

  // Tooltip code
  //   const focus = g
  //     .append('g')
  //     .attr('class', 'focus')
  //     .style('display', 'none');
  //   focus
  //     .append('line')
  //     .attr('class', 'x-hover-line hover-line')
  //     .attr('y1', 0)
  //     .attr('y2', height);
  //   focus
  //     .append('line')
  //     .attr('class', 'y-hover-line hover-line')
  //     .attr('x1', 0)
  //     .attr('x2', width);
  //   focus.append('circle').attr('r', 5);
  //   focus
  //     .append('text')
  //     .attr('x', 15)
  //     .attr('dy', '.31em');
  //   svg
  //     .append('rect')
  //     .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
  //     .attr('class', 'overlay')
  //     .attr('width', width)
  //     .attr('height', height)
  //     .on('mouseover', function() {
  //       focus.style('display', null);
  //     })
  //     .on('mouseout', function() {
  //       focus.style('display', 'none');
  //     })
  //     .on('mousemove', mousemove);

  //   function mousemove() {
  //     const x0 = x.invert(d3.mouse(this)[0]);
  //     const i = bisectDate(data, x0, 1);
  //     const d0 = data[i - 1];
  //     const d1 = data[i];
  //     const d = d1 && d0 ? (x0 - d0.time > d1.time - x0 ? d1 : d0) : 0;

  //     focus.attr('transform', 'translate(' + x(d.time) + ',' + y(d['price']) + ')');
  //     focus.select('text').text(function() {
  //       return d3.format('$,')(d['price'].toFixed(2));
  //     });
  //     focus.select('.x-hover-line').attr('y2', height - y(d['price']));
  //     focus.select('.y-hover-line').attr('x2', -x(d.time));
  //   }

  // Path generator
  line = d3
    .line()
    .x(function(d) {
      return x(d.time);
    })
    .y(function(d) {
      return y(d['price']);
    });

  // Update our line path
  g.select('.line')
    .transition(t)
    .attr('d', line(data));

  // Update y-axis label
  //   const newText =
  //     yValue == 'price_usd'
  //       ? 'Price (USD)'
  //       : yValue == 'market_cap'
  //         ? 'Market Capitalization (USD)'
  //         : '24 Hour Trading Volume (USD)';
  //   yLabel.text(newText);
}
