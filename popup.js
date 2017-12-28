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
        $("#priceholder").html(`${response.symbol}${fiat}`)
        var curator = response.curator ? "-25% Curator Rewards" : ""
        var explanation = `
                Parameters:<br>
                Split between Steem/SBD: ${response.sbd_bias.toFixed(2)}/${(1-response.sbd_bias).toFixed(2)} <br>
                Steem/BTC and SBD/BTC prices: ${response.source} <br>
                Steem price in BTC: ${response.steem_btc} <br>
                SBD price in BTC: ${response.sbd_btc} <br> 
                BTC/Fiat prices: blockchain.info<br>
                Current BTC price in Fiat : ${response.btc_fiat}<br> 
                ${curator}
        `
        $("#answer").html(explanation)
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
        $("#custom_ratio")[0].checked = response.custom_ratio;
        if (response.custom_ratio) {
            $("#payout_range").val(response.payout_range);
            enableSelectors();
        }
        else {
            $("#payout_range").val(response.api_payout_range);
            disableSelectors();
        }
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
        custom_ratio: $("#custom_ratio")[0].checked,
        payout_range: $("#payout_range").val()
    }
    sendMessage({
        msg: "save_settings",
        settings: settings
    })
    .then(window.close);
}

function calcSbd() {
    var driver = $('#payout_sbd').val();
    driver = Math.max(0, Math.min(driver, 100));
    $("#payout_steem").val(100 - driver);
    $("#payout_range").val(driver);
    $('#payout_sbd').val(driver);
}

function calcSteem() {
    var driver = $('#payout_steem').val();
    driver = Math.max(0, Math.min(driver, 100));
    $("#payout_sbd").val(100 - driver);
    $("#payout_range").val(100 - driver);
    $('#payout_steem').val(driver);

}

function calcRange() {
    var driver = $('#payout_range').val();
    driver = Math.max(0, Math.min(driver, 100));
    $("#payout_steem").val(100 - driver);
    $("#payout_sbd").val(driver);
    $('#payout_range').val(driver);

}

function enableSelectors() {
    $("#payout_steem").prop('disabled', false);
    $("#payout_sbd").prop('disabled', false);
    $('#payout_range').prop('disabled', false);
}

function disableSelectors() {
    $("#payout_steem").prop('disabled', true);
    $("#payout_sbd").prop('disabled', true);
    $('#payout_range').prop('disabled', true);
}

function handleRatioChange() {
    if ($("#custom_ratio")[0].checked) {
        enableSelectors();
    } else {
        sendMessage({
            msg: "request_settings"
        })
        .then((response)=>{
            console.log(response);
            $("#payout_range").val(response.api_payout_range);
            disableSelectors();
            calcRange();
        });
    }
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
    $("#payout_sbd").change(calcSbd);
    $("#payout_steem").change(calcSteem);
    $("#payout_range").change(calcRange);
    $("#custom_ratio").change(handleRatioChange);
    $("#question").click(toggleAnswer);
})
