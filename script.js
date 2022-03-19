let taskListElem; // どこからでも読み書きできるように外側に変数を移動

let tasks = new []();
window.addEventListener("load", function () {
  // リストを取得
  taskListElem = document.querySelector("ul");
  // タスクを追加

  // LocalStorageから配列を読み込む
  loadTasks();

  // 描画
  renderTasks();
});

function renderTasks() {
  // ul要素の中身をクリア
  taskListElem.innerHTML = "";

  let numOfCompletedTasks = 0;
  // 操作された内容で再度li要素を追加
  for (let task of tasks) {
    // リストの項目を作成
    let taskElem = document.createElement("li");
    taskElem.innerText = task.name;

    // 項目をダブルクリックされたときの動作を設定
    taskElem.addEventListener("dblclick", function () {
      // リストの項目をダブルクリックされたときは、タスクを削除
      deleteTask(task.name); // 【変更点】
    });

    // 項目をクリックされたときの動作を設定
    taskElem.addEventListener("click", function () {
      // リストの項目をクリックされたときは、タスクの完了状態をトグル
      toggleTaskComplete(task.name);
    });

    // タスクの完了状態に応じて項目に取り消し線を引く
    if (task.isCompleted) {
      taskElem.style.textDecorationLine = "line-through";
      numOfCompletedTasks++;
    } else {
      taskElem.style.textDecorationLine = "none";
    }

    // 期限表示を作成
    let taskDueDateElem = document.createElement("span");
    taskDueDateElem.style.fontSize = "0.8rem";
    taskDueDateElem.style.fontStyle = "italic";
    taskDueDateElem.style.marginLeft = "1rem";
    if (task.dueDate) {
      taskDueDateElem.innerText = task.dueDate;
    } else {
      taskDueDateElem.innerText = "";
    }

    // 期限に応じて文字色を変える
    compareDueDate(task, taskDueDateElem);

    // 期限の残日数を表示する
    let taskRemainingDaysElm = document.createElement("span");
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
      taskRemainingDaysElm.innerText = "残り日数:" + taskRemainingDays + "日";
    } else {
      taskRemainingDaysElm.innerText = "";
    }

    taskRemainingDaysElm.style.marginLeft = "1rem";

    // 項目に対し、期限表示を追加
    taskElem.appendChild(taskDueDateElem);

    // 項目に対し、残日数を追加
    taskElem.appendChild(taskRemainingDaysElm);

    // リストに対し、項目を追加
    taskListElem.appendChild(taskElem);
  }

  // 全タスクの件数を更新
  let numOfTasksElm = document.querySelector("#numOfTasks");
  numOfTasksElm.innerText = tasks.length;
  // 完了済みの件数を更新
  let numOfCompletedTasksElm = document.querySelector("#numOfCompletedTasks");
  numOfCompletedTasksElm.innerText = numOfCompletedTasks;

  // 期日に応じて文字色を変える
  function compareDueDate(task, taskDueDateElem) {
    let nowDate = new Date();
    let taskDate = new Date(task.dueDate);
    if (nowDate.toLocaleDateString() == taskDate.toLocaleDateString()) {
      taskDueDateElem.style.color = "#f9ca24";
    } else if (nowDate > taskDate) {
      taskDueDateElem.style.color = "#EA2027";
    } else {
      taskDueDateElem.style.color = "black";
    }
  }
}

function addTask(taskName, taskDueDate) {
  let isDuplicate = false;

  for (let task of tasks) {
    if (task.name == taskName) {
      isDuplicate = true;
    }
  }

  if (isDuplicate) {
    // 配列にすでに同じ名前の項目がある
    alert("すでに登録済みです");
    return;
  }
  // 配列に対し、項目を追加　【変更点】
  tasks.push({
    name: taskName,
    isCompleted: false,
    dueDate: taskDueDate,
  });
  // LocalStorage へ配列を保存
  saveTasks();

  // 配列からリストを再出力
  renderTasks();

  // フォームをリセット
  let taskFormElm = document.querySelector("#taskForm");
  taskFormElm.reset();
}

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
  let jsonString = window.localStorage.getItem("tasks");
  if (jsonString) {
    tasks = JSON.parse(jsonString);
  }
}

function saveTasks() {
  let jsonString = JSON.stringify(tasks);
  window.localStorage.setItem("tasks", jsonString);
}

function csvExport() {}