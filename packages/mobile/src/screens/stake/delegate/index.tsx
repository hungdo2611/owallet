import { ChainIdEnum, EthereumEndpoint, toAmount } from "@owallet/common";
import { useDelegateTxConfig } from "@owallet/hooks";
import { BondStatus } from "@owallet/stores";
import { RouteProp, useRoute } from "@react-navigation/native";
import OWCard from "@src/components/card/ow-card";
import { PageHeader } from "@src/components/header/header-new";
import { AlertIcon, DownArrowIcon } from "@src/components/icon";
import { PageWithBottom } from "@src/components/page/page-with-bottom";
import OWText from "@src/components/text/ow-text";
import { ValidatorThumbnail } from "@src/components/thumbnail";
import { useTheme } from "@src/themes/theme-provider";
import {
  capitalizedText,
  computeTotalVotingPower,
  formatPercentage,
  handleSaveHistory,
  HISTORY_STATUS,
  showToast,
} from "@src/utils/helper";
import { observer } from "mobx-react-lite";
import React, { FunctionComponent, useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  TouchableOpacity,
  InteractionManager,
} from "react-native";
import { OWButton } from "../../../components/button";
import { useSmartNavigation } from "../../../navigation.provider";
import { useStore } from "../../../stores";
import { metrics, spacing, typography } from "../../../themes";
import { chainIcons } from "@oraichain/oraidex-common";
import OWIcon from "@src/components/ow-icon/ow-icon";
import { NewAmountInput } from "@src/components/input/amount-input";
import { FeeModal } from "@src/modals/fee";
import { CoinPretty, Int } from "@owallet/unit";
import { API } from "@src/common/api";

