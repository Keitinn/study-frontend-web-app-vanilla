let taskListElem; // どこからでも読み書きできるように外側に変数を移動
let isEdit = false;
let editTaskName = '';
let tasks = [];
let sortMode = '';
let overlay;
let clickArea;
let fireFlg = 0;
let remainingSeconde = -1;

window.addEventListener('load', function () {
  let cancelBtnElm = document.querySelector('#editCancelBtn');
  cancelBtnElm.style.display = 'none';
  // リストを取得
  taskListElem = document.querySelector('ul');

  overlay = document.getElementById('overlay');
  // 指定した要素に対して上オーバーレイ切り替えを実行するクリックイベントを設定
  clickArea = document.getElementsByClassName('overlay-event');
  for (let i = 0; i < clickArea.length; i++) {
    clickArea[i].addEventListener('click', overlayToggle, false);
  }

  const overlayInner = document.getElementById('overlay-inner');
  overlayInner.addEventListener('click', stopEvent, false);

  // LocalStorageから配列を読み込む
  loadTasks();

  // 1秒ごとに実行
  setInterval(() => {
    remainingSeconde = getClosestDeadlineTaskRemainingSeconds();
    // 描画
    renderTasks();
  }, 100);
});

function renderTasks() {
  // ul要素の中身をクリア
  taskListElem.innerHTML = '';

  let numOfCompletedTasks = 0;
  let index = 0;
  let closestDeadlineTaskIndex = getClosestDeadlineTaskIndex();
  // 操作された内容で再度li要素を追加
  for (let task of tasks) {
    // リストの項目を作成
    let taskElem = document.createElement('li');
    taskElem.innerText = task.name;

    // 編集ボタン
    let editButtonElm = document.createElement('button');
    editButtonElm.innerHTML = '<i class="bi bi-pencil"></i>';
    editButtonElm.setAttribute('type', 'button');
    editButtonElm.className = 'btn btn-danger dtn-sm';
    editButtonElm.id = 'editBtn';

    // 項目に編集ボタンを追加
    taskElem.prepend(editButtonElm);

    editButtonElm.addEventListener('click', function () {
      setSelectTask(task.name, task.dueDate);
      isEdit = true;
      event.stopPropagation();
    });

    // 項目をダブルクリックされたときの動作を設定
    taskElem.addEventListener('dblclick', function () {
      // リストの項目をダブルクリックされたときは、タスクを削除
      deleteTask(task.name); // 【変更点】
    });

    // 項目をクリックされたときの動作を設定
    taskElem.addEventListener('click', function () {
      // リストの項目をクリックされたときは、タスクの完了状態をトグル
      toggleTaskComplete(task.name);
    });

    // タスクの完了状態に応じて項目に取り消し線を引く
    if (task.isCompleted) {
      taskElem.style.textDecorationLine = 'line-through';
      numOfCompletedTasks++;
    } else {
      taskElem.style.textDecorationLine = 'none';
    }

    // 期限表示を作成
    let taskDueDateElem = document.createElement('span');
    taskDueDateElem.style.fontSize = '0.8rem';
    taskDueDateElem.style.fontStyle = 'italic';
    taskDueDateElem.style.marginLeft = '1rem';
    if (task.dueDate) {
      taskDueDateElem.innerText = task.dueDate;
    } else {
      taskDueDateElem.innerText = '';
    }

    // 期限に応じて文字色を変える
    compareDueDate(task, taskDueDateElem);

    // 期限の残日数を表示する
    let taskRemainingDaysElm = document.createElement('span');
    let nowDateTime = new Date().getTime();
    let taskDateTime = new Date(task.dueDate).getTime();

    let nowDate = new Date();
    let taskDate = new Date(task.dueDate);

    let dateTimeDifference = taskDateTime - nowDateTime + 86400000;
    let taskRemainingDays = dateTimeDifference / 86400000;
    taskRemainingDays = Math.floor(taskRemainingDays);

    let isOverdue =
      nowDateTime - taskDateTime < 0 ||
      nowDate.toLocaleDateString() == taskDate.toLocaleDateString();

    if (task.dueDate && isOverdue) {
      taskRemainingDaysElm.innerText = '残り日数:' + taskRemainingDays + '日';
    } else {
      taskRemainingDaysElm.innerText = '';
    }

    if (index == closestDeadlineTaskIndex) {
      taskRemainingDaysElm.innerText = '残り:' + dateTimeDifference / 1000 + '秒';
      taskRemainingDaysElm.style.color = 'red';
      taskRemainingDaysElm.style.fontSize = '1.5rem';
    }

    taskRemainingDaysElm.style.marginLeft = '1rem';

    // 項目に対し、期限表示を追加
    taskElem.appendChild(taskDueDateElem);

    // 項目に対し、残日数を追加
    taskElem.appendChild(taskRemainingDaysElm);

    // リストに対し、項目を追加
    taskListElem.appendChild(taskElem);

    index++;
  }

  // 全タスクの件数を更新
  let numOfTasksElm = document.querySelector('#numOfTasks');
  numOfTasksElm.innerText = tasks.length;
  // 完了済みの件数を更新
  let numOfCompletedTasksElm = document.querySelector('#numOfCompletedTasks');
  numOfCompletedTasksElm.innerText = numOfCompletedTasks;

  // 期日に応じて文字色を変える
  function compareDueDate(task, taskDueDateElem) {
    let nowDate = new Date();
    let taskDate = new Date(task.dueDate);
    if (nowDate.toLocaleDateString() == taskDate.toLocaleDateString()) {
      taskDueDateElem.style.color = '#f9ca24';
    } else if (nowDate > taskDate) {
      taskDueDateElem.style.color = '#EA2027';
    } else {
      taskDueDateElem.style.color = 'black';
    }
  }
}

