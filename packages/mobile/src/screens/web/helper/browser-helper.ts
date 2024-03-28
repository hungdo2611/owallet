import images from "@src/assets/images";

export const explorerData = [
  {
    images: images.img_scan,
    logo: images.dapps_scan_logo,
    title: "OraiScan",
    subTitle: "The Oraichain blockchain explorer",
  },
];
export const aiData = [
  {
    images: images.img_defi_lens,
    logo: images.dapps_defi_logo,
    title: "DeFi Lens",
    subTitle: "Simplify your Token Research with AI",
  },
  {
    images: images.img_chatbot,
    logo: images.dapps_defi_logo,
    title: "LLM Chatbot",
    subTitle: "Natural language layer for Web3 Business",
  },
  {
    images: images.img_airight,
    logo: images.dapps_airight_logo,
    title: "aiRight",
    subTitle: "Marketplace of Generative AI",
  },
];
export const defiData = [
  {
    images: images.img_oraidex,
    logo: images.dapps_dex_logo,
    title: "OraiDEX",
    subTitle: "Universal swap, Bridge and earn tokens",
  },

  {
    images: images.img_orderbook,
    logo: images.dapps_orderbook_logo,
    title: "Orderbook",
    subTitle: "Decentralized spot trading",
  },
  {
    images: images.img_fu,
    logo: images.dapps_future_logo,
    title: "Futures",
    subTitle: "Derivatives Trading",
  },
  {
    images: images.img_orchai,
    logo: images.dapps_orchai_logo,
    title: "Orchai",
    subTitle: "Low-code DeFi Management",
  },
];
export const dataAll = [...defiData, ...aiData, ...explorerData];
export const getFavicon = (url) => {
  const serviceGG =
    "https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&size=32&url=";
  if (!url) return serviceGG + "https://orai.io";
  return serviceGG + url;
};
export const dataBookMarks = [
  {
    url: getFavicon("https://oraidex.io"),
    name: "oraidex",
    link: "https://oraidex.io",
  },
  {
    url: getFavicon("https://orai.io"),
    name: "oraichain",
    link: "https://orai.io",
  },
];