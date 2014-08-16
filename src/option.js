window.addEventListener("load",init);
function init(){
	var target="",func;
	//時報
	target="signalDisable";
	if(localStorage.getItem(target)=="true"){
		document.querySelector("#"+target+" input[type='checkbox']").checked=true;
	}else{
		document.querySelector("#"+target+" input[type='checkbox']").checked=false;
	}
	func=(function(target){
		return function(){
			if(document.querySelector("#"+target+" input[type='checkbox']").checked){
				localStorage.setItem(target,"true");
				document.querySelector("#"+target+" span.msg").innerHTML="時報を無効化します";
			}else{
				localStorage.setItem(target,"false");
				document.querySelector("#"+target+" span.msg").innerHTML="時報の無効を取り消しました<br>(プレミアム会員の方でプレイヤー側で無効化されていた場合はそちらが優先されます)";
			}
		}
	})(target)
	document.querySelector("#"+target+" input[type='checkbox']").addEventListener("click",func);
	//視聴ページのボタン
	target="dlButton";
	if(localStorage.getItem(target)=="true"){
		document.querySelector("#"+target+" input[type='checkbox']").checked=true;
	}else{
		document.querySelector("#"+target+" input[type='checkbox']").checked=false;
	}
	func=(function(target){
		return function(){
			if(document.querySelector("#"+target+" input[type='checkbox']").checked){
				localStorage.setItem(target,"true");
				document.querySelector("#"+target+" span.msg").innerHTML="視聴ページにダウンロードボタンを追加します";
			}else{
				localStorage.setItem(target,"false");
				document.querySelector("#"+target+" span.msg").innerHTML="視聴ページにダウンロードボタンを追加しません<br>視聴ページに何も手を加えませんので、この拡張機能のせいで他の拡張機能が正常に動かない！という時はオフにして下さい";
			}
		}
	})(target)
	document.querySelector("#"+target+" input[type='checkbox']").addEventListener("click",func);
	//右クリックメニュー
	target="contextMenu";
	if(localStorage.getItem(target)=="true"){
		document.querySelector("#"+target+" input[type='checkbox']").checked=true;
	}else{
		document.querySelector("#"+target+" input[type='checkbox']").checked=false;
	}
	func=(function(target){
		return function(){
			if(document.querySelector("#"+target+" input[type='checkbox']").checked){
				localStorage.setItem(target,"true");
				document.querySelector("#"+target+" span.msg").innerHTML="右クリックメニューに「ニコニコ動画をダウンロード」メニューを追加します。";
				updateContextMenu(true);
			}else{
				localStorage.setItem(target,"false");
				document.querySelector("#"+target+" span.msg").innerHTML="右クリックメニューの「ニコニコ動画をダウンロード」メニューを削除します。";
				updateContextMenu(false);
			}
		}
	})(target)
	document.querySelector("#"+target+" input[type='checkbox']").addEventListener("click",func);
	//ダウンロードバー非表示
	target="bgDownload";
	if(localStorage.getItem(target)=="true"){
		document.querySelector("#"+target+" input[type='checkbox']").checked=true;
	}else{
		document.querySelector("#"+target+" input[type='checkbox']").checked=false;
	}
	func=(function(target){
		return function(){
			if(document.querySelector("#"+target+" input[type='checkbox']").checked){
				localStorage.setItem(target,"true");
				document.querySelector("#"+target+" span.msg").innerHTML="ダウンロードバーを非表示にする";
			}else{
				localStorage.setItem(target,"false");
				document.querySelector("#"+target+" span.msg").innerHTML="ダウンロードバーを表示する";
			}
		}
	})(target)
	document.querySelector("#"+target+" input[type='checkbox']").addEventListener("click",func);
	//保存ファイル名パターン
	target="saveFilePat";
	document.querySelector("#"+target+"T").value=localStorage.getItem(target);
	func=(function(target){
		return function(){
			var saveT=document.querySelector("#"+target+"T").value;
			localStorage.setItem(target,saveT);
			document.querySelector("#"+target+" span.msg").innerHTML="\""+saveT+"\"で保存しました";
		}
	})(target)
	document.querySelector("#"+target+"T").addEventListener("keyup",func);
}
function updateContextMenu(flag){
	//option.htmlのupdateContextMenuを
	//background.htmlに送る
	chrome.extension.sendRequest({
			action:"updateContextMenu",
			args  :[flag]
		},function(response){
			//特にエラー処理は無し
		}
	);
}
