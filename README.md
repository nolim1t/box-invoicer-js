# box-invoicer-js

This project is meant as a drop in add-on for calling ["the box"](https://lncm.io/project/box/) invoicing APIs

# Usage

```html
<!-- Preload these libraries -->
<script src="https://cdn.jsdelivr.net/npm/vue"></script>
<script src="https://unpkg.com/axios/dist/axios.min.js"></script>


<!-- Anywhere in body -->

<!-- Sample code creates invoice for 1337 sats -->
<!-- Note: Not ready as of yet -->
<div id="#lninvoicerapp">
    <div id="paymentwidget">
        <button id="createInvoice" onClick="lninvoicerapp.amount = 1337; lninvoicerapp.createInvoice();">Pay with ⚡️ lightning or bitcoin</button>
    </div>
</div>

<!-- Can put this before or after -->
<!-- Edit the below to your path (or you can run off master)  -->
<script src="https://gitlab.com/nolim1t/box-invoicer-js/raw/master/box-invoicer.js"></script>

```
