'use strict';

const CRYPTOCOMPARE_ENDPOINT = 'https://min-api.cryptocompare.com/data/';
const APP_NAME = 'charts_from_the_crypt';

const STORE = {
	coin: '',
	fsym: '',
	// Hardcoded for now
	currency: '$',
	tsym: 'USD',
	// Hardcoded for now
	range: 'all'
};

function handleModal() {
	$('.js-about').click(function(event) {
		$('.modal').addClass('is-active');
	});

	$('.delete').click(function(event) {
		$('.modal').removeClass('is-active');
	});
}

function fetchPriceData() {
	// 1D = 5 minutes, 1W = 15 minutes | 1M = 2 hours, 3M = 4 hours, 6M = 6 hrs | 1Y, ALL = daily
	// Hardcoded allData for now
	const url = `${CRYPTOCOMPARE_ENDPOINT}histoday?fsym=${STORE.fsym}&tsym=${
		STORE.tsym
	}&allData=true&extraParams=${APP_NAME}`;

	$.getJSON(url, renderChart);
	// .fail(showErr)
}

function handleCoinSelection() {
	$('#coin').on('change', function(event) {
		STORE.coin = $('#coin option:selected').text();
		STORE.fsym = $('#coin option:selected').val();
		fetchPriceData();
	});
}

function renderChart(rawData) {
	// console.log(rawData);

	const data = rawData['Data'].map(item => {
		return [item.time * 1000, item.close];
	});
	const latestPrice = data[data.length - 1][1];

	$('.welcome-message').remove();
	$('#chart-container').prop('hidden', false);

	let chart = Highcharts.stockChart('chart-container', {
		navigator: {
			enabled: false
		},

		scrollbar: {
			enabled: false
		},

		rangeSelector: {
			enabled: false
		},

		xAxis: {
			type: 'datetime',
			labels: {
				format: '{value:%b %Y}'
			}
		},

		yAxis: {
			crosshair: true
		},

		title: {
			text: STORE.coin
		},

		subtitle: {
			text: `${STORE.currency}${latestPrice}`
		},

		tooltip: {
			split: false,
			headerFormat:
				'<span style="font-size: 10px">{point.x:%b %d, %Y}</span><br/>',
			pointFormat:
				'<span style="color:{point.color}">\u25CF</span> {series.name}: <b>{point.y}</b><br/>',
			valueDecimals: 2
		}

		// plotOptions: {
		// 	series: {
		// 		turboThreshold: 0
		// 	}
		// },

		// legend: {
		// 	verticalAlign: top,
		// 	y: 50
		// }
	});

	let series = {
		name: `Price (${STORE.tsym})`,
		data: data
	};

	chart.addSeries(series);
}

function handleApp() {
	handleModal();
	handleCoinSelection();
	// handleCurrencySelection();
	// handleRangeSelection();
	// renderChart();
}

$(handleApp);
