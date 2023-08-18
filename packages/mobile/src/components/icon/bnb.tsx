import React, { FunctionComponent } from 'react';
import Svg, { Path } from 'react-native-svg';

export const BnbIcon: FunctionComponent<{
  color?: string;
  size?: number;
  onPress?: () => void;
}> = ({ color = '#AEAEB2', size = 20, onPress }) => {
  return (
    <Svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <Path
        d="M0 22C0 9.84974 9.85012 0 22.0004 0C34.1506 0 44.0008 9.84974 44.0008 22C44.0008 34.1503 34.1506 44 22.0004 44C9.85012 44 0 34.1503 0 22Z"
        fill="#F0B90B"
      />
      <Path
        d="M9.60647 18.3938L6 21.9997L9.60647 25.6062L13.2129 21.9997L9.60647 18.3938ZM22.0003 13.2383L28.1969 19.4349L31.8034 15.8285L21.9997 6L12.1966 15.8031L15.8031 19.4096L22.0003 13.2383ZM34.3941 18.3938L30.7876 22.0003L34.3941 25.6067L38.0006 22.0003L34.3941 18.3938ZM21.9997 30.7871L15.8031 24.5904L12.1966 28.1969L21.9997 38L31.8028 28.1969L28.1964 24.5904L21.9997 30.7871ZM21.9997 25.6034L25.6062 21.997L21.9997 18.3905L18.3933 21.997L21.9997 25.6034Z"
        fill="#F7F7F7"
      />
    </Svg>
  );
};