export const DelegateScreen: FunctionComponent = observer(() => {
  const route = useRoute<
    RouteProp<
      Record<
        string,
        {
          validatorAddress: string;
        }
      >,
      string
    >
  >();

  const validatorAddress = route.params.validatorAddress;
  const {
    chainStore,
    accountStore,
    queriesStore,
    analyticsStore,
    priceStore,
    modalStore,
    keyRingStore,
    appInitStore,
  } = useStore();
  const { colors } = useTheme();
  const styles = styling(colors);

  const smartNavigation = useSmartNavigation();

  const account = accountStore.getAccount(chainStore.current.chainId);
  const queries = queriesStore.get(chainStore.current.chainId);
  const [validatorDetail, setValidatorDetail] = useState();
  const [validators, setValidators] = useState([]);
  const sendConfigs = useDelegateTxConfig(
    chainStore,
    chainStore.current.chainId,
    account.msgOpts["delegate"].gas,
    account.bech32Address,
    queries.queryBalances,
    EthereumEndpoint
  );
  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      if (chainStore.current.chainId !== ChainIdEnum.Oraichain) return;
      (async () => {
        try {
          const res = await Promise.all([
            API.getValidatorOraichainDetail(
              {
                validatorAddress: validatorAddress,
              },
              {
                baseURL: "https://api.scan.orai.io",
              }
            ),
            API.getValidatorList(
              {},
              {
                baseURL: "https://api.scan.orai.io",
              }
            ),
          ]);
          if (res[0].status !== 200) return;
          setValidatorDetail(res[0].data);
          if (res[1].status !== 200) return;
          setValidators(res[1].data.data);
        } catch (error) {}
      })();
    });
  }, [chainStore.current.chainId, validatorAddress]);
  useEffect(() => {
    if (sendConfigs.feeConfig.feeCurrency && !sendConfigs.feeConfig.fee) {
      sendConfigs.feeConfig.setFeeType("average");
    }
    return;
  }, [sendConfigs.feeConfig]);
  const [balance, setBalance] = useState<CoinPretty>(null);
  const address = account.getAddressDisplay(
    keyRingStore.keyRingLedgerAddresses
  );
  const isReadyBalance = queries.queryBalances
    .getQueryBech32Address(address)
    .getBalanceFromCurrency(sendConfigs.amountConfig.sendCurrency).isReady;
  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      if (isReadyBalance && sendConfigs.amountConfig.sendCurrency && address) {
        const balance = queries.queryBalances
          .getQueryBech32Address(address)
          .getBalanceFromCurrency(sendConfigs.amountConfig.sendCurrency);
        setBalance(balance);
      }
    });
  }, [isReadyBalance, address, sendConfigs.amountConfig.sendCurrency]);

  useEffect(() => {
    sendConfigs.recipientConfig.setRawRecipient(validatorAddress);
  }, [sendConfigs.recipientConfig, validatorAddress]);

  useEffect(() => {
    if (sendConfigs.feeConfig.feeCurrency && !sendConfigs.feeConfig.fee) {
      sendConfigs.feeConfig.setFeeType("average");
    }
    if (appInitStore.getInitApp.feeOption) {
      sendConfigs.feeConfig.setFeeType(appInitStore.getInitApp.feeOption);
    }
  }, [sendConfigs.feeConfig, appInitStore.getInitApp.feeOption]);

  const sendConfigError =
    sendConfigs.recipientConfig.getError() ??
    sendConfigs.amountConfig.getError() ??
    sendConfigs.memoConfig.getError() ??
    sendConfigs.gasConfig.getError() ??
    sendConfigs.feeConfig.getError();
  const txStateIsValid = sendConfigError == null;

  const bondedValidators = queries.cosmos.queryValidators.getQueryStatus(
    BondStatus.Bonded
  );

  const validator = bondedValidators.getValidator(validatorAddress);

  const thumbnail = bondedValidators.getValidatorThumbnail(validatorAddress);

  const chainIcon = chainIcons.find(
    (c) => c.chainId === chainStore.current.chainId
  );
  const _onPressFee = () => {
    modalStore.setOptions({
      bottomSheetModalConfig: {
        enablePanDownToClose: false,
        enableOverDrag: false,
      },
    });
    modalStore.setChildren(
      <FeeModal vertical={true} sendConfigs={sendConfigs} colors={colors} />
    );
  };

  // const staked = queries.cosmos.queryDelegations
  //   .getQueryBech32Address(account.bech32Address)
  //   .getDelegationTo(validatorAddress);

  // const _onOpenStakeModal = () => {
  //   modalStore.setOpen();
  //   modalStore.setChildren(
  //     StakeAdvanceModal({
  //       config: sendConfigs
  //     })
  //   );
  // };
  const totalVotingPower = useMemo(
    () => computeTotalVotingPower(validators),
    [validators]
  );
  const currentVotingPower = parseFloat(validatorDetail?.voting_power || 0);
  const percentage =
    chainStore.current.chainId === ChainIdEnum.Oraichain
      ? formatPercentage(currentVotingPower / totalVotingPower, 2)
      : 0;
  const amount = new CoinPretty(
    sendConfigs.amountConfig.sendCurrency,
    new Int(toAmount(Number(sendConfigs.amountConfig.amount)))
  );

  return (
    <PageWithBottom
      bottomGroup={
        <OWButton
          label="Stake"
          disabled={!account.isReadyToSendMsgs || !txStateIsValid}
          loading={account.isSendingMsg === "delegate"}
          onPress={async () => {
            if (account.isReadyToSendMsgs && txStateIsValid) {
              try {
                await account.cosmos.sendDelegateMsg(
                  sendConfigs.amountConfig.amount,
                  sendConfigs.recipientConfig.recipient,
                  sendConfigs.memoConfig.memo,
                  sendConfigs.feeConfig.toStdFee(),
                  {
                    preferNoSetMemo: true,
                    preferNoSetFee: true,
                  },
                  {
                    onBroadcasted: (txHash) => {
                      analyticsStore.logEvent("Delegate tx broadcasted", {
                        chainId: chainStore.current.chainId,
                        chainName: chainStore.current.chainName,
                        validatorName: validator?.description.moniker ?? "...",
                        feeType: sendConfigs.feeConfig.feeType,
                      });
                      smartNavigation.pushSmart("TxPendingResult", {
                        txHash: Buffer.from(txHash).toString("hex"),
                        data: {
                          type: "stake",
                          wallet: account.bech32Address,
                          validator: sendConfigs.recipientConfig.recipient,
                          amount: sendConfigs.amountConfig.getAmountPrimitive(),
                          fee: sendConfigs.feeConfig.toStdFee(),
                          currency: sendConfigs.amountConfig.sendCurrency,
                        },
                      });
                      const historyInfos = {
                        fromAddress: account.bech32Address,
                        toAddress: sendConfigs.recipientConfig.recipient,
                        hash: Buffer.from(txHash).toString("hex"),
                        memo: "",
                        fromAmount: sendConfigs.amountConfig.amount,
                        toAmount: sendConfigs.amountConfig.amount,
                        value: sendConfigs.amountConfig.amount,
                        fee: Number(
                          sendConfigs.feeConfig.fee
                            ?.maxDecimals(6)
                            .trim(true)
                            .hideDenom(true)
                            .toString()
                        ),
                        type: HISTORY_STATUS.STAKE,
                        fromToken: {
                          asset:
                            sendConfigs.amountConfig.sendCurrency.coinDenom,
                          chainId: chainStore.current.chainId,
                        },
                        toToken: {
                          asset:
                            sendConfigs.amountConfig.sendCurrency.coinDenom,
                          chainId: chainStore.current.chainId,
                        },
                        status: "SUCCESS",
                      };

                      handleSaveHistory(account.bech32Address, historyInfos);
                    },
                  }
                );
              } catch (e) {
                if (e?.message.toLowerCase().includes("rejected")) {
                  return;
                } else if (
                  e?.message.includes("Cannot read properties of undefined")
                ) {
                  return;
                } else {
                  console.log(e);
                  // smartNavigation.navigate("Home", {});
                  showToast({
                    message: JSON.stringify(e),
                    type: "danger",
                  });
                }
              }
            }
          }}
          style={[
            styles.bottomBtn,
            {
              width: metrics.screenWidth - 32,
            },
          ]}
          textStyle={{
            fontSize: 14,
            fontWeight: "600",
            color: colors["neutral-text-action-on-dark-bg"],
          }}
        />
      }
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <PageHeader
          title="Stake"
          subtitle={"Oraichain"}
          colors={colors}
          onPress={async () => {}}
        />
        {validator ? (
          <View>
            <OWCard>
              <OWText
                style={{ paddingBottom: 8 }}
                color={colors["neutral-text-title"]}
              >
                Validator
              </OWText>
              <View
                style={{
                  flexDirection: "row",
                }}
              >
                <View
                  style={{
                    backgroundColor: colors["neutral-icon-on-dark"],
                    borderRadius: 999,
                  }}
                >
                  <ValidatorThumbnail size={20} url={thumbnail} />
                </View>

                <OWText
                  style={{ paddingLeft: 8 }}
                  color={colors["neutral-text-title"]}
                  weight="500"
                >
                  {validator?.description.moniker}
                </OWText>
              </View>
            </OWCard>
            <OWCard style={{ paddingTop: 22 }} type="normal">
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <View style={{}}>
                  <OWText style={{ paddingTop: 8 }}>
                    Balance :{" "}
                    {balance
                      ?.trim(true)
                      ?.maxDecimals(6)
                      ?.hideDenom(true)
                      ?.toString() || "0"}
                  </OWText>
                  <View
                    style={{
                      flexDirection: "row",
                      backgroundColor: colors["neutral-surface-action3"],
                      borderRadius: 999,
                      paddingHorizontal: 14,
                      paddingVertical: 12,
                      maxWidth: metrics.screenWidth / 4.5,
                      marginTop: 12,
                      alignItems: "center",
                    }}
                  >
                    {chainIcon ? (
                      <View
                        style={{
                          backgroundColor: colors["neutral-icon-on-dark"],
                          borderRadius: 999,
                        }}
                      >
                        <OWIcon
                          type="images"
                          source={{ uri: chainIcon?.Icon }}
                          size={16}
                        />
                      </View>
                    ) : (
                      <View
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 33,
                          alignItems: "center",
                          backgroundColor: colors["neutral-icon-on-dark"],
                          justifyContent: "center",
                        }}
                      >
                        <OWText
                          weight="400"
                          color={colors["neutral-text-action-on-dark-bg"]}
                        >
                          {chainStore.current.stakeCurrency.coinDenom.charAt(0)}
                        </OWText>
                      </View>
                    )}

                    <OWText style={{ paddingLeft: 4 }} weight="600" size={14}>
                      {chainStore.current.stakeCurrency.coinDenom}
                    </OWText>
                  </View>
                </View>
                <View
                  style={{
                    alignItems: "flex-end",
                  }}
                >
                  <NewAmountInput
                    colors={colors}
                    inputContainerStyle={{
                      borderWidth: 0,
                      width: metrics.screenWidth / 2.3,
                      marginBottom: 8,
                    }}
                    amountConfig={sendConfigs.amountConfig}
                    maxBalance={
                      balance
                        ?.trim(true)
                        ?.maxDecimals(6)
                        ?.hideDenom(true)
                        ?.toString() || "0"
                    }
                    placeholder={"0.0"}
                  />
                </View>
              </View>
              <View
                style={{
                  alignSelf: "flex-end",
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <OWIcon name="tdesign_swap" size={16} />
                <OWText
                  style={{ paddingLeft: 4 }}
                  color={colors["neutral-text-body"]}
                  size={14}
                >
                  {priceStore.calculatePrice(amount).toString()}
                </OWText>
              </View>
              {validatorDetail ? (
                <View
                  style={{
                    flexDirection: "row",
                    borderRadius: 12,
                    backgroundColor: colors["warning-surface-subtle"],
                    padding: 12,
                    marginTop: 8,
                  }}
                >
                  <AlertIcon color={colors["warning-text-body"]} size={16} />
                  <OWText style={{ paddingLeft: 8 }} weight="600" size={14}>
                    {Number(percentage) > 5 ? (
                      <>
                        <OWText
                          style={{
                            fontWeight: "bold",
                          }}
                        >
                          You're about to stake with top 10 validators {"\n"}
                        </OWText>
                        <OWText weight="400">
                          Consider staking with other validators to improve
                          network decentralization
                        </OWText>
                      </>
                    ) : (
                      `When you unstake, a 14-day cooldown period is required before your stake returns to your wallet.`
                    )}
                  </OWText>
                </View>
              ) : null}
            </OWCard>
            <OWCard type="normal">
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  borderBottomColor: colors["neutral-border-default"],
                  borderBottomWidth: 1,
                  paddingVertical: 16,
                  marginBottom: 8,
                }}
              >
                <OWText
                  color={colors["neutral-text-title"]}
                  weight="600"
                  size={16}
                >
                  Transaction fee
                </OWText>
                <TouchableOpacity
                  style={{ flexDirection: "row" }}
                  onPress={_onPressFee}
                >
                  <OWText
                    color={colors["primary-text-action"]}
                    weight="600"
                    size={16}
                  >
                    {capitalizedText(sendConfigs.feeConfig.feeType)}:{" "}
                    {priceStore
                      .calculatePrice(sendConfigs.feeConfig.fee)
                      ?.toString()}{" "}
                  </OWText>
                  <DownArrowIcon
                    height={11}
                    color={colors["primary-text-action"]}
                  />
                </TouchableOpacity>
              </View>
            </OWCard>
          </View>
        ) : null}
      </ScrollView>
    </PageWithBottom>
  );
});

