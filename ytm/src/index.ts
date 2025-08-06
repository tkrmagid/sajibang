import { searchVideo } from "./core/getSearch";
import { getChannel } from "./core/getChannel";
import { getVideo } from "./core/getVideo";
import { getPlaylist } from "./core/getPlaylist";

(async () => {
  // const search = await searchVideo("내손을 잡아");
  // console.log(search);
  // const video = await getVideo("CY9NrL3Szvg");
  // console.log(video);
  // const channel = await getChannel("UC3SyT4_WLHzN7JmHQwKQZww");
  // console.log(channel);
  const playlist = await getPlaylist("PLFHFFYu_hi2bwfiLcrPzDPdbEMJmjyL1P");
  console.log(playlist);
  console.log(playlist.videos[0]);
})();


// 배포용 코드
export * from "./core/getChannel";
export * from "./core/getPlaylist";
export * from "./core/getSearch";
export * from "./core/getVideo";
