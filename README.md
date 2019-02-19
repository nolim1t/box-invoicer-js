# box-invoicer-js

This project is meant as a drop in add-on for calling ["the box"](https://lncm.io/project/box/) invoicing APIs

# Usage

```html
<!-- Preload these libraries -->
<script src="https://cdn.jsdelivr.net/npm/vue"></script>
<script src="https://unpkg.com/axios/dist/axios.min.js"></script>


<!-- Anywhere in body -->

<!-- Sample code creates invoice for 1337 sats -->
<div id="lninvoicerapp">
    <div id="paymentwidget">
        <button id="createInvoice" onClick="lninvoicerapp.amount = 1337; lninvoicerapp.createInvoice();">Pay with ⚡️ lightning or bitcoin</button>
        <div v-if="text !== '' && settled === false" class="output">
            Please pay the following invoice [<a href="#" onclick="lninvoicerapp.bitcoinqr();">Bitcoin Only</a> | <a href="#" onclick="lninvoicerapp.bolt11qr();">Lightning Only</a>]: <br />
            <img :src="newQRCode" alt="QRCode">
        </div>      
        <div v-else-if="text !== '' && settled === true">
            Thank you for your lightning ⚡️ or on-chain payment! ✅
        </div>  
    </div>
</div>


<!-- Can put this before or after -->
<!-- Edit the below to your path (or you can run off master)  -->
<script src="https://gitlab.com/nolim1t/box-invoicer-js/raw/master/qrious.min.js"></script>
<script src="https://gitlab.com/nolim1t/box-invoicer-js/raw/master/box-invoicer.js"></script>

```
