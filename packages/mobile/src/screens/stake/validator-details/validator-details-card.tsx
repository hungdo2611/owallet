import { BondStatus } from "@owallet/stores";
import { CoinPretty, Dec, IntPretty } from "@owallet/unit";
import { Text } from "@src/components/text";
import { useTheme } from "@src/themes/theme-provider";
import { observer } from "mobx-react-lite";
import React, { FunctionComponent, useMemo } from "react";
import { StyleSheet, View, ViewStyle, ScrollView } from "react-native";
import { useStore } from "../../../stores";
import { ValidatorThumbnails } from "@owallet/common";
import { OWButton } from "@src/components/button";
import { OWBox } from "@src/components/card";
import {
  ValidatorAPYIcon,
  ValidatorBlockIcon,
  ValidatorCommissionIcon,
  ValidatorVotingIcon,
} from "../../../components/icon";
import { ValidatorThumbnail } from "../../../components/thumbnail";
import { useSmartNavigation } from "../../../navigation.provider";
import { metrics, spacing, typography } from "../../../themes";
import { PageHeader } from "@src/components/header/header-new";
import OWText from "@src/components/text/ow-text";
import { PageWithBottom } from "@src/components/page/page-with-bottom";
import OWCard from "@src/components/card/ow-card";

const renderIconValidator = (label: string, size?: number, styles?: any) => {
  switch (label) {
    case "Website":
      return (
        <View
          style={{
            ...styles.containerIcon,
          }}
        >
          <ValidatorBlockIcon color={"#1E1E1E"} size={size} />
        </View>
      );
    case "APR":
      return (
        <View
          style={{
            ...styles.containerIcon,
          }}
        >
          <ValidatorAPYIcon color={"#1E1E1E"} size={size} />
        </View>
      );
    case "Commission":
      return (
        <View
          style={{
            ...styles.containerIcon,
          }}
        >
          <ValidatorCommissionIcon color={"#1E1E1E"} size={size} />
        </View>
      );
    case "Voting power":
      return (
        <View
          style={{
            ...styles.containerIcon,
          }}
        >
          <ValidatorVotingIcon color={"#1E1E1E"} size={size} />
        </View>
      );
  }
};

