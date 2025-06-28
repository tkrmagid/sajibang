const toastDIV = document.getElementById("toast");
const toastMsg = document.getElementById("toastMsg");
let toastTimeout = null;

const jsToggle = document.getElementById("jsToggle");
const choToggle = document.getElementById("choToggle");

const choContainer = document.getElementById("choContainer")
const saveBtn = document.getElementById("saveBtn");
const resetBtn = document.getElementById("resetBtn");
const choListContainer = document.getElementById("choListContainer");

document.getElementById("reloadBtn").addEventListener("click", () => {
  console.log("새로고침!");
  chrome.runtime.reload();
});

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const jsToggleValue = await chrome.storage.local.get("jsToggle").then(v => !v?.jsToggle ? false : v.jsToggle);
    const choToggleValue = await chrome.storage.local.get("choToggle").then(v => !v?.choToggle ? false: v.choToggle);
    jsToggle.checked = jsToggleValue;
    choToggle.checked = choToggleValue;
    jsToggle.dispatchEvent(new Event("change", { bubbles: true }));
    choToggle.dispatchEvent(new Event("change", { bubbles: true }));
  } catch (err) {
    throw new Error("초기값로딩오류:", err);
  }
});

/** @type {{ rank: string; name: string; cho: string[]; }[]} */
var personList = [];

jsToggle.addEventListener('change', () => {
  try {
    chrome.storage.local.set({ jsToggle: jsToggle.checked }).then(() => {
      if (jsToggle.checked) {
        console.log("JS실행: ON");
        showToast("JS를 적용하려면 새로고침해주세요.");
      } else {
        console.log("JS실행: OFF");
      }
    });
  } catch (err) {
    throw new Error("JS실행변경오류:", err);
  }
});
choToggle.addEventListener('change', () => {
  try {
    chrome.storage.local.set({ choToggle: choToggle.checked }).then(() => {
      if (choToggle.checked) {
        console.log("초성검색: ON");
        choInit();
      } else {
        console.log("초성검색: OFF");
        choListContainer.innerHTML = "";
        choContainer.style.display = "none";
      }
    });
  } catch (err) {
    throw new Error("초성검색변경오류:", err);
  }
});

saveBtn.addEventListener("click", () => choSave());
resetBtn.addEventListener("click", () => choInit());

async function choSave() {
  try {
    showToast("저장중...");
    await chrome.storage.local.set({ nameList: personList });
    showToast("저장완료");
  } catch (err) {
    console.error("초성저장 오류:", err);
    showToast("오류발생!");
  }
}

/**
 * 이름목록 불러오기
 * @returns {Promise<{ stauts: boolean; nameList: string[]; }>}
 */
const getList = () => chrome.storage.local.get("nameList").then(({ nameList }) => {
  if (!nameList) throw new Error("이름목록이 없습니다.");
  return { status: true, nameList: nameList };
}).catch((err) => {
  console.log(PREFIX,"이름목록 불러오기 오류:", err);
  return {stauts: false, nameList: [] };
});

async function choInit() {
  choListContainer.innerHTML = "<p style='text-align: center; font-size: 18px;'>로딩중...</p>";
  choContainer.style.display = "block";
  const data = await getList();
  if (!data.stauts) {
    choToggle.checked = false;
    choToggle.dispatchEvent(new Event("change", { bubbles: true }));
    showToast("이름목록을 불러올수 없습니다.");
    return;
  }
  personList = data.nameList;
  choRender();
}

function choRender() {
  let childs = [];
  personList.forEach((person, personIndex) => {
    const personDIV = document.createElement("div");
    personDIV.setAttribute("key", personIndex+1);
    personDIV.className = "person";
    
    const nameEl = document.createElement("div");
    nameEl.className = "name";
    nameEl.textContent = `${person.rank} ${person.name}`;
    personDIV.appendChild(nameEl);
    
    if (person.cho.length === 0) person.cho.push("");
    
    person.cho.forEach((cho, choIndex) => {
      const groupDIV = document.createElement("div");
      groupDIV.setAttribute("key", choIndex+1);
      groupDIV.className = "cho-input-group";
      
      const input = document.createElement("input");
      input.type = "text";
      input.value = cho;
      input.addEventListener("input", (e) => {
        personList[personIndex].cho[choIndex] = e.target.value?.trim() || "";
      });
      groupDIV.appendChild(input);
      
      if (choIndex === 0) {
        const addBtn = document.createElement("button");
        addBtn.textContent = "+";
        addBtn.onclick = () => {
          personList[personIndex].cho.push("");
          choRender();
        }
        groupDIV.appendChild(addBtn);
      }

      const removeBtn = document.createElement("button");
      removeBtn.textContent = "-";
      removeBtn.onclick = () => {
        if (personList[personIndex].cho.length > 1) {
          personList[personIndex].cho.splice(choIndex, 1);
          choRender();
        } else {
          showToast("초성 1개는 필수입니다.");
        }
      }
      if (choIndex !== 0) groupDIV.appendChild(removeBtn);

      personDIV.appendChild(groupDIV);
    });

    childs.push(personDIV);
  });
  choListContainer.innerHTML = "";
  childs.forEach(child => choListContainer.appendChild(child));
}

function showToast(msg="알림", duration=2000) {
  toastMsg.textContent = msg;
  if (toastTimeout !== null) clearTimeout(toastTimeout);
  toastDIV.classList.add("show");
  toastTimeout = setTimeout(() => {
    toastTimeout = null;
    toastDIV.classList.remove("show");
  }, duration);
}