// Helper functions

// Check BTC Rates
// NO need to do anything, but the function will return a callback in format of:
// {
// fetched: true
// rates: {"CURRENCY_1": "INT_AMT_FOR_1_BTC", "CURRENCY_2": "INT_AMT_FOR_1_BTC"}
// }
const check_bitcoin_rates_for_box = (callback) => {
    // Notes: This URL can be anything but it should return rates in the following format
    // {status: 200, rates: {"CURRENCY_1": "INT_AMT_FOR_1_BTC", "CURRENCY_2": "INT_AMT_FOR_1_BTC"}}
    axios.get('https://jenh8onnc8.execute-api.ap-southeast-1.amazonaws.com/awslightningmainnet1/generateinvoice?showRates=true').then((response) => {
      if (response.data !== undefined && response.data !== null) {
        if (response.data['status'] !== undefined && response.data['status'] !== null) {
          if (response.data['status'] === 200) {
            if (response.data['rates'] !== undefined && response.data['rates'] !== null) {
              callback({
                fetched: true,
                rates: response.data['rates']
              });
            } else {
              callback({
                fetched: false
              });
            }
          } else {
            callback({
              fetched: false
            });
          }
        } else {
          callback({
            fetched: false
          });
        }
      } else {
        callback({
          fetched: false
        });
      }
    });
  };


// Main vue.js entrypoint
var lninvoicerapp = new Vue({
    el: '#lninvoicerapp',
    // Callbacks
    mounted: function() {
        console.log("App Mounted");
    },
    methods: {
        createInvoice: function() {
            console.log("Create Invoice");
        }
    }
});