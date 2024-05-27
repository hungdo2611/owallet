import React, { FunctionComponent, useEffect, useMemo, useState } from "react";
import { RegisterConfig } from "@owallet/hooks";
import { observer } from "mobx-react-lite";
import { FormattedMessage, useIntl } from "react-intl";
import {
  AdvancedBIP44Option,
  BIP44Option,
  useBIP44Option,
} from "../advanced-bip44";
import style from "../style.module.scss";
import { ButtonGroup, Form } from "reactstrap";
import { Input, PasswordInput, TextArea } from "../../../components/form";
import { BackButton } from "../index";
import { NewMnemonicConfig, useNewMnemonicConfig, NumWords } from "./hook";
import { useStore } from "../../../stores";
import { Button } from "../../../components/common/button";
import { Text } from "../../../components/common/text";
import { Card } from "../../../components/common/card";
import useForm from "react-hook-form";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const bip39 = require("bip39");

export const TypeNewMnemonic = "new-mnemonic";

interface FormData {
  name: string;
  words: string;
  password: string;
  confirmPassword: string;
}

export const NewMnemonicIntro: FunctionComponent<{
  registerConfig: RegisterConfig;
}> = observer(({ registerConfig }) => {
  const { analyticsStore } = useStore();

  return (
    <Button
      onClick={(e) => {
        e.preventDefault();

        registerConfig.setType(TypeNewMnemonic);
        analyticsStore.logEvent("Create account started", {
          registerType: "seed",
        });
      }}
      text={<FormattedMessage id="register.intro.button.new-account.title" />}
    />
  );
});

export const NewMnemonicPage: FunctionComponent<{
  registerConfig: RegisterConfig;
}> = observer(({ registerConfig }) => {
  const newMnemonicConfig = useNewMnemonicConfig(registerConfig);
  const bip44Option = useBIP44Option();

  return (
    <React.Fragment>
      {newMnemonicConfig.mode === "generate" ? (
        <GenerateMnemonicModePage
          registerConfig={registerConfig}
          newMnemonicConfig={newMnemonicConfig}
          bip44Option={bip44Option}
        />
      ) : null}
      {newMnemonicConfig.mode === "verify" ? (
        <VerifyMnemonicModePage
          registerConfig={registerConfig}
          newMnemonicConfig={newMnemonicConfig}
          bip44Option={bip44Option}
        />
      ) : null}
    </React.Fragment>
  );
});

