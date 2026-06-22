import { View, Text } from "react-native";
import SmallCard from "../components/ui/SmallCard";

export default function Income() {
  return (
    <SmallCard category={"Food"} imageSource={require("../assets/images/dinner.png")} money={200}/>
  );
}
