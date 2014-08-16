BUTTON_CSS_BASE="margin:3px;padding:2px;font-family:monospace;";
BUTTON_CSS_ENA="border:2px solid #90c0f0;background-color:#FFFFFF;color:#000000;";
BUTTON_DOM_ID="chrome_Ex_nico_movie_get_down_buttonR";
vid=null;loadinit=false;
if(document.URL.match(/\/watch\/([0-9a-z]+)/)){vid=RegExp.$1}
if(document.URL.match(/\/watch\/lv/)){vid=null;}
if(vid!=null){
	//dlボタンが有効なら作る。
	chrome.extension.sendRequest({
			action:"enableDlButton",
			args  :[""]
		},function(response){
			console.log("ダウンロードボタンの有効チェック %o",response);
			if(response==true){
				setButton();
			}
		}
	);
}
function setButton(){
	if(document.querySelector("#itab")){//原宿
		var _td;
		_td = document.createElement("button");
		_td.setAttribute("style",BUTTON_CSS_BASE+BUTTON_CSS_ENA);
		_td.setAttribute("id",BUTTON_DOM_ID);
		_td.innerHTML ='動画DL';
		_td.addEventListener("click",goMovie,false);
		document.querySelector("#itab td").appendChild(_td);
	}else if(document.querySelector("#videoMenuBottomList")){
		var button;
		button = document.createElement("button");
		button.setAttribute("style",BUTTON_CSS_BASE+BUTTON_CSS_ENA);
		button.innerHTML ='動画DL';
		button.addEventListener("click",goMovie,false);
		document.querySelector("#videoTitle").appendChild(button);
	}
}
function goMovie(){
	chrome.extension.sendRequest({
			action:"goMovie",
			args  :[vid]
		},function(response){}
	);
}