export const GenerateMnemonicModePage: FunctionComponent<{
  registerConfig: RegisterConfig;
  newMnemonicConfig: NewMnemonicConfig;
  bip44Option: BIP44Option;
}> = observer(({ registerConfig, newMnemonicConfig, bip44Option }) => {
  const intl = useIntl();

  const { register, handleSubmit, getValues, errors, setValue } =
    useForm<FormData>({
      defaultValues: {
        name: newMnemonicConfig.name,
        words: newMnemonicConfig.mnemonic,
        password: "",
        confirmPassword: "",
      },
    });

  return (
    <div>
      <Card
        containerStyle={{
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <Text containerStyle={{ textAlign: "center" }} size={28} weight="700">
          Save your Recovery Phrase
        </Text>
        <Text
          containerStyle={{ textAlign: "center" }}
          weight="500"
          color="neutral-text-body"
        >
          Write down this recovery phrase in the exact order and keep it in a
          safe place
        </Text>
      </Card>
      <div className={style.titleGroup}>
        <span />

        <div style={{ float: "right" }}>
          <ButtonGroup size="sm" style={{ marginBottom: "4px" }}>
            <Button
              size="small"
              color={
                newMnemonicConfig.numWords !== NumWords.WORDS12
                  ? "secondary"
                  : "primary"
              }
              onClick={() => {
                newMnemonicConfig.setNumWords(NumWords.WORDS12);
              }}
              containerStyle={{ marginRight: 4 }}
            >
              <FormattedMessage id="register.create.toggle.word12" />
            </Button>
            <Button
              size="small"
              color={
                newMnemonicConfig.numWords !== NumWords.WORDS24
                  ? "secondary"
                  : "primary"
              }
              onClick={() => {
                newMnemonicConfig.setNumWords(NumWords.WORDS24);
              }}
            >
              <FormattedMessage id="register.create.toggle.word24" />
            </Button>
          </ButtonGroup>
        </div>
      </div>
      <Form
        className={style.formContainer}
        onSubmit={handleSubmit(async (data: FormData) => {
          newMnemonicConfig.setName(data.name);
          newMnemonicConfig.setPassword(data.password);
          newMnemonicConfig.setMode("verify");
        })}
      >
        <TextArea
          className={style.mnemonic}
          style={{
            color: "#7664e4",
          }}
          autoCapitalize="none"
          placeholder={intl.formatMessage({
            id: "register.create.textarea.mnemonic.place-holder",
          })}
          name="words"
          rows={newMnemonicConfig.numWords === NumWords.WORDS24 ? 5 : 3}
          readOnly={true}
          value={newMnemonicConfig.mnemonic}
          ref={register({
            required: "Mnemonic is required",
            validate: (value: string): string | undefined => {
              if (value.split(" ").length < 8) {
                return intl.formatMessage({
                  id: "register.create.textarea.mnemonic.error.too-short",
                });
              }

              if (!bip39.validateMnemonic(value)) {
                return intl.formatMessage({
                  id: "register.create.textarea.mnemonic.error.invalid",
                });
              }
            },
          })}
          error={errors.words && errors.words.message}
        />
        <Input
          label={intl.formatMessage({
            id: "register.name",
          })}
          leftIcon={
            <img
              src={require("../../../public/assets/icon/wallet.svg")}
              alt=""
            />
          }
          rightIcon={
            <img
              src={require("../../../public/assets/icon/circle-del.svg")}
              alt=""
            />
          }
          onAction={() => {
            setValue("name", "");
          }}
          styleInputGroup={{}}
          type="text"
          name="name"
          ref={register({
            required: intl.formatMessage({
              id: "register.name.error.required",
            }),
          })}
          error={errors.name && errors.name.message}
        />
        {registerConfig.mode === "create" ? (
          <React.Fragment>
            <PasswordInput
              placeHolder={intl.formatMessage({
                id: "register.create.input.password",
              })}
              styleInputGroup={{}}
              name="password"
              ref={register({
                required: intl.formatMessage({
                  id: "register.create.input.password.error.required",
                }),
                validate: (password: string): string | undefined => {
                  if (password.length < 8) {
                    return intl.formatMessage({
                      id: "register.create.input.password.error.too-short",
                    });
                  }
                },
              })}
              error={errors.password && errors.password.message}
            />
            <PasswordInput
              placeHolder={intl.formatMessage({
                id: "register.create.input.confirm-password",
              })}
              styleInputGroup={{}}
              name="confirmPassword"
              ref={register({
                required: intl.formatMessage({
                  id: "register.create.input.confirm-password.error.required",
                }),
                validate: (confirmPassword: string): string | undefined => {
                  if (confirmPassword !== getValues()["password"]) {
                    return intl.formatMessage({
                      id: "register.create.input.confirm-password.error.unmatched",
                    });
                  }
                },
              })}
              error={errors.confirmPassword && errors.confirmPassword.message}
            />
          </React.Fragment>
        ) : null}
        {/* <AdvancedBIP44Option bip44Option={bip44Option} /> */}
        <Button color="primary">
          <FormattedMessage id="register.create.button.next" />
        </Button>
      </Form>
      <BackButton
        onClick={() => {
          registerConfig.clear();
        }}
      />
    </div>
  );
});

export const VerifyMnemonicModePage: FunctionComponent<{
  registerConfig: RegisterConfig;
  newMnemonicConfig: NewMnemonicConfig;
  bip44Option: BIP44Option;
}> = observer(({ registerConfig, newMnemonicConfig, bip44Option }) => {
  const wordsSlice = useMemo(() => {
    const words = newMnemonicConfig.mnemonic.split(" ");
    for (let i = 0; i < words.length; i++) {
      words[i] = words[i].trim();
    }
    return words;
  }, [newMnemonicConfig.mnemonic]);

  const [randomizedWords, setRandomizedWords] = useState<string[]>([]);
  const [suggestedWords, setSuggestedWords] = useState<string[]>([]);

  useEffect(() => {
    // Set randomized words.
    const words = newMnemonicConfig.mnemonic.split(" ");
    for (let i = 0; i < words.length; i++) {
      words[i] = words[i].trim();
    }
    words.sort((word1, word2) => {
      // Sort alpahbetically.
      return word1 > word2 ? 1 : -1;
    });
    setRandomizedWords(words);
    // Clear suggested words.
    setSuggestedWords([]);
  }, [newMnemonicConfig.mnemonic]);

  const { analyticsStore } = useStore();

  return (
    <div>
      <div style={{ minHeight: "153px" }}>
        <div className={style.buttons}>
          {suggestedWords.map((word, i) => {
            return (
              <Button
                key={word + i.toString()}
                onClick={() => {
                  const word = suggestedWords[i];
                  setSuggestedWords(
                    suggestedWords
                      .slice(0, i)
                      .concat(suggestedWords.slice(i + 1))
                  );
                  randomizedWords.push(word);
                  setRandomizedWords(randomizedWords.slice());
                }}
              >
                {word}
              </Button>
            );
          })}
        </div>
      </div>
      <hr />
      <div style={{ minHeight: "153px" }}>
        <div className={style.buttons}>
          {randomizedWords.map((word, i) => {
            return (
              <Button
                key={word + i.toString()}
                onClick={() => {
                  const word = randomizedWords[i];
                  setRandomizedWords(
                    randomizedWords
                      .slice(0, i)
                      .concat(randomizedWords.slice(i + 1))
                  );
                  suggestedWords.push(word);
                  setSuggestedWords(suggestedWords.slice());
                }}
              >
                {word}
              </Button>
            );
          })}
        </div>
      </div>
      <Button
        color="primary"
        type="submit"
        disabled={suggestedWords.join(" ") !== wordsSlice.join(" ")}
        block
        style={{
          marginTop: "30px",
        }}
        onClick={async (e) => {
          e.preventDefault();

          try {
            await registerConfig.createMnemonic(
              newMnemonicConfig.name,
              newMnemonicConfig.mnemonic,
              newMnemonicConfig.password,
              bip44Option.bip44HDPath
            );
            analyticsStore.setUserProperties({
              registerType: "seed",
              accountType: "mnemonic",
            });
          } catch (e) {
            alert(e.message ? e.message : e.toString());
            registerConfig.clear();
          }
        }}
        data-loading={registerConfig.isLoading}
      >
        <FormattedMessage id="register.verify.button.register" />
      </Button>
      <BackButton
        onClick={() => {
          newMnemonicConfig.setMode("generate");
        }}
      />
    </div>
  );
});
