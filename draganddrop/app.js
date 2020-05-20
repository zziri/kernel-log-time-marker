
// function sleep(t) {
//     return new Promise(resolve => setTimeout(resolve, t));
// }

const DATE_REG_EXP = /[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1]) (2[0-3]|[01][0-9]):[0-5][0-9]:[0-5][0-9]/;
const KERNEL_TIME_REG_EXP = /\[\s*[0-9]*\.[0-9]*\]/g;
const TIME_REG_EXP = /\s*[0-9]*\.[0-9]*/g;

function printFileText(file) {
    let texts = [];
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

function makeList(content) {
    return content.split('\n');
}

function isStartKernelLog(log) {
    // 커널 로그 시작 지점인지 판단해서 반환
    log = log.trim();
    return ("KERNEL LOG".in(log) && "(dmesg)".in(log)) || ("kernel log:".in(log));
}

// 로그를 가지고 커널 타임(xxxx.xxxx) 반환
function getKernelTick(log) {
    const kernelTickFormat = log.match(KERNEL_TIME_REG_EXP);
    if (kernelTickFormat === null) {
        return null;
    } else {
        // 커널 Tick 포맷 안의 시간을 나타내는 string만 골라서 반환
        return kernelTickFormat.match(TIME_REG_EXP).trim();
    }
}

// 커널 로그 영역에 
function stamping(list) {
    let startPoint = null;
    for (let i = 0; i < list.length; i++) {
        let log = list[i].trim();
        if (log === "") {
            ret = i;
            list = list.slice(0, i);
            break;
        }
        // 시작 지점 찾기
        if (startPoint === null && log.isHave(DATE_REG_EXP)) {
            if ("!@Sync".in(log) || "UTC".in(log)) {
                startPoint = i;
                console.log(`@stamping: startPoint = ${startPoint}`);
                // 탈출하면 안됨, 끝지점 찾아야함
            }
        }
    }
    // 각 기준점을 기준으로 stamping 시작
    let base = getKernelTick(list[startPoint]);
    
}

function contentModify(fileInfo) {
    // 파일 내용을 문자열 리스트로 get
    let list = makeList(fileInfo.content);
    // 리스트 순회
    for (let i = 0; i < list.length; i++) {
        // 시작 지점인가..?
        console.log(`${i} : ${list[i]}`);
        if (isStartKernelLog(list[i])) {
            i += 1;
            console.log("start stamping at " + i);
            // 해당 지역을 수정해서 반환합니다
            modifiedList = stamping(list.slice(i, list.length));
            // 원래 리스트에도 반영합니다
            for (let j = 0; j < modifiedList; j++) {
                list[i + j + 1] = modifiedList[j];
            }
            // i 값을 건너 뜁니다
            i += (modifiedList.length - 1);
        }
    }
}

function nameModify(fileInfo) {
    if ("(stamped)".in(fileInfo.name)) {
        return;
    }
    fileInfo.name = fileInfo.name.replace(".txt", "(stamped).txt");
}

function fileModify(fileInfo) {
    // To Do :
    contentModify(fileInfo);
    nameModify(fileInfo);

    return fileInfo;
}

function fileModifyAndDownload(file) {
    let fileName = file.name;
    let fileContent = '';
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
    let fileList = [];
    console.log('File(s) dropped');

    // Prevent default behavior (Prevent file from being opened)
    event.preventDefault();
    if (event.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file(s)
        for (let i = 0; i < event.dataTransfer.items.length; i++) {
            // If dropped items aren't files, reject them
            if (event.dataTransfer.items[i].kind === 'file') {
                let file = event.dataTransfer.items[i].getAsFile();
                let temp = event.dataTransfer.items[i].getAsString(function (string) {
                    console.log('temp :');
                    console.log(string);
                });
                console.log('... file[' + i + '].name = ' + file.name);
                fileList.push(file);
            }
        }
    } else {
        // Use DataTransfer interface to access the file(s)
        for (let i = 0; i < event.dataTransfer.files.length; i++) {
            console.log('... file[' + i + '].name = ' + event.dataTransfer.files[i].name);
            fileList.push(event.dataTransfer.files[i]);
        }
    }

    // 파일 수정 후 다운로드까지
    for (let i = 0; i < fileList.length; i++) {
        fileModifyAndDownload(fileList[i]);
    }
}

function dragOverHandler(event) {
    // console.log('File(s) in drop zone');

    // Prevent default behavior (Prevent file from being opened)
    event.preventDefault();
}

function saveToFile_Chrome(fileName, content) {
    let blob = new Blob([content], { type: 'text/plain' });

    objURL = window.URL.createObjectURL(blob);

    // // 이전에 생성된 메모리 해제
    // if (window.__Xr_objURL_forCreatingFile__) {
    //     window.URL.revokeObjectURL(window.__Xr_objURL_forCreatingFile__);
    // }
    // window.__Xr_objURL_forCreatingFile__ = objURL;

    let a = document.createElement('a');

    a.download = fileName;
    a.href = objURL;
    a.click();
}

function addMethod() {
    if (typeof (String.prototype.trim) === "undefined") {
        String.prototype.trim = function () {
            return String(this).replace(/^\s+|\s+$/g, '');
        };
    }

    if (typeof (String.prototype.isHave) === "undefined") {
        String.prototype.isHave = function (substr) {
            return String(this).search(substr) !== -1;
        };
    }

    if (typeof (String.prototype.in) === "undefined") {
        String.prototype.in = function (str) {
            return str.search(String(this)) !== -1;
        };
    }
}

function init() {
    addMethod();
    const dropZone = document.querySelector('#drop_zone');
    dropZone.addEventListener("drop", dropHandler);
    dropZone.addEventListener("dragover", dragOverHandler);
}

init();