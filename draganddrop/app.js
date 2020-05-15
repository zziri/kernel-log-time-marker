
// function sleep(t) {
//     return new Promise(resolve => setTimeout(resolve, t));
// }

function printFileText(file) {
    var texts = [];
    file.text().then(function (text) {
        console.log(text);
        texts.push(text);
    });
    return texts;
}

function fileModify(file){
    
    return {
        name: fileName,
        content: fileContent
    };
}

function fileModifyAndDownload(file){
    file.text().then(function(value){
        
    })
    var rawFile = fileModify(file);
    fileDownload(rawFile);
}

function dropHandler(event) {
    var fileList = [];
    console.log('File(s) dropped');

    // Prevent default behavior (Prevent file from being opened)
    event.preventDefault();
    if (event.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file(s)
        for (var i = 0; i < event.dataTransfer.items.length; i++) {
            // If dropped items aren't files, reject them
            if (event.dataTransfer.items[i].kind === 'file') {
                var file = event.dataTransfer.items[i].getAsFile();
                var temp = event.dataTransfer.items[i].getAsString(function(string){
                    console.log('temp :');
                    console.log(string);
                });
                console.log('... file[' + i + '].name = ' + file.name);
                fileList.push(file);
            }
        }
    } else {
        // Use DataTransfer interface to access the file(s)
        for (var i = 0; i < event.dataTransfer.files.length; i++) {
            console.log('... file[' + i + '].name = ' + event.dataTransfer.files[i].name);
            fileList.push(event.dataTransfer.files[i]);
        }
    }
    // 파일 다운로드(그대로)
    for(var i=0; i<fileList.length; i++){
        modifyAndDownload(fileList[i]);
    }
    // saveToFile_Chrome('파일 이름.txt', '파일 내용')
}

function dragOverHandler(event) {
    // console.log('File(s) in drop zone');

    // Prevent default behavior (Prevent file from being opened)
    event.preventDefault();
}

function saveToFile_Chrome(fileName, content) {
    var blob = new Blob([content], { type: 'text/plain' });

    objURL = window.URL.createObjectURL(blob);

    // // 이전에 생성된 메모리 해제
    // if (window.__Xr_objURL_forCreatingFile__) {
    //     window.URL.revokeObjectURL(window.__Xr_objURL_forCreatingFile__);
    // }
    // window.__Xr_objURL_forCreatingFile__ = objURL;

    var a = document.createElement('a');

    a.download = fileName;
    a.href = objURL;
    a.click();
}

