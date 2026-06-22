import { Text, View, Image, StyleSheet } from "react-native";
import MainTitle from "../components/MainTitle";
import SmallCard from "../components/ui/SmallCard";
import CustomButton from "../components/ui/customButton";

export default function Settings() {
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
        <CustomButton style={styles.button} fontStyle={styles.fontStyle}>Profile</CustomButton>
        <CustomButton style={styles.button} fontStyle={styles.fontStyle}>Default Currency</CustomButton>
        <CustomButton style={styles.button} fontStyle={styles.fontStyle}>Themes</CustomButton>
        <CustomButton style={styles.button} fontStyle={styles.fontStyle}>Reminder</CustomButton>
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
  buttonContainer:{
    flex:1,
    alignItems:"stretch",
    marginTop:50
  },
  button:{
    paddingRight:150,
    alignItems:"flex-start",
    marginVertical:10,
    elevation:4,
    borderWidth:2
  },
  fontStyle:{
    fontSize:25
  }
});
