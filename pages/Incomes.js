import { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useAppContext } from "../src/AppContext";
import TransactionList from "../components/TransactionList";

export default function Income() {
  const { setActiveTab, setSelectedCategory } = useAppContext();

  useFocusEffect(
    useCallback(() => {
      setActiveTab("Income");
      setSelectedCategory(null);
    }, [setActiveTab, setSelectedCategory])
  );

  return <TransactionList type="income" />;
}
