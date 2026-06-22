import {View, Text,StyleSheet} from 'react-native'

export default function BalanceContainer() {
  return (
    <View style={styles.totalBalanceContainer}>
      <View>
        <Text>Total Balance</Text>
      </View>
      <View>
        <Text>Rs.1000/=</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  totalBalanceContainer:{
    paddingVertical:30,
    paddingHorizontal:120,
    borderWidth:4,
    borderRadius:10,
    alignItems:"center",
    justifyContent:"center"
  }
});