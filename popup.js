function sendMessage(msg) {
    return new Promise((resolve,reject)=> {
        chrome.runtime.sendMessage(msg, resolve)
    })
}

function loadCountries() {
    sendMessage({
        msg: "request_fiats"
    })
    .then((response)=>{
        console.log(response);
        $.each(response.fiat_values, function(currency_code, symbol) {
            $('#fiat').append($("<option></option>").attr("value", currency_code).text(`${currency_code} ${symbol}`));
        });
    });
}

function loadExchanges() {
    sendMessage({
        msg: "request_exchanges"
    })
    .then((response)=>{
        console.log(response);
        $.each(response.exchanges, function(idx, exchange) {
            $('#datasource').append($("<option></option>").attr("value", exchange).text(exchange));
        });
    });
}

function loadPriceCallback(response) {
    var fiat = response.rate.toLocaleString(navigator.language, {maximumFractionDigits:2});
    $("#priceholder").html(`${response.symbol}${fiat}`);
    var curator = response.curator ? "-25% Curator Rewards" : "";
    var url = "https://steemit.com/steem/@dragosroua/steem-supply-update-rewards-algorithm-rewrite-major-cleanup-version-bump";
    var pricefeed = response.sbd_bias.toLocaleString(navigator.language, {
        maximumFractionDigits: 2, minimumFractionDigits: 2
    });
    var fiat_source = (response.symbol == "₱") ? "coingecko.com" : "blockchain.info";
    var explanation1 = `
            Parameters:<br>
            STEEM price feed: ${pricefeed}<br>
            Steem/BTC and SBD/BTC prices: ${response.source} <br>
            Steem price in BTC: ${response.steem_btc} <br>
            SBD price in BTC: ${response.sbd_btc} <br> 
            BTC/Fiat prices: ${fiat_source}<br>
            Current BTC price in Fiat : ${response.btc_fiat}<br> 
            ${curator}<br>
            <sub>Learn more about how payouts are calculated <a href="${url}">here</a></sub>
    `;
    var explanation2 = `
            Parameters:<br>
            Only Liquid (SBD) Rewards shown
            SBD/BTC prices: ${response.source} <br>
            SBD price in BTC: ${response.sbd_btc} <br> 
            BTC/Fiat prices: ${fiat_source}<br>
            Current BTC price in Fiat : ${response.btc_fiat}<br> 
            ${curator}<br>
            <sub>Learn more about how payouts are calculated <a href="${url}">here</a></sub>
    `;
    $("#answer").html(response.liquid ? explanation2 : explanation1);
}

function loadPrice() {
    sendMessage({
        msg: "request_display_info"
    })
    .then(loadPriceCallback);
}

function loadSamplePrice() {
    var settings = {
        chosen_fiat: $("#fiat").val(),
        datasource: $("#datasource").val(),
        curator: $("#curator")[0].checked,
        liquid: $("#liquid")[0].checked
    }
    sendMessage({
        msg: "request_tmp_display_info",
        settings: settings
    })
    .then(loadPriceCallback);
}

function loadOptions() {
    sendMessage({
        msg: "request_settings"
    })
    .then((response)=>{
        console.log(response);
        $("#fiat").val(response.chosen_fiat);
        $("#datasource").val(response.datasource);
        $("#curator")[0].checked = response.curator;
        $('#payout_range').val(response.api_payout_range);
        $("#liquid")[0].checked = response.liquid;
        calcRange();
        setTimeout(()=> {
            $(".wrapper").toggleClass("hidden");
            $("hr").toggleClass("hidden");
            // $("#loadWrapper").addClass("hidden");  
        }, 450);
    });
}

function saveOptions() {
    var settings = {
        chosen_fiat: $("#fiat").val(),
        datasource: $("#datasource").val(),
        curator: $("#curator")[0].checked,
        liquid: $("#liquid")[0].checked
    }
    sendMessage({
        msg: "save_settings",
        settings: settings
    })
    .then(window.close);
}

function calcRange() {
    var driver = $('#payout_range').val();
    driver = Math.max(0, Math.min(driver, 100));
    $("#payout_steem").val(100 - driver);
    $("#payout_sbd").val(driver);
    $('#payout_range').val(driver);

}

function toggleAnswer() {
    $("#answer").toggleClass("hidden");
}

$(document).ready(function() {
    loadPrice();
    loadCountries();
    loadExchanges();
    loadOptions();
    $("#fiat, #datasource, #curator, #liquid").change(loadSamplePrice);
    $("#saveButton").click(saveOptions);
    $("#question").click(toggleAnswer);
})
