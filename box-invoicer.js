// Helper functions

// Change this to your invoicer instance!
const base_invoicer_url = 'http://YOURBOXHERE/invoicer';

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
    // Data
    data: {
        bip21invoice: '',
        bitcoinaddress: '',
        bolt11: '',
        hash: '',
        amount: 1,
        invoicedescription: 'Default payment',
        title: 'Pay invoice',
        text: '',
        settled: false,
        qrcode: new QRious({ size: 300 })
    },
    // Callbacks
    mounted: function() {
        console.log("Box invoicing App Mounted Successfully!");
    },
    computed: {
        newQRCode: function() {
            this.qrcode.value = this.text
            return this.qrcode.toDataURL()            
        },
        bolt11qr: function() {
            this.text = this.bolt11 
            this.qrcode.value = this.text
            return this.qrcode.toDataURL()          
        },
        bitcoinqr: function() {
            this.text = this.bitcoinaddress + "?amount=" + (parseFloat(this.amount / 100000000)).toString()
            this.qrcode.value = this.text;
            return this.qrcode.toDataURL()
        },
        bolt11: function() {
            return this.bolt11.toString()
        },
        bitcoinaddress: function() {
            return this.bitcoinaddress.toString()
        },
        paymentamount: function() {
            return this.amount.toString()
        }
    },
    methods: {
        createInvoice: function() {
            if (document.getElementById("createInvoice") !== undefined && document.getElementById("createInvoice") !== null) {
                // If theres a button called "createInvoice"
                var create_invoice_endpoint =  base_invoicer_url + "/payment";
                var payment_obj = {
                    amount: this.amount,
                    description: this.invoicedescription
                };
                var request_obj = {
                    method: 'POST',
                    url: create_invoice_endpoint,
                    data: JSON.stringify(payment_obj),
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    json: true
                };
                // Send Request
                document.getElementById("createInvoice").style.visibility = 'hidden';
                axios(request_obj)
                .then((response) => {
                    //document.getElementById("createInvoice").style.visibility = 'visible'; // Show generate button again
                    //document.getElementById("createInvoice").innerHTML = 'Generate another lightning ⚡️ or bitcoin invoice';
                    if (response.data !== undefined && response.data !== null) {
                        if (response.data.bolt11 !== undefined && response.data.bolt11 !== null) {
                            this.hash = response.data.hash; // Get LND Payment hash
                            this.bolt11 = response.data.bolt11;
                            var amt_in_btc_units = parseFloat(this.amount / 100000000);
                            if (response.data.address !== undefined && response.data.address !== null) {
                                // If address is returned
                                this.bitcoinaddress = response.data.address.toString();
                                this.bip21invoice = "bitcoin:" + response.data.address.toString() + "?amount=" + amt_in_btc_units.toString() + "&lightning=" + this.bolt11.toString();
                                this.text = this.bip21invoice;
                                console.log(this.text);
                            } else {
                                // If only bolt11
                                this.text = this.bolt11;
                                console.log(this.bolt11);
                            }
                            console.log('Start checking for payments');
                            lninvoicerapp.checkpayment(); // Start checking for payments
                        } else {
                            console.log("No invoice generated - show error");
                            document.getElementById("createInvoice").style.visibility = 'visible';
                        }
                    } else {
                        document.getElementById("createInvoice").style.visibility = 'visible';
                        console.log("Invalid response - show error to user");
                    }
                })
                .catch((error) => {
                    document.getElementById("createInvoice").style.visibility = 'visible';
                    alert(error)
                })                
            } else {
                console.log("createInvoice button does not exist!");
            }
        },
    checkpayment: function() {
        if  (this.hash !== '') {
            if (this.bitcoinaddress !== '') {
                var check_payment_endpoint = base_invoicer_url + '/payment?hash=' + this.hash.toString() + '&address=' + this.bitcoinaddress.toString();
                var request_obj = {
                    method: 'GET',
                    url: check_payment_endpoint,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                }                
                console.log("Checking payment");
                axios(request_obj)
                .then((response) => {
                    if (response.data.ln !== undefined && response.data.ln !== null) {
                        // Lightning Payment Detected!
                        console.log(JSON.stringify(response.data.ln));
                        this.settled = response.data.ln.is_paid;
                    } else if (response.data.bitcoin !== undefined && response.data.bitcoin !== null) {
                        // Bitcoin on chain detected!
                        console.log(JSON.stringify(response.data.bitcoin));
                        this.settled = true; // Set to true                        
                    }
                })
                .catch((error) => {
                    console.log(error);
                })                
            } else {
                console.log('Nothing to check');
            }
        } else {
            console.log("Nothing to check!");
        }
    }
    }
});
