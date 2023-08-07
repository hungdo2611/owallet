import {
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import React, { FunctionComponent, useState } from 'react';
import { IInputSelectToken } from '../types';
import OWIcon from '@src/components/ow-icon/ow-icon';
import images from '@src/assets/images';
import { Text } from '@src/components/text';
import { BalanceText } from './BalanceText';
import { TypeTheme, useTheme } from '@src/themes/theme-provider';
import { SelectNetworkModal, SelectTokenModal, SlippageModal } from '../modals';

const InputSelectToken: FunctionComponent<IInputSelectToken> = () => {
  const { colors } = useTheme();
  const styles = styling(colors);
  const [isSelectTokenModal, setIsSelectTokenModal] = useState(false);
  const [isSlippageModal, setIsSlippageModal] = useState(false);
  const [isNetworkModal, setIsNetworkModal] = useState(false);
  return (
    <View style={[styles.containerInputSelectToken]}>
      <SlippageModal
        isOpen={isSlippageModal}
        close={() => {
          setIsSlippageModal('false');
        }}
      />
      <SelectTokenModal
        bottomSheetModalConfig={{
          snapPoints: ['50%', '90%'],
          index: 1
        }}
        close={() => {
          setIsSelectTokenModal(false);
        }}
        onNetworkModal={() => {
            setIsNetworkModal(true);
          // alert('ok');
        }}
        isOpen={isSelectTokenModal}
      />
      <SelectNetworkModal
        close={() => {
          setIsNetworkModal(false);
        }}
        isOpen={isNetworkModal}
      />
      <TouchableOpacity
        onPress={() => {
          setIsSelectTokenModal(true);
        }}
        style={styles.btnChainContainer}
      >
        <OWIcon type="images" source={images.swap} size={30} />
        <View style={[styles.ml8, styles.itemTopBtn]}>
          <View
            style={{
              paddingRight: 4
            }}
          >
            <Text weight="700" size={20}>
              ORAI
            </Text>
            <BalanceText
              size={12}
              weight="500"
              style={{
                marginTop: -4
              }}
            >
              Oraichain
            </BalanceText>
          </View>
          <OWIcon color={colors['blue-300']} name="down" size={16} />
        </View>
      </TouchableOpacity>

      <View style={styles.containerInput}>
        <TextInput
          placeholder="0"
          textAlign="right"
          keyboardType="numeric"
          style={[
            styles.textInput,
            {
              color: colors['text-title']
            }
          ]}
          placeholderTextColor={colors['text-place-holder']}
        />
        {/* <BalanceText style={Platform.OS == 'android' ? styles.mtde5 : {}}>
          $0.0001
        </BalanceText> */}
      </View>
    </View>
  );
};

export default InputSelectToken;

const styling = (colors: TypeTheme['colors']) =>
  StyleSheet.create({
    labelSymbol: {
      paddingRight: 5
    },
    itemTopBtn: {
      flexDirection: 'row',
      alignItems: 'center'
    },
    mtde5: {
      marginTop: -5
    },
    textInput: {
      width: '100%',
      fontSize: 34,
      paddingVertical: 0
    },
    containerInput: {
      flex: 1,
      alignItems: 'flex-end'
    },
    ml8: {
      paddingLeft: 8
    },
    btnChainContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 7,
      borderRadius: 24,
      backgroundColor: colors['bg-btn-select-token'],
      paddingVertical: 2,
      marginRight: 3
    },
    containerInputSelectToken: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      paddingBottom: 8
    }
  });