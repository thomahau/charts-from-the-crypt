'use strict';

const CRYPTOCOMPARE_ENDPOINT = 'https://min-api.cryptocompare.com/data/';
const APP_NAME = 'charts_from_the_crypt';

const STORE = {
	fsym: '',
	// Hardcoded for now
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
		STORE.fsym = $('#coin option:selected').val();
		fetchPriceData();
	});
}

function renderChart(data) {
	$('.welcome-message').remove();
	console.log(data);
	// $('#chart-container').html(data);

	// $.getJSON('https://www.highcharts.com/samples/data/aapl-c.json', function(
	// 	data
	// ) {
	// Create the chart
	Highcharts.stockChart('chart-container', {
		navigator: {
			enabled: false
		},

		scrollbar: {
			enabled: false
		},

		rangeSelector: {
			selected: 1
		},

		title: {
			text: 'AAPL Stock Price'
		},

		series: [
			{
				name: 'AAPL',
				data: data,
				tooltip: {
					valueDecimals: 2
				}
			}
		]
	});
	// });
}

function handleApp() {
	handleModal();
	handleCoinSelection();
	// handleCurrencySelection();
	// handleRangeSelection();
	// renderChart();
}

$(handleApp);