// タスクを追加
function addTask(taskName, taskDueDate) {
  if (!taskName) {
    alert('タスク名が設定されていません。');
    return;
  }

  for (let task of tasks) {
    if (task.name == taskName && task.name != editTaskName) {
      alert('すでに登録済みです');
      return;
    }
  }

  if (isEdit) {
    for (let task of tasks) {
      if (task.name == editTaskName) {
        task.name = taskName;
        task.dueDate = taskDueDate;

        // 編集中のタスク名をクリア
        let dispEditTaskElm = document.querySelector('#editTaskName');
        dispEditTaskElm.innerText = '';

        // キャンセルボタンを非表示
        let cancelBtnElm = document.querySelector('#editCancelBtn');
        cancelBtnElm.style.display = 'none';

        editTaskName = '';
        isEdit = false;
        continue;
      }
    }
  } else {
    // 配列に対し、項目を追加　【変更点】
    tasks.push({
      name: taskName,
      isCompleted: false,
      dueDate: taskDueDate,
    });
  }

  // LocalStorage へ配列を保存
  saveTasks();

  // 配列からリストを再出力
  renderTasks();

  // フォームをリセット
  let taskFormElm = document.querySelector('#taskForm');
  taskFormElm.reset();
}

// ダブルクリックした際にタスクを削除する
function deleteTask(taskName) {
  // 【変更点】
  // 新しい配列を用意
  let newTasks = [];
  // 現状の配列を反復
  for (let task of tasks) {
    // 【変更点】
    if (task.name != taskName) {
      // 【変更点】
      // 削除したいタスク名でなければ、新しい配列へ追加
      newTasks.push(task); // 【変更点】
    }
  }
  // 現状の配列を新しい配列で上書き
  tasks = newTasks;
  // LocalStorage へ配列を保存
  saveTasks();
  // 配列からリストを再出力
  renderTasks();
}

// タスククリック時に完了状態未完了状態をトグルする
function toggleTaskComplete(taskName) {
  // 現状の配列を反復
  for (let task of tasks) {
    if (task.name == taskName) {
      // 対象のタスク名ならば、完了状態をトグル
      task.isCompleted = !task.isCompleted;
    }
  }
  // LocalStorage へ配列を保存
  saveTasks();
  // 配列からリストを再出力
  renderTasks();
}

function loadTasks() {
  let jsonString = window.localStorage.getItem('tasks');
  if (jsonString) {
    tasks = JSON.parse(jsonString);
  }
}

