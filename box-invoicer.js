// Helper functions

// Change this to your invoicer instance!
const base_invoicer_url = 'http://YOURBOX/invoicer';

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
        paymenterror: false,
        paymentexpired: false,
        contextdeadlineexceededtries: 0,
        errorobject: {},
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
                if (document.getElementById("statusdisplay") !== undefined && document.getElementById("statusdisplay") !== null) {
                    document.getElementById("statusdisplay").innerHTML = 'Generating invoice...';
                }
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
                    if (document.getElementById("statusdisplay") !== undefined && document.getElementById("statusdisplay") !== null) {
                        document.getElementById("statusdisplay").innerHTML = '';
                    }                    
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
                if (document.getElementById("statusdisplay") !== undefined && document.getElementById("statusdisplay") !== null) {
                    document.getElementById("statusdisplay").innerHTML = 'Waiting for payment (3 mins)...';
                }                
                var check_payment_endpoint = base_invoicer_url + '/payment?hash=' + this.hash.toString() + '&address=' + this.bitcoinaddress.toString();
                var request_obj = {
                    method: 'GET',
                    url: check_payment_endpoint,
                    timeout: 180000,
                    headers: {
                        'Content-Type': 'application/json'
                    },
                }                
                console.log("Checking payment");
                axios(request_obj)
                .then((response) => {
                    if (document.getElementById("statusdisplay") !== undefined && document.getElementById("statusdisplay") !== null) {
                        document.getElementById("statusdisplay").innerHTML = '';
                    }                    
                    if (response.data.ln !== undefined && response.data.ln !== null) {
                        // Lightning Payment Detected!
                        console.log(JSON.stringify(response.data.ln));
                        this.settled = response.data.ln.is_paid;
                    } else if (response.data.bitcoin !== undefined && response.data.bitcoin !== null) {
                        // Bitcoin on chain detected!
                        console.log(JSON.stringify(response.data.bitcoin));
                        this.settled = true; // Set to true                        
                    } else {
                        console.log("Undefined response");
                    }
                })
                .catch((error) => {
                    console.log("Error caught");
                    this.paymenterror = true; // Set payment error = true
                    if (document.getElementById("statusdisplay") !== undefined && document.getElementById("statusdisplay") !== null) {
                        document.getElementById("statusdisplay").innerHTML = '';
                    }                        
                    if (error.response !== undefined && error.response !== null) {
                        if (error.response.data !== undefined && error.response.data !== null) {
                            // Data exists
                            this.errorobject = error.response.data;
                            if (error.response.data.error !== undefined && error.response.data.error !== null) {
                                if (error.response.data.error.toString().indexOf("DeadlineExceeded") !== -1) {
                                    // Unable to fetch invoice - DeadlineExceeded
                                    if (this.contextdeadlineexceededtries <= 3) {                                    
                                        console.log("Context deadline exceeded - lets retry this");
                                        this.contextdeadlineexceededtries = this.contextdeadlineexceededtries + 1;
                                        this.checkpayment(); // Retry request
                                    }
                                } else if (error.response.data.error.toString().indexOf("expired") !== -1) {
                                    console.log("Payment expired");
                                    this.paymentexpired = true;
                                }
                                console.log("Error: " + error.response.data.error.toString());
                            } else {
                                console.log("Error returned but no idea how to process it");
                                console.log(JSON.stringify(error.response.data));
                            }
                        } else {
                            console.log('Error but nothing returned');
                        }
                    } else {
                        console.log('Error but no response');
                        console.log(JSON.stringify(error));
                        this.errorobject = error;
                        // re-send the request
                        this.checkpayment();
                    }
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
