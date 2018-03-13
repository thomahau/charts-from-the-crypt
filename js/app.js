'use strict';

const CRYPTOCOMPARE_ENDPOINT = 'https://min-api.cryptocompare.com/data/';
const APP_NAME = 'charts_from_the_crypt';

const STORE = {
	coin: '',
	fsym: '',
	// Default starting values
	currency: '$',
	tsym: 'USD',
	range: 'ALL'
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
	const now = Math.round(new Date().getTime() / 1000);
	let url = CRYPTOCOMPARE_ENDPOINT;

	if (STORE.range === '1D') {
		// 24 hrs * 60 mins / 5 min aggregation = 288 data points
		url += `histominute?fsym=${STORE.fsym}&tsym=${
			STORE.tsym
		}&limit=288&aggregate=5&toTs=${now}&extraParams=${APP_NAME}`;
	} else if (STORE.range === '1W') {
		// 7 days * 24 hrs = 168 data points
		url += `histohour?fsym=${STORE.fsym}&tsym=${
			STORE.tsym
		}&limit=168&toTs=${now}&extraParams=${APP_NAME}`;
	} else if (STORE.range === '1M') {
		// 30 days * 24 hrs = 720 data points
		url += `histohour?fsym=${STORE.fsym}&tsym=${
			STORE.tsym
		}&limit=720&toTs=${now}&extraParams=${APP_NAME}`;
	} else if (STORE.range === '3M') {
		// 3 months * 30 days * 24 hrs / 3 hr aggregation = 720 data points
		url += `histohour?fsym=${STORE.fsym}&tsym=${
			STORE.tsym
		}&limit=720&aggregate=3&toTs=${now}&extraParams=${APP_NAME}`;
	} else if (STORE.range === '6M') {
		// 6 months * 30 days * 24 hrs / 6 hr aggregation = 720 data points
		url += `histohour?fsym=${STORE.fsym}&tsym=${
			STORE.tsym
		}&limit=720&aggregate=6&toTs=${now}&extraParams=${APP_NAME}`;
	} else if (STORE.range === '1Y') {
		// 365 days = 365 data points
		url += `histoday?fsym=${STORE.fsym}&tsym=${
			STORE.tsym
		}&limit=365&toTs=${now}&extraParams=${APP_NAME}`;
	} else if (STORE.range === 'ALL') {
		// all data points
		url += `histoday?fsym=${STORE.fsym}&tsym=${
			STORE.tsym
		}&allData=true&extraParams=${APP_NAME}`;
	}

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

function handleRangeSelection() {
	$('.js-range-btn').click(function(event) {
		if (!$(this).hasClass('is-active')) {
			$('.js-range-btn.is-active').removeClass('is-warning is-active');
			$(this).addClass('is-warning is-active');
			STORE.range = $(this).text();

			if (!$('#coin option:selected').attr('disabled')) {
				fetchPriceData();
			}
		}
	});
}

function handleCurrencySelection() {
	$('.js-currency-btn').click(function(event) {
		if (!$(this).hasClass('is-active')) {
			$('.js-currency-btn.is-active').removeClass('is-warning is-active');
			$(this).addClass('is-warning is-active');
			const iconName = $(this)
				.find('svg')
				.attr('data-icon');
			setCurrency(iconName);

			if (!$('#coin option:selected').attr('disabled')) {
				fetchPriceData();
			}
		}
	});
}

function setCurrency(iconName) {
	if (iconName === 'dollar-sign') {
		STORE.currency = '$';
		STORE.tsym = 'USD';
	} else if (iconName === 'euro-sign') {
		STORE.currency = '€';
		STORE.tsym = 'EUR';
	} else if (iconName === 'btc') {
		STORE.currency = 'BTC';
		STORE.tsym = 'BTC';
	}
}

function getBaseChartOptions() {
	let chartOptions = {
		chart: {
			renderTo: 'js-chart-container'
		},
		navigator: {
			enabled: false
		},
		scrollbar: {
			enabled: false
		},
		rangeSelector: {
			enabled: false
		},
		title: {
			text: ''
		},
		subtitle: {
			text: ''
		},
		xAxis: {
			type: 'datetime',
			labels: {}
		},
		yAxis: {
			// TODO: type: {} linear or logarithmic
			crosshair: true,
			labels: {
				format: `${STORE.currency}{value}`
			},
			offset: 50,
			gridLineWidth: 2
		},
		time: {
			useUTC: true
		},
		tooltip: {
			split: false,
			headerFormat: '',
			pointFormat:
				'<span style="color:{point.color}">\u25CF</span> {series.name}: <b>{point.y}</b><br/>',
			// TODO: customize decimals
			valueDecimals: 2
		}
	};

	return chartOptions;
}

function customizeChartOptions(chartOptions, latestPrice) {
	let xAxisLabelFormat = '{value:%d. %b}';
	let tooltipHeaderFormat =
		'<span style="font-size: 10px">{point.x:%A, %b %d, %Y, %k:%M}</span><br/>';

	if (STORE.range === '1D') {
		xAxisLabelFormat = '{value:%k:%M}';
	} else if (STORE.range === '1Y') {
		tooltipHeaderFormat =
			'<span style="font-size: 10px">{point.x:%A, %b %d, %Y}</span><br/>';
	} else if (STORE.range === 'ALL') {
		xAxisLabelFormat = '{value:%b %Y}';
		tooltipHeaderFormat =
			'<span style="font-size: 10px">{point.x:%A, %b %d, %Y}</span><br/>';
	}

	chartOptions.xAxis.labels.format = xAxisLabelFormat;
	chartOptions.tooltip.headerFormat = tooltipHeaderFormat;
	chartOptions.title.text = STORE.coin;
	chartOptions.subtitle.text = `${STORE.currency}${latestPrice}`;

	return chartOptions;
}

function renderChart(rawData) {
	const data = rawData['Data'].map(item => {
		return [item.time * 1000, item.close];
	});
	const latestPrice = data[data.length - 1][1];

	let chartOptions = getBaseChartOptions();
	chartOptions = customizeChartOptions(chartOptions, latestPrice);

	$('.welcome-message').remove();
	$('#js-chart-container').prop('hidden', false);

	const chart = new Highcharts.stockChart(chartOptions);
	const series = {
		name: `Price (${STORE.tsym})`,
		data: data
	};

	chart.addSeries(series);
}

function handleApp() {
	handleModal();
	handleCoinSelection();
	handleCurrencySelection();
	handleRangeSelection();
}

$(handleApp);
