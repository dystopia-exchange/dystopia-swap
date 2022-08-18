import React, { useRef } from "react";
import BtnEnterApp from "../../ui/BtnEnterApp";
import classes from "./home.module.css";
import {useRouter} from "next/router";

const socialLinks = {
  twitter: "https://twitter.com/Coneswap",
  discord: "https://discord.gg/pet7xkwac7",
  telegram: "https://t.me/+h-bgLOoWJS9iNDg9",
  gitbook: "https://docs.cone.exchange/",
  medium: "https://medium.com/@ConeSwap",
};

const HomePage = () => {
  const router = useRouter();
  const layoutRef = useRef(null);
  const pageRef = useRef(null);

  return (
    <div className={classes.wrapper}>
      <div className={classes.row}>
        <div className={classes.column}>
          <p className={classes.title}>Low fees ve(3,3) DEX</p>
          <p className={classes.subtitle}>
            Cone Swap offers users quick, seamless and cheap transactions while
            utilizing strategies to maximize their yield.
          </p>
          <div
            className={classes.buttonEnter}
            onClick={() => router.push("/swap")}
          >
            <BtnEnterApp
              labelClassName={classes.buttonEnterLabel}
              label={"Launch app"}
            />
          </div>
        </div>
        <div className={classes.column}>
          <p className={classes.title2}>0.01% Swapping Fee</p>
          <p className={classes.title2}>Tokenized locks as NFTs</p>
          <p className={classes.title2}>Binance Network</p>

          <div className={classes.layoutPromoSocials}>
            <div className={classes.layoutPromoSocialsLink}>
              <a href={socialLinks.gitbook} target="_blank">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10.8021 17.7698C10.8944 17.77 10.9858 17.7883 11.0711 17.8237C11.1563 17.8592 11.2337 17.9111 11.2989 17.9764C11.3641 18.0418 11.4158 18.1194 11.451 18.2047C11.4862 18.2901 11.5042 18.3815 11.5041 18.4738C11.504 18.5661 11.4857 18.6575 11.4502 18.7428C11.4148 18.828 11.3629 18.9054 11.2975 18.9706C11.2321 19.0358 11.1545 19.0875 11.0692 19.1227C10.9839 19.1579 10.8924 19.176 10.8001 19.1758C10.6137 19.1756 10.435 19.1012 10.3033 18.9692C10.1717 18.8372 10.0978 18.6583 10.0981 18.4718C10.0984 18.2854 10.1727 18.1067 10.3047 17.975C10.4367 17.8434 10.6157 17.7696 10.8021 17.7698ZM21.8261 13.4228C21.7338 13.4228 21.6424 13.4045 21.5571 13.3691C21.4718 13.3337 21.3944 13.2819 21.3292 13.2166C21.2639 13.1512 21.2122 13.0737 21.1769 12.9884C21.1417 12.9031 21.1235 12.8116 21.1236 12.7193C21.1237 12.627 21.1419 12.5356 21.1773 12.4503C21.2127 12.3651 21.2645 12.2876 21.3299 12.2224C21.3952 12.1571 21.4727 12.1054 21.558 12.0701C21.6434 12.0349 21.7348 12.0168 21.8271 12.0168C22.0135 12.017 22.1923 12.0911 22.3241 12.2231C22.4558 12.355 22.5297 12.5339 22.5296 12.7203C22.5295 12.9068 22.4553 13.0855 22.3233 13.2173C22.1914 13.349 22.0126 13.423 21.8261 13.4228V13.4228ZM21.8261 10.5468C21.2497 10.5473 20.697 10.7766 20.2894 11.1842C19.8818 11.5917 19.6526 12.1444 19.6521 12.7208C19.6521 12.9538 19.6911 13.1858 19.7671 13.4118L12.5861 17.2348C12.387 16.9457 12.1206 16.7093 11.8098 16.5461C11.499 16.3829 11.1532 16.2977 10.8021 16.2978C9.9731 16.2978 9.2181 16.7728 8.8521 17.5138L2.4011 14.1118C1.7191 13.7538 1.2091 12.6318 1.2631 11.6098C1.2911 11.0768 1.4751 10.6628 1.7561 10.5028C1.9341 10.4028 2.1481 10.4108 2.3761 10.5298L2.4181 10.5528C4.1281 11.4528 9.7221 14.3998 9.9581 14.5088C10.3211 14.6778 10.5231 14.7458 11.1431 14.4518L22.7071 8.43782C22.8771 8.37382 23.0751 8.21082 23.0751 7.96382C23.0751 7.62182 22.7211 7.48682 22.7201 7.48682C22.0621 7.17182 21.0511 6.69882 20.0651 6.23682C17.9571 5.24982 15.5681 4.13182 14.5191 3.58182C13.6131 3.10782 12.8841 3.50782 12.7541 3.58782L12.5021 3.71282C7.7801 6.04782 1.4601 9.17782 1.1001 9.39682C0.457104 9.78882 0.0581037 10.5698 0.00610369 11.5388C-0.0738963 13.0758 0.709104 14.6788 1.8301 15.2658L8.6521 18.7838C8.72725 19.3006 8.98582 19.7731 9.38057 20.115C9.77532 20.4568 10.2799 20.6453 10.8021 20.6458C11.3724 20.6449 11.9196 20.4201 12.326 20.0199C12.7323 19.6197 12.9654 19.0761 12.9751 18.5058L20.4891 14.4328C20.8691 14.7308 21.3421 14.8938 21.8261 14.8938C22.4025 14.8933 22.9552 14.6641 23.3628 14.2565C23.7704 13.8489 23.9996 13.2962 24.0001 12.7198C23.9996 12.1434 23.7704 11.5907 23.3628 11.1832C22.9552 10.7756 22.4025 10.5463 21.8261 10.5458"
                    fill="#779BF4"
                  />
                </svg>
              </a>
            </div>
            <div className={classes.layoutPromoSocialsLink}>
              <a href={socialLinks.twitter} target="_blank">
                <svg
                  style={{ marginRight: -1, marginBottom: -1 }}
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M17.5475 5.98396C17.5552 6.15996 17.5552 6.32796 17.5552 6.50396C17.563 11.84 13.6426 18 6.47319 18C4.35865 18 2.2827 17.368 0.5 16.184C0.808692 16.224 1.11738 16.24 1.42608 16.24C3.1779 16.24 4.88343 15.632 6.26483 14.504C4.59789 14.472 3.1316 13.344 2.62226 11.696C3.20877 11.816 3.81072 11.792 4.3818 11.624C2.56824 11.256 1.26401 9.59997 1.2563 7.67197C1.2563 7.65597 1.2563 7.63997 1.2563 7.62397C1.79651 7.93597 2.40617 8.11197 3.02356 8.12797C1.31803 6.94396 0.78554 4.58396 1.81966 2.73595C3.80301 5.26396 6.72015 6.79196 9.85337 6.95996C9.53696 5.55996 9.96913 4.08796 10.9801 3.09595C12.5467 1.56795 15.0162 1.64795 16.498 3.27195C17.37 3.09595 18.2112 2.75995 18.9752 2.28795C18.682 3.22395 18.0723 4.01596 17.262 4.51996C18.0337 4.42396 18.79 4.20796 19.5 3.88795C18.9752 4.70396 18.3115 5.40796 17.5475 5.98396Z"
                    fill="#779BF4"
                  />
                </svg>
              </a>
            </div>
            <div className={classes.layoutPromoSocialsLink}>
              <a href={socialLinks.medium} target="_blank">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M11.2812 10.1897C11.2812 13.332 8.75578 15.8793 5.6407 15.8793C2.52561 15.8793 0 13.3314 0 10.1897C0 7.04806 2.52542 4.5 5.6407 4.5C8.75598 4.5 11.2812 7.04749 11.2812 10.1897Z"
                    fill="#779BF4"
                  />
                  <path
                    d="M17.4688 10.19C17.4688 13.1477 16.2061 15.5464 14.6485 15.5464C13.0908 15.5464 11.8281 13.1477 11.8281 10.19C11.8281 7.23219 13.0906 4.8335 14.6483 4.8335C16.2059 4.8335 17.4686 7.23142 17.4686 10.19"
                    fill="#779BF4"
                  />
                  <path
                    d="M19.9998 10.1897C19.9998 12.8391 19.5557 14.9882 19.0078 14.9882C18.4599 14.9882 18.0161 12.8397 18.0161 10.1897C18.0161 7.53965 18.4601 5.39111 19.0078 5.39111C19.5555 5.39111 19.9998 7.53946 19.9998 10.1897Z"
                    fill="#779BF4"
                  />
                </svg>
              </a>
            </div>
            <div className={classes.layoutPromoSocialsLink}>
              <a href={socialLinks.discord} target="_blank">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M16.868 4.32154C15.6048 3.74195 14.2503 3.31493 12.834 3.07036C12.8082 3.06564 12.7825 3.07744 12.7692 3.10103C12.595 3.41087 12.402 3.81508 12.2669 4.13279C10.7436 3.90474 9.22812 3.90474 7.73607 4.13279C7.60091 3.80802 7.40094 3.41087 7.22595 3.10103C7.21266 3.07822 7.1869 3.06643 7.16111 3.07036C5.74562 3.31415 4.39107 3.74117 3.12712 4.32154C3.11618 4.32626 3.1068 4.33413 3.10058 4.34435C0.531279 8.18283 -0.172559 11.927 0.17272 15.6247C0.174283 15.6428 0.184438 15.6601 0.198499 15.6711C1.89365 16.9159 3.53569 17.6717 5.14724 18.1726C5.17303 18.1805 5.20036 18.1711 5.21677 18.1498C5.59799 17.6292 5.9378 17.0803 6.22916 16.5031C6.24636 16.4693 6.22994 16.4292 6.1948 16.4158C5.65579 16.2113 5.14255 15.962 4.64885 15.6789C4.6098 15.6561 4.60667 15.6003 4.6426 15.5735C4.74649 15.4957 4.85041 15.4147 4.94961 15.3329C4.96756 15.318 4.99257 15.3148 5.01368 15.3242C8.2571 16.8051 11.7685 16.8051 14.9736 15.3242C14.9947 15.314 15.0198 15.3172 15.0385 15.3321C15.1377 15.4139 15.2416 15.4957 15.3463 15.5735C15.3822 15.6003 15.3799 15.6561 15.3408 15.6789C14.8471 15.9675 14.3339 16.2113 13.7941 16.415C13.7589 16.4284 13.7433 16.4693 13.7605 16.5031C14.0581 17.0795 14.3979 17.6284 14.7721 18.149C14.7877 18.1711 14.8158 18.1805 14.8416 18.1726C16.461 17.6717 18.103 16.9159 19.7982 15.6711C19.813 15.6601 19.8224 15.6435 19.824 15.6255C20.2372 11.3505 19.1318 7.63707 16.8938 4.34513C16.8883 4.33413 16.8789 4.32626 16.868 4.32154ZM6.71352 13.3731C5.73702 13.3731 4.93242 12.4767 4.93242 11.3757C4.93242 10.2747 5.72142 9.37819 6.71352 9.37819C7.7134 9.37819 8.51022 10.2826 8.49458 11.3757C8.49458 12.4767 7.70558 13.3731 6.71352 13.3731ZM13.2988 13.3731C12.3223 13.3731 11.5177 12.4767 11.5177 11.3757C11.5177 10.2747 12.3067 9.37819 13.2988 9.37819C14.2987 9.37819 15.0955 10.2826 15.0799 11.3757C15.0799 12.4767 14.2987 13.3731 13.2988 13.3731Z"
                    fill="#779BF4"
                  />
                </svg>
              </a>
            </div>
            {/*<div className={classes.layoutPromoSocialsLink}>*/}
            {/*  <a href={socialLinks.telegram} target="_blank">*/}
            {/*    <svg*/}
            {/*      style={{ marginLeft: -2 }}*/}
            {/*      width="20"*/}
            {/*      height="20"*/}
            {/*      viewBox="0 0 20 20"*/}
            {/*      fill="none"*/}
            {/*      xmlns="http://www.w3.org/2000/svg"*/}
            {/*    >*/}
            {/*      <path*/}
            {/*        fillRule="evenodd"*/}
            {/*        clipRule="evenodd"*/}
            {/*        d="M1.6975 9.41086C6.8654 7.15929 10.3115 5.67491 12.0357 4.95774C16.9588 2.91006 17.9818 2.55435 18.6486 2.54261C18.7952 2.54002 19.1231 2.57637 19.3355 2.74871C19.5148 2.89423 19.5642 3.09082 19.5878 3.22879C19.6114 3.36676 19.6408 3.68107 19.6174 3.92666C19.3507 6.72978 18.1963 13.5322 17.609 16.6718C17.3605 18.0002 16.8712 18.4456 16.3975 18.4892C15.368 18.584 14.5863 17.8089 13.5892 17.1553C12.029 16.1325 11.1475 15.4959 9.63306 14.4978C7.88281 13.3444 9.01742 12.7105 10.0149 11.6745C10.2759 11.4034 14.8118 7.2777 14.8996 6.90343C14.9105 6.85662 14.9207 6.68215 14.8171 6.59001C14.7134 6.49788 14.5604 6.52939 14.45 6.55445C14.2936 6.58996 11.801 8.23742 6.97251 11.4968C6.26502 11.9826 5.6242 12.2193 5.05004 12.2069C4.41708 12.1933 3.19952 11.849 2.29439 11.5548C1.1842 11.1939 0.301855 11.0031 0.378687 10.3903C0.418707 10.071 0.85831 9.74457 1.6975 9.41086Z"*/}
            {/*        fill="#779BF4"*/}
            {/*      />*/}
            {/*    </svg>*/}
            {/*  </a>*/}
            {/*</div>*/}
            
          </div>
        </div>
      </div>
      <div className={classes.divider} />
      <div className={classes.row}>
        <div className={classes.column}>
          <div className={classes.text}>
            <p>Cone officially launched in aug 2022 with a collective goal of fair and balanced access to DeFi.</p>
            <p>Cone is a decentralized exchange on the BSC network with low fees, near 0 slippage on correlated assets and a strong focus on secondary markets for tokenized locks as NFT's (veToken = lpNFTs).</p>
          </div>
        </div>
        <div className={classes.column}>
          <div className={classes.text}>
            <p>One segment of the cryptocurrency landscape that has shown incredible potential is the swapping of stablecoins and volatile assets.</p>
            <p>Cone Swap offers users quick, seamless and cheap transactions while utilizing strategies to maximize their yield.</p>
          </div>
        </div>
      </div>
      <a href="https://docs.cone.exchange/cone-swap/" className={classes.infoButton}>
        <span>LEARN MORE</span>
        <img src="/images/ui/explorer.svg" />
      </a>
    </div>
  );

  // return (
  //     <div
  //         className={classes.homePage}
  //         ref={pageRef}
  //         onScroll={() => { console.log('--', pageRef.current.scrollTop) }}
  //     >
  //         <div className={classes.container}>
  //             <div className={classes.layoutPromo}>
  //                 <div className={classes.layoutPromoTitle}>
  //                     Enter the era of crypto
  //                 </div>
  //                 <div className={classes.layoutPromoSubTitle}>
  //                     Cone
  //                 </div>
  //                 <div className={classes.layoutPromoDescription}>
  //                     <div className={classes.layoutPromoDescriptionItem}>
  //                         0.05% FEE
  //                     </div>
  //                     <div className={classes.layoutPromoDescriptionItem}>
  //                         TOKENIZED LOCKS AS NFT’s
  //                     </div>
  //                     <div className={classes.layoutPromoDescriptionItem}>
  //                         POLYGON (MATIC)
  //                     </div>
  //                 </div>
  //                 <div className={classes.layoutPromoButton}>
  //                     <div className={classes.buttonEnter} onClick={() => router.push('/swap')}>
  //                         <BtnEnterApp labelClassName={classes.buttonEnterLabel} label={'Enter App'} />
  //                     </div>
  //                 </div>
  //             </div>
  //             <div className={classes.layoutDescription} ref={layoutRef}>
  //                 <div className={classes.layoutDescriptionText}>
  //                     <p>Cone officially launched in April 2022 with a collective goal of <b>fair and balanced access to DeFi</b>.</p>
  //                     <p>Cone is a decentralized exchange that has launched on the Polygon network with low fees, near 0 slippage on correlated assets and a strong focus on secondary markets for tokenized locks as NFT’s (veToken = lpNFTs).</p>
  //                 </div>
  //                 <div className={classes.layoutDescriptionSmallText}>
  //                     <p>One segment of the cryptocurrency landscape that has shown incredible potential is the swapping of stablecoins and volatile assets. Cone Swap offers users quick, seamless and cheap transactions while utilizing strategies to maximize their yield.</p>
  //                 </div>
  //             </div>
  //         </div>
  //     </div>
  // )
};

export default HomePage;
