document.addEventListener('DOMContentLoaded', () => {
  // Register service worker
  if (navigator.serviceWorker) {
    navigator.serviceWorker.register('sw.js')
      .then(registration =>
        console.log('ServiceWorker registration successful')
      )
      .catch(err =>
      console.log('ServiceWorker registration failed: ', err)
      );
  }

  /**
   * Get all currencies
   *
   * @param {String} url
   *
   * @returns {Promise}
   */
  const getAllCurrencies = (url) => {
    return currencyKeyValueStore.getCurrencies()
      .then((currencies) => {
        if (currencies) {
          return currencies;
        }
        return fetch(url)
          .then((res) => {
            if (res.status !== 200) {
              console.log(`Error!, Status Code: ${response.status}`);
              return;
            }
            return res.json();
          })
          .then((currencies) => { return currencies; })
          .catch(error => console.error(error));
      });
  };


  /**
   * Convert currency
   *
   * @param {string} fromCurrency
   * @param {string} toCurrency
   *
   * @returns {Promise}
   */
  const convertCurrency = (fromCurrency, toCurrency) => {
    const query = `${encodeURIComponent(fromCurrency)}
_${encodeURIComponent(toCurrency)}`;

    const url = `https://free.currencyconverterapi.com/api/v5/
convert?q=${query}&compact=ultra`;

    return fetch(url)
      .then((response) => {
        if (response.status !== 200) {
          console.log(`Error!, Status Code: ${response.status}`);
          return;
        }
        return response.json();
      })
      .then((rate) => {
        return rate;
      })
      .catch((error) => { throw error; });
  }

  /**
   * Sorts an object by its keys
   *
   * @param {Object} object
   *
   * @returns {Object} - newObject
   */
  const sortObject = (object) => {
    // Return sorted object
    return Object.keys(object)
      .sort()
      .reduce((newObject, value) => {
        newObject[value] = object[value];
        return newObject;
      }, {});
  };

  /**
   * Renders the currencies object with a list of option elements
   *
   * @param {Object} currenciesObject 
   * @param {String} selected
   *
   * @returns {DocumentFragment} Wraps the option elements
   */
  const renderCurrencyOptions = (currenciesObject, selected) => {
    const optionsFragment = document.createDocumentFragment();
    // Sort currencies object using object keys
    const sortedCurrencies = sortObject(currenciesObject);
    // Loop through currencies object and create option elements
    for (currencyKey in sortedCurrencies) {
      const currency = sortedCurrencies[currencyKey];
      const option = document.createElement('option');
      option.textContent = `${currency.id} ${currency.currencyName}`;
      option.value = currency.id;
      if (currency.id ===  selected) {
        option.setAttribute('selected', true);
      }
      optionsFragment.appendChild(option);
    }
    // Return fragment
    return optionsFragment;
  };

  /**
   * Renders an object of currencies using a dropdown
   *
   * @param {Object} currencies
   */
  const renderCurrencies = (currencies) => {
    const from = document.getElementById('from');
    const to = document.getElementById('to');
    const currencyForm = document.getElementById('currencyForm');

    // Render options
    const optionsFragmentFrom = renderCurrencyOptions(currencies, 'USD');
    const optionsFragmentTo = renderCurrencyOptions(currencies, 'NGN');

    // Create select element
    const fromCurrency = document.createElement('select');
    const toCurrency = document.createElement('select');

    // Create label element
    const labelTo = document.createElement('label');
    const labelFrom = labelTo.cloneNode();
    labelTo.textContent = 'To';
    labelFrom.textContent = 'From';

    // Append option elements to select element
    fromCurrency.appendChild(optionsFragmentFrom);
    toCurrency.appendChild(optionsFragmentTo);

    // Append select elements to their appropriate divs
    to.appendChild(toCurrency);
    to.appendChild(labelTo);
    from.appendChild(fromCurrency);
    from.appendChild(labelFrom);

    // Initialize materialize elements
    const elems = document.querySelectorAll('select');
    const instances = M.FormSelect.init(elems, {
      classes: '.center-align'
    });
  };

  currencyForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const button = event.target;
    const preloaderContainer = document
      .getElementById('preloader-container');
    const resultPara = document.getElementById('result');
    
    // Disable submit button and show circular preloader
    // while converting currency
    button.setAttribute('disabled', true);
    resultPara.classList.add('hide');
    preloaderContainer.classList.remove('hide');
    // Extract form element values
    const inputs = Array.from(event.target.elements);
    const filteredInputs = inputs.filter((input) => {
      return input.type !== 'text' && input.type !== 'submit';
    });
    const values = filteredInputs.map(input => input.value);

    const fromCurrency = values[1];
    const toCurrency = values[2];
    const query = `${fromCurrency}_${toCurrency}`;

    // Convert currency
    convertCurrency(fromCurrency, toCurrency)
      .then((rateObject) => {
        // Multiply rate with amount
        const result = rateObject[query] * values[0];

        // Re-activate submit button and hide circular preloader
        // when convert currency succeeds
        button.setAttribute('disabled', false);
        preloaderContainer.classList.add('hide');

        // Render the conversion result
        document.getElementById('result')
          .innerHTML = `${toCurrency} ${result}`;
        document.getElementById('result').classList.remove('hide');
      })
      .catch(error => {
        // Render the conversion result
        document.getElementById('result')
          .innerHTML = 'Error converting currency, please try again';
        document.getElementById('result').classList.remove('hide');
        preloaderContainer.classList.add('hide');
        console.error(error);
      });
  });

  // Fetch all currencies offered by the API
  // then render option dropdown
  getAllCurrencies('https://free.currencyconverterapi.com/api/v5/currencies')
    .then(currencies => {
      currencyKeyValueStore.persistCurrencies(currencies);
      renderCurrencies(currencies.results)
    })
    .catch(error => console.error(error));
});