export const ValidatorDetailsCard: FunctionComponent<{
  containerStyle?: ViewStyle;
  validatorAddress: string;
  apr?: number;
}> = observer(({ containerStyle, validatorAddress, apr }) => {
  const { chainStore, queriesStore } = useStore();
  const { colors } = useTheme();
  const styles = styling(colors);
  const queries = queriesStore.get(chainStore.current.chainId);
  const bondedValidators = queries.cosmos.queryValidators.getQueryStatus(
    BondStatus.Bonded
  );
  const unbondingValidators = queries.cosmos.queryValidators.getQueryStatus(
    BondStatus.Unbonding
  );
  const unbondedValidators = queries.cosmos.queryValidators.getQueryStatus(
    BondStatus.Unbonded
  );
  const validator = useMemo(() => {
    return bondedValidators.validators
      .concat(unbondingValidators.validators)
      .concat(unbondedValidators.validators)
      .find((val) => val.operator_address === validatorAddress);
  }, [
    bondedValidators.validators,
    unbondingValidators.validators,
    unbondedValidators.validators,
    validatorAddress,
  ]);
  const smartNavigation = useSmartNavigation();
  const thumbnail =
    bondedValidators.getValidatorThumbnail(validatorAddress) ||
    unbondingValidators.getValidatorThumbnail(validatorAddress) ||
    unbondedValidators.getValidatorThumbnail(validatorAddress) ||
    ValidatorThumbnails[validatorAddress];

  const renderTextDetail = (label: string) => {
    switch (label) {
      case "Commission":
        return (
          <OWText size={16} weight="500" color={colors["neutral-text-heading"]}>
            {new IntPretty(new Dec(validator.commission.commission_rates.rate))
              .moveDecimalPointRight(2)
              .maxDecimals(2)
              .trim(true)
              .toString() + "%"}
          </OWText>
        );
      case "Voting power":
        return (
          <OWText size={16} weight="500" color={colors["neutral-text-heading"]}>
            {new CoinPretty(
              chainStore.current.stakeCurrency,
              new Dec(validator.tokens)
            )
              .maxDecimals(0)
              .toString()}
          </OWText>
        );
      default:
        return null;
    }
  };

  return (
    <PageWithBottom
      bottomGroup={
        <OWButton
          label="Stake"
          onPress={() => {
            smartNavigation.navigateSmart("Delegate", {
              validatorAddress,
            });
          }}
          style={{
            marginTop: 20,
            width: metrics.screenWidth - 32,
            borderRadius: 999,
          }}
        />
      }
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <PageHeader
          title="Validator detail"
          colors={colors}
          onPress={async () => {}}
          right={
            <View
              style={{
                borderRadius: 999,
                backgroundColor: colors["error-surface-default"],
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
            >
              <OWText color={colors["neutral-icon-on-dark"]} weight="600">
                Unstake
              </OWText>
            </View>
          }
        />
        {validator ? (
          <View>
            <OWCard>
              <View
                style={{
                  alignItems: "center",
                  marginBottom: spacing["16"],
                }}
              >
                <ValidatorThumbnail size={44} url={thumbnail} />
                <OWText
                  style={{ paddingTop: 8 }}
                  color={colors["neutral-text-title"]}
                  weight="600"
                  size={16}
                >
                  {validator?.description.moniker}
                </OWText>
                <View style={{ flexDirection: "row", marginTop: 8 }}>
                  <View style={styles.topSubInfo}>
                    <OWText
                      style={{
                        color: colors["neutral-text-body2"],
                      }}
                    >
                      APR:{" "}
                      {apr && apr > 0 ? apr.toFixed(2).toString() + "%" : ""}
                    </OWText>
                  </View>
                  <View style={styles.topSubInfo}>
                    <ValidatorBlockIcon color={"#1E1E1E"} size={16} />
                    <OWText
                      style={{
                        color: colors["neutral-text-body2"],
                        paddingLeft: 6,
                      }}
                    >
                      {validator?.description.website}
                    </OWText>
                  </View>
                </View>
              </View>
            </OWCard>
            <OWCard type="normal">
              <View>
                {["Voting power", "Commission"].map(
                  (label: string, index: number) => (
                    <View
                      style={{
                        ...styles.containerItem,
                      }}
                    >
                      <View style={{ flexDirection: "row", paddingBottom: 6 }}>
                        {renderIconValidator(label, 12, styles)}
                        <Text
                          style={{
                            ...typography.h7,
                            fontWeight: "700",
                            textAlign: "center",
                            marginTop: spacing["6"],
                            color: colors["primary-text"],
                          }}
                        >
                          {label}
                        </Text>
                      </View>

                      {renderTextDetail(label)}
                    </View>
                  )
                )}
              </View>
            </OWCard>
            <OWCard style={{ marginTop: spacing["16"] }} type="normal">
              <View
                style={{
                  marginBottom: spacing["14"],
                }}
              >
                <View style={styles.listLabel}>
                  <OWText
                    size={16}
                    weight={"500"}
                    style={[styles["title"]]}
                  >{`Description`}</OWText>
                </View>
                <Text
                  style={{
                    textAlign: "left",
                    fontWeight: "400",
                    paddingTop: spacing["16"],
                  }}
                  selectable={true}
                >
                  {validator?.description.details}
                </Text>
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
    containerIcon: {
      borderRadius: 999,
      padding: spacing["10"],
      alignItems: "center",
      backgroundColor: colors["neutral-surface-action"],
      marginRight: 4,
    },
    containerItem: {
      borderBottomWidth: 1,
      borderColor: colors["border-input-login"],
      borderRadius: spacing["8"],
      paddingVertical: spacing["16"],
      paddingHorizontal: spacing["16"],
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
  });
