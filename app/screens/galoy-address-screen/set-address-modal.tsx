import { gql } from "@apollo/client"
import { CustomIcon } from "@app/components/custom-icon"
import {
  AddressScreenDocument,
  useUserUpdateUsernameMutation,
} from "@app/graphql/generated"
import { useAppConfig } from "@app/hooks/use-app-config"
import { useI18nContext } from "@app/i18n/i18n-react"
import { RootStackParamList } from "@app/navigation/stack-param-lists"
import { palette } from "@app/theme"
import crashlytics from "@react-native-firebase/crashlytics"
import { useNavigation } from "@react-navigation/native"
import { StackNavigationProp } from "@react-navigation/stack"
import { Button, Input, Text } from "@rneui/base"
import { makeStyles } from "@rneui/themed"
import React from "react"
import { Modal, TouchableWithoutFeedback, View } from "react-native"

const useStyles = makeStyles(({ colors }) => ({
  modalView: {
    margin: 20,
    backgroundColor: colors.whiteOrDarkGrey,
    borderRadius: 20,
    padding: 25,
    shadowColor: colors.grey5,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "90%",

    alignItems: "center",
    marginTop: "auto",
    marginBottom: "auto",
  },
  buttonStyle: {
    backgroundColor: colors.primary,
    color: colors.white,
    marginTop: 32,
  },
  cancelTextContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  cancelText: {
    color: colors.primary,
    fontStyle: "normal",
    fontWeight: "600",
    fontSize: 18,
    lineHeight: 24,
    padding: 12,
  },
  errorStyle: {
    color: colors.error,
    marginTop: 16,
  },
  warningText: {
    fontStyle: "normal",
    fontWeight: "600",
    fontSize: 18,
    lineHeight: 24,
    color: colors.error,
  },
  titleText: {
    fontStyle: "normal",
    fontWeight: "600",
    fontSize: 18,
    lineHeight: 24,
    color: colors.black,
  },
  newAddressContainer: {
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 8,
    height: 50,
    marginTop: 16,
  },
  newAddressText: {
    fontStyle: "normal",
    fontWeight: "600",
    fontSize: 18,
    lineHeight: 24,
    color: colors.black,
  },
  backText: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  rightIconTextStyle: {
    fontSize: 18,
    color: colors.primary,
  },
  inputContainerStyle: {
    backgroundColor: colors.white,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    overflow: "hidden",
    borderColor: colors.grey8,
  },
  containerStyle: { paddingLeft: 0, paddingRight: 0 },
  fieldLabelStyle: {
    color: colors.black,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "600",
    marginBottom: 16,
  },
  inputTextStyle: {
    fontWeight: "600",
    color: colors.black,
    fontSize: 18,
  },
}))

type SetAddressModalProps = {
  modalVisible: boolean
  toggleModal: () => void
}

gql`
  mutation userUpdateUsername($input: UserUpdateUsernameInput!) {
    userUpdateUsername(input: $input) {
      errors {
        message
      }
      user {
        id
        username
      }
    }
  }
`

export const SetAddressModal = ({ modalVisible, toggleModal }: SetAddressModalProps) => {
  const styles = useStyles()
  const { LL } = useI18nContext()
  const { appConfig } = useAppConfig()
  const { name: bankName } = appConfig.galoyInstance
  const [address, setAddress] = React.useState("")
  const [error, setError] = React.useState("")
  const [newAddress, setNewAddress] = React.useState("")
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()

  const [updateUsername, { loading }] = useUserUpdateUsernameMutation({
    onError: (error) => {
      setError(LL.GaloyAddressScreen.somethingWentWrong())
      crashlytics().recordError(error)
    },
  })

  const handleSubmit = async () => {
    setError("")
    const { data } = await updateUsername({
      variables: {
        input: {
          username: address,
        },
      },
      refetchQueries: [AddressScreenDocument],
    })

    if ((data?.userUpdateUsername?.errors ?? []).length > 0) {
      if (data?.userUpdateUsername?.errors[0]?.message === "username not available") {
        setError(LL.GaloyAddressScreen.addressNotAvailable({ bankName }))
      } else {
        crashlytics().recordError(new Error(data?.userUpdateUsername?.errors[0].message))
        setError(LL.GaloyAddressScreen.somethingWentWrong())
      }
    } else if (data?.userUpdateUsername?.user?.username) {
      setNewAddress(data.userUpdateUsername.user.username)
    }
  }

  const handleOnChangeText = (value: string) => {
    setError("")
    setAddress(value)
  }

  const usernameSuffix = `@${appConfig.galoyInstance.lnAddressHostname}`

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={modalVisible}
      onRequestClose={() => {
        toggleModal()
      }}
    >
      <View style={styles.modalView}>
        {!newAddress && (
          <>
            <Input
              rightIcon={<Text style={styles.rightIconTextStyle}>{usernameSuffix}</Text>}
              inputContainerStyle={styles.inputContainerStyle}
              containerStyle={styles.containerStyle}
              onChangeText={handleOnChangeText}
              autoComplete={"off"}
              label={LL.GaloyAddressScreen.buttonTitle({ bankName })}
              labelStyle={styles.fieldLabelStyle}
              style={styles.inputTextStyle}
            />
            {!error && (
              <Text style={styles.warningText}>
                {LL.GaloyAddressScreen.notAbleToChange({ bankName })}
              </Text>
            )}
            {error && (
              <Text style={styles.errorStyle}>
                <CustomIcon name="custom-error-icon" color={palette.error} /> {error}
              </Text>
            )}
            <Button
              title={LL.GaloyAddressScreen.buttonTitle({ bankName })}
              buttonStyle={styles.buttonStyle}
              loading={loading}
              onPress={() => handleSubmit()}
              disabled={!address || Boolean(error)}
            />
            <View style={styles.cancelTextContainer}>
              <TouchableWithoutFeedback onPress={toggleModal}>
                <Text style={styles.cancelText}>{LL.common.cancel()}</Text>
              </TouchableWithoutFeedback>
            </View>
          </>
        )}
        {newAddress && (
          <View>
            <Text style={styles.titleText}>
              {LL.GaloyAddressScreen.yourAddress({ bankName })}
            </Text>
            <View style={styles.newAddressContainer}>
              <Text style={styles.newAddressText}>
                {newAddress}
                {usernameSuffix}
              </Text>
            </View>
            <Button
              title={LL.HomeScreen.title()}
              buttonStyle={styles.buttonStyle}
              onPress={navigation.popToTop}
            />
            <TouchableWithoutFeedback onPress={toggleModal}>
              <View style={styles.backText}>
                <Text style={styles.cancelText}>{LL.common.back()}</Text>
              </View>
            </TouchableWithoutFeedback>
          </View>
        )}
      </View>
    </Modal>
  )
}
