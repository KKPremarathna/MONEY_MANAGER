import { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { useAppContext } from "../src/AppContext";
import TransactionList from "../components/TransactionList";

export default function Expenses() {
  const { setActiveTab } = useAppContext();

  useFocusEffect(
    useCallback(() => {
      setActiveTab("Expenses");
    }, [setActiveTab])
  );

  return <TransactionList type="expense" />;
}
