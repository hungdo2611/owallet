import { observer } from "mobx-react-lite";
import React, { useEffect, useState } from "react";
import { FlatList, InteractionManager, Text, View } from "react-native";
import { useStore } from "@src/stores";
import { ChainIdEnum } from "@owallet/common";
import { CoinPretty, Dec, PricePretty } from "@owallet/unit";
import Web3 from "web3";
import axios from "axios";
import {
  addressToPublicKey,
  getOasisNic,
  getRpcByChainId,
  parseRpcBalance,
} from "@owallet/common";
import { MulticallQueryClient } from "@oraichain/common-contracts-sdk";
import { fromBinary, toBinary } from "@cosmjs/cosmwasm-stargate";
import { CWStargate, DenomHelper } from "@owallet/common";
import { OraiswapTokenTypes } from "@oraichain/oraidex-contracts-sdk";
import { ContractCallResults, Multicall } from "@oraichain/ethereum-multicall";
import {
  ERC20__factory,
  network,
  oraichainNetwork,
} from "@oraichain/oraidex-common";
import OWFlatList from "@src/components/page/ow-flat-list";
import { ViewToken } from "@src/stores/huge-queries";
import { AppCurrency, ChainInfo } from "@owallet/types";

export const TestScreen = observer(() => {
  const { accountStore, priceStore, hugeQueriesStore } = useStore();
  const [dataTokens, setDataTokens] = useState<ViewToken[]>([]);
  const [totalPriceBalance, setTotalPriceBalance] = useState<PricePretty>(
    new PricePretty(
      {
        currency: "usd",
        symbol: "$",
        maxDecimals: 2,
        locale: "en-US",
      },
      new Dec("0")
    )
  );
  const fiatCurrency = priceStore.getFiatCurrency(priceStore.defaultVsCurrency);

  if (!fiatCurrency) return;

  const tokens: ViewToken[] = [];
  let totalBalance = new PricePretty(fiatCurrency, new Dec("0"));
  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      init();
    });
  }, []);

  const init = async () => {
    try {
      const allChain = Array.from(hugeQueriesStore.getAllChainMap.values());
      const allBalancePromises = allChain.map(
        async ({ address, chainInfo }) => {
          switch (chainInfo.networkType) {
            case "cosmos":
              return chainInfo.chainId === ChainIdEnum.Oraichain
                ? Promise.all([
                    getBalanceCW20Oraichain(),
                    getBalanceNativeCosmos(address, chainInfo),
                  ])
                : getBalanceNativeCosmos(address, chainInfo);
            case "evm":
              return chainInfo.chainId === ChainIdEnum.Oasis
                ? getBalanceOasis(address, chainInfo)
                : Promise.all([
                    getBalanceNativeEvm(address, chainInfo),
                    getBalanceErc20(address, chainInfo),
                  ]);
            case "bitcoin":
              return getBalanceBtc(address, chainInfo);
          }
        }
      );

      const allData = await Promise.allSettled(allBalancePromises);
      setDataTokens(sortTokensByPrice(tokens));
      setTotalPriceBalance(totalBalance);
    } catch (error) {
      console.error("Initialization error:", error);
    }
  };

  const sortTokensByPrice = (tokens: ViewToken[]) => {
    return tokens.sort(
      (a, b) =>
        Number(b.price.toDec().toString()) - Number(a.price.toDec().toString())
    );
  };

  const getBalanceNativeEvm = async (address, chainInfo: ChainInfo) => {
    const web3 = new Web3(getRpcByChainId(chainInfo, chainInfo.chainId));
    const ethBalance = await web3.eth.getBalance(address);
    if (ethBalance) {
      const balance = new CoinPretty(
        chainInfo.stakeCurrency,
        Number(ethBalance)
      );
      const price = await priceStore.waitCalculatePrice(balance);
      tokens.push({
        token: balance,
        chainInfo,
        price,
        isFetching: null,
        error: null,
      });
      totalBalance = totalBalance.add(price);
    }
  };

  const getBalanceBtc = async (address, chainInfo: ChainInfo) => {
    const client = axios.create({ baseURL: chainInfo.rest });
    const { data } = await client.get(`/address/${address}/utxo`);
    if (data) {
      const totalBtc = data.reduce((acc, curr) => acc + curr.value, 0);
      const balance = new CoinPretty(chainInfo.stakeCurrency, totalBtc);
      const price = await priceStore.waitCalculatePrice(balance);
      tokens.push({
        token: balance,
        chainInfo,
        price,
        isFetching: null,
        error: null,
      });
      totalBalance = totalBalance.add(price);
    }
  };

  const getBalanceNativeCosmos = async (address, chainInfo: ChainInfo) => {
    const client = axios.create({ baseURL: chainInfo.rest });
    const { data } = await client.get(
      `/cosmos/bank/v1beta1/balances/${address}?pagination.limit=1000`
    );
    const mergedMaps = chainInfo.currencyMap;

    data.balances.forEach(async ({ denom, amount }) => {
      const token = mergedMaps.get(denom);
      if (token) {
        const balance = new CoinPretty(token, amount);
        const price = await priceStore.waitCalculatePrice(balance);
        tokens.push({
          token: balance,
          chainInfo,
          price,
          isFetching: null,
          error: null,
        });
        totalBalance = totalBalance.add(price);
      }
    });
  };

  const getBalanceCW20Oraichain = async () => {
    const mergedMaps = hugeQueriesStore.getAllChainMap.get(
      ChainIdEnum.Oraichain
    ).chainInfo.currencyMap;
    const data = toBinary({
      balance: {
        address: hugeQueriesStore.getAllChainMap.get(ChainIdEnum.Oraichain)
          .address,
      },
    });

    try {
      const cwStargate = {
        account: accountStore.getAccount(ChainIdEnum.Oraichain),
        chainId: ChainIdEnum.Oraichain,
        rpc: oraichainNetwork.rpc,
      };
      const client = await CWStargate.init(
        cwStargate.account,
        cwStargate.chainId,
        cwStargate.rpc
      );
      const tokensCw20 = hugeQueriesStore.getAllChainMap
        .get(ChainIdEnum.Oraichain)
        .chainInfo.currencies.filter(
          (item) => new DenomHelper(item.coinMinimalDenom).contractAddress
        );
      const multicall = new MulticallQueryClient(client, network.multicall);
      const res = await multicall.aggregate({
        queries: tokensCw20.map((t) => ({
          address: new DenomHelper(t.coinMinimalDenom).contractAddress,
          data,
        })),
      });

      await Promise.all(
        tokensCw20.map(async (t, ind) => {
          if (res.return_data[ind].success) {
            const balanceRes = fromBinary(
              res.return_data[ind].data
            ) as OraiswapTokenTypes.BalanceResponse;
            const token = mergedMaps.get(t.coinMinimalDenom);
            if (token) {
              const balance = new CoinPretty(token, balanceRes.balance);
              const price = await priceStore.waitCalculatePrice(balance);
              tokens.push({
                token: balance,
                chainInfo: hugeQueriesStore.getAllChainMap.get(
                  ChainIdEnum.Oraichain
                ).chainInfo,
                price,
                isFetching: null,
                error: null,
              });
              totalBalance = totalBalance.add(price);
            }
          }
        })
      );
    } catch (error) {
      console.error("Error fetching CW20 balance:", error);
    }
  };

  const getBalanceOasis = async (address, chainInfo: ChainInfo) => {
    const nic = getOasisNic(chainInfo.raw.grpc);
    const publicKey = await addressToPublicKey(address);
    const account = await nic.stakingAccount({ owner: publicKey, height: 0 });
    const grpcBalance = parseRpcBalance(account);
    if (grpcBalance) {
      const balance = new CoinPretty(
        chainInfo.stakeCurrency,
        grpcBalance.available
      );
      const price = await priceStore.waitCalculatePrice(balance);
      tokens.push({
        token: balance,
        chainInfo,
        price,
        isFetching: null,
        error: null,
      });
      totalBalance = totalBalance.add(price);
    }
  };

  const getBalanceErc20 = async (address, chainInfo: ChainInfo) => {
    const multicall = new Multicall({
      nodeUrl: getRpcByChainId(chainInfo, chainInfo.chainId),
      multicallCustomContractAddress: null,
      chainId: Number(chainInfo.chainId),
    });
    const tokensErc20 = chainInfo.currencies.filter(
      (item) => new DenomHelper(item.coinMinimalDenom).type !== "native"
    );
    const input = tokensErc20.map((token) => ({
      reference: token.coinDenom,
      contractAddress: new DenomHelper(token.coinMinimalDenom).contractAddress,
      abi: ERC20__factory.abi,
      calls: [
        {
          reference: token.coinDenom,
          methodName: "balanceOf(address)",
          methodParameters: [address],
        },
      ],
    }));

    const results: ContractCallResults = await multicall.call(input as any);
    tokensErc20.forEach(async (token) => {
      const amount =
        results.results[token.coinDenom].callsReturnContext[0].returnValues[0]
          .hex;
      const balance = new CoinPretty(token, Number(amount));
      const price = await priceStore.waitCalculatePrice(balance);
      tokens.push({
        token: balance,
        chainInfo,
        price,
        isFetching: null,
        error: null,
      });
      totalBalance = totalBalance.add(price);
    });
  };

  return (
    <View>
      <Text>TOTAL BALANCE: {totalPriceBalance.toString()}</Text>
      <FlatList
        data={dataTokens}
        renderItem={({ item, index }) => (
          <Text key={index.toString()}>
            {item.token.trim(true).maxDecimals(4).toString()} -{" "}
            {item.chainInfo.chainName} - {item.price?.toString()}
          </Text>
        )}
      />
    </View>
  );
});