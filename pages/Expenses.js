import { Flatlist } from "react-native";
import SmallCard from "../components/ui/SmallCard";

export default function Expenses() {
  return (
    <SmallCard
      category={"Travel"}
      imageSource={require("../assets/images/plane.png")}
      money={5000}
    />
  );
}