function saveTasks() {
  let jsonString = JSON.stringify(tasks);
  window.localStorage.setItem('tasks', jsonString);
}

// CSV出力機能
function csvExport() {
  // タスクが登録されていない場合、警告を出す
  if (tasks.length == 0) {
    alert('出力するタスクがありません。');
    return;
  }
  let fileName = 'export.csv';
  let outputString = 'タスク名,期日,進捗状況\n';
  const bom = new Uint8Array([0xef, 0xbb, 0xbf]);

  for (let task of tasks) {
    let completedString = '';
    if (task.isCompleted) {
      completedString = '済';
    } else {
      completedString = '未';
    }
    outputString = outputString + task.name + ',' + task.dueDate + ',' + completedString + '\n';
  }
  const blob = new Blob([bom, outputString], { type: 'text/csv' });
  //IE10/11用(download属性が機能しないためmsSaveBlobを使用）
  if (window.navigator.msSaveBlob) {
    window.navigator.msSaveBlob(blob, fileName);
  } else {
    //BlobからオブジェクトURLを作成する
    const url = (window.URL || window.webkitURL).createObjectURL(blob);
    //ダウンロード用にリンクを作成する
    const download = document.createElement('a');
    //リンク先に上記で生成したURLを指定する
    download.href = url;
    //download属性にファイル名を指定する
    download.download = fileName;
    //作成したリンクをクリックしてダウンロードを実行する
    download.click();
    //createObjectURLで作成したオブジェクトURLを開放する
    (window.URL || window.webkitURL).revokeObjectURL(url);
  }
}

// CSV取込メソッド
function csvImport() {
  const file = event.target.files[0]; // File オブジェクト
  if (file.type && file.type != 'text/csv' && file.type != 'application/vnd.ms-excel') {
    window.alert('CSVファイルではありません。');
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    console.log(reader.result);
    let importTasks = reader.result.split(/\r\n|\r|\n/);
    for (let rawTask of importTasks) {
      let taskArray = rawTask.split(',');
      if (taskArray.length != 3) {
        continue;
      }
      let isCompleted = taskArray[2] == '済';
      let task = {
        name: taskArray[0],
        dueDate: taskArray[1],
        isCompleted: isCompleted,
      };
      if (task.name == 'タスク名') {
        continue;
      }
      let taskIndex = getIndexTasks(task.name);
      if (taskIndex != -1) {
        tasks[taskIndex] = task;
      } else {
        tasks.push(task);
      }
    }
    saveTasks();
    renderTasks();
  };

  reader.readAsText(file);
}

// 引数のタスク名と同一のタスクの配列内のインデックスを返す
// 存在しない場合は-1を返す
function getIndexTasks(taskName) {
  let index = 0;
  for (let task of tasks) {
    if (task.name == taskName) {
      return index;
    }
    index++;
  }
  return -1;
}

// 引数のタスク名をフォームにセットする
function setSelectTask(taskName, taskDueDate) {
  let taskNameFormElm = document.querySelector('#taskName');
  let taskDueDateElm = document.querySelector('#taskDueDate');

  editTaskName = taskName;

  // 編集中のタスク名を設定
  let dispEditTaskElm = document.querySelector('#editTaskName');
  dispEditTaskElm.innerText = editTaskName + 'を編集中';

  // キャンセルボタンを表示
  let cancelBtnElm = document.querySelector('#editCancelBtn');
  cancelBtnElm.style.display = 'inline-block';

  taskNameFormElm.value = taskName;
  taskDueDateElm.value = taskDueDate;
}

// タスクの編集をキャンセルする
function editCancel() {
  // 編集中のタスク名をクリア
  editTaskName = '';

  // フォームの内容をクリア
  let taskNameFormElm = document.querySelector('#taskName');
  let taskDueDateElm = document.querySelector('#taskDueDate');
  taskNameFormElm.value = '';
  taskDueDateElm.value = '';

  // 画面に表示する編集中のタスク名をクリア
  let dispEditTaskElm = document.querySelector('#editTaskName');
  dispEditTaskElm.innerText = '';

  // キャンセルボタンを非表示
  let cancelBtnElm = document.querySelector('#editCancelBtn');
  cancelBtnElm.style.display = 'none';
  isEdit = false;
}

