import { StyleSheet, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { WebView } from 'react-native-webview';
import { observer } from 'mobx-react-lite';
import { useStore } from '@src/stores';
import { metrics } from '@src/themes';
import { ChainIdEnum, delay, KADOChainNameEnum } from '@owallet/common';
const BuyFiat = observer(() => {
  const { chainStore, accountStore } = useStore();

  const [accountList, setAccounts] = useState('');

  const networkList = 'BITCOIN, OSMOSIS, ETHEREUM, JUNO, INJECTIVE, COSMOS HUB'.split(', ').join(',');

  const cryptoList = 'USDT, USDC, ETH, OSMO, ATOM, BTC, INJ, wETH, wBTC, USDC.e'.split(', ').join(',');

  let accounts = {};

  const delayedFunction = async () => {
    await delay(2200);
    Object.keys(ChainIdEnum).map(key => {
      if (KADOChainNameEnum[ChainIdEnum[key]]) {
        let defaultAddress = accountStore.getAccount(ChainIdEnum[key]).bech32Address;
        if (defaultAddress.startsWith('evmos')) {
          accounts[KADOChainNameEnum[ChainIdEnum[key]]] = accountStore.getAccount(ChainIdEnum[key]).evmosHexAddress;
        } else {
          accounts[KADOChainNameEnum[ChainIdEnum[key]]] = defaultAddress;
        }
      }
    });

    let tmpAccounts = '';

    Object.keys(accounts).map(a => {
      tmpAccounts += `${a}:${accounts[a]},`;
    });

    setAccounts(tmpAccounts);
  };

  useEffect(() => {
    delayedFunction();
  }, []);

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{
          uri: `https://app.kado.money/?onPayCurrency=USD&onPayAmount=200&onRevCurrency=USDC&offPayCurrency=USDC&offRevCurrency=USD&network=OSMOSIS&&onToAddressMulti=${accountList}&cryptoList=${cryptoList}&networkList=${networkList}&dapiKey=${process.env.API_KEY_KADO}&product=BUY&productList=BUY"`
        }}
        style={styles.webview}
      />
    </View>
  );
});

export default BuyFiat;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: metrics.screenWidth,
    height: metrics.screenHeight,
    backgroundColor: 'red'
  },
  webview: {}
});