
// function sleep(t) {
//     return new Promise(resolve => setTimeout(resolve, t));
// }

const DATE_REG_EXP = /(20|19)[0-9]{2}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1]) (2[0-3]|[01][0-9]):[0-5][0-9]:[0-5][0-9](\.[0-9]*)?/;
const KERNEL_TIME_REG_EXP = /\[\s*[0-9]*\.[0-9]*\]/g;
const TIME_REG_EXP = /\s*[0-9]*\.[0-9]*/g;

function printList(list) {
    console.log("--------------------------------------- printing list start ---------------------------------------");
    for (let i = 0; i < list.length; i++) {
        console.log(list[i]);
    }
    console.log("--------------------------------------- printing list end ---------------------------------------");
}

function getFileInfo(content, name) {
    return {
        name: name,
        content: content
    };
}

function isStartKernelLog(log) {
    // 커널 로그 시작 지점인지 판단해서 반환
    log = log.trim();
    return ("KERNEL LOG".in(log) && "(dmesg)".in(log)) || ("kernel log:".in(log));
}

// 로그를 가지고 커널 타임(xxxx.xxxx) 반환 (실수형 데이터로 반환)
function getKernelTick(log) {
    const kernelTickFormat = log.match(KERNEL_TIME_REG_EXP)[0];
    if (kernelTickFormat === null) {
        return null;
    } else {
        // 커널 Tick 포맷 안의 시간을 나타내는 string만 골라서 반환
        return Number(kernelTickFormat.match(TIME_REG_EXP)[0].trim());
    }
}

// 로그(string)를 가지고 시간 정보 반환
function getSyncTime(log) {
    // let timeStr = log.slice(log.search(DATE_REG_EXP), log.length).trim();
    let timeStr = log.match(DATE_REG_EXP)[0].trim();
    if ("UTC".in(log)) {
        timeStr += " UTC";
    }
    return new Date(Date.parse(timeStr));
}

// 커널 로그 영역에 
function stamping(list) {
    let startPoint = null;
    // 끝 점과 시작점을 세팅합니다
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
                // 탈출하면 안됨, 끝지점 찾아야함
            }
        }
    }
    // 시작점을 기준으로 stamping 시작, start point 못찾으면 없는것이므로 시간 찍기 불가
    if (startPoint === null)
        return [];
    // 기준 tick과 기준 sync time을 세팅
    let baseTick = getKernelTick(list[startPoint]);
    let baseSyncTime = getSyncTime(list[startPoint]);
    // 위로 올라가면서 찍기
    for (let i = startPoint - 1; i >= 0; i--) {

    }
    // 기준점 아래 라인부터 내려가면서 찍기(UTC 혹은 Sync 나타나면 base 수정)
    return list;
}

function getLogBody(contentList, startExp, endExp) {
    let i;
    let ret = {
        start: 0,
        end: 0,
        content: []
    };
    for (i = 0; i < contentList.length; i++) {
        let log = contentList[i].trim();
        if (startExp.test(log)) {
            ret.start = i;
            break;
        }
    }
    for ( ;i < contentList.length; i++) {
        let log = contentList[i].trim();
        if (endExp.test(log)) {
            ret.end = i;
            break;
        }
        ret.content.push(log);
    }
    return ret;
}

function contentModify(fileInfo) {
    let contentList = fileInfo.content.toList();
    let startExp = /^(\-)*(\s)*(KERNEL LOG)(\s)*(.)*(dmesg)(.)*(\-)*$/;      // ------ KERNEL LOG (dmesg) ------
    let endExp = /^(\s)*$/;                                                  // 공백만 있거나 그마저 없음
    let kernelLogBody = getLogBody(contentList, startExp, endExp);
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

// 이 앱의 메인과 같은 함수, 파일 수정과 다운로드
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

// 드래그 앤 드롭 했을 때 불리는 이벤트 핸들러
function dropHandler(event) {
    let fileList = [];
    // console.log('File(s) dropped');

    // Prevent default behavior (Prevent file from being opened)
    event.preventDefault();
    if (event.dataTransfer.items) {
        // Use DataTransferItemList interface to access the file(s)
        for (let i = 0; i < event.dataTransfer.items.length; i++) {
            // If dropped items aren't files, reject them
            if (event.dataTransfer.items[i].kind === 'file') {
                let file = event.dataTransfer.items[i].getAsFile();
                // console.log('... file[' + i + '].name = ' + file.name);
                fileList.push(file);
            }
        }
    } else {
        // Use DataTransfer interface to access the file(s)
        for (let i = 0; i < event.dataTransfer.files.length; i++) {
            // console.log('... file[' + i + '].name = ' + event.dataTransfer.files[i].name);
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
    // string.trim()
    if (typeof (String.prototype.trim) === "undefined") {
        String.prototype.trim = function () {
            return String(this).replace(/^\s+|\s+$/g, '');
        };
    }
    // string.isHave(substr)
    if (typeof (String.prototype.isHave) === "undefined") {
        String.prototype.isHave = function (substr) {
            return String(this).search(substr) !== -1;
        };
    }
    // substr.in(string)
    if (typeof (String.prototype.in) === "undefined") {
        String.prototype.in = function (str) {
            return str.search(String(this)) !== -1;
        };
    }
    // string.toList()
    if (typeof (String.prototype.toList) === "undefined") {
        String.prototype.toList = function () {
            return String(this).split('\n');
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