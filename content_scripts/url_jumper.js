document.addEventListener('DOMContentLoaded', ()=>{
	var link = document.createElement('link'); 
	link.href = chrome.extension.getURL('css/url_jumper.css'); 
	link.id = 'Your Stylish!'; 
	link.type = 'text/css'; 
	link.rel = 'stylesheet'; 
	document.head.appendChild(link); 
});

function init() {
	chrome.runtime.sendMessage({
		msg: "request_generate_sister_urls",
		data: {
			host: window.location.host, 
			path: window.location.pathname,
			hash: window.location.hash
		}		
	}, function(response) {
		if ($('#contextmenu').length == 0) {
			$("body").append(`<div id="contextmenu"><ul></ul> </div>`)
		}
		$("#contextmenu ul").html("");
		for(var i = 0; i < response.sites.length; i++){
			var it = (response.sites.length > 3) ? "user" : "";
			$("#contextmenu ul").append(`
				<li>
					View ${it} on <a href="${response.sites[i].url}">${response.sites[i].name}</a>
				</l>`)
		}
	});
}
setInterval(init, 1500);