
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

function getFileInfo(content, name) {
    return {
        name: name,
        content: content
    };
}

function makeList(content){
    return content.split('\n');
}

function contentModify(fileInfo){
    // fileInfo.content = "modified" + fileInfo.content;
    var list = makeList(fileInfo.content);
    for(var i=0; i<list.length; i++){
        console.log(`${i} : ${list[i]}`);
    }
}

function nameModify(fileInfo){
    // fileInfo.name = "modified" + fileInfo.name;
    
}

function fileModify(fileInfo) {
    // To Do :
    // fileInfo.name = "modified" + fileInfo.name;
    // fileInfo.content = "modified" + fileInfo.content;

    contentModify(fileInfo);
    nameModify(fileInfo);

    return fileInfo;
}

function fileModifyAndDownload(file) {
    var fileName = file.name;
    var fileContent = '';
    file.text()
        .then(function (content) {
            return getFileInfo(content, file.name);
        })
        .then(function (fileInfo) {
            return fileModify(fileInfo);
        })
        .then(function (fileInfo) {
            console.log(fileInfo);
            saveToFile_Chrome(fileInfo.name, fileInfo.content);
        });
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
                var temp = event.dataTransfer.items[i].getAsString(function (string) {
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

    // 파일 수정 후 다운로드까지
    for (var i = 0; i < fileList.length; i++) {
        fileModifyAndDownload(fileList[i]);
    }
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

function init() {
    const dropZone = document.querySelector('#drop_zone');
    dropZone.addEventListener("drop", dropHandler);
    dropZone.addEventListener("dragover", dragOverHandler);
}

init();