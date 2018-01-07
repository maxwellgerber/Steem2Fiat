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

function loadPrice() {
    sendMessage({
        msg: "request_display_info"
    })
    .then((response)=>{
        var fiat = response.rate.toLocaleString(navigator.language, {maximumFractionDigits:2});
        $("#priceholder").html(`${response.symbol}${fiat}`);
        var curator = response.curator ? "-25% Curator Rewards" : "";
        var url = "https://steemit.com/steem/@dragosroua/steem-supply-update-rewards-algorithm-rewrite-major-cleanup-version-bump";
        var pricefeed = response.sbd_bias.toLocaleString(navigator.language, {
            maximumFractionDigits: 2, minimumFractionDigits: 2
        });
        var explanation = `
                Parameters:<br>
                STEEM price feed: ${pricefeed}<br>
                Steem/BTC and SBD/BTC prices: ${response.source} <br>
                Steem price in BTC: ${response.steem_btc} <br>
                SBD price in BTC: ${response.sbd_btc} <br> 
                BTC/Fiat prices: blockchain.info<br>
                Current BTC price in Fiat : ${response.btc_fiat}<br> 
                ${curator}<br>
                <sub>Learn more about how payouts are calculated <a href="${url}">here</a></sub>
        `;
        $("#answer").html(explanation);
    })
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
        $('#payout_range').val(response.api_payout_range)
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
        curator: $("#curator")[0].checked
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
    $("#saveButton").click(saveOptions);
    $("#question").click(toggleAnswer);
})
