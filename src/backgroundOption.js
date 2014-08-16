//何時いかなる時でも実行する

//localStorage初期化
initLocalStorage();
function initLocalStorage(){
	if(localStorage.getItem("signalDisable")==null){
		localStorage.setItem("signalDisable","true");
	}
	if(localStorage.getItem("dlButton")==null){
		localStorage.setItem("dlButton","true");
	}
	if(localStorage.getItem("contextMenu")==null){
		localStorage.setItem("contextMenu","true");
	}
	if(localStorage.getItem("bgDownload")==null){
		localStorage.setItem("bgDownload","true");
	}
	if(localStorage.getItem("saveFilePat")==null){
		localStorage.setItem("saveFilePat","$title - [$vid]");
	}
	localStorage.setItem("bgDownload","false");
}
