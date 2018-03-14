'use strict';

const COINMARKETCAP_ENDPOINT = 'https://api.coinmarketcap.com/v1/';
const CRYPTOCOMPARE_ENDPOINT = 'https://min-api.cryptocompare.com/data/';
const APP_NAME = 'charts_from_the_crypt';

const STORE = {
	coin: '',
	fsym: '',
	// Default starting values
	currency: '$',
	tsym: 'USD',
	scale: 'linear',
	range: 'All'
};

function fetchCoinList() {
	const url = COINMARKETCAP_ENDPOINT + 'ticker/?limit=100';
	$.getJSON(url, renderDatalist);
}

function renderDatalist(coinList) {
	const datalist = $('#js-coinlist');

	coinList.forEach(coin => {
		// Create a new <option> element
		let option = `
		<option value="${coin.name} (${coin.symbol})">`;
		// Add the <option> element to datalist
		datalist.append(option);
	});
}

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
		const currentValue = $(this).val();
		if (isValidInput(currentValue)) {
			const coinElements = currentValue.split('(');

			$('.help')
				.attr('hidden', true)
				.text('');
			$(this).removeClass('is-danger');
			STORE.coin = coinElements[0];
			STORE.fsym = coinElements[1].slice(0, -1);
			fetchPriceData();
		} else {
			$(this)
				.addClass('is-danger')
				.val('');
			$('.help')
				.attr('hidden', false)
				.text('Invalid input');
		}
	});
}

function isValidInput(input) {
	const datalistOptions = $('#js-coinlist').find('option');
	let optionFound = false;

	datalistOptions.each(function() {
		let optionValue = $(this).attr('value');
		if (optionValue === input) {
			optionFound = true;
			return optionFound;
		}
	});
	return optionFound;
}

function handleCurrencySelection() {
	$('.js-currency-btn').click(function(event) {
		if (!$(this).hasClass('is-outlined')) {
			$('.js-currency-btn.is-outlined').removeClass(
				'is-warning is-outlined'
			);
			$(this).addClass('is-warning is-outlined');
			const iconName = $(this)
				.find('svg')
				.attr('data-icon');

			setCurrency(iconName);

			if (isValidInput($('#coin').val())) {
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

function handleScaleSelection() {
	$('.js-scale-btn').click(function(event) {
		if (!$(this).hasClass('is-outlined')) {
			$('.js-scale-btn.is-outlined').removeClass('is-warning is-outlined');
			$(this).addClass('is-warning is-outlined');
			STORE.scale = $(this).text().toLowerCase();

			if (isValidInput($('#coin').val())) {
				fetchPriceData();
			}
		}
	});
}

function handleRangeSelection() {
	$('.js-range-btn').click(function(event) {
		if (!$(this).hasClass('is-outlined')) {
			$('.js-range-btn.is-outlined').removeClass(
				'is-warning is-outlined'
			);
			$(this).addClass('is-warning is-outlined');
			STORE.range = $(this).text();

			if (isValidInput($('#coin').val())) {
				fetchPriceData();
			}
		}
	});
}

function fetchPriceData() {
	const now = Math.round(new Date().getTime() / 1000);
	let url = CRYPTOCOMPARE_ENDPOINT;

	switch (STORE.range) {
		case '1d':
			url += `histominute?fsym=${STORE.fsym}&tsym=${
				STORE.tsym
			}&limit=288&aggregate=5&toTs=${now}&extraParams=${APP_NAME}`;
			break;
		case '1w':
			url += `histohour?fsym=${STORE.fsym}&tsym=${
				STORE.tsym
			}&limit=168&toTs=${now}&extraParams=${APP_NAME}`;
			break;
		case '1m':
			url += `histohour?fsym=${STORE.fsym}&tsym=${
				STORE.tsym
			}&limit=720&toTs=${now}&extraParams=${APP_NAME}`;
			break;
		case '3m':
			url += `histohour?fsym=${STORE.fsym}&tsym=${
				STORE.tsym
			}&limit=720&aggregate=3&toTs=${now}&extraParams=${APP_NAME}`;
			break;
		case '6m':
			url += `histohour?fsym=${STORE.fsym}&tsym=${
				STORE.tsym
			}&limit=720&aggregate=6&toTs=${now}&extraParams=${APP_NAME}`;
			break;
		case '1y':
			url += `histoday?fsym=${STORE.fsym}&tsym=${
				STORE.tsym
			}&limit=365&toTs=${now}&extraParams=${APP_NAME}`;
			break;
		default:
			url += `histoday?fsym=${STORE.fsym}&tsym=${
				STORE.tsym
			}&allData=true&extraParams=${APP_NAME}`;
	}

	$.getJSON(url, renderChart);
	// .fail(showErr)
}

function renderChart(rawData) {
	const data = rawData['Data'].map(dataPoint => {
		return [dataPoint.time * 1000, dataPoint.close];
	});
	const latestPrice = data[data.length - 1][1];

	let chartOptions = getBaseChartOptions(latestPrice);
	chartOptions = addRangeChartOptions(chartOptions);

	$('.welcome-message').remove();
	$('#js-chart-container').prop('hidden', false);

	const chart = new Highcharts.stockChart(chartOptions);
	const series = {
		name: `Price (${STORE.tsym})`,
		data: data
	};

	chart.addSeries(series);
}

function getBaseChartOptions(latestPrice) {
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
			text: `${STORE.coin}`
		},
		subtitle: {
			text: STORE.currency === 'BTC' ? `${latestPrice} ${STORE.currency}` : `${STORE.currency}${latestPrice}`
		},
		xAxis: {
			type: 'datetime',
			labels: {}
		},
		yAxis: {
			crosshair: true,
			type: `${STORE.scale}`,
			labels: {
				format: STORE.currency === 'BTC' ? `{value} ${STORE.currency}` : `${STORE.currency}{value}`
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
			// TODO: customize decimals?
			valueDecimals: 3
		}
	};

	return chartOptions;
}

function addRangeChartOptions(chartOptions) {
	let xAxisLabelFormat = '{value:%d. %b}';
	let tooltipHeaderFormat =
		'<span style="font-size: 10px">{point.x:%A, %b %d, %Y, %k:%M}</span><br/>';

	if (STORE.range === '1d') {
		xAxisLabelFormat = '{value:%k:%M}';
	} else if (STORE.range === '1y') {
		tooltipHeaderFormat =
			'<span style="font-size: 10px">{point.x:%A, %b %d, %Y}</span><br/>';
	} else if (STORE.range === 'All') {
		xAxisLabelFormat = '{value:%b %Y}';
		tooltipHeaderFormat =
			'<span style="font-size: 10px">{point.x:%A, %b %d, %Y}</span><br/>';
	}

	chartOptions.xAxis.labels.format = xAxisLabelFormat;
	chartOptions.tooltip.headerFormat = tooltipHeaderFormat;

	return chartOptions;
}

function handleApp() {
	fetchCoinList();
	handleModal();
	handleCoinSelection();
	handleCurrencySelection();
	handleScaleSelection();
	handleRangeSelection();
}

$(handleApp);
