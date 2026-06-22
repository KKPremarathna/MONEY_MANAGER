import { View, Text, StyleSheet } from "react-native";

export default function MainTitle({ children }) {
  return (
    <View style={styles.conatiner}>
      <Text style={styles.font}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  conatiner: {
    marginVertical: 10,
    alignItems: "center",
    borderBottomColor: "black",
  },
  font: {
    fontWeight: "bold",
    fontSize: 20,
  },
});
