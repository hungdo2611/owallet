import {
  View,
  StyleSheet,
  TouchableOpacity,
  TouchableOpacityProps
} from 'react-native';
import React from 'react';
import { Text } from '@src/components/text';
import { colors } from '@src/themes';
import OWIcon from '@src/components/ow-icon/ow-icon';
export interface IItemBtnViewOnScan extends TouchableOpacityProps {}
const ItemBtnViewOnScan = (props: TouchableOpacityProps) => {
  return (
    <TouchableOpacity {...props}>
      <View style={styles.container}>
        <OWIcon color={colors['purple-700']} size={20} name="eye" />
        <Text size={16} style={styles.txtView} color={colors['purple-700']}>
          View on Scan
        </Text>
      </View>
    </TouchableOpacity>
  );
};

export default ItemBtnViewOnScan;

const styles = StyleSheet.create({
  txtView: {
    paddingLeft: 10
  },
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    height: 50
  }
});
