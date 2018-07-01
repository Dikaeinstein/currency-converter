/**
 * Currency key-value store object
 */
const currencyKeyValueStore = {
  /**
   * Opens an indexDB database and creates an objectstore
   *
   * @returns {Promise} - Resolves to the database handle/reference
   */
  openDb: () => {
    return idb.open('dikaeinstein-currencies-db', 1, (upgradeDb) => {
      upgradeDb.createObjectStore('currenciesStore');
    });
  },
  /**
   * Save currencies in the currencies staore
   *
   * @param {object} currencies
   */
  persistCurrencies: function (currencies) {
    this.openDb()
      .then((db) => {
        return this.getCurrencies().then((existingCurrencies) => {
          if (existingCurrencies) {
            return;
          }
          const tx = db.transaction('currenciesStore', 'readwrite');
          const currenciesStore = tx.objectStore('currenciesStore')
          currenciesStore.put(currencies, 'currencies');
          return tx.complete;
        });
      })
      .then(() => console.log('successfully saved currencies'));
  },
  /**
   * Return currencies object from the currencies store
   *
   * @returns {Promise} Resolves with currencies object
   */
  getCurrencies: function () {
    return this.openDb()
      .then((db) => {
        const tx = db.transaction('currenciesStore');
        return tx.objectStore('currenciesStore').get('currencies');
      })
      .then(currencies => currencies)
      .catch(err => { throw err; });
  },
};
