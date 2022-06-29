import React, { FunctionComponent, useEffect, useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { observer } from 'mobx-react-lite';
import { RouteProp, useIsFocused, useRoute } from '@react-navigation/native';
import { RegisterConfig } from '@owallet/hooks';
import { useNewMnemonicConfig } from './hook';
import { PageWithScrollView } from '../../../components/page';
import { CheckIcon, CopyFillIcon } from '../../../components/icon';
import { WordChip } from '../../../components/mnemonic';
import { CText as Text } from '../../../components/text';
import { Button } from '../../../components/button';
import Clipboard from 'expo-clipboard';
import { TextInput } from '../../../components/input';
import { Controller, useForm } from 'react-hook-form';
import { useSmartNavigation } from '../../../navigation.provider';
import { useSimpleTimer } from '../../../hooks';
import { BIP44AdvancedButton, useBIP44Option } from '../bip44';
import {
  navigate,
  checkRouter,
  checkRouterPaddingBottomBar,
} from '../../../router/root';
import { OWalletLogo } from '../owallet-logo';
import { colors, typography } from '../../../themes';

interface FormData {
  name: string;
  password: string;
  confirmPassword: string;
}

export const NewMnemonicScreen: FunctionComponent = observer(() => {
  const route = useRoute<
    RouteProp<
      Record<
        string,
        {
          registerConfig: RegisterConfig;
        }
      >,
      string
    >
  >();

  const smartNavigation = useSmartNavigation();

  const registerConfig: RegisterConfig = route.params.registerConfig;
  const bip44Option = useBIP44Option();

  const newMnemonicConfig = useNewMnemonicConfig(registerConfig);
  const [mode] = useState(registerConfig.mode);

  const words = newMnemonicConfig.mnemonic.split(' ');

  const {
    control,
    handleSubmit,
    setFocus,
    getValues,
    formState: { errors }
  } = useForm<FormData>();

  const submit = handleSubmit(() => {
    newMnemonicConfig.setName(getValues('name'));
    newMnemonicConfig.setPassword(getValues('password'));
    smartNavigation.navigateSmart('Register.VerifyMnemonic', {
      registerConfig,
      newMnemonicConfig,
      bip44HDPath: bip44Option.bip44HDPath
    });
  });

  return (
    <PageWithScrollView
      contentContainerStyle={{
        paddingLeft: 20,
        paddingRight: 20,
      }}
      backgroundColor={colors['white']}
    >
      {/* Mock for flexible margin top */}
      <View
        style={{
          height: 72,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text
          style={{
            fontSize: 24,
            lineHeight: 34,
            fontWeight: '700',
            color: colors['gray-900'],
          }}
        >
          Create new wallet
        </Text>
        <View>
          <OWalletLogo size={72} />
        </View>
      </View>
      <WordsCard words={words} />
      <Controller
        control={control}
        rules={{
          required: 'Name is required'
        }}
        render={({ field: { onChange, onBlur, value, ref } }) => {
          return (
            <TextInput
              label="Username"
              containerStyle={{
                paddingBottom: 6,
              }}
              inputStyle={{
                ...styles.borderInput,
              }}
              returnKeyType={mode === 'add' ? 'done' : 'next'}
              onSubmitEditing={() => {
                if (mode === 'add') {
                  submit();
                }
                if (mode === 'create') {
                  setFocus('password');
                }
              }}
              error={errors.name?.message}
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              ref={ref}
            />
          );
        }}
        name="name"
        defaultValue=""
      />
      <BIP44AdvancedButton bip44Option={bip44Option} />
      {mode === 'create' ? (
        <React.Fragment>
          <Controller
            control={control}
            rules={{
              required: 'Password is required',
              validate: (value: string) => {
                if (value.length < 8) {
                  return 'Password must be longer than 8 characters';
                }
              }
            }}
            render={({ field: { onChange, onBlur, value, ref } }) => {
              return (
                <TextInput
                  label="Password"
                  returnKeyType="next"
                  inputStyle={{
                    ...styles.borderInput,
                  }}
                  secureTextEntry={true}
                  onSubmitEditing={() => {
                    setFocus('confirmPassword');
                  }}
                  error={errors.password?.message}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  ref={ref}
                />
              );
            }}
            name="password"
            defaultValue=""
          />
          <Controller
            control={control}
            rules={{
              required: 'Confirm password is required',
              validate: (value: string) => {
                if (value.length < 8) {
                  return 'Password must be longer than 8 characters';
                }

                if (getValues('password') !== value) {
                  return "Password doesn't match";
                }
              }
            }}
            render={({ field: { onChange, onBlur, value, ref } }) => {
              return (
                <TextInput
                  label="Confirm password"
                  returnKeyType="done"
                  secureTextEntry={true}
                  onSubmitEditing={() => {
                    submit();
                  }}
                  inputStyle={{
                    ...styles.borderInput,
                  }}
                  error={errors.confirmPassword?.message}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  ref={ref}
                />
              );
            }}
            name="confirmPassword"
            defaultValue=""
          />
        </React.Fragment>
      ) : null}
      <View
        style={{
          flex: 1,
        }}
      />
      <TouchableOpacity
        onPress={submit}
        style={{
          marginBottom: 24,
          marginTop: 32,
          backgroundColor: '#8B1BFB',
          borderRadius: 8,
        }}
      >
        <View
          style={{
            padding: 18,
          }}
        >
          <Text
            style={{
              color: 'white',
              textAlign: 'center',
              fontWeight: '700',
              fontSize: 16,
            }}
          >
            Next
          </Text>
        </View>
      </TouchableOpacity>
      <View
        style={{
          paddingBottom: checkRouterPaddingBottomBar(
            props?.route?.name,
            'RegisterMain'
          ),
        }}
      >
        <Text
          style={{
            color: '#8B1BFB',
            textAlign: 'center',
            fontWeight: '700',
            fontSize: 16,
          }}
          onPress={() => {
            if (checkRouter(props?.route?.name, 'RegisterMain')) {
              smartNavigation.goBack();
            } else {
              smartNavigation.navigateSmart('Register.Intro', {});
            }
          }}
        >
          Go back
        </Text>
      </View>
      {/* Mock element for bottom padding */}
      <View
        style={{
          height: 20,
        }}
      />
    </PageWithScrollView>
  );
});

const WordsCard: FunctionComponent<{
  words: string[];
}> = ({ words }) => {
  const { isTimedOut, setTimer } = useSimpleTimer();

  /*
    On IOS, user can peek the words by right side gesture from the verifying mnemonic screen.
    To prevent this, hide the words if the screen lost the focus.
   */
  const [hideWord, setHideWord] = useState(false);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      setHideWord(false);
    } else {
      const timeout = setTimeout(() => {
        setHideWord(true);
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [isFocused]);

  return (
    <View
      style={{
        marginTop: 14,
        marginBottom: 16,
        paddingTop: 24,
        paddingLeft: 28,
        paddingRight: 28,
        borderColor: colors['purple-100'],
        borderWidth: 1,
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 1,
      }}
    >
      {words.map((word, i) => {
        return (
          <WordChip
            key={i.toString()}
            index={i + 1}
            word={word}
            hideWord={hideWord}
          />
        );
      })}
      <View
        style={{
          width: '100%',
          borderBottomWidth: 1,
          padding: 10,
          borderColor: colors['purple-50'],
        }}
      ></View>
      <View
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'flex-end',
          alignItems: 'center',
        }}
      >
        {!isTimedOut && <CopyFillIcon />}
        <Button
          textStyle={{
            ...typography['text-button2'],
            color: isTimedOut ? colors['success'] : colors['purple-900'],
          }}
          style={{
            backgroundColor: colors['white'],
          }}
          mode="text"
          {...(isTimedOut && {
            rightIcon: (
              <View style={{ paddingLeft: 10 }}>
                <CheckIcon />
              </View>
            )
          })}
          text="Copy to clipboard"
          onPress={() => {
            Clipboard.setString(words.join(' '));
            setTimer(3000);
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  borderInput: {
    borderColor: colors['purple-100'],
    borderWidth: 1,
    backgroundColor: colors['white'],
    paddingLeft: 11,
    paddingRight: 11,
    paddingTop: 12,
    paddingBottom: 12,
    borderRadius: 4,
  },
});
