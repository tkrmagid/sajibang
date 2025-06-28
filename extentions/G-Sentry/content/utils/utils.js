const PREFIX = "[G-Sentry]";
console.log(PREFIX,"loading...");


// 사이트에서 정보확인용
const USER = {
  help() {
    console.log(PREFIX,`명령어:\n${
      [
        [ "help", "전체 명령어" ],
        [ "DB.all", "DB전체 출력" ],
        [ "DB.clear", "DB전체 삭제" ],
        [ "DB.get [key]", "DB [key] 데이터 가져오기" ],
      ].map(v => `${PREFIX} - ${v[0]} : ${v[1]}`).join("\n")
    }`);
  },
  DB: {
    all() {
      chrome.storage.local.getKeys().then((keys) => {
        chrome.storage.local.get(keys, (items) => {
          console.log(PREFIX,`DB전체 출력: 총${Object.keys(items).length}개`);
          Object.keys(items).forEach((item, index) => {
            console.log(PREFIX,`${index+1}. ${item}: ${
              typeof(items[item]) === "boolean" ? items[item] ? "True" : "False"
              : typeof(items[item]) === "object" ? items[item].map(v => JSON.stringify(v)).join(", ")
              : items[item]
            }`);
          });
        });
      });
    },
    clear() {
      chrome.storage.local.clear().then(() => {
        console.log(PREFIX,"DB전체 삭제 완료!");
      });
    },
    get(key) {
      if (!key?.trim()) return console.error(PREFIX,"key를 찾을수 없습니다.");
      chrome.storage.local.getKeys().then((keys) => {
        if (!keys.includes(key.trim())) return console.error(PREFIX,`KEY목록: [ ${keys.map(v => `"${v}"`).join(", ")} ]`);
        chrome.storage.local.get(key, (items) => {
          console.log(PREFIX,`${key}:`, items[key]);
        });
      });
    }
  }
};

/**
 * custom event
 * @param {string[]} args event args
 * @param {any} data any all
 */
function userEvent(args, data) {
  try {
    if (args[0].toLocaleLowerCase() === "help") return USER.help();
    if (args[0] === "DB") {
      if (args[1] === "all") return USER.DB.all();
      if (args[1] === "clear") return USER.DB.clear();
      if (args[1] === "get") return USER.DB.get(args[2]);
    }
    return console.error(PREFIX,"event를 찾을수 없습니다.");
  } catch (err) {
    console.error("userEvent오류:", err);
  }
}

/**
사이트에서 사용법

window.dispatchEvent(new CustomEvent("g-sentry", {
  detail: { event: "DB.All" }
}));

 */