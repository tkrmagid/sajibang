import { getInfo } from "./core/getInfo";

(async () => {
  const info = await getInfo("CY9NrL3Szvg");
  console.log(info);
})();