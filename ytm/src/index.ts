import { getSearch } from "./core/getSearch";
import { getChannel } from "./core/getChannel";
import { getVideo } from "./core/getVideo";
import { getPlaylist } from "./core/getPlaylist";
import { getSearch as getMusicSearch } from "./core/music/getSearch";
import { getPlaylist as getMusicPlaylist } from "./core/music/getPlaylist";
import { getRecommend as getMusicRecommend } from "./core/music/getRecommend";

(async () => {
  // const search = await getSearch("내손을 잡아");
  // console.log(search);
  // const video = await getVideo("CY9NrL3Szvg");
  // console.log(video);
  // const channel = await getChannel("UC3SyT4_WLHzN7JmHQwKQZww");
  // console.log(channel);
  // const playlist = await getPlaylist("PLFHFFYu_hi2bwfiLcrPzDPdbEMJmjyL1P");
  // console.log(playlist);

  // const musicSearch = await getMusicSearch("내손을잡아");
  // console.log(musicSearch);
  // const musicPlaylist = await getMusicPlaylist("RDCLAK5uy_l7wbVbkC-dG5fyEQQsBfjm_z3dLAhYyvo");
  // console.log(musicPlaylist);
  const musicRecommend = await getMusicRecommend("CY9NrL3Szvg");
  console.log(musicRecommend);
})();


// 배포용 코드
export * from "./core/getChannel";
export * from "./core/getPlaylist";
export * from "./core/getSearch";
export * from "./core/getVideo";
export * as music from "./music";
