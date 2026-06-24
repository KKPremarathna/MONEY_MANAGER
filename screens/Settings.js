import { Text, View, Image, StyleSheet, Alert } from "react-native";
import MainTitle from "../components/MainTitle";
import CustomButton from "../components/ui/customButton";
import { useAppContext } from "../src/AppContext";

export default function Settings() {
  const { currency, setCurrency } = useAppContext();

  const handleCurrencyToggle = () => {
    const newCurrency = currency === 'LKR' ? 'USD' : 'LKR';
    setCurrency(newCurrency);
    Alert.alert("Currency Changed", `Default currency is now ${newCurrency}`);
  };

  const handleDummyPress = (feature) => {
    Alert.alert("Coming Soon", `The ${feature} feature is under development.`);
  };

  return (
    <View style={styles.rootContainer}>
      <MainTitle>SETTINGS</MainTitle>
      <View style={styles.ImageContainer}>
        <Image
          style={styles.image}
          resizeMode="cover"
          source={require("../assets/images/people.png")}
        />
      </View>
      <Text>Sign in</Text>
      <View style={styles.buttonContainer}>
        <CustomButton style={styles.button} fontStyle={styles.fontStyle} onPress={() => handleDummyPress('Profile')}>
          Profile
        </CustomButton>
        <CustomButton style={styles.button} fontStyle={styles.fontStyle} onPress={handleCurrencyToggle}>
          Currency: {currency}
        </CustomButton>
        <CustomButton style={styles.button} fontStyle={styles.fontStyle} onPress={() => handleDummyPress('Themes')}>
          Themes
        </CustomButton>
        <CustomButton style={styles.button} fontStyle={styles.fontStyle} onPress={() => handleDummyPress('Reminder')}>
          Reminder
        </CustomButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    alignItems: "center",
  },
  ImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    overflow: "hidden",
    marginTop: 20,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  buttonContainer: {
    flex: 1,
    alignItems: "stretch",
    marginTop: 50,
  },
  button: {
    paddingRight: 150,
    alignItems: "flex-start",
    marginVertical: 10,
    elevation: 4,
    borderWidth: 2,
  },
  fontStyle: {
    fontSize: 25,
  },
});