const styling = (colors) =>
  StyleSheet.create({
    page: {
      padding: spacing["page"],
    },
    containerStaking: {
      borderRadius: spacing["24"],
      backgroundColor: colors["primary"],
      marginBottom: spacing["24"],
    },
    containerBtn: {
      backgroundColor: colors["primary-surface-default"],
      marginLeft: spacing["24"],
      marginRight: spacing["24"],
      borderRadius: spacing["8"],
      marginTop: spacing["20"],
      paddingVertical: spacing["16"],
    },
    textBtn: {
      ...typography.h6,
      color: colors["white"],
      fontWeight: "700",
    },
    sendlabelInput: {
      fontSize: 16,
      fontWeight: "700",
      lineHeight: 22,
      color: colors["gray-900"],
      marginBottom: spacing["8"],
    },
    textNormal: {
      ...typography.h7,
      color: colors["gray-600"],
    },
    listLabel: {
      paddingVertical: 16,
      borderBottomColor: colors["neutral-border-default"],
      borderBottomWidth: 1,
    },
    title: {
      color: colors["neutral-text-body"],
    },
    topSubInfo: {
      backgroundColor: colors["neutral-surface-bg2"],
      borderRadius: 8,
      paddingHorizontal: 6,
      paddingVertical: 4,
      marginTop: 4,
      marginRight: 8,
      flexDirection: "row",
    },
    bottomBtn: {
      marginTop: 20,
      width: metrics.screenWidth / 2.3,
      borderRadius: 999,
      marginLeft: 12,
    },
    label: {
      fontWeight: "600",
      textAlign: "center",
      marginTop: spacing["6"],
      color: colors["neutral-text-title"],
    },
    percentBtn: {
      backgroundColor: colors["primary-surface-default"],
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 8,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 4,
    },
  });
