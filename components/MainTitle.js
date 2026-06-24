import { View, Text, StyleSheet } from "react-native";
import { useAppContext } from "../src/AppContext";

export default function MainTitle({ children }) {
  const { colors } = useAppContext();

  return (
    <View style={[styles.conatiner, { borderBottomColor: colors.border }]}>
      <Text style={[styles.font, { color: colors.text }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  conatiner: {
    marginVertical: 10,
    alignItems: "center",
  },
  font: {
    fontWeight: "bold",
    fontSize: 20,
  },
});

