import { Route, Routes } from "react-router";
import { Conversation } from "./Conversation";
import { Conversations } from "./Conversations";
import { NewConversation } from "./NewConversation";
import "./Main.css";

export const Main: React.FC = () => (
  <Routes>
    <Route index element={null} />
    <Route path="conversations" element={<Conversations />}>
      <Route index element={"Select a conversation"} />
      <Route path="new" element={<NewConversation />} />
      <Route path=":id" element={<Conversation id="new" />} />
    </Route>
  </Routes>
);
