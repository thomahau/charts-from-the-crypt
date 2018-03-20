'use strict';

const COINMARKETCAP_ENDPOINT = 'https://api.coinmarketcap.com/v1/';
const CRYPTOCOMPARE_ENDPOINT = 'https://min-api.cryptocompare.com/data/';
const APP_NAME = 'charts_from_the_crypt';

const STORE = {
	availableCoins: [],
	coin: '',
	fsym: '',
	currency: '$',
	tsym: 'USD',
	scale: 'linear',
	range: 'All'
};

function fetchCoinList() {
	// Returns current top 200 cryptocurrencies by marketcap
	const url = COINMARKETCAP_ENDPOINT + 'ticker/?limit=200';

	$.getJSON(url, populateSearchOptions).fail(showErr);
}

function populateSearchOptions(rawData) {
	STORE.availableCoins = rawData.map(coin => {
		return `${coin.name} (${coin.symbol})`;
	});

	$('#coin').autocomplete({
		source: STORE.availableCoins
	});
}

function handleModal() {
	$('body').on('click', '.js-help-btn', function(event) {
		$('.modal').addClass('is-active');
	});

	$('.delete').click(function(event) {
		$('.modal').removeClass('is-active');
	});
}

function handleCoinSelection() {
	// When user makes a selection from dropdown; fill value of input field and submit form
	$('#coin').on('autocompleteselect', function(event, ui) {
		$(this).val(ui.item.value);
		$('.coin-form').submit();
	});

	$('.coin-form').submit(function(event) {
		event.preventDefault();
		const userInput = $(this)
			.find('#coin')
			.val();
		// Validate user input and display help text if not valid
		if (isValidInput(userInput)) {
			const coinElements = userInput.split('(');

			$('#coin').removeClass('is-danger');
			$('.help')
				.attr('hidden', true)
				.text('');

			STORE.coin = coinElements[0];
			STORE.fsym = coinElements[1].slice(0, -1);

			fetchPriceData();
		} else {
			$('#coin')
				.addClass('is-danger')
				.val('');
			$('.help')
				.attr('hidden', false)
				.text('Invalid input');
		}
	});
}

function isValidInput(userInput) {
	let validInput = false;

	STORE.availableCoins.forEach(coin => {
		if (userInput === coin) {
			validInput = true;
			return validInput;
		}
	});
	return validInput;
}

