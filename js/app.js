'use strict';

const CRYPTOCOMPARE_ENDPOINT = 'https://min-api.cryptocompare.com/data/';

let STORE = {};

function handleModal() {
	$('.js-about').click(function(event) {
		$('.modal').addClass('is-active');
	});

	$('.delete').click(function(event) {
		$('.modal').removeClass('is-active');
	});
}

function handleCoinSelection() {
	$('#coin').on('change', function(event) {
		const fsym = $('#coin option:selected').val();
		const tsym = 'USD';
		// 1D = 5 minutes, 1W = 15 minutes | 1M = 2 hours, 3M = 4 hours, 6M = 6 hrs | 1Y, ALL = daily
	});
}

function renderChart() {
	$.getJSON('https://www.highcharts.com/samples/data/aapl-c.json', function(
		data
	) {
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
	});
}

function handleApp() {
	handleModal();
	handleCoinSelection();
	renderChart();
}

$(handleApp);
