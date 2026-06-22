import { StyleSheet, Text, View } from "react-native";

export default function CustomButton({ children, style, fontStyle }) {
  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.text,fontStyle]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical:10,
    backgroundColor: "white",
    borderRadius:10,
    borderWidth:1
  },
  text:{
    fontWeight:"bold"
  }
});