function handleCurrencySelection() {
	$('.js-currency-btn').click(function(event) {
		if (!$(this).hasClass('is-outlined')) {
			// De-select other currency
			$('.js-currency-btn.is-outlined').removeClass(
				'is-warning is-outlined'
			);
			// Select new currency
			$(this).addClass('is-warning is-outlined');
			const iconName = $(this)
				.find('svg')
				.attr('data-icon');

			setCurrency(iconName);

			if (STORE.fsym) {
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
			// De-select other price scale
			$('.js-scale-btn.is-outlined').removeClass(
				'is-warning is-outlined'
			);
			// Select new price scale
			$(this).addClass('is-warning is-outlined');
			STORE.scale = $(this)
				.text()
				.toLowerCase();

			if (STORE.fsym) {
				fetchPriceData();
			}
		}
	});
}

function handleRangeSelection() {
	$('.dropdown-trigger').click(function(event) {
		$(this)
			.parent()
			.toggleClass('is-active');
	});

	$('.dropdown-item').click(function(event) {
		if (!$(this).hasClass('is-warning')) {
			// De-select other range, mobile view
			$('.dropdown-item.is-warning').removeClass(
				'button is-warning has-text-left'
			);
			// Select new range, mobile view
			$(this).addClass('button is-warning has-text-left');
			STORE.range = $(this).text();
			$('.js-selected-range').text(`Range: ${STORE.range}`);
			$('.dropdown').removeClass('is-active');

			if (STORE.fsym) {
				fetchPriceData();
			}
		}
	});

	$('.js-range-btn').click(function(event) {
		if (!$(this).hasClass('is-outlined')) {
			// De-select other range, desktop view
			$('.js-range-btn.is-outlined').removeClass(
				'is-warning is-outlined'
			);
			// Select new range, desktop view
			$(this).addClass('is-warning is-outlined');
			STORE.range = $(this).text();

			if (STORE.fsym) {
				fetchPriceData();
			}
		}
	});
}

function fetchPriceData() {
	const now = Math.round(new Date().getTime() / 1000);
	let url = CRYPTOCOMPARE_ENDPOINT;
	// Build CryptoCompare API query based on stored range
	switch (STORE.range) {
		case '1d':
			url += `histominute?limit=288&aggregate=5&toTs=${now}`;
			break;
		case '1w':
			url += `histohour?limit=168&toTs=${now}`;
			break;
		case '1m':
			url += `histohour?limit=720&toTs=${now}`;
			break;
		case '3m':
			url += `histohour?limit=720&aggregate=3&toTs=${now}`;
			break;
		case '6m':
			url += `histohour?limit=720&aggregate=6&toTs=${now}`;
			break;
		case '1y':
			url += `histoday?limit=365&toTs=${now}`;
			break;
		default:
			url += `histoday?allData=true`;
	}

	url += `&fsym=${STORE.fsym}&tsym=${STORE.tsym}&extraParams=${APP_NAME}`;

	$.getJSON(url, renderChart).fail(showErr);
}

function renderChart(rawData) {
	if (rawData.Response === 'Error') {
		showErr(rawData.Message);
	} else {
		const data = rawData['Data'].map(dataPoint => {
			return [dataPoint.time * 1000, dataPoint.close];
		});
		const latestPrice = data[data.length - 1][1];

		let chartOptions = getBaseChartOptions(latestPrice);
		chartOptions = addRangeChartOptions(chartOptions);

		$('.welcome-message, .error-message').remove();
		$('#js-chart-container').prop('hidden', false);

		if (!$('.js-help-btn').length) {
			renderBannerHelpButton();
		}

		const chart = new Highcharts.stockChart(chartOptions);
		const series = {
			name: `Price (${STORE.tsym})`,
			data: data
		};
		chart.addSeries(series);
	}
}

function getBaseChartOptions(latestPrice) {
	const tooltipDecimals = countDecimals(latestPrice);

	let chartOptions = {
		chart: {
			renderTo: 'js-chart-container',
			// Description for screen readers
			description: `${STORE.scale} price history chart for ${
				STORE.coin
			}, denominated in ${STORE.tsym}`
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
			text: `${STORE.coin} (${STORE.fsym})`
		},
		subtitle: {
			text:
				STORE.currency === 'BTC'
					? `Current price: ${latestPrice} ${STORE.currency}`
					: `Current price: ${STORE.currency}${latestPrice}`
		},
		xAxis: {
			type: 'datetime',
			labels: {}
		},
		yAxis: {
			crosshair: true,
			type: `${STORE.scale}`,
			labels: {
				format:
					STORE.currency === 'BTC'
						? `{value} ${STORE.currency}`
						: `${STORE.currency}{value}`
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
			valueDecimals: tooltipDecimals
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

function countDecimals(value) {
	if (Math.floor(value) !== value) {
		return value.toString().split('.')[1].length || 0;
	}
	return 0;
}

function renderBannerHelpButton() {
	const bannerHelpButton = `
		<div class="column is-narrow">
          <a class="button is-warning is-outlined js-help-btn" role="button">Help</a>
        </div>`;

	$('.js-header-second-level').append(bannerHelpButton);
}

function showErr(err) {
	const errMsg = `
		<div class="container has-text-centered error-message" aria-live="assertive">
			<p>Something went wrong collecting your data! Here's what we know:</p>
			<code>${err}</code>
		</div>`;

	$('.welcome-message, .error-message').remove();
	$('#js-chart-container').empty();
	$(errMsg).insertBefore('#js-chart-container');
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
