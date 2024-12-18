import { Route, Routes } from "react-router";
import { Conversations } from "./Conversations";
import { LoadConversation } from "./LoadConversation";
import { NewConversation } from "./NewConversation";
import "./Main.css";
import { MessageModal } from "./MessageModal";

export const Main: React.FC = () => (
  <Routes>
    <Route index element={null} />
    <Route path="conversations" element={<Conversations />}>
      <Route index element={"Select a conversation"} />
      <Route path="new" element={<NewConversation />} />
      <Route path=":id" element={<LoadConversation />}>
        <Route path="manage" element="Manage" />
        <Route path="message/:messageId" element={<MessageModal />} />
      </Route>
    </Route>
  </Routes>
);
