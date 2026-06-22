import { View, Text, StyleSheet, Image } from "react-native";

export default function SmallCard({ category, imageSource, money }) {
  return (
    <View style={styles.container}>
      <View style={styles.leftGroup}>
        <Image source={imageSource} style={styles.image} />
        <Text>{category}</Text>
      </View>
      <Text>Rs.{money}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginHorizontal: 10,
    margin: 10,
    padding: 8,
    borderWidth: 2,
    borderRadius: 10,
    backgroundColor: "white",
    elevation: 4,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  leftGroup: {
    flexDirection: "row",
  },
  image: {
    height: 20,
    width: 20,
    justifyContent: "center",
    marginRight: 10,
  },
});
