import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { useAppContext } from "../../src/AppContext";

export default function CustomButton({ children, style, fontStyle, onPress }) {
  const { colors } = useAppContext();

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        { backgroundColor: colors.card, borderColor: colors.border }, 
        style
      ]} 
      onPress={onPress}
    >
      <Text style={[styles.text, { color: colors.text }, fontStyle]}>{children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1
  },
  text: {
    fontWeight: "bold"
  }
});