// タスク名でソート
function sortTaskName() {
  if (sortMode != '' && sortMode == 'nameAsc') {
    tasks.sort((a, b) => b.name.localeCompare(a.name, 'ja'));

    sortMode = 'nameDesc';
  } else {
    tasks.sort((a, b) => a.name.localeCompare(b.name, 'ja'));

    sortMode = 'nameAsc';
  }
  saveTasks();
  renderTasks();
}

// タスクの期日でソートする
function sortTaskDueDate() {
  if (sortMode != '' && sortMode == 'dueAsc') {
    tasks.sort((a, b) => {
      if (!a.dueDate) return -1;
      if (!b.dueDate) return 1;
      if (new Date(b.dueDate).getTime() < new Date(a.dueDate).getTime()) return -1;
      if (new Date(b.dueDate).getTime() > new Date(a.dueDate).getTime()) return 1;
      return 0;
    });
    sortMode = 'dueDesc';
  } else {
    tasks.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      if (new Date(a.dueDate).getTime() < new Date(b.dueDate).getTime()) return -1;
      if (new Date(a.dueDate).getTime() > new Date(b.dueDate).getTime()) return 1;
      return 0;
    });
    sortMode = 'dueAsc';
  }

  saveTasks();
  renderTasks();
}

// すべてのタスクを削除する
function deleteAllTasks() {
  tasks.splice(0);
  saveTasks();
  renderTasks();
}

// オーバーレイ切り替え
function overlayToggle() {
  overlay.classList.toggle('overlay-on');
  deleteAllTasks();
  fire();
}

// イベントに対してバブリングを停止
function stopEvent(event) {
  event.stopPropagation();
}

// 爆破
function fire() {
  let bombBlackElm = document.getElementById('bombBlackDiv');
  let ledgeElm = document.getElementById('ledgeSpan');
  let fuseElm = document.getElementById('fuseDiv');
  let dustElm = document.getElementById('dustDiv');
  if (fireFlg == 0) {
    bombBlackElm.classList.add('bomb');
    bombBlackElm.classList.add('black');
    ledgeElm.classList.add('ledge');
    fuseElm.classList.add('fuse');
    dustElm.classList.add('dust');
    fireFlg = 1;
  } else {
    bombBlackElm.classList.remove('bomb');
    bombBlackElm.classList.remove('black');
    ledgeElm.classList.remove('ledge');
    fuseElm.classList.remove('fuse');
    dustElm.classList.remove('dust');
    fireFlg = 0;
  }
}

// 期日が一番近いタスクのインデックスを返す
// 存在しない場合-1を返す
function getClosestDeadlineTaskIndex() {
  let index = 0;
  let closestDeadlineDateIndex = 0;
  let exists = false;
  let closestDeadlineDate = 0;
  let nowDate = new Date();
  let nowDateTime = nowDate.getTime();

  for (let task of tasks) {
    let taskDate = new Date(task.dueDate);
    let taskDateTime = taskDate.getTime();
    // 期日が切れていないか判定 → Trueのとき期日0日以上
    let isOverdue =
      nowDateTime - taskDateTime < 0 ||
      nowDate.toLocaleDateString() == taskDate.toLocaleDateString();
    if (
      task.dueDate &&
      isOverdue &&
      (closestDeadlineDate == 0 || closestDeadlineDate.getTime() > taskDateTime)
    ) {
      closestDeadlineDate = taskDate;
      closestDeadlineDateIndex = index;
      index++;
      exists = true;
    } else {
      index++;
    }
  }

  // 期日切れしてない一番期日が近いタスクのインデックスを返す
  // 存在しない場合、-1を返す
  if (exists) {
    return closestDeadlineDateIndex;
  }
  return -1;
}

// 一番期日が近いタスクがあと期日まであと何秒か取得する
function getClosestDeadlineTaskRemainingSeconds() {
  let closestDeadlineTaskIndex = getClosestDeadlineTaskIndex();
  if (closestDeadlineTaskIndex == -1) {
    return -1;
  }
}
