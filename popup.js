function loadOptions() {
    chrome.runtime.sendMessage({
        msg: "request_fiats"
    }, function(response) {
        console.log(response);
        $.each(response.fiat_values, function(currency_code, symbol) {
            $('#fiat').append($("<option></option>").attr("value", currency_code).text(`${currency_code} ${symbol}`));
        });
    });

    chrome.runtime.sendMessage({
        msg: "request_settings"
    }, function(response) {
        console.log(response);
        $("#fiat").val(response.chosen_fiat);
        $("#datasource").val(response.datasource);
        $("#curator")[0].checked = response.curator;
        $("#payout_range").val(response.payout_range);
        calcRange();
    });
}

function saveOptions() {
    var settings = {
        chosen_fiat: $("#fiat").val(),
        datasource: $("#datasource").val(),
        curator: $("#curator")[0].checked,
        payout_range: $("#payout_range").val()
    }
    chrome.runtime.sendMessage({
        msg: "save_settings",
        settings: settings
    }, function(response) {
        window.close();
    });
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

$(document).ready(function() {
    loadOptions();
    $("#saveButton").click(saveOptions);
    $("#payout_sbd").change(calcSbd);
    $("#payout_steem").change(calcSteem);
    $("#payout_range").change(calcRange);
});
